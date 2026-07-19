"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export default function NeuralNodes() {
  const group = useRef<THREE.Group>(null);

  const nodes = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        x: (seededValue(index, 1) - 0.5) * 4,
        y: (seededValue(index, 2) - 0.5) * 4,
        z: (seededValue(index, 3) - 0.5) * 4,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.children.forEach((child, index) => {
      const node = nodes[index];

      if (!node) return;

      child.position.set(
        node.x,
        node.y + Math.sin(clock.elapsedTime * 2 + index) * 0.08,
        node.z
      );
    });
  });

  return (
    <group ref={group}>
      {nodes.map((node, index) => (
        <mesh key={index} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[0.03, 12, 12]} />

          <meshBasicMaterial
            color="#00e5ff"
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}