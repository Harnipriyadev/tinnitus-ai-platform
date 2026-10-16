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
  inviteCaretakerSchema,
  respondToInvitationSchema,
  updateCaretakerPermissionsSchema,
} = require(
  "../validators/caretakerValidators"
);

const {
  getCaretakerConnections,
  getConnectedPatientAppointments,
  getConnectedPatientAssessments,
  getPatientConnections,
  inviteCaretaker,
  respondToInvitation,
  revokeCaretakerConnection,
  updateCaretakerPermissions,
} = require(
  "../controllers/caretakerController"
);

const router = express.Router();

/*
 * Every route requires authentication.
 */
router.use(protect);

/*
 * Patient sends a caretaker invitation.
 */
router.post(
  "/patient/invitations",
  authorize("patient"),
  validateBody(
    inviteCaretakerSchema
  ),
  inviteCaretaker
);

/*
 * Patient views all caretaker connections.
 */
router.get(
  "/patient/connections",
  authorize("patient"),
  getPatientConnections
);

/*
 * Patient updates caretaker permissions.
 */
router.patch(
  "/patient/connections/:id/permissions",
  authorize("patient"),
  validateBody(
    updateCaretakerPermissionsSchema
  ),
  updateCaretakerPermissions
);

/*
 * Patient revokes caretaker access.
 */
router.patch(
  "/patient/connections/:id/revoke",
  authorize("patient"),
  revokeCaretakerConnection
);

/*
 * Caretaker views invitations and
 * accepted patient connections.
 */
router.get(
  "/connections",
  authorize("caretaker"),
  getCaretakerConnections
);

/*
 * Caretaker views a connected patient's
 * assessments when permission is enabled.
 */
router.get(
  "/connections/:id/assessments",
  authorize("caretaker"),
  getConnectedPatientAssessments
);

/*
 * Caretaker views a connected patient's
 * appointments when permission is enabled.
 */
router.get(
  "/connections/:id/appointments",
  authorize("caretaker"),
  getConnectedPatientAppointments
);

/*
 * Caretaker accepts or rejects an invitation.
 */
router.patch(
  "/invitations/:id/respond",
  authorize("caretaker"),
  validateBody(
    respondToInvitationSchema
  ),
  respondToInvitation
);

module.exports = router;