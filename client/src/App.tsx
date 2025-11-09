import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import PlatformShowcase from './sections/PlatformShowcase';
import Pricing from './sections/Pricing';
import OnboardingTimeline from './sections/OnboardingTimeline';
import Testimonials from './sections/Testimonials';
import ChatWidget from './components/ChatWidget/ChatWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      <main>
        <Hero />
        <PlatformShowcase />
        <OnboardingTimeline />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
