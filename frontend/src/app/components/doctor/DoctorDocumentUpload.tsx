"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  Send,
  Upload,
} from "lucide-react";

import {
  authenticatedFetch,
} from "../../../../lib/authService";

type DocumentType =
  | "medical_registration"
  | "government_id"
  | "qualification_certificate";

type UploadedDocument = {
  _id: string;
  documentType:
    DocumentType;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

type DoctorProfileResponse = {
  success: boolean;
  message?: string;

  profile?: {
    verificationStatus:
      | "draft"
      | "pending"
      | "verified"
      | "rejected"
      | "suspended";

    documents:
      UploadedDocument[];
  } | null;
};

const DOCUMENTS: Array<{
  type: DocumentType;
  title: string;
  description: string;
}> = [
  {
    type:
      "medical_registration",

    title:
      "Medical Registration",

    description:
      "Upload a fake sample registration certificate.",
  },

  {
    type:
      "government_id",

    title:
      "Government ID",

    description:
      "Upload a fake sample ID. Never upload a real Aadhaar card.",
  },

  {
    type:
      "qualification_certificate",

    title:
      "Qualification Certificate",

    description:
      "Upload a fake sample medical qualification certificate.",
  },
];

const formatFileSize = (
  bytes: number
) => {
  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.ceil(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

export default function DoctorDocumentUpload() {
  const [
    uploadedDocuments,
    setUploadedDocuments,
  ] =
    useState<
      UploadedDocument[]
    >([]);

  const [
    selectedFiles,
    setSelectedFiles,
  ] =
    useState<
      Partial<
        Record<
          DocumentType,
          File
        >
      >
    >({});

  const [
    demoConfirmed,
    setDemoConfirmed,
  ] =
    useState(false);

  const [
    uploadingType,
    setUploadingType,
  ] =
    useState<
      DocumentType | null
    >(null);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    status,
    setStatus,
  ] =
    useState<
      | "draft"
      | "pending"
      | "verified"
      | "rejected"
      | "suspended"
    >("draft");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const getApiUrl =
    () => {
      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL
          ?.replace(
            /\/+$/,
            ""
          );

      if (!apiUrl) {
        throw new Error(
          "Backend API URL is not configured"
        );
      }

      return apiUrl;
    };

  useEffect(() => {
    const loadDocuments =
      async () => {
        try {
          const response =
            await authenticatedFetch(
              `${getApiUrl()}/api/doctor/application`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const data: DoctorProfileResponse =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load documents"
            );
          }

          if (data.profile) {
            setUploadedDocuments(
              data.profile
                .documents ||
                []
            );

            setStatus(
              data.profile
                .verificationStatus
            );
          }
        } catch (
          caughtError
        ) {
          console.error(
            "Document loading error:",
            caughtError
          );

          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load documents"
          );
        }
      };

    loadDocuments();
  }, []);

  const allDocumentsUploaded =
    useMemo(
      () =>
        DOCUMENTS.every(
          (required) =>
            uploadedDocuments.some(
              (uploaded) =>
                uploaded
                  .documentType ===
                required.type
            )
        ),
      [
        uploadedDocuments,
      ]
    );

  const uploadDocument =
    async (
      documentType:
        DocumentType
    ) => {
      const file =
        selectedFiles[
          documentType
        ];

      setError("");
      setSuccess("");

      if (!file) {
        setError(
          "Select a sample document first."
        );

        return;
      }

      if (!demoConfirmed) {
        setError(
          "Confirm that all uploaded files are fake sample documents."
        );

        return;
      }

      setUploadingType(
        documentType
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "document",
          file
        );

        formData.append(
          "documentType",
          documentType
        );

        formData.append(
          "demoConfirmation",
          "true"
        );

        const response =
          await authenticatedFetch(
            `${getApiUrl()}/api/doctor/application/documents`,
            {
              method:
                "POST",

              body:
                formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to upload document"
          );
        }

        const savedDocument =
          data.document as
            UploadedDocument;

        setUploadedDocuments(
          (current) => [
            ...current.filter(
              (document) =>
                document
                  .documentType !==
                documentType
            ),

            savedDocument,
          ]
        );

        setSelectedFiles(
          (current) => {
            const updated = {
              ...current,
            };

            delete updated[
              documentType
            ];

            return updated;
          }
        );

        setSuccess(
          "Sample document uploaded successfully."
        );
      } catch (
        caughtError
      ) {
        console.error(
          "Document upload error:",
          caughtError
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to upload document"
        );
      } finally {
        setUploadingType(
          null
        );
      }
    };

  const submitApplication =
    async () => {
      setError("");
      setSuccess("");
      setSubmitting(true);

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl()}/api/doctor/application/submit`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {}
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to submit application"
          );
        }

        setStatus(
          "pending"
        );

        setSuccess(
          "Doctor application submitted for administrator verification."
        );
      } catch (
        caughtError
      ) {
        console.error(
          "Application submission error:",
          caughtError
        );

        setError(
          caughtError instanceof
            Error
              ? caughtError.message
              : "Unable to submit application"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  const formLocked =
    [
      "pending",
      "verified",
      "suspended",
    ].includes(status);

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <FileCheck2
          size={26}
          className="mt-0.5 text-cyan-700"
        />

        <div>
          <h2 className="text-xl font-bold">
            Verification Documents
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Development mode only:
            upload fake PDF, JPG or
            PNG samples up to 5 MB.
          </p>
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <input
          type="checkbox"
          checked={
            demoConfirmed
          }
          onChange={(
            event
          ) =>
            setDemoConfirmed(
              event.target
                .checked
            )
          }
          disabled={
            formLocked
          }
          className="mt-1 h-4 w-4"
        />

        <span className="text-sm leading-6 text-red-700">
          I confirm that these
          are fake sample files
          created only for project
          testing. They contain no
          real Aadhaar, government
          ID or medical certificate.
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2
            size={19}
          />

          {success}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {DOCUMENTS.map(
          (required) => {
            const uploaded =
              uploadedDocuments.find(
                (document) =>
                  document
                    .documentType ===
                  required.type
              );

            const uploading =
              uploadingType ===
              required.type;

            return (
              <div
                key={
                  required.type
                }
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold">
                      {
                        required.title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        required.description
                      }
                    </p>

                    {uploaded && (
                      <p className="mt-2 text-sm font-medium text-emerald-700">
                        Uploaded:{" "}
                        {
                          uploaded.originalName
                        }{" "}
                        (
                        {formatFileSize(
                          uploaded.fileSize
                        )}
                        )
                      </p>
                    )}
                  </div>

                  {!formLocked && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        disabled={
                          uploading
                        }
                        onChange={(
                          event
                        ) => {
                          const file =
                            event
                              .target
                              .files?.[0];

                          if (file) {
                            setSelectedFiles(
                              (
                                current
                              ) => ({
                                ...current,

                                [required.type]:
                                  file,
                              })
                            );
                          }
                        }}
                        className="max-w-xs rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        disabled={
                          uploading ||
                          !demoConfirmed
                        }
                        onClick={() =>
                          uploadDocument(
                            required.type
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {uploading ? (
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Upload
                            size={17}
                          />
                        )}

                        {uploaded
                          ? "Replace"
                          : "Upload"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {!formLocked && (
        <button
          type="button"
          onClick={
            submitApplication
          }
          disabled={
            !allDocumentsUploaded ||
            submitting
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          ) : (
            <Send
              size={19}
            />
          )}

          Submit for Verification
        </button>
      )}
    </section>
  );
}