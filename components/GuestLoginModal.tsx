
import React from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';
import { Logo } from './Logo';

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  lang: Language;
}

export const GuestLoginModal: React.FC<GuestLoginModalProps> = ({ isOpen, onClose, onLogin, lang }) => {
  const t = UI_TEXT[lang].guestLogin;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#151025] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-[fadeIn_0.3s_ease-out]">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none"></div>

            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="p-8 flex flex-col items-center text-center relative z-10">
                <div className="mb-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Logo className="w-12 h-12" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-pink-200">
                    {t.title}
                </h2>
                <p className="text-slate-400 text-sm mb-6">{t.subtitle}</p>

                <div className="w-full space-y-3 mb-8 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-green-400">✓</span> {t.benefit1}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-green-400">✓</span> {t.benefit2}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-green-400">✓</span> {t.benefit3}
                    </div>
                </div>

                <button 
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#24292F] text-white font-semibold hover:bg-[#2b3137] transition-all shadow-lg border border-white/10"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    {t.connectBtn}
                </button>
                
                <button 
                    onClick={onClose}
                    className="mt-4 text-xs text-slate-500 hover:text-white transition-colors"
                >
                    {t.cancel}
                </button>
            </div>
        </div>
    </div>
  );
};
