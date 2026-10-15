"use client";

import {
  motion,
} from "framer-motion";

import {
  BrainCircuit,
  Headphones,
  ShieldCheck,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";

import {
  getLandingTranslation,
} from "../../../lib/landingTranslations";

const featureDefinitions = [
  {
    id:
      "assessment",

    icon:
      BrainCircuit,
  },
  {
    id:
      "therapy",

    icon:
      Headphones,
  },
  {
    id:
      "reports",

    icon:
      ShieldCheck,
  },
] as const;

export default function Features() {
  const {
    language,
  } = useLanguage();

  const translation =
    getLandingTranslation(
      language
    );

  const content =
    translation.features;

  const features = [
    {
      id:
        "assessment",

      icon:
        BrainCircuit,

      title:
        content.assessmentTitle,

      description:
        content.assessmentDescription,
    },
    {
      id:
        "therapy",

      icon:
        Headphones,

      title:
        content.therapyTitle,

      description:
        content.therapyDescription,
    },
    {
      id:
        "reports",

      icon:
        ShieldCheck,

      title:
        content.reportsTitle,

      description:
        content.reportsDescription,
    },
  ];

  return (
    <section
      id="features"
      className="relative flex min-h-screen items-center justify-center bg-[#07121F] py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
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
          className="mb-16 text-center"
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

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
            {content.description}
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map(
            (
              feature,
              index
            ) => {
              const Icon =
                feature.icon;

              return (
                <motion.article
                  key={
                    feature.id
                  }
                  initial={{
                    opacity: 0,
                    y: 60,
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
                      0.2,

                    duration:
                      0.7,
                  }}
                  whileHover={{
                    y: -10,
                    scale: 1.03,
                  }}
                  className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                    <Icon
                      className="text-cyan-400"
                      size={34}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mb-4 text-2xl font-semibold text-white">
                    {
                      feature.title
                    }
                  </h3>

                  <p className="leading-7 text-gray-400">
                    {
                      feature.description
                    }
                  </p>
                </motion.article>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}