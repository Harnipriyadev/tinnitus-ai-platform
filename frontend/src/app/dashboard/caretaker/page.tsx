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

type ProfileResponse = {
  success: boolean;
  message?: string;
  user?: AuthenticatedUser;
};

type ConnectionStatus = "pending" | "accepted" | "rejected" | "revoked";

type CaretakerConnection = {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
    accountStatus?: "active" | "disabled";
  };
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

const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient: "/dashboard",
  caretaker: "/dashboard/caretaker",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
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
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

export default function CaretakerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [connections, setConnections] = useState<CaretakerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAuthenticationError = useCallback(
    async (message: string) => {
      if (
        message === "You are not authenticated" ||
        message.includes("session has ended")
      ) {
        await logoutUser();
        router.replace("/login");
        return true;
      }

      return false;
    },
    [router]
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileResponse, connectionsResponse] = await Promise.all([
        authenticatedFetch(`${getApiUrl()}/api/auth/me`, {
          method: "GET",
          cache: "no-store",
        }),
        authenticatedFetch(`${getApiUrl()}/api/caretaker/connections`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const profileData = await readResponse<ProfileResponse>(profileResponse);
      const connectionsData =
        await readResponse<ConnectionsResponse>(connectionsResponse);

      if (!profileData.user) {
        throw new Error("Caretaker profile was not received");
      }

      if (profileData.user.role !== "caretaker") {
        router.replace(ROLE_DASHBOARD[profileData.user.role]);
        return;
      }

      setUser(profileData.user);
      setConnections(
        Array.isArray(connectionsData.connections)
          ? connectionsData.connections
          : []
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load caretaker dashboard";

      if (await handleAuthenticationError(message)) return;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthenticationError, router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const pendingInvitations = useMemo(
    () => connections.filter((connection) => connection.status === "pending"),
    [connections]
  );

  const connectedPatients = useMemo(
    () => connections.filter((connection) => connection.status === "accepted"),
    [connections]
  );

  const respondToInvitation = async (
    connectionId: string,
    decision: "accepted" | "rejected"
  ) => {
    setRespondingId(connectionId);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/caretaker/invitations/${connectionId}/respond`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision }),
        }
      );

      const data = await readResponse<ConnectionsResponse>(response);
      setSuccess(
        data.message ||
          (decision === "accepted"
            ? "Invitation accepted successfully."
            : "Invitation rejected.")
      );
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to respond to the invitation"
      );
    } finally {
      setRespondingId("");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  if (loading && !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
        <HeartHandshake size={50} className="animate-pulse text-cyan-600" />
        <p className="font-medium text-slate-600">Loading caretaker dashboard...</p>
      </main>
    );
  }

  if (!user && error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-100 px-6 text-center">
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#07111f] px-5 py-6 text-white lg:flex">
          <Link href="/" className="flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <BrainCircuit size={25} />
            </span>
            <div>
              <p className="font-bold">Tinnitus AI</p>
              <p className="text-xs text-slate-400">Caretaker Support</p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            <SidebarItem href="#overview" icon={<HeartHandshake size={19} />} label="Overview" />
            <SidebarItem href="#patients" icon={<Users size={19} />} label="Connected Patients" />
            <SidebarItem href="#invitations" icon={<Mail size={19} />} label="Invitations" />
          </nav>

          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck size={19} />
              <p className="text-sm font-semibold">Permission protected</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              You can access only information explicitly shared by a patient.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Log out
          </button>
        </aside>

        <section className="w-full lg:ml-72">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Caretaker workspace</p>
              <h1 className="font-bold">Tinnitus AI</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void loadDashboard()}
                disabled={loading}
                aria-label="Refresh dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs capitalize text-cyan-700">{user.role}</p>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            <section id="overview" className="rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white shadow-lg sm:p-9">
              <p className="text-sm font-semibold text-cyan-300">Caretaker dashboard</p>
              <h2 className="mt-2 text-3xl font-bold">Welcome, {user.fullName}</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Review invitations and support patients using only the access
                they have granted.
              </p>
            </section>

            {error && (
              <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 size={19} />
                {success}
              </div>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <StatCard
                icon={<Users size={23} />}
                label="Connected patients"
                value={String(connectedPatients.length)}
                color="bg-cyan-50 text-cyan-700"
              />
              <StatCard
                icon={<Mail size={23} />}
                label="Pending invitations"
                value={String(pendingInvitations.length)}
                color="bg-violet-50 text-violet-700"
              />
            </div>

            <section id="invitations" className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Mail size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Pending invitations</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Accept only invitations from patients you recognize.
                  </p>
                </div>
              </div>

              {pendingInvitations.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No pending invitations.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {pendingInvitations.map((connection) => (
                    <ConnectionCard
                      key={connection._id}
                      connection={connection}
                      busy={respondingId === connection._id}
                      onAccept={() =>
                        void respondToInvitation(connection._id, "accepted")
                      }
                      onReject={() =>
                        void respondToInvitation(connection._id, "rejected")
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section id="patients" className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Users size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Connected patients</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Access remains controlled by each patient.
                  </p>
                </div>
              </div>

              {connectedPatients.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <HeartHandshake size={38} className="mx-auto text-cyan-700" />
                  <h3 className="mt-3 font-bold">No connected patients yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    A patient must invite you before their information is available.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {connectedPatients.map((connection) => (
                    <ConnectionCard
                      key={connection._id}
                      connection={connection}
                      busy={false}
                    />
                  ))}
                </div>
              )}
            </section>
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
}: {
  connection: CaretakerConnection;
  busy: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          {connection.patient?.profilePicture ? (
            <img
              src={connection.patient.profilePicture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <UserRound size={23} />
            </span>
          )}

          <div>
            <h3 className="font-bold">{connection.patient?.fullName || "Patient"}</h3>
            <p className="mt-1 text-sm text-slate-500">{connection.patient?.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Invited {formatDate(connection.invitedAt)}
            </p>
          </div>
        </div>

        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          connection.status === "accepted"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
        }`}>
          {connection.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PermissionBadge
          icon={<ClipboardList size={17} />}
          label="Assessment results"
          allowed={connection.permissions.viewAssessments}
        />
        <PermissionBadge
          icon={<CalendarDays size={17} />}
          label="Appointments"
          allowed={connection.permissions.viewAppointments}
        />
      </div>

      {connection.status === "pending" && onAccept && onReject && (
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
            onClick={onAccept}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            Accept
          </button>
        </div>
      )}
    </article>
  );
}

function PermissionBadge({
  icon,
  label,
  allowed,
}: {
  icon: ReactNode;
  label: string;
  allowed: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
      allowed
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-500"
    }`}>
      {icon}
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs font-semibold">
        {allowed ? "Allowed" : "Not allowed"}
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
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
        {icon}
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
