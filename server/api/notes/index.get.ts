import { defineEventHandler, createError } from 'h3';
import { localDb, tables, eq, desc } from '../../utils/localDb';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  try {
    return await localDb
      .select()
      .from(tables.notes)
      .where(eq(tables.notes.userId, user.id))
      .orderBy(desc(tables.notes.updatedAt))
      .all();
  } catch (err) {
    console.error('Error fetching notes:', err);
    throw createError({ statusCode: 500, statusMessage: 'Could not fetch notes' });
  }
});
