"use client";

import { motion } from "framer-motion";

const orbParticles = Array.from({ length: 25 }, (_, index) => ({
  left: `${(index * 41.7 + 13) % 100}%`,
  top: `${(index * 67.3 + 19) % 100}%`,
  duration: 2 + (index % 6) * 0.7,
  delay: (index % 8) * 0.2,
}));

export default function AIOrb() {
  return (
    <div className="relative flex h-[550px] w-[550px] items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="absolute h-[380px] w-[380px] rounded-full bg-cyan-500/20 blur-[140px]"
      />

      {/* Outer Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-[360px] w-[360px] rounded-full border border-cyan-400/30"
      />

      {/* Ring 2 */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-[280px] w-[280px] rounded-full border-2 border-dashed border-cyan-300/50"
      />

      {/* Ring 3 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-[200px] w-[200px] rounded-full border border-cyan-300/60"
      />

      {/* Scanner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-[340px] w-[340px]"
      >
        <div className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-400 to-transparent" />
      </motion.div>

      {/* Energy Core */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="relative z-20 flex h-28 w-28 items-center justify-center"
      >
        <div className="absolute h-28 w-28 rounded-full border border-cyan-300 shadow-[0_0_60px_#00E5FF]" />

        <div className="absolute h-20 w-20 rounded-full border border-cyan-300/70" />

        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="h-6 w-6 rounded-full bg-cyan-300 shadow-[0_0_30px_#00E5FF]"
        />
      </motion.div>

      {/* Orbiting Nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, index) => (
        <motion.div
          key={angle}
          animate={{ rotate: 360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
            delay: index * 0.2,
          }}
          className="absolute h-[280px] w-[280px]"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_#00E5FF]" />
        </motion.div>
      ))}

      {/* Floating Particles */}
      {orbParticles.map((particle, index) => (
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
            scale: [1, 2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Horizontal Pulse */}
      <motion.div
        animate={{
          scaleX: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute h-[2px] w-[320px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
      />

      {/* Vertical Pulse */}
      <motion.div
        animate={{
          scaleY: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute h-[320px] w-[2px] bg-gradient-to-b from-transparent via-cyan-300 to-transparent"
      />
    </div>
  );
}