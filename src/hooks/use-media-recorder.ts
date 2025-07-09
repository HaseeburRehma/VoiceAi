'use client'

import { useState, useRef, useCallback } from 'react'

interface MediaRecorderState {
  isRecording: boolean
  recordingDuration: number
  audioData: Uint8Array | null
  updateTrigger: number
}

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

export function useMediaRecorder() {
  const [state, setState] = useState<MediaRecorderState>({
    isRecording: false,
    recordingDuration: 0,
    audioData: null,
    updateTrigger: 0,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updateAudioData = useCallback(() => {
    if (!analyserRef.current || !state.isRecording || !state.audioData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    analyserRef.current.getByteTimeDomainData(state.audioData)
    setState(prev => ({ ...prev, updateTrigger: prev.updateTrigger + 1 }))
    animationFrameRef.current = requestAnimationFrame(updateAudioData)
  }, [state.isRecording, state.audioData])

  const startRecording = useCallback(async () => {
    try {
      // Capture system audio (optional)
      let sysStream: MediaStream | null = null
      try {
        sysStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        })
        sysStream.getVideoTracks().forEach(track => track.stop())
      } catch (err) {
        console.warn('System audio capture unavailable or denied.', err)
      }

      // Capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })

      // Create AudioContext and merge streams
      audioContextRef.current = new AudioContext()
      destinationRef.current = audioContextRef.current.createMediaStreamDestination()
      analyserRef.current = audioContextRef.current.createAnalyser()

      // Connect microphone
      const micSource = audioContextRef.current.createMediaStreamSource(micStream)
      micSource.connect(destinationRef.current)
      micSource.connect(analyserRef.current)

      // Connect system audio if available
      if (sysStream) {
        const sysSource = audioContextRef.current.createMediaStreamSource(sysStream)
        sysSource.connect(destinationRef.current)
        sysSource.connect(analyserRef.current)
      }

      // Setup MediaRecorder
      const options = { 
        mimeType: getSupportedMimeType(), 
        audioBitsPerSecond: 64_000 
      }
      mediaRecorderRef.current = new MediaRecorder(destinationRef.current.stream, options)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
        audioChunksRef.current.push(e.data)
      }

      // Initialize state
      const audioData = new Uint8Array(analyserRef.current.frequencyBinCount)
      setState({
        isRecording: true,
        recordingDuration: 0,
        audioData,
        updateTrigger: 0,
      })

      // Start recording and timer
      mediaRecorderRef.current.start(1000)
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, recordingDuration: prev.recordingDuration + 1 }))
      }, 1000)

      updateAudioData()
    } catch (err) {
      console.error('Error starting recording:', err)
      throw err
    }
  }, [updateAudioData])

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current!.mimeType 
          })
          audioChunksRef.current = []
          
          setState({
            isRecording: false,
            recordingDuration: 0,
            updateTrigger: 0,
            audioData: null,
          })
          
          resolve(blob)
        }

        mediaRecorderRef.current.stop()
        
        // Stop all tracks
        destinationRef.current?.stream.getTracks().forEach(track => track.stop())
        
        // Clear timer and animation frame
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        
        // Close audio context
        audioContextRef.current?.close()
      }
    })
  }, [state.isRecording])

  return {
    state,
    startRecording,
    stopRecording,
  }
}