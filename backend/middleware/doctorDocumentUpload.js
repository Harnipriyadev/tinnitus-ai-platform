const crypto = require(
  "crypto"
);

const path = require(
  "path"
);

const multer = require(
  "multer"
);

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const MIN_FILE_SIZE =
  100;

const MAX_IMAGE_WIDTH =
  12000;

const MAX_IMAGE_HEIGHT =
  12000;

const MAX_IMAGE_PIXELS =
  40_000_000;

const ALLOWED_FIELDS =
  new Set([
    "documentType",
    "demoConfirmation",
  ]);

const FILE_CONFIG = {
  "application/pdf": {
    extension: ".pdf",
  },

  "image/jpeg": {
    extension: ".jpg",
  },

  "image/png": {
    extension: ".png",
  },
};

const ALLOWED_MIME_TYPES =
  new Set(
    Object.keys(
      FILE_CONFIG
    )
  );

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        MAX_FILE_SIZE,

      /*
       * Only one uploaded document is allowed.
       */
      files:
        1,

      /*
       * documentType and demoConfirmation.
       */
      fields:
        2,

      /*
       * One file plus two text fields.
       * Keep one additional part available so
       * the parser does not reject the request
       * when it reaches the exact boundary.
       */
      parts:
        4,

      fieldNameSize:
        50,

      fieldSize:
        500,

      headerPairs:
        50,
    },

    fileFilter(
      req,
      file,
      callback
    ) {
      const mimeType =
        file.mimetype
          ?.trim()
          .toLowerCase();

      if (
        !mimeType ||
        !ALLOWED_MIME_TYPES.has(
          mimeType
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

const sanitizeOriginalName = (
  originalName,
  extension
) => {
  const baseName =
    path
      .basename(
        originalName ||
          "document"
      )
      .normalize(
        "NFKC"
      )
      .replace(
        /[\u0000-\u001f\u007f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._ -]/g,
        "_"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .slice(
        0,
        100
      );

  const nameWithoutExtension =
    path
      .parse(
        baseName
      )
      .name
      .replace(
        /^\.+/,
        ""
      )
      .slice(
        0,
        80
      ) ||
    "document";

  return `${nameWithoutExtension}${extension}`;
};

const validatePdf = (
  buffer
) => {
  if (
    buffer.length <
    MIN_FILE_SIZE
  ) {
    return false;
  }

  if (
    buffer
      .subarray(
        0,
        5
      )
      .toString(
        "ascii"
      ) !==
    "%PDF-"
  ) {
    return false;
  }

  /*
   * A valid PDF normally contains an EOF
   * marker near the end of the file.
   */
  const ending =
    buffer
      .subarray(
        Math.max(
          0,
          buffer.length -
            2048
        )
      )
      .toString(
        "latin1"
      );

  if (
    !ending.includes(
      "%%EOF"
    )
  ) {
    return false;
  }

  /*
   * Defense-in-depth checks against active
   * PDF features. Production systems should
   * also use dedicated malware scanning.
   */
  const pdfText =
    buffer.toString(
      "latin1"
    );

  const unsafePdfPatterns = [
    /\/JavaScript\b/i,
    /\/JS\b/i,
    /\/Launch\b/i,
    /\/EmbeddedFile\b/i,
    /\/OpenAction\b/i,
    /\/RichMedia\b/i,
    /\/XFA\b/i,
    /\/Encrypt\b/i,
  ];

  return !unsafePdfPatterns.some(
    (pattern) =>
      pattern.test(
        pdfText
      )
  );
};

const validatePng = (
  buffer
) => {
  if (
    buffer.length <
    33
  ) {
    return false;
  }

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

  const hasSignature =
    pngSignature.every(
      (
        byte,
        index
      ) =>
        buffer[index] ===
        byte
    );

  if (!hasSignature) {
    return false;
  }

  /*
   * PNG files must begin with the
   * IHDR chunk.
   */
  if (
    buffer
      .subarray(
        12,
        16
      )
      .toString(
        "ascii"
      ) !==
    "IHDR"
  ) {
    return false;
  }

  const width =
    buffer.readUInt32BE(
      16
    );

  const height =
    buffer.readUInt32BE(
      20
    );

  if (
    width < 1 ||
    height < 1 ||
    width >
      MAX_IMAGE_WIDTH ||
    height >
      MAX_IMAGE_HEIGHT ||
    width * height >
      MAX_IMAGE_PIXELS
  ) {
    return false;
  }

  /*
   * Require a correctly positioned
   * PNG IEND chunk.
   */
  if (
    buffer.length <
      12 ||
    buffer.readUInt32BE(
      buffer.length -
        12
    ) !== 0 ||
    buffer
      .subarray(
        buffer.length -
          8,
        buffer.length -
          4
      )
      .toString(
        "ascii"
      ) !==
      "IEND"
  ) {
    return false;
  }

  return true;
};

const getJpegDimensions = (
  buffer
) => {
  let offset =
    2;

  const startOfFrameMarkers =
    new Set([
      0xc0,
      0xc1,
      0xc2,
      0xc3,
      0xc5,
      0xc6,
      0xc7,
      0xc9,
      0xca,
      0xcb,
      0xcd,
      0xce,
      0xcf,
    ]);

  while (
    offset <
    buffer.length -
      9
  ) {
    if (
      buffer[offset] !==
      0xff
    ) {
      offset +=
        1;

      continue;
    }

    const marker =
      buffer[
        offset +
          1
      ];

    offset +=
      2;

    if (
      marker ===
        0xd8 ||
      marker ===
        0xd9 ||
      marker ===
        0x01
    ) {
      continue;
    }

    if (
      marker ===
      0xda
    ) {
      break;
    }

    if (
      offset +
        2 >
      buffer.length
    ) {
      return null;
    }

    const segmentLength =
      buffer.readUInt16BE(
        offset
      );

    if (
      segmentLength <
        2 ||
      offset +
        segmentLength >
        buffer.length
    ) {
      return null;
    }

    if (
      startOfFrameMarkers.has(
        marker
      )
    ) {
      if (
        segmentLength <
        7
      ) {
        return null;
      }

      return {
        height:
          buffer.readUInt16BE(
            offset +
              3
          ),

        width:
          buffer.readUInt16BE(
            offset +
              5
          ),
      };
    }

    offset +=
      segmentLength;
  }

  return null;
};

const validateJpeg = (
  buffer
) => {
  if (
    buffer.length <
    MIN_FILE_SIZE
  ) {
    return false;
  }

  if (
    buffer[0] !==
      0xff ||
    buffer[1] !==
      0xd8 ||
    buffer[2] !==
      0xff
  ) {
    return false;
  }

  /*
   * Require the JPEG end-of-image marker.
   * This also rejects data appended after
   * the image.
   */
  if (
    buffer[
      buffer.length -
        2
    ] !==
      0xff ||
    buffer[
      buffer.length -
        1
    ] !==
      0xd9
  ) {
    return false;
  }

  const dimensions =
    getJpegDimensions(
      buffer
    );

  if (!dimensions) {
    return false;
  }

  const {
    width,
    height,
  } =
    dimensions;

  if (
    width < 1 ||
    height < 1 ||
    width >
      MAX_IMAGE_WIDTH ||
    height >
      MAX_IMAGE_HEIGHT ||
    width * height >
      MAX_IMAGE_PIXELS
  ) {
    return false;
  }

  return true;
};

const hasValidFileContent = (
  file
) => {
  const buffer =
    file.buffer;

  if (
    !Buffer.isBuffer(
      buffer
    ) ||
    buffer.length <
      MIN_FILE_SIZE ||
    buffer.length >
      MAX_FILE_SIZE
  ) {
    return false;
  }

  switch (
    file.mimetype
  ) {
    case "application/pdf":
      return validatePdf(
        buffer
      );

    case "image/jpeg":
      return validateJpeg(
        buffer
      );

    case "image/png":
      return validatePng(
        buffer
      );

    default:
      return false;
  }
};

const hasSafeMultipartFields = (
  body
) => {
  if (
    !body ||
    typeof body !==
      "object" ||
    Array.isArray(
      body
    )
  ) {
    return false;
  }

  const fieldNames =
    Object.keys(
      body
    );

  return fieldNames.every(
    (key) =>
      ALLOWED_FIELDS.has(
        key
      ) &&
      !key.startsWith(
        "$"
      ) &&
      !key.includes(
        "."
      ) &&
      key !==
        "__proto__" &&
      key !==
        "prototype" &&
      key !==
        "constructor"
  );
};

const handleMulterError = (
  error,
  res
) => {
  /*
   * Log the exact code on the backend so
   * development errors are easy to diagnose.
   */
  console.error(
    "Multer upload error:",
    {
      code:
        error.code,

      field:
        error.field,

      message:
        error.message,
    }
  );

  switch (
    error.code
  ) {
    case "LIMIT_FILE_SIZE":
      return res
        .status(413)
        .json({
          success: false,

          message:
            "Document must be 5 MB or smaller",
        });

    case "LIMIT_FILE_COUNT":
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Only one document may be uploaded",
        });

    case "LIMIT_UNEXPECTED_FILE":
      return res
        .status(400)
        .json({
          success: false,

          message:
            `Unexpected upload field: ${
              error.field ||
              "unknown"
            }. The required file field is document.`,
        });

    case "LIMIT_FIELD_COUNT":
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Too many document form fields were submitted",
        });

    case "LIMIT_PART_COUNT":
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Too many multipart form sections were submitted",
        });

    case "LIMIT_FIELD_KEY":
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A document form field name is too long",
        });

    case "LIMIT_FIELD_VALUE":
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A document form field value is too long",
        });

    default:
      return res
        .status(400)
        .json({
          success: false,

          message:
            process.env
              .NODE_ENV ===
            "production"
              ? "Document upload is invalid"
              : `Document upload is invalid: ${error.code}`,
        });
  }
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
          return handleMulterError(
            error,
            res
          );
        }

        if (error) {
          console.error(
            "Document upload rejected:",
            error.message
          );

          return res
            .status(400)
            .json({
              success: false,

              message:
                error.message ||
                "Unable to upload document",
            });
        }

        if (
          !hasSafeMultipartFields(
            req.body
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Document upload contains unexpected fields",
            });
        }

        if (
          req.body
            .documentType ===
            undefined ||
          req.body
            .demoConfirmation ===
            undefined
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Document type and demo confirmation are required",
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

        req.file.mimetype =
          req.file.mimetype
            .trim()
            .toLowerCase();

        if (
          !hasValidFileContent(
            req.file
          )
        ) {
          req.file.buffer =
            undefined;

          return res
            .status(400)
            .json({
              success: false,

              message:
                "The uploaded file is invalid or its content does not match its file type",
            });
        }

        const fileConfiguration =
          FILE_CONFIG[
            req.file
              .mimetype
          ];

        if (
          !fileConfiguration
        ) {
          req.file.buffer =
            undefined;

          return res
            .status(400)
            .json({
              success: false,

              message:
                "The uploaded document type is not supported",
            });
        }

        const extension =
          fileConfiguration
            .extension;

        req.file.originalname =
          sanitizeOriginalName(
            req.file
              .originalname,
            extension
          );

        /*
         * Controllers and storage services
         * must use storageName instead of
         * trusting the user-supplied name.
         */
        req.file.storageName =
          `${crypto.randomUUID()}${extension}`;

        return next();
      }
    );
  };

module.exports = {
  uploadDoctorDocument,
};