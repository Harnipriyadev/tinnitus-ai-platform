"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ArrowRight,
  Brain,
  LoaderCircle,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";

type DashboardResponse = {
  success?: boolean;
  message?: string;

  user?: {
    fullName?: string;
  };

  latestAssessment?: {
    _id: string;
  } | null;
};

export default function WelcomePage() {
  const router = useRouter();

  const [
    userName,
    setUserName,
  ] = useState("User");

  const [
    checkingAccount,
    setCheckingAccount,
  ] = useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    const checkUser =
      async () => {
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
              "Backend API URL is not configured"
            );
          }

          const response =
            await authenticatedFetch(
              `${apiUrl}/api/assessment/dashboard`,
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          const data: DashboardResponse =
            await response.json();

          if (
            response.status === 401 ||
            response.status === 403
          ) {
            await logoutUser();

            router.replace(
              "/login"
            );

            return;
          }

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to check your account"
            );
          }

          if (
            data.user?.fullName
          ) {
            setUserName(
              data.user.fullName
            );
          }

          if (
            data.latestAssessment
          ) {
            router.replace(
              "/dashboard"
            );

            return;
          }
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          if (
            error instanceof Error &&
            error.message ===
              "You are not authenticated"
          ) {
            router.replace(
              "/login"
            );

            return;
          }

          console.error(
            "Unable to check assessment status:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Unable to check your account"
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setCheckingAccount(
              false
            );
          }
        }
      };

    checkUser();

    return () => {
      controller.abort();
    };
  }, [router]);

  if (checkingAccount) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07121F] text-white">
        <LoaderCircle
          className="animate-spin text-cyan-400"
          size={42}
        />

        <p className="text-cyan-300">
          Checking your
          account...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#07121F] px-6 text-center text-white">
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
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07121F] px-6 py-10">
      <div className="absolute h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[150px]" />

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-[450px] w-[450px] rounded-full border border-cyan-500/10"
      />

      <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-cyan-500/20 bg-white/5 p-8 text-center backdrop-blur-2xl sm:p-12">
        <motion.div
          animate={{
            scale: [
              1,
              1.08,
              1,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
          className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10"
        >
          <Brain
            size={55}
            className="text-cyan-400"
          />
        </motion.div>

        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Welcome,{" "}

          <span className="text-cyan-400">
            {userName}
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-gray-300">
          Complete your first
          tinnitus assessment to
          receive an AI-generated
          report, personalized
          wellness guidance, and
          access to your
          hearing-care dashboard.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <WelcomeCard
            title="Assessment"
            description="Record your tinnitus symptoms and hearing information."
          />

          <WelcomeCard
            title="AI Report"
            description="Receive a personalized analysis based on your answers."
          />

          <WelcomeCard
            title="AI Assistant"
            description="Get report explanations and supportive care guidance."
          />
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/assessment"
            )
          }
          className="mx-auto mt-12 flex items-center gap-3 rounded-xl bg-cyan-500 px-10 py-4 font-semibold text-black transition hover:scale-105 hover:bg-cyan-400"
        >
          Start First Assessment

          <ArrowRight
            size={22}
          />
        </button>

        <p className="mx-auto mt-7 max-w-2xl text-xs leading-5 text-slate-500">
          This platform provides
          AI-generated support and
          does not replace
          professional medical
          diagnosis or treatment.
        </p>
      </div>
    </main>
  );
}

function WelcomeCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-xl font-semibold text-cyan-400">
        {title}
      </h3>

      <p className="mt-3 leading-6 text-gray-400">
        {description}
      </p>
    </article>
  );
}