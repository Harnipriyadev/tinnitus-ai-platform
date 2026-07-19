"use client";

import { BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

const particles = [
  { left: 15, top: 20 },
  { left: 25, top: 75 },
  { left: 40, top: 15 },
  { left: 55, top: 82 },
  { left: 72, top: 28 },
  { left: 82, top: 60 },
  { left: 60, top: 45 },
  { left: 30, top: 50 },
];

export default function HeroIllustration() {
  return (
    <div className="relative flex h-[420px] w-[420px] items-center justify-center">

      {/* Main Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
        className="absolute h-[260px] w-[260px] rounded-full bg-cyan-500/20 blur-[100px]"
      />

      {/* Outer Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "linear",
        }}
        className="absolute h-[360px] w-[360px] rounded-full border border-cyan-400/20"
      />

      {/* Middle Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "linear",
        }}
        className="absolute h-[280px] w-[280px] rounded-full border border-cyan-400/30"
      />

      {/* Inner Ring */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className="absolute h-[200px] w-[200px] rounded-full border border-cyan-400/40"
      />

      {/* Floating Particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-400"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: 6,
            height: 6,
          }}
          animate={{
            y: [-12, 12, -12],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.5, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i * 0.3,
          }}
        />
      ))}

      {/* Orbiting Dot */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "linear",
        }}
        className="absolute h-[320px] w-[320px]"
      >
        <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_#00E5FF]" />
      </motion.div>

      {/* Second Orbit */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "linear",
        }}
        className="absolute h-[250px] w-[250px]"
      >
        <div className="absolute left-1/2 bottom-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_15px_#00E5FF]" />
      </motion.div>

      {/* Brain */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 3, 0, -3, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
        }}
        className="relative z-10"
      >
        <BrainCircuit
          size={150}
          className="text-cyan-400 drop-shadow-[0_0_60px_#00E5FF]"
        />
      </motion.div>

    </div>
  );
}