const isProduction =
  process.env.NODE_ENV ===
  "production";

const notFound = (
  req,
  res
) => {
  return res
    .status(404)
    .json({
      success: false,
      message:
        "API endpoint not found",
    });
};

const getValidStatusCode = (
  error,
  responseStatus
) => {
  const candidate =
    Number(
      error.statusCode ||
        error.status ||
        responseStatus
    );

  if (
    Number.isInteger(
      candidate
    ) &&
    candidate >= 400 &&
    candidate <= 599
  ) {
    return candidate;
  }

  return 500;
};

const errorHandler = (
  error,
  req,
  res,
  next
) => {
  /*
   * Delegate to Express if a response has
   * already started.
   */
  if (res.headersSent) {
    return next(error);
  }

  let statusCode =
    getValidStatusCode(
      error,
      res.statusCode
    );

  let message =
    statusCode >= 500
      ? "An unexpected server error occurred"
      : error.message ||
        "The request could not be completed";

  /*
   * Malformed JSON body.
   */
  if (
    error instanceof
      SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    statusCode = 400;
    message =
      "Invalid JSON request";
  }

  /*
   * Request body exceeded Express limit.
   */
  if (
    error.type ===
      "entity.too.large" ||
    error.status === 413
  ) {
    statusCode = 413;
    message =
      "Request payload is too large";
  }

  /*
   * Mongoose validation errors.
   */
  if (
    error.name ===
    "ValidationError"
  ) {
    statusCode = 400;
    message =
      "Submitted data is invalid";
  }

  /*
   * Invalid MongoDB ObjectId.
   */
  if (
    error.name ===
    "CastError"
  ) {
    statusCode = 400;
    message =
      "Invalid resource identifier";
  }

  /*
   * MongoDB unique-index conflict.
   */
  if (
    error.code === 11000
  ) {
    statusCode = 409;
    message =
      "A resource with this information already exists";
  }

  /*
   * JWT failures must never expose token
   * parsing or signature details.
   */
  if (
    [
      "JsonWebTokenError",
      "TokenExpiredError",
      "NotBeforeError",
    ].includes(
      error.name
    )
  ) {
    statusCode = 401;
    message =
      "Invalid or expired authentication token";
  }

  /*
   * Firebase authentication failures.
   */
  if (
    typeof error.code ===
      "string" &&
    (
      error.code.startsWith(
        "auth/"
      ) ||
      error.code ===
        "app/invalid-credential"
    )
  ) {
    statusCode = 401;
    message =
      "Firebase authentication failed";
  }

  /*
   * Multer upload errors.
   */
  if (
    error.name ===
    "MulterError"
  ) {
    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      statusCode = 413;
      message =
        "Uploaded file is too large";
    } else {
      statusCode = 400;
      message =
        "File upload request is invalid";
    }
  }

  /*
   * Database availability failures.
   */
  if (
    [
      "MongoNetworkError",
      "MongoServerSelectionError",
      "MongooseServerSelectionError",
    ].includes(
      error.name
    )
  ) {
    statusCode = 503;
    message =
      "The database service is temporarily unavailable";
  }

  /*
   * Never expose internal messages for
   * server-side failures.
   */
  if (statusCode >= 500) {
    message =
      statusCode === 503
        ? message
        : "An unexpected server error occurred";
  }

  /*
   * Log only controlled diagnostic fields.
   * Never log request bodies, authorization
   * headers, passwords, tokens or patient data.
   */
  if (
    !isProduction ||
    statusCode >= 500
  ) {
    console.error(
      "Request processing error:",
      {
        name:
          error.name ||
          "Error",

        code:
          error.code ||
          "UNSPECIFIED_ERROR",

        statusCode,

        message:
          error.message ||
          "No error message",

        /*
         * Stack remains server-side and is
         * printed only during development.
         */
        ...(!isProduction &&
        error.stack
          ? {
              stack:
                error.stack,
            }
          : {}),
      }
    );
  }

  /*
   * Stack traces and internal objects are
   * never returned to the client.
   */
  return res
    .status(statusCode)
    .json({
      success: false,
      message,
    });
};

module.exports = {
  errorHandler,
  notFound,
};