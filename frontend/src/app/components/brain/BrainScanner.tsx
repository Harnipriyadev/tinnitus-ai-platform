"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function BrainScanner() {
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current) return;

    // Move scan beam up and down
    scanRef.current.position.y =
      Math.sin(clock.elapsedTime * 1.5) * 1.2;

    // Slight glow pulse
    const opacity = 0.25 + Math.sin(clock.elapsedTime * 4) * 0.08;

    (
      scanRef.current.material as THREE.MeshBasicMaterial
    ).opacity = opacity;
  });

  return (
    <mesh ref={scanRef}>
      <cylinderGeometry args={[1.35, 1.35, 0.08, 64, 1, true]} />

      <meshBasicMaterial
        color="#00E5FF"
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}