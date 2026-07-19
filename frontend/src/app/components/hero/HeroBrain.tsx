"use client";

import BrainCanvas from "../brain/BrainCanvas";

export default function HeroBrain() {
  return (
    <div className="relative flex h-[650px] w-[650px] items-center justify-center">

      {/* Background Glow */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[140px]" />

      {/* 3D Brain */}
      <div className="relative z-10">
        <BrainCanvas />
      </div>

    </div>
  );
}