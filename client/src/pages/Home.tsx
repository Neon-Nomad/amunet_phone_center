import React from "react";
import Hero from "../sections/Hero";
import PlatformShowcase from "../sections/PlatformShowcase";
import OnboardingTimeline from "../sections/OnboardingTimeline";
import Pricing from "../sections/Pricing";
import Testimonials from "../sections/Testimonials";

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <PlatformShowcase />
      <OnboardingTimeline />
      <Pricing />
      <Testimonials />
    </>
  );
};

export default Home;
