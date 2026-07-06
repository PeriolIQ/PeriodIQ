import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[#0A0A0A] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[672px] h-64 bg-blue-600/20 blur-[100px] pointer-events-none rounded-t-full"></div>

      <div className="max-w-[896px] mx-auto relative z-10">
        <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-10 md:p-16 text-center flex flex-col items-center gap-8 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            {t('home.cta_title_1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{t('home.cta_title_2')}</span>
          </h2>
          
          <p className="text-lg text-slate-300 max-w-[672px]">
              {t('home.cta_desc')}
          </p>
          
          <Link to="/dashboard" className="bg-white text-black hover:bg-slate-200 font-black text-lg uppercase px-12 py-5 rounded-xl tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105">
              {t('home.cta_btn')}
          </Link>
          
          <p className="text-sm text-slate-500 font-medium">{t('home.cta_sub')}</p>
        </div>
      </div>
    </section>
  );
}
