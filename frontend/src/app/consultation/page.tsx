"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileHeart,
  LoaderCircle,
  LogOut,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { authenticatedFetch, logoutUser } from "../../../lib/authService";
import { consultationTranslations } from "../../../lib/consultationTranslations";
import { useLanguage } from "../context/LanguageContext";

type ConsultationType = "video" | "audio" | "chat" | "in_person";

type OpenSlot = {
  _id: string;
  startTime: string;
  endTime: string;
};

type DoctorSchedule = {
  _id: string;
  date: string;
  timezone: string;
  slots: OpenSlot[];
};

type VerifiedDoctor = {
  _id: string;
  profileId: string;
  fullName: string;
  profilePicture?: string;
  medicalCouncil: string;
  registrationNumber: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  consultationLanguages: string[];
  hospitalOrClinic?: string;
  professionalBio?: string;
  availability: DoctorSchedule[];
};

type DoctorsResponse = {
  success: boolean;
  message?: string;
  doctors?: VerifiedDoctor[];
};

type BookingResponse = {
  success: boolean;
  message?: string;
};

type PatientAssessment = {
  _id: string;
  createdAt: string;
  thi_score: number;
  tfi_score: number;
  outcome: string;
};

type AssessmentDashboardResponse = {
  success: boolean;
  message?: string;
  assessments?: PatientAssessment[];
};

type SelectedSlot = {
  doctorId: string;
  availabilityId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
};

// These additions are local to this page so no existing translation file
// needs to be changed. The rest of the page uses consultationTranslations.
const assessmentTranslations = {
  en: {
    sectionTitle: "Share tinnitus assessment (optional)",
    sectionDescription:
      "You may choose to share one previous assessment with your doctor for this appointment.",
    loading: "Loading your assessments...",
    noAssessments: "No previous assessments found. You can book without sharing one.",
    loadError: "Unable to load your assessments. You can still book without sharing.",
    consent: "I consent to sharing the selected assessment with this doctor.",
    selectLabel: "Choose an assessment",
    selectPlaceholder: "Select an assessment",
    resultLabel: "Assessment",
    thi: "THI",
    tfi: "TFI",
    consentRequired: "Please select an assessment to share, or turn off sharing.",
    privacy: "Sharing is optional. Leave this unchecked to book privately.",
  },
  kn: {
    sectionTitle: "ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ ಹಂಚಿಕೊಳ್ಳಿ (ಐಚ್ಛಿಕ)",
    sectionDescription:
      "ಈ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ ನಿಮ್ಮ ಹಿಂದಿನ ಒಂದು ಮೌಲ್ಯಮಾಪನವನ್ನು ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬಹುದು.",
    loading: "ನಿಮ್ಮ ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    noAssessments: "ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹಂಚಿಕೊಳ್ಳದೆಯೇ ಬುಕ್ ಮಾಡಬಹುದು.",
    loadError: "ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಆದರೂ ಬುಕ್ ಮಾಡಬಹುದು.",
    consent: "ಆಯ್ಕೆ ಮಾಡಿದ ಮೌಲ್ಯಮಾಪನವನ್ನು ಈ ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲು ನಾನು ಸಮ್ಮತಿಸುತ್ತೇನೆ.",
    selectLabel: "ಮೌಲ್ಯಮಾಪನವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    selectPlaceholder: "ಮೌಲ್ಯಮಾಪನವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    resultLabel: "ಮೌಲ್ಯಮಾಪನ",
    thi: "THI",
    tfi: "TFI",
    consentRequired: "ಹಂಚಿಕೊಳ್ಳಲು ಮೌಲ್ಯಮಾಪನವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಹಂಚಿಕೆಯನ್ನು ಆಫ್ ಮಾಡಿ.",
    privacy: "ಹಂಚಿಕೊಳ್ಳುವುದು ಐಚ್ಛಿಕ. ಹಂಚಿಕೊಳ್ಳದೆ ಬುಕ್ ಮಾಡಲು ಇದನ್ನು ಗುರುತಿಸಬೇಡಿ.",
  },
  hi: {
    sectionTitle: "टिनिटस मूल्यांकन साझा करें (वैकल्पिक)",
    sectionDescription:
      "आप इस अपॉइंटमेंट के लिए डॉक्टर के साथ अपना एक पिछला मूल्यांकन साझा कर सकते हैं।",
    loading: "आपके मूल्यांकन लोड हो रहे हैं...",
    noAssessments: "कोई पिछला मूल्यांकन नहीं मिला। आप बिना साझा किए बुक कर सकते हैं।",
    loadError: "मूल्यांकन लोड नहीं हो सके। आप फिर भी बिना साझा किए बुक कर सकते हैं।",
    consent: "मैं चुना गया मूल्यांकन इस डॉक्टर के साथ साझा करने की सहमति देता/देती हूँ।",
    selectLabel: "मूल्यांकन चुनें",
    selectPlaceholder: "मूल्यांकन चुनें",
    resultLabel: "मूल्यांकन",
    thi: "THI",
    tfi: "TFI",
    consentRequired: "कृपया साझा करने के लिए मूल्यांकन चुनें या साझा करना बंद करें।",
    privacy: "साझा करना वैकल्पिक है। निजी बुकिंग के लिए इसे अनचेक रखें।",
  },
};

const getApiUrl = (errorMessage: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) throw new Error(errorMessage);
  return apiUrl;
};

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function ConsultationPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const text = consultationTranslations[language];
  const assessmentText = assessmentTranslations[language];
  const locale = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-IN";

  const [doctors, setDoctors] = useState<VerifiedDoctor[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>("video");
  const [patientMessage, setPatientMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [assessments, setAssessments] = useState<PatientAssessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentError, setAssessmentError] = useState("");
  const [shareAssessment, setShareAssessment] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(text.apiNotConfigured)}/api/appointments/doctors`,
        { method: "GET", cache: "no-store" }
      );
      const data: DoctorsResponse = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401 || response.status === 403) {
          await logoutUser();
          router.replace("/login");
          return;
        }
        throw new Error(data.message || text.unableToLoadDoctors);
      }

      setDoctors(data.doctors || []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : text.unableToLoadDoctors;

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
    void loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    let cancelled = false;

    const loadAssessments = async () => {
      setAssessmentsLoading(true);
      setAssessmentError("");

      try {
        const response = await authenticatedFetch(
          `${getApiUrl(text.apiNotConfigured)}/api/assessment/dashboard`,
          { method: "GET", cache: "no-store" }
        );
        const data: AssessmentDashboardResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || assessmentText.loadError);
        }
        if (!cancelled) setAssessments(data.assessments || []);
      } catch (caughtError) {
        if (!cancelled) {
          setAssessments([]);
          setShareAssessment(false);
          setSelectedAssessmentId("");
          setAssessmentError(
            caughtError instanceof Error ? caughtError.message : assessmentText.loadError
          );
        }
      } finally {
        if (!cancelled) setAssessmentsLoading(false);
      }
    };

    void loadAssessments();
    return () => {
      cancelled = true;
    };
  }, [text.apiNotConfigured, assessmentText.loadError]);

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError(text.selectSlot);
      return;
    }

    if (shareAssessment && !selectedAssessmentId) {
      setError(assessmentText.consentRequired);
      return;
    }

    setError("");
    setSuccess("");
    setBooking(true);

    try {
      const response = await authenticatedFetch(
        `${getApiUrl(text.apiNotConfigured)}/api/appointments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availabilityId: selectedSlot.availabilityId,
            slotId: selectedSlot.slotId,
            consultationType,
            patientMessage: patientMessage.trim(),
            assessmentSharingConsent: shareAssessment,
            ...(shareAssessment ? { sharedAssessmentId: selectedAssessmentId } : {}),
          }),
        }
      );
      const data: BookingResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || text.unableToBook);
      }

      setSuccess(text.bookingSuccessful);
      setSelectedSlot(null);
      setPatientMessage("");
      setShareAssessment(false);
      setSelectedAssessmentId("");
      await loadDoctors();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : text.unableToBook;

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
      setBooking(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-[#07111f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Stethoscope size={24} />
            </span>
            <div>
              <p className="font-bold">Tinnitus AI</p>
              <p className="text-xs text-slate-400">{text.doctorConsultation}</p>
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

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <p className="text-sm font-semibold text-cyan-300">{text.verifiedProfessionals}</p>
          <h1 className="mt-2 text-3xl font-bold">{text.pageTitle}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            {text.pageDescription}
          </p>
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-slate-600">
            <LoaderCircle size={28} className="animate-spin text-cyan-600" />
            {text.loadingDoctors}
          </div>
        ) : doctors.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <UserRound size={42} className="mx-auto text-slate-400" />
            <h2 className="mt-4 text-xl font-bold">{text.noDoctors}</h2>
            <p className="mt-2 text-slate-500">{text.checkLater}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            {doctors.map((doctor) => (
              <article
                key={doctor._id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    {doctor.profilePicture ? (
                      // Keep the existing image handling; external doctor photo hosts vary.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doctor.profilePicture}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                        <UserRound size={30} />
                      </span>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">
                        {text.doctorPrefix} {doctor.fullName}
                      </h2>
                      <p className="mt-1 font-semibold text-cyan-700">{doctor.specialization}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {doctor.qualification} · {doctor.experienceYears} {text.yearsExperience}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {text.languages} {doctor.consultationLanguages.join(", ")}
                      </p>
                      {doctor.hospitalOrClinic && (
                        <p className="mt-1 text-sm text-slate-500">{doctor.hospitalOrClinic}</p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={17} />
                    {text.verifiedDoctor}
                  </span>
                </div>

                {doctor.professionalBio && (
                  <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {doctor.professionalBio}
                  </p>
                )}

                <div className="mt-6">
                  <h3 className="font-bold">{text.availableSlots}</h3>
                  {doctor.availability.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                      {text.noOpenSlots}
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {doctor.availability.map((schedule) => (
                        <div
                          key={schedule._id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="flex items-center gap-2 font-semibold">
                            <CalendarDays size={18} className="text-cyan-600" />
                            {formatDate(schedule.date, locale)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {schedule.slots.map((slot) => {
                              const selected =
                                selectedSlot?.doctorId === doctor._id &&
                                selectedSlot?.availabilityId === schedule._id &&
                                selectedSlot?.slotId === slot._id;

                              return (
                                <button
                                  type="button"
                                  key={slot._id}
                                  disabled={booking}
                                  onClick={() => {
                                    setSelectedSlot({
                                      doctorId: doctor._id,
                                      availabilityId: schedule._id,
                                      slotId: slot._id,
                                      date: schedule.date,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                    });
                                    setError("");
                                    setSuccess("");
                                  }}
                                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                                    selected
                                      ? "border-cyan-500 bg-cyan-500 text-slate-950"
                                      : "border-slate-300 bg-white hover:border-cyan-400 hover:bg-cyan-50"
                                  }`}
                                >
                                  <Clock3 size={16} />
                                  {slot.startTime}–{slot.endTime}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedSlot && (
          <section className="sticky bottom-4 mt-6 rounded-3xl border border-cyan-300 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold">{text.confirmRequest}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(selectedSlot.date, locale)} · {selectedSlot.startTime}–{selectedSlot.endTime}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold">{text.consultationType}</span>
                <select
                  value={consultationType}
                  onChange={(event) =>
                    setConsultationType(event.target.value as ConsultationType)
                  }
                  disabled={booking}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="video">{text.consultationTypes.video}</option>
                  <option value="audio">{text.consultationTypes.audio}</option>
                  <option value="chat">{text.consultationTypes.chat}</option>
                  <option value="in_person">{text.consultationTypes.in_person}</option>
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold">{text.messageToDoctor}</span>
                <textarea
                  value={patientMessage}
                  onChange={(event) => setPatientMessage(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  disabled={booking}
                  placeholder={text.messagePlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="flex items-center gap-2 font-bold">
                <FileHeart size={20} className="text-cyan-700" />
                {assessmentText.sectionTitle}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {assessmentText.sectionDescription}
              </p>

              {assessmentsLoading ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <LoaderCircle size={18} className="animate-spin" />
                  {assessmentText.loading}
                </p>
              ) : assessmentError ? (
                <p role="alert" className="mt-4 text-sm text-amber-800">
                  {assessmentText.loadError}
                </p>
              ) : assessments.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  {assessmentText.noAssessments}
                </p>
              ) : (
                <>
                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={shareAssessment}
                      disabled={booking}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setShareAssessment(checked);
                        if (!checked) setSelectedAssessmentId("");
                        setError("");
                      }}
                      className="mt-1 h-4 w-4 accent-cyan-600"
                    />
                    <span className="text-sm font-medium">{assessmentText.consent}</span>
                  </label>

                  {shareAssessment && (
                    <label className="mt-4 block">
                      <span className="text-sm font-semibold">
                        {assessmentText.selectLabel}
                      </span>
                      <select
                        value={selectedAssessmentId}
                        onChange={(event) => {
                          setSelectedAssessmentId(event.target.value);
                          setError("");
                        }}
                        disabled={booking}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                      >
                        <option value="">{assessmentText.selectPlaceholder}</option>
                        {assessments.map((assessment) => (
                          <option key={assessment._id} value={assessment._id}>
                            {assessmentText.resultLabel} — {formatDate(assessment.createdAt, locale)}
                            {` | ${assessmentText.thi}: ${assessment.thi_score} | ${assessmentText.tfi}: ${assessment.tfi_score}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
              <p className="mt-3 text-xs text-slate-500">{assessmentText.privacy}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                disabled={booking}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleBooking()}
                disabled={booking}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {booking && <LoaderCircle size={19} className="animate-spin" />}
                {booking ? text.booking : text.requestAppointment}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
