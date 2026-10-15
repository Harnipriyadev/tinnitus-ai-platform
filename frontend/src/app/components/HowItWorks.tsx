"use client";

import {
  motion,
} from "framer-motion";

import {
  BrainCircuit,
  ClipboardList,
  FileText,
  Headphones,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";

import {
  getTechnologyTranslation,
} from "../../../lib/technologyTranslations";

export default function HowItWorks() {
  const {
    language,
  } = useLanguage();

  const content =
    getTechnologyTranslation(
      language
    );

  const steps = [
    {
      id:
        "assessment",

      icon:
        ClipboardList,

      title:
        content.steps
          .assessment.title,

      description:
        content.steps
          .assessment
          .description,
    },
    {
      id:
        "analysis",

      icon:
        BrainCircuit,

      title:
        content.steps
          .analysis.title,

      description:
        content.steps
          .analysis
          .description,
    },
    {
      id:
        "report",

      icon:
        FileText,

      title:
        content.steps
          .report.title,

      description:
        content.steps
          .report.description,
    },
    {
      id:
        "guidance",

      icon:
        Headphones,

      title:
        content.steps
          .guidance.title,

      description:
        content.steps
          .guidance
          .description,
    },
  ];

  return (
    <section
      id="technology"
      className="bg-[#07121F] py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mb-20 text-center"
        >
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            {
              content.headingPrefix
            }{" "}

            <span className="text-cyan-400">
              {
                content.headingHighlight
              }
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-400">
            {
              content.description
            }
          </p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(
            (
              step,
              index
            ) => {
              const Icon =
                step.icon;

              return (
                <motion.article
                  key={step.id}
                  initial={{
                    opacity: 0,
                    y: 50,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay:
                      index *
                      0.15,
                  }}
                  whileHover={{
                    y: -8,
                  }}
                  className="relative rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                    <Icon
                      size={34}
                      className="text-cyan-400"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mb-4 text-2xl font-semibold text-white">
                    {step.title}
                  </h3>

                  <p className="leading-7 text-gray-400">
                    {
                      step.description
                    }
                  </p>

                  {index !==
                    steps.length -
                      1 && (
                    <div
                      aria-hidden="true"
                      className="absolute right-[-28px] top-16 hidden h-[2px] w-14 bg-cyan-500/30 xl:block"
                    />
                  )}
                </motion.article>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}