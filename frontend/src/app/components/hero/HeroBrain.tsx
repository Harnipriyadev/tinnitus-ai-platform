"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import HologramHUD from "../brain/HologramHUD";

const BrainCanvas = dynamic(
  () => import("../brain/BrainCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 w-24 animate-pulse rounded-full bg-cyan-400/10 blur-xl" />
    ),
  },
);

export default function HeroBrain() {
  const [showBrain, setShowBrain] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowBrain(true);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative flex h-[450px] w-full items-center justify-center sm:h-[550px] lg:h-[650px]">
      {/* Atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[120px]"
      />

      <div className="relative z-10 flex h-full w-full max-w-[650px] items-center justify-center">
        {showBrain && (
          <>
            <BrainCanvas />
            <HologramHUD />
          </>
        )}
      </div>
    </div>
  );
}