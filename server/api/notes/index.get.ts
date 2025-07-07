import { defineEventHandler, createError } from 'h3';
import { getDb, tables, sql, eq, desc, and } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  try {
    return await getDb()
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
