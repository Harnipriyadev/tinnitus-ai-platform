const jwt = require(
  "jsonwebtoken"
);

const mongoose = require(
  "mongoose"
);

const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const VALID_ROLES =
  Object.freeze([
    "patient",
    "caretaker",
    "doctor",
    "admin",
  ]);

const MAX_TOKEN_LENGTH =
  8192;

const createAuthError = (
  message,
  statusCode = 401
) => {
  const error =
    new Error(
      message
    );

  error.statusCode =
    statusCode;

  return error;
};

const getBearerToken = (
  authorization
) => {
  if (
    typeof authorization !==
    "string"
  ) {
    return null;
  }

  /*
   * Accept only:
   * Authorization: Bearer <token>
   */
  const match =
    authorization.match(
      /^Bearer ([^\s]+)$/
    );

  if (!match) {
    return null;
  }

  const token =
    match[1];

  if (
    !token ||
    token.length >
      MAX_TOKEN_LENGTH
  ) {
    return null;
  }

  return token;
};

/*
 * Used only to choose the authentication
 * provider. This does not authenticate
 * the token.
 */
const getUnverifiedIssuer = (
  token
) => {
  try {
    const payload =
      jwt.decode(
        token
      );

    if (
      !payload ||
      typeof payload !==
        "object" ||
      typeof payload.iss !==
        "string"
    ) {
      return "";
    }

    return payload.iss;
  } catch {
    return "";
  }
};

const isFirebaseIssuer = (
  issuer
) =>
  issuer.startsWith(
    "https://securetoken.google.com/"
  );

const findActiveUser = async (
  query
) => {
  const user =
    await User.findOne(
      query
    ).select(
      "+firebaseUid +tokenVersion"
    );

  if (!user) {
    throw createAuthError(
      "User profile not found"
    );
  }

  if (
    user.accountStatus !==
    "active"
  ) {
    throw createAuthError(
      "User account is disabled",
      403
    );
  }

  if (
    !VALID_ROLES.includes(
      user.role
    )
  ) {
    throw createAuthError(
      "User account role is invalid",
      403
    );
  }

  return user;
};

const authenticateFirebaseToken =
  async (
    token
  ) => {
    /*
     * Passing true checks whether the
     * Firebase session has been revoked.
     */
    const decodedToken =
      await admin
        .auth()
        .verifyIdToken(
          token,
          true
        );

    if (
      !decodedToken.uid ||
      typeof decodedToken.uid !==
        "string"
    ) {
      throw createAuthError(
        "Firebase token is invalid"
      );
    }

    if (
      decodedToken
        .email_verified !==
      true
    ) {
      throw createAuthError(
        "Verify your email address before continuing",
        403
      );
    }

    if (
      typeof decodedToken.email !==
        "string" ||
      !decodedToken.email
        .trim()
    ) {
      throw createAuthError(
        "Firebase email information is missing"
      );
    }

    const user =
      await findActiveUser({
        firebaseUid:
          decodedToken.uid,
      });

    /*
     * Prevent access if the email in Firebase
     * no longer matches the MongoDB profile.
     */
    if (
      user.email
        .trim()
        .toLowerCase() !==
      decodedToken.email
        .trim()
        .toLowerCase()
    ) {
      throw createAuthError(
        "Authenticated account details do not match",
        403
      );
    }

    if (
      user.emailVerified !==
      true
    ) {
      throw createAuthError(
        "Your verified account profile has not been synchronized",
        403
      );
    }

    return {
      user,

      authType:
        "firebase",

      firebaseToken:
        decodedToken,
    };
  };

const authenticateLegacyToken =
  async (
    token
  ) => {
    /*
     * Legacy authentication must be
     * explicitly enabled.
     */
    if (
      process.env
        .ENABLE_LEGACY_AUTH !==
      "true"
    ) {
      throw createAuthError(
        "Legacy authentication is disabled"
      );
    }

    if (
      !process.env
        .JWT_SECRET ||
      process.env
        .JWT_SECRET.length <
        32
    ) {
      throw createAuthError(
        "Legacy authentication is unavailable"
      );
    }

    const verificationOptions = {
      algorithms: [
        "HS256",
      ],

      clockTolerance:
        5,

      maxAge:
        process.env
          .JWT_MAX_AGE ||
        "7d",
    };

    if (
      process.env
        .JWT_ISSUER
    ) {
      verificationOptions.issuer =
        process.env
          .JWT_ISSUER;
    }

    if (
      process.env
        .JWT_AUDIENCE
    ) {
      verificationOptions.audience =
        process.env
          .JWT_AUDIENCE;
    }

    const decoded =
      jwt.verify(
        token,
        process.env
          .JWT_SECRET,
        verificationOptions
      );

    if (
      !decoded ||
      typeof decoded !==
        "object"
    ) {
      throw createAuthError(
        "Legacy token payload is invalid"
      );
    }

    const userId =
      decoded.sub ||
      decoded.id;

    if (
      typeof userId !==
        "string" ||
      !mongoose
        .isValidObjectId(
          userId
        )
    ) {
      throw createAuthError(
        "Legacy token subject is invalid"
      );
    }

    /*
     * Legacy tokens must have both
     * issued-at and expiry claims.
     */
    if (
      !Number.isInteger(
        decoded.iat
      ) ||
      !Number.isInteger(
        decoded.exp
      )
    ) {
      throw createAuthError(
        "Legacy token lifetime is invalid"
      );
    }

    /*
     * tokenVersion is mandatory so sessions
     * can be revoked from the database.
     */
    if (
      !Number.isInteger(
        decoded.tokenVersion
      )
    ) {
      throw createAuthError(
        "Legacy token version is invalid"
      );
    }

    const user =
      await findActiveUser({
        _id:
          userId,
      });

    if (
      decoded.tokenVersion !==
      user.tokenVersion
    ) {
      throw createAuthError(
        "Login session has been revoked"
      );
    }

    if (
      user.emailVerified !==
      true
    ) {
      throw createAuthError(
        "Verify your email address before continuing",
        403
      );
    }

    return {
      user,

      authType:
        "legacy",

      legacyToken:
        decoded,
    };
  };

const protect = async (
  req,
  res,
  next
) => {
  const token =
    getBearerToken(
      req.headers
        .authorization
    );

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Authentication token is required",
      });
  }

  try {
    const issuer =
      getUnverifiedIssuer(
        token
      );

    let authentication;

    /*
     * Tokens claiming a Firebase issuer are
     * verified only through Firebase.
     *
     * They never fall back to legacy JWT
     * authentication.
     */
    if (
      isFirebaseIssuer(
        issuer
      )
    ) {
      authentication =
        await authenticateFirebaseToken(
          token
        );
    } else {
      authentication =
        await authenticateLegacyToken(
          token
        );
    }

    req.user =
      authentication.user;

    req.auth = {
      /*
       * authType is retained for compatibility
       * with the migration controller.
       */
      authType:
        authentication
          .authType,

      type:
        authentication
          .authType,

      firebaseToken:
        authentication
          .firebaseToken,

      legacyToken:
        authentication
          .legacyToken,
    };

    return next();
  } catch (
    error
  ) {
    const statusCode =
      error.statusCode ===
      403
        ? 403
        : 401;

    /*
     * Never print tokens or complete request
     * headers in application logs.
     */
    if (
      process.env
        .NODE_ENV !==
      "production"
    ) {
      console.error(
        "Authentication rejected:",
        {
          name:
            error?.name ||
            "AuthenticationError",

          code:
            error?.code ||
            "AUTH_REJECTED",

          message:
            error?.message ||
            "Unknown authentication error",
        }
      );
    }

    return res
      .status(
        statusCode
      )
      .json({
        success: false,

        message:
          statusCode ===
          403
            ? error.message
            : "Invalid or expired authentication token",
      });
  }
};

/*
 * General role-based authorization.
 *
 * This middleware must always be placed
 * after protect.
 */
const authorize =
  (
    ...allowedRoles
  ) => {
    const invalidRoles =
      allowedRoles.filter(
        (role) =>
          !VALID_ROLES.includes(
            role
          )
      );

    if (
      allowedRoles.length ===
        0 ||
      invalidRoles.length >
        0
    ) {
      throw new Error(
        "Authorization middleware contains an invalid role configuration"
      );
    }

    return (
      req,
      res,
      next
    ) => {
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
  };

/*
 * Protects features that are available only
 * to administrators who have completed the
 * doctor-verification process.
 *
 * Do not use this middleware on doctor
 * application and document-upload routes,
 * because pending doctors need access to
 * those routes.
 */
const requireVerifiedDoctor =
  (
    req,
    res,
    next
  ) => {
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
      req.user.role !==
      "doctor"
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "A doctor account is required",
        });
    }

    if (
      req.user
        .roleVerificationStatus !==
      "verified"
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "Doctor verification is required to access this feature",
        });
    }

    return next();
  };

module.exports =
  protect;

module.exports.authorize =
  authorize;

module.exports.requireVerifiedDoctor =
  requireVerifiedDoctor;

module.exports.VALID_ROLES =
  VALID_ROLES;