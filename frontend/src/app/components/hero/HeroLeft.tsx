"use client";

import Link from "next/link";
import { BrainCircuit, ShieldCheck, Activity } from "lucide-react";

type HeroLeftProps = {
  onNavigate?: (screen: string) => void;
};

export default function HeroLeft({
  onNavigate,
}: HeroLeftProps) {
  return (
    <div className="flex flex-col justify-center h-full">

      {/* Badge */}
      <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2">
        <span className="text-sm font-medium text-cyan-300">
          AI Powered Healthcare
        </span>
      </div>

      {/* Heading */}
      <h1 className="mt-8 text-6xl font-extrabold leading-tight text-white">
        AI
        <br />
        <span className="text-cyan-400">
          TINNITUS
        </span>
      </h1>

      {/* Description */}
      <p className="mt-6 max-w-lg text-lg leading-8 text-gray-300">
        Experience the future of hearing healthcare with intelligent
        tinnitus assessment, AI-powered diagnosis, and personalized
        therapy recommendations.
      </p>

      {/* Buttons */}
      <div className="mt-10 flex gap-5">

        <Link
          href="/assessment"
          className="rounded-xl bg-cyan-500 px-7 py-4 font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-cyan-400"
        >
          Start Assessment
        </Link>

        <button
          onClick={() => onNavigate?.("features")}
          className="rounded-xl border border-cyan-500 px-7 py-4 text-cyan-300 transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-400"
        >
          View Features
        </button>

      </div>

      {/* Features */}
      <div className="mt-12 grid gap-5">

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <BrainCircuit
            className="text-cyan-400"
            size={34}
          />

          <div>
            <h3 className="font-semibold text-white">
              AI Diagnosis
            </h3>

            <p className="text-sm text-gray-400">
              Smart tinnitus prediction using AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <Activity
            className="text-cyan-400"
            size={34}
          />

          <div>
            <h3 className="font-semibold text-white">
              Personalized Therapy
            </h3>

            <p className="text-sm text-gray-400">
              Tailored recommendations for each patient.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <ShieldCheck
            className="text-cyan-400"
            size={34}
          />

          <div>
            <h3 className="font-semibold text-white">
              Secure Reports
            </h3>

            <p className="text-sm text-gray-400">
              Your assessment data is encrypted and safe.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}