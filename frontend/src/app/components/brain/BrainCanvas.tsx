"use client";

import { Canvas } from "@react-three/fiber";
import BrainScene from "./BrainScene";

export default function BrainCanvas() {
  return (
    <div className="h-[500px] w-[500px]">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
      >
        <BrainScene />
      </Canvas>
    </div>
  );
}