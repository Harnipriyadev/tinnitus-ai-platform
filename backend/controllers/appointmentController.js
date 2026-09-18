const mongoose = require(
  "mongoose"
);

const Appointment = require(
  "../models/Appointment"
);

const Assessment = require(
  "../models/Assessment"
);

const DoctorAvailability =
  require(
    "../models/DoctorAvailability"
  );

const User = require(
  "../models/User"
);

/*
 * Converts the stored date and time into
 * an exact Asia/Kolkata date and time.
 */
const getAppointmentDateTime =
  (
    storedDate,
    time
  ) => {
    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:
            "Asia/Kolkata",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        }
      ).formatToParts(
        new Date(
          storedDate
        )
      );

    const values =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !==
              "literal"
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ]
          )
      );

    return new Date(
      `${values.year}-${values.month}-${values.day}T${time}:00+05:30`
    );
  };

/*
 * Releases a booked availability slot.
 */
const releaseSlot =
  async (
    availabilityId,
    slotId,
    appointmentId
  ) => {
    await DoctorAvailability
      .updateOne(
        {
          _id:
            availabilityId,

          slots: {
            $elemMatch: {
              _id:
                slotId,

              appointment:
                appointmentId,
            },
          },
        },
        {
          $set: {
            "slots.$.isBooked":
              false,

            "slots.$.appointment":
              null,
          },
        }
      );
  };

/*
 * Patient books an available doctor slot.
 */
const bookAppointment =
  async (
    req,
    res,
    next
  ) => {
    let reservedSlot =
      false;

    let appointmentId;

    try {
      const {
        availabilityId,
        slotId,
        consultationType,
        patientMessage,
        assessmentSharingConsent,
        sharedAssessmentId,
      } = req.body;

      const availability =
        await DoctorAvailability
          .findOne({
            _id:
              availabilityId,

            active:
              true,
          });

      if (!availability) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Doctor availability was not found",
          });
      }

      const doctor =
        await User.findOne({
          _id:
            availability.doctor,

          role:
            "doctor",

          roleVerificationStatus:
            "verified",

          accountStatus:
            "active",
        });

      if (!doctor) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This doctor is not currently available for consultation",
          });
      }

      const selectedSlot =
        availability
          .slots
          .id(
            slotId
          );

      if (
        !selectedSlot ||
        selectedSlot.isBooked
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This time slot is no longer available",
          });
      }

      const appointmentStart =
        getAppointmentDateTime(
          availability.date,
          selectedSlot
            .startTime
        );

      if (
        appointmentStart.getTime() <=
        Date.now()
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Past time slots cannot be booked",
          });
      }

      let sharedAssessment =
        null;

      /*
       * Patients can share only assessments
       * belonging to their own account.
       */
      if (
        sharedAssessmentId
      ) {
        sharedAssessment =
          await Assessment
            .findOne({
              _id:
                sharedAssessmentId,

              user:
                req.user._id,
            })
            .select(
              "_id"
            );

        if (
          !sharedAssessment
        ) {
          return res
            .status(404)
            .json({
              success: false,

              message:
                "The selected assessment was not found",
            });
        }
      }

      appointmentId =
        new mongoose.Types
          .ObjectId();

      /*
       * Atomically reserve the selected slot.
       * This prevents two patients from booking
       * the same slot simultaneously.
       */
      const reservation =
        await DoctorAvailability
          .updateOne(
            {
              _id:
                availability._id,

              active:
                true,

              slots: {
                $elemMatch: {
                  _id:
                    new mongoose
                      .Types
                      .ObjectId(
                        slotId
                      ),

                  isBooked:
                    false,
                },
              },
            },
            {
              $set: {
                "slots.$.isBooked":
                  true,

                "slots.$.appointment":
                  appointmentId,
              },
            }
          );

      if (
        reservation.modifiedCount !==
        1
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This time slot was just booked by another patient",
          });
      }

      reservedSlot =
        true;

      const appointment =
        await Appointment
          .create({
            _id:
              appointmentId,

            patient:
              req.user._id,

            doctor:
              doctor._id,

            availability:
              availability._id,

            slotId:
              selectedSlot._id,

            appointmentDate:
              availability.date,

            startTime:
              selectedSlot
                .startTime,

            endTime:
              selectedSlot
                .endTime,

            timezone:
              availability
                .timezone,

            consultationType,

            patientMessage,

            assessmentSharingConsent:
              Boolean(
                assessmentSharingConsent &&
                sharedAssessment
              ),

            sharedAssessment:
              sharedAssessment
                ? sharedAssessment._id
                : null,

            status:
              "requested",

            requestedAt:
              new Date(),
          });

      reservedSlot =
        false;

      await appointment.populate(
        "doctor",
        "fullName profilePicture email"
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Appointment request submitted successfully",

          appointment,
        });
    } catch (error) {
      /*
       * Release the reserved slot if appointment
       * creation fails.
       */
      if (
        reservedSlot &&
        appointmentId
      ) {
        await releaseSlot(
          req.body
            .availabilityId,

          req.body.slotId,

          appointmentId
        ).catch(
          (
            rollbackError
          ) => {
            console.error(
              "Appointment slot rollback failed:",
              rollbackError.message
            );
          }
        );
      }

      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Appointment information is invalid",
          });
      }

      return next(error);
    }
  };

/*
 * Returns appointments belonging to the
 * authenticated patient.
 */
const getPatientAppointments =
  async (
    req,
    res,
    next
  ) => {
    try {
      const appointments =
        await Appointment
          .find({
            patient:
              req.user._id,
          })
          .populate(
            "doctor",
            "fullName profilePicture email"
          )
          .sort({
            appointmentDate:
              -1,

            startTime:
              -1,
          });

      return res
        .status(200)
        .json({
          success: true,
          appointments,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Returns appointments assigned to the
 * authenticated doctor.
 */
const getDoctorAppointments =
  async (
    req,
    res,
    next
  ) => {
    try {
      const appointments =
        await Appointment
          .find({
            doctor:
              req.user._id,
          })
          .populate(
            "patient",
            "fullName profilePicture"
          )
          .sort({
            appointmentDate:
              1,

            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success: true,
          appointments,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Doctor confirms or rejects an appointment.
 *
 * Video and audio consultations require an
 * HTTPS meeting link.
 */
const respondToAppointment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        decision,
        doctorResponse,
        meetingProvider,
        meetingLink,
        meetingInstructions,
      } = req.body;

      /*
       * Find the appointment first because its
       * consultation type determines whether a
       * meeting link is required.
       */
      const pendingAppointment =
        await Appointment
          .findOne({
            _id:
              req.params.id,

            doctor:
              req.user._id,

            status:
              "requested",
          });

      if (!pendingAppointment) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "A pending appointment request was not found",
          });
      }

      const requiresMeetingLink =
        decision ===
          "confirmed" &&
        [
          "video",
          "audio",
        ].includes(
          pendingAppointment
            .consultationType
        );

      /*
       * Video and audio appointments must contain
       * meeting information before confirmation.
       */
      if (
        requiresMeetingLink &&
        (
          !meetingProvider ||
          !meetingLink
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A meeting provider and meeting link are required for video or audio consultations",
          });
      }

      /*
       * Store meeting information only when it is
       * required for an online consultation.
       */
      const savedMeetingProvider =
        requiresMeetingLink
          ? meetingProvider
          : "";

      const savedMeetingLink =
        requiresMeetingLink
          ? meetingLink
          : "";

      const savedMeetingInstructions =
        requiresMeetingLink
          ? meetingInstructions
          : "";

      /*
       * The status condition prevents the same
       * request from being handled twice.
       */
      const appointment =
        await Appointment
          .findOneAndUpdate(
            {
              _id:
                req.params.id,

              doctor:
                req.user._id,

              status:
                "requested",
            },
            {
              $set: {
                status:
                  decision,

                doctorResponse,

                meetingProvider:
                  savedMeetingProvider,

                meetingLink:
                  savedMeetingLink,

                meetingInstructions:
                  savedMeetingInstructions,

                respondedAt:
                  new Date(),
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

      if (!appointment) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This appointment request has already been reviewed",
          });
      }

      /*
       * Rejected appointments release the slot so
       * another patient can book it.
       */
      if (
        decision ===
        "rejected"
      ) {
        await releaseSlot(
          appointment
            .availability,

          appointment
            .slotId,

          appointment._id
        );
      }

      await appointment.populate(
        "patient",
        "fullName profilePicture"
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            decision ===
            "confirmed"
              ? "Appointment confirmed"
              : "Appointment rejected",

          appointment,
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
              "Appointment identifier is invalid",
          });
      }

      return next(error);
    }
  };

/*
 * Patient cancels a requested or confirmed
 * appointment and releases the selected slot.
 */
const cancelAppointment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        cancellationReason,
      } = req.body;

      const appointment =
        await Appointment
          .findOneAndUpdate(
            {
              _id:
                req.params.id,

              patient:
                req.user._id,

              status: {
                $in: [
                  "requested",
                  "confirmed",
                ],
              },
            },
            {
              $set: {
                status:
                  "cancelled",

                cancellationReason,

                cancelledAt:
                  new Date(),
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

      if (!appointment) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "A cancellable appointment was not found",
          });
      }

      await releaseSlot(
        appointment
          .availability,

        appointment.slotId,

        appointment._id
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Appointment cancelled successfully",

          appointment,
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
              "Appointment identifier is invalid",
          });
      }

      return next(error);
    }
  };

module.exports = {
  bookAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  respondToAppointment,
};