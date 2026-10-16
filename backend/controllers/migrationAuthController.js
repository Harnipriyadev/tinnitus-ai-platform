const bcrypt = require(
  "bcryptjs"
);

const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS =
  15 * 60 * 1000;

const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const setNoStoreHeaders = (
  res
) => {
  res.set({
    "Cache-Control":
      "no-store, max-age=0",

    Pragma: "no-cache",
  });
};

const createControllerError = (
  message,
  statusCode
) => {
  const error = new Error(
    message
  );

  error.statusCode =
    statusCode;

  return error;
};

/*
 * Atomically records a failed password
 * attempt.
 */
const recordFailedLogin =
  async (userId) => {
    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            failedLoginAttempts:
              1,
          },
        },
        {
          new: true,
          runValidators: false,
        }
      ).select(
        "+failedLoginAttempts +lockUntil"
      );

    if (!updatedUser) {
      return;
    }

    if (
      updatedUser.failedLoginAttempts >=
      MAX_FAILED_ATTEMPTS
    ) {
      await User.updateOne(
        {
          _id: userId,
        },
        {
          $set: {
            failedLoginAttempts:
              0,

            lockUntil:
              new Date(
                Date.now() +
                  LOCK_DURATION_MS
              ),
          },
        }
      );
    }
  };

/*
 * Obtains the correct Firebase account
 * without silently linking a conflicting UID.
 */
const getOrCreateFirebaseUser =
  async (
    user,
    password
  ) => {
    let firebaseUser = null;

    /*
     * Prefer the Firebase UID already connected
     * to the MongoDB profile.
     */
    if (user.firebaseUid) {
      try {
        firebaseUser =
          await admin
            .auth()
            .getUser(
              user.firebaseUid
            );

        const firebaseEmail =
          firebaseUser.email
            ?.trim()
            .toLowerCase();

        if (
          firebaseEmail !==
          user.email
            .trim()
            .toLowerCase()
        ) {
          throw createControllerError(
            "The connected Firebase account does not match this profile",
            409
          );
        }
      } catch (error) {
        if (
          error.code !==
          "auth/user-not-found"
        ) {
          throw error;
        }

        firebaseUser = null;
      }
    }

    /*
     * If no UID is connected, locate the
     * Firebase account using the verified
     * legacy email.
     */
    if (!firebaseUser) {
      try {
        firebaseUser =
          await admin
            .auth()
            .getUserByEmail(
              user.email
            );
      } catch (error) {
        if (
          error.code !==
          "auth/user-not-found"
        ) {
          throw error;
        }
      }
    }

    if (firebaseUser) {
      if (
        firebaseUser.disabled
      ) {
        throw createControllerError(
          "User account is disabled",
          403
        );
      }

      if (
        user.firebaseUid &&
        user.firebaseUid !==
          firebaseUser.uid
      ) {
        throw createControllerError(
          "The Firebase account does not match the connected profile",
          409
        );
      }

      return firebaseUser;
    }

    try {
      return await admin
        .auth()
        .createUser({
          email:
            user.email,

          password,

          displayName:
            user.fullName,

          emailVerified:
            false,

          disabled:
            false,
        });
    } catch (error) {
      /*
       * Handles two migration requests that
       * attempt to create the same Firebase
       * account simultaneously.
       */
      if (
        error.code ===
        "auth/email-already-exists"
      ) {
        return admin
          .auth()
          .getUserByEmail(
            user.email
          );
      }

      throw error;
    }
  };

const migrateLogin = async (
  req,
  res,
  next
) => {
  setNoStoreHeaders(res);

  try {
    if (
      process.env
        .ENABLE_LEGACY_AUTH !==
      "true"
    ) {
      return res
        .status(410)
        .json({
          success: false,

          message:
            "Legacy account migration is no longer available",
        });
    }

    const {
      email,
      password,
    } = req.body;

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).select(
        [
          "+password",
          "+firebaseUid",
          "+failedLoginAttempts",
          "+lockUntil",
        ].join(" ")
      );

    /*
     * Run a dummy bcrypt comparison when the
     * user does not exist to reduce account
     * enumeration through response timing.
     */
    if (!user) {
      await bcrypt.compare(
        password,
        DUMMY_PASSWORD_HASH
      );

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid email or password",
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

    if (
      user.isTemporarilyLocked()
    ) {
      return res
        .status(429)
        .json({
          success: false,

          message:
            "Too many unsuccessful attempts. Please wait 15 minutes and try again.",
        });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "This account already uses Firebase authentication",
        });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      await recordFailedLogin(
        user._id
      );

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid email or password",
        });
    }

    const firebaseUser =
      await getOrCreateFirebaseUser(
        user,
        password
      );

    /*
     * Update only after the Firebase identity
     * has been resolved successfully.
     *
     * The password remains temporarily until
     * the authenticated Firebase session calls
     * completeMigration.
     */
    user.firebaseUid =
      firebaseUser.uid;

    user.authProvider =
      "migrated";

    user.emailVerified =
      Boolean(
        firebaseUser.emailVerified
      );

    user.failedLoginAttempts =
      0;

    user.lockUntil =
      undefined;

    user.lastLoginAt =
      new Date();

    await user.save({
      validateBeforeSave:
        false,
    });

    /*
     * The frontend exchanges this custom token
     * for a normal Firebase ID token.
     */
    const customToken =
      await admin
        .auth()
        .createCustomToken(
          firebaseUser.uid
        );

    return res
      .status(200)
      .json({
        success: true,

        migrationRequired:
          true,

        customToken,

        user: {
          _id:
            user._id,

          fullName:
            user.fullName,

          email:
            user.email,

          profilePicture:
            user.profilePicture,

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
    return next(error);
  }
};

const completeMigration =
  async (
    req,
    res,
    next
  ) => {
    setNoStoreHeaders(res);

    try {
      if (
        req.auth?.authType !==
        "firebase"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Firebase authentication is required to complete migration",
          });
      }

      const firebaseUid =
        req.auth
          .firebaseToken
          ?.uid;

      if (
        !firebaseUid ||
        req.user.firebaseUid !==
          firebaseUid
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Firebase identity does not match the user profile",
          });
      }

      const firebaseEmail =
        req.auth
          .firebaseToken
          ?.email
          ?.trim()
          .toLowerCase();

      if (
        !firebaseEmail ||
        firebaseEmail !==
          req.user.email
            .trim()
            .toLowerCase()
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Firebase email does not match the user profile",
          });
      }

      if (
        req.auth
          .firebaseToken
          ?.email_verified !==
        true
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Verify your email address before completing migration",
          });
      }

      const user =
        await User.findOneAndUpdate(
          {
            _id:
              req.user._id,

            firebaseUid,
            accountStatus:
              "active",
          },
          {
            $set: {
              authProvider:
                "firebase",

              emailVerified:
                true,

              lastLoginAt:
                new Date(),

              failedLoginAttempts:
                0,
            },

            $unset: {
              password: 1,
              lockUntil: 1,
              resetPasswordToken:
                1,

              resetPasswordExpire:
                1,
            },

            $inc: {
              tokenVersion:
                1,
            },
          },
          {
            new: true,
            runValidators:
              true,
          }
        );

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Authenticated user profile was not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Account migration completed successfully",

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
      return next(error);
    }
  };

module.exports = {
  completeMigration,
  migrateLogin,
};