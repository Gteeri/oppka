
import React from 'react';
import { UserSettings, Language } from '../types';
import { ACCENT_THEMES } from '../constants';
import { Newspaper, Zap, Atom, Code, ShoppingBag, Map, RefreshCw } from 'lucide-react';
import { Logo } from './Logo';

interface WelcomeDashboardProps {
  onPrompt: (prompt: string) => void;
  settings: UserSettings;
  lang: Language;
  t: any;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ onPrompt, settings, lang, t }) => {
  const isLight = settings.theme === 'light';
  const accent = ACCENT_THEMES[settings.accent || 'default'];
  
  // Simulated News Data
  const newsItems = lang === 'ru' ? [
      { title: "GTayr Neural Engine обновлен до v2.5", tag: "AI" },
      { title: "Квантовые вычисления: новый прорыв", tag: "Tech" },
      { title: "Рынок полупроводников растет", tag: "Market" }
  ] : [
      { title: "GTayr Neural Engine updated to v2.5", tag: "AI" },
      { title: "Quantum Computing breakthrough announced", tag: "Tech" },
      { title: "Semiconductor market sees rapid growth", tag: "Market" }
  ];

  const getSuggestionIcon = (index: number) => {
      switch(index) {
          case 0: return <Zap size={20} className={isLight ? 'text-pink-500' : 'text-pink-400'} />;
          case 1: return <Code size={20} className={isLight ? 'text-blue-500' : 'text-blue-400'} />;
          case 2: return <ShoppingBag size={20} className={isLight ? 'text-green-500' : 'text-green-400'} />;
          case 3: return <Map size={20} className={isLight ? 'text-orange-500' : 'text-orange-400'} />;
          default: return <Atom size={20} className={isLight ? 'text-violet-500' : 'text-violet-400'} />;
      }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out] max-w-5xl mx-auto px-4 overflow-y-auto md:overflow-visible custom-scrollbar">
        
        {/* LOGO HEADER */}
        <div className="flex flex-col items-center mb-8 md:mb-12 mt-4 md:mt-0 flex-shrink-0">
            <div className="relative mb-6 group">
                <div className={`absolute inset-0 bg-gradient-to-r ${accent.gradient} rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000`}></div>
                <div className={`relative w-20 h-20 rounded-[1.5rem] p-4 border shadow-2xl animate-float ${isLight ? 'bg-white border-slate-100' : 'bg-[#131020] border-white/10'}`}>
                    <Logo className="w-full h-full" accent={settings.accent} />
                </div>
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-2 tracking-tight text-center ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {t.welcome} <span className={`text-sm md:text-base font-medium tracking-widest uppercase align-middle ml-2 px-3 py-1 rounded-full border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/50'}`}>Neural Interface</span>
            </h2>
            <p className={`text-sm md:text-base opacity-60 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>System Online. Neural Link Established.</p>
        </div>

        {/* CONTENT CONTAINER - FULL WIDTH ON MOBILE */}
        <div className="w-full flex flex-col gap-4 mb-6 max-w-3xl">
            
            {/* NEWS WIDGET - NOW FULL WIDTH */}
            <div className={`w-full p-5 md:p-6 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#131020] border-white/5'}`}>
                 <div className="flex items-center justify-between md:justify-start gap-4">
                     <div className="flex items-center gap-2">
                         <Newspaper size={18} className={isLight ? 'text-violet-500' : 'text-violet-400'} />
                         <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Latest Intel</span>
                     </div>
                 </div>
                 
                 <div className="flex flex-col md:flex-row gap-2 md:gap-6 flex-1 md:justify-end">
                     {newsItems.slice(0, 2).map((item, i) => (
                         <div key={i} className="flex items-center justify-between md:justify-start group cursor-pointer gap-2">
                             <span className={`text-sm truncate max-w-[200px] group-hover:underline ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.title}</span>
                             <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{item.tag}</span>
                         </div>
                     ))}
                 </div>
                 
                 <div className="hidden md:block">
                    <RefreshCw size={14} className="opacity-30" />
                 </div>
            </div>

            {/* QUICK ACTIONS - GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {t.suggestions.map((sug: any, idx: number) => (
                    <button 
                        key={idx}
                        onClick={() => onPrompt(sug.prompt)}
                        className={`relative p-4 md:p-5 border rounded-2xl transition-all text-left group overflow-hidden hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg' : 'bg-[#0d0d16] border-white/5 hover:bg-[#131020] hover:border-white/20'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-lg transition-transform duration-300 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                                {getSuggestionIcon(idx)}
                            </div>
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 transition-colors">{sug.label}</div>
                        <div className={`text-xs md:text-sm transition-colors leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-white'}`}>
                            {sug.prompt}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};
