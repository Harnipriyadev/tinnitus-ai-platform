"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  BrainCircuit,
  FileText,
  Headphones,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Assessment",
    description: "Answer a few simple questions about your hearing condition.",
  },
  {
    icon: BrainCircuit,
    title: "AI Analysis",
    description: "Our AI analyzes your symptoms using intelligent algorithms.",
  },
  {
    icon: FileText,
    title: "Diagnosis",
    description: "Receive a detailed assessment report with confidence scores.",
  },
  {
    icon: Headphones,
    title: "Therapy Plan",
    description: "Get personalized therapy recommendations and next steps.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="technology"
      className="bg-[#07121F] py-28"
    >
      <div className="mx-auto max-w-7xl px-8">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-5xl font-bold text-white">
            How It{" "}
            <span className="text-cyan-400">Works</span>
          </h2>

          <p className="mt-5 text-lg text-gray-400">
            Four simple steps to receive your personalized AI tinnitus assessment.
          </p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-4">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.15,
                }}
                whileHover={{
                  y: -8,
                }}
                className="relative rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Icon
                    size={34}
                    className="text-cyan-400"
                  />
                </div>

                <h3 className="mb-4 text-2xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="text-gray-400">
                  {step.description}
                </p>

                {index !== steps.length - 1 && (
                  <div className="absolute right-[-28px] top-16 hidden h-[2px] w-14 bg-cyan-500/30 md:block" />
                )}
              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}