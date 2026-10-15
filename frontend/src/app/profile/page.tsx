"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";
import {
  profileTranslations,
} from "../../../lib/profileTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

type UserRole =
  | "patient"
  | "caretaker"
  | "doctor"
  | "admin"
  | "user";

type UserData = {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  role?: UserRole;
  emailVerified?: boolean;
  accountStatus?: string;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  user?: UserData;
};

export default function ProfilePage() {
  const router = useRouter();
  const { language } =
    useLanguage();

  const text =
    profileTranslations[language];

  const [user, setUser] =
    useState<UserData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    const loadProfile =
      async () => {
        setLoading(true);
        setError("");

        try {
          const apiUrl =
            process.env
              .NEXT_PUBLIC_API_URL
              ?.replace(
                /\/+$/,
                ""
              );

          if (!apiUrl) {
            throw new Error(
              text.apiNotConfigured
            );
          }

          const response =
            await authenticatedFetch(
              `${apiUrl}/api/auth/me`,
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          const data:
            ProfileResponse =
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
                text.unableToLoad
            );
          }

          if (!data.user) {
            throw new Error(
              text.profileNotReceived
            );
          }

          setUser(data.user);

          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user
            )
          );
        } catch (caughtError) {
          if (
            caughtError instanceof
              DOMException &&
            caughtError.name ===
              "AbortError"
          ) {
            return;
          }

          if (
            caughtError instanceof
              Error &&
            (caughtError.message ===
              "You are not authenticated" ||
              caughtError.message.includes(
                "session has ended"
              ))
          ) {
            await logoutUser();
            router.replace(
              "/login"
            );
            return;
          }

          console.error(
            "Profile loading error:",
            caughtError
          );

          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : text.unableToLoad
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(false);
          }
        }
      };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [router, text]);

  const handleLogout =
    async () => {
      try {
        await logoutUser();
      } finally {
        localStorage.removeItem(
          "prediction"
        );

        router.replace(
          "/login"
        );
      }
    };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050d18] text-white">
        <p className="animate-pulse text-cyan-300">
          {text.loading}
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#050d18] px-6 text-center text-white">
        <p className="text-red-300">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
        >
          {text.tryAgain}
        </button>
      </main>
    );
  }

  const role =
    user?.role &&
    user.role in text.roles
      ? user.role
      : "patient";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050d18] px-5 py-10 text-white">
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[150px]" />

      <div className="relative mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 transition hover:text-cyan-300"
          >
            <ArrowLeft size={19} />
            {text.backToDashboard}
          </Link>

          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-400/15"
          >
            <LogOut size={18} />
            {text.logout}
          </button>
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-blue-500/5 p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                {user
                  ?.profilePicture ? (
                  <img
                    src={
                      user.profilePicture
                    }
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    size={45}
                  />
                )}
              </div>

              <div>
                <p className="text-sm text-cyan-300">
                  {text.profileLabel}
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  {user?.fullName ||
                    text.defaultUser}
                </h1>

                <p className="mt-2 text-slate-400">
                  {text.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-8 md:grid-cols-2">
            <ProfileField
              icon={
                <UserRound
                  size={21}
                />
              }
              label={text.fullName}
              value={
                user?.fullName ||
                text.notAvailable
              }
            />

            <ProfileField
              icon={
                <Mail size={21} />
              }
              label={
                text.emailAddress
              }
              value={
                user?.email ||
                text.notAvailable
              }
            />

            <ProfileField
              icon={
                <ShieldCheck
                  size={21}
                />
              }
              label={
                text.accountStatus
              }
              value={
                user?.accountStatus ===
                "active"
                  ? text.activeProtected
                  : text.protectedAccount
              }
            />

            <ProfileField
              icon={
                <ShieldCheck
                  size={21}
                />
              }
              label={
                text.emailVerification
              }
              value={
                user?.emailVerified
                  ? text.verified
                  : text.verificationPending
              }
            />

            <ProfileField
              icon={
                <BrainCircuit
                  size={21}
                />
              }
              label={
                text.carePlatform
              }
              value={
                text.platformName
              }
            />

            <ProfileField
              icon={
                <UserRound
                  size={21}
                />
              }
              label={
                text.accountRole
              }
              value={
                text.roles[role]
              }
            />
          </div>

          <div className="border-t border-white/10 p-8">
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <LayoutDashboard
                size={19}
              />
              {text.openDashboard}
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          {text.securityNote}
        </p>
      </div>
    </main>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}
