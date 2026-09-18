const mongoose = require(
  "mongoose"
);

const caretakerConnectionSchema =
  new mongoose.Schema(
    {
      patient: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      caretaker: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      status: {
        type: String,

        enum: [
          "pending",
          "accepted",
          "rejected",
          "revoked",
        ],

        default:
          "pending",

        required: true,

        index: true,
      },

      permissions: {
        viewAssessments: {
          type: Boolean,
          default: false,
        },

        viewAppointments: {
          type: Boolean,
          default: false,
        },
      },

      invitedAt: {
        type: Date,
        default: Date.now,
      },

      respondedAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * Prevent duplicate connections between
 * the same patient and caretaker.
 */
caretakerConnectionSchema.index(
  {
    patient: 1,
    caretaker: 1,
  },
  {
    unique: true,
  }
);

/*
 * Supports caretaker invitation lists.
 */
caretakerConnectionSchema.index({
  caretaker: 1,
  status: 1,
  createdAt: -1,
});

/*
 * Supports patient connection lists.
 */
caretakerConnectionSchema.index({
  patient: 1,
  status: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "CaretakerConnection",
    caretakerConnectionSchema
  );