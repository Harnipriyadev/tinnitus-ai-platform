const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  authorize,
  requireVerifiedDoctor,
} = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validate");

const {
  consultationNotesSchema,
} = require("../validators/consultationValidators");

const {
  completeDoctorConsultation,
  getDoctorConsultation,
  getPatientConsultation,
  saveDoctorConsultationNotes,
} = require("../controllers/consultationController");

const router = express.Router();

router.use(protect);

router.get(
  "/patient/:appointmentId",
  authorize("patient"),
  getPatientConsultation
);

router.get(
  "/doctor/:appointmentId",
  authorize("doctor"),
  requireVerifiedDoctor,
  getDoctorConsultation
);

router.put(
  "/doctor/:appointmentId/notes",
  authorize("doctor"),
  requireVerifiedDoctor,
  validateBody(consultationNotesSchema),
  saveDoctorConsultationNotes
);

router.patch(
  "/doctor/:appointmentId/complete",
  authorize("doctor"),
  requireVerifiedDoctor,
  completeDoctorConsultation
);


module.exports = router;
