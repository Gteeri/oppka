
import React, { useState } from 'react';
import { Language, UserSettings } from '../types';
import { UI_TEXT, ACCENT_THEMES } from '../constants';
import { Logo } from './Logo';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (key: string) => Promise<{ success: boolean, error?: string }>;
  lang: Language;
  settings: UserSettings;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onActivate, lang, settings }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = UI_TEXT[lang].upgradeModal;
  const accent = ACCENT_THEMES[settings.accent || 'default'];

  if (!isOpen) return null;

  const handleActivate = async () => {
      setLoading(true);
      setError(null);
      
      const result = await onActivate(keyInput);
      
      setLoading(false);
      if (result.success) {
          setSuccess(true);
          setTimeout(() => {
              onClose();
              setSuccess(false);
              setKeyInput('');
          }, 1500);
      } else {
          setError(result.error === 'used' ? t.used : t.invalid);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-[fadeIn_0.3s_ease-out] ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#151025] border-white/10'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none opacity-20 bg-gradient-to-r ${accent.gradient}`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none opacity-20 bg-gradient-to-r ${accent.gradient}`}></div>

            <button onClick={onClose} className={`absolute top-4 right-4 z-20 ${settings.theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="p-8 flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 mb-4 relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${accent.gradient} rounded-full blur-xl opacity-40 animate-pulse`}></div>
                    <Logo className="w-full h-full relative z-10" accent={settings.accent} />
                </div>

                <h2 className={`text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${accent.gradient}`}>
                    {t.title}
                </h2>
                <p className={`text-sm mb-8 ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{t.subtitle}</p>

                <div className="w-full space-y-4">
                    <input 
                        type="text" 
                        value={keyInput}
                        onChange={(e) => {
                            setKeyInput(e.target.value);
                            setError(null);
                        }}
                        placeholder={t.placeholder}
                        className={`w-full border rounded-xl py-3 px-4 text-center placeholder:text-slate-400 focus:outline-none transition-all ${
                            error 
                            ? 'border-red-500/50 focus:border-red-500' 
                            : success 
                                ? 'border-green-500/50 focus:border-green-500'
                                : settings.theme === 'light' 
                                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-current' 
                                    : 'bg-slate-900/50 border-white/10 text-white focus:border-white/30'
                        }`}
                        style={{ borderColor: !error && !success ? accent.colors[0] : undefined }}
                    />
                    
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    {success && <p className="text-xs text-green-400 font-bold">{t.success}</p>}

                    <button 
                        onClick={handleActivate}
                        disabled={loading || !keyInput}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all transform ${
                            success 
                            ? 'bg-green-500 text-white'
                            : `bg-gradient-to-r ${accent.gradient} text-white hover:scale-[1.02] hover:shadow-lg`
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                        ) : success ? (
                             <div className="flex items-center justify-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                 </svg>
                                 {t.success}
                             </div>
                        ) : (
                            t.activate
                        )}
                    </button>
                </div>

                <a href={t.buyLink} className={`mt-6 text-xs transition-colors border-b border-transparent ${settings.theme === 'light' ? 'text-slate-500 hover:text-pink-500' : 'text-slate-500 hover:text-white'}`}>
                    {t.buy} &rarr;
                </a>
            </div>
        </div>
    </div>
  );
};
