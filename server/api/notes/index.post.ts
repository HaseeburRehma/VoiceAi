import { defineEventHandler, createError, setResponseStatus, readBody } from 'h3';
import { noteSchema } from '#shared/schemas/note.schema';
import { sendNoteNotification } from '../../utils/mailer';

export default defineEventHandler(async (event) => {
  // 1) Auth
  const { user } = await requireUserSession(event);

  // 2) Load full user record so we get email
  const dbUser = getDb()
    .select({ email: tables.users.email })
    .from(tables.users)
    .where(eq(tables.users.id, user.id))
    .get();

  if (!dbUser) {
    throw createError({ statusCode: 500, statusMessage: 'Could not load user email' });
  }

  // 3) Parse and validate request payload
  const raw  = await readBody(event);
  const body = noteSchema.parse(raw);

  try {
    // 4) Insert note into database
    await localDb.insert(tables.notes).values({
      userId:        user.id,
      text:          body.text,
      audioUrls:     body.audioUrls?.map(u => `/audio/${u}`) ?? null,
      callerName:    body.callerName,
      callerEmail:   body.callerEmail,
      callerLocation: body.callerLocation,
      callerAddress: body.callerAddress,
      callReason:    body.callReason,
    });
    setResponseStatus(event, 201);

    // 5) Fire-and-forget email to both logged-in user and caller
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
      });
    } catch (mailErr) {
      console.error('⚠️ Mailer failed (note still saved):', mailErr);
    }

    // 6) Return success
    return { success: true };

  } catch (err: any) {
    console.error('Error creating note:', err);

    // Handle FK constraint errors gracefully
    if (err instanceof Error && err.message.includes('FOREIGN KEY constraint failed')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID. Please ensure you are properly authenticated.',
      });
    }

    // All others bubble up as a 500
    throw createError({ statusCode: 500, statusMessage: 'Could not create note' });
  }
});
