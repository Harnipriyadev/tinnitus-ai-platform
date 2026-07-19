"use client";

import { motion } from "framer-motion";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const floatingNodes = Array.from({ length: 12 }, (_, index) => ({
  left: 20 + seededValue(index, 1) * 60,
  top: 20 + seededValue(index, 2) * 60,
  duration: 2 + index * 0.2,
  delay: seededValue(index, 3),
}));

export default function AICore() {
  return (
    <div className="relative flex h-[550px] w-[550px] items-center justify-center">
      {/* Background Glow */}
      <div className="absolute h-[340px] w-[340px] rounded-full bg-cyan-500/20 blur-[120px]" />

      {/* Outer Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
        }}
        className="absolute h-[360px] w-[360px] rounded-full border border-cyan-400/30"
      />

      {/* Middle Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "linear",
        }}
        className="absolute h-[260px] w-[260px] rounded-full border border-cyan-400/40"
      />

      {/* Inner Ring */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className="absolute h-[170px] w-[170px] rounded-full border border-cyan-300/60"
      />

      {/* AI Core */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_80px_#00E5FF]"
      >
        <div className="h-10 w-10 rounded-full bg-white" />
      </motion.div>

      {/* Floating Nodes */}
      {floatingNodes.map((node, index) => (
        <motion.div
          key={index}
          animate={{
            y: [-8, 8, -8],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: node.duration,
            delay: node.delay,
            ease: "easeInOut",
          }}
          className="absolute h-2 w-2 rounded-full bg-cyan-300"
          style={{
            left: `${node.left}%`,
            top: `${node.top}%`,
          }}
        />
      ))}
    </div>
  );
}