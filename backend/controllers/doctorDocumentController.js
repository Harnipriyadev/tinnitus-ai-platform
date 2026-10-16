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

const FILE_EXTENSIONS =
  Object.freeze({
    "application/pdf":
      ".pdf",

    "image/jpeg":
      ".jpg",

    "image/png":
      ".png",
  });

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const PRIVATE_UPLOAD_ROOT =
  path.resolve(
    __dirname,
    "..",
    "private_uploads"
  );

/*
 * Storage keys use forward slashes in MongoDB
 * so they work across Windows and Linux.
 */
const normalizeStorageKey = (
  storageKey
) => {
  if (
    typeof storageKey !==
      "string" ||
    !storageKey.trim()
  ) {
    throw new Error(
      "Invalid private storage key"
    );
  }

  const normalizedKey =
    storageKey
      .replace(
        /\\/g,
        "/"
      )
      .replace(
        /^\/+/,
        ""
      );

  const segments =
    normalizedKey.split(
      "/"
    );

  if (
    segments.length < 2 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(
          segment
        )
    )
  ) {
    throw new Error(
      "Invalid private storage key"
    );
  }

  return segments.join(
    "/"
  );
};

const getAbsoluteStoragePath = (
  storageKey
) => {
  const normalizedKey =
    normalizeStorageKey(
      storageKey
    );

  const absolutePath =
    path.resolve(
      PRIVATE_UPLOAD_ROOT,
      ...normalizedKey.split(
        "/"
      )
    );

  const relativePath =
    path.relative(
      PRIVATE_UPLOAD_ROOT,
      absolutePath
    );

  /*
   * Prevent absolute-path and directory-
   * traversal attacks.
   */
  if (
    !relativePath ||
    relativePath.startsWith(
      ".."
    ) ||
    path.isAbsolute(
      relativePath
    )
  ) {
    throw new Error(
      "Invalid private storage path"
    );
  }

  return absolutePath;
};

const clearFileBuffer = (
  file
) => {
  if (
    file &&
    Buffer.isBuffer(
      file.buffer
    )
  ) {
    /*
     * Reduce the time sensitive file content
     * remains available in process memory.
     */
    file.buffer.fill(0);
    file.buffer =
      undefined;
  }
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
          "Private document cleanup failed:",
          {
            name:
              error.name ||
              "Error",

            code:
              error.code ||
              "FILE_DELETE_ERROR",
          }
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
    let newStorageKey = "";

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
        clearFileBuffer(
          req.file
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Select a valid document type",
          });
      }

      /*
       * Local storage is permitted only for
       * fake project demonstration files.
       */
      if (
        demoConfirmation !==
        "true"
      ) {
        clearFileBuffer(
          req.file
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Confirm that this is a fake sample document for development",
          });
      }

      if (
        !req.file ||
        !Buffer.isBuffer(
          req.file.buffer
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A valid document file is required",
          });
      }

      if (
        req.file.size < 100 ||
        req.file.size >
          MAX_FILE_SIZE ||
        req.file.buffer.length !==
          req.file.size
      ) {
        clearFileBuffer(
          req.file
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Uploaded document size is invalid",
          });
      }

      const extension =
        FILE_EXTENSIONS[
          req.file
            .mimetype
        ];

      if (!extension) {
        clearFileBuffer(
          req.file
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Uploaded document type is not supported",
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
        clearFileBuffer(
          req.file
        );

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
        clearFileBuffer(
          req.file
        );

        return res
          .status(409)
          .json({
            success: false,

            message:
              "Documents cannot be changed while the application is under review",
          });
      }

      const userDirectory =
        [
          "doctor-verification",
          String(
            req.user._id
          ),
        ].join("/");

      /*
       * Prefer the random storage name created
       * by the upload middleware, but regenerate
       * it if its format does not match.
       */
      const proposedStorageName =
        req.file
          .storageName;

      const fileName =
        typeof proposedStorageName ===
          "string" &&
        new RegExp(
          `^[0-9a-f-]{36}\\${extension}$`,
          "i"
        ).test(
          proposedStorageName
        )
          ? proposedStorageName
          : `${crypto.randomUUID()}${extension}`;

      newStorageKey =
        normalizeStorageKey(
          `${userDirectory}/${fileName}`
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
          mode: 0o700,
        }
      );

      /*
       * wx prevents accidental overwriting.
       * 0600 allows only the backend process
       * owner to read and write the file.
       */
      await fs.writeFile(
        absolutePath,
        req.file.buffer,
        {
          mode: 0o600,
          flag: "wx",
        }
      );

      clearFileBuffer(
        req.file
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
              .originalname ||
              `document${extension}`
          )
          .normalize(
            "NFKC"
          )
          .replace(
            /[\u0000-\u001f\u007f]/g,
            ""
          )
          .replace(
            /[^A-Za-z0-9._ -]/g,
            "_"
          )
          .trim()
          .slice(
            0,
            120
          ) ||
        `document${extension}`;

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
       * Delete an older file only after the new
       * metadata has been saved successfully.
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
      clearFileBuffer(
        req.file
      );

      /*
       * Remove the new file if saving its
       * MongoDB metadata fails.
       */
      if (newStorageKey) {
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