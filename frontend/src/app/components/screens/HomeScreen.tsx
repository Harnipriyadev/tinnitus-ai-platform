import Hero from "../hero/Hero";

import type {
  HomeScreenName,
} from "../Navbar";

type HomeScreenProps = {
  onNavigate: (
    screen: HomeScreenName
  ) => void;
};

export default function HomeScreen({
  onNavigate,
}: HomeScreenProps) {
  return (
    <main className="w-full">
      <Hero
        onNavigate={
          onNavigate
        }
      />
    </main>
  );
}