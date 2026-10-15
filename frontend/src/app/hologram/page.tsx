"use client";

import { useRouter } from "next/navigation";

import {
  hologramTranslations,
} from "../../../lib/hologramTranslations";
import {
  useLanguage,
} from "../context/LanguageContext";

export default function HologramPage() {
  const router = useRouter();
  const { language } =
    useLanguage();

  const text =
    hologramTranslations[language];

  return (
    <main className="hologram-page">
      <div className="hologram">
        <div
          className="scan-line"
          aria-hidden="true"
        />

        <div className="hologram-content">
          <div
            className="hologram-icon"
            role="img"
            aria-label={
              text.brainIconLabel
            }
          >
            🧠
          </div>

          <h1>{text.title}</h1>

          <p>{text.description}</p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/assessment"
              )
            }
          >
            {text.startAssessment}
          </button>
        </div>
      </div>
    </main>
  );
}
