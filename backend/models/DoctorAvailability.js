const mongoose = require(
  "mongoose"
);

const timePattern =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeSlotSchema =
  new mongoose.Schema(
    {
      startTime: {
        type: String,
        required: true,
        match: timePattern,
      },

      endTime: {
        type: String,
        required: true,
        match: timePattern,
      },

      isBooked: {
        type: Boolean,
        default: false,
      },

      appointment: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Appointment",

        default: null,
      },
    },
    {
      _id: true,
    }
  );

const doctorAvailabilitySchema =
  new mongoose.Schema(
    {
      doctor: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      date: {
        type: Date,
        required: true,
        index: true,
      },

      slots: {
        type: [
          timeSlotSchema,
        ],

        validate: {
          validator(slots) {
            return (
              Array.isArray(
                slots
              ) &&
              slots.length > 0 &&
              slots.length <= 30
            );
          },

          message:
            "Add between 1 and 30 time slots",
        },
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default:
          "Asia/Kolkata",
      },

      active: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * A doctor can create only one availability
 * document for each date.
 */
doctorAvailabilitySchema.index(
  {
    doctor: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

/*
 * Prevent invalid or overlapping time slots.
 */
doctorAvailabilitySchema.pre(
  "validate",
  function () {
    if (
      !Array.isArray(
        this.slots
      )
    ) {
      return;
    }

    const sortedSlots = [
      ...this.slots,
    ].sort((first, second) =>
      first.startTime.localeCompare(
        second.startTime
      )
    );

    for (
      let index = 0;
      index <
      sortedSlots.length;
      index += 1
    ) {
      const slot =
        sortedSlots[index];

      if (
        slot.startTime >=
        slot.endTime
      ) {
        this.invalidate(
          "slots",
          "Every slot must end after its start time"
        );

        return;
      }

      const previousSlot =
        sortedSlots[
          index - 1
        ];

      if (
        previousSlot &&
        slot.startTime <
          previousSlot.endTime
      ) {
        this.invalidate(
          "slots",
          "Doctor time slots cannot overlap"
        );

        return;
      }
    }
  }
);

module.exports =
  mongoose.model(
    "DoctorAvailability",
    doctorAvailabilitySchema
  );