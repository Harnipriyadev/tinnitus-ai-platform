"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  ArrowLeft,
  Mail,
} from "lucide-react";

import {
  auth,
} from "../../../lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * Firebase sends and securely validates
       * the password-reset link.
       */
      await sendPasswordResetEmail(
        auth,
        normalizedEmail
      );

      /*
       * Use a generic response so the page
       * does not reveal registered accounts.
       */
      setMessage(
        "If an account exists with this email, Firebase password-reset instructions have been sent. Check your inbox and spam folder."
      );

      setEmail("");
    } catch (error) {
      console.error(
        "Firebase password reset error:",
        error
      );

      const firebaseError =
        error as {
          code?: string;
        };

      switch (
        firebaseError.code
      ) {
        case "auth/invalid-email":
          setError(
            "Enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many reset requests. Wait a few minutes before trying again."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Unable to connect. Check your internet connection."
          );
          break;

        case "auth/unauthorized-domain":
          setError(
            "This website is not authorized in Firebase."
          );
          break;

        case "auth/user-not-found":
          /*
           * Keep the response generic to prevent
           * email-account enumeration.
           */
          setMessage(
            "If an account exists with this email, Firebase password-reset instructions have been sent. Check your inbox and spam folder."
          );
          setEmail("");
          break;

        default:
          setError(
            "Unable to send the reset email. Please try again."
          );
      }
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
            <Mail
              className="text-cyan-400"
              size={30}
            />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Forgot Password
          </h1>

          <p className="mt-3 text-gray-400">
            Enter your registered
            email address and Firebase
            will send a secure
            password-reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="relative mb-5">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Email Address"
              aria-label="Email address"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#0E1C2F] py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-60"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-300"
            >
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
          <ArrowLeft
            size={18}
          />

          Back to Login
        </Link>
      </div>
    </main>
  );
}