const crypto = require(
  "crypto"
);

const fs = require(
  "fs/promises"
);

const path = require(
  "path"
);

const DoctorProfile = require(
  "../models/DoctorProfile"
);

const ALLOWED_DOCUMENT_TYPES =
  new Set([
    "medical_registration",
    "government_id",
    "qualification_certificate",
  ]);

const FILE_EXTENSIONS = {
  "application/pdf":
    ".pdf",

  "image/jpeg":
    ".jpg",

  "image/png":
    ".png",
};

const PRIVATE_UPLOAD_ROOT =
  path.resolve(
    __dirname,
    "..",
    "private_uploads"
  );

const getAbsoluteStoragePath = (
  storageKey
) => {
  const absolutePath =
    path.resolve(
      PRIVATE_UPLOAD_ROOT,
      storageKey
    );

  /*
   * Prevent directory traversal.
   */
  if (
    !absolutePath.startsWith(
      `${PRIVATE_UPLOAD_ROOT}${path.sep}`
    )
  ) {
    throw new Error(
      "Invalid private storage path"
    );
  }

  return absolutePath;
};

const removeStoredFile =
  async (
    storageKey
  ) => {
    if (!storageKey) {
      return;
    }

    try {
      await fs.unlink(
        getAbsoluteStoragePath(
          storageKey
        )
      );
    } catch (error) {
      if (
        error.code !==
        "ENOENT"
      ) {
        console.error(
          "Unable to remove private doctor document:",
          error.message
        );
      }
    }
  };

const uploadDoctorDocument =
  async (
    req,
    res,
    next
  ) => {
    let newStorageKey =
      "";

    try {
      const {
        documentType,
        demoConfirmation,
      } = req.body;

      if (
        !ALLOWED_DOCUMENT_TYPES.has(
          documentType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Select a valid document type",
          });
      }

      /*
       * This local storage system is only
       * for fake/sample project documents.
       */
      if (
        demoConfirmation !==
        "true"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Confirm that this is a fake sample document for development",
          });
      }

      const profile =
        await DoctorProfile
          .findOne({
            user:
              req.user._id,
          })
          .select(
            "+documents.storageKey"
          );

      if (!profile) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Save the doctor application before uploading documents",
          });
      }

      if (
        ![
          "draft",
          "rejected",
        ].includes(
          profile
            .verificationStatus
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Documents cannot be changed while the application is under review",
          });
      }

      const extension =
        FILE_EXTENSIONS[
          req.file.mimetype
        ];

      const userDirectory =
        path.join(
          "doctor-verification",
          String(
            req.user._id
          )
        );

      const fileName =
        `${crypto.randomUUID()}${extension}`;

      newStorageKey =
        path.join(
          userDirectory,
          fileName
        );

      const absolutePath =
        getAbsoluteStoragePath(
          newStorageKey
        );

      await fs.mkdir(
        path.dirname(
          absolutePath
        ),
        {
          recursive: true,
        }
      );

      /*
       * Local file permissions allow only the
       * backend process owner to read/write it.
       */
      await fs.writeFile(
        absolutePath,
        req.file.buffer,
        {
          mode: 0o600,
          flag: "wx",
        }
      );

      const existingDocument =
        profile.documents.find(
          (document) =>
            document
              .documentType ===
            documentType
        );

      const previousStorageKey =
        existingDocument
          ?.storageKey;

      const safeOriginalName =
        path
          .basename(
            req.file
              .originalname
          )
          .replace(
            /[^A-Za-z0-9._ -]/g,
            "_"
          )
          .slice(
            0,
            255
          );

      if (
        existingDocument
      ) {
        existingDocument.storageKey =
          newStorageKey;

        existingDocument.originalName =
          safeOriginalName;

        existingDocument.mimeType =
          req.file.mimetype;

        existingDocument.fileSize =
          req.file.size;

        existingDocument.uploadedAt =
          new Date();
      } else {
        profile.documents.push({
          documentType,

          storageKey:
            newStorageKey,

          originalName:
            safeOriginalName,

          mimeType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          uploadedAt:
            new Date(),
        });
      }

      await profile.save();

      /*
       * Delete the replaced file only after
       * MongoDB successfully saves the new one.
       */
      if (
        previousStorageKey &&
        previousStorageKey !==
          newStorageKey
      ) {
        await removeStoredFile(
          previousStorageKey
        );
      }

      const savedDocument =
        profile.documents.find(
          (document) =>
            document
              .documentType ===
            documentType
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Sample document uploaded successfully",

          document: {
            _id:
              savedDocument
                ._id,

            documentType:
              savedDocument
                .documentType,

            originalName:
              savedDocument
                .originalName,

            mimeType:
              savedDocument
                .mimeType,

            fileSize:
              savedDocument
                .fileSize,

            uploadedAt:
              savedDocument
                .uploadedAt,
          },
        });
    } catch (error) {
      /*
       * Remove a newly written file if the
       * database operation fails.
       */
      if (
        newStorageKey
      ) {
        await removeStoredFile(
          newStorageKey
        );
      }

      return next(error);
    }
  };

module.exports = {
  uploadDoctorDocument,
};