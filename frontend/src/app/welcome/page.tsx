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
import {
  welcomeTranslations,
} from "../../../lib/welcomeTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

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
  const { language } =
    useLanguage();

  const text =
    welcomeTranslations[language];

  const [
  userName,
  setUserName,
] = useState<string>(
  text.defaultUser
);

  const [
    checkingAccount,
    setCheckingAccount,
  ] = useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    const checkUser = async () => {
      setCheckingAccount(true);
      setError("");

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
            text.apiNotConfigured
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

        const data:
          DashboardResponse =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          await logoutUser();
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              text.unableToCheck
          );
        }

        setUserName(
          data.user?.fullName ||
            text.defaultUser
        );

        if (data.latestAssessment) {
          router.replace(
            "/dashboard"
          );
          return;
        }
      } catch (caughtError) {
        if (
          caughtError instanceof
            DOMException &&
          caughtError.name ===
            "AbortError"
        ) {
          return;
        }

        if (
          caughtError instanceof Error &&
          (caughtError.message ===
            "You are not authenticated" ||
            caughtError.message.includes(
              "session has ended"
            ))
        ) {
          await logoutUser();
          router.replace("/login");
          return;
        }

        console.error(
          "Unable to check assessment status:",
          caughtError
        );

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : text.unableToCheck
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setCheckingAccount(false);
        }
      }
    };

    void checkUser();

    return () => {
      controller.abort();
    };
  }, [router, text]);

  if (checkingAccount) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07121F] text-white">
        <LoaderCircle
          className="animate-spin text-cyan-400"
          size={42}
        />

        <p className="text-cyan-300">
          {text.checkingAccount}
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
          {text.tryAgain}
        </button>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07121F] px-6 py-10">
      <div className="absolute h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[150px]" />

      <motion.div
        animate={{ rotate: 360 }}
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
            scale: [1, 1.08, 1],
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
          {text.welcome},{" "}
          <span className="text-cyan-400">
            {userName}
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-gray-300">
          {text.description}
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <WelcomeCard
            title={
              text.cards.assessment
                .title
            }
            description={
              text.cards.assessment
                .description
            }
          />

          <WelcomeCard
            title={
              text.cards.report.title
            }
            description={
              text.cards.report
                .description
            }
          />

          <WelcomeCard
            title={
              text.cards.assistant
                .title
            }
            description={
              text.cards.assistant
                .description
            }
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
          {text.startAssessment}
          <ArrowRight size={22} />
        </button>

        <p className="mx-auto mt-7 max-w-2xl text-xs leading-5 text-slate-500">
          {text.disclaimer}
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
