const express = require("express");
const { spawn } = require("child_process");

const Assessment = require("../models/Assessment");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET logged-in user's dashboard data
router.get("/dashboard", protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,

      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
      },

      latestAssessment:
        assessments.length > 0 ? assessments[0] : null,

      assessments,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard data",
    });
  }
});

// CREATE a new assessment for the logged-in user
router.post("/", protect, async (req, res) => {
  console.log("Assessment received from:", req.user.email);

  try {
    const python = spawn(
      "python",
      ["predict.py", JSON.stringify(req.body)],
      {
        cwd: "./ml",
      }
    );

    let predictionOutput = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      predictionOutput += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("error", (error) => {
      console.error("Unable to start Python:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Unable to start prediction service",
        });
      }
    });

    python.on("close", async (code) => {
      if (code !== 0) {
        console.error("Python error:", errorOutput);

        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Prediction failed",
            error: errorOutput,
          });
        }

        return;
      }

      try {
        const cleanedPrediction = predictionOutput.trim();

        let parsedPrediction;

        try {
          parsedPrediction = JSON.parse(cleanedPrediction);
        } catch {
          parsedPrediction = cleanedPrediction;
        }

        const assessment = await Assessment.create({
          ...req.body,
          user: req.user._id,
          outcome: cleanedPrediction,
        });

        return res.status(201).json({
          success: true,
          prediction: parsedPrediction,
          assessment,
        });
      } catch (databaseError) {
        console.error("Assessment database error:", databaseError);

        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Unable to save assessment",
          });
        }
      }
    });
  } catch (error) {
    console.error("Assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;