"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Check,
  Circle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  authenticatedFetch,
} from "../../../lib/authService";

type Automation = {
  severity: string;
  status: "queued" | "running" | "completed" | "failed";
  recommendedAction?: string;
  followUpDays?: number | null;
  errorMessage?: string;
  steps: Array<{
    key: string;
    label: string;
    status: string;
    message?: string;
  }>;
};

function LiveAutomation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId =
    searchParams.get("workflowId");

  const [run, setRun] =
    useState<Automation | null>(null);
  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;
    let timer:
      | ReturnType<typeof setTimeout>
      | undefined;

    const refresh = async () => {
      try {
        if (!workflowId) {
          throw new Error(
            "Workflow ID is missing"
          );
        }

        const apiUrl =
          process.env
            .NEXT_PUBLIC_API_URL
            ?.replace(/\/+$/, "");

        if (!apiUrl) {
          throw new Error(
            "Backend API is not configured"
          );
        }

        const response =
          await authenticatedFetch(
            `${apiUrl}/api/automation/${workflowId}`
          );
        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load automation"
          );
        }

        if (cancelled) return;
        setRun(data.automation);

        if (
          ["queued", "running"].includes(
            data.automation.status
          )
        ) {
          timer = setTimeout(
            refresh,
            900
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load automation"
          );
        }
      }
    };

    void refresh();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [workflowId]);

  const completed =
    run?.steps.filter(
      (step) =>
        step.status === "completed"
    ).length || 0;
  const progress = run
    ? Math.round(
        (completed / run.steps.length) *
          100
      )
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <ShieldCheck className="mx-auto text-cyan-300" size={52} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Aurisense Live Care Engine
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            Live automation flow
          </h1>
          <p className="mt-2 text-slate-300">
            Secured backend + n8n workflow
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex justify-between">
            <div>
              <p className="text-sm text-slate-400">Severity</p>
              <p className="text-xl font-bold text-cyan-200">
                {run?.severity || "Processing"}
              </p>
            </div>
            <p className="text-2xl font-bold">{progress}%</p>
          </div>

          <div className="mb-7 h-2 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-400/10 p-4 text-red-200">
              {error}
            </p>
          )}

          <div className="space-y-3">
            {run?.steps.map((step) => {
              const done =
                step.status === "completed";

              return (
                <div
                  key={step.key}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                >
                  {done ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                      <Check size={18} />
                    </span>
                  ) : run?.status === "running" ? (
                    <LoaderCircle className="animate-spin text-cyan-300" size={28} />
                  ) : (
                    <Circle className="text-slate-600" size={28} />
                  )}
                  <div>
                    <h2 className="font-semibold">{step.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {step.message || "Waiting"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {run?.recommendedAction && (
            <div className="mt-6 rounded-2xl bg-cyan-300/10 p-5 text-cyan-50">
              <strong>Automated action:</strong>{" "}
              {run.recommendedAction}
              {run.followUpDays != null && (
                <p className="mt-2 text-sm">
                  Follow-up: {run.followUpDays} day(s)
                </p>
              )}
            </div>
          )}

          {run && ["completed", "failed"].includes(run.status) && (
            <button
              onClick={() => router.push("/result")}
              className="mt-7 w-full rounded-2xl bg-cyan-400 px-6 py-4 font-bold text-slate-950"
            >
              View complete result
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default function AutomationPage() {
  return (
    <Suspense fallback={null}>
      <LiveAutomation />
    </Suspense>
  );
}
