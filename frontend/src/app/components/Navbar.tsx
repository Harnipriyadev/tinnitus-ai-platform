"use client";

import {
  BrainCircuit,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";

import {
  getSiteTranslation,
} from "../../../lib/siteTranslations";

export type HomeScreenName =
  | "home"
  | "features"
  | "technology"
  | "about"
  | "contact";

type NavbarProps = {
  current: HomeScreenName;

  onNavigate: (
    screen: HomeScreenName
  ) => void;
};

export default function Navbar({
  current,
  onNavigate,
}: NavbarProps) {
  const {
    language,
  } = useLanguage();

  const translation =
    getSiteTranslation(
      language
    );

  const menu: {
    id: HomeScreenName;
    label: string;
  }[] = [
    {
      id: "home",
      label:
        translation.navigation
          .home,
    },
    {
      id: "features",
      label:
        translation.navigation
          .features,
    },
    {
      id: "technology",
      label:
        translation.navigation
          .technology,
    },
    {
      id: "about",
      label:
        translation.navigation
          .about,
    },
    {
      id: "contact",
      label:
        translation.navigation
          .contact,
    },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-cyan-500/10 bg-[#061325]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
        <button
          type="button"
          onClick={() =>
            onNavigate(
              "home"
            )
          }
          className="flex items-center gap-3"
          aria-label={
            translation.navigation
              .home
          }
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500">
            <BrainCircuit
              className="h-7 w-7 text-black"
              aria-hidden="true"
            />
          </div>

          <div className="text-left">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {
                translation.brand
                  .title
              }
            </h1>

            <p className="text-xs text-cyan-400">
              {
                translation.brand
                  .subtitle
              }
            </p>
          </div>
        </button>

        <nav
          className="hidden items-center gap-5 md:flex lg:gap-8"
          aria-label="Main navigation"
        >
          {menu.map(
            (item) => (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  onNavigate(
                    item.id
                  )
                }
                className={`relative pb-2 text-sm font-medium transition-all duration-300 ${
                  current ===
                  item.id
                    ? "text-cyan-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {item.label}

                {current ===
                  item.id && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-cyan-400" />
                )}
              </button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}