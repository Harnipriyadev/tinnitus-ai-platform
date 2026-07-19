"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DigitalGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(({ clock }) => {
    if (!gridRef.current) return;

    // Gentle floating animation
    gridRef.current.position.y =
      -2.2 + Math.sin(clock.elapsedTime * 0.5) * 0.08;

    // Slow rotation
    gridRef.current.rotation.y =
      Math.sin(clock.elapsedTime * 0.2) * 0.15;

    // Glow pulse
    const material = gridRef.current.material as
      | THREE.Material
      | THREE.Material[];

    if (!Array.isArray(material)) {
      material.transparent = true;
      material.opacity = 0.18 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <primitive
      ref={gridRef}
      object={new THREE.GridHelper(10, 30, "#00E5FF", "#0EA5E9")}
      position={[0, -2.2, -3]}
      rotation={[0, 0, 0]}
    />
  );
}