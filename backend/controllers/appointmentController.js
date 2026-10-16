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

const ONLINE_CONSULTATION_TYPES =
  new Set([
    "video",
    "audio",
  ]);

const createControllerError = (
  message,
  statusCode
) => {
  const error =
    new Error(
      message
    );

  error.statusCode =
    statusCode;

  return error;
};

/*
 * Converts a stored availability date and
 * HH:mm time into an Asia/Kolkata Date.
 */
const getAppointmentDateTime = (
  storedDate,
  time
) => {
  const date =
    new Date(
      storedDate
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

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
      date
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

  const result =
    new Date(
      `${values.year}-${values.month}-${values.day}T${time}:00+05:30`
    );

  if (
    Number.isNaN(
      result.getTime()
    )
  ) {
    return null;
  }

  return result;
};

const isSafeMeetingLink = (
  meetingLink
) => {
  try {
    const url =
      new URL(
        meetingLink
      );

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
};

const releaseReservedSlot =
  async (
    {
      availabilityId,
      slotId,
      appointmentId,
      session,
    }
  ) => {
    const result =
      await DoctorAvailability
        .updateOne(
          {
            _id:
              availabilityId,

            slots: {
              $elemMatch: {
                _id:
                  slotId,

                isBooked:
                  true,

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
          },
          {
            session,
          }
        );

    if (
      result.modifiedCount !==
      1
    ) {
      throw createControllerError(
        "The appointment slot could not be released safely",
        409
      );
    }
  };

/*
 * Patient atomically books one available
 * doctor slot.
 */
const bookAppointment =
  async (
    req,
    res,
    next
  ) => {
    const session =
      await mongoose
        .startSession();

    let createdAppointmentId =
      null;

    try {
      const {
        availabilityId,
        slotId,
        consultationType,
        patientMessage,
        assessmentSharingConsent,
        sharedAssessmentId,
      } = req.body;

      if (
        sharedAssessmentId &&
        assessmentSharingConsent !==
          true
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Patient consent is required before sharing an assessment",
          });
      }

      if (
        assessmentSharingConsent ===
          true &&
        !sharedAssessmentId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Select an assessment to share",
          });
      }

      await session.withTransaction(
        async () => {
          const availability =
            await DoctorAvailability
              .findOne({
                _id:
                  availabilityId,

                active:
                  true,
              })
              .session(
                session
              );

          if (!availability) {
            throw createControllerError(
              "Doctor availability was not found",
              404
            );
          }

          const doctor =
            await User
              .findOne({
                _id:
                  availability
                    .doctor,

                role:
                  "doctor",

                roleVerificationStatus:
                  "verified",

                accountStatus:
                  "active",
              })
              .select(
                "_id"
              )
              .session(
                session
              );

          if (!doctor) {
            throw createControllerError(
              "This doctor is not currently available for consultation",
              409
            );
          }

          const existingSlot =
            availability
              .slots
              .id(
                slotId
              );

          if (
            !existingSlot ||
            existingSlot
              .isBooked
          ) {
            throw createControllerError(
              "This time slot is no longer available",
              409
            );
          }

          const initialStart =
            getAppointmentDateTime(
              availability.date,
              existingSlot
                .startTime
            );

          if (
            !initialStart ||
            initialStart.getTime() <=
              Date.now()
          ) {
            throw createControllerError(
              "Past time slots cannot be booked",
              409
            );
          }

          let sharedAssessment =
            null;

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
                )
                .session(
                  session
                );

            if (
              !sharedAssessment
            ) {
              throw createControllerError(
                "The selected assessment was not found",
                404
              );
            }
          }

          const appointmentId =
            new mongoose
              .Types
              .ObjectId();

          /*
           * Atomically reserve the slot and
           * return its latest stored values.
           */
          const reservedAvailability =
            await DoctorAvailability
              .findOneAndUpdate(
                {
                  _id:
                    availability
                      ._id,

                  doctor:
                    doctor._id,

                  active:
                    true,

                  slots: {
                    $elemMatch: {
                      _id:
                        slotId,

                      isBooked:
                        false,

                      appointment:
                        null,
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
                },
                {
                  new:
                    true,

                  runValidators:
                    true,

                  session,
                }
              );

          if (
            !reservedAvailability
          ) {
            throw createControllerError(
              "This time slot was just booked by another patient",
              409
            );
          }

          const reservedSlot =
            reservedAvailability
              .slots
              .id(
                slotId
              );

          if (!reservedSlot) {
            throw createControllerError(
              "The selected time slot no longer exists",
              409
            );
          }

          const appointmentStart =
            getAppointmentDateTime(
              reservedAvailability
                .date,
              reservedSlot
                .startTime
            );

          if (
            !appointmentStart ||
            appointmentStart.getTime() <=
              Date.now()
          ) {
            throw createControllerError(
              "Past time slots cannot be booked",
              409
            );
          }

          const createdAppointments =
            await Appointment.create(
              [
                {
                  _id:
                    appointmentId,

                  patient:
                    req.user._id,

                  doctor:
                    doctor._id,

                  availability:
                    reservedAvailability
                      ._id,

                  slotId:
                    reservedSlot._id,

                  appointmentDate:
                    reservedAvailability
                      .date,

                  startTime:
                    reservedSlot
                      .startTime,

                  endTime:
                    reservedSlot
                      .endTime,

                  timezone:
                    reservedAvailability
                      .timezone ||
                    "Asia/Kolkata",

                  consultationType,

                  patientMessage,

                  assessmentSharingConsent:
                    Boolean(
                      assessmentSharingConsent &&
                      sharedAssessment
                    ),

                  sharedAssessment:
                    sharedAssessment
                      ? sharedAssessment
                          ._id
                      : null,

                  status:
                    "requested",

                  requestedAt:
                    new Date(),
                },
              ],
              {
                session,
              }
            );

          createdAppointmentId =
            createdAppointments[0]
              ._id;
        }
      );

      const appointment =
        await Appointment
          .findById(
            createdAppointmentId
          )
          .populate(
            "doctor",
            "fullName profilePicture"
          );

      if (!appointment) {
        throw createControllerError(
          "The appointment could not be loaded",
          500
        );
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Appointment request submitted successfully",

          appointment,
        });
    } catch (
      error
    ) {
      if (
        error instanceof
        mongoose.Error
          .CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Appointment information is invalid",
          });
      }

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This time slot has already been booked",
          });
      }

      if (
        error.statusCode
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            success: false,

            message:
              error.message,
          });
      }

      return next(
        error
      );
    } finally {
      await session
        .endSession();
    }
  };

/*
 * Returns appointments belonging only to the
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
            "fullName profilePicture"
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
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/*
 * Returns appointments assigned only to the
 * authenticated verified doctor.
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
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/*
 * Verified doctor confirms or rejects an
 * appointment assigned to their account.
 */
/*
 * Returns the assessment shared by a patient
 * with the doctor assigned to the appointment.
 */
const getDoctorSharedAssessment = async (
  req,
  res,
  next
) => {
  try {
    const appointmentId = req.params.id;

    if (
      !mongoose.isValidObjectId(
        appointmentId
      )
    ) {
      throw createControllerError(
        "Invalid appointment identifier",
        400
      );
    }

    /*
     * Including the doctor in the query prevents
     * one doctor from accessing another doctor's
     * appointment.
     */
    const appointment =
      await Appointment.findOne({
        _id: appointmentId,
        doctor: req.user._id,
      }).select(
        [
          "patient",
          "sharedAssessment",
          "assessmentSharingConsent",
          "status",
          "appointmentDate",
          "startTime",
          "endTime",
          "consultationType",
        ].join(" ")
      );

    if (!appointment) {
      throw createControllerError(
        "Appointment not found",
        404
      );
    }

    /*
     * Assessment access is removed if the
     * appointment is rejected or cancelled.
     */
    const allowedStatuses = [
      "requested",
      "confirmed",
      "completed",
    ];

    if (
      !allowedStatuses.includes(
        appointment.status
      )
    ) {
      throw createControllerError(
        "Assessment access is unavailable for this appointment",
        403
      );
    }

    if (
      appointment.assessmentSharingConsent !==
      true
    ) {
      throw createControllerError(
        "The patient has not consented to share an assessment",
        403
      );
    }

    if (!appointment.sharedAssessment) {
      throw createControllerError(
        "No assessment is attached to this appointment",
        404
      );
    }

    /*
     * Both the assessment ID and patient ID are
     * checked to prevent another patient's
     * assessment from being exposed.
     */
    const assessment =
      await Assessment.findOne({
        _id:
          appointment.sharedAssessment,

        user:
          appointment.patient,
      }).select("-__v");

    if (!assessment) {
      throw createControllerError(
        "The shared assessment could not be found",
        404
      );
    }

    return res.status(200).json({
      success: true,

      appointment: {
        _id: appointment._id,

        status:
          appointment.status,

        appointmentDate:
          appointment.appointmentDate,

        startTime:
          appointment.startTime,

        endTime:
          appointment.endTime,

        consultationType:
          appointment.consultationType,
      },

      assessment,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({
          success: false,
          message: error.message,
        });
    }

    return next(error);
  }
};
const respondToAppointment =
  async (
    req,
    res,
    next
  ) => {
    if (
      !mongoose
        .isValidObjectId(
          req.params.id
        )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Appointment identifier is invalid",
        });
    }

    const session =
      await mongoose
        .startSession();

    let updatedAppointmentId =
      null;

    try {
      const {
        decision,
        doctorResponse,
        meetingProvider,
        meetingLink,
        meetingInstructions,
      } = req.body;

      await session.withTransaction(
        async () => {
          const pendingAppointment =
            await Appointment
              .findOne({
                _id:
                  req.params.id,

                doctor:
                  req.user._id,

                status:
                  "requested",
              })
              .session(
                session
              );

          if (
            !pendingAppointment
          ) {
            throw createControllerError(
              "A pending appointment request was not found",
              404
            );
          }

          const appointmentStart =
            getAppointmentDateTime(
              pendingAppointment
                .appointmentDate,
              pendingAppointment
                .startTime
            );

          if (
            !appointmentStart ||
            appointmentStart.getTime() <=
              Date.now()
          ) {
            throw createControllerError(
              "A past appointment request cannot be reviewed",
              409
            );
          }

          const onlineConsultation =
            ONLINE_CONSULTATION_TYPES
              .has(
                pendingAppointment
                  .consultationType
              );

          const confirmingOnline =
            decision ===
              "confirmed" &&
            onlineConsultation;

          if (
            confirmingOnline &&
            (
              !meetingProvider ||
              !meetingLink
            )
          ) {
            throw createControllerError(
              "A meeting provider and HTTPS meeting link are required",
              400
            );
          }

          if (
            confirmingOnline &&
            !isSafeMeetingLink(
              meetingLink
            )
          ) {
            throw createControllerError(
              "Enter a valid HTTPS meeting link",
              400
            );
          }

          if (
            decision ===
              "confirmed" &&
            !onlineConsultation &&
            (
              meetingProvider ||
              meetingLink ||
              meetingInstructions
            )
          ) {
            throw createControllerError(
              "Meeting details are allowed only for video or audio consultations",
              400
            );
          }

          if (
            decision ===
              "rejected" &&
            (
              meetingProvider ||
              meetingLink ||
              meetingInstructions
            )
          ) {
            throw createControllerError(
              "Meeting details cannot be added to a rejected appointment",
              400
            );
          }

          const savedMeetingProvider =
            confirmingOnline
              ? meetingProvider
              : "";

          const savedMeetingLink =
            confirmingOnline
              ? meetingLink
              : "";

          const savedMeetingInstructions =
            confirmingOnline
              ? meetingInstructions
              : "";

          const appointment =
            await Appointment
              .findOneAndUpdate(
                {
                  _id:
                    pendingAppointment
                      ._id,

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
                  new:
                    true,

                  runValidators:
                    true,

                  session,
                }
              );

          if (!appointment) {
            throw createControllerError(
              "This appointment request has already been reviewed",
              409
            );
          }

          if (
            decision ===
            "rejected"
          ) {
            await releaseReservedSlot({
              availabilityId:
                appointment
                  .availability,

              slotId:
                appointment
                  .slotId,

              appointmentId:
                appointment
                  ._id,

              session,
            });
          }

          updatedAppointmentId =
            appointment._id;
        }
      );

      const appointment =
        await Appointment
          .findById(
            updatedAppointmentId
          )
          .populate(
            "patient",
            "fullName profilePicture"
          );

      if (!appointment) {
        throw createControllerError(
          "The appointment could not be loaded",
          500
        );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            appointment.status ===
            "confirmed"
              ? "Appointment confirmed"
              : "Appointment rejected",

          appointment,
        });
    } catch (
      error
    ) {
      if (
        error.statusCode
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            success: false,

            message:
              error.message,
          });
      }

      return next(
        error
      );
    } finally {
      await session
        .endSession();
    }
  };

/*
 * Patient cancels a future requested or
 * confirmed appointment belonging to them.
 */
const cancelAppointment =
  async (
    req,
    res,
    next
  ) => {
    if (
      !mongoose
        .isValidObjectId(
          req.params.id
        )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Appointment identifier is invalid",
        });
    }

    const session =
      await mongoose
        .startSession();

    let cancelledAppointmentId =
      null;

    try {
      const {
        cancellationReason,
      } = req.body;

      await session.withTransaction(
        async () => {
          const existingAppointment =
            await Appointment
              .findOne({
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
              })
              .session(
                session
              );

          if (
            !existingAppointment
          ) {
            throw createControllerError(
              "A cancellable appointment was not found",
              404
            );
          }

          const appointmentStart =
            getAppointmentDateTime(
              existingAppointment
                .appointmentDate,
              existingAppointment
                .startTime
            );

          if (
            !appointmentStart ||
            appointmentStart.getTime() <=
              Date.now()
          ) {
            throw createControllerError(
              "Past or started appointments cannot be cancelled",
              409
            );
          }

          const appointment =
            await Appointment
              .findOneAndUpdate(
                {
                  _id:
                    existingAppointment
                      ._id,

                  patient:
                    req.user._id,

                  status:
                    existingAppointment
                      .status,
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
                  new:
                    true,

                  runValidators:
                    true,

                  session,
                }
              );

          if (!appointment) {
            throw createControllerError(
              "The appointment status changed before it could be cancelled",
              409
            );
          }

          await releaseReservedSlot({
            availabilityId:
              appointment
                .availability,

            slotId:
              appointment
                .slotId,

            appointmentId:
              appointment._id,

            session,
          });

          cancelledAppointmentId =
            appointment._id;
        }
      );

      const appointment =
        await Appointment
          .findById(
            cancelledAppointmentId
          )
          .populate(
            "doctor",
            "fullName profilePicture"
          );

      if (!appointment) {
        throw createControllerError(
          "The appointment could not be loaded",
          500
        );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Appointment cancelled successfully",

          appointment,
        });
    } catch (
      error
    ) {
      if (
        error.statusCode
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            success: false,

            message:
              error.message,
          });
      }

      return next(
        error
      );
    } finally {
      await session
        .endSession();
    }
  };
module.exports = {
  bookAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getDoctorSharedAssessment,
  getPatientAppointments,
  respondToAppointment,
};