import { BookingPanel } from "@/components/BookingPanel";
import { FilmStrip } from "@/components/FilmStrip";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HotTubStory } from "@/components/HotTubStory";
import { Morning } from "@/components/Morning";
import { Rules } from "@/components/Rules";
import { Stay } from "@/components/Stay";
import { Water } from "@/components/Water";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero />
        <HotTubStory />
        <FilmStrip />
        <Stay />
        <Morning />
        <Water />
        <Rules />
        <BookingPanel />
      </main>
      <Footer />
    </>
  );
}
