import { defineEventHandler, createError, readBody, getRouterParam } from 'h3';
import { z } from 'zod';
import { notePatchSchema } from '#shared/schemas/note.schema';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id parameter" });
  }

  const rawBody = await readBody(event);
  const updates = notePatchSchema.parse(rawBody);

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' });
  }

  const existing = getDb()
    .select()
    .from(tables.notes)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .get();

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' });
  }

  // remove blobs for any dropped URLs
  if (updates.audioUrls) {
    const toDelete = (existing.audioUrls || []).filter((u) => !updates.audioUrls!.includes(u));
    if (toDelete.length) {
      await hubBlob().del(toDelete.map((u) => u.replace('/audio/', '')));
    }
  }

  try {
    const result = getDb()
      .update(tables.notes)
      .set(updates as any)
      .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)));


    console.log('rows updated:', result);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Note not found or no changes detected',
      });
    }
  
    return { success: true };
  } catch (err) {
    console.error('Error updating note:', err);
    throw createError({ statusCode: 500, statusMessage: 'Could not update note' });
  }
});

function returningAll() {
  throw new Error('Function not implemented.');
}
