"use client";

import { Brain } from "lucide-react";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const particles = Array.from({ length: 30 }, (_, index) => ({
  top: seededValue(index, 1) * 90,
  left: seededValue(index, 2) * 90,
  duration: 2 + seededValue(index, 3) * 5,
  delay: seededValue(index, 4) * 3,
}));

export default function BrainAnimation() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      {/* Outer Ring */}
      <div
        className="absolute h-[500px] w-[500px] animate-spin rounded-full border border-cyan-500/30"
        style={{ animationDuration: "25s" }}
      />

      {/* Middle Ring */}
      <div
        className="absolute h-[380px] w-[380px] animate-spin rounded-full border border-cyan-400/20"
        style={{
          animationDuration: "18s",
          animationDirection: "reverse",
        }}
      />

      {/* Inner Ring */}
      <div className="absolute h-[260px] w-[260px] animate-pulse rounded-full border border-cyan-300/30" />

      {/* Glow */}
      <div className="absolute h-64 w-64 rounded-full bg-cyan-500 opacity-30 blur-[120px]" />

      {/* Brain */}
      <Brain
        size={180}
        className="z-10 animate-pulse text-cyan-400 drop-shadow-[0_0_40px_#00e5ff]"
      />

      {/* Floating Particles */}
      {particles.map((particle, index) => (
        <div
          key={index}
          className="absolute h-2 w-2 animate-ping rounded-full bg-cyan-400"
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}