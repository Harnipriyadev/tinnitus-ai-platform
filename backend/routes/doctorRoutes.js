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
  uploadDoctorDocument,
} = require(
  "../middleware/doctorDocumentUpload"
);

const {
  doctorApplicationSchema,
  submitDoctorApplicationSchema,
} = require(
  "../validators/doctorValidators"
);

const {
  availabilitySchema,
} = require(
  "../validators/availabilityValidators"
);

const {
  getMyDoctorApplication,
  saveDoctorApplication,
  submitDoctorApplication,
} = require(
  "../controllers/doctorApplicationController"
);

const {
  uploadDoctorDocument:
    storeDoctorDocument,
} = require(
  "../controllers/doctorDocumentController"
);

const {
  deleteDoctorAvailability,
  getDoctorAvailability,
  saveDoctorAvailability,
} = require(
  "../controllers/doctorAvailabilityController"
);

const router =
  express.Router();

/*
 * Every route in this file requires an
 * authenticated doctor account.
 *
 * A doctor does not need to be verified to
 * create or submit an application.
 */
router.use(
  protect,
  authorize(
    "doctor"
  )
);

/*
 * Get the current doctor's application.
 */
router.get(
  "/application",
  getMyDoctorApplication
);

/*
 * Create or update the doctor's application.
 *
 * The controller must permit changes only when
 * the application is a draft or was rejected.
 */
router.put(
  "/application",
  validateBody(
    doctorApplicationSchema
  ),
  saveDoctorApplication
);

/*
 * Upload one protected sample document.
 *
 * Required multipart fields:
 * document
 * documentType
 * demoConfirmation
 */
router.post(
  "/application/documents",
  uploadDoctorDocument,
  storeDoctorDocument
);

/*
 * Submit the completed application for
 * administrator verification.
 */
router.post(
  "/application/submit",
  validateBody(
    submitDoctorApplicationSchema
  ),
  submitDoctorApplication
);

/*
 * Consultation availability routes below
 * require an administrator-verified doctor.
 */

/*
 * Get availability owned by the currently
 * authenticated and verified doctor.
 */
router.get(
  "/availability",
  requireVerifiedDoctor,
  getDoctorAvailability
);

/*
 * Create or update availability for one date.
 */
router.put(
  "/availability",
  requireVerifiedDoctor,
  validateBody(
    availabilitySchema
  ),
  saveDoctorAvailability
);

/*
 * Delete an availability date owned by the
 * currently authenticated verified doctor.
 */
router.delete(
  "/availability/:id",
  requireVerifiedDoctor,
  deleteDoctorAvailability
);

module.exports =
  router;