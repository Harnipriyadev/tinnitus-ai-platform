"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  getAuthenticationErrorMessage,
  logoutUser,
  registerWithEmail,
  type PublicRegistrationRole,
} from "../../../lib/authService";

const ACCOUNT_TYPES: Array<{
  role: PublicRegistrationRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    role: "patient",
    title: "Patient",
    description:
      "Take assessments and manage your tinnitus care.",

    icon: (
      <UserRound
        size={25}
      />
    ),
  },

  {
    role: "caretaker",
    title: "Caretaker",
    description:
      "Support patients who invite and authorize you.",

    icon: (
      <HeartHandshake
        size={25}
      />
    ),
  },

  {
    role: "doctor",
    title: "Doctor",
    description:
      "Apply as a medical professional. Verification is required.",

    icon: (
      <Stethoscope
        size={25}
      />
    ),
  },
];

const ACCOUNT_LABELS: Record<
  PublicRegistrationRole,
  string
> = {
  patient:
    "Patient",

  caretaker:
    "Caretaker",

  doctor:
    "Doctor",
};

export default function SignupPage() {
  const [
    requestedRole,
    setRequestedRole,
  ] =
    useState<PublicRegistrationRole>(
      "patient"
    );

  const [
    registeredRole,
    setRegisteredRole,
  ] =
    useState<PublicRegistrationRole>(
      "patient"
    );

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  const validatePassword =
    () => {
      if (
        password.length <
        12
      ) {
        return "Password must contain at least 12 characters.";
      }

      if (
        !/[a-z]/.test(
          password
        )
      ) {
        return "Password must contain a lowercase letter.";
      }

      if (
        !/[A-Z]/.test(
          password
        )
      ) {
        return "Password must contain an uppercase letter.";
      }

      if (
        !/\d/.test(
          password
        )
      ) {
        return "Password must contain a number.";
      }

      if (
        !/[^A-Za-z0-9]/.test(
          password
        )
      ) {
        return "Password must contain a special character.";
      }

      if (
        password !==
        confirmPassword
      ) {
        return "Passwords do not match.";
      }

      return null;
    };

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");

      const passwordError =
        validatePassword();

      if (passwordError) {
        setError(
          passwordError
        );

        return;
      }

      setLoading(true);

      try {
        const selectedRole =
          requestedRole;

        await registerWithEmail({
          fullName,
          email,
          password,
          requestedRole:
            selectedRole,
        });

        /*
         * Require email verification before
         * the account can sign in.
         */
        await logoutUser();

        setRegisteredRole(
          selectedRole
        );

        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
      } catch (
        caughtError
      ) {
        console.error(
          "Registration error:",
          caughtError
        );

        setError(
          getAuthenticationErrorMessage(
            caughtError
          )
        );
      } finally {
        setLoading(false);
      }
    };

  if (success) {
    const isDoctor =
      registeredRole ===
      "doctor";

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#07121F] to-slate-900 px-6 py-10">
        <section className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          <CheckCircle2
            size={58}
            className="mx-auto text-emerald-400"
          />

          <h1 className="mt-5 text-3xl font-bold text-white">
            Verify Your Email
          </h1>

          <p className="mt-4 leading-7 text-gray-300">
            Your{" "}
            {ACCOUNT_LABELS[
              registeredRole
            ].toLowerCase()}{" "}
            account was created.
            We sent a verification
            link to your email
            address.
          </p>

          {isDoctor && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-left">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldCheck
                  size={19}
                />

                <p className="font-semibold">
                  Doctor verification
                  required
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-amber-100/80">
                After verifying your
                email, you must submit
                your Medical Council
                registration details.
                Consultation access will
                remain locked until an
                administrator approves
                your application.
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="mt-7 inline-flex w-full justify-center rounded-xl bg-cyan-400 py-3 font-semibold text-black transition hover:bg-cyan-300"
          >
            Continue to Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#07121F] to-slate-900 px-5 py-10 sm:px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/20 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <h1 className="text-center text-3xl font-bold text-white">
          Create Account
        </h1>

        <p className="mt-2 text-center text-gray-400">
          Choose how you want to
          use the AI Tinnitus
innitus
          platform
        </p>

        {/* Account type */}
        <fieldset
          disabled={loading}
          className="mt-7"
        >
          <legend className="mb-3 text-sm font-semibold text-gray-200">
            Select account type
          </legend>

          <div className="grid gap-3 sm:grid-cols-3">
            {ACCOUNT_TYPES.map(
              (account) => {
                const selected =
                  requestedRole ===
                  account.role;

                return (
                  <button
                    key={
                      account.role
                    }
                    type="button"
                    onClick={() =>
                      setRequestedRole(
                        account.role
                      )
                    }
                    aria-pressed={
                      selected
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-400/15 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-slate-900/40 hover:border-cyan-400/40"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-white/5 text-cyan-300"
                      }`}
                    >
                      {
                        account.icon
                      }
                    </div>

                    <p className="mt-3 font-semibold text-white">
                      {
                        account.title
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      {
                        account.description
                      }
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </fieldset>

        {requestedRole ===
          "caretaker" && (
          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
            A caretaker cannot view
            patient information until
            the patient sends and
            approves an invitation.
          </div>
        )}

        {requestedRole ===
          "doctor" && (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Doctor accounts require
            Medical Council registration
            and administrator verification
            before consultation features
            are enabled.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6 space-y-5"
        >
          <input
            type="text"
            placeholder="Full Name"
            aria-label="Full name"
            autoComplete="name"
            value={fullName}
            onChange={(
              event
            ) =>
              setFullName(
                event.target
                  .value
              )
            }
            minLength={2}
            maxLength={80}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <input
            type="email"
            placeholder="Email Address"
            aria-label="Email address"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(
              event
            ) =>
              setEmail(
                event.target
                  .value
              )
            }
            maxLength={254}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
            }
            minLength={12}
            maxLength={128}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            aria-label="Confirm password"
            autoComplete="new-password"
            value={
              confirmPassword
            }
            onChange={(
              event
            ) =>
              setConfirmPassword(
                event.target
                  .value
              )
            }
            minLength={12}
            maxLength={128}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-xs leading-6 text-gray-400">
            Password must contain
            at least 12 characters,
            uppercase and lowercase
            letters, a number and a
            special character.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />

                Creating secure
                account...
              </>
            ) : requestedRole ===
              "doctor" ? (
              "Create Doctor Application"
            ) : (
              `Create ${
                ACCOUNT_LABELS[
                  requestedRole
                ]
              } Account`
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Already have an
          account?{" "}

          <Link
            href="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}