'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Recording {
  url: string
  blob?: Blob
  id: string
}

interface RecordingsListProps {
  recordings: Recording[]
  onDelete: (recording: Recording) => void
}

export function RecordingsList({ recordings, onDelete }: RecordingsListProps) {
  if (recordings.length === 0) return null

  return (
    <div className="space-y-2">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="flex items-center gap-3 p-2 bg-muted rounded-lg"
        >
          <audio src={recording.url} controls className="flex-1 h-10" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(recording)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}