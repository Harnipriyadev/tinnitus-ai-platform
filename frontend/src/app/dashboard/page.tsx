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

  LayoutDashboard,

  LogOut,

  MessageCircle,

  Plus,

  ShieldCheck,

  Sparkles,

  Stethoscope,

  UserRound,

  UsersRound,

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



import { useLanguage } from "../context/LanguageContext";

import { dashboardTranslations } from "../../../lib/dashboardTranslations";

import {

  authenticatedFetch,

  logoutUser,

} from "../../../lib/authService";

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

type UserRole =

  | "patient"

  | "caretaker"

  | "doctor"

  | "admin";

type DashboardData = {

  success: boolean;

  user: {

    _id: string;

    fullName: string;

    email: string;

    role: UserRole;

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

function formatDate(

  date: string | undefined,

  locale: string,

  unavailable: string,

  short = false

) {

  if (!date) return unavailable;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {

    return unavailable;

  }

  return parsed.toLocaleDateString(locale, {

    day: "numeric",

    month: short ? "short" : "long",

    year: short ? undefined : "numeric",

  });

}

function getFirstName(fullName: string, fallback: string) {

  return fullName.trim().split(/\s+/)[0] || fallback;

}

export default function DashboardPage() {

  const router = useRouter();

  const { language } = useLanguage();

  const text = dashboardTranslations[language];



  const locale =

    language === "kn"

      ? "kn-IN"

      : language === "hi"

        ? "hi-IN"

        : "en-IN";

  const [dashboardData, setDashboardData] =

    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [completedTasks, setCompletedTasks] =

    useState<number[]>([]);

  useEffect(() => {

    const controller = new AbortController();

    const loadDashboard = async () => {

      try {

        const apiUrl =

          process.env.NEXT_PUBLIC_API_URL?.replace(

            /\/+$/,

            ""

          );

        if (!apiUrl) {

          throw new Error(

            text.apiNotConfigured

          );

        }

        const response = await authenticatedFetch(

          `${apiUrl}/api/assessment/dashboard`,

          {

            method: "GET",

            cache: "no-store",

            signal: controller.signal,

          }

        );

        const data = await response.json();

        if (!response.ok) {

          if (

            response.status === 401 ||

            response.status === 403

          ) {

            await logoutUser();

            router.replace("/login");

            return;

          }

          throw new Error(

            data.message || text.unableToLoad

          );

        }

        setDashboardData(data);

      } catch (error) {

        if (

          error instanceof DOMException &&

          error.name === "AbortError"

        ) {

          return;

        }

        if (

          error instanceof Error &&

          error.message === "You are not authenticated"

        ) {

          router.replace("/login");

          return;

        }

        console.error("Dashboard error:", error);

        setError(

          error instanceof Error

            ? error.message

            : text.unableToLoad

        );

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    };

    loadDashboard();

    return () => {

      controller.abort();

    };

  }, [router, text.apiNotConfigured, text.unableToLoad]);

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

          ).toLocaleDateString(locale, {

            day: "numeric",

            month: "short",

          }),

          THI: assessment.thi_score,

          TFI: assessment.tfi_score,

        })),

    [assessments, locale]

  );

  const carePlan = useMemo(

    () =>

      latestPrediction.recovery_plan?.length

        ? latestPrediction.recovery_plan.slice(0, 3)

        : [...text.defaultCarePlan],

    [latestPrediction, text.defaultCarePlan]

  );

  const userName =

    dashboardData?.user.fullName || text.user;

  const firstName = getFirstName(userName, text.user);

  const severity =

    latestPrediction.stage || text.notAvailable;

  const risk =

    latestPrediction.risk || text.notAvailable;

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

  const handleLogout = async () => {

    try {

      await logoutUser();

    } finally {

      localStorage.removeItem("prediction");

      router.replace("/login");

    }

  };

  if (loading) {

    return (

      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">

        <BrainCircuit

          size={48}

          className="animate-pulse text-cyan-600"

        />

        <p className="font-medium text-slate-600">

          {text.loading}

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

          {text.tryAgain}

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

                {text.brandSubtitle}

              </p>

            </div>

          </Link>

          <div className="mt-9">

            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">

              {text.careWorkspace}

            </p>

            <nav className="space-y-1.5">

              <SidebarItem

                href="/dashboard"

                icon={<LayoutDashboard size={19} />}

                label={text.overview}

                active

              />

              <SidebarItem

                href="/assessment"

                icon={<ClipboardList size={19} />}

                label={text.newAssessment}

              />

              <SidebarItem

                href="/consultation"

                icon={<Stethoscope size={19} />}

                label={text.doctorConsultation}

              />

              <SidebarItem

                href="/appointments"

                icon={<CalendarDays size={19} />}

                label={text.myAppointments}

              />

              <SidebarItem

                href="/caretakers"

                icon={<UsersRound size={19} />}

                label={text.caretakerAccess}

              />

              <SidebarItem

                href="/result"

                icon={<FileText size={19} />}

                label={text.latestReport}

              />

              <SidebarItem

                href="/profile"

                icon={<UserRound size={19} />}

                label={text.myProfile}

              />

            </nav>

          </div>

          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">

            <div className="flex items-center gap-2 text-cyan-300">

              <ShieldCheck size={19} />

              <p className="text-sm font-semibold">

                {text.protectedHealthData}

              </p>

            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">

              {text.protectedHealthDescription}

            </p>

          </div>

          <div className="mt-auto">

            <button

              type="button"

              onClick={handleLogout}

              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"

            >

              <LogOut size={18} />

              {text.logout}

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

                  {text.patientDashboard}

                </p>

              </div>

              <div className="flex items-center gap-3">

                <button

                  type="button"

                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"

                  aria-label={text.notifications}

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

                  {text.healthOverview}

                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">

                  {text.greeting}, {firstName}

                </h1>

                <p className="mt-2 text-slate-500">

                  {text.greetingDescription}

                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                <Link

                  href="/consultation"

                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"

                >

                  <Stethoscope size={18} />

                  {text.doctorConsultation}

                </Link>

                <Link

                  href="/assessment"

                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#07111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"

                >

                  <Plus size={18} />

                  {text.newAssessment}

                </Link>

              </div>

            </section>

            {!latestAssessment && (

              <section className="mb-7 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-center">

                <BrainCircuit

                  className="mx-auto text-cyan-700"

                  size={42}

                />

                <h2 className="mt-4 text-2xl font-bold">

                  {text.completeFirstAssessment}

                </h2>

                <p className="mx-auto mt-2 max-w-xl text-slate-600">

                  {text.firstAssessmentDescription}

                </p>

                <Link

                  href="/assessment"

                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white"

                >

                  {text.startAssessment}

                  <ChevronRight size={18} />

                </Link>

              </section>

            )}

            {/* Metric cards */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard

                icon={<Activity size={21} />}

                iconClass="bg-cyan-50 text-cyan-700"

                label={text.thiScore}

                value={

                  latestAssessment

                    ? `${latestAssessment.thi_score}/100`

                    : text.unavailableShort

                }

                footer={

                  scoreDifference === null

                    ? text.baselineAssessment

                    : scoreDifference > 0

                      ? `${scoreDifference} ${text.pointsImproved}`

                      : scoreDifference < 0

                        ? `${Math.abs(scoreDifference)} ${text.pointsIncreased}`

                        : text.noScoreChange

                }

              />

              <MetricCard

                icon={<HeartPulse size={21} />}

                iconClass="bg-amber-50 text-amber-700"

                label={text.currentSeverity}

                value={severity}

                footer={`${text.riskLevel}: ${risk}`}

              />

              <MetricCard

                icon={<CalendarDays size={21} />}

                iconClass="bg-violet-50 text-violet-700"

                label={text.lastAssessment}

                value={

                  latestAssessment

                    ? formatDate(

                        latestAssessment.createdAt,

                        locale,

                        text.notAvailable,

                        true

                      )

                    : text.unavailableShort

                }

                footer={`${assessments.length} ${text.totalAssessments}`}

              />

              <MetricCard

                icon={<Stethoscope size={21} />}

                iconClass="bg-emerald-50 text-emerald-700"

                label={text.carePlanProgress}

                value={`${careProgress}%`}

                footer={`${completedTasks.length} ${text.of} ${carePlan.length} ${text.tasksCompleted}`}

              />

            </div>

            {/* Chart and AI */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">

              {/* Progress chart */}

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-cyan-700">

                      {text.progressMonitoring}

                    </p>

                    <h2 className="mt-1 text-xl font-bold">

                      {text.assessmentTrends}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      {text.assessmentTrendsDescription}

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

                      {text.noChartData}

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

                      {text.online}

                    </span>

                  </div>

                  <div className="mt-6 flex items-center gap-2">

                    <h2 className="text-xl font-bold">

                      {text.personalAssistant}

                    </h2>

                    <Sparkles

                      size={17}

                      className="text-cyan-300"

                    />

                  </div>

                  <p className="mt-3 leading-7 text-slate-300">

                    {text.assistantDescription}

                  </p>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">

                      {text.suggestedPrompt}

                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">

                      {text.prompt}

                    </p>

                  </div>

                  <button

                    type="button"

                    disabled={!latestAssessment}

                    onClick={openAssistant}

                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"

                  >

                    {text.openAssistant}

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

                      {text.personalizedRoutine}

                    </p>

                    <h2 className="mt-1 text-xl font-bold">

                      {text.todaysActivities}

                    </h2>

                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                    {completedTasks.length}/{carePlan.length} {text.done}

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

                            {text.careActivity} {index + 1}

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

                      {text.latestClinicalOverview}

                    </p>

                    <h2 className="mt-1 text-xl font-bold">

                      {text.assessmentReport}

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

                        text.assessmentCompleted}

                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <ClinicalMetric

                        label={text.thiScore}

                        value={`${latestAssessment.thi_score}/100`}

                      />

                      <ClinicalMetric

                        label={text.tfiScore}

                        value={`${latestAssessment.tfi_score}/100`}

                      />

                      <ClinicalMetric

                        label={text.sleep}

                        value={

                          latestPrediction.sleep_status ||

                          `${latestAssessment.sleep_score}`

                        }

                      />

                      <ClinicalMetric

                        label={text.hearingLoss}

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

                      {text.viewFullReport}

                      <ChevronRight size={17} />

                    </button>

                  </>

                ) : (

                  <div className="flex min-h-64 items-center justify-center text-center text-slate-500">

                    {text.noReport}

                  </div>

                )}

              </section>

            </div>

            {/* Assessment history */}

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-cyan-700">

                    {text.healthRecord}

                  </p>

                  <h2 className="mt-1 text-xl font-bold">

                    {text.recentAssessments}

                  </h2>

                </div>

                <Link

                  href="/assessment"

                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"

                >

                  <Plus size={17} />

                  {text.addAssessment}

                </Link>

              </div>

              {assessments.length > 0 ? (

                <div className="mt-5 overflow-x-auto">

                  <table className="w-full min-w-[720px] text-left">

                    <thead>

                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">

                        <th className="px-4 py-4 font-semibold">

                          {text.date}

                        </th>

                        <th className="px-4 py-4 font-semibold">

                          THI

                        </th>

                        <th className="px-4 py-4 font-semibold">

                          TFI

                        </th>

                        <th className="px-4 py-4 font-semibold">

                          {text.severity}

                        </th>

                        <th className="px-4 py-4 font-semibold">

                          {text.status}

                        </th>

                        <th className="px-4 py-4 font-semibold">

                          {text.report}

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

                                assessment.createdAt,

                                locale,

                                text.notAvailable

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

                                {prediction.stage || text.unavailableShort}

                              </span>

                            </td>

                            <td className="px-4 py-4">

                              <span className="inline-flex items-center gap-1.5 text-emerald-700">

                                <Check size={15} />

                                {text.completed}

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

                                {text.viewReport}

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

                  {text.noAssessmentHistory}

                </div>

              )}

            </section>

            <footer className="mt-8 border-t border-slate-200 pt-6 text-center text-xs leading-5 text-slate-500">

              {text.medicalDisclaimer}

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
