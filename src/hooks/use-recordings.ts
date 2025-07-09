'use client'

import { useState, useEffect } from 'react'

interface Recording {
  url: string
  blob?: Blob
  id: string
}

export function useRecordings(audioUrls?: string[]) {
  const [recordings, setRecordings] = useState<Recording[]>([])

  useEffect(() => {
    if (audioUrls) {
      const initialRecordings = audioUrls.map(url => ({
        url,
        id: url
      }))
      setRecordings(initialRecordings)
    }
  }, [audioUrls])

  const cleanupResource = (recording: Recording) => {
    if (recording.blob) {
      URL.revokeObjectURL(recording.url)
    }
  }

  const addRecording = (recording: Recording) => {
    setRecordings(prev => [recording, ...prev])
  }

  const removeRecording = (recording: Recording) => {
    setRecordings(prev => prev.filter(r => r.id !== recording.id))
    cleanupResource(recording)
  }

  const resetRecordings = () => {
    recordings.forEach(cleanupResource)
    
    if (audioUrls) {
      const initialRecordings = audioUrls.map(url => ({
        url,
        id: url
      }))
      setRecordings(initialRecordings)
    } else {
      setRecordings([])
    }
  }

  return {
    recordings,
    addRecording,
    removeRecording,
    resetRecordings,
  }
}