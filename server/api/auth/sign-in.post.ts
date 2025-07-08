import { signInSchema } from "#shared/schemas/auth.schema";
import { createError, defineEventHandler, readValidatedBody } from "h3";

const invalidCredentialsError = createError({
  statusCode: 401,
  statusMessage: "Invalid username or password.",
});

export default defineEventHandler(async (event) => {
  // Validate input
  const { username, password } = await readValidatedBody(
    event,
    signInSchema.parse
  )

  const db = await getDb()
  const user = db
    .select()
    .from(tables.users)
    .where(eq(tables.users.username, username))
    .get()

  if (!user || !(await verifyPassword(user.password, password))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password'
    })
  }

  await setUserSession(event, {
    user: { id: user.id, username: user.username, name: user.name }
  })

  return { status: 200, message: 'Sign in successful' }
})