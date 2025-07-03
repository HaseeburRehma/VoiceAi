<template>
  <UCard :ui="{
    body: 'max-h-36 md:max-h-none md:flex-1 overflow-y-auto',
  }">
    <template #header>
      <h3 class="font-medium text-gray-600 dark:text-gray-300">Recordings</h3>

      <div class="flex items-center gap-x-2">
        <template v-if="state.isRecording">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span class="mr-2 text-sm">
            {{ formatDuration(state.recordingDuration) }}
          </span>
        </template>

        <UButton :icon="state.isRecording ? 'i-lucide-circle-stop' : 'i-lucide-mic'"
          :color="state.isRecording ? 'error' : 'primary'" :loading="isTranscribing" :disabled="isRateLimited"
          @click="toggleRecording" />

        <!-- Rate limit indicator -->
        <template v-if="rateLimitRetryAfter > 0">
          <div class="text-xs text-orange-600 dark:text-orange-400">
            Retry in {{ rateLimitRetryAfter }}s
          </div>
        </template>
      </div>
    </template>

    <AudioVisualizer v-if="state.isRecording" class="w-full h-14 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2"
      :audio-data="state.audioData" :data-update-trigger="state.updateTrigger" />

    <div v-else-if="isTranscribing"
      class="flex items-center justify-center h-14 gap-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2 text-gray-500 dark:text-gray-400">
      <UIcon name="i-lucide-refresh-cw" size="size-6" class="animate-spin" />
      <span>{{ transcribingMessage }}</span>
    </div>

    <RecordingsList :recordings="recordings" @delete="removeRecording" />

    <div v-if="!recordings.length && !state.isRecording && !isTranscribing"
      class="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
      <p>No recordings...!</p>
      <p class="text-sm mt-1">Tap the mic icon to create one.</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{ audioUrls?: string[] | null }>();
const emit = defineEmits<{ transcription: [text: string] }>();

const { state, startRecording, stopRecording } = useMediaRecorder();
const toggleRecording = () => {
  if (state.value.isRecording) {
    handleRecordingStop();
  } else {
    handleRecordingStart();
  }
};

const handleRecordingStart = async () => {
  try {
    await startRecording();
  } catch (err) {
    console.error("Error accessing microphone:", err);
    useToast().add({
      title: "Error",
      description: "Could not access microphone. Please check permissions.",
      color: "error",
    });
  }
};

const { recordings, addRecording, removeRecording, resetRecordings } =
  useRecordings(props.audioUrls);

const handleRecordingStop = async () => {
  let blob: Blob | undefined;

  try {
    blob = await stopRecording();
  } catch (err) {
    console.error("Error stopping recording:", err);
    useToast().add({
      title: "Error",
      description: "Failed to record audio. Please try again.",
      color: "error",
    });
  }

  if (blob) {
    try {
      const transcription = await transcribeAudio(blob);

      if (transcription) {
        emit("transcription", transcription);

        addRecording({
          url: URL.createObjectURL(blob),
          blob,
          id: `${Date.now()}`,
        });
      }
    } catch (err) {
      console.error("Error transcribing audio:", err);

      // Don't show error toast for rate limits as we handle it differently
      if (!isRateLimitError(err)) {
        useToast().add({
          title: "Error",
          description: "Failed to transcribe audio. Please try again.",
          color: "error",
        });
      }
    }
  }
};

// Rate limiting state
const isTranscribing = ref(false);
const rateLimitRetryAfter = ref(0);
const retryAttempts = ref(0);
const maxRetryAttempts = 3;
const transcribingMessage = ref("Transcribing...");

const isRateLimited = computed(() => rateLimitRetryAfter.value > 0);

// Helper to check if error is rate limit
const isRateLimitError = (error: any) => {
  return error?.status === 429 || error?.statusCode === 429;
};

// Countdown timer for rate limit
const startRateLimitCountdown = (seconds: number) => {
  rateLimitRetryAfter.value = seconds;
  const interval = setInterval(() => {
    rateLimitRetryAfter.value--;
    if (rateLimitRetryAfter.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
};

const { settings } = useSettings();

const transcribeAudio = async (blob: Blob): Promise<string | null> => {
  try {
    isTranscribing.value = true;
    transcribingMessage.value = retryAttempts.value > 0
      ? `Transcribing... (attempt ${retryAttempts.value + 1})`
      : "Transcribing...";

    const formData = new FormData();
    formData.append("audio", blob);

    const { postProcessing } = settings.value;
    if (postProcessing.enabled && postProcessing.prompt) {
      formData.append("prompt", postProcessing.prompt);
    }

    const result = await $fetch("/api/transcribe", {
      method: "POST",
      body: formData,
      timeout: 120_000    // match server’s timeout

    });

    // Reset retry attempts on success
    retryAttempts.value = 0;
    return result;

  } catch (error: any) {
    console.error("Transcription error:", error);

    if (isRateLimitError(error)) {
      // Extract retry-after header or use default
      const retryAfter = error.response?.headers?.['retry-after'] || 120;
      const retrySeconds = parseInt(retryAfter.toString(), 10);

      if (retryAttempts.value < maxRetryAttempts) {
        retryAttempts.value++;

        useToast().add({
          title: "Rate Limited",
          description: `Too many requests. Retrying in ${retrySeconds} seconds...`,
          color: "warning",
        });

        startRateLimitCountdown(retrySeconds);

        // Auto-retry after the countdown
        setTimeout(async () => {
          if (retryAttempts.value <= maxRetryAttempts) {
            try {
              const result = await transcribeAudio(blob);
              if (result) {
                emit("transcription", result);
                addRecording({
                  url: URL.createObjectURL(blob),
                  blob,
                  id: `${Date.now()}`,
                });
              }
            } catch (retryError) {
              console.error("Retry failed:", retryError);
            }
          }
        }, retrySeconds * 1000);

        return null;
      } else {
        // Max retries reached
        retryAttempts.value = 0;
        useToast().add({
          title: "Transcription Failed",
          description: "Maximum retry attempts reached. Please try again later.",
          color: "error",
        });
        return null;
      }
    }

    // For non-rate-limit errors, throw to be handled by caller
    throw error;
  } finally {
    isTranscribing.value = false;
    transcribingMessage.value = "Transcribing...";
  }
};

const uploadRecordings = async () => {
  if (!recordings.value.length) return;

  let recordingsToUpload = 0;
  const finalPathnames: string[] = [];

  const formData = new FormData();
  recordings.value.forEach((recording) => {
    if (recording.blob) {
      formData.append(
        "files",
        recording.blob,
        `${recording.id}.${recording.blob.type.split("/")[1]}`,
      );
      recordingsToUpload++;
    } else {
      finalPathnames.push(recording.url);
    }
  });

  if (!recordingsToUpload) {
    return finalPathnames;
  }

  try {
    const result = await $fetch("/api/upload", {
      method: "PUT",
      body: formData,
    });

    const uploadedObjs = result.map((obj) => obj.pathname);
    finalPathnames.push(...uploadedObjs);
  } catch (error) {
    console.error("Failed to upload audio recordings", error);
  }

  return finalPathnames;
};

const isBusy = computed(() => state.value.isRecording || isTranscribing.value);

defineExpose({ uploadRecordings, resetRecordings, isBusy });

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
</script>