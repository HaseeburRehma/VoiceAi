<template>
  <UModal
    fullscreen
    :close="{ disabled: isSaving || recorderBusy }"
    :prevent-close="isSaving || recorderBusy"
    :title="isEditing ? 'Edit Note' : 'Create Note'"
    :ui="{
      body: 'flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden',
    }"
  >
    <template #body>
      <div class="md:flex gap-6">
        <!-- Left: transcript + recorder -->
        <div class="flex-1 space-y-4">
          <TranscriptDisplay :transcript="noteText" />

          <NoteRecorder
            ref="recorder"
            class="md:h-full md:flex md:flex-col md:w-200 shrink-0 order-first md:order-none"
            :audio-urls="note?.audioUrls"
            @transcription="handleTranscription"
          />
        </div>

        <!-- Right: auto-filled form -->
        <div class="md:w-1/3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-900 rounded-lg">
            <UFormField name="callerName" label="Caller Name" required>
              <UInput v-model="callerName" placeholder="John Doe" />
            </UFormField>

            <UFormField name="callerEmail" label="Caller Email" required>
              <UInput
                v-model="callerEmail"
                placeholder="john@example.com"
                type="email"
              />
            </UFormField>

            <UFormField name="callerLocation" label="Caller Location" required>
              <UInput v-model="callerLocation" placeholder="New York, NY" />
            </UFormField>

            <UFormField name="callerAddress" label="Caller Address" required>
              <UInput
                v-model="callerAddress"
                placeholder="123 Main St, Apt 4B"
              />
            </UFormField>

            <UFormField name="callReason" label="Reason for Call" required>
              <UTextarea
                v-model="callReason"
                placeholder="Project kick-off"
              />
            </UFormField>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        icon="i-lucide-undo-2"
        color="neutral"
        variant="outline"
        :disabled="isSaving"
        @click="resetNote"
      >
        Reset
      </UButton>

      <UButton
        icon="i-lucide-cloud-upload"
        :disabled="!noteText.trim() || recorderBusy || isSaving"
        :loading="isSaving"
        @click="saveNote"
      >
        {{ isEditing ? "Save Changes" : "Save Note" }}
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NoteRecorder, TranscriptDisplay } from "#components";
import type { Note } from "./../../shared/schemas/note.schema";

const props = defineProps<{
  isEditing?: boolean;
  note?: Note;
  onEdit?: () => void;
}>();

// Form fields — initialize from props.note when editing
const callerName     = ref(props.note?.callerName   ?? "");
const callerEmail    = ref(props.note?.callerEmail  ?? "");
const callerLocation = ref(props.note?.callerLocation?? "");
const callerAddress  = ref(props.note?.callerAddress ?? "");
const callReason     = ref(props.note?.callReason    ?? "");

// Transcription text
const noteText = ref(props.note?.text ?? "");

// Grab the recorder component
type RecorderType = InstanceType<typeof NoteRecorder>;
const recorder = useTemplateRef<RecorderType>("recorder")!;

// A safe boolean for template binds
const recorderBusy = computed(() => recorder.value?.isBusy ?? false);

// Reset everything
const resetNote = () => {
 // reset text and form fields back to the original note values
 noteText.value     = props.note?.text           ?? "";
 callerName.value   = props.note?.callerName     ?? "";
 callerEmail.value  = props.note?.callerEmail    ?? "";
 callerLocation.value = props.note?.callerLocation?? "";
 callerAddress.value  = props.note?.callerAddress ?? "";
 callReason.value     = props.note?.callReason    ?? "";
  recorder.value?.resetRecordings();
};

/**  
 * Extract simple “my name is X” etc.  
 * We default each capture to empty string so TS can’t complain.  
 */
function extractFields(text: string) {
  for (const line of text.split(/\r?\n/)) {
    // Name
    const nameMatch = line.match(/(?:Hi|Hello|Good (?:Morning|Afternoon|Evening))\s+([A-Za-z]+)/i);
    if (nameMatch) {
      const capture = nameMatch[1] || "";
      callerName.value = capture.trim();
    }

    // Email
    const emailMatch = line.match(/(?:my email is|confirm (?:my )?email(?: address)?|email)[:\s]*([^\s]+)/i);
    if (emailMatch) {
      const capture = emailMatch[1] || "";
      callerEmail.value = capture.trim();
    }

    // Location
    const locMatch = line.match(/(?:my location is|I'm in|I am in|I live in)\s+(.+)/i)

    if (locMatch) {
      const capture = locMatch[1] || "";
      callerLocation.value = capture.trim();
    }

    // Address
    const addrMatch = line.match(/my address is\s+(.+)/i);
    if (addrMatch) {
      const capture = addrMatch[1] || "";
      callerAddress.value = capture.trim();
    }

    // Reason
    const reasonMatch = line.match(/(?:reason for call(?: is)?|I need help with)[:\s]*([\s\S]+)/i)

    if (reasonMatch) {
      const capture = reasonMatch[1] || "";
      callReason.value = capture.trim();
    }
  }
}

// Called on each transcription chunk
const handleTranscription = (text: string) => {
  noteText.value += noteText.value ? `\n\n${text}` : text;
  extractFields(text);
};

// Save logic
const isSaving = ref(false);
const saveNote = async () => {
  const text = noteText.value.trim();
  if (!text) return;

  isSaving.value = true;
  const audioUrls = await recorder.value?.uploadRecordings() ?? [];

  try {
    if (props.note) {
      // PATCH existing
      await $fetch(`/api/notes/${props.note.id}`, {
        method: "PATCH",
        body: {
          text,
          audioUrls,
          callerName: callerName.value,
          callerEmail: callerEmail.value,
          callerLocation: callerLocation.value,
          callerAddress: callerAddress.value,
          callReason: callReason.value,
        },
      });
    } else {
      // POST new
      await $fetch("/api/notes", {
        method: "POST",
        body: {
          text,
          audioUrls,
          callerName: callerName.value,
          callerEmail: callerEmail.value,
          callerLocation: callerLocation.value,
          callerAddress: callerAddress.value,
          callReason: callReason.value,
        },
      });
    }

    useToast().add({
      title: props.note ? "Note Updated" : "Note Saved",
      description: "Your note was saved successfully and Email has been send",
      color: "success",
    });
    recorder.value?.resetRecordings();
    if (props.onEdit) props.onEdit();
  } catch (err) {
    console.error("Error saving note:", err);
    useToast().add({
      title: "Save Failed",
      description: "Failed to save the note.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};
</script>
