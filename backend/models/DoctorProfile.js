const mongoose = require(
  "mongoose"
);

const doctorDocumentSchema =
  new mongoose.Schema(
    {
      documentType: {
        type: String,

        enum: [
          "medical_registration",
          "government_id",
          "qualification_certificate",
        ],

        required: true,
      },

      /*
       * Store only the protected storage key.
       * Do not store publicly accessible URLs.
       */
      storageKey: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
        select: false,
      },

      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      mimeType: {
        type: String,

        enum: [
          "application/pdf",
          "image/jpeg",
          "image/png",
        ],

        required: true,
      },

      fileSize: {
        type: Number,
        required: true,
        min: 1,
        max: 5 * 1024 * 1024,
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

const doctorProfileSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
        unique: true,
        index: true,
      },

      medicalCouncil: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
      },

      registrationNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      /*
       * Used for secure duplicate detection.
       */
      registrationNumberNormalized: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 100,
        select: false,
      },

      registrationYear: {
        type: Number,
        required: true,
        min: 1900,

        validate: {
          validator(value) {
            return (
              value <=
              new Date().getFullYear()
            );
          },

          message:
            "Registration year cannot be in the future",
        },
      },

      qualification: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200,
      },

      specialization: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120,
      },

      experienceYears: {
        type: Number,
        required: true,
        min: 0,
        max: 80,
      },

      consultationLanguages: {
        type: [
          String,
        ],

        default: [
          "English",
        ],

        validate: {
          validator(value) {
            return (
              Array.isArray(
                value
              ) &&
              value.length >= 1 &&
              value.length <= 10
            );
          },

          message:
            "Select between 1 and 10 consultation languages",
        },
      },

      hospitalOrClinic: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      professionalBio: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: "",
      },

      documents: {
        type: [
          doctorDocumentSchema,
        ],

        default: [],
      },

      verificationStatus: {
        type: String,

        enum: [
          "draft",
          "pending",
          "verified",
          "rejected",
          "suspended",
        ],

        default: "draft",
        required: true,
        index: true,
      },

      submittedAt: {
        type: Date,
      },

      reviewedAt: {
        type: Date,
      },

      reviewedBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",
        select: false,
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      /*
       * Records whether the registration was
       * checked against NMC or a State Medical
       * Council register.
       */
      officialRegisterChecked: {
        type: Boolean,
        default: false,
        select: false,
      },
    },
    {
      timestamps: true,

      toJSON: {
        transform(
          document,
          returnedObject
        ) {
          delete returnedObject
            .registrationNumberNormalized;

          delete returnedObject
            .reviewedBy;

          delete returnedObject
            .officialRegisterChecked;

          delete returnedObject
            .__v;

          return returnedObject;
        },
      },
    }
  );

/*
 * A registration number must be unique
 * within its Medical Council.
 */
doctorProfileSchema.index(
  {
    medicalCouncil: 1,
    registrationNumberNormalized: 1,
  },
  {
    unique: true,
  }
);

doctorProfileSchema.pre(
  "validate",
  function () {
    if (
      this.registrationNumber
    ) {
      this.registrationNumberNormalized =
        this.registrationNumber
          .replace(
            /\s+/g,
            ""
          )
          .toUpperCase();
    }

    if (
      Array.isArray(
        this.consultationLanguages
      )
    ) {
      this.consultationLanguages =
        [
          ...new Set(
            this.consultationLanguages
              .map(
                (language) =>
                  language.trim()
              )
              .filter(Boolean)
          ),
        ];
    }
  }
);

module.exports =
  mongoose.model(
    "DoctorProfile",
    doctorProfileSchema
  );