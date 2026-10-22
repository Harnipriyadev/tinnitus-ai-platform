"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Info,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../lib/authService";

import {
  getAssessmentTranslation,
} from "../../../lib/assessmentTranslations";

import type {
  AssessmentQuestionName,
} from "../../../lib/assessmentTranslations";

import {
  useLanguage,
} from "../context/LanguageContext";

type Question = {
  name: AssessmentQuestionName;

  type:
    | "text"
    | "email"
    | "number"
    | "select";

  options?: string[];
  min?: number;
  max?: number;
  step?: number;
};

type AssessmentResponse = {
  success?: boolean;
  message?: string;
  prediction?: unknown;

  assessment?: {
    _id?: string;
    createdAt?: string;
  };
};

/*
 * These original values are submitted to the
 * backend and must not be translated.
 */
const questions: Question[] = [
  {
    name: "patient_name",
    type: "text",
  },
  {
    name: "email",
    type: "email",
  },
  {
    name: "age",
    type: "number",
    min: 1,
    max: 120,
    step: 1,
  },
  {
    name: "gender",
    type: "select",
    options: [
      "Male",
      "Female",
    ],
  },
  {
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
    name: "affected_ear",
    type: "select",
    options: [
      "Left",
      "Right",
      "Both",
    ],
  },
  {
    name: "frequency_hz",
    type: "number",
    min: 20,
    max: 20000,
    step: 1,
  },
  {
    name: "loudness_db",
    type: "number",
    min: 0,
    max: 120,
    step: 1,
  },
  {
    name: "hearing_loss",
    type: "select",
    options: [
      "None",
      "Mild",
      "Moderate",
      "Severe",
    ],
  },
  {
    name: "thi_score",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    name: "tfi_score",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    name: "hads_anxiety",
    type: "number",
    min: 0,
    max: 21,
    step: 1,
  },
  {
    name: "hads_depression",
    type: "number",
    min: 0,
    max: 21,
    step: 1,
  },
  {
    name: "sleep_score",
    type: "number",
    min: 0,
    step: 1,
  },
  {
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

  const {
    language,
  } = useLanguage();

  const [current, setCurrent] =
    useState(0);

  const [answers, setAnswers] =
    useState<Record<string, string>>(
      {}
    );

  const [loading, setLoading] =
    useState(false);

  const translation =
    getAssessmentTranslation(
      language
    );

  const currentQuestion =
    questions[current];

  const questionText =
    translation.questions[
      currentQuestion.name
    ];

  const progress =
    ((current + 1) /
      questions.length) *
    100;

  const handleAnswer = (
    value: string
  ) => {
    /*
     * Select options are stored using their
     * original English backend values.
     */
    setAnswers(
      (previousAnswers) => ({
        ...previousAnswers,

        [currentQuestion.name]:
          value,
      })
    );
  };

  const validateCurrentAnswer =
    () => {
      const answer =
        answers[
          currentQuestion.name
        ]?.trim();

      if (!answer) {
        alert(
          translation.validation
            .required
        );

        return false;
      }

      if (
        currentQuestion.type ===
        "number"
      ) {
        const numericValue =
          Number(answer);

        if (
          !Number.isFinite(
            numericValue
          )
        ) {
          alert(
            translation.validation
              .invalidNumber
          );

          return false;
        }

        if (
          currentQuestion.min !==
            undefined &&
          numericValue <
            currentQuestion.min
        ) {
          alert(
            `${translation.validation.minimumValue} ${currentQuestion.min}.`
          );

          return false;
        }

        if (
          currentQuestion.max !==
            undefined &&
          numericValue >
            currentQuestion.max
        ) {
          alert(
            `${translation.validation.maximumValue} ${currentQuestion.max}.`
          );

          return false;
        }
      }

      if (
        currentQuestion.type ===
        "email"
      ) {
        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailPattern.test(
            answer
          )
        ) {
          alert(
            translation.validation
              .invalidEmail
          );

          return false;
        }
      }

      return true;
    };

  const nextQuestion = () => {
    if (
      !validateCurrentAnswer()
    ) {
      return;
    }

    if (
      current <
      questions.length - 1
    ) {
      setCurrent(
        (previous) =>
          previous + 1
      );
    }
  };

  const previousQuestion =
    () => {
      if (current > 0) {
        setCurrent(
          (previous) =>
            previous - 1
        );
      }
    };

  const handleSubmit =
    async () => {
      if (
        !validateCurrentAnswer()
      ) {
        return;
      }

      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL
          ?.replace(/\/+$/, "");

      if (!apiUrl) {
        alert(
          translation.validation
            .apiNotConfigured
        );

        return;
      }

      setLoading(true);

      try {
        const response =
          await authenticatedFetch(
            `${apiUrl}/api/assessment`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                answers
              ),
            }
          );

        const data: AssessmentResponse =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            await logoutUser();

            alert(
              translation.validation
                .sessionExpired
            );

            router.replace(
              "/login"
            );

            return;
          }

          throw new Error(
            data.message ||
              translation.validation
                .processingFailed
          );
        }

        const prediction =
          typeof data.prediction ===
            "object" &&
          data.prediction !== null
            ? data.prediction
            : {
                outcome:
                  data.prediction,
              };

        const reportData = {
          ...answers,
          ...prediction,

          assessmentLanguage:
            language,

          assessmentId:
            data.assessment?._id,

          createdAt:
            data.assessment
              ?.createdAt,
        };

        localStorage.setItem(
          "prediction",
          JSON.stringify(
            reportData
          )
        );

        router.push("/result");
      } catch (error) {
        console.error(
          "Assessment submission error:",
          error
        );

        if (
          error instanceof Error &&
          error.message ===
            "You are not authenticated"
        ) {
          alert(
            translation.validation
              .signInRequired
          );

          router.replace(
            "/login"
          );

          return;
        }

        alert(
          error instanceof Error
            ? error.message
            : translation.validation
                .submissionFailed
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black px-6 py-10">
      <motion.section
        initial={{
          opacity: 0,
          y: 35,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-500">
            <Brain
              className="text-white"
              size={32}
              aria-hidden="true"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {
                translation.interface
                  .title
              }
            </h1>

            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              {
                translation.interface
                  .subtitle
              }
            </p>
          </div>
        </header>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-gray-300">
            <span>
              {
                translation.interface
                  .question
              }{" "}
              {current + 1}{" "}
              {
                translation.interface
                  .of
              }{" "}
              {questions.length}
            </span>

            <span>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              initial={false}
              animate={{
                width: `${progress}%`,
              }}
              className="h-full rounded-full bg-cyan-400"
            />
          </div>
        </div>

        <motion.div
          key={`${current}-${language}`}
          initial={{
            opacity: 0,
            x: 40,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.25,
          }}
        >
          <h2 className="text-2xl font-semibold text-white">
            {questionText.question}
          </h2>

          <div className="mb-7 mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <div className="flex items-start gap-3">
              <Info
                size={20}
                className="mt-0.5 shrink-0 text-cyan-300"
                aria-hidden="true"
              />

              <div>
                <p className="leading-6 text-gray-200">
                  {
                    questionText.description
                  }
                </p>

                {questionText.guidance && (
                  <div className="mt-3 border-t border-cyan-300/15 pt-3">
                    <p className="text-sm leading-5 text-cyan-100">
                      <span className="font-semibold">
                        {
                          translation
                            .interface
                            .guidance
                        }
                        :{" "}
                      </span>

                      {
                        questionText.guidance
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {currentQuestion.type ===
            "text" ||
          currentQuestion.type ===
            "email" ||
          currentQuestion.type ===
            "number" ? (
            <input
              type={
                currentQuestion.type
              }
              value={
                answers[
                  currentQuestion.name
                ] || ""
              }
              onChange={(event) =>
                handleAnswer(
                  event.target.value
                )
              }
              min={
                currentQuestion.min
              }
              max={
                currentQuestion.max
              }
              step={
                currentQuestion.step
              }
              maxLength={
                currentQuestion.type ===
                "text"
                  ? 120
                  : currentQuestion.type ===
                      "email"
                    ? 254
                    : undefined
              }
              disabled={loading}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-5 text-lg text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
              placeholder={
                questionText.placeholder ||
                translation.interface
                  .requiredInformation
              }
              aria-label={
                questionText.question
              }
              autoFocus
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {currentQuestion.options?.map(
                (option) => {
                  const selected =
                    answers[
                      currentQuestion
                        .name
                    ] === option;

                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() =>
                        handleAnswer(
                          option
                        )
                      }
                      disabled={loading}
                      aria-pressed={
                        selected
                      }
                      className={`rounded-xl border p-5 text-left text-lg font-medium transition-all ${
                        selected
                          ? "scale-[1.02] border-cyan-400 bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                          : "border-white/20 bg-white/10 text-gray-200 hover:border-cyan-400/50 hover:bg-white/20"
                      }`}
                    >
                      {translation
                        .optionLabels[
                        option
                      ] || option}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </motion.div>

        <div className="mt-8 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs leading-5 text-amber-100">
          {
            translation.interface
              .disclaimer
          }
        </div>

        <footer className="mt-8 flex justify-between gap-4">
          <button
            type="button"
            onClick={
              previousQuestion
            }
            disabled={
              current === 0 ||
              loading
            }
            className="flex items-center gap-2 rounded-xl bg-gray-700 px-5 py-3 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft
              size={18}
              aria-hidden="true"
            />

            {
              translation.interface
                .previous
            }
          </button>

          {current ===
          questions.length - 1 ? (
            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? translation
                    .interface
                    .analysing
                : translation
                    .interface
                    .completeAssessment}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-white transition hover:bg-cyan-600 disabled:opacity-60"
            >
              {
                translation.interface
                  .continue
              }

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </button>
          )}
        </footer>
      </motion.section>
    </main>
  );
}