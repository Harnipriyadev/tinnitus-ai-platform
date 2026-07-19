"use client";

import { BrainCircuit } from "lucide-react";

type NavbarProps = {
  current: string;
  onNavigate: (screen: string) => void;
};

const menu = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "technology", label: "Technology" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function Navbar({
  current,
  onNavigate,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/10 bg-[#061325]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500">
            <BrainCircuit className="h-7 w-7 text-black" />
          </div>

          <div className="text-left">
            <h1 className="text-2xl font-bold text-white">
              AI Tinnitus
            </h1>

            <p className="text-xs text-cyan-400">
              Smart Hearing Care
            </p>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative pb-2 text-sm font-medium transition-all duration-300 ${
                current === item.id
                  ? "text-cyan-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {item.label}

              {current === item.id && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </nav>

      </div>
    </header>
  );
}