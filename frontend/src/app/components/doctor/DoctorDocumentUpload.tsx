"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  Send,
  Upload,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { doctorDocumentTranslations } from "../../../../lib/doctorDocumentTranslations";
import { authenticatedFetch } from "../../../../lib/authService";

type DocumentType =
  | "medical_registration"
  | "government_id"
  | "qualification_certificate";

type VerificationStatus =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

type UploadedDocument = {
  _id: string;
  documentType: DocumentType;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

type DoctorProfileResponse = {
  success: boolean;
  message?: string;
  profile?: {
    verificationStatus: VerificationStatus;
    documents: UploadedDocument[];
  } | null;
};

type UploadResponse = {
  success: boolean;
  message?: string;
  document?: UploadedDocument;
};

const DOCUMENT_TYPES: DocumentType[] = [
  "medical_registration",
  "government_id",
  "qualification_certificate",
];

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DoctorDocumentUpload() {
  const { language } = useLanguage();
  const text = doctorDocumentTranslations[language];

  const documents = useMemo(
    () => [
      {
        type: "medical_registration" as const,
        title: text.documents.medicalRegistration,
        description: text.documents.medicalRegistrationDescription,
      },
      {
        type: "government_id" as const,
        title: text.documents.governmentId,
        description: text.documents.governmentIdDescription,
      },
      {
        type: "qualification_certificate" as const,
        title: text.documents.qualificationCertificate,
        description: text.documents.qualificationCertificateDescription,
      },
    ],
    [text]
  );

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<DocumentType, File>>
  >({});
  const [demoConfirmed, setDemoConfirmed] = useState(false);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>("draft");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getApiUrl = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    if (!apiUrl) {
      throw new Error(text.apiNotConfigured);
    }

    return apiUrl;
  }, [text.apiNotConfigured]);

  useEffect(() => {
    const controller = new AbortController();

    const loadDocuments = async () => {
      try {
        setError("");

        const response = await authenticatedFetch(
          `${getApiUrl()}/api/doctor/application`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: DoctorProfileResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || text.unableToLoad);
        }

        if (data.profile) {
          setUploadedDocuments(data.profile.documents || []);
          setStatus(data.profile.verificationStatus);
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        console.error("Document loading error:", caughtError);
        setError(
          caughtError instanceof Error ? caughtError.message : text.unableToLoad
        );
      }
    };

    void loadDocuments();
    return () => controller.abort();
  }, [getApiUrl, text.unableToLoad]);

  const allDocumentsUploaded = useMemo(
    () =>
      DOCUMENT_TYPES.every((requiredType) =>
        uploadedDocuments.some(
          (uploaded) => uploaded.documentType === requiredType
        )
      ),
    [uploadedDocuments]
  );

  const selectFile = (documentType: DocumentType, file: File | undefined) => {
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFiles((current) => {
        const updated = { ...current };
        delete updated[documentType];
        return updated;
      });
      return;
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setError(text.invalidFileType);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(text.fileTooLarge);
      return;
    }

    setSelectedFiles((current) => ({ ...current, [documentType]: file }));
  };

  const uploadDocument = async (documentType: DocumentType) => {
    const selectedFile = selectedFiles[documentType];
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError(text.selectDocument);
      return;
    }

    if (!demoConfirmed) {
      setError(text.confirmSamples);
      return;
    }

    if (!ALLOWED_FILE_TYPES.has(selectedFile.type)) {
      setError(text.invalidFileType);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(text.fileTooLarge);
      return;
    }

    setUploadingType(documentType);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("documentType", documentType);
      formData.append("demoConfirmation", "true");

      const response = await authenticatedFetch(
        `${getApiUrl()}/api/doctor/application/documents`,
        { method: "POST", body: formData }
      );

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || text.unableToUpload);
      }

      if (!data.document) {
        throw new Error(text.missingUploadedDocument);
      }

      const savedDocument = data.document;
      setUploadedDocuments((current) => [
        ...current.filter((document) => document.documentType !== documentType),
        savedDocument,
      ]);
      setSelectedFiles((current) => {
        const updated = { ...current };
        delete updated[documentType];
        return updated;
      });
      setSuccess(text.uploadSuccess);
    } catch (caughtError) {
      console.error("Document upload error:", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : text.unableToUpload
      );
    } finally {
      setUploadingType(null);
    }
  };

  const submitApplication = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/doctor/application/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data: { success?: boolean; message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.message || text.unableToSubmit);
      }

      setStatus("pending");
      setSuccess(text.submitSuccess);
    } catch (caughtError) {
      console.error("Application submission error:", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : text.unableToSubmit
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formLocked = ["pending", "verified", "suspended"].includes(status);

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <FileCheck2 size={26} className="mt-0.5 text-cyan-700" />
        <div>
          <h2 className="text-xl font-bold">{text.heading}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {text.description}
          </p>
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <input
          type="checkbox"
          checked={demoConfirmed}
          onChange={(event) => setDemoConfirmed(event.target.checked)}
          disabled={formLocked}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm leading-6 text-red-700">
          {text.confirmation}
        </span>
      </label>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {documents.map((required) => {
          const uploaded = uploadedDocuments.find(
            (document) => document.documentType === required.type
          );
          const uploading = uploadingType === required.type;
          const selectedFile = selectedFiles[required.type];

          return (
            <div
              key={required.type}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="font-semibold">{required.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {required.description}
                  </p>

                  {selectedFile && (
                    <p className="mt-2 text-sm font-medium text-cyan-700">
                      {text.selected}: {selectedFile.name} (
                      {formatFileSize(selectedFile.size)})
                    </p>
                  )}

                  {uploaded && (
                    <p className="mt-2 text-sm font-medium text-emerald-700">
                      {text.uploaded}: {uploaded.originalName} (
                      {formatFileSize(uploaded.fileSize)})
                    </p>
                  )}
                </div>

                {!formLocked && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      disabled={uploading}
                      onChange={(event) =>
                        selectFile(required.type, event.target.files?.[0])
                      }
                      className="max-w-xs rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={uploading || !demoConfirmed || !selectedFile}
                      onClick={() => uploadDocument(required.type)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Upload size={17} />
                      )}
                      {uploading
                        ? text.uploading
                        : uploaded
                          ? text.replace
                          : text.upload}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!formLocked && (
        <button
          type="button"
          onClick={submitApplication}
          disabled={
            !allDocumentsUploaded || submitting || uploadingType !== null
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <LoaderCircle size={19} className="animate-spin" />
          ) : (
            <Send size={19} />
          )}
          {submitting ? text.submitting : text.submitForVerification}
        </button>
      )}
    </section>
  );
}
