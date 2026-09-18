"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  motion,
} from "framer-motion";

import {
  Lock,
  Mail,
} from "lucide-react";

import {
  getAuthenticationErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  type UserRole,
} from "../../../../lib/authService";

const ROLE_DASHBOARD: Record<
  UserRole,
  string
> = {
  patient:
    "/dashboard",

  caretaker:
    "/dashboard/caretaker",

  doctor:
    "/dashboard/doctor",

  admin:
    "/dashboard/admin",
};

export default function HeroRight() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const authenticationBusy =
    loading ||
    googleLoading;

  const redirectByRole = (
    role: UserRole
  ) => {
    const destination =
      ROLE_DASHBOARD[role];

    router.replace(
      destination
    );
  };

  const handleLogin = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    setLoading(true);

    try {
      const user =
        await loginWithEmail({
          email,
          password,
          remember: false,
        });

      redirectByRole(
        user.role
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        getAuthenticationErrorMessage(
          error
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin =
    async () => {
      setError("");

      setGoogleLoading(
        true
      );

      try {
        const user =
          await loginWithGoogle(
            false
          );

        redirectByRole(
          user.role
        );
      } catch (error) {
        console.error(
          "Google login error:",
          error
        );

        setError(
          getAuthenticationErrorMessage(
            error
          )
        );
      } finally {
        setGoogleLoading(
          false
        );
      }
    };

  return (
    <motion.div
      id="login"
      initial={{
        opacity: 0,
        x: 80,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
      className="flex items-center justify-center"
    >
      <div className="w-[380px] rounded-3xl border border-cyan-500/20 bg-white/5 p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Welcome Back
          </h2>

          <p className="mt-2 text-gray-400">
            Sign in to your AI
            Tinnitus account
          </p>
        </div>

        <form
          onSubmit={
            handleLogin
          }
        >
          <div className="relative mb-5">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              placeholder="Email Address"
              aria-label="Email address"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              disabled={
                authenticationBusy
              }
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-60"
            />
          </div>

          <div className="relative mb-3">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              maxLength={128}
              required
              disabled={
                authenticationBusy
              }
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-60"
            />
          </div>

          <div className="mb-6 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              authenticationBusy
            }
            className="flex w-full items-center justify-center rounded-xl bg-cyan-500 py-4 font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />

                Securing
                Account...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-white/10" />

          <span className="px-4 text-sm text-gray-400">
            OR
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={
            handleGoogleLogin
          }
          disabled={
            authenticationBusy
          }
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-4 text-white transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              Connecting to
              Google...
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-blue-400">
                G
              </span>

              Continue with
              Google
            </>
          )}
        </button>

        <p className="mt-8 text-center text-gray-400">
          Don&apos;t have an
          account?{" "}

          <Link
            href="/signup"
            className="font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}