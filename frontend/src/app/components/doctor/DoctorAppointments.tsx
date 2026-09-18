"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../../lib/authService";

type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type Appointment = {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  consultationType: "video" | "audio" | "chat" | "in_person";
  patientMessage?: string;
  doctorResponse?: string;
  meetingProvider?: MeetingProvider | "";
  meetingLink?: string;
  meetingInstructions?: string;
  assessmentSharingConsent: boolean;
  sharedAssessment?: string | null;
  status: AppointmentStatus;
  requestedAt: string;
};

type MeetingProvider =
  | "google_meet"
  | "zoom"
  | "microsoft_teams"
  | "other";

type MeetingDetails = {
  meetingProvider: MeetingProvider | "";
  meetingLink: string;
  meetingInstructions: string;
};

type AppointmentsResponse = {
  success: boolean;
  message?: string;
  appointments?: Appointment[];
  appointment?: Appointment;
};

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("Backend API URL is not configured");
  }

  return apiUrl;
};

const readResponse = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed");
  }

  return data;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatConsultationType = (value: Appointment["consultationType"]) =>
  value === "in_person"
    ? "In person"
    : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const formatMeetingProvider = (value?: Appointment["meetingProvider"]) => {
  const providers: Record<MeetingProvider, string> = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    microsoft_teams: "Microsoft Teams",
    other: "Other",
  };

  return value ? providers[value] : "Online meeting";
};

const statusStyles: Record<AppointmentStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-cyan-100 text-cyan-800",
};

export default function DoctorAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/appointments/doctor`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await readResponse<AppointmentsResponse>(response);
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load appointment requests";

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "requested"),
    [appointments]
  );

  const appointmentHistory = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "requested"),
    [appointments]
  );

  const respondToAppointment = async (
    appointmentId: string,
    decision: "confirmed" | "rejected",
    meetingDetails: MeetingDetails = {
      meetingProvider: "",
      meetingLink: "",
      meetingInstructions: "",
    }
  ) => {
    let doctorResponse = "";

    if (decision === "rejected") {
      const reason = window.prompt(
        "Enter the reason for rejecting this appointment request:"
      );

      if (reason === null) return;

      doctorResponse = reason.trim();

      if (!doctorResponse) {
        setError("A rejection reason is required.");
        return;
      }
    }

    setRespondingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/appointments/${appointmentId}/respond`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            doctorResponse,
            ...meetingDetails,
          }),
        }
      );

      const data = await readResponse<AppointmentsResponse>(response);
      setSuccess(
        data.message ||
          (decision === "confirmed"
            ? "Appointment confirmed successfully."
            : "Appointment rejected.")
      );
      await loadAppointments();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the appointment"
      );
    } finally {
      setRespondingId("");
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <CalendarDays size={23} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Appointment requests</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review patient consultation requests and confirm or reject them.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadAppointments()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Pending requests</h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {pendingAppointments.length} pending
          </span>
        </div>

        {loading ? (
          <div className="mt-4 flex min-h-32 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading appointment requests...
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No pending appointment requests.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                busy={respondingId === appointment._id}
                onConfirm={(meetingDetails) =>
                  void respondToAppointment(
                    appointment._id,
                    "confirmed",
                    meetingDetails
                  )
                }
                onReject={() =>
                  void respondToAppointment(appointment._id, "rejected")
                }
              />
            ))}
          </div>
        )}
      </div>

      {!loading && appointmentHistory.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-7">
          <h3 className="font-bold">Appointment history</h3>
          <div className="mt-4 space-y-3">
            {appointmentHistory.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                busy={false}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AppointmentCard({
  appointment,
  busy,
  onConfirm,
  onReject,
}: {
  appointment: Appointment;
  busy: boolean;
  onConfirm?: (meetingDetails: MeetingDetails) => void;
  onReject?: () => void;
}) {
  const requiresMeetingLink =
    appointment.consultationType === "video" ||
    appointment.consultationType === "audio";

  const [meetingProvider, setMeetingProvider] =
    useState<MeetingProvider>("google_meet");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingInstructions, setMeetingInstructions] = useState("");
  const [meetingError, setMeetingError] = useState("");

  const handleConfirm = () => {
    if (!onConfirm) return;

    if (requiresMeetingLink) {
      const normalizedLink = meetingLink.trim();

      try {
        const url = new URL(normalizedLink);

        if (url.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        setMeetingError("Enter a valid HTTPS meeting link.");
        return;
      }

      setMeetingError("");
      onConfirm({
        meetingProvider,
        meetingLink: normalizedLink,
        meetingInstructions: meetingInstructions.trim(),
      });
      return;
    }

    onConfirm({
      meetingProvider: "",
      meetingLink: "",
      meetingInstructions: "",
    });
  };

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          {appointment.patient?.profilePicture ? (
            <img
              src={appointment.patient.profilePicture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <UserRound size={22} />
            </span>
          )}

          <div>
            <p className="font-bold">
              {appointment.patient?.fullName || "Patient"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {formatConsultationType(appointment.consultationType)} consultation
            </p>
          </div>
        </div>

        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <CalendarDays size={16} className="text-cyan-700" />
          {formatDate(appointment.appointmentDate)}
        </span>
        <span className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <Clock3 size={16} className="text-cyan-700" />
          {appointment.startTime}–{appointment.endTime}
        </span>
      </div>

      {appointment.patientMessage && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MessageSquareText size={15} />
            Patient message
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {appointment.patientMessage}
          </p>
        </div>
      )}

      {appointment.doctorResponse && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold">Doctor response:</span>{" "}
          {appointment.doctorResponse}
        </p>
      )}

      {appointment.status === "confirmed" && appointment.meetingLink && (
        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
          <p className="flex items-center gap-2 font-semibold">
            <Video size={17} />
            {formatMeetingProvider(appointment.meetingProvider)}
          </p>

          {appointment.meetingInstructions && (
            <p className="mt-2 whitespace-pre-wrap text-cyan-900">
              {appointment.meetingInstructions}
            </p>
          )}

          <a
            href={appointment.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700"
          >
            Open meeting
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      {appointment.status === "requested" &&
        requiresMeetingLink &&
        onConfirm && (
          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-cyan-950">
              <Link2 size={17} />
              Online meeting details
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Meeting provider
                <select
                  value={meetingProvider}
                  onChange={(event) =>
                    setMeetingProvider(event.target.value as MeetingProvider)
                  }
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="microsoft_teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Meeting link
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(event) => {
                    setMeetingLink(event.target.value);
                    setMeetingError("");
                  }}
                  placeholder="https://meet.google.com/..."
                  maxLength={500}
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Instructions (optional)
              <textarea
                value={meetingInstructions}
                onChange={(event) => setMeetingInstructions(event.target.value)}
                placeholder="Join five minutes before the consultation."
                maxLength={1000}
                rows={3}
                disabled={busy}
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-60"
              />
            </label>

            {meetingError && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-700">
                {meetingError}
              </p>
            )}
          </div>
        )}

      {appointment.status === "requested" && onConfirm && onReject && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <X size={18} />
            Reject
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            Confirm
          </button>
        </div>
      )}
    </article>
  );
}
