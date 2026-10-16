const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const PUBLIC_ROLES =
  Object.freeze([
    "patient",
    "caretaker",
    "doctor",
  ]);

const setNoStoreHeaders = (
  res
) => {
  res.set({
    "Cache-Control":
      "no-store, max-age=0",

    Pragma: "no-cache",
  });
};

const createRegistrationIntent =
  async (
    req,
    res,
    next
  ) => {
    setNoStoreHeaders(res);

    try {
      const {
        idToken,
        fullName,
        requestedRole,
      } = req.body;

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

      const normalizedName =
        fullName
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (
        normalizedName.length <
          2 ||
        normalizedName.length >
          80
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Full name must contain between 2 and 80 characters",
          });
      }

      /*
       * Verify token signature, project,
       * expiry and revocation status.
       *
       * Email verification is intentionally
       * not required because this runs directly
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

      if (
        typeof uid !==
          "string" ||
        !uid.trim() ||
        uid.length > 128
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Firebase account identifier is invalid",
          });
      }

      if (
        typeof email !==
          "string" ||
        !email.trim()
      ) {
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

      if (
        normalizedEmail.length >
        254
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Firebase email address is invalid",
          });
      }

      /*
       * Registration intent is idempotent.
       * Repeating it cannot change an existing
       * user's role.
       */
      let user =
        await User.findOne({
          firebaseUid:
            uid,
        }).select(
          "+firebaseUid"
        );

      if (user) {
        if (
          user.email
            .trim()
            .toLowerCase() !==
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

        if (
          user.accountStatus !==
          "active"
        ) {
          return res
            .status(403)
            .json({
              success: false,

              message:
                "User account is disabled",
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
       * Never attach a second Firebase UID to
       * an existing email through registration.
       *
       * Legacy users must use migrate-login.
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

      const signInProvider =
        firebase
          ?.sign_in_provider;

      const provider =
        signInProvider ===
        "google.com"
          ? "google"
          : "firebase";

      /*
       * Doctors remain pending until their
       * credentials are approved by an admin.
       */
      const roleVerificationStatus =
        requestedRole ===
        "doctor"
          ? "pending"
          : "not_required";

      user =
        await User.create({
          fullName:
            normalizedName,

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
            typeof decodedToken
              .picture ===
              "string"
              ? decodedToken
                  .picture
              : "",

          lastLoginAt:
            null,
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
      const invalidTokenCodes = [
        "auth/id-token-expired",
        "auth/id-token-revoked",
        "auth/invalid-id-token",
        "auth/argument-error",
        "auth/user-disabled",
        "app/invalid-credential",
      ];

      if (
        invalidTokenCodes.includes(
          error.code
        )
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
        error.code === 11000
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