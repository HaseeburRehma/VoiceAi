import { signUpSchema } from "#shared/schemas/auth.schema";
import { createError, defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import { getDb, tables, sql, eq, desc, and } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { name, username, password, email } = await readValidatedBody(
    event,
    signUpSchema.parse,
  );

  const hashedPassword = await hashPassword(password);

  try {
    const res = getDb()
      .insert(tables.users)
      .values({
        name,
        username,
        password: hashedPassword,
        email,
      })
      .returning({
        id: tables.users.id,
      })
      .get();

    await setUserSession(event, { user: { id: res.id, username, name, email } });
    return setResponseStatus(event, 201);
  } catch (error) {
    console.error("Error signing up:", error);

    if (
      error instanceof Error &&
      (error.message.includes("UNIQUE constraint failed") || 
       error.message.includes("D1_ERROR: UNIQUE constraint failed"))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Username unavailable. Please try a different one.",
        data: {
          issues: [
            {
              message: "Username unavailable. Please try a different one.",
              path: ["username"],
            },
          ],
        },
      });
    }

    throw createError({
      statusCode: 422,
      statusMessage:
        "Signup failed. Please check your information and try again.",
    });
  }
});
