'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { NoteRecorder } from './note-recorder'
import { TranscriptDisplay } from './transcript-display'
import { Save, RotateCcw } from 'lucide-react'

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  createdAt: string
  updatedAt: string
}

interface NoteEditorModalProps {
  note?: Note | null
  onClose: () => void
  onSave: () => void
}

export function NoteEditorModal({ note, onClose, onSave }: NoteEditorModalProps) {
  const [formData, setFormData] = useState({
    callerName: note?.callerName || '',
    callerEmail: note?.callerEmail || '',
    callerLocation: note?.callerLocation || '',
    callerAddress: note?.callerAddress || '',
    callReason: note?.callReason || '',
  })
  const [noteText, setNoteText] = useState(note?.text || '')
  const [isSaving, setIsSaving] = useState(false)
  const recorderRef = useRef<any>(null)
  const { toast } = useToast()

  const extractFields = (text: string) => {
    const lines = text.split(/\r?\n/)
    
    for (const line of lines) {
      // Name
      const nameMatch = line.match(/(?:Hi|Hello|Good (?:Morning|Afternoon|Evening))\s+([A-Za-z]+)/i)
      if (nameMatch && nameMatch[1]) {
        setFormData(prev => ({ ...prev, callerName: nameMatch[1].trim() }))
      }

      // Email
      const emailMatch = line.match(/(?:my email is|confirm (?:my )?email(?: address)?|email)[:\s]*([^\s]+)/i)
      if (emailMatch && emailMatch[1]) {
        setFormData(prev => ({ ...prev, callerEmail: emailMatch[1].trim() }))
      }

      // Location
      const locMatch = line.match(/(?:my location is|I'm in|I am in|I live in)\s+(.+)/i)
      if (locMatch && locMatch[1]) {
        setFormData(prev => ({ ...prev, callerLocation: locMatch[1].trim() }))
      }

      // Address
      const addrMatch = line.match(/my address is\s+(.+)/i)
      if (addrMatch && addrMatch[1]) {
        setFormData(prev => ({ ...prev, callerAddress: addrMatch[1].trim() }))
      }

      // Reason
      const reasonMatch = line.match(/(?:reason for call(?: is)?|I need help with)[:\s]*([\s\S]+)/i)
      if (reasonMatch && reasonMatch[1]) {
        setFormData(prev => ({ ...prev, callReason: reasonMatch[1].trim() }))
      }
    }
  }

  const handleTranscription = (text: string) => {
    setNoteText(prev => prev ? `${prev}\n\n${text}` : text)
    extractFields(text)
  }

  const resetNote = () => {
    setNoteText(note?.text || '')
    setFormData({
      callerName: note?.callerName || '',
      callerEmail: note?.callerEmail || '',
      callerLocation: note?.callerLocation || '',
      callerAddress: note?.callerAddress || '',
      callReason: note?.callReason || '',
    })
    recorderRef.current?.resetRecordings()
  }

  const handleSave = async () => {
    if (!noteText.trim()) return

    setIsSaving(true)
    
    try {
      const audioUrls = await recorderRef.current?.uploadRecordings() || []
      
      const payload = {
        text: noteText,
        audioUrls,
        ...formData
      }

      const url = note ? `/api/server/notes/${note.id}` : '/api/server/notes'
      const method = note ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: note ? 'Note Updated' : 'Note Saved',
          description: 'Your note was saved successfully and email has been sent',
        })
        recorderRef.current?.resetRecordings()
        onSave()
        onClose()
      } else {
        throw new Error('Failed to save note')
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save the note.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left: Transcript + Recorder */}
          <div className="flex-1 space-y-4">
            <TranscriptDisplay transcript={noteText} />
            <NoteRecorder
              ref={recorderRef}
              audioUrls={note?.audioUrls}
              onTranscription={handleTranscription}
            />
          </div>

          {/* Right: Form */}
          <div className="w-1/3 space-y-4">
            <div className="grid grid-cols-1 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="callerName">Caller Name *</Label>
                <Input
                  id="callerName"
                  value={formData.callerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="callerEmail">Caller Email *</Label>
                <Input
                  id="callerEmail"
                  type="email"
                  value={formData.callerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerEmail: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="callerLocation">Caller Location *</Label>
                <Input
                  id="callerLocation"
                  value={formData.callerLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerLocation: e.target.value }))}
                  placeholder="New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="callerAddress">Caller Address *</Label>
                <Input
                  id="callerAddress"
                  value={formData.callerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerAddress: e.target.value }))}
                  placeholder="123 Main St, Apt 4B"
                />
              </div>

              <div>
                <Label htmlFor="callReason">Reason for Call *</Label>
                <Textarea
                  id="callReason"
                  value={formData.callReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, callReason: e.target.value }))}
                  placeholder="Project kick-off"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetNote} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!noteText.trim() || isSaving}
            loading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {note ? 'Save Changes' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}