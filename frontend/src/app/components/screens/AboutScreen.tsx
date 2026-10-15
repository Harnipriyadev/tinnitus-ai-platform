"use client";

import {
  Info,
  Stethoscope,
} from "lucide-react";

import {
  useLanguage,
} from "../../context/LanguageContext";

import {
  getAboutTranslation,
} from "../../../../lib/aboutTranslations";

export default function AboutScreen() {
  const {
    language,
  } = useLanguage();

  const content =
    getAboutTranslation(
      language
    );

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#07121F] px-5 py-24 sm:px-8">
      <div className="w-full max-w-4xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
          <Stethoscope
            size={32}
            className="text-cyan-400"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
          {content.title}
        </h1>

        <p className="mx-auto mt-7 max-w-3xl text-lg leading-9 text-gray-300 sm:text-xl">
          {
            content.description
          }
        </p>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-left">
          <Info
            size={21}
            className="mt-1 shrink-0 text-cyan-300"
            aria-hidden="true"
          />

          <p className="leading-7 text-gray-300">
            {
              content.clinicalNotice
            }
          </p>
        </div>
      </div>
    </section>
  );
}