const crypto = require("node:crypto");

const AutomationRun = require(
  "../models/AutomationRun"
);

const INITIAL_STEPS = [
  {
    key: "received",
    label: "Assessment received",
  },
  {
    key: "analysed",
    label: "Severity analysed",
  },
  {
    key: "care_plan",
    label: "Personalised care plan created",
  },
  {
    key: "follow_up",
    label: "Follow-up action scheduled",
  },
  {
    key: "completed",
    label: "Care automation completed",
  },
];

const startCareAutomation =
  async ({
    userId,
    assessmentId,
    severity,
    risk,
  }) => {
    const workflowId =
      crypto.randomUUID();

    const run =
      await AutomationRun.create({
        workflowId,
        user: userId,
        assessment: assessmentId,
        severity,
        risk,
        steps:
          INITIAL_STEPS.map(
            (step) => ({
              ...step,
              status: "waiting",
            })
          ),
      });

    const webhookUrl =
      process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      run.status = "failed";
      run.errorMessage =
        "n8n webhook is not configured";
      await run.save();

      return run;
    }

    const backendUrl =
      process.env.PUBLIC_BACKEND_URL
        ?.replace(/\/+$/, "");

    if (!backendUrl) {
      run.status = "failed";
      run.errorMessage =
        "Public backend URL is not configured";
      await run.save();

      return run;
    }

    try {
      const response = await fetch(
        webhookUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "X-Aurisense-Webhook-Key":
              process.env
                .N8N_WEBHOOK_SECRET ||
              "",
          },
          body: JSON.stringify({
            workflowId,
            assessmentId:
              String(assessmentId),
            severity,
            risk,
            callbackUrl:
              `${backendUrl}/api/automation/callback`,
            callbackSecret:
              process.env
                .N8N_CALLBACK_SECRET ||
              "",
          }),
          signal:
            AbortSignal.timeout(
              8000
            ),
        }
      );

      if (!response.ok) {
        throw new Error(
          `n8n returned ${response.status}`
        );
      }

      run.status = "running";
      await run.save();
    } catch (error) {
      run.status = "failed";
      run.errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to start n8n workflow";
      await run.save();
    }

    return run;
  };

module.exports = {
  startCareAutomation,
};
