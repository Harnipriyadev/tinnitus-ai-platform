"use client";

import {
  Bloom,
  EffectComposer,
} from "@react-three/postprocessing";

export default function BrainEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={2.5}
        luminanceThreshold={0.05}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}