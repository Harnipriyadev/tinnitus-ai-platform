const mongoose = require(
  "mongoose"
);

const DoctorProfile = require(
  "../models/DoctorProfile"
);

const User = require(
  "../models/User"
);

/*
 * Lists doctor applications using the selected
 * verification status. Pending is the default.
 */
const listDoctorApplications =
  async (
    req,
    res,
    next
  ) => {
    try {
      const status =
        req.query.status ||
        "pending";

      const allowedStatuses = [
        "draft",
        "pending",
        "verified",
        "rejected",
        "suspended",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid verification status",
          });
      }

      const applications =
        await DoctorProfile
          .find({
            verificationStatus:
              status,
          })
          .populate(
            "user",
            "fullName email profilePicture role accountStatus roleVerificationStatus"
          )
          .sort({
            submittedAt: 1,
            createdAt: 1,
          });

      return res
        .status(200)
        .json({
          success: true,
          applications,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Returns one doctor application.
 * This route must remain protected by admin
 * authorization in adminRoutes.js.
 */
const getDoctorApplication =
  async (
    req,
    res,
    next
  ) => {
    try {
      const application =
        await DoctorProfile
          .findById(
            req.params.id
          )
          .populate(
            "user",
            "fullName email profilePicture role accountStatus roleVerificationStatus"
          );

      if (!application) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Doctor application was not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          application,
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
              "Doctor application identifier is invalid",
          });
      }

      return next(error);
    }
  };

/*
 * Reviews one pending doctor application.
 *
 * This version does not use MongoDB transactions,
 * so it works with both standalone MongoDB and
 * MongoDB Atlas.
 */
const reviewDoctorApplication =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        decision,
        rejectionReason,
        officialRegisterChecked,
      } = req.body;

      /*
       * Load protected review fields explicitly.
       */
      const application =
        await DoctorProfile
          .findById(
            req.params.id
          )
          .select(
            "+officialRegisterChecked +reviewedBy"
          );

      if (!application) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Doctor application was not found",
          });
      }

      /*
       * Reviewed applications cannot be reviewed
       * again using this endpoint.
       */
      if (
        application
          .verificationStatus !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Only pending applications can be reviewed",
          });
      }

      /*
       * Confirm that the application still belongs
       * to an active doctor account.
       */
      const doctorUser =
        await User.findOne({
          _id:
            application.user,

          role:
            "doctor",

          accountStatus:
            "active",
        });

      if (!doctorUser) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "The connected active doctor account was not found",
          });
      }

      const reviewedAt =
        new Date();

      /*
       * Including verificationStatus in the query
       * prevents simultaneous duplicate reviews.
       */
      const reviewedApplication =
        await DoctorProfile
          .findOneAndUpdate(
            {
              _id:
                application._id,

              verificationStatus:
                "pending",
            },
            {
              $set: {
                verificationStatus:
                  decision,

                officialRegisterChecked,

                reviewedBy:
                  req.user._id,

                reviewedAt,

                rejectionReason:
                  decision ===
                  "rejected"
                    ? rejectionReason
                    : "",
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

      if (!reviewedApplication) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This doctor application has already been reviewed",
          });
      }

      try {
        /*
         * Synchronize the verification status on
         * the connected User document.
         */
        doctorUser.roleVerificationStatus =
          decision;

        doctorUser.roleVerificationUpdatedAt =
          reviewedAt;

        await doctorUser.save();
      } catch (userUpdateError) {
        /*
         * Best-effort rollback:
         * if the User update fails, restore the
         * doctor application to pending.
         */
        await DoctorProfile
          .updateOne(
            {
              _id:
                reviewedApplication._id,

              reviewedAt,
            },
            {
              $set: {
                verificationStatus:
                  "pending",

                officialRegisterChecked:
                  false,

                rejectionReason:
                  "",
              },

              $unset: {
                reviewedBy: "",
                reviewedAt: "",
              },
            }
          )
          .catch(
            (
              rollbackError
            ) => {
              console.error(
                "Doctor review rollback failed:",
                rollbackError.message
              );
            }
          );

        throw userUpdateError;
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            decision ===
            "verified"
              ? "Doctor application approved"
              : "Doctor application rejected",

          application:
            reviewedApplication,
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
              "Doctor application identifier is invalid",
          });
      }

      return next(error);
    }
  };

module.exports = {
  getDoctorApplication,
  listDoctorApplications,
  reviewDoctorApplication,
};