const { z } = require("zod");

const UNSAFE_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const safeText = (maximumLength, lengthMessage) =>
  z
    .string()
    .trim()
    .max(maximumLength, lengthMessage)
    .refine(
      (value) => !UNSAFE_CONTROL_CHARACTERS.test(value),
      "Text contains unsupported characters"
    );

const requiredSafeText = (
  minimumMessage,
  maximumLength,
  maximumMessage
) =>
  safeText(maximumLength, maximumMessage).min(1, minimumMessage);

const medicationSchema = z
  .object({
    medicineName: requiredSafeText(
      "Enter the medicine name",
      120,
      "Medicine name is too long"
    ),

    strength: safeText(80, "Medicine strength is too long")
      .optional()
      .default(""),

    dosage: requiredSafeText(
      "Enter the dosage",
      120,
      "Dosage is too long"
    ),

    frequency: requiredSafeText(
      "Enter how often the medicine should be taken",
      120,
      "Frequency is too long"
    ),

    duration: requiredSafeText(
      "Enter the medicine duration",
      120,
      "Duration is too long"
    ),

    instructions: safeText(500, "Medicine instructions are too long")
      .optional()
      .default(""),
  })
  .strict();

const savePrescriptionSchema = z
  .object({
    medications: z
      .array(medicationSchema)
      .min(1, "Add at least one medicine")
      .max(20, "A prescription can contain a maximum of 20 medicines"),

    generalInstructions: safeText(
      2000,
      "General instructions are too long"
    )
      .optional()
      .default(""),
  })
  .strict();

module.exports = {
  savePrescriptionSchema,
};
