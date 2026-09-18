"use client";

import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";

type ConnectionStatus = "pending" | "accepted" | "rejected" | "revoked";

type Permissions = {
  viewAssessments: boolean;
  viewAppointments: boolean;
};

type CaretakerConnection = {
  _id: string;
  caretaker: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
    accountStatus?: "active" | "disabled";
  };
  status: ConnectionStatus;
  permissions: Permissions;
  invitedAt: string;
};

type ConnectionsResponse = {
  success: boolean;
  message?: string;
  connections?: CaretakerConnection[];
  connection?: CaretakerConnection;
};

const statusStyles: Record<ConnectionStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  revoked: "bg-slate-200 text-slate-700",
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

export default function PatientCaretakerPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<CaretakerConnection[]>([]);
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({
    viewAssessments: true,
    viewAppointments: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
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

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/caretaker/patient/connections`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await readResponse<ConnectionsResponse>(response);
      setConnections(Array.isArray(data.connections) ? data.connections : []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load caretaker connections";

      if (await handleAuthenticationError(message)) return;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthenticationError]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const inviteCaretaker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter the caretaker email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/caretaker/patient/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            permissions,
          }),
        }
      );

      const data = await readResponse<ConnectionsResponse>(response);
      setSuccess(data.message || "Caretaker invitation sent successfully.");
      setEmail("");
      await loadConnections();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send the caretaker invitation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updatePermissions = async (
    connection: CaretakerConnection,
    nextPermissions: Permissions
  ) => {
    setUpdatingId(connection._id);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/caretaker/patient/connections/${connection._id}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPermissions),
        }
      );

      const data = await readResponse<ConnectionsResponse>(response);
      setConnections((current) =>
        current.map((item) =>
          item._id === connection._id
            ? data.connection || { ...item, permissions: nextPermissions }
            : item
        )
      );
      setSuccess(data.message || "Permissions updated successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update permissions"
      );
    } finally {
      setUpdatingId("");
    }
  };

  const revokeConnection = async (connection: CaretakerConnection) => {
    if (!window.confirm(`Remove access for ${connection.caretaker.fullName}?`)) {
      return;
    }

    setUpdatingId(connection._id);
    setError("");
    setSuccess("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/caretaker/patient/connections/${connection._id}/revoke`,
        {
          method: "PATCH",
        }
      );

      const data = await readResponse<ConnectionsResponse>(response);
      setSuccess(data.message || "Caretaker access removed.");
      await loadConnections();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove caretaker access"
      );
    } finally {
      setUpdatingId("");
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
              <UsersRound size={24} />
            </span>
            <div>
              <p className="font-bold">Tinnitus AI</p>
              <p className="text-xs text-slate-400">Caretaker access</p>
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
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <section className="mt-5 rounded-3xl bg-gradient-to-r from-[#07111f] to-[#0d2940] p-7 text-white">
          <p className="text-sm font-semibold text-cyan-300">Patient consent centre</p>
          <h1 className="mt-2 text-3xl font-bold">Caretaker Access</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Invite a registered caretaker and control exactly what information
            they are allowed to view.
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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <Mail size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold">Invite a caretaker</h2>
              <p className="mt-1 text-sm text-slate-500">
                The person must already have a registered caretaker account.
              </p>
            </div>
          </div>

          <form onSubmit={inviteCaretaker} className="mt-6">
            <label className="block text-sm font-semibold text-slate-700">
              Caretaker email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="caretaker@example.com"
                maxLength={254}
                required
                disabled={submitting}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-60"
              />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PermissionOption
                icon={<ClipboardList size={20} />}
                title="Assessment results"
                description="Allow access to tinnitus assessments and results."
                checked={permissions.viewAssessments}
                onChange={(checked) =>
                  setPermissions((current) => ({
                    ...current,
                    viewAssessments: checked,
                  }))
                }
                disabled={submitting}
              />

              <PermissionOption
                icon={<ShieldCheck size={20} />}
                title="Appointments"
                description="Allow access to consultation appointment details."
                checked={permissions.viewAppointments}
                onChange={(checked) =>
                  setPermissions((current) => ({
                    ...current,
                    viewAppointments: checked,
                  }))
                }
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {submitting && <LoaderCircle size={18} className="animate-spin" />}
              Send invitation
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Caretaker connections</h2>
              <p className="mt-1 text-sm text-slate-500">
                Permissions become active only after the caretaker accepts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadConnections()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-3 text-slate-500">
              <LoaderCircle size={22} className="animate-spin" />
              Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              No caretaker invitations have been created.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {connections.map((connection) => (
                <article key={connection._id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      {connection.caretaker?.profilePicture ? (
                        <img
                          src={connection.caretaker.profilePicture}
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
                        <h3 className="font-bold">
                          {connection.caretaker?.fullName || "Caretaker"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {connection.caretaker?.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Invited {formatDate(connection.invitedAt)}
                        </p>
                      </div>
                    </div>

                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[connection.status]}`}>
                      {connection.status}
                    </span>
                  </div>

                  {connection.status === "accepted" && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <PermissionOption
                        icon={<ClipboardList size={19} />}
                        title="Assessment results"
                        description="Caretaker may view shared assessments."
                        checked={connection.permissions.viewAssessments}
                        onChange={(checked) =>
                          void updatePermissions(connection, {
                            ...connection.permissions,
                            viewAssessments: checked,
                          })
                        }
                        disabled={updatingId === connection._id}
                      />

                      <PermissionOption
                        icon={<ShieldCheck size={19} />}
                        title="Appointments"
                        description="Caretaker may view appointment details."
                        checked={connection.permissions.viewAppointments}
                        onChange={(checked) =>
                          void updatePermissions(connection, {
                            ...connection.permissions,
                            viewAppointments: checked,
                          })
                        }
                        disabled={updatingId === connection._id}
                      />
                    </div>
                  )}

                  {(connection.status === "pending" ||
                    connection.status === "accepted") && (
                    <button
                      type="button"
                      onClick={() => void revokeConnection(connection)}
                      disabled={updatingId === connection._id}
                      className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {updatingId === connection._id ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                      Revoke access
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PermissionOption({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-cyan-600"
      />

      <span className="text-cyan-700">{icon}</span>

      <span>
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}
