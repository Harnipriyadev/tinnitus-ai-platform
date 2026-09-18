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
 * authenticated Doctor account.
 */
router.use(
  protect,
  authorize("doctor")
);

/*
 * Allows consultation features only after
 * administrator verification.
 */
const requireVerifiedDoctor =
  (
    req,
    res,
    next
  ) => {
    if (
      req.user
        .roleVerificationStatus !==
      "verified"
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "Doctor verification is required before using consultation features",
        });
    }

    return next();
  };

/*
 * Get the current doctor's application.
 */
router.get(
  "/application",
  getMyDoctorApplication
);

/*
 * Create or update the application draft.
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
 * Multipart field names:
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
 * Get availability created by the currently
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
 * Delete one availability date owned by the
 * currently authenticated doctor.
 */
router.delete(
  "/availability/:id",
  requireVerifiedDoctor,
  deleteDoctorAvailability
);

module.exports =
  router;