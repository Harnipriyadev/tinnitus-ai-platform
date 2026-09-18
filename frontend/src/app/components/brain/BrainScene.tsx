"use client";

import {
  Float,
  Sparkles,
} from "@react-three/drei";

import {
  useFrame,
} from "@react-three/fiber";

import {
  useRef,
} from "react";

import type {
  Group,
  Mesh,
} from "three";

import BrainModel from "./BrainModel";

const FRONT_ROTATION_Y =
  Math.PI;

export default function BrainScene() {
  const brainRef =
    useRef<Group>(null);

  const ringOneRef =
    useRef<Mesh>(null);

  const ringTwoRef =
    useRef<Mesh>(null);

  useFrame(
    (
      state,
      delta
    ) => {
      const elapsed =
        state.clock.getElapsedTime();

      if (brainRef.current) {
        /*
         * Keep the front of the anatomical model
         * facing the camera while allowing subtle
         * automatic and mouse-controlled movement.
         */
        const automaticMovement =
          Math.sin(
            elapsed * 0.35
          ) * 0.08;

        const targetRotationY =
          FRONT_ROTATION_Y +
          automaticMovement +
          state.pointer.x *
            0.1;

        brainRef.current.rotation.y +=
          (
            targetRotationY -
            brainRef.current
              .rotation.y
          ) * 0.04;

        const targetRotationX =
          state.pointer.y *
          0.065;

        brainRef.current.rotation.x +=
          (
            targetRotationX -
            brainRef.current
              .rotation.x
          ) * 0.04;

        const targetRotationZ =
          -state.pointer.x *
          0.025;

        brainRef.current.rotation.z +=
          (
            targetRotationZ -
            brainRef.current
              .rotation.z
          ) * 0.04;
      }

      /*
       * Rotate the cyan diagnostic ring.
       */
      if (ringOneRef.current) {
        ringOneRef.current.rotation.z +=
          delta * 0.12;

        ringOneRef.current.rotation.y +=
          delta * 0.05;
      }

      /*
       * Rotate the violet diagnostic ring.
       */
      if (ringTwoRef.current) {
        ringTwoRef.current.rotation.z -=
          delta * 0.08;

        ringTwoRef.current.rotation.x +=
          delta * 0.04;
      }
    }
  );

  return (
    <>
      {/* Holographic lighting */}
      <ambientLight
        intensity={0.3}
      />

      <pointLight
        position={[
          -3,
          2,
          3,
        ]}
        color="#22d3ee"
        intensity={9}
        distance={8}
      />

      <pointLight
        position={[
          3,
          2,
          3,
        ]}
        color="#a855f7"
        intensity={8}
        distance={8}
      />

      <pointLight
        position={[
          0,
          -2,
          2,
        ]}
        color="#06b6d4"
        intensity={5}
        distance={6}
      />

      {/* Anatomical holographic brain */}
      <Float
        speed={1.4}
        rotationIntensity={0}
        floatIntensity={0.12}
        floatingRange={[
          -0.04,
          0.04,
        ]}
      >
        <group
          ref={brainRef}
          position={[
            0,
            0.1,
            0,
          ]}
          rotation={[
            0,
            FRONT_ROTATION_Y,
            0,
          ]}
        >
          <BrainModel />
        </group>
      </Float>

      {/* Cyan diagnostic orbit */}
      <mesh
        ref={ringOneRef}
        position={[
          0,
          0.1,
          0,
        ]}
        rotation={[
          Math.PI / 2.45,
          0,
          0,
        ]}
      >
        <torusGeometry
          args={[
            1.55,
            0.01,
            12,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      {/* Violet diagnostic orbit */}
      <mesh
        ref={ringTwoRef}
        position={[
          0,
          0.1,
          0,
        ]}
        rotation={[
          Math.PI / 2,
          0.45,
          0,
        ]}
      >
        <torusGeometry
          args={[
            1.78,
            0.008,
            12,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>

      {/* Cyan neural particles */}
      <Sparkles
        count={55}
        scale={[
          4,
          3.6,
          2.5,
        ]}
        position={[
          0,
          0.1,
          0,
        ]}
        size={1.8}
        speed={0.22}
        color="#67e8f9"
        opacity={0.58}
      />

      {/* Violet neural particles */}
      <Sparkles
        count={22}
        scale={[
          3.2,
          3,
          2,
        ]}
        position={[
          0,
          0.1,
          0,
        ]}
        size={2.2}
        speed={0.16}
        color="#c084fc"
        opacity={0.48}
      />
    </>
  );
}