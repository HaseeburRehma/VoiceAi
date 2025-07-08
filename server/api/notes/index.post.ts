// src/server/api/notes/create.ts
import {
  defineEventHandler,
  createError,
  setResponseStatus,
  readBody,
} from 'h3'
import { noteSchema } from '#shared/schemas/note.schema'
import { sendNoteNotification } from '../../utils/mailer'
import { getDb, tables } from '../../utils/db'
import { eq } from 'drizzle-orm/d1'

export default defineEventHandler(async (event) => {
  // 1) Authenticate
  const { user } = await requireUserSession(event)

  // 2) Parse & validate payload
  const raw = await readBody(event)
  const body = noteSchema.parse(raw)

  try {
    // 3) Get DB client
    const db = await getDb()

    // 4) Load full user record for email
    const dbUser = await db
      .select({ email: tables.users.email })
      .from(tables.users)
      .where(eq(tables.users.id, user.id))
      .get()

    if (!dbUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not load user email',
      })
    }

    // 5) Insert note
    await db.insert(tables.notes).values({
      userId: user.id,
      text: body.text,
      audioUrls: body.audioUrls?.map((u) => `/audio/${u}`) ?? null,
      callerName: body.callerName,
      callerEmail: body.callerEmail,
      callerLocation: body.callerLocation,
      callerAddress: body.callerAddress,
      callReason: body.callReason,
    })

    // 6) Set HTTP 201 Created
    setResponseStatus(event, 201)

    // 7) Fire-and-forget email
    try {
      await sendNoteNotification({
        to: [dbUser.email, body.callerEmail],
        subject: `New Call Confirmation from ${user.name}`,
        html: `
          <h2>A new note has been created</h2>
          <p><strong>Author:</strong> ${user.name} (${dbUser.email})</p>
          <p><strong>Caller:</strong> ${body.callerName} (${body.callerEmail})</p>
          <p><strong>Location:</strong> ${body.callerLocation}</p>
          <p><strong>Address:</strong> ${body.callerAddress}</p>
          <p><strong>Reason:</strong> ${body.callReason}</p>
          <hr/>
          <pre>${body.text}</pre>
        `,
      })
    } catch (mailErr) {
      console.error('⚠️ Mailer failed (note still saved):', mailErr)
    }

    // 8) Return success payload
    return { success: true }
  } catch (err: any) {
    console.error('Error creating note:', err)
    // handle FK errors explicitly
    if (
      err instanceof Error &&
      err.message.includes('FOREIGN KEY constraint failed')
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Invalid user ID. Please ensure you are properly authenticated.',
      })
    }
    // fallback to generic 500
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not create note',
    })
  }
})
