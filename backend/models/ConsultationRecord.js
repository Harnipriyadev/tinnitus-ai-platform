const mongoose = require(
  "mongoose"
);

const consultationRecordSchema =
  new mongoose.Schema(
    {
      appointment: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Appointment",
        required: true,
        unique: true,
        immutable: true,
      },

      patient: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
      },

      doctor: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
      },

      chiefComplaint: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: "",
      },

      clinicalFindings: {
        type: String,
        trim: true,
        maxlength: 4000,
        default: "",
      },

      clinicalImpression: {
        type: String,
        trim: true,
        maxlength: 2500,
        default: "",
      },

      carePlan: {
        type: String,
        trim: true,
        maxlength: 4000,
        default: "",
      },

      /*
       * Hidden from normal queries to reduce
       * accidental exposure of private notes.
       */
      privateDoctorNotes: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: "",
        select: false,
      },

      status: {
        type: String,
        enum: [
          "draft",
          "finalized",
        ],
        default: "draft",
        index: true,
      },

      finalizedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      strict: "throw",
      optimisticConcurrency:
        true,
    }
  );

consultationRecordSchema.pre(
  "validate",
  function () {
    const hasContent = [
      this.chiefComplaint,
      this.clinicalFindings,
      this.clinicalImpression,
      this.carePlan,
      this.privateDoctorNotes,
    ].some(
      (value) =>
        typeof value ===
          "string" &&
        value.trim().length > 0
    );

    if (!hasContent) {
      throw new Error(
        "Enter at least one consultation note"
      );
    }

    if (
      this.patient &&
      this.doctor &&
      this.patient.toString() ===
        this.doctor.toString()
    ) {
      throw new Error(
        "Patient and doctor must be different users"
      );
    }

    if (
      this.status ===
      "draft"
    ) {
      this.finalizedAt =
        null;
    }

    if (
      this.status ===
        "finalized" &&
      !this.finalizedAt
    ) {
      this.finalizedAt =
        new Date();
    }
  }
);

consultationRecordSchema.index(
  {
    doctor: 1,
    status: 1,
    updatedAt: -1,
  }
);

consultationRecordSchema.index(
  {
    patient: 1,
    updatedAt: -1,
  }
);

module.exports =
  mongoose.model(
    "ConsultationRecord",
    consultationRecordSchema
  );