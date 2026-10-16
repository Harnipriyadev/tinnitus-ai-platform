const { randomBytes } = require("crypto");
const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const ConsultationRecord = require("../models/ConsultationRecord");
const Prescription = require("../models/Prescription");

const createControllerError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generatePrescriptionNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomBytes(5).toString("hex").toUpperCase();
  return `RX-${date}-${randomPart}`;
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

const ensurePrescriptionStatusAllowed = (appointment) => {
  if (!["confirmed", "completed"].includes(appointment.status)) {
    throw createControllerError(
      "Prescription access is available only for confirmed or completed appointments",
      403
    );
  }
};

const getDoctorPrescription = async (req, res, next) => {
  try {
    const appointment = await findDoctorAppointment(
      req.params.appointmentId,
      req.user._id
    );

    ensurePrescriptionStatusAllowed(appointment);

    const prescription = await Prescription.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    })
      .select("-__v")
      .lean();

    return res.status(200).json({
      success: true,
      prescription,
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

const saveDoctorPrescription = async (req, res, next) => {
  try {
    const appointment = await findDoctorAppointment(
      req.params.appointmentId,
      req.user._id
    );

    if (appointment.status !== "confirmed") {
      throw createControllerError(
        "Prescription drafts can be edited only for confirmed appointments",
        403
      );
    }

    const consultation = await ConsultationRecord.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    }).select("_id");

    if (!consultation) {
      throw createControllerError(
        "Save consultation notes before creating a prescription",
        409
      );
    }

    let prescription = await Prescription.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    });

    if (prescription && prescription.status !== "draft") {
      throw createControllerError(
        "An issued or cancelled prescription cannot be edited",
        409
      );
    }

    if (!prescription) {
      prescription = new Prescription({
        prescriptionNumber: generatePrescriptionNumber(),
        appointment: appointment._id,
        consultation: consultation._id,
        patient: appointment.patient,
        doctor: req.user._id,
        medications: req.body.medications,
        generalInstructions: req.body.generalInstructions,
      });
    } else {
      prescription.medications = req.body.medications;
      prescription.generalInstructions = req.body.generalInstructions;
    }

    await prescription.save();

    const savedPrescription = prescription.toObject();
    delete savedPrescription.__v;

    return res.status(200).json({
      success: true,
      message: "Prescription draft saved successfully",
      prescription: savedPrescription,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A prescription already exists for this appointment",
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

const issueDoctorPrescription = async (req, res, next) => {
  try {
    const appointment = await findDoctorAppointment(
      req.params.appointmentId,
      req.user._id
    );

    if (appointment.status !== "confirmed") {
      throw createControllerError(
        "A prescription can be issued only for a confirmed appointment",
        403
      );
    }

    const prescription = await Prescription.findOne({
      appointment: appointment._id,
      doctor: req.user._id,
    });

    if (!prescription) {
      throw createControllerError("Save the prescription before issuing it", 404);
    }

    if (prescription.status === "issued") {
      throw createControllerError("The prescription has already been issued", 409);
    }

    if (prescription.status === "cancelled") {
      throw createControllerError("A cancelled prescription cannot be issued", 409);
    }

    prescription.status = "issued";
    prescription.issuedAt = new Date();
    await prescription.save();

    const issuedPrescription = prescription.toObject();
    delete issuedPrescription.__v;

    return res.status(200).json({
      success: true,
      message: "Prescription issued successfully",
      prescription: issuedPrescription,
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

const getPatientPrescription = async (req, res, next) => {
  try {
    const appointment = await findPatientAppointment(
      req.params.appointmentId,
      req.user._id
    );

    ensurePrescriptionStatusAllowed(appointment);

    const prescription = await Prescription.findOne({
      appointment: appointment._id,
      patient: req.user._id,
      status: "issued",
    })
      .select(
        [
          "prescriptionNumber",
          "medications",
          "generalInstructions",
          "status",
          "issuedAt",
          "createdAt",
          "updatedAt",
        ].join(" ")
      )
      .lean();

    return res.status(200).json({
      success: true,
      prescription,
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

module.exports = {
  getDoctorPrescription,
  getPatientPrescription,
  issueDoctorPrescription,
  saveDoctorPrescription,
};
