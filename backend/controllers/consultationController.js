const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const ConsultationRecord = require("../models/ConsultationRecord");
const Prescription = require("../models/Prescription");

const createControllerError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const findDoctorAppointment = async (appointmentId, doctorId) => {
  if (!mongoose.isValidObjectId(appointmentId)) {
    throw createControllerError("Invalid appointment identifier", 400);
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: doctorId,
  }).select(
    [
      "patient",
      "doctor",
      "status",
      "appointmentDate",
      "startTime",
      "endTime",
      "consultationType",
    ].join(" ")
  );

  if (!appointment) {
    throw createControllerError("Appointment not found", 404);
  }

  return appointment;
};

const findPatientAppointment = async (appointmentId, patientId) => {
  if (!mongoose.isValidObjectId(appointmentId)) {
    throw createControllerError("Invalid appointment identifier", 400);
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patient: patientId,
  }).select(
    [
      "patient",
      "doctor",
      "status",
      "appointmentDate",
      "startTime",
      "endTime",
      "consultationType",
    ].join(" ")
  );

  if (!appointment) {
    throw createControllerError("Appointment not found", 404);
  }

  return appointment;
};

const getDoctorConsultation = async (req, res, next) => {
  try {
    const appointment = await findDoctorAppointment(
      req.params.appointmentId,
      req.user._id
    );

    if (!["confirmed", "completed"].includes(appointment.status)) {
      throw createControllerError(
        "Consultation notes are available only for confirmed or completed appointments",
        403
      );
    }

    const consultation = await ConsultationRecord.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    })
      .select("+privateDoctorNotes -__v")
      .lean();

    return res.status(200).json({
      success: true,
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        consultationType: appointment.consultationType,
      },
      consultation,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const saveDoctorConsultationNotes = async (req, res, next) => {
  try {
    const appointment = await findDoctorAppointment(
      req.params.appointmentId,
      req.user._id
    );

    if (appointment.status !== "confirmed") {
      throw createControllerError(
        "Consultation notes can be edited only for confirmed appointments",
        403
      );
    }

    let consultation = await ConsultationRecord.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    }).select("+privateDoctorNotes");

    if (consultation && consultation.status === "finalized") {
      throw createControllerError(
        "Finalized consultation notes cannot be edited",
        409
      );
    }

    if (!consultation) {
      consultation = new ConsultationRecord({
        appointment: appointment._id,
        patient: appointment.patient,
        doctor: req.user._id,
        ...req.body,
      });
    } else {
      consultation.chiefComplaint = req.body.chiefComplaint;
      consultation.clinicalFindings = req.body.clinicalFindings;
      consultation.clinicalImpression = req.body.clinicalImpression;
      consultation.carePlan = req.body.carePlan;
      consultation.privateDoctorNotes = req.body.privateDoctorNotes;
    }

    await consultation.save();

    const savedConsultation = consultation.toObject();
    delete savedConsultation.__v;

    return res.status(200).json({
      success: true,
      message: "Consultation notes saved successfully",
      consultation: savedConsultation,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A consultation record already exists for this appointment",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const getPatientConsultation = async (req, res, next) => {
  try {
    const appointment = await findPatientAppointment(
      req.params.appointmentId,
      req.user._id
    );

    if (!["confirmed", "completed"].includes(appointment.status)) {
      throw createControllerError(
        "Consultation notes are not available for this appointment",
        403
      );
    }

    const consultation = await ConsultationRecord.findOne({
      appointment: appointment._id,
      patient: req.user._id,
    })
      .select(
        [
          "chiefComplaint",
          "clinicalFindings",
          "clinicalImpression",
          "carePlan",
          "status",
          "createdAt",
          "updatedAt",
        ].join(" ")
      )
      .lean();

    return res.status(200).json({
      success: true,
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        consultationType: appointment.consultationType,
      },
      consultation,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const completeDoctorConsultation = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let completedAppointment;
    let finalizedConsultation;

    await session.withTransaction(async () => {
      if (!mongoose.isValidObjectId(req.params.appointmentId)) {
        throw createControllerError(
          "Invalid appointment identifier",
          400
        );
      }

      /*
       * lean() prevents Mongoose from applying defaults
       * to legacy immutable appointment fields.
       */
      const appointment = await Appointment.findOne({
        _id: req.params.appointmentId,
        doctor: req.user._id,
      })
        .select("_id patient doctor status")
        .session(session)
        .lean();

      if (!appointment) {
        throw createControllerError(
          "Appointment not found",
          404
        );
      }

      if (appointment.status !== "confirmed") {
        throw createControllerError(
          "Only a confirmed appointment can be completed",
          409
        );
      }

      const consultation = await ConsultationRecord.findOne({
        appointment: appointment._id,
        doctor: req.user._id,
      })
        .select("+privateDoctorNotes")
        .session(session);

      if (!consultation) {
        throw createControllerError(
          "Save consultation notes before completing the appointment",
          409
        );
      }

      if (
        !consultation.clinicalImpression ||
        !consultation.carePlan
      ) {
        throw createControllerError(
          "Clinical impression and care plan are required before completion",
          400
        );
      }

      const prescription = await Prescription.findOne({
        appointment: appointment._id,
        doctor: req.user._id,
      })
        .select("status")
        .session(session)
        .lean();

      if (prescription?.status === "draft") {
        throw createControllerError(
          "Issue the saved prescription draft before completing the consultation",
          409
        );
      }

      const completedAt = new Date();

      consultation.status = "finalized";
      consultation.finalizedAt = completedAt;

      await consultation.save({
        session,
      });

      /*
       * Update only the allowed fields instead of
       * saving the complete legacy appointment.
       */
      const updateResult = await Appointment.updateOne(
        {
          _id: appointment._id,
          doctor: req.user._id,
          status: "confirmed",
        },
        {
          $set: {
            status: "completed",
            completedAt,
          },
        },
        {
          session,
          runValidators: true,
        }
      );

      if (updateResult.matchedCount !== 1) {
        throw createControllerError(
          "The appointment status changed. Refresh and try again.",
          409
        );
      }

      completedAppointment = {
        _id: appointment._id,
        status: "completed",
        completedAt,
      };

      finalizedConsultation = {
        _id: consultation._id,
        status: consultation.status,
        finalizedAt: consultation.finalizedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Consultation completed successfully",
      appointment: completedAppointment,
      consultation: finalizedConsultation,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  completeDoctorConsultation,
  getDoctorConsultation,
  getPatientConsultation,
  saveDoctorConsultationNotes,
};
