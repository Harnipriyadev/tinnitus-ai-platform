const express = require("express");
const {
  spawn,
} = require("child_process");

const Assessment = require(
  "../models/Assessment"
);

const protect = require(
  "../middleware/authMiddleware"
);

const {
  authorize,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

/*
 * GET the logged-in patient's dashboard.
 *
 * Doctors and caretakers must not access this
 * route directly. Separate consent-protected
 * routes will be created for them later.
 */
router.get(
  "/dashboard",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const assessments =
        await Assessment.find({
          user: req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(10);

      return res
        .status(200)
        .json({
          success: true,

          user: {
            _id:
              req.user._id,

            fullName:
              req.user.fullName,

            email:
              req.user.email,

            role:
              req.user.role,
          },

          latestAssessment:
            assessments.length > 0
              ? assessments[0]
              : null,

          assessments,
        });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load dashboard data",
        });
    }
  }
);

/*
 * CREATE an assessment for the
 * currently authenticated patient.
 */
router.post(
  "/",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const python = spawn(
        "python",
        [
          "predict.py",
          JSON.stringify(
            req.body
          ),
        ],
        {
          cwd: "./ml",
        }
      );

      let predictionOutput =
        "";

      let errorOutput =
        "";

      let processFinished =
        false;

      python.stdout.on(
        "data",
        (data) => {
          predictionOutput +=
            data.toString();
        }
      );

      python.stderr.on(
        "data",
        (data) => {
          errorOutput +=
            data.toString();
        }
      );

      python.on(
        "error",
        (error) => {
          console.error(
            "Unable to start Python:",
            error
          );

          if (
            !processFinished &&
            !res.headersSent
          ) {
            processFinished =
              true;

            return res
              .status(500)
              .json({
                success: false,
                message:
                  "Unable to start prediction service",
              });
          }
        }
      );

      python.on(
        "close",
        async (code) => {
          if (processFinished) {
            return;
          }

          processFinished =
            true;

          if (code !== 0) {
            console.error(
              "Python prediction error:",
              errorOutput
            );

            if (
              !res.headersSent
            ) {
              return res
                .status(500)
                .json({
                  success:
                    false,

                  message:
                    "Prediction failed",
                });
            }

            return;
          }

          try {
            const cleanedPrediction =
              predictionOutput.trim();

            let parsedPrediction;

            try {
              parsedPrediction =
                JSON.parse(
                  cleanedPrediction
                );
            } catch {
              parsedPrediction =
                cleanedPrediction;
            }

            /*
             * user is assigned from the verified
             * account, never from req.body.
             */
            const assessment =
              await Assessment.create(
                {
                  ...req.body,

                  user:
                    req.user._id,

                  outcome:
                    cleanedPrediction,
                }
              );

            return res
              .status(201)
              .json({
                success: true,

                prediction:
                  parsedPrediction,

                assessment,
              });
          } catch (
            databaseError
          ) {
            console.error(
              "Assessment database error:",
              databaseError
            );

            if (
              !res.headersSent
            ) {
              return res
                .status(500)
                .json({
                  success:
                    false,

                  message:
                    "Unable to save assessment",
                });
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "Assessment error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Server error",
        });
    }
  }
);

module.exports = router;