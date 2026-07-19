"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

type LoginResponse = {
  _id?: string;
  fullName?: string;
  email?: string;
  token?: string;
  message?: string;
};

export default function HeroRight() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        throw new Error(data.message || "Invalid email or password.");
      }

      if (!data.token) {
        throw new Error("Login token was not received.");
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: data._id,
          fullName: data.fullName,
          email: data.email,
        })
      );

      router.replace("/welcome");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      id="login"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex items-center justify-center"
    >
      <div className="w-[380px] rounded-3xl border border-cyan-500/20 bg-white/5 p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Welcome Back
          </h2>

          <p className="mt-2 text-gray-400">
            Sign in to your AI Tinnitus account
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="relative mb-5">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>

          {/* Password */}
          <div className="relative mb-3">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>

          {/* Forgot Password */}
          <div className="mb-6 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-cyan-500 py-4 font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Signing In...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-white/10" />

          <span className="px-4 text-sm text-gray-400">
            OR
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-white transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10"
        >
          Continue with Google
        </button>

        {/* Sign Up */}
        <p className="mt-8 text-center text-gray-400">
          Don&apos;t have an account?{" "}
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