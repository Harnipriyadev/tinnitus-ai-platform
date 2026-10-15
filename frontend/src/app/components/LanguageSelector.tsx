"use client";

import {
  ChevronDown,
  Globe2,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";

type SupportedLanguage =
  | "en"
  | "kn"
  | "hi";

const languageOptions: {
  value: SupportedLanguage;
  label: string;
}[] = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "kn",
    label: "ಕನ್ನಡ",
  },
  {
    value: "hi",
    label: "हिन्दी",
  },
];

const selectorLabels: Record<
  SupportedLanguage,
  string
> = {
  en: "Select language",
  kn: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
  hi: "भाषा चुनें",
};

export default function LanguageSelector() {
  const {
    language,
    setLanguage,
  } = useLanguage();

  const handleChange = (
    value: string
  ) => {
    if (
      value === "en" ||
      value === "kn" ||
      value === "hi"
    ) {
      setLanguage(value);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-[100]">
      <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
          <Globe2
            size={19}
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <label
            htmlFor="global-language-selector"
            className="sr-only"
          >
            {
              selectorLabels[
                language
              ]
            }
          </label>

          <select
            id="global-language-selector"
            value={language}
            onChange={(event) =>
              handleChange(
                event.target.value
              )
            }
            aria-label={
              selectorLabels[
                language
              ]
            }
            className="min-w-32 cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-sm font-semibold text-white outline-none transition hover:border-cyan-400/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            {languageOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                  className="bg-slate-950 text-white"
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
