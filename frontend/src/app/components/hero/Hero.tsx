import HeroLeft from "./HeroLeft";
import HeroCenter from "./HeroCenter";
import HeroRight from "./HeroRight";
import HeroBackground from "./HeroBackground";

type HeroProps = {
  onNavigate?: (
    screen: string
  ) => void;
};

export default function Hero({
  onNavigate,
}: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-x-hidden bg-[#07121F]">
      <HeroBackground />

      {/* Central ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[170px]"
      />

      {/* Main layout */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1750px] items-center px-5 py-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-14">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-5 xl:grid-cols-[300px_minmax(400px,1fr)_340px] xl:gap-6 2xl:grid-cols-[350px_minmax(580px,1fr)_380px] 2xl:gap-10">
          {/* Left content */}
          <div className="order-1 lg:col-span-3 xl:col-auto xl:-translate-x-1 2xl:-translate-x-2">
            <HeroLeft
              onNavigate={
                onNavigate
              }
            />
          </div>

          {/* Brain hologram */}
          <div className="order-2 flex min-h-[450px] min-w-0 items-center justify-center lg:col-span-5 lg:min-h-[650px] xl:col-auto">
            <div className="w-full max-w-[720px]">
              <HeroCenter />
            </div>
          </div>

          {/* Login panel */}
          <div className="order-3 flex min-w-0 items-center justify-center lg:col-span-4 lg:justify-end xl:col-auto xl:translate-x-1 2xl:translate-x-2">
            <HeroRight />
          </div>
        </div>
      </div>
    </section>
  );
}