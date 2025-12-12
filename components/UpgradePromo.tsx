import React, { useState } from 'react';
import { Language, UserSettings } from '../types';
import { UI_TEXT } from '../constants';
import { Logo } from './Logo';

interface UpgradePromoProps {
  onUpgrade: () => void;
  onDismiss: () => void;
  lang: Language;
  settings?: UserSettings;
}

export const UpgradePromo: React.FC<UpgradePromoProps> = ({ onUpgrade, onDismiss, lang, settings }) => {
  const t = UI_TEXT[lang].promo;
  
  return (
    <div className="w-full max-w-2xl mx-auto my-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600">
            <div className="relative bg-[#151025] rounded-2xl p-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/10 blur-[50px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/10 blur-[50px] rounded-full"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <Logo className="w-8 h-8" accent={settings?.accent} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                {t.limitTitle} 
                                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/20">LIMIT</span>
                            </h4>
                            <p className="text-sm text-slate-400 mb-1">{t.limitDesc}</p>
                            <p className="text-xs text-slate-500">{t.upgradeDesc}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button 
                            onClick={onDismiss}
                            className="flex-1 md:flex-none py-2 px-4 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            {t.later}
                        </button>
                        <button 
                            onClick={onUpgrade}
                            className="flex-1 md:flex-none py-2 px-6 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:shadow-[0_0_20px_rgba(219,39,119,0.4)] text-white text-xs font-bold transition-all transform hover:scale-105"
                        >
                            {t.upgradeBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};