const cors = require(
  "cors"
);

const helmet = require(
  "helmet"
);

const hpp = require(
  "hpp"
);

const {
  rateLimit,
} = require(
  "express-rate-limit"
);

const isProduction =
  process.env.NODE_ENV ===
  "production";

const normalizeOrigin = (
  value
) => {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return null;
  }

  const trimmedValue =
    value.trim();

  if (
    trimmedValue === "*"
  ) {
    throw new Error(
      "Wildcard CORS origins are not permitted"
    );
  }

  try {
    const url =
      new URL(
        trimmedValue
      );

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      throw new Error(
        "Unsupported origin protocol"
      );
    }

    /*
     * URL.origin removes trailing slashes and
     * paths, giving us a consistent comparison.
     */
    return url.origin;
  } catch {
    throw new Error(
      `Invalid frontend origin: ${trimmedValue}`
    );
  }
};

const configuredOrigins = [
  process.env.FRONTEND_URL,

  ...(
    process.env
      .FRONTEND_URLS || ""
  ).split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);

const developmentOrigins =
  isProduction
    ? []
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

const allowedOrigins =
  new Set([
    ...configuredOrigins,
    ...developmentOrigins,
  ]);

if (
  isProduction &&
  allowedOrigins.size === 0
) {
  throw new Error(
    "At least one production frontend origin must be configured"
  );
}

const corsMiddleware =
  cors({
    origin(
      origin,
      callback
    ) {
      /*
       * Requests without Origin include health
       * checks, mobile clients, Postman and
       * trusted server-to-server requests.
       *
       * They still require authentication on
       * protected routes.
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      let normalizedRequestOrigin;

      try {
        normalizedRequestOrigin =
          new URL(
            origin
          ).origin;
      } catch {
        const error =
          new Error(
            "Request origin is invalid"
          );

        error.statusCode =
          403;

        return callback(
          error
        );
      }

      if (
        allowedOrigins.has(
          normalizedRequestOrigin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      const error =
        new Error(
          "Origin is not allowed"
        );

      error.statusCode =
        403;

      return callback(
        error
      );
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

    exposedHeaders: [
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ],

    credentials: false,

    optionsSuccessStatus:
      204,

    maxAge: 86400,
  });

const helmetMiddleware =
  helmet({
    /*
     * The backend serves JSON APIs rather than
     * third-party browser resources.
     */
    crossOriginResourcePolicy: {
      policy:
        "same-site",
    },

    crossOriginOpenerPolicy: {
      policy:
        "same-origin",
    },

    referrerPolicy: {
      policy:
        "no-referrer",
    },

    contentSecurityPolicy: {
      directives: {
        defaultSrc: [
          "'none'",
        ],

        baseUri: [
          "'none'",
        ],

        frameAncestors: [
          "'none'",
        ],

        formAction: [
          "'none'",
        ],
      },
    },

    /*
     * Enable strict HTTPS enforcement only in
     * production. Render terminates HTTPS at
     * its trusted proxy.
     */
    strictTransportSecurity:
      isProduction
        ? {
            maxAge:
              31536000,

            includeSubDomains:
              true,

            preload:
              true,
          }
        : false,
  });

/*
 * Additional headers for sensitive API data.
 */
const sensitiveHeadersMiddleware =
  (
    req,
    res,
    next
  ) => {
    res.setHeader(
      "Cache-Control",
      "no-store, max-age=0"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    res.setHeader(
      "Expires",
      "0"
    );

    res.setHeader(
      "Permissions-Policy",
      [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "usb=()",
      ].join(", ")
    );

    return next();
  };

const createRateLimitHandler =
  (message) =>
  (
    req,
    res
  ) => {
    return res
      .status(429)
      .json({
        success: false,
        message,
      });
  };

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 300,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    statusCode: 429,

    passOnStoreError:
      false,

    handler:
      createRateLimitHandler(
        "Too many requests. Please wait and try again."
      ),
  });

const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    statusCode: 429,

    /*
     * Successful authentication should not
     * consume the failed-attempt allowance.
     */
    skipSuccessfulRequests:
      true,

    passOnStoreError:
      false,

    handler:
      createRateLimitHandler(
        "Too many authentication attempts. Please wait 15 minutes and try again."
      ),
  });

const passwordResetLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 5,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    statusCode: 429,

    /*
     * Successful requests are also counted to
     * prevent password-reset email flooding.
     */
    skipSuccessfulRequests:
      false,

    passOnStoreError:
      false,

    handler:
      createRateLimitHandler(
        "Too many password-reset requests. Please wait and try again."
      ),
  });

const hppMiddleware =
  hpp();

module.exports = {
  apiLimiter,
  authLimiter,
  corsMiddleware,
  helmetMiddleware,
  hppMiddleware,
  passwordResetLimiter,
  sensitiveHeadersMiddleware,
};