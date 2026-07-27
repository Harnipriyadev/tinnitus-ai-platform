"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import BrainScene from "./BrainScene";

export default function BrainCanvas() {
  return (
    <div
      className="
        relative
        h-[400px] w-[400px]
        sm:h-[460px] sm:w-[460px]
        lg:h-[520px] lg:w-[520px]
      "
      role="img"
      aria-label="Interactive AI tinnitus brain hologram"
    >
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          position: [0, 0.15, 5.5],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        onCreated={({ gl }) => {
          // Maintain a transparent WebGL background
          gl.setClearColor("#07121F", 0);
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <Suspense fallback={null}>
          <BrainScene />
        </Suspense>
      </Canvas>

      {/* Soft glow behind the hologram */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-1/2 -z-10
          h-[65%] w-[65%]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-cyan-400/10
          blur-[90px]
        "
      />
    </div>
  );
}