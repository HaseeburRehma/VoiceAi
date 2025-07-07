import { defineEventHandler, createError, getRouterParam } from "h3";
import { z } from "zod";
import { getDb, tables, sql, eq, desc, and } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id parameter" });
  }

  // fetch to delete blobs
  const note = getdb()
    .select()
    .from(tables.notes)
    .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)))
    .get();

  if (!note) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  if (note.audioUrls?.length) {
    await hubBlob().del(note.audioUrls.map((u) => u.replace("/audio/", "")));
  }

  try {
    const result = getDb()
      .delete(tables.notes)
      .where(and(eq(tables.notes.id, id), eq(tables.notes.userId, user.id)));

    if (!result.success) {
      throw new Error("Delete failed");
    }
    return { success: true };
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, statusMessage: "Could not delete note" });
  }
});
