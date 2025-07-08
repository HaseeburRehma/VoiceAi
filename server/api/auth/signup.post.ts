import { signUpSchema } from "#shared/schemas/auth.schema";
import { createError, defineEventHandler, readValidatedBody, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  // Validate input
  const { name, username, password, email } = await readValidatedBody(
    event,
    signUpSchema.parse
  )

  const hashed = await hashPassword(password)
  const db = await getDb()

  try {
    const { id } = db
      .insert(tables.users)
      .values({ name, username, password: hashed, email })
      .returning({ id: tables.users.id })
      .get()

    await setUserSession(event, {
      user: { id, username, name, email }
    })

    setResponseStatus(event, 201)
    return { message: 'Signup successful' }

  } catch (err: any) {
    // Unique constraint failure
    if (err.message.includes('UNIQUE constraint failed')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username or email already in use'
      })
    }
    throw createError({ statusCode: 500, statusMessage: 'Signup failed' })
  }
})