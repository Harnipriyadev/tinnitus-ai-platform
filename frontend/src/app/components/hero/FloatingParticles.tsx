"use client";

import { motion } from "framer-motion";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const particles = Array.from({ length: 35 }, (_, index) => ({
  size: seededValue(index, 1) * 6 + 2,
  left: seededValue(index, 2) * 100,
  top: seededValue(index, 3) * 100,
  opacity: 0.15 + seededValue(index, 4) * 0.35,
  duration: 4 + seededValue(index, 5) * 6,
  xMovement: seededValue(index, 6) * 20 - 10,
  yMovement: seededValue(index, 7) * 40 - 20,
}));

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-cyan-400 blur-[1px]"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            opacity: particle.opacity,
          }}
          animate={{
            x: [
              -particle.xMovement,
              particle.xMovement,
              -particle.xMovement,
            ],
            y: [
              -particle.yMovement,
              particle.yMovement,
              -particle.yMovement,
            ],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}