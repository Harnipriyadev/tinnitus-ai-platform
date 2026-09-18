const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
};

const errorHandler = (error, req, res, next) => {
  let statusCode =
    error.statusCode ||
    (res.statusCode >= 400 ? res.statusCode : 500);

  let message =
    statusCode === 500
      ? "An unexpected server error occurred"
      : error.message;

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    statusCode = 400;
    message = "Invalid JSON request";
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Submitted data is invalid";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "An account with this information already exists";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  } else if (statusCode >= 500) {
    console.error("Server error:", {
      name: error.name,
      message: error.message,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: error.stack,
    }),
  });
};

module.exports = {
  errorHandler,
  notFound,
};