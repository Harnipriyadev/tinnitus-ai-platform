"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export default function DataStreams() {
  const group = useRef<THREE.Group>(null);

  // Generate 12 deterministic flowing data streams
  const streams = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const radius = 2 + seededValue(index, 1) * 0.8;
        const angle = (index / 12) * Math.PI * 2;

        const start = new THREE.Vector3(
          Math.cos(angle) * radius,
          -1 + seededValue(index, 2) * 2,
          Math.sin(angle) * radius
        );

        const end = new THREE.Vector3(
          Math.cos(angle + 0.4) * radius,
          -1 + seededValue(index, 3) * 2,
          Math.sin(angle + 0.4) * radius
        );

        return { start, end };
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.rotation.y = clock.elapsedTime * 0.15;
  });

  return (
    <group ref={group}>
      {streams.map((stream, index) => (
        <Line
          key={index}
          points={[stream.start, stream.end]}
          color="#00e5ff"
          lineWidth={1.2}
          transparent
          opacity={0.35}
        />
      ))}
    </group>
  );
}