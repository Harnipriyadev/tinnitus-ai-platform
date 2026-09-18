const mongoose = require(
  "mongoose"
);

const CaretakerConnection =
  require(
    "../models/CaretakerConnection"
  );

const User = require(
  "../models/User"
);

/*
 * Patient invites a registered caretaker.
 */
const inviteCaretaker =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        email,
        permissions,
      } = req.body;

      const caretaker =
        await User.findOne({
          email:
            email
              .trim()
              .toLowerCase(),

          role:
            "caretaker",

          accountStatus:
            "active",
        });

      if (!caretaker) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "An active caretaker account with this email was not found",
          });
      }

      if (
        caretaker._id.equals(
          req.user._id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "You cannot invite your own account",
          });
      }

      const existingConnection =
        await CaretakerConnection
          .findOne({
            patient:
              req.user._id,

            caretaker:
              caretaker._id,
          });

      if (
        existingConnection &&
        existingConnection.status ===
          "pending"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "An invitation has already been sent to this caretaker",
          });
      }

      if (
        existingConnection &&
        existingConnection.status ===
          "accepted"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This caretaker is already connected to your account",
          });
      }

      let connection;

      if (existingConnection) {
        existingConnection.status =
          "pending";

        existingConnection.permissions = {
          viewAssessments:
            Boolean(
              permissions
                .viewAssessments
            ),

          viewAppointments:
            Boolean(
              permissions
                .viewAppointments
            ),
        };

        existingConnection.invitedAt =
          new Date();

        existingConnection.respondedAt =
          null;

        existingConnection.revokedAt =
          null;

        connection =
          await existingConnection
            .save();
      } else {
        connection =
          await CaretakerConnection
            .create({
              patient:
                req.user._id,

              caretaker:
                caretaker._id,

              status:
                "pending",

              permissions: {
                viewAssessments:
                  Boolean(
                    permissions
                      .viewAssessments
                  ),

                viewAppointments:
                  Boolean(
                    permissions
                      .viewAppointments
                  ),
              },

              invitedAt:
                new Date(),
            });
      }

      await connection.populate(
        "caretaker",
        "fullName email profilePicture"
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Caretaker invitation sent successfully",

          connection,
        });
    } catch (error) {
      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "A connection with this caretaker already exists",
          });
      }

      return next(error);
    }
  };

/*
 * Returns connections belonging to a patient.
 */
const getPatientConnections =
  async (
    req,
    res,
    next
  ) => {
    try {
      const connections =
        await CaretakerConnection
          .find({
            patient:
              req.user._id,
          })
          .populate(
            "caretaker",
            "fullName email profilePicture accountStatus"
          )
          .sort({
            createdAt:
              -1,
          });

      return res
        .status(200)
        .json({
          success: true,
          connections,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Returns invitations and connections belonging
 * to the authenticated caretaker.
 */
const getCaretakerConnections =
  async (
    req,
    res,
    next
  ) => {
    try {
      const connections =
        await CaretakerConnection
          .find({
            caretaker:
              req.user._id,
          })
          .populate(
            "patient",
            "fullName email profilePicture accountStatus"
          )
          .sort({
            createdAt:
              -1,
          });

      return res
        .status(200)
        .json({
          success: true,
          connections,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Caretaker accepts or rejects an invitation.
 */
const respondToInvitation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        decision,
      } = req.body;

      const connection =
        await CaretakerConnection
          .findOneAndUpdate(
            {
              _id:
                req.params.id,

              caretaker:
                req.user._id,

              status:
                "pending",
            },
            {
              $set: {
                status:
                  decision,

                respondedAt:
                  new Date(),

                revokedAt:
                  null,
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            }
          )
          .populate(
            "patient",
            "fullName email profilePicture"
          );

      if (!connection) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "A pending caretaker invitation was not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            decision ===
            "accepted"
              ? "Caretaker invitation accepted"
              : "Caretaker invitation rejected",

          connection,
        });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Connection identifier is invalid",
          });
      }

      return next(error);
    }
  };

/*
 * Patient changes permissions for an accepted
 * caretaker connection.
 */
const updateCaretakerPermissions =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        viewAssessments,
        viewAppointments,
      } = req.body;

      const connection =
        await CaretakerConnection
          .findOneAndUpdate(
            {
              _id:
                req.params.id,

              patient:
                req.user._id,

              status:
                "accepted",
            },
            {
              $set: {
                permissions: {
                  viewAssessments:
                    Boolean(
                      viewAssessments
                    ),

                  viewAppointments:
                    Boolean(
                      viewAppointments
                    ),
                },
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            }
          )
          .populate(
            "caretaker",
            "fullName email profilePicture"
          );

      if (!connection) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "An accepted caretaker connection was not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Caretaker permissions updated successfully",

          connection,
        });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Connection identifier is invalid",
          });
      }

      return next(error);
    }
  };

/*
 * Patient revokes a caretaker connection.
 */
const revokeCaretakerConnection =
  async (
    req,
    res,
    next
  ) => {
    try {
      const connection =
        await CaretakerConnection
          .findOneAndUpdate(
            {
              _id:
                req.params.id,

              patient:
                req.user._id,

              status: {
                $in: [
                  "pending",
                  "accepted",
                ],
              },
            },
            {
              $set: {
                status:
                  "revoked",

                revokedAt:
                  new Date(),
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            }
          );

      if (!connection) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "An active caretaker connection was not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Caretaker access revoked successfully",

          connection,
        });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Connection identifier is invalid",
          });
      }

      return next(error);
    }
  };

module.exports = {
  getCaretakerConnections,
  getPatientConnections,
  inviteCaretaker,
  respondToInvitation,
  revokeCaretakerConnection,
  updateCaretakerPermissions,
};