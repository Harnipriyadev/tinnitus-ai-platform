const express = require(
  "express"
);

const protect = require(
  "../middleware/authMiddleware"
);

const {
  authorize,
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
 * an authenticated account.
 */
router.use(
  protect
);

/*
 * Allows consultation management only for
 * doctors approved by an administrator.
 */
const requireVerifiedDoctor =
  (
    req,
    res,
    next
  ) => {
    if (
      req.user.role !==
        "doctor" ||
      req.user
        .roleVerificationStatus !==
        "verified"
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "A verified doctor account is required",
        });
    }

    return next();
  };

/*
 * Patient views verified doctors and their
 * available future consultation slots.
 */
router.get(
  "/doctors",
  authorize(
    "patient"
  ),
  getVerifiedDoctors
);

/*
 * Patient books an available time slot.
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
 * Patient views their appointments.
 */
router.get(
  "/patient",
  authorize(
    "patient"
  ),
  getPatientAppointments
);

/*
 * Patient cancels a requested or
 * confirmed appointment.
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
 * Verified doctor views appointment requests.
 */
router.get(
  "/doctor",
  requireVerifiedDoctor,
  getDoctorAppointments
);

/*
 * Verified doctor confirms or rejects
 * an appointment request.
 */
router.patch(
  "/:id/respond",
  requireVerifiedDoctor,
  validateBody(
    doctorAppointmentResponseSchema
  ),
  respondToAppointment
);

module.exports =
  router;