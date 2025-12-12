import React from 'react';
import { AIModel, UserSettings, Language, Plan } from '../types';
import { UI_TEXT, ACCENT_THEMES } from '../constants';
import { Atom, Brain, Lock, Check } from 'lucide-react';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
  userPlan: Plan;
  lang: Language;
  settings: UserSettings;
}

export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({ 
  isOpen, onClose, selectedModel, onSelect, userPlan, lang, settings 
}) => {
  if (!isOpen) return null;

  const t = UI_TEXT[lang].modelSelector;
  const accent = ACCENT_THEMES[settings.accent || 'default'];

  const models: { id: AIModel; name: string; icon: React.ElementType; desc: string; isLocked: boolean }[] = [
    { 
        id: 'gti-5', 
        name: t.one, 
        icon: Atom, 
        desc: "Balanced intelligence & speed.",
        isLocked: false 
    },
    { 
        id: 'gti-pro', 
        name: t.pro, 
        icon: Brain, 
        desc: "Maximum reasoning power.",
        isLocked: userPlan !== 'pro' 
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
        <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden relative ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#151025] border-white/10'}`}>
            
            <div className={`p-6 border-b ${settings.theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'}`}>
                <h2 className={`text-xl font-bold ${settings.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{t.title}</h2>
                <p className={`text-sm ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{t.desc}</p>
            </div>

            <div className="p-6 grid gap-4">
                {models.map((m) => {
                    const isActive = selectedModel === m.id;
                    const Icon = m.icon;

                    return (
                        <button
                            key={m.id}
                            onClick={() => {
                                if (!m.isLocked) {
                                    onSelect(m.id);
                                    onClose();
                                }
                            }}
                            className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                                isActive 
                                    ? `ring-2 ring-offset-2 ${settings.theme === 'light' ? 'ring-offset-white bg-slate-50' : 'ring-offset-[#151025] bg-white/5'}` 
                                    : m.isLocked 
                                        ? 'opacity-60 cursor-not-allowed bg-black/5' 
                                        : `${settings.theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`
                            } ${settings.theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}
                            style={{ 
                                borderColor: isActive ? accent.colors[0] : undefined,
                                boxShadow: isActive ? `0 0 20px ${accent.colors[0]}20` : undefined
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${
                                    isActive 
                                        ? `bg-gradient-to-br ${accent.gradient} text-white shadow-lg` 
                                        : settings.theme === 'light' ? 'bg-slate-200 text-slate-500' : 'bg-white/10 text-slate-400'
                                }`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-bold ${settings.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{m.name}</h3>
                                        {m.isLocked && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/20 text-slate-500 border border-white/5 flex items-center gap-1"><Lock size={8}/> {t.lock}</span>}
                                        {isActive && <Check size={16} className={settings.theme === 'light' ? 'text-green-600' : 'text-green-400'} />}
                                    </div>
                                    <p className={`text-xs mt-1 ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{m.desc}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <div className="p-4 flex justify-center border-t border-white/5">
                <button onClick={onClose} className={`text-sm font-medium hover:underline ${settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {UI_TEXT[lang].close}
                </button>
            </div>

        </div>
    </div>
  );
};