require("dotenv").config();

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

const {
  apiLimiter,
  corsMiddleware,
  helmetMiddleware,
  hppMiddleware,
} = require(
  "./middleware/securityMiddleware"
);

const {
  errorHandler,
  notFound,
} = require(
  "./middleware/errorMiddleware"
);

const app =
  express();

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
 * one proxy.
 */
app.set(
  "trust proxy",
  1
);

app.disable(
  "x-powered-by"
);

app.use(
  helmetMiddleware
);

app.use(
  corsMiddleware
);

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

app.use(
  hppMiddleware
);

/*
 * Health checks remain outside the API
 * rate limiter.
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
 * Apply rate limiting before mounting
 * every API route.
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

const startServer =
  async () => {
    try {
      await mongoose.connect(
        process.env.MONGO_URI,
        {
          serverSelectionTimeoutMS:
            10000,
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

      server =
        app.listen(
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
    signal
  ) => {
    console.log(
      `${signal} received. Shutting down.`
    );

    if (!server) {
      await mongoose
        .connection
        .close();

      process.exit(0);
    }

    server.close(
      async () => {
        await mongoose
          .connection
          .close();

        process.exit(0);
      }
    );

    setTimeout(
      () => {
        process.exit(1);
      },
      10000
    ).unref();
  };

process.on(
  "SIGTERM",
  () => {
    void shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    void shutdown(
      "SIGINT"
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
      "unhandledRejection"
    );
  }
);

startServer();