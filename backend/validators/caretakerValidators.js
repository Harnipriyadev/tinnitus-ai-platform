const {
  z,
} = require("zod");

const OBJECT_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const inviteCaretakerSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .toLowerCase()
          .email(
            "Enter a valid caretaker email address"
          )
          .max(
            254,
            "Email address is too long"
          ),

      permissions:
        z
          .object({
            viewAssessments:
              z
                .boolean()
                .optional()
                .default(false),

            viewAppointments:
              z
                .boolean()
                .optional()
                .default(false),
          })
          .strict()
          .optional()
          .default({
            viewAssessments:
              false,

            viewAppointments:
              false,
          }),
    })
    .strict();

const respondToInvitationSchema =
  z
    .object({
      decision:
        z.enum([
          "accepted",
          "rejected",
        ]),
    })
    .strict();

const updateCaretakerPermissionsSchema =
  z
    .object({
      viewAssessments:
        z.boolean(),

      viewAppointments:
        z.boolean(),
    })
    .strict();

const connectionIdSchema =
  z
    .object({
      id:
        z
          .string()
          .trim()
          .regex(
            OBJECT_ID_PATTERN,
            "Connection identifier is invalid"
          ),
    })
    .strict();

module.exports = {
  connectionIdSchema,
  inviteCaretakerSchema,
  respondToInvitationSchema,
  updateCaretakerPermissionsSchema,
};