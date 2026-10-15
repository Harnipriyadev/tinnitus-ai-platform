"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  Pill,
  RefreshCw,
  Stethoscope,
  UserRound,
  Video,
  X,
  XCircle,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";
import {
  appointmentsTranslations,
} from "../../../lib/appointmentsTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

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

type ConsultationType =
  | "video"
  | "audio"
  | "chat"
  | "in_person";

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
  consultationType: ConsultationType;
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

type AppointmentText =
  (typeof appointmentsTranslations)[keyof typeof appointmentsTranslations];

const getApiUrl = (
  errorMessage: string
) => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      /\/+$/,
      ""
    );

  if (!apiUrl) {
    throw new Error(
      errorMessage
    );
  }

  return apiUrl;
};

const readResponse = async <T,>(
  response: Response,
  fallbackMessage: string
): Promise<T> => {
  const data = (await response
    .json()
    .catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ||
        fallbackMessage
    );
  }

  return data;
};

const formatDate = (
  value: string,
  locale: string
) =>
  new Intl.DateTimeFormat(
    locale,
    {
      timeZone:
        "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));

const formatConsultationType = (
  value: ConsultationType,
  text: AppointmentText
) =>
  text.consultationTypes[
    value
  ];

const formatMeetingProvider = (
  value:
    | Appointment["meetingProvider"]
    | undefined,
  text: AppointmentText
) => {
  if (!value) {
    return text
      .meetingProviders
      .fallback;
  }

  return text.meetingProviders[
    value
  ];
};

const getSafeMeetingLink = (
  value?: string
) => {
  if (!value) return "";

  try {
    const url = new URL(value);

    return url.protocol ===
      "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
};

/*
 * Appointments are created in the
 * Asia/Kolkata timezone.
 */
const getAppointmentEndTime = (
  appointment: Appointment
) => {
  const datePart =
    appointment.appointmentDate.slice(
      0,
      10
    );

  const endTime =
    /^\d{2}:\d{2}$/.test(
      appointment.endTime
    )
      ? appointment.endTime
      : "23:59";

  return new Date(
    `${datePart}T${endTime}:00+05:30`
  ).getTime();
};

const isAppointmentPast = (
  appointment: Appointment
) => {
  const endTime =
    getAppointmentEndTime(
      appointment
    );

  return (
    Number.isFinite(endTime) &&
    endTime <= Date.now()
  );
};

const statusStyles: Record<
  AppointmentStatus,
  string
> = {
  requested:
    "bg-amber-100 text-amber-800",
  confirmed:
    "bg-emerald-100 text-emerald-800",
  rejected:
    "bg-red-100 text-red-700",
  cancelled:
    "bg-slate-200 text-slate-700",
  completed:
    "bg-cyan-100 text-cyan-800",
};

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { language } =
    useLanguage();

  const text =
    appointmentsTranslations[
      language
    ];

  const locale =
    language === "kn"
      ? "kn-IN"
      : language === "hi"
        ? "hi-IN"
        : "en-IN";

  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [
    cancellingId,
    setCancellingId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadAppointments =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl(
              text.apiNotConfigured
            )}/api/appointments/patient`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await readResponse<AppointmentsResponse>(
            response,
            text.requestFailed
          );

        setAppointments(
          Array.isArray(
            data.appointments
          )
            ? data.appointments
            : []
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof
          Error
            ? caughtError.message
            : text.unableToLoad;

        if (
          message ===
            "You are not authenticated" ||
          message.includes(
            "session has ended"
          )
        ) {
          await logoutUser();
          router.replace(
            "/login"
          );
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

  const activeAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              (appointment.status ===
                "requested" ||
                appointment.status ===
                  "confirmed") &&
              !isAppointmentPast(
                appointment
              )
          )
          .sort(
            (first, second) =>
              getAppointmentEndTime(
                first
              ) -
              getAppointmentEndTime(
                second
              )
          ),
      [appointments]
    );

  const appointmentHistory =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              (appointment.status !==
                "requested" &&
                appointment.status !==
                  "confirmed") ||
              isAppointmentPast(
                appointment
              )
          )
          .sort(
            (first, second) =>
              getAppointmentEndTime(
                second
              ) -
              getAppointmentEndTime(
                first
              )
          ),
      [appointments]
    );

  const cancelAppointment =
    async (
      appointmentId: string
    ) => {
      const reason =
        window.prompt(
          text.cancelReasonPrompt,
          ""
        );

      if (reason === null) {
        return;
      }

      if (
        !window.confirm(
          text.cancelConfirmation
        )
      ) {
        return;
      }

      setCancellingId(
        appointmentId
      );
      setError("");
      setSuccess("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl(
              text.apiNotConfigured
            )}/api/appointments/${appointmentId}/cancel`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  cancellationReason:
                    reason.trim(),
                }),
            }
          );

        await readResponse<AppointmentsResponse>(
          response,
          text.requestFailed
        );

        setSuccess(
          text.cancelledSuccessfully
        );

        await loadAppointments();
      } catch (caughtError) {
        setError(
          caughtError instanceof
          Error
            ? caughtError.message
            : text.unableToCancel
        );
      } finally {
        setCancellingId("");
      }
    };

  const handleLogout =
    async () => {
      await logoutUser();

      router.replace(
        "/login"
      );
    };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-[#07111f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <CalendarDays
                size={24}
              />
            </span>

            <div>
              <p className="font-bold">
                Tinnitus AI
              </p>

              <p className="text-xs text-slate-400">
                {
                  text.myAppointments
                }
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut size={18} />
            {text.logout}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <p className="text-sm font-semibold text-cyan-300">
            {text.workspace}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {text.title}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            {text.description}
          </p>

          <Link
            href="/consultation"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Stethoscope
              size={18}
            />

            {text.bookAnother}
          </Link>
        </section>

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
              size={19}
            />

            {success}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {text.upcoming}
          </h2>

          <button
            type="button"
            onClick={() =>
              void loadAppointments()
            }
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-cyan-400 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {text.refresh}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
            <LoaderCircle
              size={24}
              className="animate-spin"
            />

            {text.loading}
          </div>
        ) : activeAppointments.length ===
          0 ? (
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CalendarDays
              size={42}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-xl font-bold">
              {text.noUpcoming}
            </h3>

            <p className="mt-2 text-slate-500">
              {
                text.noUpcomingDescription
              }
            </p>
          </section>
        ) : (
          <div className="mt-4 space-y-4">
            {activeAppointments.map(
              (appointment) => (
                <AppointmentCard
                  key={
                    appointment._id
                  }
                  appointment={
                    appointment
                  }
                  cancelling={
                    cancellingId ===
                    appointment._id
                  }
                  onCancel={() =>
                    void cancelAppointment(
                      appointment._id
                    )
                  }
                  locale={locale}
                  text={text}
                />
              )
            )}
          </div>
        )}

        {!loading &&
          appointmentHistory.length >
            0 && (
            <section className="mt-8 border-t border-slate-300 pt-8">
              <h2 className="text-xl font-bold">
                {text.history}
              </h2>

              <div className="mt-4 space-y-4">
                {appointmentHistory.map(
                  (appointment) => (
                    <AppointmentCard
                      key={
                        appointment._id
                      }
                      appointment={
                        appointment
                      }
                      cancelling={false}
                      locale={locale}
                      text={text}
                    />
                  )
                )}
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
  locale,
  text,
}: {
  appointment: Appointment;
  cancelling: boolean;
  onCancel?: () => void;
  locale: string;
  text: AppointmentText;
}) {
  const safeMeetingLink =
    getSafeMeetingLink(
      appointment.meetingLink
    );

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          {appointment.doctor
            ?.profilePicture ? (
            <img
              src={
                appointment.doctor
                  .profilePicture
              }
              alt=""
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <UserRound
                size={27}
              />
            </span>
          )}

          <div>
            <h3 className="text-xl font-bold">
              {text.doctorPrefix}{" "}
              {appointment.doctor
                ?.fullName ||
                text.doctor}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {formatConsultationType(
                appointment.consultationType,
                text
              )}{" "}
              {text.consultation}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}
        >
          {
            text.statuses[
              appointment.status
            ]
          }
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <CalendarDays
            size={17}
            className="text-cyan-700"
          />

          {formatDate(
            appointment.appointmentDate,
            locale
          )}
        </span>

        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <Clock3
            size={17}
            className="text-cyan-700"
          />

          {appointment.startTime}–
          {appointment.endTime}
        </span>
      </div>

      {appointment.patientMessage && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MessageSquareText
              size={15}
            />

            {text.yourMessage}
          </p>

          <p className="mt-2 whitespace-pre-wrap">
            {
              appointment.patientMessage
            }
          </p>
        </div>
      )}

      {appointment.doctorResponse && (
        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          <p className="font-semibold">
            {text.doctorResponse}
          </p>

          <p className="mt-1 whitespace-pre-wrap">
            {
              appointment.doctorResponse
            }
          </p>
        </div>
      )}

      <PatientConsultationSummary appointment={appointment} />

      <PatientPrescriptionViewer appointment={appointment} locale={locale} />

      <PatientMedicalReportDownload
        appointment={appointment}
        locale={locale}
        text={text}
      />

      {appointment.status ===
        "confirmed" &&
        safeMeetingLink && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="flex items-center gap-2 font-semibold">
              <Video size={18} />

              {formatMeetingProvider(
                appointment.meetingProvider,
                text
              )}{" "}
              {text.meetingReady}
            </p>

            {appointment.meetingInstructions && (
              <p className="mt-2 whitespace-pre-wrap text-emerald-900">
                {
                  appointment.meetingInstructions
                }
              </p>
            )}

            <a
              href={safeMeetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              {text.joinMeeting}

              <ExternalLink
                size={17}
              />
            </a>
          </div>
        )}

      {appointment.cancellationReason && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-semibold">
            {
              text.cancellationReason
            }
          </span>{" "}

          {
            appointment.cancellationReason
          }
        </p>
      )}

      {onCancel &&
        (appointment.status ===
          "requested" ||
          appointment.status ===
            "confirmed") && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <XCircle
                size={18}
              />
            )}

            {
              text.cancelAppointment
            }
          </button>
        )}
    </article>
  );
}

type PatientConsultation = {
  _id: string;
  chiefComplaint: string;
  clinicalFindings: string;
  clinicalImpression: string;
  carePlan: string;
  status: "draft" | "finalized";
  createdAt?: string;
  updatedAt?: string;
};

type PatientConsultationResponse = {
  success: boolean;
  message?: string;
  consultation?: PatientConsultation | null;
};

const patientConsultationText = {
  en: {
    title: "Doctor Consultation Summary",
    description: "Clinical notes and care guidance shared for this appointment",
    view: "View Doctor Notes",
    loading: "Loading notes...",
    close: "Close",
    unavailable: "The doctor has not added consultation notes yet.",
    unableToLoad: "Unable to load the consultation summary",
    chiefComplaint: "Chief Complaint / Symptoms",
    clinicalFindings: "Clinical Findings",
    clinicalImpression: "Clinical Impression",
    carePlan: "Care Plan",
    draftNotice:
      "These notes are still being updated by the doctor and may change before the consultation is completed.",
    medicalNotice:
      "Follow the treating doctor's direct advice. Contact the clinic if any information is unclear or your symptoms worsen.",
  },
  kn: {
    title: "ವೈದ್ಯರ ಸಮಾಲೋಚನೆ ಸಾರಾಂಶ",
    description: "ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ಹಂಚಿಕೊಂಡ ವೈದ್ಯಕೀಯ ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಆರೈಕೆ ಮಾರ್ಗದರ್ಶನ",
    view: "ವೈದ್ಯರ ಟಿಪ್ಪಣಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    loading: "ಟಿಪ್ಪಣಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...",
    close: "ಮುಚ್ಚಿ",
    unavailable: "ವೈದ್ಯರು ಇನ್ನೂ ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.",
    unableToLoad: "ಸಮಾಲೋಚನೆ ಸಾರಾಂಶವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    chiefComplaint: "ಮುಖ್ಯ ದೂರು / ಲಕ್ಷಣಗಳು",
    clinicalFindings: "ವೈದ್ಯಕೀಯ ಕಂಡುಬಂದ ವಿಷಯಗಳು",
    clinicalImpression: "ವೈದ್ಯಕೀಯ ಅಭಿಪ್ರಾಯ",
    carePlan: "ಆರೈಕೆ ಯೋಜನೆ",
    draftNotice:
      "ವೈದ್ಯರು ಈ ಟಿಪ್ಪಣಿಗಳನ್ನು ಇನ್ನೂ ನವೀಕರಿಸುತ್ತಿದ್ದಾರೆ; ಸಮಾಲೋಚನೆ ಪೂರ್ಣಗೊಳ್ಳುವ ಮೊದಲು ಅವು ಬದಲಾಗಬಹುದು.",
    medicalNotice:
      "ಚಿಕಿತ್ಸೆ ನೀಡುವ ವೈದ್ಯರ ನೇರ ಸಲಹೆಯನ್ನು ಅನುಸರಿಸಿ. ಮಾಹಿತಿ ಅಸ್ಪಷ್ಟವಾಗಿದ್ದರೆ ಅಥವಾ ಲಕ್ಷಣಗಳು ಹೆಚ್ಚಾದರೆ ಕ್ಲಿನಿಕ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  },
  hi: {
    title: "डॉक्टर का परामर्श सारांश",
    description: "इस अपॉइंटमेंट के लिए साझा किए गए चिकित्सीय नोट और देखभाल मार्गदर्शन",
    view: "डॉक्टर के नोट देखें",
    loading: "नोट्स लोड हो रहे हैं...",
    close: "बंद करें",
    unavailable: "डॉक्टर ने अभी तक परामर्श नोट नहीं जोड़े हैं।",
    unableToLoad: "परामर्श सारांश लोड नहीं किया जा सका",
    chiefComplaint: "मुख्य शिकायत / लक्षण",
    clinicalFindings: "चिकित्सीय निष्कर्ष",
    clinicalImpression: "चिकित्सीय राय",
    carePlan: "देखभाल योजना",
    draftNotice:
      "डॉक्टर अभी इन नोट्स को अपडेट कर रहे हैं और परामर्श पूरा होने से पहले इनमें बदलाव हो सकता है।",
    medicalNotice:
      "उपचार करने वाले डॉक्टर की सीधी सलाह का पालन करें। जानकारी अस्पष्ट होने या लक्षण बढ़ने पर क्लिनिक से संपर्क करें।",
  },
} as const;

function PatientConsultationSummary({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = patientConsultationText[language];
  const availableForStatus =
    appointment.status === "confirmed" || appointment.status === "completed";

  const [consultation, setConsultation] =
    useState<PatientConsultation | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consultationError, setConsultationError] = useState("");

  if (!availableForStatus) {
    return null;
  }

  const loadConsultation = async () => {
    if (consultation) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setConsultationError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/consultations/patient/${appointment._id}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await readResponse<PatientConsultationResponse>(
        response,
        labels.unableToLoad
      );

      if (!data.consultation) {
        setConsultationError(labels.unavailable);
        return;
      }

      setConsultation(data.consultation);
      setOpen(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unableToLoad;

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setConsultationError(message);
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
            <p className="mt-1 text-xs text-violet-700">{labels.description}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadConsultation()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <FileText size={17} />
            )}
            {loading ? labels.loading : labels.view}
          </button>
        </div>

        {consultationError && (
          <p role="alert" className="mt-3 text-sm font-medium text-amber-800">
            {consultationError}
          </p>
        )}
      </div>

      {open && consultation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`patient-consultation-${appointment._id}`}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <article className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <h3
                  id={`patient-consultation-${appointment._id}`}
                  className="flex items-center gap-2 text-2xl font-bold text-slate-950"
                >
                  <FileText size={24} className="text-violet-700" />
                  {labels.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {textDoctorName(appointment)}
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

            <div className="space-y-4 p-6">
              {consultation.status === "draft" && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {labels.draftNotice}
                </p>
              )}

              <PatientConsultationField
                label={labels.chiefComplaint}
                value={consultation.chiefComplaint}
              />
              <PatientConsultationField
                label={labels.clinicalFindings}
                value={consultation.clinicalFindings}
              />
              <PatientConsultationField
                label={labels.clinicalImpression}
                value={consultation.clinicalImpression}
              />
              <PatientConsultationField
                label={labels.carePlan}
                value={consultation.carePlan}
              />

              <p className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs leading-5 text-cyan-950">
                {labels.medicalNotice}
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

function PatientConsultationField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="text-sm font-bold text-slate-950">{label}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value}
      </p>
    </section>
  );
}

function textDoctorName(appointment: Appointment) {
  return appointment.doctor?.fullName
    ? `Dr. ${appointment.doctor.fullName}`
    : "Doctor";
}

type PatientMedication = {
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type PatientPrescription = {
  _id: string;
  prescriptionNumber: string;
  medications: PatientMedication[];
  generalInstructions: string;
  status: "issued";
  issuedAt?: string;
};

type PatientPrescriptionResponse = {
  success: boolean;
  message?: string;
  prescription?: PatientPrescription | null;
};

const patientPrescriptionText = {
  en: {
    title: "Digital Prescription",
    description: "Medicines issued by your doctor for this appointment",
    view: "View Prescription",
    loading: "Loading prescription...",
    unavailable: "Your doctor has not issued a prescription yet.",
    unableToLoad: "Unable to load the prescription",
    number: "Prescription Number",
    issuedOn: "Issued On",
    medicine: "Medicine",
    strength: "Strength",
    dosage: "Dosage",
    frequency: "Frequency",
    duration: "Duration",
    instructions: "Instructions",
    generalInstructions: "General Instructions",
    close: "Close",
    safety:
      "Take medicines only as directed by your doctor. Contact the clinic before changing the dose or stopping a medicine.",
  },
  kn: {
    title: "ಡಿಜಿಟಲ್ ಔಷಧ ಚೀಟಿ",
    description: "ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ನಿಮ್ಮ ವೈದ್ಯರು ನೀಡಿದ ಔಷಧಿಗಳು",
    view: "ಔಷಧ ಚೀಟಿ ವೀಕ್ಷಿಸಿ",
    loading: "ಔಷಧ ಚೀಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    unavailable: "ನಿಮ್ಮ ವೈದ್ಯರು ಇನ್ನೂ ಔಷಧ ಚೀಟಿಯನ್ನು ನೀಡಿಲ್ಲ.",
    unableToLoad: "ಔಷಧ ಚೀಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    number: "ಔಷಧ ಚೀಟಿ ಸಂಖ್ಯೆ",
    issuedOn: "ನೀಡಿದ ದಿನಾಂಕ",
    medicine: "ಔಷಧಿ",
    strength: "ಸಾಮರ್ಥ್ಯ",
    dosage: "ಡೋಸ್",
    frequency: "ತೆಗೆದುಕೊಳ್ಳುವ ಅವಧಿ",
    duration: "ಒಟ್ಟು ಅವಧಿ",
    instructions: "ಸೂಚನೆಗಳು",
    generalInstructions: "ಸಾಮಾನ್ಯ ಸೂಚನೆಗಳು",
    close: "ಮುಚ್ಚಿ",
    safety:
      "ವೈದ್ಯರ ಸೂಚನೆಯಂತೆ ಮಾತ್ರ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ. ಡೋಸ್ ಬದಲಿಸುವ ಅಥವಾ ಔಷಧಿ ನಿಲ್ಲಿಸುವ ಮೊದಲು ಕ್ಲಿನಿಕ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  },
  hi: {
    title: "डिजिटल प्रिस्क्रिप्शन",
    description: "इस अपॉइंटमेंट के लिए आपके डॉक्टर द्वारा जारी की गई दवाएं",
    view: "प्रिस्क्रिप्शन देखें",
    loading: "प्रिस्क्रिप्शन लोड हो रहा है...",
    unavailable: "आपके डॉक्टर ने अभी तक प्रिस्क्रिप्शन जारी नहीं किया है।",
    unableToLoad: "प्रिस्क्रिप्शन लोड नहीं किया जा सका",
    number: "प्रिस्क्रिप्शन नंबर",
    issuedOn: "जारी करने की तारीख",
    medicine: "दवा",
    strength: "क्षमता",
    dosage: "खुराक",
    frequency: "कितनी बार",
    duration: "अवधि",
    instructions: "निर्देश",
    generalInstructions: "सामान्य निर्देश",
    close: "बंद करें",
    safety:
      "दवाएं केवल डॉक्टर के निर्देश के अनुसार लें। खुराक बदलने या दवा बंद करने से पहले क्लिनिक से संपर्क करें।",
  },
} as const;

function PatientPrescriptionViewer({
  appointment,
  locale,
}: {
  appointment: Appointment;
  locale: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = patientPrescriptionText[language];
  const availableForStatus =
    appointment.status === "confirmed" || appointment.status === "completed";

  const [prescription, setPrescription] =
    useState<PatientPrescription | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  if (!availableForStatus) {
    return null;
  }

  const loadPrescription = async () => {
    if (prescription) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setPrescriptionError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(
          "Backend API URL is not configured"
        )}/api/prescriptions/patient/${appointment._id}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await readResponse<PatientPrescriptionResponse>(
        response,
        labels.unableToLoad
      );

      if (!data.prescription) {
        setPrescriptionError(labels.unavailable);
        return;
      }

      setPrescription(data.prescription);
      setOpen(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : labels.unableToLoad;

      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return;
      }

      setPrescriptionError(message);
    } finally {
      setLoading(false);
    }
  };

  const issuedDate = prescription?.issuedAt
    ? new Intl.DateTimeFormat(locale, {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(prescription.issuedAt))
    : "";

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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Pill size={17} />
            )}
            {loading ? labels.loading : labels.view}
          </button>
        </div>

        {prescriptionError && (
          <p role="alert" className="mt-3 text-sm font-medium text-amber-800">
            {prescriptionError}
          </p>
        )}
      </div>

      {open && prescription && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`patient-prescription-${appointment._id}`}
          className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <article className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <h3
                  id={`patient-prescription-${appointment._id}`}
                  className="flex items-center gap-2 text-2xl font-bold text-slate-950"
                >
                  <Pill size={24} className="text-emerald-700" />
                  {labels.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {textDoctorName(appointment)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {labels.number}: {prescription.prescriptionNumber}
                  </span>
                  {issuedDate && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                      {labels.issuedOn}: {issuedDate}
                    </span>
                  )}
                </div>
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
              {prescription.medications.map((medicine, index) => (
                <section
                  key={`${medicine.medicineName}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <h4 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                    <Pill size={18} className="text-emerald-700" />
                    {labels.medicine} {index + 1}: {medicine.medicineName}
                    {medicine.strength ? ` ${medicine.strength}` : ""}
                  </h4>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <PrescriptionDetail label={labels.dosage} value={medicine.dosage} />
                    <PrescriptionDetail label={labels.frequency} value={medicine.frequency} />
                    <PrescriptionDetail label={labels.duration} value={medicine.duration} />
                    {medicine.instructions && (
                      <PrescriptionDetail
                        label={labels.instructions}
                        value={medicine.instructions}
                      />
                    )}
                  </dl>
                </section>
              ))}

              {prescription.generalInstructions && (
                <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                  <h4 className="font-bold text-cyan-950">
                    {labels.generalInstructions}
                  </h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cyan-900">
                    {prescription.generalInstructions}
                  </p>
                </section>
              )}

              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                {labels.safety}
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

function PrescriptionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

const patientMedicalReportText = {
  en: {
    title: "Medical Consultation Report",
    description:
      "Download the finalized consultation summary and prescription as a PDF",
    download: "Download PDF Report",
    generating: "Generating report...",
    unable: "Unable to generate the medical report",
    missingConsultation:
      "The finalized consultation notes are not available.",
  },
  kn: {
    title: "ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆ ವರದಿ",
    description:
      "ಅಂತಿಮ ಸಮಾಲೋಚನೆ ಸಾರಾಂಶ ಮತ್ತು ಔಷಧ ಚೀಟಿಯನ್ನು PDF ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    download: "PDF ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    generating: "ವರದಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...",
    unable: "ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    missingConsultation:
      "ಅಂತಿಮ ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
  },
  hi: {
    title: "चिकित्सीय परामर्श रिपोर्ट",
    description:
      "अंतिम परामर्श सारांश और प्रिस्क्रिप्शन को PDF में डाउनलोड करें",
    download: "PDF रिपोर्ट डाउनलोड करें",
    generating: "रिपोर्ट तैयार हो रही है...",
    unable: "चिकित्सीय रिपोर्ट तैयार नहीं की जा सकी",
    missingConsultation:
      "अंतिम परामर्श नोट उपलब्ध नहीं हैं।",
  },
} as const;

function PatientMedicalReportDownload({
  appointment,
  locale,
  text,
}: {
  appointment: Appointment;
  locale: string;
  text: AppointmentText;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const labels = patientMedicalReportText[language];
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
            `${apiUrl}/api/consultations/patient/${appointment._id}`,
            { method: "GET", cache: "no-store" }
          ),
          authenticatedFetch(
            `${apiUrl}/api/prescriptions/patient/${appointment._id}`,
            { method: "GET", cache: "no-store" }
          ),
        ]);

      const consultationData =
        await readResponse<PatientConsultationResponse>(
          consultationResponse,
          labels.unable
        );

      const prescriptionData =
        await readResponse<PatientPrescriptionResponse>(
          prescriptionResponse,
          labels.unable
        );

      const consultation = consultationData.consultation;
      const prescription = prescriptionData.prescription;

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

      const addField = (label: string, value?: string) => {
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

      let patientName = "Patient";

      try {
        const storedUser = window.localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser) as {
            fullName?: string;
            name?: string;
          };

          patientName = user.fullName || user.name || patientName;
        }
      } catch {
        // The report can still be generated without a stored display name.
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

      addField("Patient", patientName);
      addField("Doctor", textDoctorName(appointment));
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
        formatConsultationType(appointment.consultationType, text)
      );

      addSection("Clinical Summary");
      addField("Chief Complaint / Symptoms", consultation.chiefComplaint);
      addField("Clinical Findings", consultation.clinicalFindings);
      addField("Clinical Impression", consultation.clinicalImpression);
      addField("Care Plan", consultation.carePlan);

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
        "This report records the completed consultation. Follow the treating doctor's direct advice. Do not change or stop medicines without consulting a qualified medical professional."
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
    <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-semibold text-cyan-950">
            <FileText size={18} />
            {labels.title}
          </p>
          <p className="mt-1 text-xs text-cyan-700">
            {labels.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void downloadReport()}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"
        >
          {generating ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Download size={17} />
          )}
          {generating ? labels.generating : labels.download}
        </button>
      </div>

      {reportError && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {reportError}
        </p>
      )}
    </div>
  );
}
