import { defineEventHandler, createError, getRouterParam } from "h3";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id parameter' })

  const db = await getDb()
  const note = db
    .select()
    .from(tables.notes)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .get()
  if (!note) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

  // delete blobs
  if (note.audioUrls?.length) {
    await hubBlob().del(note.audioUrls.map(u => u.replace('/audio/', '')))
  }

  await db
    .delete(tables.notes)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .run()

  return { success: true }
})