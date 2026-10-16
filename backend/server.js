/*
 * Use reliable public DNS servers for
 * MongoDB Atlas SRV record resolution.
 */
const dns = require(
  "node:dns"
);

dns.setDefaultResultOrder(
  "ipv4first"
);

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

require(
  "dotenv"
).config();

const express = require(
  "express"
);

const mongoose = require(
  "mongoose"
);

const adminRoutes = require(
  "./routes/adminRoutes"
);

const appointmentRoutes = require(
  "./routes/appointmentRoutes"
);

const assessmentRoutes = require(
  "./routes/assessmentRoutes"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const assistantRoutes = require(
  "./routes/assistantRoutes"
);

const caretakerRoutes = require(
  "./routes/caretakerRoutes"
);

const doctorRoutes = require(
  "./routes/doctorRoutes"
);

const consultationRoutes = require(
  "./routes/consultationRoutes"
);

const prescriptionRoutes = require(
  "./routes/prescriptionRoutes"
);

const {
  apiLimiter,
  corsMiddleware,
  helmetMiddleware,
  hppMiddleware,
  sensitiveHeadersMiddleware,
} = require(
  "./middleware/securityMiddleware"
);

const {
  errorHandler,
  notFound,
} = require(
  "./middleware/errorMiddleware"
);

const {
  rejectDangerousInput,
} = require(
  "./middleware/validate"
);

const app = express();

const PORT =
  Number(
    process.env.PORT
  ) || 5000;

if (
  !process.env.MONGO_URI
) {
  throw new Error(
    "MONGO_URI is not configured"
  );
}

/*
 * Render forwards requests through
 * one trusted proxy.
 */
app.set(
  "trust proxy",
  1
);

/*
 * Do not reveal Express in response headers.
 */
app.disable(
  "x-powered-by"
);

/*
 * Apply secure HTTP response headers.
 */
app.use(
  helmetMiddleware
);

app.use(
  sensitiveHeadersMiddleware
);

/*
 * Allow browser requests only from
 * configured frontend origins.
 */
app.use(
  corsMiddleware
);

/*
 * Parse JSON and form bodies with strict
 * request-size limits.
 */
app.use(
  express.json({
    limit: "25kb",
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "25kb",
  })
);

/*
 * Reject MongoDB operators, dotted keys,
 * excessive nesting and prototype-pollution
 * properties.
 */
app.use(
  rejectDangerousInput
);

/*
 * Prevent HTTP parameter pollution.
 */
app.use(
  hppMiddleware
);

/*
 * Health checks remain outside the API
 * rate limiter for Render monitoring.
 */
app.get(
  "/health",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        status:
          "healthy",

        timestamp:
          new Date()
            .toISOString(),
      });
  }
);

app.get(
  "/",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        message:
          "AI Tinnitus Backend Running",
      });
  }
);

/*
 * Apply general rate limiting before
 * mounting every API route.
 */
app.use(
  "/api",
  apiLimiter
);

/*
 * Authentication routes.
 */
app.use(
  "/api/auth",
  authRoutes
);

/*
 * Patient assessment routes.
 */
app.use(
  "/api/assessment",
  assessmentRoutes
);

/*
 * Administrator routes.
 */
app.use(
  "/api/admin",
  adminRoutes
);

/*
 * Doctor application and availability routes.
 */
app.use(
  "/api/doctor",
  doctorRoutes
);

/*
 * Patient and doctor appointment routes.
 */
app.use(
  "/api/appointments",
  appointmentRoutes
);

/*
 * Doctor and patient consultation routes.
 */
app.use(
  "/api/consultations",
  consultationRoutes
);

/*
 * Electronic prescription routes.
 */
app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

/*
 * Patient and caretaker connection routes.
 */
app.use(
  "/api/caretaker",
  caretakerRoutes
);

/*
 * AI assistant routes.
 */
app.use(
  "/api/assistant",
  assistantRoutes
);

/*
 * These handlers must remain after
 * every application route.
 */
app.use(
  notFound
);

app.use(
  errorHandler
);

let server;
let isShuttingDown = false;

const startServer =
  async () => {
    try {
      await mongoose.connect(
        process.env.MONGO_URI,
        {
          serverSelectionTimeoutMS:
            10000,

          family: 4,
        }
      );

      console.log(
        "MongoDB connected"
      );

      console.log(
        "Connected database:",
        mongoose.connection
          .name
      );

      server = app.listen(
        PORT,
        () => {
          console.log(
            `Server listening on port ${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "Server startup failed:",

        error instanceof Error
          ? error.message
          : "Unknown startup error"
      );

      process.exit(1);
    }
  };

const shutdown =
  async (
    signal,
    exitCode = 0
  ) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(
      `${signal} received. Shutting down.`
    );

    const forceExitTimer =
      setTimeout(
        () => {
          console.error(
            `${signal} shutdown timed out`
          );

          process.exit(1);
        },
        10000
      );

    forceExitTimer.unref();

    try {
      /*
       * Stop accepting new requests and allow
       * active requests to finish.
       */
      if (server) {
        await new Promise(
          (resolve) => {
            server.close(
              resolve
            );
          }
        );
      }

      /*
       * Close MongoDB cleanly.
       */
      if (
        mongoose.connection
          .readyState !== 0
      ) {
        await mongoose
          .connection
          .close();
      }

      clearTimeout(
        forceExitTimer
      );

      process.exit(
        exitCode
      );
    } catch (error) {
      console.error(
        "Shutdown failed:",

        error instanceof Error
          ? error.message
          : "Unknown shutdown error"
      );

      process.exit(1);
    }
  };

process.on(
  "SIGTERM",
  () => {
    void shutdown(
      "SIGTERM",
      0
    );
  }
);

process.on(
  "SIGINT",
  () => {
    void shutdown(
      "SIGINT",
      0
    );
  }
);

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled promise rejection:",

      error instanceof Error
        ? error.message
        : "Unknown rejection"
    );

    void shutdown(
      "unhandledRejection",
      1
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",

      error instanceof Error
        ? error.message
        : "Unknown exception"
    );

    void shutdown(
      "uncaughtException",
      1
    );
  }
);

void startServer();