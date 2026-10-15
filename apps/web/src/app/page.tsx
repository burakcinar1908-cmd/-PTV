import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ChannelCards from "@/components/home/ChannelCards";
import Plans from "@/components/home/Plans";
import Faq from "@/components/home/Faq";
import Footer from "@/components/home/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <Features />
      <ChannelCards />
      <Plans />
      <Faq />
      <Footer />
    </main>
  );
}
