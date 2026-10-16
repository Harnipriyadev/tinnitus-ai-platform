const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  authorize,
  requireVerifiedDoctor,
} = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validate");

const {
  savePrescriptionSchema,
} = require("../validators/prescriptionValidators");

const {
  getDoctorPrescription,
  getPatientPrescription,
  issueDoctorPrescription,
  saveDoctorPrescription,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.use(protect);

router.get(
  "/patient/:appointmentId",
  authorize("patient"),
  getPatientPrescription
);

router.get(
  "/doctor/:appointmentId",
  authorize("doctor"),
  requireVerifiedDoctor,
  getDoctorPrescription
);

router.put(
  "/doctor/:appointmentId",
  authorize("doctor"),
  requireVerifiedDoctor,
  validateBody(savePrescriptionSchema),
  saveDoctorPrescription
);

router.patch(
  "/doctor/:appointmentId/issue",
  authorize("doctor"),
  requireVerifiedDoctor,
  issueDoctorPrescription
);
module.exports = router;