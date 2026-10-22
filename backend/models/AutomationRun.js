const mongoose = require("mongoose");

const automationStepSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: [
          "waiting",
          "processing",
          "completed",
          "attention",
          "failed",
        ],
        required: true,
      },
      message: {
        type: String,
        default: "",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const automationRunSchema =
  new mongoose.Schema(
    {
      workflowId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
        required: true,
      },
      severity: {
        type: String,
        required: true,
      },
      risk: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        enum: [
          "queued",
          "running",
          "completed",
          "failed",
        ],
        default: "queued",
        index: true,
      },
      recommendedAction: {
        type: String,
        default: "",
      },
      followUpDays: {
        type: Number,
        default: null,
      },
      steps: {
        type: [
          automationStepSchema,
        ],
        default: [],
      },
      errorMessage: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "AutomationRun",
  automationRunSchema
);
