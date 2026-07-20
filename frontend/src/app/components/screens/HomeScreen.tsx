import Hero from "../hero/Hero";

type HomeScreenProps = {
  onNavigate: (screen: string) => void;
};

export default function HomeScreen({
  onNavigate,
}: HomeScreenProps) {
  return (
    <div className="h-full w-full">
      <Hero onNavigate={onNavigate} />
    </div>
  );
}