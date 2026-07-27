import HeroLeft from "./HeroLeft";
import HeroCenter from "./HeroCenter";
import HeroRight from "./HeroRight";
import HeroBackground from "./HeroBackground";

type HeroProps = {
  onNavigate?: (screen: string) => void;
};

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#07121F]">
      <HeroBackground />

      {/* Central ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[160px]"
      />

      {/* Main centered layout */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1500px] items-center px-5 py-5 sm:px-8 lg:px-10">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* Left content */}
          <div className="order-1 lg:col-span-4">
            <HeroLeft onNavigate={onNavigate} />
          </div>

          {/* Brain hologram */}
          <div className="order-2 flex min-h-[450px] items-center justify-center lg:col-span-4 lg:min-h-[650px]">
            <HeroCenter />
          </div>

          {/* Login panel */}
          <div className="order-3 flex items-center justify-center lg:col-span-4 lg:justify-end">
            <HeroRight />
          </div>
        </div>
      </div>
    </section>
  );
}