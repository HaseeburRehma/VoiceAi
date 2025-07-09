'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AudioVisualizer } from './audio-visualizer'
import { RecordingsList } from './recordings-list'
import { useMediaRecorder } from '@/hooks/use-media-recorder'
import { useRecordings } from '@/hooks/use-recordings'

interface NoteRecorderProps {
  audioUrls?: string[]
  onTranscription: (text: string) => void
}

export const NoteRecorder = forwardRef<any, NoteRecorderProps>(({ audioUrls, onTranscription }, ref) => {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribingMessage, setTranscribingMessage] = useState('Transcribing...')
  const { toast } = useToast()
  
  const { state, startRecording, stopRecording } = useMediaRecorder()
  const { recordings, addRecording, removeRecording, resetRecordings } = useRecordings(audioUrls)

  const handleRecordingStart = async () => {
    try {
      await startRecording()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const handleRecordingStop = async () => {
    try {
      const blob = await stopRecording()
      if (blob) {
        await transcribeAudio(blob)
      }
    } catch (err) {
      console.error('Error stopping recording:', err)
      toast({
        title: 'Error',
        description: 'Failed to record audio. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    setTranscribingMessage('Transcribing...')

    try {
      const formData = new FormData()
      formData.append('audio', blob)

      const response = await fetch('/api/server/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.text) {
          onTranscription(data.text)
          addRecording({
            url: URL.createObjectURL(blob),
            blob,
            id: `${Date.now()}`,
          })
        }
      } else {
        throw new Error('Transcription failed')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      toast({
        title: 'Error',
        description: 'Failed to transcribe audio. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const uploadRecordings = async () => {
    if (!recordings.length) return []

    const formData = new FormData()
    let recordingsToUpload = 0

    recordings.forEach((recording) => {
      if (recording.blob) {
        formData.append('files', recording.blob, `${recording.id}.webm`)
        recordingsToUpload++
      }
    })

    if (!recordingsToUpload) {
      return recordings.filter(r => !r.blob).map(r => r.url)
    }

    try {
      const response = await fetch('/api/server/upload', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const uploadedFiles = await response.json()
        return uploadedFiles.map((file: any) => file.pathname)
      }
    } catch (error) {
      console.error('Failed to upload audio recordings', error)
    }

    return []
  }

  const toggleRecording = () => {
    if (state.isRecording) {
      handleRecordingStop()
    } else {
      handleRecordingStart()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useImperativeHandle(ref, () => ({
    uploadRecordings,
    resetRecordings,
    isBusy: state.isRecording || isTranscribing
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recordings</CardTitle>
          <div className="flex items-center gap-2">
            {state.isRecording && (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm">{formatDuration(state.recordingDuration)}</span>
              </>
            )}
            <Button
              onClick={toggleRecording}
              disabled={isTranscribing}
              variant={state.isRecording ? 'destructive' : 'default'}
              size="sm"
            >
              {state.isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.isRecording && (
          <AudioVisualizer 
            audioData={state.audioData} 
            dataUpdateTrigger={state.updateTrigger} 
          />
        )}

        {isTranscribing && (
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{transcribingMessage}</span>
          </div>
        )}

        <RecordingsList recordings={recordings} onDelete={removeRecording} />

        {!recordings.length && !state.isRecording && !isTranscribing && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recordings yet!</p>
            <p className="text-sm mt-1">Tap the mic icon to create one.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

NoteRecorder.displayName = 'NoteRecorder'