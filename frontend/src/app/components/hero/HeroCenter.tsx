"use client";

import HeroBrain from "./HeroBrain";

export default function HeroCenter() {
  return (
    <div className="relative flex h-full min-h-[450px] w-full items-center justify-center lg:min-h-[650px]">
      <HeroBrain />
    </div>
  );
}