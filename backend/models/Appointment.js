const mongoose = require(
  "mongoose"
);

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

const ONLINE_TYPES =
  new Set([
    "video",
    "audio",
  ]);

const appointmentSchema =
  new mongoose.Schema(
    {
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

      availability: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref:
          "DoctorAvailability",
        required: true,
        index: true,
        immutable: true,
      },

      slotId: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        required: true,
        immutable: true,
      },

      appointmentDate: {
        type: Date,
        required: true,
        index: true,
        immutable: true,
      },

      startTime: {
        type: String,
        required: true,
        trim: true,
        match: [
          TIME_PATTERN,
          "Start time must use HH:mm format",
        ],
        immutable: true,
      },

      endTime: {
        type: String,
        required: true,
        trim: true,
        match: [
          TIME_PATTERN,
          "End time must use HH:mm format",
        ],
        immutable: true,
      },

      timezone: {
        type: String,
        enum: [
          "Asia/Kolkata",
        ],
        default:
          "Asia/Kolkata",
        immutable: true,
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
        immutable: true,
      },

      patientMessage: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
        immutable: true,
      },
      completedAt: {
  type: Date,
  default: null,
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
  required: true,
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
              const url =
                new URL(value);

              return (
                url.protocol ===
                  "https:" &&
                Boolean(
                  url.hostname
                ) &&
                !url.username &&
                !url.password
              );
            } catch {
              return false;
            }
          },

          message:
            "Enter a valid HTTPS meeting link",
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
        immutable: true,
      },

      sharedAssessment: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Assessment",
        default: null,
        immutable: true,
      },

      requestedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
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
      strict: "throw",
      optimisticConcurrency:
        true,
    }
  );

/*
 * Validate relationships between fields that
 * cannot be protected using a simple enum.
 *
 * Current Mongoose middleware uses thrown errors
 * instead of the older next callback.
 */
appointmentSchema.pre(
  "validate",
  function () {
    if (
      this.startTime &&
      this.endTime &&
      this.startTime >=
        this.endTime
    ) {
      throw new Error(
        "Appointment end time must be later than its start time"
      );
    }

    if (
      this.sharedAssessment &&
      this
        .assessmentSharingConsent !==
        true
    ) {
      throw new Error(
        "Assessment sharing requires patient consent"
      );
    }

    const onlineConsultation =
      ONLINE_TYPES.has(
        this.consultationType
      );

    if (
      this.status ===
        "confirmed" &&
      onlineConsultation &&
      (
        !this.meetingProvider ||
        !this.meetingLink
      )
    ) {
      throw new Error(
        "Confirmed online consultations require meeting details"
      );
    }

    if (
      !onlineConsultation &&
      (
        this.meetingProvider ||
        this.meetingLink ||
        this.meetingInstructions
      )
    ) {
      throw new Error(
        "Meeting details are allowed only for video or audio consultations"
      );
    }
  }
);

/*
 * Supports patient appointment lists.
 */
appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});

/*
 * Supports doctor appointment lists.
 */
appointmentSchema.index({
  doctor: 1,
  appointmentDate: -1,
});

appointmentSchema.index({
  doctor: 1,
  status: 1,
  appointmentDate: 1,
});

/*
 * Prevents more than one active appointment
 * from using the same availability slot.
 *
 * Rejected and cancelled appointments remain
 * as audit history but do not block the slot.
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

module.exports =
  mongoose.model(
    "Appointment",
    appointmentSchema
  );