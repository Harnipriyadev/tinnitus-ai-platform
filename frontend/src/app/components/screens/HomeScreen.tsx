import Hero from "../hero/Hero";

type HomeScreenProps = {
  onNavigate: (screen: string) => void;
};

export default function HomeScreen({
  onNavigate,
}: HomeScreenProps) {
  return (
    <main className="w-full">
      <Hero onNavigate={onNavigate} />
    </main>
  );
}