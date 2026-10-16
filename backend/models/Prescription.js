const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    strength: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    frequency: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
    strict: "throw",
  }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      immutable: true,
      maxlength: 60,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      immutable: true,
    },

    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationRecord",
      required: true,
      immutable: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },

    medications: {
      type: [medicationSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1 && value.length <= 20;
        },
        message: "A prescription must contain between 1 and 20 medicines",
      },
    },

    generalInstructions: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "issued", "cancelled"],
      default: "draft",
      index: true,
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    strict: "throw",
    optimisticConcurrency: true,
  }
);

prescriptionSchema.pre("validate", function () {
  if (
    this.patient &&
    this.doctor &&
    this.patient.toString() === this.doctor.toString()
  ) {
    throw new Error("Patient and doctor must be different users");
  }

  if (this.status === "draft") {
    this.issuedAt = null;
    this.cancelledAt = null;
    this.cancellationReason = "";
  }

  if (this.status === "issued") {
    this.issuedAt = this.issuedAt || new Date();
    this.cancelledAt = null;
    this.cancellationReason = "";
  }

  if (this.status === "cancelled") {
    this.cancelledAt = this.cancelledAt || new Date();

    if (!this.cancellationReason) {
      throw new Error("A cancellation reason is required");
    }
  }
});

prescriptionSchema.index({
  doctor: 1,
  status: 1,
  updatedAt: -1,
});

prescriptionSchema.index({
  patient: 1,
  status: 1,
  updatedAt: -1,
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
