const mongoose = require(
  "mongoose"
);

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema =
  new mongoose.Schema(
    {
      fullName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: EMAIL_PATTERN,
      },

      /*
       * Retained temporarily for existing-user
       * migration.
       */
      password: {
        type: String,
        select: false,
      },

      firebaseUid: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        select: false,
      },

      authProvider: {
        type: String,

        enum: [
          "password",
          "google",
          "firebase",
          "migrated",
        ],

        default:
          "password",
      },

      /*
       * Public users may request patient,
       * caretaker or doctor accounts.
       *
       * Admin is never assigned through
       * public registration.
       */
      role: {
        type: String,

        enum: [
          "patient",
          "caretaker",
          "doctor",
          "admin",
        ],

        default:
          "patient",

        required:
          true,

        index:
          true,
      },

      /*
       * Doctor accounts remain pending until
       * an administrator verifies their medical
       * registration and documents.
       *
       * Patient and caretaker accounts use
       * "not_required".
       */
      roleVerificationStatus: {
        type: String,

        enum: [
          "not_required",
          "pending",
          "verified",
          "rejected",
          "suspended",
        ],

        default:
          "not_required",

        required:
          true,

        index:
          true,
      },

      roleVerificationUpdatedAt: {
        type: Date,
      },

      accountStatus: {
        type: String,

        enum: [
          "active",
          "disabled",
        ],

        default:
          "active",
      },

      emailVerified: {
        type: Boolean,
        default: false,
      },

      profilePicture: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: "",
      },

      failedLoginAttempts: {
        type: Number,
        default: 0,
        min: 0,
        select: false,
      },

      lockUntil: {
        type: Date,
        select: false,
      },

      lastLoginAt: {
        type: Date,
      },

      passwordChangedAt: {
        type: Date,
        select: false,
      },

      /*
       * Used by the temporary legacy JWT system.
       * Incrementing it invalidates older JWT
       * sessions.
       */
      tokenVersion: {
        type: Number,
        default: 0,
        min: 0,
        select: false,
      },

      resetPasswordToken: {
        type: String,
        select: false,
      },

      resetPasswordExpire: {
        type: Date,
        select: false,
      },
    },
    {
      timestamps:
        true,

      toJSON: {
        transform(
          document,
          returnedObject
        ) {
          delete returnedObject
            .password;

          delete returnedObject
            .firebaseUid;

          delete returnedObject
            .resetPasswordToken;

          delete returnedObject
            .resetPasswordExpire;

          delete returnedObject
            .failedLoginAttempts;

          delete returnedObject
            .lockUntil;

          delete returnedObject
            .passwordChangedAt;

          delete returnedObject
            .tokenVersion;

          delete returnedObject
            .__v;

          return returnedObject;
        },
      },
    }
  );

userSchema.methods
  .isTemporarilyLocked =
  function () {
    return Boolean(
      this.lockUntil &&
        this.lockUntil.getTime() >
          Date.now()
    );
  };

module.exports =
  mongoose.model(
    "User",
    userSchema
  );