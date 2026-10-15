"use client";

import {
  type FormEvent,
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
import {
  signupTranslations,
} from "../../../lib/signupTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

const ACCOUNT_ROLES:
  PublicRegistrationRole[] = [
    "patient",
    "caretaker",
    "doctor",
  ];

const getRoleIcon = (
  role: PublicRegistrationRole
) => {
  if (role === "caretaker") {
    return (
      <HeartHandshake
        size={25}
      />
    );
  }

  if (role === "doctor") {
    return (
      <Stethoscope size={25} />
    );
  }

  return <UserRound size={25} />;
};

export default function SignupPage() {
  const { language } =
    useLanguage();

  const text =
    signupTranslations[language];

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

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const validatePassword = () => {
    if (password.length < 12) {
      return text.passwordErrors
        .length;
    }

    if (!/[a-z]/.test(password)) {
      return text.passwordErrors
        .lowercase;
    }

    if (!/[A-Z]/.test(password)) {
      return text.passwordErrors
        .uppercase;
    }

    if (!/\d/.test(password)) {
      return text.passwordErrors
        .number;
    }

    if (
      !/[^A-Za-z0-9]/.test(
        password
      )
    ) {
      return text.passwordErrors
        .special;
    }

    if (
      password !==
      confirmPassword
    ) {
      return text.passwordErrors
        .mismatch;
    }

    return null;
  };

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    const passwordError =
      validatePassword();

    if (passwordError) {
      setError(passwordError);
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
    } catch (caughtError) {
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
            {text.verifyEmail}
          </h1>

          <p className="mt-4 leading-7 text-gray-300">
            {
              text.accountCreatedPrefix
            }{" "}
            {
              text.accountTypes[
                registeredRole
              ].title
            }{" "}
            {
              text.accountCreatedSuffix
            }
          </p>

          {isDoctor && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-left">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldCheck
                  size={19}
                />

                <p className="font-semibold">
                  {
                    text.doctorVerificationRequired
                  }
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-amber-100/80">
                {
                  text.doctorVerificationDescription
                }
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="mt-7 inline-flex w-full justify-center rounded-xl bg-cyan-400 py-3 font-semibold text-black transition hover:bg-cyan-300"
          >
            {text.continueToLogin}
          </Link>
        </section>
      </main>
    );
  }

  const submitLabel =
    requestedRole === "doctor"
      ? text.createDoctor
      : requestedRole ===
          "caretaker"
        ? text.createCaretaker
        : text.createPatient;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#07121F] to-slate-900 px-5 py-10 sm:px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/20 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <h1 className="text-center text-3xl font-bold text-white">
          {text.title}
        </h1>

        <p className="mt-2 text-center text-gray-400">
          {text.description}
        </p>

        <fieldset
          disabled={loading}
          className="mt-7"
        >
          <legend className="mb-3 text-sm font-semibold text-gray-200">
            {text.selectAccountType}
          </legend>

          <div className="grid gap-3 sm:grid-cols-3">
            {ACCOUNT_ROLES.map(
              (role) => {
                const selected =
                  requestedRole ===
                  role;

                const account =
                  text.accountTypes[
                    role
                  ];

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() =>
                      setRequestedRole(
                        role
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
                      {getRoleIcon(
                        role
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-white">
                      {account.title}
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
            {text.caretakerNotice}
          </div>
        )}

        {requestedRole ===
          "doctor" && (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            {text.doctorNotice}
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

            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <input
            type="text"
            placeholder={text.fullName}
            aria-label={text.fullName}
            autoComplete="name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
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
            placeholder={
              text.emailAddress
            }
            aria-label={
              text.emailAddress
            }
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            maxLength={254}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <input
            type="password"
            placeholder={text.password}
            aria-label={text.password}
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
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
            placeholder={
              text.confirmPassword
            }
            aria-label={
              text.confirmPassword
            }
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            minLength={12}
            maxLength={128}
            disabled={loading}
            required
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
          />

          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-xs leading-6 text-gray-400">
            {text.passwordRule}
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
                {
                  text.creatingAccount
                }
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          {text.alreadyHaveAccount}{" "}

          <Link
            href="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            {text.login}
          </Link>
        </p>
      </div>
    </main>
  );
}
