const {
  z,
} = require("zod");

const currentYear =
  new Date().getFullYear();

const requiredText = (
  fieldName,
  maximumLength
) =>
  z
    .string()
    .trim()
    .min(
      2,
      `${fieldName} is required`
    )
    .max(
      maximumLength,
      `${fieldName} is too long`
    );

const doctorApplicationSchema =
  z
    .object({
      medicalCouncil:
        requiredText(
          "Medical Council",
          150
        ),

      registrationNumber:
        requiredText(
          "Registration number",
          100
        ),

      registrationYear:
        z
          .number({
            message:
              "Registration year must be a number",
          })
          .int(
            "Registration year must be a whole number"
          )
          .min(
            1900,
            "Enter a valid registration year"
          )
          .max(
            currentYear,
            "Registration year cannot be in the future"
          ),

      qualification:
        requiredText(
          "Qualification",
          200
        ),

      specialization:
        requiredText(
          "Specialization",
          120
        ),

      experienceYears:
        z
          .number({
            message:
              "Experience must be a number",
          })
          .int(
            "Experience must be a whole number"
          )
          .min(
            0,
            "Experience cannot be negative"
          )
          .max(
            80,
            "Enter valid years of experience"
          ),

      consultationLanguages:
        z
          .array(
            z
              .string()
              .trim()
              .min(
                2,
                "Enter a valid language"
              )
              .max(
                50,
                "Language name is too long"
              )
          )
          .min(
            1,
            "Select at least one consultation language"
          )
          .max(
            10,
            "Select no more than 10 languages"
          ),

      hospitalOrClinic:
        z
          .string()
          .trim()
          .max(
            200,
            "Hospital or clinic name is too long"
          )
          .optional()
          .default(""),

      professionalBio:
        z
          .string()
          .trim()
          .max(
            1500,
            "Professional bio is too long"
          )
          .optional()
          .default(""),
    })
    .strict();

const submitDoctorApplicationSchema =
  z
    .object({})
    .strict();

const reviewDoctorApplicationSchema =
  z
    .object({
      decision:
        z.enum([
          "verified",
          "rejected",
        ]),

      rejectionReason:
        z
          .string()
          .trim()
          .max(
            1000,
            "Rejection reason is too long"
          )
          .optional()
          .default(""),

      officialRegisterChecked:
        z.boolean(),
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
          !data.rejectionReason
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "rejectionReason",
            ],

            message:
              "A rejection reason is required",
          });
        }

        if (
          data.decision ===
            "verified" &&
          !data
            .officialRegisterChecked
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "officialRegisterChecked",
            ],

            message:
              "The official medical register must be checked before approval",
          });
        }
      }
    );

module.exports = {
  doctorApplicationSchema,
  reviewDoctorApplicationSchema,
  submitDoctorApplicationSchema,
};