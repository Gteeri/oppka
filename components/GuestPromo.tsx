
import React from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';
import { Logo } from './Logo';

interface GuestPromoProps {
  onLogin: () => void;
  onDismiss: () => void;
  lang: Language;
}

export const GuestPromo: React.FC<GuestPromoProps> = ({ onLogin, onDismiss, lang }) => {
  const t = UI_TEXT[lang].guestPromo;
  
  return (
    <div className="w-full max-w-2xl mx-auto my-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600">
            <div className="relative bg-[#151025] rounded-2xl p-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/10 blur-[50px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <Logo className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                {t.title} 
                                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">GUEST</span>
                            </h4>
                            <p className="text-sm text-slate-400 max-w-sm">{t.desc}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button 
                            onClick={onDismiss}
                            className="flex-1 md:flex-none py-2 px-4 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            {UI_TEXT[lang].close}
                        </button>
                        <button 
                            onClick={onLogin}
                            className="flex-1 md:flex-none py-2 px-6 rounded-lg bg-[#24292F] hover:bg-[#2b3137] text-white text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            {t.btn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
