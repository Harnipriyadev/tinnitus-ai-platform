"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Activity,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChatBot from "../components/chatbot/ChatBot";

type Assessment = {
  _id: string;
  age: number;
  gender: string;
  tinnitus_type: string;
  affected_ear: string;
  frequency_hz: number;
  loudness_db: number;
  hearing_loss: string;
  thi_score: number;
  tfi_score: number;
  hads_anxiety: number;
  hads_depression: number;
  sleep_score: number;
  treatment: string;
  outcome: string;
  createdAt: string;
};

type DashboardData = {
  success: boolean;

  user: {
    _id: string;
    fullName: string;
    email: string;
  };

  latestAssessment: Assessment | null;
  assessments: Assessment[];
};

type Prediction = {
  stage?: string;
  risk?: string;
  confidence?: string | number;
  mental_health?: string;
  sleep_status?: string;
  clinical_interpretation?: string;
  summary?: string;
  doctor?: string[];
  treatments?: string[];
  recovery_plan?: string[];
  tips?: string[];
};

const defaultCarePlan = [
  "Use a comfortable background sound for 15 minutes.",
  "Complete a five-minute guided breathing exercise.",
  "Follow a calm and consistent bedtime routine.",
];

function parsePrediction(outcome?: string): Prediction {
  if (!outcome) return {};

  try {
    const parsed = JSON.parse(outcome);

    return typeof parsed === "object" && parsed !== null
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function formatDate(date?: string, short = false) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
  });
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "User";
}

export default function DashboardPage() {
  const router = useRouter();

  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedTasks, setCompletedTasks] =
    useState<number[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
         `${process.env.NEXT_PUBLIC_API_URL}/api/assessment/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            router.replace("/login");
            return;
          }

          throw new Error(
            data.message || "Unable to load dashboard"
          );
        }

        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const assessments = useMemo(
    () => dashboardData?.assessments || [],
    [dashboardData]
  );

  const latestAssessment =
    dashboardData?.latestAssessment;

  const latestPrediction = useMemo(
    () =>
      parsePrediction(
        dashboardData?.latestAssessment?.outcome
      ),
    [dashboardData]
  );

  const chartData = useMemo(
    () =>
      [...assessments]
        .reverse()
        .map((assessment) => ({
          date: new Date(
            assessment.createdAt
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),

          THI: assessment.thi_score,
          TFI: assessment.tfi_score,
        })),
    [assessments]
  );

  const carePlan = useMemo(
    () =>
      latestPrediction.recovery_plan?.length
        ? latestPrediction.recovery_plan.slice(0, 3)
        : defaultCarePlan,
    [latestPrediction]
  );

  const userName =
    dashboardData?.user.fullName || "User";

  const firstName = getFirstName(userName);

  const severity =
    latestPrediction.stage || "Not available";

  const risk =
    latestPrediction.risk || "Not available";

  const latestScore =
    latestAssessment?.thi_score ?? 0;

  const previousScore =
    assessments[1]?.thi_score;

  const scoreDifference =
    previousScore === undefined
      ? null
      : previousScore - latestScore;

  const careProgress =
    carePlan.length > 0
      ? Math.round(
          (completedTasks.length / carePlan.length) * 100
        )
      : 0;

  const openReport = (assessment: Assessment) => {
    const prediction = parsePrediction(
      assessment.outcome
    );

    localStorage.setItem(
      "prediction",
      JSON.stringify({
        ...assessment,
        ...prediction,
        patient_name: dashboardData?.user.fullName,
        email: dashboardData?.user.email,
        assessmentId: assessment._id,
      })
    );

    router.push("/result");
  };

  const openAssistant = () => {
    window.dispatchEvent(
      new Event("open-ai-assistant")
    );
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("prediction");

    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <BrainCircuit
          size={48}
          className="animate-pulse text-cyan-600"
        />

        <p className="font-medium text-slate-600">
          Loading your health dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-lg font-semibold text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#07111f] px-5 py-6 text-white lg:flex">
          <Link
            href="/"
            className="flex items-center gap-3 px-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <BrainCircuit size={25} />
            </div>

            <div>
              <p className="font-bold">Tinnitus AI</p>

              <p className="text-xs text-slate-400">
                Smart Hearing Care
              </p>
            </div>
          </Link>

          <div className="mt-9">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Care workspace
            </p>

            <nav className="space-y-1.5">
              <SidebarItem
                href="/dashboard"
                icon={<LayoutDashboard size={19} />}
                label="Overview"
                active
              />

              <SidebarItem
                href="/assessment"
                icon={<ClipboardList size={19} />}
                label="New Assessment"
              />

              <SidebarItem
                href="/result"
                icon={<FileText size={19} />}
                label="Latest Report"
              />

              <SidebarItem
                href="/profile"
                icon={<UserRound size={19} />}
                label="My Profile"
              />
            </nav>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck size={19} />

              <p className="text-sm font-semibold">
                Protected health data
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your assessments are securely connected to
              your authenticated account.
            </p>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="w-full lg:ml-72">
          {/* Top navigation */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">
                  <BrainCircuit size={22} />
                </div>

                <p className="font-bold">Tinnitus AI</p>
              </div>

              <div className="hidden lg:block">
                <p className="text-sm font-medium text-slate-500">
                  Patient care dashboard
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                  aria-label="Notifications"
                >
                  <Bell size={19} />

                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-500" />
                </button>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-cyan-300"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                    <UserRound size={19} />
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold">
                      {userName}
                    </p>

                    <p className="max-w-40 truncate text-xs text-slate-500">
                      {dashboardData?.user.email}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* Greeting */}
            <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-cyan-700">
                  Health overview
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                  Good to see you, {firstName}
                </h1>

                <p className="mt-2 text-slate-500">
                  Review your latest assessment and continue
                  today&apos;s personalized care activities.
                </p>
              </div>

              <Link
                href="/assessment"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#07111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={18} />
                New Assessment
              </Link>
            </section>

            {!latestAssessment && (
              <section className="mb-7 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-center">
                <BrainCircuit
                  className="mx-auto text-cyan-700"
                  size={42}
                />

                <h2 className="mt-4 text-2xl font-bold">
                  Complete your first assessment
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-slate-600">
                  Your dashboard metrics and personalized
                  guidance will appear here.
                </p>

                <Link
                  href="/assessment"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white"
                >
                  Start Assessment
                  <ChevronRight size={18} />
                </Link>
              </section>
            )}

            {/* Metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Activity size={21} />}
                iconClass="bg-cyan-50 text-cyan-700"
                label="THI score"
                value={
                  latestAssessment
                    ? `${latestAssessment.thi_score}/100`
                    : "N/A"
                }
                footer={
                  scoreDifference === null
                    ? "Baseline assessment"
                    : scoreDifference > 0
                      ? `${scoreDifference} points improved`
                      : scoreDifference < 0
                        ? `${Math.abs(scoreDifference)} points increased`
                        : "No score change"
                }
              />

              <MetricCard
                icon={<HeartPulse size={21} />}
                iconClass="bg-amber-50 text-amber-700"
                label="Current severity"
                value={severity}
                footer={`Risk level: ${risk}`}
              />

              <MetricCard
                icon={<CalendarDays size={21} />}
                iconClass="bg-violet-50 text-violet-700"
                label="Last assessment"
                value={
                  latestAssessment
                    ? formatDate(
                        latestAssessment.createdAt,
                        true
                      )
                    : "N/A"
                }
                footer={`${assessments.length} total assessment${
                  assessments.length === 1 ? "" : "s"
                }`}
              />

              <MetricCard
                icon={<Stethoscope size={21} />}
                iconClass="bg-emerald-50 text-emerald-700"
                label="Care-plan progress"
                value={`${careProgress}%`}
                footer={`${completedTasks.length} of ${carePlan.length} tasks completed`}
              />
            </div>

            {/* Chart and AI */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
              {/* Progress chart */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-700">
                      Progress monitoring
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Assessment score trends
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      THI and TFI changes across your recent
                      assessments.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <ChartLegend
                      color="bg-cyan-500"
                      label="THI"
                    />

                    <ChartLegend
                      color="bg-violet-500"
                      label="TFI"
                    />
                  </div>
                </div>

                <div className="h-[310px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="thiGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#06b6d4"
                              stopOpacity={0.25}
                            />

                            <stop
                              offset="95%"
                              stopColor="#06b6d4"
                              stopOpacity={0}
                            />
                          </linearGradient>

                          <linearGradient
                            id="tfiGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8b5cf6"
                              stopOpacity={0.18}
                            />

                            <stop
                              offset="95%"
                              stopColor="#8b5cf6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="#e2e8f0"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "#64748b",
                            fontSize: 12,
                          }}
                        />

                        <YAxis
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "#64748b",
                            fontSize: 12,
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            boxShadow:
                              "0 12px 30px rgba(15,23,42,0.1)",
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="THI"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          fill="url(#thiGradient)"
                          dot={{
                            r: 4,
                            fill: "#06b6d4",
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="TFI"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          fill="url(#tfiGradient)"
                          dot={{
                            r: 4,
                            fill: "#8b5cf6",
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                      Complete an assessment to begin tracking
                      your progress.
                    </div>
                  )}
                </div>
              </section>

              {/* Assistant card */}
              <section className="relative overflow-hidden rounded-3xl bg-[#071827] p-6 text-white shadow-sm">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-cyan-400 p-3 text-slate-950">
                      <MessageCircle size={26} />
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Online
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <h2 className="text-xl font-bold">
                      Personal AI Assistant
                    </h2>

                    <Sparkles
                      size={17}
                      className="text-cyan-300"
                    />
                  </div>

                  <p className="mt-3 leading-7 text-slate-300">
                    Ask questions about your report, scores,
                    symptoms, or personalized care activities.
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Suggested prompt
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Explain my latest report and tell me which
                      care activity I should complete next.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!latestAssessment}
                    onClick={openAssistant}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Open AI Assistant
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </section>
            </div>

            {/* Care tasks and report */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* Daily care tasks */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-700">
                      Personalized routine
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Today&apos;s care activities
                    </h2>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {completedTasks.length}/{carePlan.length} done
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {carePlan.map((task, index) => {
                    const completed =
                      completedTasks.includes(index);

                    return (
                      <button
                        type="button"
                        key={`${task}-${index}`}
                        onClick={() => toggleTask(index)}
                        className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                          completed
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {completed && <Check size={15} />}
                        </span>

                        <span>
                          <span
                            className={`block font-semibold ${
                              completed
                                ? "text-emerald-800 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            Care activity {index + 1}
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-slate-500">
                            {task}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Latest report */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cyan-700">
                      Latest clinical overview
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Assessment report
                    </h2>
                  </div>

                  <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {severity}
                  </div>
                </div>

                {latestAssessment ? (
                  <>
                    <p className="mt-5 line-clamp-4 leading-7 text-slate-600">
                      {latestPrediction.summary ||
                        "Your latest assessment has been completed successfully."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <ClinicalMetric
                        label="THI score"
                        value={`${latestAssessment.thi_score}/100`}
                      />

                      <ClinicalMetric
                        label="TFI score"
                        value={`${latestAssessment.tfi_score}/100`}
                      />

                      <ClinicalMetric
                        label="Sleep"
                        value={
                          latestPrediction.sleep_status ||
                          `${latestAssessment.sleep_score}`
                        }
                      />

                      <ClinicalMetric
                        label="Hearing loss"
                        value={latestAssessment.hearing_loss}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openReport(latestAssessment)
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
                    >
                      View full report
                      <ChevronRight size={17} />
                    </button>
                  </>
                ) : (
                  <div className="flex min-h-64 items-center justify-center text-center text-slate-500">
                    No report is available.
                  </div>
                )}
              </section>
            </div>

            {/* Assessment history */}
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-700">
                    Health record
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Recent assessments
                  </h2>
                </div>

                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
                >
                  <Plus size={17} />
                  Add Assessment
                </Link>
              </div>

              {assessments.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-4 font-semibold">
                          Date
                        </th>

                        <th className="px-4 py-4 font-semibold">
                          THI
                        </th>

                        <th className="px-4 py-4 font-semibold">
                          TFI
                        </th>

                        <th className="px-4 py-4 font-semibold">
                          Severity
                        </th>

                        <th className="px-4 py-4 font-semibold">
                          Status
                        </th>

                        <th className="px-4 py-4 font-semibold">
                          Report
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {assessments.map((assessment) => {
                        const prediction = parsePrediction(
                          assessment.outcome
                        );

                        return (
                          <tr
                            key={assessment._id}
                            className="border-b border-slate-100 text-sm last:border-0"
                          >
                            <td className="px-4 py-4 font-medium text-slate-700">
                              {formatDate(
                                assessment.createdAt
                              )}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {assessment.thi_score}/100
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {assessment.tfi_score}/100
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {prediction.stage || "N/A"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                <Check size={15} />
                                Completed
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openReport(assessment)
                                }
                                className="font-semibold text-cyan-700 hover:text-cyan-800"
                              >
                                View report
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No assessment history is available.
                </div>
              )}
            </section>

            <footer className="mt-8 border-t border-slate-200 pt-6 text-center text-xs leading-5 text-slate-500">
              AI-generated guidance supports your care journey
              but does not replace professional medical diagnosis
              or treatment.
            </footer>
          </div>
        </section>
      </div>

      <ChatBot />
    </main>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-cyan-400 font-semibold text-slate-950"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  footer,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: string;
  footer: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {footer}
      </p>
    </article>
  );
}

function ChartLegend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2 text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ClinicalMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}