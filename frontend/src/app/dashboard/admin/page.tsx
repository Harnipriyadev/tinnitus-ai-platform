"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
  type AuthenticatedUser,
} from "../../../../lib/authService";

type DoctorUser = {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  roleVerificationStatus?: string;
};

type DoctorDocument = {
  _id?: string;
  documentType?: string;
  originalName?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type DoctorApplication = {
  _id: string;
  user: DoctorUser;
  medicalCouncil: string;
  registrationNumber: string;
  registrationYear: number;
  qualification: string;
  specialization: string;
  experienceYears: number;
  languages: string[];
  hospitalOrClinic?: string;
  professionalBio?: string;
  documents?: DoctorDocument[];
  status: "draft" | "pending" | "verified" | "rejected" | "suspended";
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  user?: AuthenticatedUser;
  applications?: T;
  application?: DoctorApplication;
};

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
};

const readJson = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed");
  }

  return data;
};

const formatDate = (value?: string) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const documentLabel = (type?: string) => {
  switch (type) {
    case "medical_registration":
      return "Medical Registration";
    case "government_id":
      return "Government ID";
    case "qualification_certificate":
      return "Qualification Certificate";
    default:
      return type?.replaceAll("_", " ") || "Document";
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AuthenticatedUser | null>(null);
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [selected, setSelected] = useState<DoctorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [officialRegisterChecked, setOfficialRegisterChecked] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const meResponse = await authenticatedFetch(
        `${getApiUrl()}/api/auth/me`,
        { cache: "no-store" }
      );

      const meData = await readJson<ApiResponse<never>>(meResponse);

      if (!meData.user || meData.user.role !== "admin") {
        router.replace("/login");
        return;
      }

      setAdmin(meData.user);

      const applicationsResponse = await authenticatedFetch(
        `${getApiUrl()}/api/admin/doctors?status=pending`,
        { cache: "no-store" }
      );

      const applicationsData = await readJson<ApiResponse<DoctorApplication[]>>(
        applicationsResponse
      );

      const pendingApplications = applicationsData.applications || [];
      setApplications(pendingApplications);

      setSelected((current) => {
        if (!current) return pendingApplications[0] || null;
        return (
          pendingApplications.find((item) => item._id === current._id) ||
          pendingApplications[0] ||
          null
        );
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the administrator dashboard";

      setError(message);

      if (/authenticated|token|session|permission/i.test(message)) {
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const reviewApplication = async (decision: "verified" | "rejected") => {
    if (!selected) return;

    setError("");
    setSuccess("");

    if (decision === "verified" && !officialRegisterChecked) {
      setError(
        "Check the doctor's registration in the official medical register before approving."
      );
      return;
    }

    if (decision === "rejected" && reviewNotes.trim().length < 5) {
      setError("Enter a clear rejection reason containing at least 5 characters.");
      return;
    }

    setReviewing(true);

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/admin/doctors/${selected._id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            rejectionReason: reviewNotes.trim(),
            officialRegisterChecked,
          }),
        }
      );

      await readJson<ApiResponse<never>>(response);

      setSuccess(
        decision === "verified"
          ? "Doctor application verified successfully."
          : "Doctor application rejected."
      );
      setReviewNotes("");
      setOfficialRegisterChecked(false);
      setSelected(null);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to review the doctor application"
      );
    } finally {
      setReviewing(false);
    }
  };

  if (loading && !admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <LoaderCircle className="animate-spin text-cyan-400" />
          Loading administrator dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">
              <ShieldCheck size={24} />
            </span>
            <div>
              <p className="font-bold">Tinnitus AI</p>
              <p className="text-xs text-slate-500">Administrator Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{admin?.fullName}</p>
              <p className="text-xs capitalize text-cyan-700">{admin?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-[#071b2d] p-7 text-white shadow-lg">
          <p className="text-sm font-semibold text-cyan-300">Main Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Doctor verification</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Review submitted doctor applications. Approval must be based on the
            uploaded documents and an independent check of the official medical register.
          </p>
        </section>

        {error && (
          <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="shrink-0" size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="shrink-0" size={20} />
            {success}
          </div>
        )}

        <section className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Clock3 className="text-amber-500" />
            <p className="mt-4 text-sm text-slate-500">Pending applications</p>
            <p className="mt-1 text-3xl font-bold">{applications.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Stethoscope className="text-cyan-600" />
            <p className="mt-4 text-sm text-slate-500">Selected specialization</p>
            <p className="mt-1 text-xl font-bold">{selected?.specialization || "None"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <UserRound className="text-violet-600" />
            <p className="mt-4 text-sm text-slate-500">Selected applicant</p>
            <p className="mt-1 truncate text-xl font-bold">{selected?.user?.fullName || "None"}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between px-2 py-2">
              <h2 className="font-bold">Pending doctors</h2>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                disabled={loading}
                aria-label="Refresh applications"
                className="rounded-lg p-2 text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="mt-2 space-y-3">
              {applications.map((application) => (
                <button
                  type="button"
                  key={application._id}
                  onClick={() => {
                    setSelected(application);
                    setReviewNotes("");
                    setOfficialRegisterChecked(false);
                    setError("");
                    setSuccess("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected?._id === application._id
                      ? "border-cyan-500 bg-cyan-50"
                      : "border-slate-200 hover:border-cyan-300"
                  }`}
                >
                  <p className="font-semibold">{application.user?.fullName || "Doctor applicant"}</p>
                  <p className="mt-1 text-sm text-slate-500">{application.specialization}</p>
                  <p className="mt-2 text-xs text-slate-400">Submitted {formatDate(application.submittedAt)}</p>
                </button>
              ))}

              {!loading && applications.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No pending doctor applications.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="flex min-h-80 items-center justify-center text-center text-slate-500">
                Select a pending doctor application to review it.
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-sm font-semibold text-cyan-700">Pending verification</p>
                  <h2 className="mt-1 text-2xl font-bold">{selected.user?.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.user?.email}</p>
                </div>

                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                  {[
                    ["Medical Council", selected.medicalCouncil],
                    ["Registration Number", selected.registrationNumber],
                    ["Registration Year", String(selected.registrationYear)],
                    ["Qualification", selected.qualification],
                    ["Specialization", selected.specialization],
                    ["Experience", `${selected.experienceYears} years`],
                    ["Languages", selected.languages?.join(", ") || "Not provided"],
                    ["Hospital or Clinic", selected.hospitalOrClinic || "Not provided"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="mt-2 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Professional Bio</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.professionalBio || "Not provided"}</p>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold">Submitted documents</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(selected.documents || []).map((document, index) => (
                      <div key={document._id || `${document.documentType}-${index}`} className="rounded-xl border border-slate-200 p-4">
                        <CheckCircle2 size={19} className="text-emerald-600" />
                        <p className="mt-3 text-sm font-semibold">{documentLabel(document.documentType)}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">{document.originalName || document.fileName || "Uploaded"}</p>
                      </div>
                    ))}
                  </div>
                  {(selected.documents || []).length === 0 && (
                    <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No document metadata was returned. Do not approve this application.</p>
                  )}
                </div>

                <div className="mt-7 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                  <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-cyan-950">
                    <input
                      type="checkbox"
                      checked={officialRegisterChecked}
                      onChange={(event) => setOfficialRegisterChecked(event.target.checked)}
                      disabled={reviewing}
                      className="mt-1 h-4 w-4 accent-cyan-600"
                    />
                    I independently checked this registration number in the official Medical Council register.
                  </label>

                  <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="review-notes">
                    Review notes
                  </label>
                  <textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    maxLength={1000}
                    disabled={reviewing}
                    placeholder="Record the verification result or explain why the application is rejected."
                    className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-cyan-500 disabled:opacity-60"
                  />

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void reviewApplication("rejected")}
                      disabled={reviewing}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={19} />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => void reviewApplication("verified")}
                      disabled={reviewing || !officialRegisterChecked}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewing ? <LoaderCircle size={19} className="animate-spin" /> : <ShieldCheck size={19} />}
                      Verify Doctor
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
