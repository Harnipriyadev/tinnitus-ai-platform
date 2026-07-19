"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

type ForgotPasswordResponse = {
  message?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://tinnitus-ai-platform.onrender.com/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data: ForgotPasswordResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send reset email."
        );
      }

      setMessage(
        data.message ||
          "Password reset link has been sent."
      );

      setEmail("");
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07121F] px-6">
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-500/20 bg-white/5 p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <Mail className="text-cyan-400" size={30} />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Forgot Password
          </h1>

          <p className="mt-3 text-gray-400">
            Enter your registered email address and we will
            send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Email Address"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-cyan-500 py-4 font-semibold text-black transition hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>
      </div>
    </main>
  );
}