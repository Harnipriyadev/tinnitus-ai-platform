"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function BrainModel() {
  const { scene } = useGLTF("/models/human_brain.glb");

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    console.log("Size:", size);
    console.log("Center:", center);

    // Center the model
    scene.position.sub(center);

    // Scale the model to fit nicely
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    scene.scale.setScalar(scale);
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload("/models/human_brain.glb");