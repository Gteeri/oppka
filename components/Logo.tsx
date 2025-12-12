
import React from 'react';
import { AccentType } from '../types';
import { ACCENT_THEMES } from '../constants';

interface LogoProps {
  className?: string;
  accent?: AccentType;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", accent = 'default' }) => {
  const theme = ACCENT_THEMES[accent] || ACCENT_THEMES.default;
  const [startColor, endColor] = theme.colors;
  const gradientId = `gtayrGradient-${accent}`;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* Crescent Moon Logo - GTayr Style */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={startColor} /> 
                    <stop offset="100%" stopColor={endColor} /> 
                </linearGradient>
            </defs>
            {/* The Crescent Shape */}
            <path 
                d="M 75 50 C 75 77.614 52.614 100 25 100 C 13.5 100 3 96 0 90 C 15 90 35 78 35 50 C 35 22 15 10 0 10 C 3 4 13.5 0 25 0 C 52.614 0 75 22.386 75 50 Z" 
                fill={`url(#${gradientId})`}
            />
            {/* Optional subtle highlight for 3D feel */}
            <path 
                d="M 75 50 C 75 77.614 52.614 100 25 100 C 13.5 100 3 96 0 90 C 15 90 35 78 35 50 C 35 22 15 10 0 10 C 3 4 13.5 0 25 0 C 52.614 0 75 22.386 75 50 Z" 
                fill={`url(#${gradientId})`}
                className="opacity-90 mix-blend-screen"
            />
        </svg>
    </div>
  );
};