import Hero from "@/components/home/Hero";
import SahneKaydirma from "@/components/home/SahneKaydirma";
import Features from "@/components/home/Features";
import Plans from "@/components/home/Plans";
import Faq from "@/components/home/Faq";

export default function Page() {
  return (
    <main>
      <Hero />
      <SahneKaydirma />
      <Features />
      <Plans />
      <Faq />
    </main>
  );
}
