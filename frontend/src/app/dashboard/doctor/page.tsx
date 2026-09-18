"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  BrainCircuit,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  Save,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import DoctorDocumentUpload from "../../components/doctor/DoctorDocumentUpload";
import DoctorAvailability from "../../components/doctor/DoctorAvailability";
import DoctorAppointments from "../../components/doctor/DoctorAppointments";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../../lib/authService";

type VerificationStatus =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

type DoctorProfile = {
  _id: string;
  medicalCouncil: string;
  registrationNumber: string;
  registrationYear: number;
  qualification: string;
  specialization: string;
  experienceYears: number;
  consultationLanguages: string[];
  hospitalOrClinic: string;
  professionalBio: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  profile?: DoctorProfile | null;
};

type ApplicationForm = {
  medicalCouncil: string;
  registrationNumber: string;
  registrationYear: string;
  qualification: string;
  specialization: string;
  experienceYears: string;
  consultationLanguages: string;
  hospitalOrClinic: string;
  professionalBio: string;
};

const INITIAL_FORM: ApplicationForm = {
  medicalCouncil: "",
  registrationNumber: "",
  registrationYear: "",
  qualification: "",
  specialization: "",
  experienceYears: "",
  consultationLanguages:
    "English",
  hospitalOrClinic: "",
  professionalBio: "",
};

export default function DoctorDashboardPage() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<ApplicationForm>(
      INITIAL_FORM
    );

  const [
    status,
    setStatus,
  ] =
    useState<VerificationStatus>(
      "draft"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

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

  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState("");

  const getApiUrl = () => {
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
    const controller =
      new AbortController();

    const loadApplication =
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

                signal:
                  controller.signal,
              }
            );

          const data: ProfileResponse =
            await response.json();

          if (!response.ok) {
            if (
              response.status ===
                401 ||
              response.status ===
                403
            ) {
              await logoutUser();

              router.replace(
                "/login"
              );

              return;
            }

            throw new Error(
              data.message ||
                "Unable to load doctor application"
            );
          }

          if (data.profile) {
            const profile =
              data.profile;

            setForm({
              medicalCouncil:
                profile
                  .medicalCouncil,

              registrationNumber:
                profile
                  .registrationNumber,

              registrationYear:
                String(
                  profile
                    .registrationYear
                ),

              qualification:
                profile
                  .qualification,

              specialization:
                profile
                  .specialization,

              experienceYears:
                String(
                  profile
                    .experienceYears
                ),

              consultationLanguages:
                profile
                  .consultationLanguages
                  .join(", "),

              hospitalOrClinic:
                profile
                  .hospitalOrClinic ||
                "",

              professionalBio:
                profile
                  .professionalBio ||
                "",
            });

            setStatus(
              profile
                .verificationStatus
            );

            setRejectionReason(
              profile
                .rejectionReason ||
                ""
            );
          }
        } catch (
          caughtError
        ) {
          if (
            caughtError instanceof
              DOMException &&
            caughtError.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "Doctor dashboard error:",
            caughtError
          );

          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load doctor application"
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    loadApplication();

    return () => {
      controller.abort();
    };
  }, [router]);

  const updateField = (
    field:
      keyof ApplicationForm,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");
      setSaving(true);

      try {
        const languages =
          form
            .consultationLanguages
            .split(",")
            .map(
              (language) =>
                language.trim()
            )
            .filter(Boolean);

        const response =
          await authenticatedFetch(
            `${getApiUrl()}/api/doctor/application`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  medicalCouncil:
                    form
                      .medicalCouncil,

                  registrationNumber:
                    form
                      .registrationNumber,

                  registrationYear:
                    Number(
                      form
                        .registrationYear
                    ),

                  qualification:
                    form
                      .qualification,

                  specialization:
                    form
                      .specialization,

                  experienceYears:
                    Number(
                      form
                        .experienceYears
                    ),

                  consultationLanguages:
                    languages,

                  hospitalOrClinic:
                    form
                      .hospitalOrClinic,

                  professionalBio:
                    form
                      .professionalBio,
                }),
            }
          );

        const data: ProfileResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to save doctor application"
          );
        }

        setStatus(
          data.profile
            ?.verificationStatus ||
            "draft"
        );

        setSuccess(
          "Doctor application draft saved successfully."
        );
      } catch (
        caughtError
      ) {
        console.error(
          "Doctor application error:",
          caughtError
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to save doctor application"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleLogout =
    async () => {
      try {
        await logoutUser();
      } finally {
        router.replace(
          "/login"
        );
      }
    };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
        <LoaderCircle
          size={42}
          className="animate-spin text-cyan-600"
        />

        <p className="font-medium text-slate-600">
          Loading doctor
          application...
        </p>
      </main>
    );
  }

  const formLocked =
    [
      "pending",
      "verified",
      "suspended",
    ].includes(status);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-[#07111f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <BrainCircuit
                size={25}
              />
            </span>

            <div>
              <p className="font-bold">
                Tinnitus AI
              </p>

              <p className="text-xs text-slate-400">
                Doctor workspace
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut
              size={18}
            />

            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <div className="flex items-center gap-3">
            <Stethoscope
              size={30}
              className="text-cyan-300"
            />

            <div>
              <p className="text-sm text-cyan-300">
                Doctor application
              </p>

              <h1 className="text-3xl font-bold">
                Professional
                verification
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-slate-300">
            Complete your medical
            registration details.
            Consultation access remains
            locked until your credentials
            and documents are verified.
          </p>
        </section>

        <StatusBanner
          status={status}
          rejectionReason={
            rejectionReason
          }
        />

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
          >
            <CheckCircle2
              size={20}
            />

            {success}
          </div>
        )}

        <form
          onSubmit={
            handleSave
          }
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-xl font-bold">
            Medical registration
            details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              label="Medical Council"
              value={
                form.medicalCouncil
              }
              onChange={(
                value
              ) =>
                updateField(
                  "medicalCouncil",
                  value
                )
              }
              placeholder="Example: Karnataka Medical Council"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Registration Number"
              value={
                form.registrationNumber
              }
              onChange={(
                value
              ) =>
                updateField(
                  "registrationNumber",
                  value
                )
              }
              placeholder="Enter registration number"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Registration Year"
              value={
                form.registrationYear
              }
              onChange={(
                value
              ) =>
                updateField(
                  "registrationYear",
                  value
                )
              }
              placeholder="2020"
              type="number"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Qualification"
              value={
                form.qualification
              }
              onChange={(
                value
              ) =>
                updateField(
                  "qualification",
                  value
                )
              }
              placeholder="Example: MBBS, MS ENT"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Specialization"
              value={
                form.specialization
              }
              onChange={(
                value
              ) =>
                updateField(
                  "specialization",
                  value
                )
              }
              placeholder="Example: ENT"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Experience in years"
              value={
                form.experienceYears
              }
              onChange={(
                value
              ) =>
                updateField(
                  "experienceYears",
                  value
                )
              }
              placeholder="5"
              type="number"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Consultation Languages"
              value={
                form.consultationLanguages
              }
              onChange={(
                value
              ) =>
                updateField(
                  "consultationLanguages",
                  value
                )
              }
              placeholder="English, Kannada, Hindi"
              disabled={
                formLocked
              }
            />

            <FormField
              label="Hospital or Clinic"
              value={
                form.hospitalOrClinic
              }
              onChange={(
                value
              ) =>
                updateField(
                  "hospitalOrClinic",
                  value
                )
              }
              placeholder="Optional"
              required={false}
              disabled={
                formLocked
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-700">
              Professional Bio
            </span>

            <textarea
              value={
                form.professionalBio
              }
              onChange={(
                event
              ) =>
                updateField(
                  "professionalBio",
                  event.target
                    .value
                )
              }
              maxLength={1500}
              rows={5}
              disabled={
                formLocked
              }
              placeholder="Describe your professional experience"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 disabled:bg-slate-100"
            />
          </label>

          {!formLocked && (
            <button
              type="submit"
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={19}
                />
              )}

              {saving
                ? "Saving..."
                : "Save Application Draft"}
            </button>
          )}
        </form>

        <DoctorDocumentUpload />

        {status === "verified" && (
          <>
            <DoctorAppointments />
            <DoctorAvailability />
          </>
        )}
      </div>
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        required={required}
        disabled={disabled}
        min={
          type === "number"
            ? 0
            : undefined
        }
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 disabled:bg-slate-100"
      />
    </label>
  );
}

function StatusBanner({
  status,
  rejectionReason,
}: {
  status: VerificationStatus;
  rejectionReason: string;
}) {
  const content = {
    draft: {
      title:
        "Application draft",
      description:
        "Complete your details and upload the required documents.",
      className:
        "border-cyan-200 bg-cyan-50 text-cyan-800",
    },

    pending: {
      title:
        "Verification pending",
      description:
        "Your application is being reviewed. Consultation access remains locked.",
      className:
        "border-amber-200 bg-amber-50 text-amber-800",
    },

    verified: {
      title:
        "Verified doctor",
      description:
        "Your professional account has been approved.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    },

    rejected: {
      title:
        "Changes required",
      description:
        rejectionReason ||
        "Review and correct your application before resubmitting.",
      className:
        "border-red-200 bg-red-50 text-red-800",
    },

    suspended: {
      title:
        "Doctor account suspended",
      description:
        "Contact the platform administrator for assistance.",
      className:
        "border-red-200 bg-red-50 text-red-800",
    },
  }[status];

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-2xl border p-5 ${content.className}`}
    >
      <ShieldCheck
        size={22}
        className="mt-0.5 shrink-0"
      />

      <div>
        <p className="font-bold">
          {content.title}
        </p>

        <p className="mt-1 text-sm">
          {
            content.description
          }
        </p>
      </div>
    </div>
  );
}
