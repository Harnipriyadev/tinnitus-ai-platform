"use client";

import { motion } from "framer-motion";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const particles = Array.from({ length: 60 }, (_, index) => ({
  size: seededValue(index, 1) * 5 + 2,
  left: seededValue(index, 2) * 100,
  top: seededValue(index, 3) * 100,
  opacity: seededValue(index, 4) * 0.7,
  duration: 5 + seededValue(index, 5) * 8,
  delay: seededValue(index, 6) * 5,
  xMovement: 10 + seededValue(index, 7) * 20,
  yMovement: 20 + seededValue(index, 8) * 40,
}));

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-cyan-300"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [
              -particle.yMovement,
              particle.yMovement,
              -particle.yMovement,
            ],
            x: [
              -particle.xMovement,
              particle.xMovement,
              -particle.xMovement,
            ],
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.8, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}