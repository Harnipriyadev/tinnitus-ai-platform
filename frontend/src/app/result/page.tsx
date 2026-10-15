"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import {
  Activity,
  Brain,
  Copy,
  Download,
  HeartPulse,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Moon,
  Share2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  resultTranslations,
} from "../../../lib/resultTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

type ReportData = {
  patient_name?: string;
  email?: string;
  age?: string | number;
  gender?: string;
  tinnitus_type?: string;
  affected_ear?: string;
  frequency_hz?: string | number;
  loudness_db?: string | number;
  hearing_loss?: string;
  thi_score?: string | number;
  tfi_score?: string | number;
  hads_anxiety?: string | number;
  hads_depression?: string | number;
  sleep_score?: string | number;
  treatment?: string;
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
  assessmentId?: string;
  createdAt?: string;
};

type StoredUser = {
  _id?: string;
  fullName?: string;
  email?: string;
};

export default function ResultPage() {
  const { language } =
    useLanguage();

  const text =
    resultTranslations[language];

  const locale =
    language === "kn"
      ? "kn-IN"
      : language === "hi"
        ? "hi-IN"
        : "en-IN";

  const [result, setResult] =
    useState<ReportData | null>(
      null
    );

  const [reportDate, setReportDate] =
    useState("");

  useEffect(() => {
    try {
      const storedPrediction =
        localStorage.getItem(
          "prediction"
        );

      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (!storedPrediction) {
        return;
      }

      const prediction: ReportData =
        JSON.parse(
          storedPrediction
        );

      const user: StoredUser =
        storedUser
          ? JSON.parse(storedUser)
          : {};

      setResult({
        ...prediction,
        patient_name:
          prediction.patient_name ||
          user.fullName ||
          text.registeredUser,
        email:
          prediction.email ||
          user.email ||
          text.notAvailable,
      });

      setReportDate(
        new Intl.DateTimeFormat(
          locale,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ).format(
          prediction.createdAt
            ? new Date(
                prediction.createdAt
              )
            : new Date()
        )
      );
    } catch (error) {
      console.error(
        "Unable to load report:",
        error
      );
    }
  }, [locale, text]);

  const createShareText = () => {
    if (!result) return "";

    return `${text.reportTitle}

${text.patient}: ${result.patient_name || text.registeredUser}
${text.stage}: ${result.stage || text.notApplicable}
${text.risk}: ${result.risk || text.notApplicable}

${result.summary || text.noSummary}`;
  };

  const shareReport = async () => {
    if (!result) return;

    try {
      if (!navigator.share) {
        window.alert(
          text.shareUnsupported
        );
        return;
      }

      await navigator.share({
        title: text.reportTitle,
        text: createShareText(),
      });
    } catch (error) {
      console.error(
        "Share error:",
        error
      );
    }
  };

  const shareWhatsApp = () => {
    if (!result) return;

    const shareText =
      encodeURIComponent(
        createShareText()
      );

    window.open(
      `https://wa.me/?text=${shareText}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareEmail = () => {
    if (!result) return;

    const subject =
      encodeURIComponent(
        text.reportTitle
      );

    const body =
      encodeURIComponent(
        createShareText()
      );

    window.location.href =
      `mailto:?subject=${subject}&body=${body}`;
  };

  const copySummary = async () => {
    if (!result?.summary) {
      window.alert(
        text.noSummaryToCopy
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.summary
      );

      window.alert(
        text.summaryCopied
      );
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      window.alert(
        text.unableToCopy
      );
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    /*
     * jsPDF's built-in Helvetica font does not
     * contain Hindi or Kannada glyphs. Keep PDF
     * labels in English until a Unicode font is
     * embedded, preventing unreadable characters.
     */
    const pdfText =
      resultTranslations.en;

    const pdfReportDate =
      new Intl.DateTimeFormat(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      ).format(
        result.createdAt
          ? new Date(
              result.createdAt
            )
          : new Date()
      );

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const pageHeight = 297;
    const left = 18;
    const contentWidth = 170;
    let y = 20;

    const checkPage = (
      space = 15
    ) => {
      if (
        y + space >
        pageHeight - 20
      ) {
        pdf.addPage();
        y = 20;
      }
    };

    const heading = (
      title: string
    ) => {
      checkPage(15);
      pdf.setFont(
        "helvetica",
        "bold"
      );
      pdf.setFontSize(15);
      pdf.setTextColor(
        20,
        20,
        20
      );
      pdf.text(title, left, y);
      y += 8;
    };

    const field = (
      label: string,
      value:
        | string
        | number
        | undefined
    ) => {
      checkPage(10);
      pdf.setFont(
        "helvetica",
        "bold"
      );
      pdf.setFontSize(11);
      pdf.setTextColor(
        20,
        20,
        20
      );
      pdf.text(
        `${label}:`,
        left,
        y
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );
      pdf.text(
        String(
          value ??
            pdfText.notApplicable
        ),
        60,
        y
      );
      y += 7;
    };

    const paragraph = (
      value?: string
    ) => {
      checkPage(15);
      pdf.setFont(
        "helvetica",
        "normal"
      );
      pdf.setFontSize(11);
      pdf.setTextColor(
        40,
        40,
        40
      );

      const lines =
        pdf.splitTextToSize(
          value ||
            pdfText.notApplicable,
          contentWidth
        );

      lines.forEach(
        (line: string) => {
          checkPage(7);
          pdf.text(
            line,
            left,
            y
          );
          y += 6;
        }
      );
      y += 5;
    };

    const list = (
      items?: string[]
    ) => {
      if (
        !items ||
        items.length === 0
      ) {
        paragraph(
          pdfText.notApplicable
        );
        return;
      }

      pdf.setFont(
        "helvetica",
        "normal"
      );
      pdf.setFontSize(11);
      pdf.setTextColor(
        40,
        40,
        40
      );

      items.forEach((item) => {
        const lines =
          pdf.splitTextToSize(
            `• ${item}`,
            contentWidth - 5
          );

        lines.forEach(
          (line: string) => {
            checkPage(7);
            pdf.text(
              line,
              left + 5,
              y
            );
            y += 6;
          }
        );
        y += 1;
      });
      y += 4;
    };

    pdf.setFont(
      "helvetica",
      "bold"
    );
    pdf.setFontSize(22);
    pdf.setTextColor(
      25,
      55,
      109
    );
    pdf.text(
      pdfText.reportTitle,
      left,
      y
    );
    y += 10;

    pdf.setFont(
      "helvetica",
      "normal"
    );
    pdf.setFontSize(11);
    pdf.setTextColor(
      120,
      120,
      120
    );
    pdf.text(
      pdfText.generatedBy,
      left,
      y
    );
    y += 8;
    pdf.setDrawColor(
      180,
      180,
      180
    );
    pdf.line(left, y, 190, y);
    y += 12;

    heading(
      pdfText.patientInformation
    );
    field(
      pdfText.patientName,
      result.patient_name
    );
    field(
      pdfText.email,
      result.email
    );
    field(pdfText.age, result.age);
    field(
      pdfText.gender,
      result.gender
    );
    field(
      pdfText.tinnitusType,
      result.tinnitus_type
    );
    field(
      pdfText.affectedEar,
      result.affected_ear
    );
    field(
      pdfText.frequency,
      result.frequency_hz
    );
    field(
      pdfText.loudness,
      result.loudness_db
    );
    field(
      pdfText.hearingLoss,
      result.hearing_loss
    );
    y += 5;

    heading(pdfText.aiAssessment);
    field(
      pdfText.severityStage,
      result.stage
    );
    field(
      pdfText.riskLevel,
      result.risk
    );
    field(
      pdfText.confidence,
      result.confidence
    );
    field(
      pdfText.thiScore,
      result.thi_score
    );
    field(
      pdfText.tfiScore,
      result.tfi_score
    );
    y += 5;

    heading(
      pdfText.mentalHealthAnalysis
    );
    paragraph(result.mental_health);
    heading(pdfText.sleepAnalysis);
    paragraph(result.sleep_status);
    heading(
      pdfText.clinicalInterpretation
    );
    paragraph(
      result.clinical_interpretation
    );
    heading(
      pdfText.recommendedSpecialists
    );
    list(result.doctor);
    heading(
      pdfText.recommendedTreatments
    );
    list(result.treatments);
    heading(pdfText.recoveryPlan);
    list(result.recovery_plan);
    heading(
      pdfText.lifestyleRecommendations
    );
    list(result.tips);
    heading(
      pdfText.aiGeneratedSummary
    );
    paragraph(result.summary);

    checkPage(25);
    pdf.setDrawColor(
      180,
      180,
      180
    );
    pdf.line(left, y, 190, y);
    y += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(
      120,
      120,
      120
    );
    pdf.text(
      `${pdfText.generatedOn}: ${pdfReportDate}`,
      left,
      y
    );
    y += 6;

    const disclaimer =
      pdf.splitTextToSize(
        pdfText.disclaimer,
        contentWidth
      );

    pdf.text(
      disclaimer,
      left,
      y
    );
    pdf.save(
      "AI_Tinnitus_Report.pdf"
    );
  };

  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 px-6 text-center text-white">
        <Brain
          className="animate-pulse text-cyan-400"
          size={50}
        />

        <h1 className="text-2xl font-semibold">
          {text.loadingReport}
        </h1>

        <p className="max-w-md text-sm text-slate-400">
          {text.loadingHint}
        </p>

        <Link
          href="/assessment"
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
        >
          {text.startAssessment}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 sm:p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-500 sm:h-20 sm:w-20">
              <Brain
                size={40}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white sm:text-4xl">
                {text.reportTitle}
              </h1>

              <p className="mt-1 text-gray-300">
                {text.subtitle}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            <LayoutDashboard
              size={19}
            />
            {text.openDashboard}
          </Link>
        </header>

        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <ReportCard
            label={text.severityStage}
            value={result.stage}
            color="text-green-400"
            emptyText={text.notApplicable}
          />

          <ReportCard
            label={text.riskLevel}
            value={result.risk}
            color="text-yellow-400"
            emptyText={text.notApplicable}
          />

          <ReportCard
            label={text.confidence}
            value={result.confidence}
            color="text-cyan-400"
            emptyText={text.notApplicable}
          />
        </section>

        <ReportSection
          title={text.patientInformation}
        >
          <div className="grid gap-4 text-gray-300 md:grid-cols-2">
            <Information
              label={text.name}
              value={result.patient_name}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.email}
              value={result.email}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.age}
              value={result.age}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.gender}
              value={result.gender}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.tinnitusType}
              value={result.tinnitus_type}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.affectedEar}
              value={result.affected_ear}
              emptyText={text.notApplicable}
            />
            <Information
              label={text.frequency}
              value={
                result.frequency_hz
                  ? `${result.frequency_hz} Hz`
                  : undefined
              }
              emptyText={text.notApplicable}
            />
            <Information
              label={text.loudness}
              value={
                result.loudness_db
                  ? `${result.loudness_db} dB`
                  : undefined
              }
              emptyText={text.notApplicable}
            />
          </div>
        </ReportSection>

        <ReportSection
          title={
            text.mentalHealthAnalysis
          }
          icon={
            <HeartPulse className="text-pink-400" />
          }
        >
          <p className="leading-8 text-gray-300">
            {result.mental_health ||
              text.noAnalysis}
          </p>
        </ReportSection>

        <ReportSection
          title={text.sleepAnalysis}
          icon={
            <Moon className="text-blue-400" />
          }
        >
          <p className="leading-8 text-gray-300">
            {result.sleep_status ||
              text.noAnalysis}
          </p>
        </ReportSection>

        <ReportSection
          title={
            text.clinicalInterpretation
          }
          icon={
            <Activity className="text-orange-400" />
          }
        >
          <p className="leading-8 text-gray-300">
            {result.clinical_interpretation ||
              text.noClinicalInterpretation}
          </p>
        </ReportSection>

        <ReportSection
          title={
            text.recommendedSpecialists
          }
          icon={
            <Stethoscope className="text-cyan-400" />
          }
        >
          <ReportList
            items={result.doctor}
            style="border-cyan-500/20 bg-cyan-500/20 text-cyan-300"
            emptyText={
              text.noRecommendations
            }
          />
        </ReportSection>

        <ReportSection
          title={
            text.recommendedTreatments
          }
        >
          <ReportList
            items={result.treatments}
            style="border-cyan-500/20 bg-cyan-500/20 text-cyan-300"
            emptyText={
              text.noRecommendations
            }
          />
        </ReportSection>

        <ReportSection
          title={
            text.personalizedRecoveryPlan
          }
        >
          <ReportList
            items={
              result.recovery_plan
            }
            style="border-purple-500/30 bg-purple-500/20 text-purple-300"
            emptyText={
              text.noRecommendations
            }
          />
        </ReportSection>

        <ReportSection
          title={
            text.lifestyleRecommendations
          }
          icon={
            <ShieldCheck className="text-green-400" />
          }
        >
          <ReportList
            items={result.tips}
            style="border-green-500/20 bg-green-500/20 text-green-300"
            emptyText={
              text.noRecommendations
            }
          />
        </ReportSection>

        <ReportSection
          title={text.aiGeneratedSummary}
        >
          <p className="whitespace-pre-line leading-8 text-gray-300">
            {result.summary ||
              text.noSummary}
          </p>
        </ReportSection>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            <LayoutDashboard
              size={18}
            />
            {text.dashboard}
          </Link>

          <button
            type="button"
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            <Download size={18} />
            {text.pdf}
          </button>

          <button
            type="button"
            onClick={() =>
              void shareReport()
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700"
          >
            <Share2 size={18} />
            {text.share}
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
          >
            <MessageCircle
              size={18}
            />
            {text.whatsapp}
          </button>

          <button
            type="button"
            onClick={shareEmail}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            <Mail size={18} />
            {text.emailAction}
          </button>

          <button
            type="button"
            onClick={() =>
              void copySummary()
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            <Copy size={18} />
            {text.copy}
          </button>
        </section>

        <footer className="mt-10 border-t border-slate-700 pt-6 text-center">
          <p className="text-sm text-gray-400">
            {text.footerProduct}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {text.disclaimer}
          </p>

          <p className="mt-2 text-xs text-gray-600">
            {text.generatedOn}{" "}
            {reportDate ||
              text.notAvailable}
          </p>
        </footer>
      </div>
    </main>
  );
}

type ReportCardProps = {
  label: string;
  value?: string | number;
  color: string;
  emptyText: string;
};

function ReportCard({
  label,
  value,
  color,
  emptyText,
}: ReportCardProps) {
  return (
    <article className="rounded-2xl bg-slate-800 p-6">
      <h3 className="mb-2 text-gray-400">
        {label}
      </h3>

      <p
        className={`text-3xl font-bold ${color}`}
      >
        {value ?? emptyText}
      </p>
    </article>
  );
}

type ReportSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

function ReportSection({
  title,
  icon,
  children,
}: ReportSectionProps) {
  return (
    <section className="mb-6 rounded-2xl bg-slate-800 p-6">
      <div className="mb-4 flex items-center gap-3">
        {icon}

        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

type InformationProps = {
  label: string;
  value?: string | number;
  emptyText: string;
};

function Information({
  label,
  value,
  emptyText,
}: InformationProps) {
  return (
    <p>
      <strong>{label}:</strong>{" "}
      {value ?? emptyText}
    </p>
  );
}

type ReportListProps = {
  items?: string[];
  style: string;
  emptyText: string;
};

function ReportList({
  items,
  style,
  emptyText,
}: ReportListProps) {
  if (
    !items ||
    items.length === 0
  ) {
    return (
      <p className="text-gray-400">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`rounded-xl border px-4 py-3 ${style}`}
        >
          ✓ {item}
        </li>
      ))}
    </ul>
  );
}
