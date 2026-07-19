"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function BrainGlow() {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      // Slow rotation
      glowRef.current.rotation.z += 0.002;

      // Energy pulse
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={glowRef}>
      <sphereGeometry args={[1.2, 64, 64]} />

      <meshBasicMaterial
        color="#00E5FF"
        transparent
        opacity={0.18}
        side={THREE.BackSide}
      />
    </mesh>
  );
}