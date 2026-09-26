import { FaqSection } from "@/components/home/FaqSection";
import { HomeHero } from "@/components/home/HomeHero";
import { PathwayQuiz } from "@/components/home/PathwayQuiz";
import { RelocationSection } from "@/components/home/RelocationSection";
import { ScholarshipBand } from "@/components/home/ScholarshipBand";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { VisaFeature } from "@/components/home/VisaFeature";
import { WhyCartGo } from "@/components/home/WhyCartGo";

export default function Home() {
  return (
    <>
      <HomeHero />
      <RelocationSection />
      <PathwayQuiz />
      <ServicesGrid />
      <VisaFeature />
      <ScholarshipBand />
      <WhyCartGo />
      <FaqSection />
    </>
  );
}
