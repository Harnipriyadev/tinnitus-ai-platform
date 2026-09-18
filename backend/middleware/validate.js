const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields = result.error.issues.map(
        (issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })
      );

      return res.status(400).json({
        success: false,
        message: "Please correct the submitted information",
        fields,
      });
    }

    req.body = result.data;

    return next();
  };
};

module.exports = {
  validateBody,
};