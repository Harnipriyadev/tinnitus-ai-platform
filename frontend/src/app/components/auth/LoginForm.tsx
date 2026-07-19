"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";

type LoginResponse = {
  _id?: string;
  fullName?: string;
  email?: string;
  token?: string;
  message?: string;
};

type DashboardResponse = {
  success?: boolean;
  latestAssessment?: {
    _id: string;
  } | null;
};

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem("rememberEmail");

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const findLoginDestination = async (
    token: string
  ): Promise<"/dashboard" | "/assessment"> => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/assessment/dashboard",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

      if (!response.ok) {
        return "/assessment";
      }

      const dashboardData: DashboardResponse =
        await response.json();

      return dashboardData.latestAssessment
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

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(
          data.message || "Unable to log in"
        );
      }

      // Save authentication token
      localStorage.setItem("token", data.token);

      // Save basic user profile
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: data._id,
          fullName: data.fullName,
          email: data.email,
        })
      );

      // Remember email when selected
      if (rememberMe) {
        localStorage.setItem(
          "rememberEmail",
          email.trim().toLowerCase()
        );
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // Existing users go directly to their dashboard.
      // New users must complete their first assessment.
      const destination = await findLoginDestination(
        data.token
      );

      router.replace(destination);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server"
      );
    } finally {
      setLoading(false);
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
          Secure access to your AI hearing-care account
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={18}
            />

            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <div className="relative mb-5">
          <Mail
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Email Address"
            autoComplete="email"
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/70 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-60"
          />
        </div>

        {/* Password */}
        <div className="relative mb-5">
          <Lock
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
            autoComplete="current-password"
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/70 py-4 pl-12 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            disabled={loading}
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

        {/* Remember */}
        <div className="mb-8 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(event.target.checked)
              }
              disabled={loading}
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

        {/* Login */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 py-4 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle
                className="animate-spin"
                size={20}
              />

              Checking your account...
            </>
          ) : (
            <>
              Access AI System
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <div className="my-8 text-center text-gray-500">
          OR
        </div>

        {/* Google placeholder */}
        <button
          type="button"
          disabled
          title="Google authentication will be added later"
          className="w-full cursor-not-allowed rounded-xl border border-cyan-500/30 py-4 text-white opacity-50"
        >
          Continue with Google — Coming Soon
        </button>

        <p className="mt-8 text-center text-gray-400">
          Don&apos;t have an account?

          <Link
            href="/signup"
            className="ml-2 text-cyan-400"
          >
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
}