const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAvailability",
      required: true,
      index: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    consultationType: {
      type: String,
      enum: [
        "video",
        "audio",
        "chat",
        "in_person",
      ],
      default: "video",
    },

    patientMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "requested",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "requested",
      index: true,
    },

    doctorResponse: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /*
     * Meeting details are added by the doctor
     * while confirming an online consultation.
     */
    meetingProvider: {
      type: String,
      enum: [
        "google_meet",
        "zoom",
        "microsoft_teams",
        "other",
        "",
      ],
      default: "",
    },

    meetingLink: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
      validate: {
        validator(value) {
          if (!value) {
            return true;
          }

          try {
            const url = new URL(value);

            return (
              url.protocol === "https:" ||
              url.protocol === "http:"
            );
          } catch {
            return false;
          }
        },
        message: "Enter a valid meeting link",
      },
    },

    meetingInstructions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    assessmentSharingConsent: {
      type: Boolean,
      default: false,
    },

    sharedAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Supports patient and doctor appointment lists.
 */
appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});

appointmentSchema.index({
  doctor: 1,
  appointmentDate: -1,
});

appointmentSchema.index({
  doctor: 1,
  status: 1,
});

/*
 * Prevents duplicate appointments for the same slot.
 */
appointmentSchema.index(
  {
    availability: 1,
    slotId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          "requested",
          "confirmed",
        ],
      },
    },
  }
);

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);