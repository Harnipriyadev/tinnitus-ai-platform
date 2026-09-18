"use client";

import { useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "kn", name: "ಕನ್ನಡ" },
];

export default function LanguageSelector() {
  const [language, setLanguage] = useState("en");

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedLanguage = event.target.value;

    setLanguage(selectedLanguage);

    localStorage.setItem("preferredLanguage", selectedLanguage);

    window.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: selectedLanguage,
      })
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">🌐</span>

      <select
        value={language}
        onChange={handleLanguageChange}
        className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}