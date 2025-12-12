

import React, { useRef, useEffect, useState } from 'react';
import { User, Language, UserSettings } from '../types';
import { UI_TEXT, MAX_DAILY_IMAGES, ACCENT_THEMES } from '../constants';
import { Logo } from './Logo';

interface ProfileMenuProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onUpgrade: () => void;
  lang: Language;
  settings: UserSettings;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ 
  user, isOpen, onClose, onLogout, onOpenSettings, onUpgrade, lang, settings 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[lang].profile;
  const [timeLeft, setTimeLeft] = useState<string>("");
  const accent = ACCENT_THEMES[settings.accent || 'default'];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Timer Logic
  useEffect(() => {
      if (user.plan !== 'pro' || !user.subscriptionExpiry) {
          setTimeLeft("");
          return;
      }

      const calculateTime = () => {
          const now = Date.now();
          const diff = (user.subscriptionExpiry || 0) - now;
          if (diff <= 0) {
              setTimeLeft(lang === 'ru' ? 'Истек' : 'Expired');
              return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          setTimeLeft(`${days}d ${hours}h`);
      };

      calculateTime();
      const interval = setInterval(calculateTime, 60000); // Update every minute
      return () => clearInterval(interval);
  }, [user.plan, user.subscriptionExpiry, lang]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className={`absolute bottom-[4.5rem] left-2 right-2 z-50 border rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] origin-bottom ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1e1b2e] border-white/10'}`}
    >
      {/* Plan Header */}
      <div className={`p-4 border-b ${settings.theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
        <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{t.planFree}</span>
            {user.plan === 'pro' ? (
                <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${accent.gradient} text-[10px] font-bold text-white shadow-lg`}>
                    PLUS
                </span>
            ) : (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${settings.theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-300'}`}>
                    FREE
                </span>
            )}
        </div>

        {/* Pro Timer */}
        {user.plan === 'pro' && timeLeft && (
            <div className={`mb-3 p-2 rounded-lg border flex items-center justify-between ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t.expiresIn}</span>
                <span className={`text-sm font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r ${accent.gradient}`}>
                    {timeLeft}
                </span>
            </div>
        )}
        
        {/* Usage Stats */}
        <div className="space-y-1">
             <div className={`flex justify-between text-xs ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-300'}`}>
                 <span>{t.imagesUsed}</span>
                 <span className={user.plan === 'free' && user.usage.imageCount >= MAX_DAILY_IMAGES ? 'text-red-400' : settings.theme === 'light' ? 'text-slate-800' : 'text-white'}>
                     {user.plan === 'pro' ? t.unlimited : `${user.usage.imageCount} / ${MAX_DAILY_IMAGES}`}
                 </span>
             </div>
             {user.plan === 'free' && (
                 <div className={`w-full h-1.5 rounded-full overflow-hidden ${settings.theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}>
                     <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            user.usage.imageCount >= MAX_DAILY_IMAGES ? 'bg-red-500' : `bg-gradient-to-r ${accent.gradient}`
                        }`}
                        style={{ width: `${Math.min(100, (user.usage.imageCount / MAX_DAILY_IMAGES) * 100)}%` }}
                     ></div>
                 </div>
             )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-1 space-y-0.5">
         {user.plan === 'free' && (
             <button 
                onClick={onUpgrade}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${accent.gradient} hover:bg-black/5 transition-colors text-left`}
             >
                <span className="text-current">✨</span> {t.upgrade}
             </button>
         )}

         <button 
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${settings.theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {UI_TEXT[lang].settings}
         </button>

         <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${settings.theme === 'light' ? 'text-slate-600 hover:text-red-500 hover:bg-red-50' : 'text-slate-300 hover:text-red-400 hover:bg-white/5'}`}
         >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
             </svg>
            {UI_TEXT[lang].logout}
         </button>
      </div>
    </div>
  );
};