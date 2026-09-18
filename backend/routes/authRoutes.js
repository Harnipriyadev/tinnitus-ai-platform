const express = require(
  "express"
);

const {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
} = require(
  "../controllers/authController"
);

const {
  completeMigration,
  migrateLogin,
} = require(
  "../controllers/migrationAuthController"
);

const {
  syncFirebaseProfile,
} = require(
  "../controllers/firebaseProfileController"
);

const {
  createRegistrationIntent,
} = require(
  "../controllers/registrationIntentController"
);

const protect = require(
  "../middleware/authMiddleware"
);

const {
  authLimiter,
  passwordResetLimiter,
} = require(
  "../middleware/securityMiddleware"
);

const {
  validateBody,
} = require(
  "../middleware/validate"
);

const {
  firebaseProfileSchema,
  firebaseTokenSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  registrationIntentSchema,
  resetPasswordSchema,
} = require(
  "../validators/authValidators"
);

const router =
  express.Router();

/*
 * Temporary legacy registration.
 * Remove after all clients use Firebase.
 */
router.post(
  "/register",
  authLimiter,
  validateBody(
    registerSchema
  ),
  registerUser
);

/*
 * Temporary legacy login.
 */
router.post(
  "/login",
  authLimiter,
  validateBody(
    loginSchema
  ),
  loginUser
);

/*
 * Temporary legacy Google route.
 */
router.post(
  "/google",
  authLimiter,
  validateBody(
    firebaseTokenSchema
  ),
  googleLogin
);

/*
 * Verifies an existing legacy password and
 * links the account with Firebase.
 */
router.post(
  "/migrate-login",
  authLimiter,
  validateBody(
    loginSchema
  ),
  migrateLogin
);

/*
 * Removes the legacy password hash after
 * successful Firebase authentication.
 */
router.post(
  "/complete-migration",
  protect,
  completeMigration
);

/*
 * Securely records whether a newly created
 * Firebase account registered as a patient,
 * caretaker or doctor applicant.
 *
 * Admin registration is not permitted.
 */
router.post(
  "/registration-intent",
  authLimiter,
  validateBody(
    registrationIntentSchema
  ),
  createRegistrationIntent
);

/*
 * Creates or synchronizes the MongoDB profile
 * after Firebase email verification.
 */
router.post(
  "/firebase-profile",
  authLimiter,
  validateBody(
    firebaseProfileSchema
  ),
  syncFirebaseProfile
);

/*
 * Returns the current authenticated profile.
 */
router.get(
  "/me",
  protect,
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        user: {
          _id:
            req.user._id,

          fullName:
            req.user
              .fullName,

          email:
            req.user.email,

          profilePicture:
            req.user
              .profilePicture,

          role:
            req.user.role,

          roleVerificationStatus:
            req.user
              .roleVerificationStatus,

          emailVerified:
            req.user
              .emailVerified,

          accountStatus:
            req.user
              .accountStatus,

          authProvider:
            req.user
              .authProvider,
        },
      });
  }
);

/*
 * Temporary legacy password-reset routes.
 * Firebase password reset will replace these.
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateBody(
    forgotPasswordSchema
  ),
  forgotPassword
);

router.put(
  "/reset-password/:token",
  passwordResetLimiter,
  validateBody(
    resetPasswordSchema
  ),
  resetPassword
);

module.exports =
  router;