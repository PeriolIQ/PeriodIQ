import TopAppBar from './components/TopAppBar';
import HeroSection from './components/HeroSection';
import GamificationFeature from './components/GamificationFeature';
import CTASection from './components/CTASection';
import BottomNavBar from './components/BottomNavBar';

export default function HomePage() {
  return (
    <div className="font-sans text-base antialiased overflow-x-hidden selection:bg-[#3378c7] selection:text-white bg-[#0A0A0A] min-h-screen text-slate-200">
      <TopAppBar />
      <main className="pt-[72px]">
        <HeroSection />
        <GamificationFeature />
        <CTASection />
      </main>
      <BottomNavBar />
    </div>
  );
}
