"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";

type Question = {
  question: string;
  name: string;
  type: "text" | "number" | "select";
  options?: string[];
};

const questions: Question[] = [
  { question: "Patient Name", 
    name: "patient_name", 
    type: "text", },
   { question: "Email", 
    name: "email", 
    type: "text", },
  {
    question: "What is your age?",
    name: "age",
    type: "number",
  },
  {
    question: "What is your gender?",
    name: "gender",
    type: "select",
    options: ["Male", "Female"],
  },
  {
    question: "What type of tinnitus do you have?",
    name: "tinnitus_type",
    type: "select",
    options: [
      "Subjective",
      "Objective",
      "Pulsatile",
      "Somatic",
      "Sensorineural",
    ],
  },
  {
    question: "Which ear is affected?",
    name: "affected_ear",
    type: "select",
    options: ["Left", "Right", "Both"],
  },
  {
    question: "Tinnitus Frequency (Hz)",
    name: "frequency_hz",
    type: "number",
  },
  {
    question: "Loudness (dB)",
    name: "loudness_db",
    type: "number",
  },
  {
    question: "Hearing Loss",
    name: "hearing_loss",
    type: "select",
    options: ["None", "Mild", "Moderate", "Severe"],
  },
  {
    question: "THI Score",
    name: "thi_score",
    type: "number",
  },
  {
    question: "TFI Score",
    name: "tfi_score",
    type: "number",
  },
  {
    question: "HADS Anxiety Score",
    name: "hads_anxiety",
    type: "number",
  },
  {
    question: "HADS Depression Score",
    name: "hads_depression",
    type: "number",
  },
  {
    question: "Sleep Score",
    name: "sleep_score",
    type: "number",
  },
  {
    question: "Current Treatment",
    name: "treatment",
    type: "select",
    options: [
      "Medication",
      "CBT",
      "Sound Therapy",
      "Hearing Aid",
      "TMJ Therapy",
      "Combined",
    ],
  },
];

export default function AssessmentPage() {
  const router = useRouter();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.name]: value,
    }));
  };

  const nextQuestion = () => {
    if (!answers[currentQuestion.name]) {
      alert("Please answer this question.");
      return;
    }

    if (current < questions.length - 1) {
      setCurrent((previous) => previous + 1);
    }
  };

  const previousQuestion = () => {
    if (current > 0) {
      setCurrent((previous) => previous - 1);
    }
  };

  const handleSubmit = async () => {
    if (!answers[currentQuestion.name]) {
      alert("Please answer this question.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in before submitting an assessment.");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/assessment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(answers),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          alert("Your session has expired. Please log in again.");
          router.push("/login");
          return;
        }

        throw new Error(data.message || "Prediction failed");
      }

      const prediction =
        typeof data.prediction === "object" && data.prediction !== null
          ? data.prediction
          : { outcome: data.prediction };

      const reportData = {
        ...answers,
        ...prediction,
        assessmentId: data.assessment?._id,
        createdAt: data.assessment?.createdAt,
      };

      localStorage.setItem(
        "prediction",
        JSON.stringify(reportData)
      );

      router.push("/result");
    } catch (error) {
      console.error("Assessment submission error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit assessment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black px-6 py-10">
      <motion.section
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-500">
            <Brain className="text-white" size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              AI Tinnitus Assessment
            </h1>

            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              Intelligent Hearing Health Evaluation
            </p>
          </div>
        </header>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-gray-300">
            <span>
              Question {current + 1} / {questions.length}
            </span>

            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              initial={false}
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-cyan-400"
            />
          </div>
        </div>

        {/* Current question */}
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="mb-8 text-2xl font-semibold text-white">
            {currentQuestion.question}
          </h2>

          {currentQuestion.type === "text" ||
          currentQuestion.type === "number" ? (
            <input
              type={currentQuestion.type}
              value={answers[currentQuestion.name] || ""}
              onChange={(event) => handleAnswer(event.target.value)}
              min={currentQuestion.type === "number" ? 0 : undefined}
              disabled={loading}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-5 text-lg text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 disabled:opacity-60"
              placeholder="Enter your answer"
              autoFocus
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {currentQuestion.options?.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={loading}
                  className={`rounded-xl border p-5 text-lg font-medium transition-all ${
                    answers[currentQuestion.name] === option
                      ? "scale-[1.02] border-cyan-500 bg-cyan-500 text-white"
                      : "border-white/20 bg-white/10 text-gray-200 hover:bg-white/20"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <footer className="mt-10 flex justify-between gap-4">
          <button
            type="button"
            onClick={previousQuestion}
            disabled={current === 0 || loading}
            className="flex items-center gap-2 rounded-xl bg-gray-700 px-5 py-3 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Previous
          </button>

          {current === questions.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Predicting..." : "Get Prediction"}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-white transition hover:bg-cyan-600"
            >
              Next
              <ArrowRight size={18} />
            </button>
          )}
        </footer>
      </motion.section>
    </main>
  );
}