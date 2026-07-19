"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

type LoginResponse = {
  _id?: string;
  fullName?: string;
  email?: string;
  token?: string;
  message?: string;
};

const particles = Array.from({ length: 35 }, (_, index) => ({
  left: `${(index * 29) % 100}%`,
  top: `${(index * 17) % 100}%`,
  delay: (index % 10) * 0.25,
  duration: 3 + (index % 5),
}));

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://tinnitus-ai-platform.onrender.com/api/auth/login",
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

      if (!response.ok) {
        throw new Error(data.message || "Unable to login.");
      }

      if (!data.token) {
        throw new Error("Authentication token was not received.");
      }

      // Store authentication consistently for the dashboard
localStorage.setItem("token", data.token);

localStorage.setItem(
  "user",
  JSON.stringify({
    _id: data._id,
    fullName: data.fullName,
    email: data.email,
  })
);

// Remember only the email address when selected
if (rememberMe) {
  localStorage.setItem(
    "rememberEmail",
    email.trim().toLowerCase()
  );
} else {
  localStorage.removeItem("rememberEmail");
}

// Check whether this user already completed an assessment
try {
  const dashboardResponse = await fetch(
    "https://tinnitus-ai-platform.onrender.com/api/assessment/dashboard",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${data.token}`,
      },

      cache: "no-store",
    }
  );

  if (dashboardResponse.ok) {
    const dashboardData = await dashboardResponse.json();

    if (dashboardData.latestAssessment) {
      router.replace("/dashboard");
    } else {
      router.replace("/welcome");
    }

    return;
  }

  // New users continue through onboarding
  router.replace("/welcome");
} catch (dashboardError) {
  console.error(
    "Unable to check assessment status:",
    dashboardError
  );

  router.replace("/welcome");
}
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030b18] px-6 py-10 text-white">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.14),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(135deg,#020617,#061526,#020617)]" />

      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Floating Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [-12, 14, -12],
              opacity: [0.15, 0.8, 0.15],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Moving Glow */}
      <motion.div
        animate={{
          x: [-80, 80, -80],
          y: [-30, 30, -30],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-[35%] top-[30%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[130px]"
      />

      {/* Back to Home */}
      <Link
        href="/"
        className="relative z-20 inline-flex items-center gap-3 text-lg font-semibold text-white transition hover:text-cyan-300"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.45)]">
          <BrainCircuit size={25} />
        </span>

        <span>
          AI Tinnitus
          <span className="block text-xs font-normal text-cyan-400">
            Smart Hearing Care
          </span>
        </span>
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side */}
        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden items-center justify-center lg:flex"
        >
          <div className="relative flex h-[520px] w-[520px] items-center justify-center">
            {/* Glow */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.7, 0.35],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-80 w-80 rounded-full bg-cyan-500/20 blur-[110px]"
            />

            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[360px] w-[360px] rounded-full border border-cyan-400/20"
            >
              <span className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee]" />
            </motion.div>

            {/* Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[280px] w-[280px] rounded-full border border-dashed border-cyan-400/30"
            />

            {/* Inner Ring */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-[200px] w-[200px] rounded-full border border-cyan-300/40"
            />

            {/* Center Brain */}
            <motion.div
              animate={{
                y: [-10, 10, -10],
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex h-36 w-36 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 shadow-[0_0_80px_rgba(34,211,238,0.55)] backdrop-blur-xl"
            >
              <BrainCircuit
                size={78}
                className="text-cyan-300 drop-shadow-[0_0_18px_#22d3ee]"
              />

              <motion.div
                animate={{
                  scale: [1, 1.7, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full border border-cyan-300/40"
              />
            </motion.div>

            {/* Scanner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[330px] w-[330px]"
            >
              <div className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-cyan-400/50 to-transparent" />
            </motion.div>

            {/* Text */}
            <div className="absolute bottom-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                AI Neural Access
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">
                Intelligent tinnitus analysis with secure personalized
                healthcare access.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Login Card */}
        <motion.section
          initial={{ opacity: 0, x: 50, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-cyan-500/25 bg-[#111c2e]/80 p-8 shadow-[0_0_70px_rgba(6,182,212,0.12)] backdrop-blur-2xl sm:p-10">
            {/* Scanner Line */}
            <motion.div
              animate={{
                top: ["0%", "100%", "0%"],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="pointer-events-none absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            />

            {/* Top Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[80px]" />

            <div className="relative">
              {/* Status */}
              <div className="mb-7 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  AI System Online
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white">
                  Welcome <span className="text-cyan-400">Back</span>
                </h1>

                <p className="mt-3 text-sm text-gray-400">
                  Secure access to your AI hearing diagnosis platform.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-cyan-500/20 bg-[#071425]/80 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-cyan-500/20 bg-[#071425]/80 py-4 pl-12 pr-12 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-cyan-300"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-4 w-4 accent-cyan-500"
                    />

                    Remember me
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-4 font-semibold text-black shadow-[0_0_30px_rgba(6,182,212,0.22)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.38)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Access AI System
                      <ArrowRight
                        size={20}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-xs uppercase tracking-widest text-gray-500">
                  Or continue with
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/20 bg-white/[0.03] py-4 text-sm font-medium text-white transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                  G
                </span>

                Continue with Google
              </button>

              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={15} className="text-cyan-400" />
                Protected with secure encrypted access
              </div>

              <p className="mt-6 text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}