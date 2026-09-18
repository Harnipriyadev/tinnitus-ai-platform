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
  getPatientConnections,
  inviteCaretaker,
  respondToInvitation,
  revokeCaretakerConnection,
  updateCaretakerPermissions,
} = require(
  "../controllers/caretakerController"
);

const router =
  express.Router();

/*
 * Every caretaker route requires authentication.
 */
router.use(
  protect
);

/*
 * Patient sends a caretaker invitation.
 */
router.post(
  "/patient/invitations",
  authorize(
    "patient"
  ),
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
  authorize(
    "patient"
  ),
  getPatientConnections
);

/*
 * Patient updates consent permissions.
 */
router.patch(
  "/patient/connections/:id/permissions",
  authorize(
    "patient"
  ),
  validateBody(
    updateCaretakerPermissionsSchema
  ),
  updateCaretakerPermissions
);

/*
 * Patient removes caretaker access.
 */
router.patch(
  "/patient/connections/:id/revoke",
  authorize(
    "patient"
  ),
  revokeCaretakerConnection
);

/*
 * Caretaker views invitations and connections.
 */
router.get(
  "/connections",
  authorize(
    "caretaker"
  ),
  getCaretakerConnections
);

/*
 * Caretaker accepts or rejects an invitation.
 */
router.patch(
  "/invitations/:id/respond",
  authorize(
    "caretaker"
  ),
  validateBody(
    respondToInvitationSchema
  ),
  respondToInvitation
);

module.exports =
  router;