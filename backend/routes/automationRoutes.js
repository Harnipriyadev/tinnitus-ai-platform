const express = require("express");

const AutomationRun = require(
  "../models/AutomationRun"
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

const ALLOWED_STEP_KEYS =
  new Set([
    "received",
    "analysed",
    "care_plan",
    "follow_up",
    "completed",
  ]);

const ALLOWED_STATUSES =
  new Set([
    "waiting",
    "processing",
    "completed",
    "attention",
    "failed",
  ]);

router.post(
  "/callback",
  async (req, res, next) => {
    try {
      const suppliedSecret =
        req.get(
          "X-Aurisense-Callback-Secret"
        );

      if (
        !process.env
          .N8N_CALLBACK_SECRET ||
        suppliedSecret !==
          process.env
            .N8N_CALLBACK_SECRET
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid automation callback",
          });
      }

      const {
        workflowId,
        step,
        stepStatus,
        message = "",
        recommendedAction = "",
        followUpDays = null,
        workflowStatus,
      } = req.body;

      if (
        typeof workflowId !==
          "string" ||
        !ALLOWED_STEP_KEYS.has(
          step
        ) ||
        !ALLOWED_STATUSES.has(
          stepStatus
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid automation update",
          });
      }

      const run =
        await AutomationRun.findOne({
          workflowId,
        });

      if (!run) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Automation run not found",
          });
      }

      const targetStep =
        run.steps.find(
          (item) =>
            item.key === step
        );

      targetStep.status =
        stepStatus;
      targetStep.message =
        String(message).slice(
          0,
          500
        );
      targetStep.updatedAt =
        new Date();

      if (recommendedAction) {
        run.recommendedAction =
          String(
            recommendedAction
          ).slice(0, 500);
      }

      if (
        Number.isInteger(
          followUpDays
        ) &&
        followUpDays >= 0 &&
        followUpDays <= 365
      ) {
        run.followUpDays =
          followUpDays;
      }

      if (
        [
          "running",
          "completed",
          "failed",
        ].includes(
          workflowStatus
        )
      ) {
        run.status =
          workflowStatus;
      }

      await run.save();

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:workflowId",
  protect,
  authorize("patient"),
  async (req, res, next) => {
    try {
      const run =
        await AutomationRun.findOne({
          workflowId:
            req.params.workflowId,
          user: req.user._id,
        }).select(
          "-user -__v"
        );

      if (!run) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Automation run not found",
          });
      }

      return res.status(200).json({
        success: true,
        automation: run,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
