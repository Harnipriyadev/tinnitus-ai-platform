"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  RotateCw,
} from "lucide-react";

import {
  getAuthenticationErrorMessage,
  getFirebaseIdToken,
  loginWithEmail,
  loginWithGoogle,
  resendVerificationEmail,
  type UserRole,
} from "../../../../lib/authService";

type DashboardResponse = {
  success?: boolean;

  latestAssessment?: {
    _id: string;
  } | null;
};

type AuthenticationError = {
  code?: string;
  message?: string;
};

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    resendLoading,
    setResendLoading,
  ] = useState(false);

  const [
    verificationRequired,
    setVerificationRequired,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const authenticationBusy =
    loading ||
    googleLoading ||
    resendLoading;

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem(
        "rememberEmail"
      );

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const findLoginDestination = async (
    idToken: string
  ): Promise<
    "/dashboard" | "/assessment"
  > => {
    try {
      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "Backend API URL is not configured"
        );
      }

      const response = await fetch(
        `${apiUrl.replace(
          /\/+$/,
          ""
        )}/api/assessment/dashboard`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },

          cache: "no-store",
        }
      );

      if (!response.ok) {
        return "/assessment";
      }

      const dashboardData: DashboardResponse =
        await response.json();

      return dashboardData
        .latestAssessment
        ? "/dashboard"
        : "/assessment";
    } catch (error) {
      console.error(
        "Unable to check assessment status:",
        error
      );

      return "/assessment";
    }
  };

  const completeLogin = async (
    role: UserRole
  ) => {
    if (role === "caretaker") {
      router.replace(
        "/dashboard/caretaker"
      );

      return;
    }

    if (role === "doctor") {
      router.replace(
        "/dashboard/doctor"
      );

      return;
    }

    if (role === "admin") {
      router.replace(
        "/dashboard/admin"
      );

      return;
    }

    const idToken =
      await getFirebaseIdToken(
        true
      );

    const destination =
      await findLoginDestination(
        idToken
      );

    router.replace(destination);
  };

  const handleLogin = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setVerificationRequired(false);

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Email and password are required."
      );

      return;
    }

    setLoading(true);

    try {
      const user = await loginWithEmail({
        email,
        password,
        remember: rememberMe,
      });

      if (rememberMe) {
        localStorage.setItem(
          "rememberEmail",
          email
            .trim()
            .toLowerCase()
        );
      } else {
        localStorage.removeItem(
          "rememberEmail"
        );
      }

      await completeLogin(
        user.role
      );
    } catch (caughtError) {
      console.error(
        "Login error:",
        caughtError
      );

      const authenticationError =
        caughtError as AuthenticationError;

      if (
        authenticationError.code ===
        "auth/email-not-verified"
      ) {
        setVerificationRequired(true);
      }

      setError(
        getAuthenticationErrorMessage(
          caughtError
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification =
    async () => {
      setError("");
      setSuccess("");

      if (
        !email.trim() ||
        !password
      ) {
        setError(
          "Enter your email and password to resend the verification email."
        );

        return;
      }

      setResendLoading(true);

      try {
        const result =
          await resendVerificationEmail({
            email,
            password,
          });

        setSuccess(
          result.message
        );

        setVerificationRequired(
          false
        );
      } catch (caughtError) {
        console.error(
          "Resend verification error:",
          caughtError
        );

        const authenticationError =
          caughtError as AuthenticationError;

        if (
          authenticationError.code ===
          "auth/email-already-verified"
        ) {
          setVerificationRequired(
            false
          );

          setSuccess(
            authenticationError.message ||
              "Your email is already verified. You can log in now."
          );

          return;
        }

        setError(
          getAuthenticationErrorMessage(
            caughtError
          )
        );
      } finally {
        setResendLoading(false);
      }
    };

  const handleGoogleLogin =
    async () => {
      setError("");
      setSuccess("");
      setVerificationRequired(false);
      setGoogleLoading(true);

      try {
        const user = await loginWithGoogle(
          rememberMe
        );

        await completeLogin(
          user.role
        );
      } catch (caughtError) {
        console.error(
          "Google login error:",
          caughtError
        );

        setError(
          getAuthenticationErrorMessage(
            caughtError
          )
        );
      } finally {
        setGoogleLoading(false);
      }
    };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleLogin}
        className="rounded-3xl border border-cyan-500/20 bg-white/10 p-10 shadow-[0_0_60px_rgba(0,255,255,0.08)] backdrop-blur-2xl"
      >
        <h1 className="text-4xl font-bold text-white">
          Welcome Back
        </h1>

        <p className="mb-8 mt-3 text-gray-400">
          Secure access to your AI
          hearing-care account
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={18}
            />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300"
          >
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={18}
            />

            <span>{success}</span>
          </div>
        )}

        <div className="relative mb-5">
          <Mail
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(
                event.target.value
              );

              setVerificationRequired(
                false
              );

              setSuccess("");
            }}
            placeholder="Email Address"
            aria-label="Email address"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            disabled={
              authenticationBusy
            }
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/70 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-60"
          />
        </div>

        <div className="relative mb-5">
          <Lock
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(event) => {
              setPassword(
                event.target.value
              );

              setSuccess("");
            }}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            maxLength={128}
            disabled={
              authenticationBusy
            }
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/70 py-4 pl-12 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current
              )
            }
            disabled={
              authenticationBusy
            }
            className="absolute right-4 top-4 text-slate-400 transition hover:text-cyan-300 disabled:opacity-50"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {verificationRequired && (
          <button
            type="button"
            onClick={
              handleResendVerification
            }
            disabled={
              authenticationBusy
            }
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendLoading ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  size={18}
                />

                Sending verification email...
              </>
            ) : (
              <>
                <RotateCw size={18} />
                Resend verification email
              </>
            )}
          </button>
        )}

        <div className="mb-8 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(
                  event.target.checked
                )
              }
              disabled={
                authenticationBusy
              }
              className="accent-cyan-400"
            />

            Remember me
          </label>

          <Link
            href="/forgot-password"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={
            authenticationBusy
          }
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 py-4 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle
                className="animate-spin"
                size={20}
              />

              Signing in...
            </>
          ) : (
            <>
              Access AI System
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-sm text-gray-500">
            OR
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={
            authenticationBusy
          }
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/30 py-4 font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <>
              <LoaderCircle
                className="animate-spin"
                size={20}
              />

              Connecting to Google...
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-blue-400">
                G
              </span>

              Continue with Google
            </>
          )}
        </button>

        <p className="mt-8 text-center text-gray-400">
          Don&apos;t have an account?

          <Link
            href="/signup"
            className="ml-2 text-cyan-400 hover:text-cyan-300"
          >
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
}
