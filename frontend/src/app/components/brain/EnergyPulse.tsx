"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function EnergyPulse() {
  const pulse1 = useRef<THREE.Mesh>(null);
  const pulse2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (pulse1.current) {
      const scale = (t % 3) + 1;

      pulse1.current.scale.set(scale, scale, scale);

      (
        pulse1.current.material as THREE.MeshBasicMaterial
      ).opacity = Math.max(0, 0.45 - scale * 0.12);
    }

    if (pulse2.current) {
      const scale = ((t + 1.5) % 3) + 1;

      pulse2.current.scale.set(scale, scale, scale);

      (
        pulse2.current.material as THREE.MeshBasicMaterial
      ).opacity = Math.max(0, 0.35 - scale * 0.10);
    }
  });

  return (
    <>
      <mesh
        ref={pulse1}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.0, 1.03, 128]} />

        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={pulse2}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.0, 1.03, 128]} />

        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.30}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}