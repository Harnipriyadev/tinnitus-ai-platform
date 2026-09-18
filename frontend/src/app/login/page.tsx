"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  BrainCircuit,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import LoginForm from "../components/auth/LoginForm";

/*
 * Load the WebGL brain only in the browser.
 * This keeps the login form available while
 * the heavier 3D model is loading.
 */
const HeroBrain = dynamic(
  () =>
    import(
      "../components/hero/HeroBrain"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[560px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-cyan-300">
          <LoaderCircle
            size={38}
            className="animate-spin"
          />

          <p className="text-sm uppercase tracking-[0.25em]">
            Loading neural system
          </p>
        </div>
      </div>
    ),
  }
);

const particles = Array.from(
  {
    length: 35,
  },
  (_, index) => ({
    left:
      `${(index * 29) % 100}%`,

    top:
      `${(index * 17) % 100}%`,

    delay:
      (index % 10) * 0.25,

    duration:
      3 + (index % 5),
  })
);

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030b18] px-5 py-8 text-white sm:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.14),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(135deg,#020617,#061526,#020617)]" />

      {/* Background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",

          backgroundSize:
            "55px 55px",
        }}
      />

      {/* Neural particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map(
          (
            particle,
            index
          ) => (
            <motion.span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400"
              style={{
                left:
                  particle.left,

                top:
                  particle.top,
              }}
              animate={{
                y: [
                  -12,
                  14,
                  -12,
                ],

                opacity: [
                  0.15,
                  0.8,
                  0.15,
                ],

                scale: [
                  1,
                  1.8,
                  1,
                ],
              }}
              transition={{
                duration:
                  particle.duration,

                delay:
                  particle.delay,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
              }}
            />
          )
        )}
      </div>

      {/* Moving ambient glow */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: [
            -80,
            80,
            -80,
          ],

          y: [
            -30,
            30,
            -30,
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-[35%] top-[30%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[130px]"
      />

      {/* Brand and home link */}
      <Link
        href="/"
        className="relative z-20 inline-flex items-center gap-3 text-lg font-semibold text-white transition hover:text-cyan-300"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.45)]">
          <BrainCircuit
            size={25}
          />
        </span>

        <span>
          AI Tinnitus

          <span className="block text-xs font-normal text-cyan-400">
            Smart Hearing Care
          </span>
        </span>
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-90px)] max-w-[1450px] items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] xl:gap-14">
        {/* Realistic holographic brain */}
        <motion.section
          initial={{
            opacity: 0,
            x: -50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="relative hidden min-w-0 items-center justify-center lg:flex"
        >
          {/* Glow behind brain */}
          <motion.div
            aria-hidden="true"
            animate={{
              scale: [
                1,
                1.15,
                1,
              ],

              opacity: [
                0.3,
                0.65,
                0.3,
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[130px]"
          />

          <div className="relative flex h-[650px] w-full max-w-[680px] items-center justify-center">
            <HeroBrain />

            {/* Brain information */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                AI Neural Access
              </p>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
                Secure intelligent tinnitus analysis with
                personalized hearing-care support.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Authentication form */}
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
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="flex min-w-0 flex-col items-center justify-center lg:items-end"
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