const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const setNoStoreHeaders = (
  res
) => {
  res.set({
    "Cache-Control":
      "no-store, max-age=0",

    Pragma: "no-cache",
  });
};

const syncFirebaseProfile =
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
      } = req.body;

      /*
       * Verify the signature, expiry and
       * revocation state of the Firebase token.
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
        name,
        picture,
        email_verified:
          emailVerified,
        firebase,
      } = decodedToken;

      if (
        typeof uid !==
          "string" ||
        !uid.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Firebase account identifier is missing",
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

      if (
        emailVerified !==
        true
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Verify your email address before logging in",
          });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /*
       * First locate the MongoDB profile using
       * the securely verified Firebase UID.
       */
      let user =
        await User.findOne({
          firebaseUid:
            uid,
        }).select(
          "+firebaseUid +password"
        );

      if (user) {
        /*
         * A Firebase UID must never be allowed
         * to access a MongoDB profile belonging
         * to another email.
         */
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
                "Firebase identity does not match the connected profile",
            });
        }
      } else {
        /*
         * Check whether the verified email is
         * already present in MongoDB.
         */
        const emailUser =
          await User.findOne({
            email:
              normalizedEmail,
          }).select(
            "+firebaseUid +password"
          );

        if (emailUser) {
          /*
           * Never overwrite an active Firebase
           * UID automatically.
           */
          if (
            emailUser.firebaseUid &&
            emailUser.firebaseUid !==
              uid
          ) {
            return res
              .status(409)
              .json({
                success: false,

                message:
                  "This email is linked to another Firebase account",
              });
          }

          /*
           * Existing legacy accounts must prove
           * their old password through the
           * migrate-login endpoint.
           */
          if (
            emailUser.password &&
            !emailUser.firebaseUid
          ) {
            return res
              .status(409)
              .json({
                success: false,

                message:
                  "This legacy account must be migrated using its existing password",
              });
          }

          user =
            emailUser;

          user.firebaseUid =
            uid;
        }
      }

      const signInProvider =
        firebase
          ?.sign_in_provider;

      const provider =
        signInProvider ===
        "google.com"
          ? "google"
          : "firebase";

      if (!user) {
        /*
         * The role is never accepted from this
         * request body.
         */
        user = new User({
          fullName:
            fullName?.trim() ||
            name?.trim() ||
            normalizedEmail.split(
              "@"
            )[0],

          email:
            normalizedEmail,

          firebaseUid:
            uid,

          authProvider:
            provider,

          emailVerified:
            true,

          role:
            "patient",

          roleVerificationStatus:
            "not_required",

          profilePicture:
            picture || "",

          accountStatus:
            "active",

          lastLoginAt:
            new Date(),
        });
      } else {
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

        user.firebaseUid =
          uid;

        /*
         * Preserve the migrated state until
         * completeMigration removes the old
         * password hash.
         */
        if (
          user.authProvider !==
          "migrated"
        ) {
          user.authProvider =
            provider;
        }

        user.emailVerified =
          true;

        user.lastLoginAt =
          new Date();

        if (
          !user.profilePicture &&
          picture
        ) {
          user.profilePicture =
            picture;
        }

        /*
         * Only use a supplied name when the
         * stored profile does not already have
         * a valid name.
         */
        if (
          (!user.fullName ||
            user.fullName.trim()
              .length < 2) &&
          fullName?.trim()
        ) {
          user.fullName =
            fullName.trim();
        }
      }

      /*
       * Safely migrate very old profiles that
       * existed before multi-role support.
       */
      if (
        !user.role ||
        user.role === "user"
      ) {
        user.role =
          "patient";

        user.roleVerificationStatus =
          "not_required";
      }

      await user.save();

      return res
        .status(200)
        .json({
          success: true,

          user: {
            _id:
              user._id,

            fullName:
              user.fullName,

            email:
              user.email,

            profilePicture:
              user
                .profilePicture,

            role:
              user.role,

            roleVerificationStatus:
              user
                .roleVerificationStatus,

            emailVerified:
              user
                .emailVerified,

            accountStatus:
              user
                .accountStatus,

            authProvider:
              user
                .authProvider,
          },
        });
    } catch (error) {
      const invalidTokenCodes = [
        "auth/id-token-expired",
        "auth/id-token-revoked",
        "auth/argument-error",
        "auth/invalid-id-token",
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
              "Firebase authentication token is invalid or expired",
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
              "This email or Firebase account is already linked",
          });
      }

      return next(error);
    }
  };

module.exports = {
  syncFirebaseProfile,
};