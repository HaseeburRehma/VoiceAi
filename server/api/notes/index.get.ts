// src/server/api/notes/get.ts
import { defineEventHandler, createError } from 'h3'
import { getDb, tables } from '../../utils/db'
import { eq, desc } from 'drizzle-orm/d1'
import { requireUserSession } from 'h3-auth-utils'

export default defineEventHandler(async (event) => {
  // 1) Authenticate
  const { user } = await requireUserSession(event)

  try {
    // 2) Get DB client
    const db = await getDb()

    // 3) Fetch notes for this user
    const notes = await db
      .select()
      .from(tables.notes)
      .where(eq(tables.notes.userId, user.id))
      .orderBy(desc(tables.notes.updatedAt))
      .all()

    return notes
  } catch (err) {
    console.error('Error fetching notes:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not fetch notes',
    })
  }
})
