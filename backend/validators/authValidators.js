const {
  z,
} = require("zod");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email(
    "Enter a valid email address"
  )
  .max(
    254,
    "Email address is too long"
  );

const loginPassword = z
  .string()
  .min(
    1,
    "Password is required"
  )
  .max(
    128,
    "Password is too long"
  );

const strongPassword = z
  .string()
  .min(
    12,
    "Password must contain at least 12 characters"
  )
  .max(
    128,
    "Password is too long"
  )
  .regex(
    /[a-z]/,
    "Password must contain a lowercase letter"
  )
  .regex(
    /[A-Z]/,
    "Password must contain an uppercase letter"
  )
  .regex(
    /\d/,
    "Password must contain a number"
  )
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain a special character"
  );

const fullName = z
  .string()
  .trim()
  .min(
    2,
    "Full name must contain at least 2 characters"
  )
  .max(
    80,
    "Full name is too long"
  );

const firebaseIdToken = z
  .string()
  .trim()
  .min(
    100,
    "Firebase token is invalid"
  )
  .max(
    10000,
    "Firebase token is too large"
  );

/*
 * Public registration can request only
 * these account types.
 *
 * Admin is deliberately excluded.
 */
const requestedRole = z.enum(
  [
    "patient",
    "caretaker",
    "doctor",
  ],
  {
    message:
      "Select a valid account type",
  }
);

const loginSchema = z
  .object({
    email,
    password:
      loginPassword,
  })
  .strict();

const registerSchema = z
  .object({
    fullName,
    email,
    password:
      strongPassword,
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

const resetPasswordSchema = z
  .object({
    password:
      strongPassword,

    confirmPassword: z
      .string()
      .min(
        1,
        "Password confirmation is required"
      )
      .max(
        128,
        "Password confirmation is too long"
      ),
  })
  .strict()
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Passwords do not match",

      path: [
        "confirmPassword",
      ],
    }
  );

const firebaseTokenSchema = z
  .object({
    idToken:
      firebaseIdToken,
  })
  .strict();

const firebaseProfileSchema = z
  .object({
    idToken:
      firebaseIdToken,

    fullName:
      fullName.optional(),
  })
  .strict();

/*
 * Records the selected account type immediately
 * after Firebase creates the account.
 *
 * The backend will verify idToken before storing it.
 */
const registrationIntentSchema =
  z
    .object({
      idToken:
        firebaseIdToken,

      fullName,

      requestedRole,
    })
    .strict();

module.exports = {
  firebaseProfileSchema,
  firebaseTokenSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  registrationIntentSchema,
  resetPasswordSchema,
};