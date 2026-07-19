"use client";

import { motion } from "framer-motion";

const nodes = [
  { x: 10, y: 30 },
  { x: 30, y: 15 },
  { x: 50, y: 35 },
  { x: 70, y: 20 },
  { x: 90, y: 40 },
  { x: 25, y: 60 },
  { x: 45, y: 75 },
  { x: 65, y: 60 },
  { x: 85, y: 80 },
];

const lines = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [2, 6],
  [3, 7],
];

export default function NeuralLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">

      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >

        {lines.map(([a, b], index) => (
          <motion.line
            key={index}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#22D3EE"
            strokeWidth="0.3"
            strokeOpacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              repeat: Infinity,
              duration: 3,
              delay: index * 0.2,
            }}
          />
        ))}

        {nodes.map((node, index) => (
          <motion.circle
            key={index}
            cx={node.x}
            cy={node.y}
            r="0.8"
            fill="#67E8F9"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: index * 0.15,
            }}
          />
        ))}
      </svg>

    </div>
  );
}