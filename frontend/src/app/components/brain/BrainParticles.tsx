"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export default function BrainParticles() {
  const group = useRef<THREE.Group>(null);

  // Create 80 deterministic particles around the brain
  const particles = useMemo(
    () =>
      Array.from({ length: 80 }, (_, index) => ({
        position: new THREE.Vector3(
          (seededValue(index, 1) - 0.5) * 5,
          (seededValue(index, 2) - 0.5) * 5,
          (seededValue(index, 3) - 0.5) * 5
        ),
        scale: seededValue(index, 4) * 0.05 + 0.02,
        speed: seededValue(index, 5) * 0.6 + 0.2,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.children.forEach((child, index) => {
      const particle = particles[index];

      if (!particle) return;

      child.position.y =
        particle.position.y +
        Math.sin(clock.elapsedTime * particle.speed + index) * 0.15;

      child.position.x =
        particle.position.x +
        Math.cos(clock.elapsedTime * particle.speed + index) * 0.15;

      child.rotation.y += 0.01;
    });

    group.current.rotation.y += 0.001;
  });

  return (
    <group ref={group}>
      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={particle.position}
          scale={particle.scale}
        >
          <sphereGeometry args={[1, 12, 12]} />

          <meshBasicMaterial
            color="#00e5ff"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}