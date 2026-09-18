"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Stethoscope,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";

type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type MeetingProvider =
  | "google_meet"
  | "zoom"
  | "microsoft_teams"
  | "other";

type Appointment = {
  _id: string;
  doctor: {
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
  cancellationReason?: string;
  meetingProvider?: MeetingProvider | "";
  meetingLink?: string;
  meetingInstructions?: string;
  status: AppointmentStatus;
  requestedAt: string;
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
    other: "Online meeting",
  };

  return value ? providers[value] : "Online meeting";
};

const getSafeMeetingLink = (value?: string) => {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
};

/*
 * Appointments are created in the Asia/Kolkata timezone.
 * An appointment becomes part of the history after its end time.
 */
const getAppointmentEndTime = (appointment: Appointment) => {
  const datePart = appointment.appointmentDate.slice(0, 10);
  const endTime = /^\d{2}:\d{2}$/.test(appointment.endTime)
    ? appointment.endTime
    : "23:59";

  return new Date(`${datePart}T${endTime}:00+05:30`).getTime();
};

const isAppointmentPast = (appointment: Appointment) => {
  const endTime = getAppointmentEndTime(appointment);
  return Number.isFinite(endTime) && endTime <= Date.now();
};

const statusStyles: Record<AppointmentStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-cyan-100 text-cyan-800",
};

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/appointments/patient`,
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
          : "Unable to load appointments";

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

  const activeAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            (appointment.status === "requested" ||
              appointment.status === "confirmed") &&
            !isAppointmentPast(appointment)
        )
        .sort(
          (first, second) =>
            getAppointmentEndTime(first) - getAppointmentEndTime(second)
        ),
    [appointments]
  );

  const appointmentHistory = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            (appointment.status !== "requested" &&
              appointment.status !== "confirmed") ||
            isAppointmentPast(appointment)
        )
        .sort(
          (first, second) =>
            getAppointmentEndTime(second) - getAppointmentEndTime(first)
        ),
    [appointments]
  );

  const cancelAppointment = async (appointmentId: string) => {
    const reason = window.prompt(
      "Optional: enter the reason for cancelling this appointment:",
      ""
    );

    if (reason === null) return;

    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    setCancellingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancellationReason: reason.trim(),
          }),
        }
      );

      const data = await readResponse<AppointmentsResponse>(response);
      setSuccess(data.message || "Appointment cancelled successfully.");
      await loadAppointments();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to cancel the appointment"
      );
    } finally {
      setCancellingId("");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-[#07111f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <CalendarDays size={24} />
            </span>
            <div>
              <p className="font-bold">Tinnitus AI</p>
              <p className="text-xs text-slate-400">My appointments</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <p className="text-sm font-semibold text-cyan-300">
            Patient consultation workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold">My Appointments</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Track appointment requests, confirmations and doctor responses.
          </p>

          <Link
            href="/consultation"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Stethoscope size={18} />
            Book another consultation
          </Link>
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Upcoming appointments</h2>
          <button
            type="button"
            onClick={() => void loadAppointments()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-cyan-400 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={24} className="animate-spin" />
            Loading appointments...
          </div>
        ) : activeAppointments.length === 0 ? (
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CalendarDays size={42} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-xl font-bold">No upcoming appointments</h3>
            <p className="mt-2 text-slate-500">
              Book an available slot with a verified doctor.
            </p>
          </section>
        ) : (
          <div className="mt-4 space-y-4">
            {activeAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                cancelling={cancellingId === appointment._id}
                onCancel={() => void cancelAppointment(appointment._id)}
              />
            ))}
          </div>
        )}

        {!loading && appointmentHistory.length > 0 && (
          <section className="mt-8 border-t border-slate-300 pt-8">
            <h2 className="text-xl font-bold">Appointment history</h2>
            <div className="mt-4 space-y-4">
              {appointmentHistory.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  cancelling={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function AppointmentCard({
  appointment,
  cancelling,
  onCancel,
}: {
  appointment: Appointment;
  cancelling: boolean;
  onCancel?: () => void;
}) {
  const safeMeetingLink = getSafeMeetingLink(appointment.meetingLink);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          {appointment.doctor?.profilePicture ? (
            <img
              src={appointment.doctor.profilePicture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <UserRound size={27} />
            </span>
          )}

          <div>
            <h3 className="text-xl font-bold">
              Dr. {appointment.doctor?.fullName || "Doctor"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatConsultationType(appointment.consultationType)} consultation
            </p>
          </div>
        </div>

        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <CalendarDays size={17} className="text-cyan-700" />
          {formatDate(appointment.appointmentDate)}
        </span>
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <Clock3 size={17} className="text-cyan-700" />
          {appointment.startTime}–{appointment.endTime}
        </span>
      </div>

      {appointment.patientMessage && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MessageSquareText size={15} />
            Your message
          </p>
          <p className="mt-2 whitespace-pre-wrap">{appointment.patientMessage}</p>
        </div>
      )}

      {appointment.doctorResponse && (
        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          <p className="font-semibold">Doctor response</p>
          <p className="mt-1 whitespace-pre-wrap">{appointment.doctorResponse}</p>
        </div>
      )}

      {appointment.status === "confirmed" && safeMeetingLink && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="flex items-center gap-2 font-semibold">
            <Video size={18} />
            {formatMeetingProvider(appointment.meetingProvider)} is ready
          </p>

          {appointment.meetingInstructions && (
            <p className="mt-2 whitespace-pre-wrap text-emerald-900">
              {appointment.meetingInstructions}
            </p>
          )}

          <a
            href={safeMeetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Join meeting
            <ExternalLink size={17} />
          </a>
        </div>
      )}

      {appointment.cancellationReason && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-semibold">Cancellation reason:</span>{" "}
          {appointment.cancellationReason}
        </p>
      )}

      {onCancel &&
        (appointment.status === "requested" ||
          appointment.status === "confirmed") && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <XCircle size={18} />
            )}
            Cancel appointment
          </button>
        )}
    </article>
  );
}
