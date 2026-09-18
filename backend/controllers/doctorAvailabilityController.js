const mongoose = require(
  "mongoose"
);

const DoctorAvailability =
  require(
    "../models/DoctorAvailability"
  );

/*
 * Converts YYYY-MM-DD into a consistent
 * date using the India timezone.
 */
const parseAvailabilityDate =
  (date) =>
    new Date(
      `${date}T00:00:00+05:30`
    );

/*
 * Creates or updates availability for one date.
 */
const saveDoctorAvailability =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        date,
        slots,
        timezone,
      } = req.body;

      const availabilityDate =
        parseAvailabilityDate(
          date
        );

      const existingAvailability =
        await DoctorAvailability
          .findOne({
            doctor:
              req.user._id,

            date:
              availabilityDate,
          });

      /*
       * Do not allow a doctor to replace slots
       * after a patient has booked one of them.
       */
      if (
        existingAvailability &&
        existingAvailability
          .slots
          .some(
            (slot) =>
              slot.isBooked
          )
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Availability with booked appointments cannot be edited",
          });
      }

      const normalizedSlots =
        slots
          .map(
            (slot) => ({
              startTime:
                slot.startTime,

              endTime:
                slot.endTime,

              isBooked:
                false,

              appointment:
                null,
            })
          )
          .sort(
            (
              first,
              second
            ) =>
              first.startTime
                .localeCompare(
                  second
                    .startTime
                )
          );

      let availability;

      if (
        existingAvailability
      ) {
        existingAvailability.slots =
          normalizedSlots;

        existingAvailability.timezone =
          timezone;

        existingAvailability.active =
          true;

        availability =
          await existingAvailability
            .save();
      } else {
        availability =
          await DoctorAvailability
            .create({
              doctor:
                req.user._id,

              date:
                availabilityDate,

              slots:
                normalizedSlots,

              timezone,

              active:
                true,
            });
      }

      return res
        .status(
          existingAvailability
            ? 200
            : 201
        )
        .json({
          success: true,

          message:
            existingAvailability
              ? "Availability updated successfully"
              : "Availability created successfully",

          availability,
        });
    } catch (error) {
      if (
        error.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Availability already exists for this date",
          });
      }

      return next(error);
    }
  };

/*
 * Returns all availability created by the
 * currently authenticated doctor.
 */
const getDoctorAvailability =
  async (
    req,
    res,
    next
  ) => {
    try {
      const availability =
        await DoctorAvailability
          .find({
            doctor:
              req.user._id,
          })
          .sort({
            date: 1,
          });

      return res
        .status(200)
        .json({
          success: true,
          availability,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Deactivates one complete availability date.
 * Dates with booked appointments cannot be removed.
 */
const deleteDoctorAvailability =
  async (
    req,
    res,
    next
  ) => {
    try {
      const availability =
        await DoctorAvailability
          .findOne({
            _id:
              req.params.id,

            doctor:
              req.user._id,
          });

      if (!availability) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Availability was not found",
          });
      }

      const hasBookedSlot =
        availability
          .slots
          .some(
            (slot) =>
              slot.isBooked
          );

      if (hasBookedSlot) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Availability with booked appointments cannot be removed",
          });
      }

      await availability
        .deleteOne();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Availability removed successfully",
        });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Availability identifier is invalid",
          });
      }

      return next(error);
    }
  };

module.exports = {
  deleteDoctorAvailability,
  getDoctorAvailability,
  saveDoctorAvailability,
};