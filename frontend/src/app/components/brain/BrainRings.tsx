"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function BrainRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ring1.current) {
      ring1.current.rotation.x += 0.004;
      ring1.current.rotation.y += 0.003;
    }

    if (ring2.current) {
      ring2.current.rotation.y -= 0.005;
      ring2.current.rotation.z += 0.002;
    }

    if (ring3.current) {
      ring3.current.rotation.x -= 0.003;
      ring3.current.rotation.z -= 0.004;
    }
  });

  return (
    <>
      {/* Outer Ring */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.5, 0.015, 32, 200]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Middle Ring */}
      <mesh
        ref={ring2}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[1.2, 0.012, 32, 200]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Inner Ring */}
      <mesh
        ref={ring3}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[0.9, 0.01, 32, 200]} />
        <meshBasicMaterial
          color="#67E8F9"
          transparent
          opacity={0.5}
        />
      </mesh>
    </>
  );
}