const express = require(
  "express"
);

const protect = require(
  "../middleware/authMiddleware"
);

const {
  authorize,
  requireVerifiedDoctor,
} = require(
  "../middleware/authMiddleware"
);

const {
  validateBody,
} = require(
  "../middleware/validate"
);

const {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  doctorAppointmentResponseSchema,
} = require(
  "../validators/appointmentValidators"
);

const {
  bookAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getDoctorSharedAssessment,
  getPatientAppointments,
  respondToAppointment,
} = require(
  "../controllers/appointmentController"
);

const {
  getVerifiedDoctors,
} = require(
  "../controllers/doctorDiscoveryController"
);

const router =
  express.Router();

/*
 * Every appointment route requires
 * authentication.
 */
router.use(
  protect
);

/*
 * Patient views verified doctors and their
 * available consultation slots.
 */
router.get(
  "/doctors",
  authorize(
    "patient"
  ),
  getVerifiedDoctors
);

/*
 * Patient books an appointment.
 */
router.post(
  "/",
  authorize(
    "patient"
  ),
  validateBody(
    bookAppointmentSchema
  ),
  bookAppointment
);

/*
 * Patient views appointment history.
 */
router.get(
  "/patient",
  authorize(
    "patient"
  ),
  getPatientAppointments
);

/*
 * Verified doctor views assigned appointments.
 */
router.get(
  "/doctor",
  authorize(
    "doctor"
  ),
  requireVerifiedDoctor,
  getDoctorAppointments
);

/*
 * Verified doctor views an assessment shared
 * through an appointment assigned to them.
 */
router.get(
  "/doctor/:id/shared-assessment",
  authorize(
    "doctor"
  ),
  requireVerifiedDoctor,
  getDoctorSharedAssessment
);

/*
 * Patient cancels their appointment.
 */
router.patch(
  "/:id/cancel",
  authorize(
    "patient"
  ),
  validateBody(
    cancelAppointmentSchema
  ),
  cancelAppointment
);

/*
 * Verified doctor confirms or rejects an
 * appointment assigned to them.
 */
router.patch(
  "/:id/respond",
  authorize(
    "doctor"
  ),
  requireVerifiedDoctor,
  validateBody(
    doctorAppointmentResponseSchema
  ),
  respondToAppointment
);

module.exports =
  router;