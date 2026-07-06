import { Gamepad2, Flame, Dumbbell, Zap, Trophy, Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GamificationFeature() {
  const { t } = useTranslation();

  return (
    <section id="features" className="max-w-[1280px] mx-auto px-6 py-24">
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl p-8 md:p-12">
        {/* Glow effect behind */}
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left Content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold tracking-wide uppercase">
              <Gamepad2 className="w-4 h-4" />
              <span>{t('home.gamification_tag')}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {t('home.gamification_title_1')} <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                {t('home.gamification_title_2')}
              </span>
            </h2>
            
            <p className="text-lg text-slate-300 leading-relaxed max-w-[576px]">
              {t('home.gamification_desc')}
            </p>
            
            <ul className="space-y-4 pt-4">
              {[
                { icon: Trophy, text: t('home.gamification_list_1') },
                { icon: Zap, text: t('home.gamification_list_2') },
                { icon: Flame, text: t('home.gamification_list_3') }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200 font-medium">
                  <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
                    <item.icon className="w-5 h-5" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right Content - Mock UI Card */}
          <div className="flex-1 max-w-[512px]">
            <div className="relative rounded-2xl bg-[#0F1115] border border-white/10 p-6 shadow-2xl shadow-blue-900/20">
              
              {/* Profile Header */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative w-20 h-20 rounded-full border-2 border-blue-500 p-1 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20"></div>
                  <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black text-white">
                    12
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-2 border-[#0F1115]">
                    <Medal className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-1">Iron Vanguard</h4>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-400 font-medium">{t('home.level')} 12</span>
                    <span className="text-slate-400">2,450 / 3,000 XP</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[81%] shadow-[0_0_10px_rgba(56,189,248,0.5)] rounded-full relative">
                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 border border-white/5 p-4 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider">{t('home.streak')}</span>
                  </div>
                  <div className="text-3xl font-black text-white">
                    14 <span className="text-lg text-slate-400 font-medium">{t('home.days')}</span>
                  </div>
                </div>
                
                <div className="rounded-xl bg-white/5 border border-white/5 p-4 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Dumbbell className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider">{t('home.volume')}</span>
                  </div>
                  <div className="text-3xl font-black text-white">
                    12.4 <span className="text-lg text-slate-400 font-medium">{t('home.tons')}</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
