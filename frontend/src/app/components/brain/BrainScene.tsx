"use client";

export default function BrainScene() {
  return (
    <>
      <ambientLight intensity={2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={3}
      />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00E5FF" />
      </mesh>
    </>
  );
}