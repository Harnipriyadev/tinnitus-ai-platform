const { z } = require("zod");

const UNSAFE_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const safeText = (
  maximumLength,
  lengthMessage
) =>
  z
    .string()
    .trim()
    .max(
      maximumLength,
      lengthMessage
    )
    .refine(
      (value) =>
        !UNSAFE_CONTROL_CHARACTERS.test(
          value
        ),
      "Text contains unsupported characters"
    );

const consultationNotesSchema =
  z
    .object({
      chiefComplaint:
        safeText(
          1500,
          "Chief complaint is too long"
        )
          .optional()
          .default(""),

      clinicalFindings:
        safeText(
          4000,
          "Clinical findings are too long"
        )
          .optional()
          .default(""),

      clinicalImpression:
        safeText(
          2500,
          "Clinical impression is too long"
        )
          .optional()
          .default(""),

      carePlan:
        safeText(
          4000,
          "Care plan is too long"
        )
          .optional()
          .default(""),

      privateDoctorNotes:
        safeText(
          3000,
          "Private doctor notes are too long"
        )
          .optional()
          .default(""),
    })
    .strict()
    .superRefine(
      (
        data,
        context
      ) => {
        const hasContent =
          Object.values(
            data
          ).some(
            (value) =>
              typeof value ===
                "string" &&
              value.length > 0
          );

        if (!hasContent) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "chiefComplaint",
            ],

            message:
              "Enter at least one consultation note",
          });
        }
      }
    );

module.exports = {
  consultationNotesSchema,
};