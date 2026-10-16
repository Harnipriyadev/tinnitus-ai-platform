const {
  z,
} = require(
  "zod"
);

const OBJECT_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const UNSAFE_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/i,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

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

const isPrivateHostname = (
  hostname
) =>
  PRIVATE_HOST_PATTERNS.some(
    (pattern) =>
      pattern.test(
        hostname
      )
  );

const isValidProviderHost = (
  provider,
  hostname
) => {
  const normalizedHostname =
    hostname.toLowerCase();

  switch (
    provider
  ) {
    case "google_meet":
      return (
        normalizedHostname ===
        "meet.google.com"
      );

    case "zoom":
      return (
        normalizedHostname ===
          "zoom.us" ||
        normalizedHostname.endsWith(
          ".zoom.us"
        )
      );

    case "microsoft_teams":
      return [
        "teams.microsoft.com",
        "teams.live.com",
      ].includes(
        normalizedHostname
      );

    case "other":
      return true;

    default:
      return false;
  }
};

const parseMeetingUrl = (
  value
) => {
  if (!value) {
    return null;
  }

  try {
    const url =
      new URL(
        value
      );

    if (
      url.protocol !==
        "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      isPrivateHostname(
        url.hostname
      )
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

const optionalMeetingLink =
  safeText(
    500,
    "Meeting link is too long"
  )
    .refine(
      (value) =>
        !value ||
        Boolean(
          parseMeetingUrl(
            value
          )
        ),
      "Enter a valid public HTTPS meeting link"
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
        safeText(
          1000,
          "Patient message is too long"
        )
          .optional()
          .default(""),

      assessmentSharingConsent:
        z
          .boolean()
          .optional()
          .default(
            false
          ),

      sharedAssessmentId:
        objectId(
          "Assessment identifier"
        )
          .optional()
          .nullable()
          .default(
            null
          ),
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

        if (
          data
            .assessmentSharingConsent &&
          !data
            .sharedAssessmentId
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "sharedAssessmentId",
            ],

            message:
              "Select an assessment to share",
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
        safeText(
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
        safeText(
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
          !data
            .doctorResponse
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
          !data
            .meetingProvider
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
          !data
            .meetingLink
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
          "confirmed"
        ) {
          const meetingUrl =
            parseMeetingUrl(
              data.meetingLink
            );

          if (
            data.meetingProvider &&
            meetingUrl &&
            !isValidProviderHost(
              data.meetingProvider,
              meetingUrl.hostname
            )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "meetingLink",
              ],

              message:
                "The meeting link does not match the selected provider",
            });
          }
        }

        if (
          data.decision ===
            "rejected" &&
          (
            data.meetingProvider ||
            data.meetingLink ||
            data.meetingInstructions
          )
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
    );

const cancelAppointmentSchema =
  z
    .object({
      cancellationReason:
        safeText(
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