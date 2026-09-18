const multer = require(
  "multer"
);

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]);

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        MAX_FILE_SIZE,

      files:
        1,

      fields:
        5,
    },

    fileFilter(
      req,
      file,
      callback
    ) {
      if (
        !ALLOWED_MIME_TYPES.has(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Only PDF, JPG and PNG files are allowed"
          )
        );
      }

      return callback(
        null,
        true
      );
    },
  });

const hasValidSignature = (
  file
) => {
  const buffer =
    file.buffer;

  if (
    !buffer ||
    buffer.length < 8
  ) {
    return false;
  }

  if (
    file.mimetype ===
    "application/pdf"
  ) {
    return (
      buffer
        .subarray(0, 5)
        .toString() ===
      "%PDF-"
    );
  }

  if (
    file.mimetype ===
    "image/jpeg"
  ) {
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (
    file.mimetype ===
    "image/png"
  ) {
    const pngSignature = [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ];

    return pngSignature.every(
      (
        byte,
        index
      ) =>
        buffer[index] ===
        byte
    );
  }

  return false;
};

const uploadDoctorDocument =
  (
    req,
    res,
    next
  ) => {
    upload.single(
      "document"
    )(
      req,
      res,
      (error) => {
        if (
          error instanceof
          multer.MulterError
        ) {
          if (
            error.code ===
            "LIMIT_FILE_SIZE"
          ) {
            return res
              .status(413)
              .json({
                success: false,
                message:
                  "Document must be 5 MB or smaller",
              });
          }

          return res
            .status(400)
            .json({
              success: false,
              message:
                "Document upload is invalid",
            });
        }

        if (error) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                error.message ||
                "Unable to upload document",
            });
        }

        if (!req.file) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Select a document to upload",
            });
        }

        /*
         * MIME type can be falsified, so verify
         * the real file signature as well.
         */
        if (
          !hasValidSignature(
            req.file
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "The uploaded file content does not match its file type",
            });
        }

        return next();
      }
    );
  };

module.exports = {
  uploadDoctorDocument,
};