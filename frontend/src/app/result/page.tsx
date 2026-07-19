"use client";

import { useEffect, useState } from "react";
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
  const [result, setResult] = useState<ReportData | null>(null);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    try {
      const storedPrediction = localStorage.getItem("prediction");
      const storedUser = localStorage.getItem("user");

      if (!storedPrediction) {
        return;
      }

      const prediction: ReportData = JSON.parse(storedPrediction);

      const user: StoredUser = storedUser
        ? JSON.parse(storedUser)
        : {};

      setResult({
        ...prediction,
        patient_name:
          prediction.patient_name ||
          user.fullName ||
          "Registered User",
        email:
          prediction.email ||
          user.email ||
          "Not available",
      });

      setReportDate(
        prediction.createdAt
          ? new Date(prediction.createdAt).toLocaleString()
          : new Date().toLocaleString()
      );
    } catch (error) {
      console.error("Unable to load report:", error);
    }
  }, []);

  const createShareText = () => {
    if (!result) return "";

    return `AI Tinnitus Assessment Report

Patient: ${result.patient_name || "Registered User"}
Stage: ${result.stage || "N/A"}
Risk: ${result.risk || "N/A"}

${result.summary || "No summary available."}`;
  };

  const shareReport = async () => {
    if (!result) return;

    try {
      if (!navigator.share) {
        alert("Native sharing is not supported by this browser.");
        return;
      }

      await navigator.share({
        title: "AI Tinnitus Assessment Report",
        text: createShareText(),
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const shareWhatsApp = () => {
    if (!result) return;

    const text = encodeURIComponent(createShareText());

    window.open(
      `https://wa.me/?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareEmail = () => {
    if (!result) return;

    const subject = encodeURIComponent(
      "AI Tinnitus Assessment Report"
    );

    const body = encodeURIComponent(createShareText());

    window.location.href =
      `mailto:?subject=${subject}&body=${body}`;
  };

  const copySummary = async () => {
    if (!result?.summary) {
      alert("No report summary is available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(result.summary);
      alert("Summary copied successfully.");
    } catch (error) {
      console.error("Copy error:", error);
      alert("Unable to copy the summary.");
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    const pdf = new jsPDF("p", "mm", "a4");

    const pageHeight = 297;
    const left = 18;
    const contentWidth = 170;

    let y = 20;

    const checkPage = (space = 15) => {
      if (y + space > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }
    };

    const heading = (title: string) => {
      checkPage(15);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(20, 20, 20);
      pdf.text(title, left, y);

      y += 8;
    };

    const field = (
      label: string,
      value: string | number | undefined
    ) => {
      checkPage(10);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(20, 20, 20);
      pdf.text(`${label}:`, left, y);

      pdf.setFont("helvetica", "normal");
      pdf.text(String(value ?? "N/A"), 60, y);

      y += 7;
    };

    const paragraph = (value?: string) => {
      checkPage(15);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);

      const lines = pdf.splitTextToSize(
        value || "N/A",
        contentWidth
      );

      lines.forEach((line: string) => {
        checkPage(7);
        pdf.text(line, left, y);
        y += 6;
      });

      y += 5;
    };

    const list = (items?: string[]) => {
      if (!items || items.length === 0) {
        paragraph("N/A");
        return;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);

      items.forEach((item) => {
        const lines = pdf.splitTextToSize(
          `• ${item}`,
          contentWidth - 5
        );

        lines.forEach((line: string) => {
          checkPage(7);
          pdf.text(line, left + 5, y);
          y += 6;
        });

        y += 1;
      });

      y += 4;
    };

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(25, 55, 109);
    pdf.text("AI Tinnitus Assessment Report", left, y);

    y += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(120, 120, 120);

    pdf.text(
      "Generated by AI Personalized Tinnitus Care System",
      left,
      y
    );

    y += 8;

    pdf.setDrawColor(180, 180, 180);
    pdf.line(left, y, 190, y);

    y += 12;

    // Patient information
    heading("Patient Information");

    field("Patient Name", result.patient_name);
    field("Email", result.email);
    field("Age", result.age);
    field("Gender", result.gender);
    field("Tinnitus Type", result.tinnitus_type);
    field("Affected Ear", result.affected_ear);
    field("Frequency", result.frequency_hz);
    field("Loudness", result.loudness_db);
    field("Hearing Loss", result.hearing_loss);

    y += 5;

    // Diagnosis
    heading("AI Assessment");

    field("Severity Stage", result.stage);
    field("Risk Level", result.risk);
    field("Confidence", result.confidence);
    field("THI Score", result.thi_score);
    field("TFI Score", result.tfi_score);

    y += 5;

    heading("Mental Health Analysis");
    paragraph(result.mental_health);

    heading("Sleep Analysis");
    paragraph(result.sleep_status);

    heading("Clinical Interpretation");
    paragraph(result.clinical_interpretation);

    heading("Recommended Specialists");
    list(result.doctor);

    heading("Recommended Treatments");
    list(result.treatments);

    heading("Recovery Plan");
    list(result.recovery_plan);

    heading("Lifestyle Recommendations");
    list(result.tips);

    heading("AI-Generated Summary");
    paragraph(result.summary);

    checkPage(25);

    pdf.setDrawColor(180, 180, 180);
    pdf.line(left, y, 190, y);

    y += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);

    pdf.text(
      `Generated on: ${reportDate || "N/A"}`,
      left,
      y
    );

    y += 6;

    const disclaimer = pdf.splitTextToSize(
      "This AI-generated report supports healthcare professionals and does not replace professional medical diagnosis or treatment.",
      contentWidth
    );

    pdf.text(disclaimer, left, y);

    pdf.save("AI_Tinnitus_Report.pdf");
  };

  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 px-6 text-center text-white">
        <Brain className="animate-pulse text-cyan-400" size={50} />

        <h1 className="text-2xl font-semibold">
          Loading AI Report...
        </h1>

        <p className="max-w-md text-sm text-slate-400">
          If the report does not load, complete a new assessment first.
        </p>

        <Link
          href="/assessment"
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
        >
          Start Assessment
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 sm:p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-500 sm:h-20 sm:w-20">
              <Brain size={40} className="text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white sm:text-4xl">
                AI Tinnitus Assessment Report
              </h1>

              <p className="mt-1 text-gray-300">
                Personalized Hearing Health Analysis
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            <LayoutDashboard size={19} />
            Open Dashboard
          </Link>
        </header>

        {/* Severity cards */}
        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <ReportCard
            label="Severity Stage"
            value={result.stage}
            color="text-green-400"
          />

          <ReportCard
            label="Risk Level"
            value={result.risk}
            color="text-yellow-400"
          />

          <ReportCard
            label="Confidence"
            value={result.confidence}
            color="text-cyan-400"
          />
        </section>

        {/* Patient information */}
        <ReportSection title="Patient Information">
          <div className="grid gap-4 text-gray-300 md:grid-cols-2">
            <Information
              label="Name"
              value={result.patient_name}
            />

            <Information
              label="Email"
              value={result.email}
            />

            <Information label="Age" value={result.age} />
            <Information label="Gender" value={result.gender} />

            <Information
              label="Tinnitus Type"
              value={result.tinnitus_type}
            />

            <Information
              label="Affected Ear"
              value={result.affected_ear}
            />

            <Information
              label="Frequency"
              value={
                result.frequency_hz
                  ? `${result.frequency_hz} Hz`
                  : undefined
              }
            />

            <Information
              label="Loudness"
              value={
                result.loudness_db
                  ? `${result.loudness_db} dB`
                  : undefined
              }
            />
          </div>
        </ReportSection>

        {/* Mental health */}
        <ReportSection
          title="Mental Health Analysis"
          icon={<HeartPulse className="text-pink-400" />}
        >
          <p className="leading-8 text-gray-300">
            {result.mental_health || "No analysis available."}
          </p>
        </ReportSection>

        {/* Sleep */}
        <ReportSection
          title="Sleep Analysis"
          icon={<Moon className="text-blue-400" />}
        >
          <p className="leading-8 text-gray-300">
            {result.sleep_status || "No analysis available."}
          </p>
        </ReportSection>

        {/* Clinical interpretation */}
        <ReportSection
          title="Clinical Interpretation"
          icon={<Activity className="text-orange-400" />}
        >
          <p className="leading-8 text-gray-300">
            {result.clinical_interpretation ||
              "No clinical interpretation available."}
          </p>
        </ReportSection>

        {/* Doctors */}
        <ReportSection
          title="Recommended Specialists"
          icon={<Stethoscope className="text-cyan-400" />}
        >
          <ReportList
            items={result.doctor}
            style="border-cyan-500/20 bg-cyan-500/20 text-cyan-300"
          />
        </ReportSection>

        {/* Treatments */}
        <ReportSection title="Recommended Treatments">
          <ReportList
            items={result.treatments}
            style="border-cyan-500/20 bg-cyan-500/20 text-cyan-300"
          />
        </ReportSection>

        {/* Recovery plan */}
        <ReportSection title="Personalized Recovery Plan">
          <ReportList
            items={result.recovery_plan}
            style="border-purple-500/30 bg-purple-500/20 text-purple-300"
          />
        </ReportSection>

        {/* Lifestyle */}
        <ReportSection
          title="Lifestyle Recommendations"
          icon={<ShieldCheck className="text-green-400" />}
        >
          <ReportList
            items={result.tips}
            style="border-green-500/20 bg-green-500/20 text-green-300"
          />
        </ReportSection>

        {/* Summary */}
        <ReportSection title="AI-Generated Summary">
          <p className="whitespace-pre-line leading-8 text-gray-300">
            {result.summary || "No summary available."}
          </p>
        </ReportSection>

        {/* Actions */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <button
            type="button"
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            <Download size={18} />
            PDF
          </button>

          <button
            type="button"
            onClick={shareReport}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700"
          >
            <Share2 size={18} />
            Share
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>

          <button
            type="button"
            onClick={shareEmail}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            <Mail size={18} />
            Email
          </button>

          <button
            type="button"
            onClick={copySummary}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            <Copy size={18} />
            Copy
          </button>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-700 pt-6 text-center">
          <p className="text-sm text-gray-400">
            AI Personalized Tinnitus Care and Support System
          </p>

          <p className="mt-2 text-xs text-gray-500">
            This report is AI-generated and intended to support
            healthcare professionals. It is not a substitute for
            professional medical diagnosis or treatment.
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Generated on {reportDate || "Not available"}
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
};

function ReportCard({
  label,
  value,
  color,
}: ReportCardProps) {
  return (
    <article className="rounded-2xl bg-slate-800 p-6">
      <h3 className="mb-2 text-gray-400">{label}</h3>

      <p className={`text-3xl font-bold ${color}`}>
        {value ?? "N/A"}
      </p>
    </article>
  );
}

type ReportSectionProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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
};

function Information({
  label,
  value,
}: InformationProps) {
  return (
    <p>
      <strong>{label}:</strong> {value ?? "N/A"}
    </p>
  );
}

type ReportListProps = {
  items?: string[];
  style: string;
};

function ReportList({
  items,
  style,
}: ReportListProps) {
  if (!items || items.length === 0) {
    return (
      <p className="text-gray-400">
        No recommendations are available.
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