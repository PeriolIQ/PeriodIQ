import { useState, useEffect } from 'react';
import { Dumbbell, Activity, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AuthIllustration = () => {
  const { t } = useTranslation();

  const SLIDES = [
    {
      title: t('auth_illus.slide1_title'),
      description: t('auth_illus.slide1_desc'),
    },
    {
      title: t('auth_illus.slide2_title'),
      description: t('auth_illus.slide2_desc'),
    },
    {
      title: t('auth_illus.slide3_title'),
      description: t('auth_illus.slide3_desc'),
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-zinc-900">
      {/* Global styles for animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes run-dot {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .pulse-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: pulse-ring 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .dot-runner {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 6px;
          width: 6px;
          border-radius: 50%;
          animation: run-dot 2s linear infinite;
        }
        .connection-line {
          position: absolute;
          height: 2px;
          background-color: rgba(255, 255, 255, 0.2);
          z-index: 0;
        }
        .float-anim {
          transition: transform 0.5s ease;
        }
        .float-anim:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Background Graphic Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pulse-circle" style={{ width: '600px', height: '600px' }} />
        <div className="pulse-circle" style={{ width: '400px', height: '400px', animationDelay: '1s' }} />
      </div>

      {/* Central Visualization Container */}
      <div className="relative w-full max-w-[550px] h-[450px] flex items-center justify-center mt-[-100px]">
        
        {/* Node 1: Dumbbell (Top Left) */}
        <div className="float-anim absolute top-[50px] left-[60px] z-10">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl border-[6px] border-white/20 bg-clip-padding">
                <Dumbbell size={32} className="text-blue-600" />
            </div>
            {/* Line to center */}
            <div className="connection-line top-1/2 left-full w-[85px] rotate-[25deg] origin-left">
                <div className="dot-runner bg-blue-400 shadow-[0_0_8px_#60a5fa]" style={{ animationDelay: '0s' }} />
            </div>
        </div>

        {/* Node 2: Activity (Center Left) */}
        <div className="float-anim absolute top-[200px] left-[20px] z-10">
            <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-2xl border-[6px] border-white/20 bg-clip-padding">
                <Activity size={36} className="text-red-500" />
            </div>
            {/* Line to center */}
            <div className="connection-line top-1/2 left-full w-[95px] rotate-0 origin-left">
                <div className="dot-runner bg-red-400 shadow-[0_0_8px_#f87171]" style={{ animationDelay: '0.5s' }} />
            </div>
        </div>

        {/* Node 3: TrendingUp (Bottom Left) */}
        <div className="float-anim absolute top-[350px] left-[60px] z-10">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl border-[6px] border-white/20 bg-clip-padding">
                <TrendingUp size={32} className="text-green-500" />
            </div>
            {/* Line to center */}
            <div className="connection-line top-1/2 left-full w-[85px] -rotate-[25deg] origin-left">
                <div className="dot-runner bg-green-400 shadow-[0_0_8px_#4ade80]" style={{ animationDelay: '1s' }} />
            </div>
        </div>

        {/* Central Vertical Hub Line */}
        <div className="absolute top-[100px] left-[185px] z-0 h-[260px] w-1 bg-white/30 rounded" />

        {/* Line from Vertical Hub to Dashboard */}
        <div className="connection-line top-[230px] left-[185px] w-[120px]">
            <div className="dot-runner bg-cyan-400 shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }} />
        </div>

        {/* Center Node (Logo) */}
        <div className="float-anim absolute top-[180px] left-[135px] z-20">
            <div className="w-[100px] h-[100px] rounded-full bg-blue-600 flex items-center justify-center shadow-2xl border-[8px] border-white/30 bg-clip-padding">
                <Zap size={50} className="text-white fill-white" />
            </div>
        </div>

        {/* Dashboard Frame Illustration (Right Side) */}
        <div className="float-anim absolute right-[10px] top-[115px] z-30 w-[250px] h-[250px] rounded-full overflow-hidden border-[8px] border-white/30 shadow-2xl bg-zinc-800 bg-clip-padding flex flex-col p-4">
            {/* Fake Dashboard UI */}
            <div className="w-full flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-8 bg-blue-500/50 rounded w-full"></div>
                <div className="flex gap-2">
                    <div className="h-16 bg-white/10 rounded w-1/2"></div>
                    <div className="h-16 bg-white/10 rounded w-1/2"></div>
                </div>
            </div>
        </div>
      </div>

      {/* Custom Carousel */}
      <div className="absolute bottom-[60px] w-full px-12 text-center z-40">
        <div className="h-[90px] relative">
          {SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out ${
                currentSlide === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <h2 className="text-white text-2xl font-bold tracking-tight mb-2">
                {slide.title}
              </h2>
              <p className="text-white/80 text-base font-light px-4">
                {slide.description}
              </p>
            </div>
          ))}
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-3 mt-8">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-400 ease-out ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthIllustration;
