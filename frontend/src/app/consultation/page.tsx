"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";

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

type SelectedSlot = {
  doctorId: string;
  availabilityId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
};

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

const formatDate = (
  value: string
) =>
  new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      weekday:
        "short",

      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    new Date(
      value
    )
  );

export default function ConsultationPage() {
  const router =
    useRouter();

  const [
    doctors,
    setDoctors,
  ] =
    useState<
      VerifiedDoctor[]
    >([]);

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<
      SelectedSlot | null
    >(null);

  const [
    consultationType,
    setConsultationType,
  ] =
    useState(
      "video"
    );

  const [
    patientMessage,
    setPatientMessage,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    booking,
    setBooking,
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

  const loadDoctors =
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl()}/api/appointments/doctors`,
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        const data:
          DoctorsResponse =
            await response
              .json();

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
              "Unable to load doctors"
          );
        }

        setDoctors(
          data.doctors ||
            []
        );
      } catch (
        caughtError
      ) {
        const message =
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to load doctors";

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

        setError(
          message
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadDoctors();
  }, []);

  const handleBooking =
    async () => {
      if (
        !selectedSlot
      ) {
        setError(
          "Select an available time slot."
        );

        return;
      }

      setError("");
      setSuccess("");
      setBooking(true);

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl()}/api/appointments`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  availabilityId:
                    selectedSlot
                      .availabilityId,

                  slotId:
                    selectedSlot
                      .slotId,

                  consultationType,

                  patientMessage:
                    patientMessage
                      .trim(),

                  assessmentSharingConsent:
                    false,
                }),
            }
          );

        const data:
          BookingResponse =
            await response
              .json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to book appointment"
          );
        }

        setSuccess(
          data.message ||
            "Appointment request submitted successfully."
        );

        setSelectedSlot(
          null
        );

        setPatientMessage(
          ""
        );

        await loadDoctors();
      } catch (
        caughtError
      ) {
        const message =
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to book appointment";

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

        setError(
          message
        );
      } finally {
        setBooking(false);
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
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Stethoscope
                size={24}
              />
            </span>

            <div>
              <p className="font-bold">
                Tinnitus AI
              </p>

              <p className="text-xs text-slate-400">
                Doctor consultation
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

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <p className="text-sm font-semibold text-cyan-300">
            Verified medical
            professionals
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Book a Doctor
            Consultation
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Choose a verified
            doctor and request one
            of their available
            consultation slots.
          </p>
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
              size={20}
            />

            {success}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-slate-600">
            <LoaderCircle
              size={28}
              className="animate-spin text-cyan-600"
            />

            Loading verified
            doctors...
          </div>
        ) : doctors.length ===
          0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <UserRound
              size={42}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-bold">
              No verified doctors
              are available
            </h2>

            <p className="mt-2 text-slate-500">
              Please check again
              later.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            {doctors.map(
              (doctor) => (
                <article
                  key={
                    doctor._id
                  }
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      {doctor.profilePicture ? (
                        <img
                          src={
                            doctor.profilePicture
                          }
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                          <UserRound
                            size={30}
                          />
                        </span>
                      )}

                      <div>
                        <h2 className="text-2xl font-bold">
                          Dr.{" "}
                          {
                            doctor.fullName
                          }
                        </h2>

                        <p className="mt-1 font-semibold text-cyan-700">
                          {
                            doctor.specialization
                          }
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {
                            doctor.qualification
                          }
                          {" · "}
                          {
                            doctor.experienceYears
                          }{" "}
                          years experience
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Languages:{" "}
                          {doctor.consultationLanguages.join(
                            ", "
                          )}
                        </p>

                        {doctor.hospitalOrClinic && (
                          <p className="mt-1 text-sm text-slate-500">
                            {
                              doctor.hospitalOrClinic
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2
                        size={17}
                      />

                      Verified Doctor
                    </span>
                  </div>

                  {doctor.professionalBio && (
                    <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {
                        doctor.professionalBio
                      }
                    </p>
                  )}

                  <div className="mt-6">
                    <h3 className="font-bold">
                      Available slots
                    </h3>

                    {doctor.availability
                      .length ===
                    0 ? (
                      <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                        This doctor has
                        no open slots.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {doctor.availability.map(
                          (
                            schedule
                          ) => (
                            <div
                              key={
                                schedule._id
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <p className="flex items-center gap-2 font-semibold">
                                <CalendarDays
                                  size={
                                    18
                                  }
                                  className="text-cyan-600"
                                />

                                {formatDate(
                                  schedule.date
                                )}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {schedule.slots.map(
                                  (
                                    slot
                                  ) => {
                                    const selected =
                                      selectedSlot
                                        ?.slotId ===
                                      slot._id;

                                    return (
                                      <button
                                        type="button"
                                        key={
                                          slot._id
                                        }
                                        onClick={() => {
                                          setSelectedSlot(
                                            {
                                              doctorId:
                                                doctor._id,

                                              availabilityId:
                                                schedule._id,

                                              slotId:
                                                slot._id,

                                              date:
                                                schedule.date,

                                              startTime:
                                                slot.startTime,

                                              endTime:
                                                slot.endTime,
                                            }
                                          );

                                          setError(
                                            ""
                                          );

                                          setSuccess(
                                            ""
                                          );
                                        }}
                                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                          selected
                                            ? "border-cyan-500 bg-cyan-500 text-slate-950"
                                            : "border-slate-300 bg-white hover:border-cyan-400 hover:bg-cyan-50"
                                        }`}
                                      >
                                        <Clock3
                                          size={
                                            16
                                          }
                                        />

                                        {
                                          slot.startTime
                                        }
                                        –
                                        {
                                          slot.endTime
                                        }
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}

        {selectedSlot && (
          <section className="sticky bottom-4 mt-6 rounded-3xl border border-cyan-300 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold">
              Confirm appointment
              request
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {formatDate(
                selectedSlot.date
              )}
              {" · "}
              {
                selectedSlot.startTime
              }
              –
              {
                selectedSlot.endTime
              }
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold">
                  Consultation type
                </span>

                <select
                  value={
                    consultationType
                  }
                  onChange={(
                    event
                  ) =>
                    setConsultationType(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    booking
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="video">
                    Video
                  </option>

                  <option value="audio">
                    Audio
                  </option>

                  <option value="chat">
                    Chat
                  </option>

                  <option value="in_person">
                    In person
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold">
                  Message to doctor
                </span>

                <textarea
                  value={
                    patientMessage
                  }
                  onChange={(
                    event
                  ) =>
                    setPatientMessage(
                      event.target
                        .value
                    )
                  }
                  maxLength={
                    1000
                  }
                  rows={3}
                  disabled={
                    booking
                  }
                  placeholder="Briefly describe what you would like to discuss."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setSelectedSlot(
                    null
                  )
                }
                disabled={
                  booking
                }
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleBooking()
                }
                disabled={
                  booking
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {booking && (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                )}

                {booking
                  ? "Booking..."
                  : "Request Appointment"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
