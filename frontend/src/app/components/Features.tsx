"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  Headphones,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Diagnosis",
    description:
      "Advanced AI analyzes tinnitus symptoms and provides intelligent assessments.",
  },
  {
    icon: Headphones,
    title: "Smart Therapy",
    description:
      "Receive personalized therapy recommendations based on your condition.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Reports",
    description:
      "Your assessment reports are encrypted and securely stored.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative flex min-h-screen items-center justify-center bg-[#07121F] py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <h2 className="text-5xl font-bold text-white">
            Why Choose{" "}
            <span className="text-cyan-400">
              AI Tinnitus?
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
            Experience the future of hearing healthcare with intelligent
            diagnosis, personalized therapy, and secure medical reporting.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.7,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                }}
                className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Icon
                    className="text-cyan-400"
                    size={34}
                  />
                </div>

                <h3 className="mb-4 text-2xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="leading-7 text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}