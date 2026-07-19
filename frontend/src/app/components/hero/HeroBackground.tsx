"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 40 }, (_, index) => ({
  left: `${(index * 37.7 + 11) % 100}%`,
  top: `${(index * 61.3 + 7) % 100}%`,
  duration: 3 + (index % 6) * 0.8,
  delay: (index % 10) * 0.2,
}));

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#081420] to-slate-950" />

      {/* Glow 1 */}
      <motion.div
        animate={{
          x: [-100, 120, -100],
          y: [-50, 80, -50],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[140px]"
      />

      {/* Glow 2 */}
      <motion.div
        animate={{
          x: [80, -100, 80],
          y: [50, -80, 50],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[150px]"
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [-15, 15, -15],
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.8, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Horizontal Light */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear",
        }}
        className="absolute top-1/2 h-px w-96 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40"
      />
    </div>
  );
}