import { defineEventHandler, createError, readBody, getRouterParam } from 'h3';
import { z } from 'zod';
import { notePatchSchema } from '#shared/schemas/note.schema';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id parameter' })

  const updates = notePatchSchema.parse(await readBody(event))
  const db = await getDb()

  const existing = db
    .select()
    .from(tables.notes)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .get()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

  // delete removed blobs
  if (updates.audioUrls) {
    const toDelete = existing.audioUrls?.filter(u => !updates.audioUrls!.includes(u)) || []
    if (toDelete.length) {
      await hubBlob().del(toDelete.map(u => u.replace('/audio/', '')))
    }
  }

  const result = db
    .update(tables.notes)
    .set(updates as any)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .run()

  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No changes applied' })
  }

  return { success: true }
})