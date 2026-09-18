const jwt = require("jsonwebtoken");

const User = require("../models/User");
const admin = require("../config/firebaseAdmin");

const VALID_ROLES = [
  "patient",
  "caretaker",
  "doctor",
  "admin",
];

const getBearerToken = (
  authorization
) => {
  if (
    typeof authorization !==
      "string" ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token = authorization
    .slice(7)
    .trim();

  if (
    !token ||
    token.length > 10000
  ) {
    return null;
  }

  return token;
};

const findActiveUser = async (
  query
) => {
  const user = await User.findOne(
    query
  ).select(
    "+firebaseUid +tokenVersion"
  );

  if (!user) {
    const error = new Error(
      "User profile not found"
    );

    error.statusCode = 401;
    throw error;
  }

  if (
    user.accountStatus !==
    "active"
  ) {
    const error = new Error(
      "User account is disabled"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
   * Protect against old or invalid roles.
   */
  if (
    !VALID_ROLES.includes(
      user.role
    )
  ) {
    const error = new Error(
      "User account role is invalid"
    );

    error.statusCode = 403;
    throw error;
  }

  return user;
};

const authenticateFirebaseToken =
  async (token) => {
    /*
     * `true` checks whether Firebase
     * has revoked the token.
     */
    const decodedToken =
      await admin
        .auth()
        .verifyIdToken(
          token,
          true
        );

    /*
     * Reject unverified Firebase accounts
     * at the backend level.
     */
    if (
      decodedToken.email_verified !==
      true
    ) {
      const error = new Error(
        "Verify your email address before continuing"
      );

      error.statusCode = 403;
      throw error;
    }

    const user =
      await findActiveUser({
        firebaseUid:
          decodedToken.uid,
      });

    if (
      user.emailVerified !== true
    ) {
      const error = new Error(
        "Your verified account profile has not been synchronized"
      );

      error.statusCode = 403;
      throw error;
    }

    return {
      user,
      authType: "firebase",
      firebaseToken:
        decodedToken,
    };
  };

const authenticateLegacyToken =
  async (token) => {
    if (
      !process.env.JWT_SECRET
    ) {
      const error = new Error(
        "Legacy authentication is unavailable"
      );

      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const userId =
      decoded.sub || decoded.id;

    if (!userId) {
      const error = new Error(
        "Invalid legacy token"
      );

      error.statusCode = 401;
      throw error;
    }

    const user =
      await findActiveUser({
        _id: userId,
      });

    if (
      decoded.tokenVersion !==
        undefined &&
      decoded.tokenVersion !==
        user.tokenVersion
    ) {
      const error = new Error(
        "Login session has been revoked"
      );

      error.statusCode = 401;
      throw error;
    }

    /*
     * Legacy accounts must also have
     * a verified email.
     */
    if (
      user.emailVerified !== true
    ) {
      const error = new Error(
        "Verify your email address before continuing"
      );

      error.statusCode = 403;
      throw error;
    }

    return {
      user,
      authType: "legacy",
      legacyToken: decoded,
    };
  };

const protect = async (
  req,
  res,
  next
) => {
  const token = getBearerToken(
    req.headers.authorization
  );

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication token is required",
    });
  }

  try {
    /*
     * Firebase is the primary
     * authentication system.
     */
    try {
      const authentication =
        await authenticateFirebaseToken(
          token
        );

      req.user =
        authentication.user;

      req.auth =
        authentication;

      return next();
    } catch (firebaseError) {
      /*
       * Preserve security errors instead
       * of attempting legacy authentication.
       */
      if (
        firebaseError.statusCode ===
        403
      ) {
        throw firebaseError;
      }
    }

    /*
     * Temporary fallback for accounts
     * still using the legacy JWT system.
     */
    const authentication =
      await authenticateLegacyToken(
        token
      );

    req.user =
      authentication.user;

    req.auth =
      authentication;

    return next();
  } catch (error) {
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "Authentication rejected:",
        error.message
      );
    }

    const statusCode =
      error.statusCode === 403
        ? 403
        : 401;

    return res
      .status(statusCode)
      .json({
        success: false,

        message:
          statusCode === 403
            ? error.message
            : "Invalid or expired authentication token",
      });
  }
};

/*
 * Use only after `protect`.
 *
 * Example:
 * router.get(
 *   "/doctor",
 *   protect,
 *   authorize("doctor", "admin"),
 *   controller
 * );
 */
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication is required",
        });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "You do not have permission to perform this action",
        });
    }

    return next();
  };

module.exports = protect;
module.exports.authorize =
  authorize;
module.exports.VALID_ROLES =
  VALID_ROLES;