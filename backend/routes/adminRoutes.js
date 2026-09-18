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
  reviewDoctorApplicationSchema,
} = require(
  "../validators/doctorValidators"
);

const {
  getDoctorApplication,
  listDoctorApplications,
  reviewDoctorApplication,
} = require(
  "../controllers/adminDoctorController"
);

const router =
  express.Router();

/*
 * Every endpoint below requires an
 * authenticated Administrator account.
 */
router.use(
  protect,
  authorize("admin")
);

/*
 * Examples:
 * /api/admin/doctors?status=pending
 * /api/admin/doctors?status=verified
 */
router.get(
  "/doctors",
  listDoctorApplications
);

/*
 * View one Doctor application.
 */
router.get(
  "/doctors/:id",
  getDoctorApplication
);

/*
 * Approve or reject a pending application.
 */
router.patch(
  "/doctors/:id/review",
  validateBody(
    reviewDoctorApplicationSchema
  ),
  reviewDoctorApplication
);

module.exports =
  router;