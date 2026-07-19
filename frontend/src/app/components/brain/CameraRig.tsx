"use client";

import { useFrame, useThree } from "@react-three/fiber";

export default function CameraRig() {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Smooth orbit
    camera.position.x = Math.sin(t * 0.18) * 0.4;

    // Gentle float
    camera.position.y = Math.sin(t * 0.25) * 0.2;

    // Slight zoom
    camera.position.z = 6.8 + Math.sin(t * 0.15) * 0.2;

    camera.lookAt(0, 0, 0);
  });

  return null;
}