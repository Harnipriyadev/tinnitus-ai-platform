"use client";

import {
  Mail,
} from "lucide-react";

import {
  useLanguage,
} from "../../context/LanguageContext";

import {
  getContactTranslation,
} from "../../../../lib/contactTranslations";

const SUPPORT_EMAIL =
  "support@aitinnitus.com";

export default function ContactScreen() {
  const {
    language,
  } = useLanguage();

  const content =
    getContactTranslation(
      language
    );

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#07121F] px-5 py-24 sm:px-8">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
          <Mail
            size={32}
            className="text-cyan-400"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
          {content.title}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400 sm:text-xl">
          {
            content.description
          }
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-cyan-500/20 bg-white/5 p-7 backdrop-blur-xl">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
            {
              content.emailLabel
            }
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 block break-all text-xl font-semibold text-cyan-300 transition hover:text-cyan-200 sm:text-2xl"
          >
            {SUPPORT_EMAIL}
          </a>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:bg-cyan-400"
          >
            <Mail
              size={18}
              aria-hidden="true"
            />

            {
              content.sendEmail
            }
          </a>
        </div>
      </div>
    </section>
  );
}