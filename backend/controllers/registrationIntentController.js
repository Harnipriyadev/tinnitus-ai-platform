const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const PUBLIC_ROLES = [
  "patient",
  "caretaker",
  "doctor",
];

const createRegistrationIntent =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        idToken,
        fullName,
        requestedRole,
      } = req.body;

      /*
       * Never trust the frontend role value
       * without checking it on the backend.
       */
      if (
        !PUBLIC_ROLES.includes(
          requestedRole
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Select a valid account type",
          });
      }

      /*
       * Verify the Firebase account.
       *
       * Email verification is not required here
       * because this endpoint runs immediately
       * after Firebase registration.
       */
      const decodedToken =
        await admin
          .auth()
          .verifyIdToken(
            idToken,
            true
          );

      const {
        uid,
        email,
        firebase,
      } = decodedToken;

      if (!uid) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Firebase account identifier is missing",
          });
      }

      if (!email) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Firebase account does not contain an email address",
          });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /*
       * Look for an account already connected
       * to this Firebase UID.
       */
      let user =
        await User.findOne({
          firebaseUid:
            uid,
        }).select(
          "+firebaseUid"
        );

      if (user) {
        /*
         * Registration intent is idempotent.
         * Repeating the request must never allow
         * an existing user to change their role.
         */
        if (
          user.email !==
          normalizedEmail
        ) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Firebase account information does not match the existing profile",
            });
        }

        return res
          .status(200)
          .json({
            success: true,
            message:
              "Registration details are already recorded",

            user: {
              _id:
                user._id,

              fullName:
                user.fullName,

              email:
                user.email,

              role:
                user.role,

              roleVerificationStatus:
                user
                  .roleVerificationStatus,

              emailVerified:
                user
                  .emailVerified,
            },
          });
      }

      /*
       * Prevent one email address from being
       * connected to multiple Firebase accounts.
       */
      const existingEmailUser =
        await User.findOne({
          email:
            normalizedEmail,
        }).select(
          "+firebaseUid"
        );

      if (
        existingEmailUser
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "An account already exists with this email address",
          });
      }

      const provider =
        firebase
          ?.sign_in_provider ===
        "google.com"
          ? "google"
          : "firebase";

      /*
       * Doctors are created as pending.
       * They receive no verified-doctor
       * privileges until admin approval.
       */
      const roleVerificationStatus =
        requestedRole ===
        "doctor"
          ? "pending"
          : "not_required";

      user = await User.create({
        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        firebaseUid:
          uid,

        authProvider:
          provider,

        role:
          requestedRole,

        roleVerificationStatus,

        roleVerificationUpdatedAt:
          requestedRole ===
          "doctor"
            ? new Date()
            : undefined,

        accountStatus:
          "active",

        emailVerified:
          decodedToken
            .email_verified ===
          true,

        profilePicture:
          decodedToken.picture ||
          "",
      });

      return res
        .status(201)
        .json({
          success: true,

          message:
            requestedRole ===
            "doctor"
              ? "Doctor application account created. Verification is required before consultation access."
              : "Registration details recorded successfully",

          user: {
            _id:
              user._id,

            fullName:
              user.fullName,

            email:
              user.email,

            role:
              user.role,

            roleVerificationStatus:
              user
                .roleVerificationStatus,

            emailVerified:
              user
                .emailVerified,
          },
        });
    } catch (error) {
      if (
        error.code ===
          "auth/id-token-expired" ||
        error.code ===
          "auth/id-token-revoked" ||
        error.code ===
          "auth/argument-error" ||
        error.code ===
          "app/invalid-credential"
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Firebase registration token is invalid or expired",
          });
      }

      if (
        error.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This email or Firebase account is already registered",
          });
      }

      return next(error);
    }
  };

module.exports = {
  createRegistrationIntent,
};