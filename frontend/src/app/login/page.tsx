"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";

import LoginForm from "../components/auth/LoginForm";

const particles = Array.from(
  { length: 35 },
  (_, index) => ({
    left: `${(index * 29) % 100}%`,
    top: `${(index * 17) % 100}%`,
    delay: (index % 10) * 0.25,
    duration: 3 + (index % 5),
  })
);

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030b18] px-6 py-10 text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.14),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(135deg,#020617,#061526,#020617)]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [-12, 14, -12],
              opacity: [0.15, 0.8, 0.15],
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

      {/* Moving glow */}
      <motion.div
        animate={{
          x: [-80, 80, -80],
          y: [-30, 30, -30],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-[35%] top-[30%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[130px]"
      />

      {/* Home link */}
      <Link
        href="/"
        className="relative z-20 inline-flex items-center gap-3 text-lg font-semibold text-white transition hover:text-cyan-300"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.45)]">
          <BrainCircuit size={25} />
        </span>

        <span>
          AI Tinnitus

          <span className="block text-xs font-normal text-cyan-400">
            Smart Hearing Care
          </span>
        </span>
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Left animation */}
        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden items-center justify-center lg:flex"
        >
          <div className="relative flex h-[520px] w-[520px] items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.7, 0.35],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-80 w-80 rounded-full bg-cyan-500/20 blur-[110px]"
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[360px] w-[360px] rounded-full border border-cyan-400/20"
            >
              <span className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee]" />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[280px] w-[280px] rounded-full border border-dashed border-cyan-400/30"
            />

            <motion.div
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-[200px] w-[200px] rounded-full border border-cyan-300/40"
            />

            <motion.div
              animate={{
                y: [-10, 10, -10],
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex h-36 w-36 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 shadow-[0_0_80px_rgba(34,211,238,0.55)] backdrop-blur-xl"
            >
              <BrainCircuit
                size={78}
                className="text-cyan-300 drop-shadow-[0_0_18px_#22d3ee]"
              />

              <motion.div
                animate={{
                  scale: [1, 1.7, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full border border-cyan-300/40"
              />
            </motion.div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute h-[330px] w-[330px]"
            >
              <div className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-cyan-400/50 to-transparent" />
            </motion.div>

            <div className="absolute bottom-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                AI Neural Access
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">
                Intelligent tinnitus analysis with secure
                personalized healthcare access.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Working shared login form */}
        <motion.section
          initial={{
            opacity: 0,
            x: 50,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center lg:items-end"
        >
          <LoginForm />

          <div className="mt-5 flex w-full max-w-md items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck
              size={15}
              className="text-cyan-400"
            />

            Protected with secure encrypted access
          </div>
        </motion.section>
      </div>
    </main>
  );
}