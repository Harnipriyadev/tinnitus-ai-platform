const User = require("../models/User");
const admin = require("../config/firebaseAdmin");

/*
 * Checks whether a Firebase account still exists.
 *
 * Returns:
 * true  = account exists
 * false = account was deleted
 */
const firebaseAccountExists = async (
  firebaseUid
) => {
  if (!firebaseUid) {
    return false;
  }

  try {
    await admin
      .auth()
      .getUser(firebaseUid);

    return true;
  } catch (error) {
    if (
      error.code ===
      "auth/user-not-found"
    ) {
      return false;
    }

    throw error;
  }
};

const syncFirebaseProfile = async (
  req,
  res,
  next
) => {
  try {
    const {
      idToken,
      fullName,
    } = req.body;

    /*
     * Verify the Firebase token and check
     * whether it has been revoked.
     */
    const decodedToken = await admin
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

    if (!uid) {
      return res.status(400).json({
        success: false,
        message:
          "Firebase account identifier is missing",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Firebase account does not contain an email address",
      });
    }

    /*
     * Never create or connect a MongoDB profile
     * using an unverified Firebase email.
     */
    if (!emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Verify your email address before logging in",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * First look for a profile connected
     * to the current Firebase UID.
     */
    let user = await User.findOne({
      firebaseUid: uid,
    }).select("+firebaseUid");

    if (!user) {
      /*
       * If the current UID is not connected,
       * check for an existing MongoDB account
       * with the same verified email.
       */
      const emailUser =
        await User.findOne({
          email: normalizedEmail,
        }).select("+firebaseUid");

      if (emailUser) {
        if (
          emailUser.firebaseUid &&
          emailUser.firebaseUid !==
            uid
        ) {
          /*
           * Check whether the old Firebase
           * account still exists.
           */
          const oldAccountStillExists =
            await firebaseAccountExists(
              emailUser.firebaseUid
            );

          if (
            oldAccountStillExists
          ) {
            return res
              .status(409)
              .json({
                success: false,
                message:
                  "This email is linked to another active Firebase account",
              });
          }

          /*
           * The old Firebase account was deleted.
           * Reconnect the verified email to the
           * new Firebase UID.
           */
          emailUser.firebaseUid =
            undefined;
        }

        user = emailUser;
        user.firebaseUid = uid;
      }
    }

    const provider =
      firebase
        ?.sign_in_provider ===
      "google.com"
        ? "google"
        : "firebase";

    if (!user) {
      /*
       * Create a MongoDB profile for the
       * verified Firebase account.
       *
       * All new accounts begin as patients.
       * The role is never accepted from req.body.
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

        firebaseUid: uid,

        authProvider:
          provider,

        emailVerified:
          true,

        role:
          "patient",

        profilePicture:
          picture || "",

        accountStatus:
          "active",

        lastLoginAt:
          new Date(),
      });
    } else {
      /*
       * Reject disabled accounts.
       */
      if (
        user.accountStatus &&
        user.accountStatus !==
          "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "User account is disabled",
        });
      }

      user.firebaseUid =
        uid;

      user.authProvider =
        provider;

      user.emailVerified =
        true;

      user.lastLoginAt =
        new Date();

      if (!user.accountStatus) {
        user.accountStatus =
          "active";
      }

      if (
        !user.profilePicture &&
        picture
      ) {
        user.profilePicture =
          picture;
      }

      if (
        fullName?.trim() &&
        user.fullName !==
          fullName.trim()
      ) {
        user.fullName =
          fullName.trim();
      }
    }

    /*
     * Migrate accounts created before
     * multi-role support was added.
     */
    if (
      !user.role ||
      user.role === "user"
    ) {
      user.role =
        "patient";
    }

    await user.save();

    return res.status(200).json({
      success: true,

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

        emailVerified:
          user.emailVerified,

        accountStatus:
          user.accountStatus,

        authProvider:
          user.authProvider,
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
      return res.status(401).json({
        success: false,
        message:
          "Firebase authentication token is invalid or expired",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
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