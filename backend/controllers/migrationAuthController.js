const bcrypt = require("bcryptjs");

const User = require("../models/User");
const admin = require("../config/firebaseAdmin");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/*
 * Used when an email does not exist, helping reduce
 * timing differences that could reveal registered emails.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const recordFailedLogin = async (user) => {
  const attempts =
    (user.failedLoginAttempts || 0) + 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    user.failedLoginAttempts = 0;
    user.lockUntil = new Date(
      Date.now() + LOCK_DURATION_MS
    );
  } else {
    user.failedLoginAttempts = attempts;
  }

  await user.save({
    validateBeforeSave: false,
  });
};

const getOrCreateFirebaseUser = async (
  user,
  password
) => {
  try {
    const existingFirebaseUser = await admin
      .auth()
      .getUserByEmail(user.email);

    if (existingFirebaseUser.disabled) {
      const error = new Error(
        "Firebase account is disabled"
      );

      error.statusCode = 403;
      throw error;
    }

    return existingFirebaseUser;
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    return admin.auth().createUser({
      email: user.email,
      password,
      displayName: user.fullName,
      emailVerified: false,
      disabled: false,
    });
  }
};

const migrateLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    }).select(
      "+password +firebaseUid +failedLoginAttempts +lockUntil"
    );

    if (!user) {
      await bcrypt.compare(
        password,
        DUMMY_PASSWORD_HASH
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is disabled",
      });
    }

    if (user.isTemporarilyLocked()) {
      return res.status(429).json({
        success: false,
        message:
          "Too many unsuccessful attempts. Please wait 15 minutes and try again.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "This account already uses Firebase authentication",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      await recordFailedLogin(user);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const firebaseUser =
      await getOrCreateFirebaseUser(
        user,
        password
      );

    user.firebaseUid = firebaseUser.uid;
    user.authProvider = "migrated";
    user.emailVerified =
      firebaseUser.emailVerified;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();

    await user.save();

    /*
     * The browser exchanges this one-time Firebase
     * custom token for a normal Firebase session.
     */
    const customToken = await admin
      .auth()
      .createCustomToken(firebaseUser.uid);

    return res.status(200).json({
      success: true,
      migrationRequired: true,
      customToken,

      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const completeMigration = async (
  req,
  res,
  next
) => {
  try {
    if (req.auth?.authType !== "firebase") {
      return res.status(403).json({
        success: false,
        message:
          "Firebase authentication is required to complete migration",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          authProvider: "firebase",
          emailVerified: Boolean(
            req.auth.firebaseToken.email_verified
          ),
          lastLoginAt: new Date(),
        },

        $unset: {
          password: 1,
          resetPasswordToken: 1,
          resetPasswordExpire: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Account migration completed successfully",

      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
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