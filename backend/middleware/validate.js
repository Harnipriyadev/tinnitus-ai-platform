const UNSAFE_KEYS =
  new Set([
    "__proto__",
    "prototype",
    "constructor",
  ]);

const MAX_OBJECT_DEPTH = 12;
const MAX_OBJECT_NODES = 1000;
const MAX_VALIDATION_ERRORS = 20;

const inspectInput = (
  value,
  state,
  depth = 0
) => {
  if (
    value === null ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  if (
    depth >
    MAX_OBJECT_DEPTH
  ) {
    return "Request structure is too deeply nested";
  }

  if (
    state.visited.has(
      value
    )
  ) {
    return null;
  }

  state.visited.add(
    value
  );

  state.nodes += 1;

  if (
    state.nodes >
    MAX_OBJECT_NODES
  ) {
    return "Request contains too many nested values";
  }

  if (Array.isArray(value)) {
    for (
      const item of value
    ) {
      const problem =
        inspectInput(
          item,
          state,
          depth + 1
        );

      if (problem) {
        return problem;
      }
    }

    return null;
  }

  const keys =
    Object.getOwnPropertyNames(
      value
    );

  for (
    const key of keys
  ) {
    /*
     * Reject MongoDB operators such as:
     * $ne, $gt, $where and $regex.
     */
    if (
      key.startsWith("$")
    ) {
      return "Request contains an unsafe database operator";
    }

    /*
     * Reject MongoDB dotted-property
     * injection such as profile.role.
     */
    if (
      key.includes(".")
    ) {
      return "Request contains an unsafe property name";
    }

    /*
     * Block prototype-pollution keys.
     */
    if (
      UNSAFE_KEYS.has(
        key
      )
    ) {
      return "Request contains an unsafe property name";
    }

    const problem =
      inspectInput(
        value[key],
        state,
        depth + 1
      );

    if (problem) {
      return problem;
    }
  }

  return null;
};

/*
 * Globally rejects dangerous request body
 * and query-string structures.
 *
 * This middleware should run after the
 * Express body parsers and before routes.
 */
const rejectDangerousInput =
  (
    req,
    res,
    next
  ) => {
    try {
      const state = {
        visited:
          new WeakSet(),

        nodes: 0,
      };

      const bodyProblem =
        inspectInput(
          req.body,
          state
        );

      if (bodyProblem) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              bodyProblem,
          });
      }

      const queryProblem =
        inspectInput(
          req.query,
          state
        );

      if (queryProblem) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              queryProblem,
          });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

/*
 * Validates and replaces the request body
 * with Zod's parsed and normalized result.
 */
const validateBody =
  (schema) => {
    if (
      !schema ||
      typeof schema.safeParse !==
        "function"
    ) {
      throw new TypeError(
        "validateBody requires a valid Zod schema"
      );
    }

    return (
      req,
      res,
      next
    ) => {
      try {
        const result =
          schema.safeParse(
            req.body
          );

        if (
          !result.success
        ) {
          const fields =
            result.error.issues
              .slice(
                0,
                MAX_VALIDATION_ERRORS
              )
              .map(
                (issue) => ({
                  field:
                    issue.path
                      .map(String)
                      .join(".") ||
                    "request",

                  message:
                    issue.message,
                })
              );

          return res
            .status(400)
            .json({
              success: false,

              message:
                "Please correct the submitted information",

              fields,
            });
        }

        /*
         * Controllers receive only validated
         * and normalized data.
         */
        req.body =
          result.data;

        return next();
      } catch (error) {
        return next(error);
      }
    };
  };

module.exports = {
  rejectDangerousInput,
  validateBody,
};