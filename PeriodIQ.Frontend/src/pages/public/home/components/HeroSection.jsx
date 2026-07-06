import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import bgImage from '@/assets/bg.png';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
      {/* Background with modern overlay */}
      <div className="absolute inset-0 z-0">
        <div className="bg-cover bg-center bg-no-repeat w-full h-full grayscale-[70%] contrast-[1.1] opacity-40" 
             style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-[#0A0A0A]/80 to-[#0A0A0A]"></div>
        
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] mix-blend-screen pointer-events-none"></div>
      </div>
      
      <div className="max-w-[1024px] mx-auto z-10 flex flex-col items-center gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-900/20 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-300 tracking-widest uppercase">{t('home.hero_tag')}</span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[1.05]">
            {t('home.hero_title_1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              {t('home.hero_title_2')}
            </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-300 max-w-[672px] mt-2 font-medium">
            {t('home.hero_desc')}
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link to="/dashboard" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg uppercase px-10 py-4 rounded-xl tracking-wide flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-1">
              {t('home.hero_start')}
              <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white font-bold text-lg uppercase px-10 py-4 rounded-xl tracking-wide flex items-center justify-center transition-all">
              {t('home.hero_learn_more')}
          </a>
        </div>

        {/* Small stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-12 mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black text-white">100+</span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-center">{t('home.stat_exercises')}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black text-white">AI</span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-center">{t('home.stat_ai')}</span>
            </div>
            <div className="flex flex-col items-center gap-1 col-span-2 md:col-span-1">
                <span className="text-3xl font-black text-white">XP</span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-center">{t('home.stat_xp')}</span>
            </div>
        </div>
      </div>
    </section>
  );
}
