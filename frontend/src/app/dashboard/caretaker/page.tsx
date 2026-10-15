"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  LoaderCircle,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
  type AuthenticatedUser,
  type UserRole,
} from "../../../../lib/authService";
import {
  caretakerDashboardTranslations,
} from "../../../../lib/caretakerDashboardTranslations";
import {
  useLanguage,
} from "../../context/LanguageContext";

type ConnectionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "revoked";

type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type ConsultationType =
  | "video"
  | "audio"
  | "chat"
  | "in_person";

type ProfileResponse = {
  success: boolean;
  message?: string;
  user?: AuthenticatedUser;
};

type Patient = {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  accountStatus?: "active" | "disabled";
};

type CaretakerConnection = {
  _id: string;
  patient: Patient;
  status: ConnectionStatus;
  permissions: {
    viewAssessments: boolean;
    viewAppointments: boolean;
  };
  invitedAt: string;
  respondedAt?: string | null;
};

type ConnectionsResponse = {
  success: boolean;
  message?: string;
  connections?: CaretakerConnection[];
  connection?: CaretakerConnection;
};

type Assessment = {
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
  treatment: string;
  outcome: string;
  createdAt: string;
};

type Appointment = {
  _id: string;
  doctor?: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  consultationType: ConsultationType;
  patientMessage: string;
  status: AppointmentStatus;
  doctorResponse: string;
  cancellationReason: string;
  createdAt: string;
};

type AssessmentsResponse = {
  success: boolean;
  message?: string;
  patient?: Patient;
  assessments?: Assessment[];
};

type AppointmentsResponse = {
  success: boolean;
  message?: string;
  patient?: Patient;
  appointments?: Appointment[];
};

type PatientView =
  | "assessments"
  | "appointments"
  | null;

type CaretakerText =
  (typeof caretakerDashboardTranslations)[keyof typeof caretakerDashboardTranslations];

const ROLE_DASHBOARD: Record<
  UserRole,
  string
> = {
  patient: "/dashboard",
  caretaker:
    "/dashboard/caretaker",
  doctor:
    "/dashboard/doctor",
  admin: "/dashboard/admin",
};

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
  locale: string,
  includeTime = true
) =>
  new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "medium",
      ...(includeTime
        ? {
            timeStyle:
              "short" as const,
          }
        : {}),
      timeZone:
        "Asia/Kolkata",
    }
  ).format(new Date(value));

export default function CaretakerDashboardPage() {
  const router = useRouter();
  const { language } =
    useLanguage();
  const text =
    caretakerDashboardTranslations[
      language
    ];

  const locale =
    language === "kn"
      ? "kn-IN"
      : language === "hi"
        ? "hi-IN"
        : "en-IN";

  const [user, setUser] =
    useState<AuthenticatedUser | null>(
      null
    );
  const [
    connections,
    setConnections,
  ] = useState<
    CaretakerConnection[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [
    respondingId,
    setRespondingId,
  ] = useState("");
  const [
    selectedConnection,
    setSelectedConnection,
  ] =
    useState<CaretakerConnection | null>(
      null
    );
  const [
    patientView,
    setPatientView,
  ] = useState<PatientView>(null);
  const [
    assessments,
    setAssessments,
  ] = useState<Assessment[]>([]);
  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>([]);
  const [
    dataLoading,
    setDataLoading,
  ] = useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const handleAuthenticationError =
    useCallback(
      async (message: string) => {
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
          return true;
        }

        return false;
      },
      [router]
    );

  const loadDashboard =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const apiUrl = getApiUrl(
          text.apiNotConfigured
        );

        const [
          profileResponse,
          connectionsResponse,
        ] = await Promise.all([
          authenticatedFetch(
            `${apiUrl}/api/auth/me`,
            {
              method: "GET",
              cache: "no-store",
            }
          ),
          authenticatedFetch(
            `${apiUrl}/api/caretaker/connections`,
            {
              method: "GET",
              cache: "no-store",
            }
          ),
        ]);

        const profileData =
          await readResponse<ProfileResponse>(
            profileResponse,
            text.requestFailed
          );

        const connectionsData =
          await readResponse<ConnectionsResponse>(
            connectionsResponse,
            text.requestFailed
          );

        if (!profileData.user) {
          throw new Error(
            text.profileMissing
          );
        }

        if (
          profileData.user.role !==
          "caretaker"
        ) {
          router.replace(
            ROLE_DASHBOARD[
              profileData.user.role
            ]
          );
          return;
        }

        setUser(profileData.user);
        setConnections(
          Array.isArray(
            connectionsData.connections
          )
            ? connectionsData.connections
            : []
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : text.unableToLoadDashboard;

        if (
          await handleAuthenticationError(
            message
          )
        ) {
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }, [
      handleAuthenticationError,
      router,
      text,
    ]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const pendingInvitations =
    useMemo(
      () =>
        connections.filter(
          (connection) =>
            connection.status ===
            "pending"
        ),
      [connections]
    );

  const connectedPatients =
    useMemo(
      () =>
        connections.filter(
          (connection) =>
            connection.status ===
            "accepted"
        ),
      [connections]
    );

  const respondToInvitation =
    async (
      connectionId: string,
      decision:
        | "accepted"
        | "rejected"
    ) => {
      setRespondingId(
        connectionId
      );
      setError("");
      setSuccess("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl(
              text.apiNotConfigured
            )}/api/caretaker/invitations/${connectionId}/respond`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  decision,
                }),
            }
          );

        await readResponse<ConnectionsResponse>(
          response,
          text.requestFailed
        );

        setSuccess(
          decision === "accepted"
            ? text.invitationAccepted
            : text.invitationRejected
        );

        await loadDashboard();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : text.unableToRespond
        );
      } finally {
        setRespondingId("");
      }
    };

  const loadPatientAssessments =
    async (
      connection: CaretakerConnection
    ) => {
      setSelectedConnection(
        connection
      );
      setPatientView(
        "assessments"
      );
      setAssessments([]);
      setAppointments([]);
      setDataLoading(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl(
              text.apiNotConfigured
            )}/api/caretaker/connections/${connection._id}/assessments`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await readResponse<AssessmentsResponse>(
            response,
            text.requestFailed
          );

        setAssessments(
          Array.isArray(
            data.assessments
          )
            ? data.assessments
            : []
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : text.unableToLoadAssessments;

        if (
          await handleAuthenticationError(
            message
          )
        ) {
          return;
        }

        setError(message);
      } finally {
        setDataLoading(false);
      }
    };

  const loadPatientAppointments =
    async (
      connection: CaretakerConnection
    ) => {
      setSelectedConnection(
        connection
      );
      setPatientView(
        "appointments"
      );
      setAssessments([]);
      setAppointments([]);
      setDataLoading(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await authenticatedFetch(
            `${getApiUrl(
              text.apiNotConfigured
            )}/api/caretaker/connections/${connection._id}/appointments`,
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
          caughtError instanceof Error
            ? caughtError.message
            : text.unableToLoadAppointments;

        if (
          await handleAuthenticationError(
            message
          )
        ) {
          return;
        }

        setError(message);
      } finally {
        setDataLoading(false);
      }
    };

  const closePatientData = () => {
    setPatientView(null);
    setSelectedConnection(null);
    setAssessments([]);
    setAppointments([]);
  };

  const handleLogout =
    async () => {
      await logoutUser();
      router.replace(
        "/login"
      );
    };

  if (loading && !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
        <HeartHandshake
          size={50}
          className="animate-pulse text-cyan-600"
        />
        <p className="font-medium text-slate-600">
          {text.loadingDashboard}
        </p>
      </main>
    );
  }

  if (!user && error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-100 px-6 text-center">
        <p className="text-lg font-semibold text-red-600">
          {error}
        </p>
        <button
          type="button"
          onClick={() =>
            void loadDashboard()
          }
          className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white"
        >
          {text.tryAgain}
        </button>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#07111f] px-5 py-6 text-white lg:flex">
          <Link
            href="/"
            className="flex items-center gap-3 px-2"
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
                {
                  text.caretakerSupport
                }
              </p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            <SidebarItem
              href="#overview"
              icon={
                <HeartHandshake
                  size={19}
                />
              }
              label={text.overview}
            />
            <SidebarItem
              href="#patients"
              icon={
                <Users size={19} />
              }
              label={
                text.connectedPatients
              }
            />
            <SidebarItem
              href="#invitations"
              icon={
                <Mail size={19} />
              }
              label={text.invitations}
            />
          </nav>

          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck
                size={19}
              />
              <p className="text-sm font-semibold">
                {
                  text.permissionProtected
                }
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {
                text.permissionDescription
              }
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            {text.logout}
          </button>
        </aside>

        <section className="w-full lg:ml-72">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div>
              <p className="text-sm text-slate-500">
                {text.workspace}
              </p>
              <h1 className="font-bold">
                Tinnitus AI
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadDashboard()
                }
                disabled={loading}
                aria-label={
                  text.refreshDashboard
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                <p className="text-sm font-semibold">
                  {user.fullName}
                </p>
                <p className="text-xs text-cyan-700">
                  {text.caretaker}
                </p>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            <section
              id="overview"
              className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white shadow-lg sm:p-9"
            >
              <p className="text-sm font-semibold text-cyan-300">
                {text.dashboard}
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                {text.welcome},{" "}
                {user.fullName}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                {
                  text.dashboardDescription
                }
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
                className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
              >
                <CheckCircle2
                  size={19}
                />
                {success}
              </div>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <StatCard
                icon={
                  <Users size={23} />
                }
                label={
                  text.connectedPatientsCount
                }
                value={String(
                  connectedPatients.length
                )}
                color="bg-cyan-50 text-cyan-700"
              />
              <StatCard
                icon={
                  <Mail size={23} />
                }
                label={
                  text.pendingInvitationsCount
                }
                value={String(
                  pendingInvitations.length
                )}
                color="bg-violet-50 text-violet-700"
              />
            </div>

            <section
              id="invitations"
              className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <SectionHeading
                icon={
                  <Mail size={22} />
                }
                title={
                  text.pendingInvitations
                }
                description={
                  text.invitationGuidance
                }
                color="bg-violet-100 text-violet-700"
              />

              {pendingInvitations.length ===
              0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {
                    text.noPendingInvitations
                  }
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {pendingInvitations.map(
                    (connection) => (
                      <ConnectionCard
                        key={
                          connection._id
                        }
                        connection={
                          connection
                        }
                        busy={
                          respondingId ===
                          connection._id
                        }
                        onAccept={() =>
                          void respondToInvitation(
                            connection._id,
                            "accepted"
                          )
                        }
                        onReject={() =>
                          void respondToInvitation(
                            connection._id,
                            "rejected"
                          )
                        }
                        locale={locale}
                        text={text}
                      />
                    )
                  )}
                </div>
              )}
            </section>

            <section
              id="patients"
              className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <SectionHeading
                icon={
                  <Users size={22} />
                }
                title={
                  text.connectedPatientsTitle
                }
                description={
                  text.patientAccessDescription
                }
                color="bg-cyan-100 text-cyan-700"
              />

              {connectedPatients.length ===
              0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <HeartHandshake
                    size={38}
                    className="mx-auto text-cyan-700"
                  />
                  <h3 className="mt-3 font-bold">
                    {
                      text.noConnectedPatients
                    }
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {
                      text.noConnectedPatientsDescription
                    }
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {connectedPatients.map(
                    (connection) => (
                      <ConnectionCard
                        key={
                          connection._id
                        }
                        connection={
                          connection
                        }
                        busy={false}
                        onViewAssessments={() =>
                          void loadPatientAssessments(
                            connection
                          )
                        }
                        onViewAppointments={() =>
                          void loadPatientAppointments(
                            connection
                          )
                        }
                        locale={locale}
                        text={text}
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {patientView &&
              selectedConnection && (
                <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-cyan-700">
                        {
                          text.sharedPatientInformation
                        }
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {
                          selectedConnection
                            .patient.fullName
                        }
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {patientView ===
                        "assessments"
                          ? text.assessmentResults
                          : text.appointmentDetails}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        closePatientData
                      }
                      className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <X size={17} />
                      {text.close}
                    </button>
                  </div>

                  {dataLoading ? (
                    <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
                      <LoaderCircle
                        size={24}
                        className="animate-spin text-cyan-600"
                      />
                      {
                        text.loadingPatientData
                      }
                    </div>
                  ) : patientView ===
                    "assessments" ? (
                    <AssessmentList
                      assessments={
                        assessments
                      }
                      locale={locale}
                      text={text}
                    />
                  ) : (
                    <AppointmentList
                      appointments={
                        appointments
                      }
                      locale={locale}
                      text={text}
                    />
                  )}
                </section>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ConnectionCard({
  connection,
  busy,
  onAccept,
  onReject,
  onViewAssessments,
  onViewAppointments,
  locale,
  text,
}: {
  connection: CaretakerConnection;
  busy: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onViewAssessments?: () => void;
  onViewAppointments?: () => void;
  locale: string;
  text: CaretakerText;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          {connection.patient
            ?.profilePicture ? (
            <img
              src={
                connection.patient
                  .profilePicture
              }
              alt=""
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <UserRound
                size={23}
              />
            </span>
          )}

          <div>
            <h3 className="font-bold">
              {connection.patient
                ?.fullName ||
                text.patient}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {
                connection.patient
                  ?.email
              }
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {text.invited}{" "}
              {formatDate(
                connection.invitedAt,
                locale
              )}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            connection.status ===
            "accepted"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {
            text.statuses[
              connection.status
            ]
          }
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PermissionBadge
          icon={
            <ClipboardList
              size={17}
            />
          }
          label={
            text.assessmentResults
          }
          allowed={
            connection.permissions
              .viewAssessments
          }
          text={text}
        />
        <PermissionBadge
          icon={
            <CalendarDays
              size={17}
            />
          }
          label={text.appointments}
          allowed={
            connection.permissions
              .viewAppointments
          }
          text={text}
        />
      </div>

      {connection.status ===
        "accepted" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {connection.permissions
            .viewAssessments &&
            onViewAssessments && (
              <button
                type="button"
                onClick={
                  onViewAssessments
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-semibold text-white hover:bg-cyan-700"
              >
                <ClipboardList
                  size={18}
                />
                {
                  text.viewAssessments
                }
              </button>
            )}

          {connection.permissions
            .viewAppointments &&
            onViewAppointments && (
              <button
                type="button"
                onClick={
                  onViewAppointments
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700"
              >
                <CalendarDays
                  size={18}
                />
                {
                  text.viewAppointments
                }
              </button>
            )}
        </div>
      )}

      {connection.status ===
        "pending" &&
        onAccept &&
        onReject && (
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
              onClick={onAccept}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Check size={18} />
              )}
              {text.accept}
            </button>
          </div>
        )}
    </article>
  );
}

function AssessmentList({
  assessments,
  locale,
  text,
}: {
  assessments: Assessment[];
  locale: string;
  text: CaretakerText;
}) {
  if (assessments.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
        {text.noAssessmentResults}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {assessments.map(
        (assessment, index) => (
          <article
            key={assessment._id}
            className="rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <h3 className="font-bold">
                {text.assessment}{" "}
                {assessments.length -
                  index}
              </h3>
              <p className="text-sm text-slate-500">
                {formatDate(
                  assessment.createdAt,
                  locale
                )}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DataField
                label={text.tinnitusType}
                value={
                  assessment.tinnitus_type
                }
              />
              <DataField
                label={text.affectedEar}
                value={
                  assessment.affected_ear
                }
              />
              <DataField
                label={text.hearingLoss}
                value={
                  assessment.hearing_loss
                }
              />
              <DataField
                label={text.frequency}
                value={`${assessment.frequency_hz} Hz`}
              />
              <DataField
                label={text.loudness}
                value={`${assessment.loudness_db} dB`}
              />
              <DataField
                label={text.thiScore}
                value={String(
                  assessment.thi_score
                )}
              />
              <DataField
                label={text.tfiScore}
                value={String(
                  assessment.tfi_score
                )}
              />
              <DataField
                label={text.anxietyScore}
                value={String(
                  assessment.hads_anxiety
                )}
              />
              <DataField
                label={
                  text.depressionScore
                }
                value={String(
                  assessment.hads_depression
                )}
              />
              <DataField
                label={text.sleepScore}
                value={String(
                  assessment.sleep_score
                )}
              />
              <DataField
                label={text.treatment}
                value={
                  assessment.treatment
                }
              />
              <DataField
                label={text.outcome}
                value={
                  assessment.outcome ||
                  text.notRecorded
                }
              />
            </div>
          </article>
        )
      )}
    </div>
  );
}

function AppointmentList({
  appointments,
  locale,
  text,
}: {
  appointments: Appointment[];
  locale: string;
  text: CaretakerText;
}) {
  if (appointments.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
        {text.noAppointments}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {appointments.map(
        (appointment) => (
          <article
            key={appointment._id}
            className="rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <h3 className="font-bold">
                  {text.doctorPrefix}{" "}
                  {appointment.doctor
                    ?.fullName ||
                    text.doctor}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {
                    text.consultationTypes[
                      appointment
                        .consultationType
                    ]
                  }
                </p>
              </div>

              <span className="h-fit w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                {
                  text.statuses[
                    appointment.status
                  ]
                }
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DataField
                label={text.date}
                value={formatDate(
                  appointment.appointmentDate,
                  locale,
                  false
                )}
              />
              <DataField
                label={text.time}
                value={`${appointment.startTime}–${appointment.endTime}`}
              />
              <DataField
                label={text.timezone}
                value={
                  appointment.timezone
                }
              />
            </div>

            {appointment.patientMessage && (
              <MessagePanel
                label={
                  text.patientMessage
                }
                value={
                  appointment.patientMessage
                }
                className="bg-slate-50 text-slate-700"
              />
            )}

            {appointment.doctorResponse && (
              <MessagePanel
                label={
                  text.doctorResponse
                }
                value={
                  appointment.doctorResponse
                }
                className="bg-cyan-50 text-cyan-800"
              />
            )}

            {appointment.cancellationReason && (
              <MessagePanel
                label={
                  text.cancellationReason
                }
                value={
                  appointment.cancellationReason
                }
                className="bg-red-50 text-red-700"
              />
            )}
          </article>
        )
      )}
    </div>
  );
}

function MessagePanel({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`mt-3 rounded-xl p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-sm">
        {value}
      </p>
    </div>
  );
}

function DataField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function PermissionBadge({
  icon,
  label,
  allowed,
  text,
}: {
  icon: ReactNode;
  label: string;
  allowed: boolean;
  text: CaretakerText;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
        allowed
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {icon}
      <span className="font-medium">
        {label}
      </span>
      <span className="ml-auto text-xs font-semibold">
        {allowed
          ? text.allowed
          : text.notAllowed}
      </span>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
    >
      {icon}
      {label}
    </a>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}
      >
        {icon}
      </div>
      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  color,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
