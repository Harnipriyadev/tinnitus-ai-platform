"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function BrainAura() {
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!auraRef.current) return;

    const t = clock.elapsedTime;

    // Gentle breathing animation
    const scale = 1.15 + Math.sin(t * 2) * 0.06;

    auraRef.current.scale.set(scale, scale, scale);

    // Slow rotation
    auraRef.current.rotation.y += 0.0015;

    // Pulse opacity
    (
      auraRef.current.material as THREE.MeshBasicMaterial
    ).opacity = 0.12 + Math.sin(t * 3) * 0.04;
  });

  return (
    <mesh ref={auraRef}>
      <sphereGeometry args={[1.45, 64, 64]} />

      <meshBasicMaterial
        color="#00E5FF"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
      />
    </mesh>
  );
}