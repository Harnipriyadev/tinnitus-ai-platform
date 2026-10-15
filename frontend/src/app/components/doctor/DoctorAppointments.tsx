"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Link2,
  LoaderCircle,
  MessageSquareText,
  Pill,
  Plus,
  RefreshCw,
  Save,
  Send,
  Stethoscope,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import {
  doctorAppointmentsTranslations,
  type DoctorAppointmentsText,
} from "../../../../lib/doctorAppointmentsTranslations";
import { authenticatedFetch, logoutUser } from "../../../../lib/authService";

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

const statusStyles: Record<AppointmentStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-cyan-100 text-cyan-800",
};

const getApiUrl = (errorMessage: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error(errorMessage);
  }

  return apiUrl;
};

const readResponse = async <T,>(response: Response, fallback: string) => {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || fallback);
  }

  return data;
};

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function DoctorAppointments() {
  const router = useRouter();
  const { language } = useLanguage();
  const text = doctorAppointmentsTranslations[language];
  const locale = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-IN";

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
        `${getApiUrl(text.apiNotConfigured)}/api/appointments/doctor`,
        { method: "GET", cache: "no-store" }
      );
      const data = await readResponse<AppointmentsResponse>(
        response,
        text.requestFailed
      );
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : text.unableToLoad;

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
  }, [router, text]);

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
      const reason = window.prompt(text.rejectionPrompt);
      if (reason === null) return;

      doctorResponse = reason.trim();
      if (!doctorResponse) {
        setError(text.rejectionRequired);
        return;
      }
    }

    setRespondingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(text.apiNotConfigured)}/api/appointments/${appointmentId}/respond`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, doctorResponse, ...meetingDetails }),
        }
      );

      const data = await readResponse<AppointmentsResponse>(
        response,
        text.requestFailed
      );
      setSuccess(
        data.message ||
          (decision === "confirmed"
            ? text.confirmedSuccess
            : text.rejectedSuccess)
      );
      await loadAppointments();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : text.unableToUpdate
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
            <h2 className="text-xl font-bold">{text.heading}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadAppointments()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          {text.refresh}
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
          <h3 className="font-bold">{text.pendingRequests}</h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {pendingAppointments.length} {text.pending}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 flex min-h-32 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            {text.loading}
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            {text.noPending}
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
                text={text}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && appointmentHistory.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-7">
          <h3 className="font-bold">{text.history}</h3>
          <div className="mt-4 space-y-3">
            {appointmentHistory.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                busy={false}
                text={text}
                locale={locale}
                onCompleted={(message) => {
                  setSuccess(message);
                  void loadAppointments();
                }}
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
  text,
  locale,
  onCompleted,
}: {
  appointment: Appointment;
  busy: boolean;
  onConfirm?: (meetingDetails: MeetingDetails) => void;
  onReject?: () => void;
  text: DoctorAppointmentsText;
  locale: string;
  onCompleted?: (message: string) => void;
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
        if (url.protocol !== "https:") throw new Error();
      } catch {
        setMeetingError(text.invalidMeetingLink);
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

  const meetingProviderLabel = appointment.meetingProvider
    ? text.providers[appointment.meetingProvider]
    : text.onlineMeeting;

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
              {appointment.patient?.fullName || text.patient}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {text.consultationTypes[appointment.consultationType]} {text.consultation}
            </p>
          </div>
        </div>

        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}>
          {text.statuses[appointment.status]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <CalendarDays size={16} className="text-cyan-700" />
          {formatDate(appointment.appointmentDate, locale)}
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
            {text.patientMessage}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {appointment.patientMessage}
          </p>
        </div>
      )}

      <SharedAssessmentViewer appointment={appointment} />

      <ConsultationNotesEditor appointment={appointment} />

      <PrescriptionEditor appointment={appointment} />

      <CompleteConsultationAction
        appointment={appointment}
        onCompleted={onCompleted}
      />

      <DoctorMedicalReportDownload
        appointment={appointment}
        locale={locale}
        text={text}
      />

      {appointment.doctorResponse && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold">{text.doctorResponse}</span>{" "}
          {appointment.doctorResponse}
        </p>
      )}

      {appointment.status === "confirmed" && appointment.meetingLink && (
        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
          <p className="flex items-center gap-2 font-semibold">
            <Video size={17} />
            {meetingProviderLabel}
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
            {text.openMeeting}
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      {appointment.status === "requested" && requiresMeetingLink && onConfirm && (
        <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-cyan-950">
            <Link2 size={17} />
            {text.onlineMeetingDetails}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              {text.meetingProvider}
              <select
                value={meetingProvider}
                onChange={(event) =>
                  setMeetingProvider(event.target.value as MeetingProvider)
                }
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-60"
              >
                <option value="google_meet">{text.providers.google_meet}</option>
                <option value="zoom">{text.providers.zoom}</option>
                <option value="microsoft_teams">{text.providers.microsoft_teams}</option>
                <option value="other">{text.providers.other}</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              {text.meetingLink}
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
            {text.instructionsOptional}
            <textarea
              value={meetingInstructions}
              onChange={(event) => setMeetingInstructions(event.target.value)}
              placeholder={text.instructionsPlaceholder}
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
            {text.reject}
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
            {text.confirm}
          </button>
        </div>
      )}
    </article>
  );
}

type SharedAssessment = {
  _id: string;
  age: number;
  gender: string;
  tinnitus_type: string;
  affected_ear: string;
  frequency_hz: number;
  loudness_db: number;
  hearing_loss: string;
  thi_score: number;
  tfi_score: number;
  hads_anxiety: number;
  hads_depression: number;
  sleep_score: number;
  treatment?: string;
  outcome?: string;
  createdAt?: string;
};

type SharedAssessmentResponse = {
  success: boolean;
  message?: string;
  assessment?: SharedAssessment;
};

const assessmentViewerText = {
  en: {
    title: "Shared Patient Assessment",
    consent: "Shared by the patient with explicit consent",
    view: "View Shared Assessment",
    loading: "Loading assessment...",
    close: "Close",
    notAttached:
      "Patient consent is recorded, but no assessment is attached.",
    unable: "Unable to load the shared assessment",
    patientInformation: "Patient Information",
    tinnitusInformation: "Tinnitus and Hearing Information",
    clinicalScores: "Clinical Questionnaire Scores",
    recommendedCare: "Recommended Care",
    age: "Age",
    gender: "Gender",
    tinnitusType: "Tinnitus Type",
    affectedEar: "Affected Ear",
    frequency: "Matched Frequency",
    loudness: "Matched Loudness",
    hearingLoss: "Hearing Loss",
    thi: "THI Score",
    tfi: "TFI Score",
    anxiety: "HADS Anxiety",
    depression: "HADS Depression",
    sleep: "Sleep Score",
    treatment: "Suggested Treatment",
    outcome: "Recorded Outcome",
    disclaimer:
      "Use this report as consultation support. Confirm important findings with the patient before making clinical decisions.",
  },
  kn: {
    title: "ಹಂಚಿಕೊಂಡ ರೋಗಿಯ ಮೌಲ್ಯಮಾಪನ",
    consent: "ರೋಗಿಯ ಸ್ಪಷ್ಟ ಅನುಮತಿಯೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ",
    view: "ಹಂಚಿಕೊಂಡ ಮೌಲ್ಯಮಾಪನ ವೀಕ್ಷಿಸಿ",
    loading: "ಮೌಲ್ಯಮಾಪನ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    close: "ಮುಚ್ಚಿ",
    notAttached:
      "ರೋಗಿಯ ಅನುಮತಿ ದಾಖಲಾಗಿದೆ, ಆದರೆ ಮೌಲ್ಯಮಾಪನ ಲಗತ್ತಿಸಲಾಗಿಲ್ಲ.",
    unable: "ಹಂಚಿಕೊಂಡ ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    patientInformation: "ರೋಗಿಯ ಮಾಹಿತಿ",
    tinnitusInformation: "ಟಿನಿಟಸ್ ಮತ್ತು ಶ್ರವಣ ಮಾಹಿತಿ",
    clinicalScores: "ವೈದ್ಯಕೀಯ ಪ್ರಶ್ನಾವಳಿ ಅಂಕಗಳು",
    recommendedCare: "ಶಿಫಾರಸು ಮಾಡಿದ ಆರೈಕೆ",
    age: "ವಯಸ್ಸು",
    gender: "ಲಿಂಗ",
    tinnitusType: "ಟಿನಿಟಸ್ ಪ್ರಕಾರ",
    affectedEar: "ಬಾಧಿತ ಕಿವಿ",
    frequency: "ಹೊಂದಿಸಿದ ಆವೃತ್ತಿ",
    loudness: "ಹೊಂದಿಸಿದ ಧ್ವನಿ ಮಟ್ಟ",
    hearingLoss: "ಶ್ರವಣ ನಷ್ಟ",
    thi: "THI ಅಂಕ",
    tfi: "TFI ಅಂಕ",
    anxiety: "HADS ಆತಂಕ",
    depression: "HADS ಖಿನ್ನತೆ",
    sleep: "ನಿದ್ರೆ ಅಂಕ",
    treatment: "ಸೂಚಿಸಿದ ಚಿಕಿತ್ಸೆ",
    outcome: "ದಾಖಲಿಸಿದ ಫಲಿತಾಂಶ",
    disclaimer:
      "ಈ ವರದಿಯನ್ನು ಸಲಹೆಗೆ ಸಹಾಯಕ ಮಾಹಿತಿಯಾಗಿ ಬಳಸಿ. ವೈದ್ಯಕೀಯ ನಿರ್ಧಾರಗಳ ಮೊದಲು ರೋಗಿಯೊಂದಿಗೆ ಮುಖ್ಯ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ.",
  },
  hi: {
    title: "साझा रोगी मूल्यांकन",
    consent: "रोगी की स्पष्ट सहमति से साझा किया गया",
    view: "साझा मूल्यांकन देखें",
    loading: "मूल्यांकन लोड हो रहा है...",
    close: "बंद करें",
    notAttached:
      "रोगी की सहमति दर्ज है, लेकिन कोई मूल्यांकन संलग्न नहीं है।",
    unable: "साझा मूल्यांकन लोड नहीं किया जा सका",
    patientInformation: "रोगी की जानकारी",
    tinnitusInformation: "टिनिटस और श्रवण जानकारी",
    clinicalScores: "चिकित्सीय प्रश्नावली स्कोर",
    recommendedCare: "अनुशंसित देखभाल",
    age: "आयु",
    gender: "लिंग",
    tinnitusType: "टिनिटस का प्रकार",
    affectedEar: "प्रभावित कान",
    frequency: "मिलान की गई आवृत्ति",
    loudness: "मिलान की गई ध्वनि",
    hearingLoss: "श्रवण हानि",
    thi: "THI स्कोर",
    tfi: "TFI स्कोर",
    anxiety: "HADS चिंता",
    depression: "HADS अवसाद",
    sleep: "नींद स्कोर",
    treatment: "सुझाया गया उपचार",
    outcome: "दर्ज परिणाम",
    disclaimer:
      "इस रिपोर्ट का उपयोग परामर्श सहायता के रूप में करें। चिकित्सीय निर्णय से पहले महत्वपूर्ण जानकारी की रोगी से पुष्टि करें।",
  },
} as const;

function SharedAssessmentViewer({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = assessmentViewerText[language];

  const [assessment, setAssessment] = useState<SharedAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");

  if (!appointment.assessmentSharingConsent) {
    return null;
  }

  if (!appointment.sharedAssessment) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {labels.notAttached}
      </div>
    );
  }

  const loadAssessment = async () => {
    if (assessment) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setAssessmentError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/appointments/doctor/${appointment._id}/shared-assessment`,
        { method: "GET", cache: "no-store" }
      );

      const data = await readResponse<SharedAssessmentResponse>(
        response,
        labels.unable
      );

      if (!data.assessment) {
        throw new Error(labels.unable);
      }

      setAssessment(data.assessment);
      setOpen(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unable;

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setAssessmentError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold text-violet-950">
              <FileText size={18} />
              {labels.title}
            </p>
            <p className="mt-1 text-xs text-violet-700">{labels.consent}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssessment()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <FileText size={17} />
            )}
            {loading ? labels.loading : labels.view}
          </button>
        </div>

        {assessmentError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {assessmentError}
          </p>
        )}
      </div>

      {open && assessment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`shared-assessment-${appointment._id}`}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <article className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                  {labels.consent}
                </p>
                <h3
                  id={`shared-assessment-${appointment._id}`}
                  className="mt-2 text-2xl font-bold text-slate-950"
                >
                  {labels.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.patient?.fullName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-6 p-6">
              <AssessmentReportSection title={labels.patientInformation}>
                <AssessmentReportField label={labels.age} value={assessment.age} />
                <AssessmentReportField
                  label={labels.gender}
                  value={formatAssessmentValue(assessment.gender)}
                />
              </AssessmentReportSection>

              <AssessmentReportSection title={labels.tinnitusInformation}>
                <AssessmentReportField
                  label={labels.tinnitusType}
                  value={formatAssessmentValue(assessment.tinnitus_type)}
                />
                <AssessmentReportField
                  label={labels.affectedEar}
                  value={formatAssessmentValue(assessment.affected_ear)}
                />
                <AssessmentReportField
                  label={labels.frequency}
                  value={`${assessment.frequency_hz} Hz`}
                />
                <AssessmentReportField
                  label={labels.loudness}
                  value={`${assessment.loudness_db} dB`}
                />
                <AssessmentReportField
                  label={labels.hearingLoss}
                  value={formatAssessmentValue(assessment.hearing_loss)}
                />
              </AssessmentReportSection>

              <AssessmentReportSection title={labels.clinicalScores}>
                <AssessmentReportField label={labels.thi} value={assessment.thi_score} />
                <AssessmentReportField label={labels.tfi} value={assessment.tfi_score} />
                <AssessmentReportField
                  label={labels.anxiety}
                  value={assessment.hads_anxiety}
                />
                <AssessmentReportField
                  label={labels.depression}
                  value={assessment.hads_depression}
                />
                <AssessmentReportField
                  label={labels.sleep}
                  value={assessment.sleep_score}
                />
              </AssessmentReportSection>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="font-bold text-slate-950">{labels.recommendedCare}</h4>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {labels.treatment}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {assessment.treatment || "—"}
                </p>

                {assessment.outcome && (
                  <>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {labels.outcome}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {assessment.outcome}
                    </p>
                  </>
                )}
              </section>

              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                {labels.disclaimer}
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-slate-950 py-3 font-semibold text-white hover:bg-slate-800"
              >
                {labels.close}
              </button>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

function AssessmentReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="font-bold text-slate-950">{title}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function AssessmentReportField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatAssessmentValue(value: string) {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

type ConsultationRecord = {
  _id: string;
  chiefComplaint: string;
  clinicalFindings: string;
  clinicalImpression: string;
  carePlan: string;
  privateDoctorNotes: string;
  status: "draft" | "finalized";
  createdAt?: string;
  updatedAt?: string;
};

type ConsultationResponse = {
  success: boolean;
  message?: string;
  consultation?: ConsultationRecord | null;
};

type ConsultationForm = {
  chiefComplaint: string;
  clinicalFindings: string;
  clinicalImpression: string;
  carePlan: string;
  privateDoctorNotes: string;
};

const EMPTY_CONSULTATION_FORM: ConsultationForm = {
  chiefComplaint: "",
  clinicalFindings: "",
  clinicalImpression: "",
  carePlan: "",
  privateDoctorNotes: "",
};

const consultationNotesText = {
  en: {
    title: "Consultation Notes",
    description: "Record clinical observations and the care plan",
    open: "Add Consultation Notes",
    view: "View Consultation Notes",
    loading: "Loading notes...",
    save: "Save Notes",
    saving: "Saving notes...",
    saved: "Consultation notes saved successfully",
    close: "Close",
    unable: "Unable to load consultation notes",
    unableToSave: "Unable to save consultation notes",
    empty: "No consultation notes were recorded for this appointment.",
    atLeastOne: "Enter at least one consultation note before saving.",
    chiefComplaint: "Chief Complaint / Symptoms",
    chiefComplaintPlaceholder: "Describe the patient's main concern and symptoms...",
    clinicalFindings: "Clinical Findings",
    clinicalFindingsPlaceholder: "Record relevant observations and examination findings...",
    clinicalImpression: "Clinical Impression",
    clinicalImpressionPlaceholder: "Record your clinical impression...",
    carePlan: "Care Plan",
    carePlanPlaceholder: "Record advice, therapy plan and follow-up recommendations...",
    privateDoctorNotes: "Private Doctor Notes",
    privateDoctorNotesPlaceholder: "Private notes visible only to the treating doctor...",
    privateWarning: "Private doctor notes are not included in the patient-facing report.",
    readOnly: "This completed appointment is read-only.",
  },
  kn: {
    title: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳು",
    description: "ವೈದ್ಯಕೀಯ ಗಮನಿಕೆಗಳು ಮತ್ತು ಆರೈಕೆ ಯೋಜನೆಯನ್ನು ದಾಖಲಿಸಿ",
    open: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ",
    view: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    loading: "ಟಿಪ್ಪಣಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...",
    save: "ಟಿಪ್ಪಣಿಗಳನ್ನು ಉಳಿಸಿ",
    saving: "ಟಿಪ್ಪಣಿಗಳನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    saved: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
    close: "ಮುಚ್ಚಿ",
    unable: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    unableToSave: "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    empty: "ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ಯಾವುದೇ ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    atLeastOne: "ಉಳಿಸುವ ಮೊದಲು ಕನಿಷ್ಠ ಒಂದು ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಯನ್ನು ನಮೂದಿಸಿ.",
    chiefComplaint: "ಮುಖ್ಯ ದೂರು / ಲಕ್ಷಣಗಳು",
    chiefComplaintPlaceholder: "ರೋಗಿಯ ಮುಖ್ಯ ಸಮಸ್ಯೆ ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ...",
    clinicalFindings: "ವೈದ್ಯಕೀಯ ಕಂಡುಬಂದ ವಿಷಯಗಳು",
    clinicalFindingsPlaceholder: "ಸಂಬಂಧಿತ ಗಮನಿಕೆಗಳು ಮತ್ತು ಪರೀಕ್ಷಾ ವಿವರಗಳನ್ನು ದಾಖಲಿಸಿ...",
    clinicalImpression: "ವೈದ್ಯಕೀಯ ಅಭಿಪ್ರಾಯ",
    clinicalImpressionPlaceholder: "ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ಅಭಿಪ್ರಾಯವನ್ನು ದಾಖಲಿಸಿ...",
    carePlan: "ಆರೈಕೆ ಯೋಜನೆ",
    carePlanPlaceholder: "ಸಲಹೆ, ಚಿಕಿತ್ಸೆ ಮತ್ತು ಮುಂದಿನ ಭೇಟಿಯ ಯೋಜನೆಯನ್ನು ದಾಖಲಿಸಿ...",
    privateDoctorNotes: "ವೈದ್ಯರ ಖಾಸಗಿ ಟಿಪ್ಪಣಿಗಳು",
    privateDoctorNotesPlaceholder: "ಚಿಕಿತ್ಸೆ ನೀಡುವ ವೈದ್ಯರಿಗೆ ಮಾತ್ರ ಕಾಣುವ ಖಾಸಗಿ ಟಿಪ್ಪಣಿಗಳು...",
    privateWarning: "ವೈದ್ಯರ ಖಾಸಗಿ ಟಿಪ್ಪಣಿಗಳನ್ನು ರೋಗಿಯ ವರದಿಯಲ್ಲಿ ಸೇರಿಸಲಾಗುವುದಿಲ್ಲ.",
    readOnly: "ಪೂರ್ಣಗೊಂಡ ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಓದಲು ಮಾತ್ರ ಲಭ್ಯವಿದೆ.",
  },
  hi: {
    title: "परामर्श नोट्स",
    description: "चिकित्सीय अवलोकन और देखभाल योजना दर्ज करें",
    open: "परामर्श नोट्स जोड़ें",
    view: "परामर्श नोट्स देखें",
    loading: "नोट्स लोड हो रहे हैं...",
    save: "नोट्स सहेजें",
    saving: "नोट्स सहेजे जा रहे हैं...",
    saved: "परामर्श नोट्स सफलतापूर्वक सहेजे गए",
    close: "बंद करें",
    unable: "परामर्श नोट्स लोड नहीं किए जा सके",
    unableToSave: "परामर्श नोट्स सहेजे नहीं जा सके",
    empty: "इस अपॉइंटमेंट के लिए कोई परामर्श नोट दर्ज नहीं किया गया।",
    atLeastOne: "सहेजने से पहले कम से कम एक परामर्श नोट दर्ज करें।",
    chiefComplaint: "मुख्य शिकायत / लक्षण",
    chiefComplaintPlaceholder: "रोगी की मुख्य समस्या और लक्षणों का वर्णन करें...",
    clinicalFindings: "चिकित्सीय निष्कर्ष",
    clinicalFindingsPlaceholder: "संबंधित अवलोकन और जांच के निष्कर्ष दर्ज करें...",
    clinicalImpression: "चिकित्सीय राय",
    clinicalImpressionPlaceholder: "अपनी चिकित्सीय राय दर्ज करें...",
    carePlan: "देखभाल योजना",
    carePlanPlaceholder: "सलाह, उपचार और फॉलो-अप योजना दर्ज करें...",
    privateDoctorNotes: "डॉक्टर के निजी नोट्स",
    privateDoctorNotesPlaceholder: "केवल उपचार करने वाले डॉक्टर को दिखाई देने वाले निजी नोट्स...",
    privateWarning: "डॉक्टर के निजी नोट्स रोगी की रिपोर्ट में शामिल नहीं किए जाते।",
    readOnly: "यह पूर्ण अपॉइंटमेंट केवल पढ़ने के लिए उपलब्ध है।",
  },
} as const;

function ConsultationNotesEditor({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = consultationNotesText[language];
  const canEdit = appointment.status === "confirmed";
  const canView = canEdit || appointment.status === "completed";

  const [form, setForm] = useState<ConsultationForm>(EMPTY_CONSULTATION_FORM);
  const [consultation, setConsultation] = useState<ConsultationRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!canView) {
    return null;
  }

  const handleAuthenticationError = async (message: string) => {
    if (
      message === "You are not authenticated" ||
      message.includes("session has ended")
    ) {
      await logoutUser();
      router.replace("/login");
      return true;
    }

    return false;
  };

  const loadConsultation = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/consultations/doctor/${appointment._id}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await readResponse<ConsultationResponse>(
        response,
        labels.unable
      );

      const loadedConsultation = data.consultation || null;
      setConsultation(loadedConsultation);
      setForm(
        loadedConsultation
          ? {
              chiefComplaint: loadedConsultation.chiefComplaint || "",
              clinicalFindings: loadedConsultation.clinicalFindings || "",
              clinicalImpression: loadedConsultation.clinicalImpression || "",
              carePlan: loadedConsultation.carePlan || "",
              privateDoctorNotes: loadedConsultation.privateDoctorNotes || "",
            }
          : EMPTY_CONSULTATION_FORM
      );
      setOpen(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unable;

      if (await handleAuthenticationError(message)) {
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ConsultationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const saveNotes = async () => {
    const hasContent = Object.values(form).some(
      (value) => value.trim().length > 0
    );

    if (!hasContent) {
      setError(labels.atLeastOne);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/consultations/doctor/${appointment._id}/notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await readResponse<ConsultationResponse>(
        response,
        labels.unableToSave
      );

      if (data.consultation) {
        setConsultation(data.consultation);
      }

      setSuccess(data.message || labels.saved);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unableToSave;

      if (await handleAuthenticationError(message)) {
        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold text-cyan-950">
              <Stethoscope size={18} />
              {labels.title}
            </p>
            <p className="mt-1 text-xs text-cyan-700">{labels.description}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadConsultation()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Stethoscope size={17} />
            )}
            {loading ? labels.loading : canEdit ? labels.open : labels.view}
          </button>
        </div>

        {error && !open && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`consultation-notes-${appointment._id}`}
          className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <article className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <h3
                  id={`consultation-notes-${appointment._id}`}
                  className="flex items-center gap-2 text-2xl font-bold text-slate-950"
                >
                  <Stethoscope size={24} className="text-cyan-700" />
                  {labels.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.patient?.fullName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-5 p-6">
              {!canEdit && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {labels.readOnly}
                </p>
              )}

              {!canEdit && !consultation ? (
                <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                  {labels.empty}
                </p>
              ) : (
                <>
                  <ConsultationTextArea
                    label={labels.chiefComplaint}
                    placeholder={labels.chiefComplaintPlaceholder}
                    value={form.chiefComplaint}
                    maxLength={1500}
                    readOnly={!canEdit}
                    onChange={(value) => updateField("chiefComplaint", value)}
                  />

                  <ConsultationTextArea
                    label={labels.clinicalFindings}
                    placeholder={labels.clinicalFindingsPlaceholder}
                    value={form.clinicalFindings}
                    maxLength={4000}
                    readOnly={!canEdit}
                    onChange={(value) => updateField("clinicalFindings", value)}
                  />

                  <ConsultationTextArea
                    label={labels.clinicalImpression}
                    placeholder={labels.clinicalImpressionPlaceholder}
                    value={form.clinicalImpression}
                    maxLength={2500}
                    readOnly={!canEdit}
                    onChange={(value) => updateField("clinicalImpression", value)}
                  />

                  <ConsultationTextArea
                    label={labels.carePlan}
                    placeholder={labels.carePlanPlaceholder}
                    value={form.carePlan}
                    maxLength={4000}
                    readOnly={!canEdit}
                    onChange={(value) => updateField("carePlan", value)}
                  />

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <ConsultationTextArea
                      label={labels.privateDoctorNotes}
                      placeholder={labels.privateDoctorNotesPlaceholder}
                      value={form.privateDoctorNotes}
                      maxLength={3000}
                      readOnly={!canEdit}
                      onChange={(value) => updateField("privateDoctorNotes", value)}
                    />
                    <p className="mt-2 text-xs text-violet-700">
                      {labels.privateWarning}
                    </p>
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={18} />
                  {success}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {labels.close}
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void saveNotes()}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {saving ? labels.saving : labels.save}
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

function ConsultationTextArea({
  label,
  placeholder,
  value,
  maxLength,
  readOnly,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  maxLength: number;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        readOnly={readOnly}
        className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal leading-6 text-slate-800 outline-none focus:border-cyan-500 read-only:bg-slate-50 read-only:text-slate-600"
      />
      <span className="mt-1 block text-right text-xs font-normal text-slate-400">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

type MedicationDraft = {
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type DigitalPrescription = {
  _id: string;
  prescriptionNumber: string;
  medications: MedicationDraft[];
  generalInstructions: string;
  status: "draft" | "issued" | "cancelled";
  issuedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PrescriptionResponse = {
  success: boolean;
  message?: string;
  prescription?: DigitalPrescription | null;
};

const createEmptyMedication = (): MedicationDraft => ({
  medicineName: "",
  strength: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const prescriptionText = {
  en: {
    title: "Digital Prescription",
    description: "Create and securely issue medicines to the patient",
    open: "Create Prescription",
    view: "View Prescription",
    loading: "Loading prescription...",
    noPrescription: "No prescription has been created for this appointment.",
    number: "Prescription Number",
    medicine: "Medicine",
    medicineName: "Medicine name",
    strength: "Strength",
    dosage: "Dosage",
    frequency: "Frequency",
    duration: "Duration",
    instructions: "Medicine instructions",
    generalInstructions: "General Instructions",
    addMedicine: "Add Medicine",
    removeMedicine: "Remove medicine",
    save: "Save Draft",
    saving: "Saving draft...",
    saved: "Prescription draft saved successfully",
    issue: "Issue to Patient",
    issuing: "Issuing prescription...",
    issued: "Prescription issued successfully",
    issuedBadge: "Issued",
    draftBadge: "Draft",
    close: "Close",
    required: "Complete the medicine name, dosage, frequency and duration for every medicine.",
    saveBeforeIssue: "Save the latest changes before issuing the prescription.",
    confirmIssue:
      "Issue this prescription to the patient? It cannot be edited after it is issued.",
    unable: "Unable to load the prescription",
    unableToSave: "Unable to save the prescription",
    unableToIssue: "Unable to issue the prescription",
    readOnly: "This prescription is read-only.",
    placeholders: {
      medicineName: "Example: Betahistine",
      strength: "Example: 16 mg",
      dosage: "Example: 1 tablet",
      frequency: "Example: Twice daily after food",
      duration: "Example: 14 days",
      instructions: "Optional medicine-specific instructions",
      generalInstructions: "Diet, precautions, follow-up and other instructions...",
    },
  },
  kn: {
    title: "ಡಿಜಿಟಲ್ ಔಷಧ ಚೀಟಿ",
    description: "ರೋಗಿಗೆ ಔಷಧಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ರಚಿಸಿ ಮತ್ತು ನೀಡಿ",
    open: "ಔಷಧ ಚೀಟಿ ರಚಿಸಿ",
    view: "ಔಷಧ ಚೀಟಿ ವೀಕ್ಷಿಸಿ",
    loading: "ಔಷಧ ಚೀಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    noPrescription: "ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ಔಷಧ ಚೀಟಿ ರಚಿಸಲಾಗಿಲ್ಲ.",
    number: "ಔಷಧ ಚೀಟಿ ಸಂಖ್ಯೆ",
    medicine: "ಔಷಧಿ",
    medicineName: "ಔಷಧಿಯ ಹೆಸರು",
    strength: "ಸಾಮರ್ಥ್ಯ",
    dosage: "ಡೋಸ್",
    frequency: "ತೆಗೆದುಕೊಳ್ಳುವ ಅವಧಿ",
    duration: "ಒಟ್ಟು ಅವಧಿ",
    instructions: "ಔಷಧಿ ಸೂಚನೆಗಳು",
    generalInstructions: "ಸಾಮಾನ್ಯ ಸೂಚನೆಗಳು",
    addMedicine: "ಔಷಧಿ ಸೇರಿಸಿ",
    removeMedicine: "ಔಷಧಿ ತೆಗೆದುಹಾಕಿ",
    save: "ಕರಡು ಉಳಿಸಿ",
    saving: "ಕರಡು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    saved: "ಔಷಧ ಚೀಟಿ ಕರಡು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
    issue: "ರೋಗಿಗೆ ನೀಡಿ",
    issuing: "ಔಷಧ ಚೀಟಿ ನೀಡಲಾಗುತ್ತಿದೆ...",
    issued: "ಔಷಧ ಚೀಟಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನೀಡಲಾಗಿದೆ",
    issuedBadge: "ನೀಡಲಾಗಿದೆ",
    draftBadge: "ಕರಡು",
    close: "ಮುಚ್ಚಿ",
    required: "ಪ್ರತಿ ಔಷಧಿಗೆ ಹೆಸರು, ಡೋಸ್, ಆವೃತ್ತಿ ಮತ್ತು ಅವಧಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
    saveBeforeIssue: "ಔಷಧ ಚೀಟಿಯನ್ನು ನೀಡುವ ಮೊದಲು ಇತ್ತೀಚಿನ ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ.",
    confirmIssue:
      "ಈ ಔಷಧ ಚೀಟಿಯನ್ನು ರೋಗಿಗೆ ನೀಡಬೇಕೇ? ನೀಡಿದ ನಂತರ ಅದನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    unable: "ಔಷಧ ಚೀಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    unableToSave: "ಔಷಧ ಚೀಟಿಯನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    unableToIssue: "ಔಷಧ ಚೀಟಿಯನ್ನು ನೀಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    readOnly: "ಈ ಔಷಧ ಚೀಟಿ ಓದಲು ಮಾತ್ರ ಲಭ್ಯವಿದೆ.",
    placeholders: {
      medicineName: "ಉದಾಹರಣೆ: Betahistine",
      strength: "ಉದಾಹರಣೆ: 16 mg",
      dosage: "ಉದಾಹರಣೆ: 1 ಮಾತ್ರೆ",
      frequency: "ಉದಾಹರಣೆ: ಊಟದ ನಂತರ ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ",
      duration: "ಉದಾಹರಣೆ: 14 ದಿನಗಳು",
      instructions: "ಐಚ್ಛಿಕ ಔಷಧಿ ಸೂಚನೆಗಳು",
      generalInstructions: "ಆಹಾರ, ಮುನ್ನೆಚ್ಚರಿಕೆ, ಮುಂದಿನ ಭೇಟಿ ಮತ್ತು ಇತರೆ ಸೂಚನೆಗಳು...",
    },
  },
  hi: {
    title: "डिजिटल प्रिस्क्रिप्शन",
    description: "रोगी के लिए दवाएं सुरक्षित रूप से बनाएं और जारी करें",
    open: "प्रिस्क्रिप्शन बनाएं",
    view: "प्रिस्क्रिप्शन देखें",
    loading: "प्रिस्क्रिप्शन लोड हो रहा है...",
    noPrescription: "इस अपॉइंटमेंट के लिए कोई प्रिस्क्रिप्शन नहीं बनाया गया है।",
    number: "प्रिस्क्रिप्शन नंबर",
    medicine: "दवा",
    medicineName: "दवा का नाम",
    strength: "क्षमता",
    dosage: "खुराक",
    frequency: "कितनी बार",
    duration: "अवधि",
    instructions: "दवा संबंधी निर्देश",
    generalInstructions: "सामान्य निर्देश",
    addMedicine: "दवा जोड़ें",
    removeMedicine: "दवा हटाएं",
    save: "ड्राफ्ट सहेजें",
    saving: "ड्राफ्ट सहेजा जा रहा है...",
    saved: "प्रिस्क्रिप्शन ड्राफ्ट सफलतापूर्वक सहेजा गया",
    issue: "रोगी को जारी करें",
    issuing: "प्रिस्क्रिप्शन जारी किया जा रहा है...",
    issued: "प्रिस्क्रिप्शन सफलतापूर्वक जारी किया गया",
    issuedBadge: "जारी किया गया",
    draftBadge: "ड्राफ्ट",
    close: "बंद करें",
    required: "हर दवा के लिए नाम, खुराक, आवृत्ति और अवधि पूरी करें।",
    saveBeforeIssue: "प्रिस्क्रिप्शन जारी करने से पहले नवीनतम बदलाव सहेजें।",
    confirmIssue:
      "क्या यह प्रिस्क्रिप्शन रोगी को जारी करना है? जारी होने के बाद इसे बदला नहीं जा सकता।",
    unable: "प्रिस्क्रिप्शन लोड नहीं किया जा सका",
    unableToSave: "प्रिस्क्रिप्शन सहेजा नहीं जा सका",
    unableToIssue: "प्रिस्क्रिप्शन जारी नहीं किया जा सका",
    readOnly: "यह प्रिस्क्रिप्शन केवल पढ़ने के लिए उपलब्ध है।",
    placeholders: {
      medicineName: "उदाहरण: Betahistine",
      strength: "उदाहरण: 16 mg",
      dosage: "उदाहरण: 1 गोली",
      frequency: "उदाहरण: भोजन के बाद दिन में दो बार",
      duration: "उदाहरण: 14 दिन",
      instructions: "वैकल्पिक दवा निर्देश",
      generalInstructions: "आहार, सावधानियां, फॉलो-अप और अन्य निर्देश...",
    },
  },
} as const;

function PrescriptionEditor({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = prescriptionText[language];
  const appointmentEditable = appointment.status === "confirmed";
  const appointmentViewable =
    appointmentEditable || appointment.status === "completed";

  const [prescription, setPrescription] =
    useState<DigitalPrescription | null>(null);
  const [medications, setMedications] = useState<MedicationDraft[]>([
    createEmptyMedication(),
  ]);
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!appointmentViewable) {
    return null;
  }

  const readOnly =
    !appointmentEditable ||
    prescription?.status === "issued" ||
    prescription?.status === "cancelled";

  const handleAuthenticationError = async (message: string) => {
    if (
      message === "You are not authenticated" ||
      message.includes("session has ended")
    ) {
      await logoutUser();
      router.replace("/login");
      return true;
    }

    return false;
  };

  const loadPrescription = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/prescriptions/doctor/${appointment._id}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await readResponse<PrescriptionResponse>(
        response,
        labels.unable
      );

      const loaded = data.prescription || null;
      setPrescription(loaded);
      setMedications(
        loaded?.medications?.length
          ? loaded.medications
          : [createEmptyMedication()]
      );
      setGeneralInstructions(loaded?.generalInstructions || "");
      setDirty(false);
      setOpen(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unable;

      if (await handleAuthenticationError(message)) {
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateMedication = (
    index: number,
    field: keyof MedicationDraft,
    value: string
  ) => {
    setMedications((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    );
    setDirty(true);
    setError("");
    setSuccess("");
  };

  const addMedication = () => {
    if (medications.length >= 20) return;
    setMedications((current) => [...current, createEmptyMedication()]);
    setDirty(true);
  };

  const removeMedication = (index: number) => {
    if (medications.length === 1) return;
    setMedications((current) =>
      current.filter((_, medicineIndex) => medicineIndex !== index)
    );
    setDirty(true);
  };

  const medicinesAreValid = () =>
    medications.length >= 1 &&
    medications.every(
      (medicine) =>
        medicine.medicineName.trim() &&
        medicine.dosage.trim() &&
        medicine.frequency.trim() &&
        medicine.duration.trim()
    );

  const savePrescription = async () => {
    if (!medicinesAreValid()) {
      setError(labels.required);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/prescriptions/doctor/${appointment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medications, generalInstructions }),
        }
      );

      const data = await readResponse<PrescriptionResponse>(
        response,
        labels.unableToSave
      );

      if (data.prescription) {
        setPrescription(data.prescription);
      }

      setDirty(false);
      setSuccess(data.message || labels.saved);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unableToSave;

      if (await handleAuthenticationError(message)) {
        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const issuePrescription = async () => {
    if (!prescription || dirty) {
      setError(labels.saveBeforeIssue);
      return;
    }

    if (!window.confirm(labels.confirmIssue)) {
      return;
    }

    setIssuing(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/prescriptions/doctor/${appointment._id}/issue`,
        { method: "PATCH" }
      );

      const data = await readResponse<PrescriptionResponse>(
        response,
        labels.unableToIssue
      );

      if (data.prescription) {
        setPrescription(data.prescription);
      }

      setSuccess(data.message || labels.issued);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unableToIssue;

      if (await handleAuthenticationError(message)) {
        return;
      }

      setError(message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold text-emerald-950">
              <Pill size={18} />
              {labels.title}
            </p>
            <p className="mt-1 text-xs text-emerald-700">{labels.description}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadPrescription()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Pill size={17} />
            )}
            {loading ? labels.loading : prescription || !appointmentEditable ? labels.view : labels.open}
          </button>
        </div>

        {error && !open && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`prescription-${appointment._id}`}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <article className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <h3
                  id={`prescription-${appointment._id}`}
                  className="flex items-center gap-2 text-2xl font-bold text-slate-950"
                >
                  <Pill size={24} className="text-emerald-700" />
                  {labels.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.patient?.fullName}
                </p>
                {prescription?.prescriptionNumber && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {labels.number}: {prescription.prescriptionNumber}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-5 p-6">
              {readOnly && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {labels.readOnly}
                </p>
              )}

              {!appointmentEditable && !prescription ? (
                <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                  {labels.noPrescription}
                </p>
              ) : (
                <>
                  {medications.map((medicine, index) => (
                    <section
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-bold text-slate-950">
                          {labels.medicine} {index + 1}
                        </h4>
                        {!readOnly && medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            aria-label={labels.removeMedicine}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <PrescriptionInput
                          label={labels.medicineName}
                          placeholder={labels.placeholders.medicineName}
                          value={medicine.medicineName}
                          maxLength={120}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "medicineName", value)
                          }
                        />
                        <PrescriptionInput
                          label={labels.strength}
                          placeholder={labels.placeholders.strength}
                          value={medicine.strength}
                          maxLength={80}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "strength", value)
                          }
                        />
                        <PrescriptionInput
                          label={labels.dosage}
                          placeholder={labels.placeholders.dosage}
                          value={medicine.dosage}
                          maxLength={120}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "dosage", value)
                          }
                        />
                        <PrescriptionInput
                          label={labels.frequency}
                          placeholder={labels.placeholders.frequency}
                          value={medicine.frequency}
                          maxLength={120}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "frequency", value)
                          }
                        />
                        <PrescriptionInput
                          label={labels.duration}
                          placeholder={labels.placeholders.duration}
                          value={medicine.duration}
                          maxLength={120}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "duration", value)
                          }
                        />
                        <PrescriptionInput
                          label={labels.instructions}
                          placeholder={labels.placeholders.instructions}
                          value={medicine.instructions}
                          maxLength={500}
                          readOnly={readOnly}
                          onChange={(value) =>
                            updateMedication(index, "instructions", value)
                          }
                        />
                      </div>
                    </section>
                  ))}

                  {!readOnly && medications.length < 20 && (
                    <button
                      type="button"
                      onClick={addMedication}
                      className="flex items-center gap-2 rounded-xl border border-emerald-300 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus size={18} />
                      {labels.addMedicine}
                    </button>
                  )}

                  <label className="block text-sm font-semibold text-slate-800">
                    {labels.generalInstructions}
                    <textarea
                      value={generalInstructions}
                      onChange={(event) => {
                        setGeneralInstructions(event.target.value);
                        setDirty(true);
                        setError("");
                        setSuccess("");
                      }}
                      placeholder={labels.placeholders.generalInstructions}
                      maxLength={2000}
                      rows={4}
                      readOnly={readOnly}
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal leading-6 outline-none focus:border-emerald-500 read-only:bg-slate-50"
                    />
                  </label>
                </>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={18} />
                  {success}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {labels.close}
                </button>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => void savePrescription()}
                    disabled={saving || issuing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {saving ? labels.saving : labels.save}
                  </button>
                )}

                {!readOnly && prescription?.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => void issuePrescription()}
                    disabled={saving || issuing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {issuing ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {issuing ? labels.issuing : labels.issue}
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

function PrescriptionInput({
  label,
  placeholder,
  value,
  maxLength,
  readOnly,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  maxLength: number;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500 read-only:bg-slate-100"
      />
    </label>
  );
}

const completeConsultationText = {
  en: {
    title: "Complete Consultation",
    description:
      "Finalize the consultation notes and move this appointment to completed history.",
    button: "Mark as Completed",
    completing: "Completing consultation...",
    confirm:
      "Complete this consultation? Notes will become read-only. Any saved prescription draft must be issued first.",
    completed: "Consultation completed successfully",
    unable: "Unable to complete the consultation",
  },
  kn: {
    title: "ಸಮಾಲೋಚನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ",
    description:
      "ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಂತಿಮಗೊಳಿಸಿ ಮತ್ತು ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅನ್ನು ಪೂರ್ಣಗೊಂಡ ಇತಿಹಾಸಕ್ಕೆ ಸರಿಸಿ.",
    button: "ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ",
    completing: "ಸಮಾಲೋಚನೆ ಪೂರ್ಣಗೊಳ್ಳುತ್ತಿದೆ...",
    confirm:
      "ಈ ಸಮಾಲೋಚನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬೇಕೇ? ಟಿಪ್ಪಣಿಗಳು ಓದಲು ಮಾತ್ರ ಲಭ್ಯವಾಗುತ್ತವೆ. ಉಳಿಸಿದ ಔಷಧ ಚೀಟಿ ಕರಡನ್ನು ಮೊದಲು ನೀಡಬೇಕು.",
    completed: "ಸಮಾಲೋಚನೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ",
    unable: "ಸಮಾಲೋಚನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
  },
  hi: {
    title: "परामर्श पूरा करें",
    description:
      "परामर्श नोट्स को अंतिम रूप दें और इस अपॉइंटमेंट को पूर्ण इतिहास में भेजें।",
    button: "पूर्ण के रूप में चिह्नित करें",
    completing: "परामर्श पूरा किया जा रहा है...",
    confirm:
      "क्या यह परामर्श पूरा करना है? नोट्स केवल पढ़ने योग्य हो जाएंगे। सहेजे गए प्रिस्क्रिप्शन ड्राफ्ट को पहले जारी करना होगा।",
    completed: "परामर्श सफलतापूर्वक पूरा हुआ",
    unable: "परामर्श पूरा नहीं किया जा सका",
  },
} as const;

function CompleteConsultationAction({
  appointment,
  onCompleted,
}: {
  appointment: Appointment;
  onCompleted?: (message: string) => void;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = completeConsultationText[language];
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState("");

  if (appointment.status !== "confirmed") {
    return null;
  }

  const completeConsultation = async () => {
    if (!window.confirm(labels.confirm)) {
      return;
    }

    setCompleting(true);
    setCompletionError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/consultations/doctor/${appointment._id}/complete`,
        { method: "PATCH" }
      );

      const data = await readResponse<{
        success: boolean;
        message?: string;
      }>(response, labels.unable);

      onCompleted?.(data.message || labels.completed);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unable;

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setCompletionError(message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-950">
            <CheckCircle2 size={19} className="text-emerald-600" />
            {labels.title}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
            {labels.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void completeConsultation()}
          disabled={completing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          {completing ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {completing ? labels.completing : labels.button}
        </button>
      </div>

      {completionError && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {completionError}
        </p>
      )}
    </div>
  );
}

const doctorMedicalReportText = {
  en: {
    title: "Medical Consultation Report",
    description:
      "Download the finalized consultation summary and issued prescription",
    download: "Download PDF Report",
    generating: "Generating report...",
    unable: "Unable to generate the medical report",
    missingConsultation:
      "The finalized consultation notes are not available.",
  },
  kn: {
    title: "ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆ ವರದಿ",
    description:
      "ಅಂತಿಮ ಸಮಾಲೋಚನೆ ಸಾರಾಂಶ ಮತ್ತು ನೀಡಿದ ಔಷಧ ಚೀಟಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    download: "PDF ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    generating: "ವರದಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...",
    unable: "ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    missingConsultation:
      "ಅಂತಿಮ ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
  },
  hi: {
    title: "चिकित्सीय परामर्श रिपोर्ट",
    description:
      "अंतिम परामर्श सारांश और जारी प्रिस्क्रिप्शन डाउनलोड करें",
    download: "PDF रिपोर्ट डाउनलोड करें",
    generating: "रिपोर्ट तैयार हो रही है...",
    unable: "चिकित्सीय रिपोर्ट तैयार नहीं की जा सकी",
    missingConsultation:
      "अंतिम परामर्श नोट उपलब्ध नहीं हैं।",
  },
} as const;

function DoctorMedicalReportDownload({
  appointment,
  locale,
  text,
}: {
  appointment: Appointment;
  locale: string;
  text: DoctorAppointmentsText;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = doctorMedicalReportText[language];
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState("");

  if (appointment.status !== "completed") {
    return null;
  }

  const downloadReport = async () => {
    setGenerating(true);
    setReportError("");

    try {
      const apiUrl = getApiUrl(
        "Backend API URL is not configured"
      );

      const [consultationResponse, prescriptionResponse] =
        await Promise.all([
          authenticatedFetch(
            `${apiUrl}/api/consultations/doctor/${appointment._id}`,
            { method: "GET", cache: "no-store" }
          ),
          authenticatedFetch(
            `${apiUrl}/api/prescriptions/doctor/${appointment._id}`,
            { method: "GET", cache: "no-store" }
          ),
        ]);

      const consultationData =
        await readResponse<ConsultationResponse>(
          consultationResponse,
          labels.unable
        );

      const prescriptionData =
        await readResponse<PrescriptionResponse>(
          prescriptionResponse,
          labels.unable
        );

      const consultation = consultationData.consultation;
      const prescription =
        prescriptionData.prescription?.status === "issued"
          ? prescriptionData.prescription
          : null;

      if (!consultation || consultation.status !== "finalized") {
        throw new Error(labels.missingConsultation);
      }

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const left = 18;
      const contentWidth = pageWidth - left * 2;
      let y = 18;

      const addPageIfNeeded = (requiredHeight = 12) => {
        if (y + requiredHeight <= pageHeight - 18) {
          return;
        }

        pdf.addPage();
        y = 18;
      };

      const addSection = (title: string) => {
        addPageIfNeeded(14);
        y += 3;
        pdf.setFillColor(226, 232, 240);
        pdf.roundedRect(left, y - 5, contentWidth, 9, 2, 2, "F");
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(title, left + 3, y + 1);
        y += 10;
      };

      const addField = (label: string, value?: string | null) => {
        if (!value) return;

        addPageIfNeeded(12);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(label, left, y);
        y += 5;

        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        const lines = pdf.splitTextToSize(value, contentWidth) as string[];

        for (const line of lines) {
          addPageIfNeeded(6);
          pdf.text(line, left, y);
          y += 5;
        }

        y += 3;
      };

      let doctorName = "Doctor";

      try {
        const storedUser = window.localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser) as {
            fullName?: string;
            name?: string;
          };
          const storedName = user.fullName || user.name;

          if (storedName) {
            doctorName = storedName.toLowerCase().startsWith("dr.")
              ? storedName
              : `Dr. ${storedName}`;
          }
        }
      } catch {
        // The PDF can still be created if local profile data is unavailable.
      }

      pdf.setFillColor(8, 145, 178);
      pdf.rect(0, 0, pageWidth, 34, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("AURISENSE AI", left, 15);
      pdf.setFontSize(13);
      pdf.text("Medical Consultation Report", left, 24);
      y = 43;

      addField(
        "Patient",
        appointment.patient?.fullName || "Patient"
      );
      addField("Doctor", doctorName);
      addField(
        "Appointment Date",
        formatDate(appointment.appointmentDate, locale)
      );
      addField(
        "Appointment Time",
        `${appointment.startTime} - ${appointment.endTime} (${appointment.timezone || "Asia/Kolkata"})`
      );
      addField(
        "Consultation Type",
        text.consultationTypes[appointment.consultationType]
      );

      addSection("Clinical Summary");
      addField("Chief Complaint / Symptoms", consultation.chiefComplaint);
      addField("Clinical Findings", consultation.clinicalFindings);
      addField("Clinical Impression", consultation.clinicalImpression);
      addField("Care Plan", consultation.carePlan);

      /*
       * Private doctor notes are intentionally excluded because this
       * report may be downloaded and shared with the patient.
       */
      addSection("Digital Prescription");

      if (prescription) {
        addField("Prescription Number", prescription.prescriptionNumber);

        if (prescription.issuedAt) {
          addField(
            "Issued On",
            new Intl.DateTimeFormat("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(prescription.issuedAt))
          );
        }

        prescription.medications.forEach((medicine, index) => {
          addSection(`Medicine ${index + 1}: ${medicine.medicineName}`);
          addField("Strength", medicine.strength || "Not specified");
          addField("Dosage", medicine.dosage);
          addField("Frequency", medicine.frequency);
          addField("Duration", medicine.duration);
          addField("Instructions", medicine.instructions);
        });

        addField(
          "General Instructions",
          prescription.generalInstructions
        );
      } else {
        addField(
          "Prescription",
          "No digital prescription was issued for this consultation."
        );
      }

      addSection("Important Notice");
      addField(
        "Medical guidance",
        "This report records the completed consultation. It does not replace emergency medical care. The patient should follow the treating doctor's direct advice."
      );

      const totalPages = pdf.getNumberOfPages();

      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(
          `Generated ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}`,
          left,
          pageHeight - 8
        );
        pdf.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - left,
          pageHeight - 8,
          { align: "right" }
        );
      }

      pdf.save(`medical-consultation-${appointment._id}.pdf`);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : labels.unable;

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setReportError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-bold text-cyan-950">
            <FileText size={19} />
            {labels.title}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-cyan-700">
            {labels.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void downloadReport()}
          disabled={generating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"
        >
          {generating ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {generating ? labels.generating : labels.download}
        </button>
      </div>

      {reportError && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {reportError}
        </p>
      )}
    </div>
  );
}
