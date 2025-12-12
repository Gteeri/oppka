
import React, { useEffect, useRef } from 'react';
import { TELEGRAM_BOT_USERNAME } from '../constants';

interface TelegramLoginButtonProps {
  onAuth: (user: any) => void;
  lang: 'en' | 'ru';
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({ onAuth, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define the global callback
    window.onTelegramAuth = (user) => {
      onAuth(user);
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = ''; // Clean up previous renders
      
      const script = document.createElement('script');
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME); // Uses the constant
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      // Theme matching
      script.setAttribute('data-userpic', 'false'); // Minimal
      
      script.async = true;
      containerRef.current.appendChild(script);
    }

    return () => {
       // Cleanup if needed, but script tags are tricky
    };
  }, [onAuth]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div ref={containerRef} className="telegram-login-container" />
      {/* 
        Fallback/Debug Message:
        If the bot name in constants.ts doesn't match a bot created in BotFather,
        or if the domain isn't whitelisted, the widget won't appear.
      */}
      <div className="text-[10px] text-slate-500 mt-2 opacity-50">
         {TELEGRAM_BOT_USERNAME ? "" : "Bot Username not configured"}
      </div>
    </div>
  );
};
