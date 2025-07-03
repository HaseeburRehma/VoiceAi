import { ref, readonly, onUnmounted } from 'vue'

/**
 * State for the media recorder composable
 */
export interface MediaRecorderState {
  isRecording: boolean
  recordingDuration: number
  audioData: Uint8Array | null
  updateTrigger: number
}

/**
 * Pick a mime type that the browser supports for audio recording
 */
const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a',
    'audio/mp4',
    'audio/mpeg',
  ]
  return types.find(type => MediaRecorder.isTypeSupported(type)) ?? 'audio/webm'
}

/**
 * Composable for recording microphone + system (tab/speaker) audio and visualizing it
 */
export function useMediaRecorder() {
  const state = ref<MediaRecorderState>({
    isRecording: false,
    recordingDuration: 0,
    audioData: null,
    updateTrigger: 0,
  })

  let mediaRecorder: MediaRecorder | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrame: number | null = null
  let destination: MediaStreamAudioDestinationNode | null = null
  let audioChunks: Blob[] = []

  const updateAudioData = () => {
    if (!analyser || !state.value.isRecording || !state.value.audioData) {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      return
    }
    analyser.getByteTimeDomainData(state.value.audioData)
    state.value.updateTrigger++
    animationFrame = requestAnimationFrame(updateAudioData)
  }

  const startRecording = async () => {
    try {
      // 1️⃣ capture system (speaker/tab) audio via displayMedia
      let sysStream: MediaStream | null = null
      try {
        sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        sysStream.getVideoTracks().forEach(t => t.stop())
      } catch (err) {
        console.warn('System audio capture unavailable or denied.', err)
      }

      // 2️⃣ capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })

      // 3️⃣ create AudioContext and merge streams
      audioContext = new AudioContext()
      destination = audioContext.createMediaStreamDestination()
      analyser = audioContext.createAnalyser()

      const inputSources: MediaStreamAudioSourceNode[] = []
      // mic source
      const micSource = audioContext.createMediaStreamSource(micStream)
      micSource.connect(destination)
      micSource.connect(analyser)
      inputSources.push(micSource)

      // system source if available
      if (sysStream) {
        const sysSource = audioContext.createMediaStreamSource(sysStream)
        sysSource.connect(destination)
        sysSource.connect(analyser)
        inputSources.push(sysSource)
      }

      // 4️⃣ setup MediaRecorder on the mixed stream
      const options = { mimeType: getSupportedMimeType(), audioBitsPerSecond: 64_000 }
      mediaRecorder = new MediaRecorder(destination.stream, options)
      audioChunks = []

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        audioChunks.push(e.data)
        state.value.recordingDuration++
      }

      // 5️⃣ initialize state and start
      state.value.audioData = new Uint8Array(analyser.frequencyBinCount)
      state.value.isRecording = true
      state.value.recordingDuration = 0
      state.value.updateTrigger = 0

      mediaRecorder.start(1000)
      updateAudioData()
    } catch (err) {
      console.error('Error starting recording:', err)
      throw err
    }
  }

  const stopRecording = async (): Promise<Blob> => {
    return new Promise(resolve => {
      if (mediaRecorder && state.value.isRecording) {
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: mediaRecorder!.mimeType })
          audioChunks = []
          state.value.isRecording = false
          state.value.recordingDuration = 0
          state.value.updateTrigger = 0
          state.value.audioData = null
          resolve(blob)
        }
        mediaRecorder.stop()
        // stop all tracks in destination stream
        destination?.stream.getTracks().forEach(t => t.stop())
        if (animationFrame) cancelAnimationFrame(animationFrame)
        audioContext?.close()
      }
    })
  }

  onUnmounted(() => {
    if (state.value.isRecording) {
      stopRecording().catch(() => {})
    }
  })

  return {
    state: readonly(state),
    startRecording,
    stopRecording,
  }
}
