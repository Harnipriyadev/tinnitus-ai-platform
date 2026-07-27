"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vLocalPosition = position;

    vec4 worldPosition =
      modelMatrix * vec4(position, 1.0);

    vWorldPosition = worldPosition.xyz;

    vWorldNormal = normalize(
      mat3(modelMatrix) * normal
    );

    vViewDirection = normalize(
      cameraPosition - worldPosition.xyz
    );

    gl_Position =
      projectionMatrix *
      viewMatrix *
      worldPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec3 teal = vec3(0.0, 0.72, 0.68);
    vec3 cyan = vec3(0.08, 0.82, 0.92);
    vec3 blue = vec3(0.20, 0.32, 0.90);
    vec3 violet = vec3(0.48, 0.24, 0.88);

    // Left and right hemisphere colouring
    float sideBlend = smoothstep(
      -0.35,
      0.35,
      vLocalPosition.x
    );

    vec3 baseColor = mix(
      teal,
      blue,
      sideBlend
    );

    baseColor = mix(
      baseColor,
      violet,
      smoothstep(0.25, 0.9, vLocalPosition.x) * 0.28
    );

    // Bright outer hologram edge
    float facing = clamp(
      dot(
        normalize(vWorldNormal),
        normalize(vViewDirection)
      ),
      0.0,
      1.0
    );

    float fresnel = pow(
      1.0 - facing,
      2.2
    );

    // Thin animated holographic texture
    float scan = sin(
      vWorldPosition.y * 90.0 -
      uTime * 2.5
    );

    scan = smoothstep(
      0.88,
      1.0,
      scan
    );

    // Organic neural lines
    float neuralWave =
      sin(vLocalPosition.x * 24.0 + uTime * 0.6) *
      sin(vLocalPosition.y * 28.0 - uTime * 0.4) *
      sin(vLocalPosition.z * 20.0);

    neuralWave = smoothstep(
      0.45,
      0.9,
      neuralWave
    );

    float pulse =
      0.94 +
      sin(uTime * 1.6) * 0.06;

    float lighting =
      0.32 +
      fresnel * 0.9 +
      scan * 0.14 +
      neuralWave * 0.2;

    vec3 finalColor =
      baseColor *
      lighting *
      pulse;

    // Controlled cyan edge glow
    finalColor +=
      cyan *
      fresnel *
      0.22;

    float alpha =
      0.62 +
      fresnel * 0.22 +
      scan * 0.04;

    gl_FragColor = vec4(
      finalColor,
      clamp(alpha, 0.58, 0.88)
    );
  }
`;

export default function BrainModel() {
  const { scene } = useGLTF(
    "/models/human_brain.glb",
  );

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0,
          },
        },
        vertexShader,
        fragmentShader,
        transparent: true,

        // Prevent internal surfaces from stacking
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,

        blending: THREE.NormalBlending,
        toneMapped: true,
      }),
    [],
  );

  const normalizedModel = useMemo(() => {
    const model = scene.clone(true);

    const box = new THREE.Box3().setFromObject(
      model,
    );

    const size = box.getSize(
      new THREE.Vector3(),
    );

    const center = box.getCenter(
      new THREE.Vector3(),
    );

    const maximumDimension = Math.max(
      size.x,
      size.y,
      size.z,
    );

    const modelScale =
      maximumDimension > 0
        ? 2.3 / maximumDimension
        : 1;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = shaderMaterial;
        child.castShadow = false;
        child.receiveShadow = false;
        child.renderOrder = 1;
      }
    });

    return {
      model,
      scale: modelScale,
      center,
    };
  }, [scene, shaderMaterial]);

  useFrame((state) => {
    shaderMaterial.uniforms.uTime.value =
      state.clock.getElapsedTime();
  });

  useEffect(() => {
    return () => {
      shaderMaterial.dispose();
    };
  }, [shaderMaterial]);

  return (
    <group scale={normalizedModel.scale}>
      <primitive
        object={normalizedModel.model}
        position={[
          -normalizedModel.center.x,
          -normalizedModel.center.y,
          -normalizedModel.center.z,
        ]}
      />
    </group>
  );
}

useGLTF.preload("/models/human_brain.glb");