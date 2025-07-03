import { signInSchema } from "#shared/schemas/auth.schema";
import { localDb, tables, eq } from "../../utils/localDb";
import { createError, defineEventHandler, readValidatedBody } from "h3";

const invalidCredentialsError = createError({
  statusCode: 401,
  statusMessage: "Invalid username or password.",
});

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(
    event,
    signInSchema.parse,
  );

  const dbUser = await localDb
    .select()
    .from(tables.users)
    .where(eq(tables.users.username, username))
    .get();

  if (!dbUser) {
    throw invalidCredentialsError;
  }

  if (!(await verifyPassword(dbUser.password, password))) {
    throw invalidCredentialsError;
  }

  await setUserSession(event, {
    user: { id: dbUser.id, username, name: dbUser.name },
  });

  return {
    status: 200,
    message: "Sign in successful",
  };
});
