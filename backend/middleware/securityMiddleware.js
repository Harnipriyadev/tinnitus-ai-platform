const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const { rateLimit } = require("express-rate-limit");

const productionOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || "").split(","),
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const developmentOrigins = [
  "http://localhost:3000",
];

const allowedOrigins = new Set([
  ...productionOrigins,
  ...(process.env.NODE_ENV === "production"
    ? []
    : developmentOrigins),
]);

const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests without an Origin header, such as
    // Render health checks and server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const error = new Error("Origin is not allowed");
    error.statusCode = 403;

    return callback(error);
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: false,
  maxAge: 86400,
});

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please wait and try again.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please wait 15 minutes and try again.",
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many password-reset requests. Please wait and try again.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  corsMiddleware,
  helmetMiddleware,
  hppMiddleware: hpp(),
  passwordResetLimiter,
};