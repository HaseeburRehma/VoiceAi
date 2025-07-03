// server/shared/schemas/note.schema.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { notes } from "~~/server/database/schema"

export const noteSchema = createInsertSchema(notes, {
  text: (schema) =>
    schema.text
      .min(3, "Note must be at least 3 characters long")
      .max(5000, "Note cannot exceed 5000 characters"),
  audioUrls: (schema) => z.string().array().optional(),

  // ── NEW FIELDS ─────────────────────────────────────────────
  callerName:     (schema) => schema.callerName.min(1, "Caller Name is required"),
  callerEmail:    (schema) => schema.callerEmail.email("Invalid caller email"),
  callerLocation: (schema) => schema.callerLocation.min(1, "Caller Location is required"),
  callerAddress:  (schema) => schema.callerAddress.min(1, "Caller Address is required"),
  callReason:     (schema) => schema.callReason.min(1, "Reason for Call is required"),
}).pick({
  text: true,
  audioUrls: true,
  callerName: true,
  callerEmail: true,
  callerLocation: true,
  callerAddress: true,
  callReason: true,
})

// for GET/listing
export const noteSelectSchema = createSelectSchema(notes, {
  audioUrls: z.string().array().optional(),
  callerName: z.string(),
  callerEmail: z.string(),
  callerLocation: z.string(),
  callerAddress: z.string(),
  callReason: z.string(),
})

// for PATCH: allow any of them to be optional
export const notePatchSchema = noteSchema.pick({
  text: true,
  audioUrls: true,
  callerName: true,
  callerEmail: true,
  callerLocation: true,
  callerAddress: true,
  callReason: true,
}).extend({
  text: z.string().min(3).optional(),
  audioUrls: z.string().array().optional(),
  callerName: z.string().optional(),
  callerEmail: z.string().email().optional(),
  callerLocation: z.string().optional(),
  callerAddress: z.string().optional(),
  callReason: z.string().optional(),
})
