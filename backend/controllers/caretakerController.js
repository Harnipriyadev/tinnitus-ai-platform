const mongoose = require("mongoose");

const Assessment = require(
  "../models/Assessment"
);

const Appointment = require(
  "../models/Appointment"
);

const CaretakerConnection = require(
  "../models/CaretakerConnection"
);

const User = require(
  "../models/User"
);

/*
 * Patient invites a registered caretaker.
 */
const inviteCaretaker = async (
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
        email: email
          .trim()
          .toLowerCase(),

        role: "caretaker",
        accountStatus: "active",
      });

    if (!caretaker) {
      return res.status(404).json({
        success: false,
        message:
          "An active caretaker account with this email was not found",
      });
    }

    const existingConnection =
      await CaretakerConnection.findOne({
        patient: req.user._id,
        caretaker: caretaker._id,
      });

    if (
      existingConnection?.status ===
      "pending"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An invitation has already been sent to this caretaker",
      });
    }

    if (
      existingConnection?.status ===
      "accepted"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This caretaker is already connected to your account",
      });
    }

    const updatedPermissions = {
      viewAssessments: Boolean(
        permissions.viewAssessments
      ),

      viewAppointments: Boolean(
        permissions.viewAppointments
      ),
    };

    let connection;

    if (existingConnection) {
      existingConnection.status =
        "pending";

      existingConnection.permissions =
        updatedPermissions;

      existingConnection.invitedAt =
        new Date();

      existingConnection.respondedAt =
        null;

      existingConnection.revokedAt =
        null;

      connection =
        await existingConnection.save();
    } else {
      connection =
        await CaretakerConnection.create({
          patient: req.user._id,
          caretaker: caretaker._id,
          status: "pending",
          permissions:
            updatedPermissions,
          invitedAt: new Date(),
        });
    }

    await connection.populate(
      "caretaker",
      "fullName email profilePicture"
    );

    return res.status(201).json({
      success: true,
      message:
        "Caretaker invitation sent successfully",
      connection,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A connection with this caretaker already exists",
      });
    }

    return next(error);
  }
};

/*
 * Returns connections belonging to
 * the authenticated patient.
 */
const getPatientConnections = async (
  req,
  res,
  next
) => {
  try {
    const connections =
      await CaretakerConnection.find({
        patient: req.user._id,
      })
        .populate(
          "caretaker",
          "fullName email profilePicture accountStatus"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      connections,
    });
  } catch (error) {
    return next(error);
  }
};

/*
 * Returns invitations and connections
 * belonging to the authenticated caretaker.
 */
const getCaretakerConnections =
  async (req, res, next) => {
    try {
      const connections =
        await CaretakerConnection.find({
          caretaker: req.user._id,
        })
          .populate(
            "patient",
            "fullName email profilePicture accountStatus"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        connections,
      });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Caretaker accepts or rejects
 * a pending invitation.
 */
const respondToInvitation = async (
  req,
  res,
  next
) => {
  try {
    const { decision } = req.body;

    const connection =
      await CaretakerConnection
        .findOneAndUpdate(
          {
            _id: req.params.id,
            caretaker: req.user._id,
            status: "pending",
          },
          {
            $set: {
              status: decision,
              respondedAt: new Date(),
              revokedAt: null,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        )
        .populate(
          "patient",
          "fullName email profilePicture"
        );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "A pending caretaker invitation was not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        decision === "accepted"
          ? "Caretaker invitation accepted"
          : "Caretaker invitation rejected",

      connection,
    });
  } catch (error) {
    if (
      error instanceof
      mongoose.Error.CastError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Connection identifier is invalid",
      });
    }

    return next(error);
  }
};

/*
 * Patient updates the permissions of
 * an accepted caretaker connection.
 */
const updateCaretakerPermissions =
  async (req, res, next) => {
    try {
      const {
        viewAssessments,
        viewAppointments,
      } = req.body;

      const connection =
        await CaretakerConnection
          .findOneAndUpdate(
            {
              _id: req.params.id,
              patient: req.user._id,
              status: "accepted",
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
              new: true,
              runValidators: true,
            }
          )
          .populate(
            "caretaker",
            "fullName email profilePicture"
          );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message:
            "An accepted caretaker connection was not found",
        });
      }

      return res.status(200).json({
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
        return res.status(400).json({
          success: false,
          message:
            "Connection identifier is invalid",
        });
      }

      return next(error);
    }
  };

/*
 * Patient revokes a pending or accepted
 * caretaker connection.
 */
const revokeCaretakerConnection =
  async (req, res, next) => {
    try {
      const connection =
        await CaretakerConnection
          .findOneAndUpdate(
            {
              _id: req.params.id,
              patient: req.user._id,

              status: {
                $in: [
                  "pending",
                  "accepted",
                ],
              },
            },
            {
              $set: {
                status: "revoked",
                revokedAt: new Date(),
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message:
            "An active caretaker connection was not found",
        });
      }

      return res.status(200).json({
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
        return res.status(400).json({
          success: false,
          message:
            "Connection identifier is invalid",
        });
      }

      return next(error);
    }
  };

/*
 * Finds an accepted caretaker connection
 * and validates the requested permission.
 */
const findAuthorizedConnection =
  async (
    connectionId,
    caretakerId,
    permission
  ) => {
    const connection =
      await CaretakerConnection
        .findOne({
          _id: connectionId,
          caretaker: caretakerId,
          status: "accepted",
        })
        .populate(
          "patient",
          "fullName email profilePicture accountStatus"
        );

    if (!connection) {
      const error = new Error(
        "An accepted caretaker connection was not found"
      );

      error.statusCode = 404;
      throw error;
    }

    if (
      !connection.patient ||
      connection.patient.accountStatus !==
        "active"
    ) {
      const error = new Error(
        "The connected patient account is not available"
      );

      error.statusCode = 403;
      throw error;
    }

    if (
      !connection.permissions?.[
        permission
      ]
    ) {
      const error = new Error(
        "The patient has not granted permission to access this information"
      );

      error.statusCode = 403;
      throw error;
    }

    return connection;
  };

/*
 * Caretaker views assessments belonging
 * to an accepted connected patient.
 */
const getConnectedPatientAssessments =
  async (req, res, next) => {
    try {
      const connection =
        await findAuthorizedConnection(
          req.params.id,
          req.user._id,
          "viewAssessments"
        );

      const assessments =
        await Assessment.find({
          user: connection.patient._id,
        })
          .select(
            [
              "age",
              "gender",
              "tinnitus_type",
              "affected_ear",
              "frequency_hz",
              "loudness_db",
              "hearing_loss",
              "thi_score",
              "tfi_score",
              "hads_anxiety",
              "hads_depression",
              "sleep_score",
              "treatment",
              "outcome",
              "createdAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        patient: connection.patient,
        assessments,
      });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Connection identifier is invalid",
        });
      }

      if (error.statusCode) {
        return res
          .status(error.statusCode)
          .json({
            success: false,
            message: error.message,
          });
      }

      return next(error);
    }
  };

/*
 * Caretaker views appointment information
 * when permission has been granted.
 *
 * Meeting links are intentionally excluded.
 */
const getConnectedPatientAppointments =
  async (req, res, next) => {
    try {
      const connection =
        await findAuthorizedConnection(
          req.params.id,
          req.user._id,
          "viewAppointments"
        );

      const appointments =
        await Appointment.find({
          patient:
            connection.patient._id,
        })
          .select(
            [
              "doctor",
              "appointmentDate",
              "startTime",
              "endTime",
              "timezone",
              "consultationType",
              "patientMessage",
              "status",
              "doctorResponse",
              "cancellationReason",
              "requestedAt",
              "respondedAt",
              "cancelledAt",
              "completedAt",
              "createdAt",
            ].join(" ")
          )
          .populate(
            "doctor",
            "fullName profilePicture"
          )
          .sort({
            appointmentDate: -1,
            startTime: -1,
          });

      return res.status(200).json({
        success: true,
        patient: connection.patient,
        appointments,
      });
    } catch (error) {
      if (
        error instanceof
        mongoose.Error.CastError
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Connection identifier is invalid",
        });
      }

      if (error.statusCode) {
        return res
          .status(error.statusCode)
          .json({
            success: false,
            message: error.message,
          });
      }

      return next(error);
    }
  };

module.exports = {
  getCaretakerConnections,
  getConnectedPatientAppointments,
  getConnectedPatientAssessments,
  getPatientConnections,
  inviteCaretaker,
  respondToInvitation,
  revokeCaretakerConnection,
  updateCaretakerPermissions,
};