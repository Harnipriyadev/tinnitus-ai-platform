const {
  z,
} = require("zod");

const OBJECT_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const objectId = (
  fieldName
) =>
  z
    .string()
    .trim()
    .regex(
      OBJECT_ID_PATTERN,
      `${fieldName} is invalid`
    );

const optionalMeetingLink =
  z
    .string()
    .trim()
    .max(
      500,
      "Meeting link is too long"
    )
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          const url =
            new URL(value);

          return (
            url.protocol ===
            "https:"
          );
        } catch {
          return false;
        }
      },
      "Enter a valid HTTPS meeting link"
    )
    .optional()
    .default("");

const bookAppointmentSchema =
  z
    .object({
      availabilityId:
        objectId(
          "Availability identifier"
        ),

      slotId:
        objectId(
          "Time-slot identifier"
        ),

      consultationType:
        z
          .enum([
            "video",
            "audio",
            "chat",
            "in_person",
          ])
          .optional()
          .default(
            "video"
          ),

      patientMessage:
        z
          .string()
          .trim()
          .max(
            1000,
            "Patient message is too long"
          )
          .optional()
          .default(""),

      assessmentSharingConsent:
        z
          .boolean()
          .optional()
          .default(false),

      sharedAssessmentId:
        objectId(
          "Assessment identifier"
        )
          .optional()
          .nullable(),
    })
    .strict()
    .superRefine(
      (
        data,
        context
      ) => {
        if (
          data.sharedAssessmentId &&
          !data
            .assessmentSharingConsent
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "assessmentSharingConsent",
            ],

            message:
              "Patient consent is required before sharing an assessment",
          });
        }
      }
    );

const doctorAppointmentResponseSchema =
  z
    .object({
      decision:
        z.enum([
          "confirmed",
          "rejected",
        ]),

      doctorResponse:
        z
          .string()
          .trim()
          .max(
            1000,
            "Doctor response is too long"
          )
          .optional()
          .default(""),

      meetingProvider:
        z
          .enum([
            "google_meet",
            "zoom",
            "microsoft_teams",
            "other",
            "",
          ])
          .optional()
          .default(""),

      meetingLink:
        optionalMeetingLink,

      meetingInstructions:
        z
          .string()
          .trim()
          .max(
            1000,
            "Meeting instructions are too long"
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
        if (
          data.decision ===
            "rejected" &&
          !data.doctorResponse
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "doctorResponse",
            ],

            message:
              "A rejection reason is required",
          });
        }

        if (
          data.decision ===
            "confirmed" &&
          data.meetingLink &&
          !data.meetingProvider
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "meetingProvider",
            ],

            message:
              "Select the meeting provider",
          });
        }

        if (
          data.decision ===
            "confirmed" &&
          data.meetingProvider &&
          !data.meetingLink
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "meetingLink",
            ],

            message:
              "Enter the meeting link",
          });
        }

        if (
          data.decision ===
          "rejected"
        ) {
          if (
            data.meetingProvider ||
            data.meetingLink ||
            data.meetingInstructions
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "meetingLink",
              ],

              message:
                "Meeting details cannot be added to a rejected appointment",
            });
          }
        }
      }
    );

const cancelAppointmentSchema =
  z
    .object({
      cancellationReason:
        z
          .string()
          .trim()
          .max(
            1000,
            "Cancellation reason is too long"
          )
          .optional()
          .default(""),
    })
    .strict();

module.exports = {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  doctorAppointmentResponseSchema,
};