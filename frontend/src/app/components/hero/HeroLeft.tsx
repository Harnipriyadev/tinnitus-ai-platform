"use client";

import Link from "next/link";

import {
  Activity,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";

import {
  useLanguage,
} from "../../context/LanguageContext";

import {
  getSiteTranslation,
} from "../../../../lib/siteTranslations";

import type {
  HomeScreenName,
} from "../Navbar";

type HeroLeftProps = {
  onNavigate?: (
    screen: HomeScreenName
  ) => void;
};

export default function HeroLeft({
  onNavigate,
}: HeroLeftProps) {
  const {
    language,
  } = useLanguage();

  const translation =
    getSiteTranslation(
      language
    );

  const content =
    translation.home;

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2">
        <span className="text-sm font-medium text-cyan-300">
          {content.badge}
        </span>
      </div>

      <h1 className="mt-8 text-5xl font-extrabold leading-tight text-white sm:text-6xl">
        {
          content.headingPrimary
        }

        <br />

        <span className="text-cyan-400">
          {
            content.headingSecondary
          }
        </span>
      </h1>

      <p className="mt-6 max-w-lg text-lg leading-8 text-gray-300">
        {content.description}
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5">
        <Link
          href="/assessment"
          className="rounded-xl bg-cyan-500 px-7 py-4 text-center font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-cyan-400"
        >
          {
            content.startAssessment
          }
        </Link>

        <button
          type="button"
          onClick={() =>
            onNavigate?.(
              "features"
            )
          }
          className="rounded-xl border border-cyan-500 px-7 py-4 text-cyan-300 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-500/10"
        >
          {
            content.viewFeatures
          }
        </button>
      </div>

      <div className="mt-12 grid gap-5">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <BrainCircuit
            className="shrink-0 text-cyan-400"
            size={34}
            aria-hidden="true"
          />

          <div>
            <h3 className="font-semibold text-white">
              {
                content.assessmentTitle
              }
            </h3>

            <p className="text-sm leading-5 text-gray-400">
              {
                content.assessmentDescription
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <Activity
            className="shrink-0 text-cyan-400"
            size={34}
            aria-hidden="true"
          />

          <div>
            <h3 className="font-semibold text-white">
              {
                content.therapyTitle
              }
            </h3>

            <p className="text-sm leading-5 text-gray-400">
              {
                content.therapyDescription
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <ShieldCheck
            className="shrink-0 text-cyan-400"
            size={34}
            aria-hidden="true"
          />

          <div>
            <h3 className="font-semibold text-white">
              {
                content.securityTitle
              }
            </h3>

            <p className="text-sm leading-5 text-gray-400">
              {
                content.securityDescription
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}