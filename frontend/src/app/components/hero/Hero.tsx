import HeroLeft from "./HeroLeft";
import HeroCenter from "./HeroCenter";
import HeroRight from "./HeroRight";
import HeroBackground from "./HeroBackground";

type HeroProps = {
  onNavigate?: (screen: string) => void;
};

export default function Hero({
  onNavigate,
}: HeroProps) {
  return (
    <section className="relative h-screen overflow-hidden bg-[#07121F]">

      <HeroBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-8">

        <div className="grid min-h-[85vh] grid-cols-12 items-center gap-10">

          {/* Left */}
          <div className="col-span-5">
            <HeroLeft />
          </div>

          {/* Center */}
          <div className="col-span-3 flex items-center justify-center">
            <HeroCenter />
          </div>

          {/* Right */}
          <div className="col-span-4 flex items-center justify-end">
            <HeroRight />
          </div>

        </div>

      </div>

    </section>
  );
}