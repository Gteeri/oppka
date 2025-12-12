

import React, { useState, useRef, useEffect } from 'react';
import { UserSettings, Language, AccentType, Theme } from '../types';
import { UI_TEXT, ACCENT_THEMES } from '../constants';
import { X, Globe, User, Database, Download, Upload, Trash2, Atom, Palette, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  lang: Language;
  onLanguageChange: (l: Language) => void;
  onDeleteAllData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

type Tab = 'general' | 'interface' | 'personalization' | 'data';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, settings, onSave, lang, onLanguageChange, onDeleteAllData, onExportData, onImportData 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [localCustomPrompt, setLocalCustomPrompt] = useState(settings.customPrompt);
  const [localTheme, setLocalTheme] = useState<Theme>(settings.theme || 'dark');
  const [localAccent, setLocalAccent] = useState<AccentType>(settings.accent || 'default');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = UI_TEXT[lang].settingsModal;

  if (!isOpen) return null;

  const handleSaveAndClose = () => {
      onSave({ 
          ...settings, 
          customPrompt: localCustomPrompt,
          theme: localTheme,
          accent: localAccent
      });
      onClose();
  };

  const tabs = [
      { id: 'general', label: t.tabs.general, icon: Globe },
      { id: 'interface', label: t.tabs.interface, icon: Palette },
      { id: 'personalization', label: t.tabs.personalization, icon: User },
      { id: 'data', label: t.tabs.data, icon: Database },
  ];

  const accentKeys = Object.keys(ACCENT_THEMES) as AccentType[];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-[#151025] w-full max-w-2xl h-[600px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
            
            <button onClick={handleSaveAndClose} className="absolute top-4 right-4 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#0d0a18] p-6 border-r border-white/5 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className={`p-2 bg-gradient-to-br ${ACCENT_THEMES[localAccent].gradient} rounded-lg`}>
                        <Atom size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">Settings</span>
                </div>
                
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                    isActive 
                                    ? 'bg-white/10 text-white shadow-inner' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#151025]">
                
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.langLabel}</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => onLanguageChange('en')}
                                    className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'en' ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'}`}
                                >
                                    🇺🇸 English
                                </button>
                                <button 
                                    onClick={() => onLanguageChange('ru')}
                                    className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'ru' ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'}`}
                                >
                                    🇷🇺 Русский
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'interface' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                        
                        {/* Theme Toggle */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.themeLabel}</label>
                            <div className="flex bg-black/30 p-1 rounded-2xl border border-white/5">
                                <button 
                                    onClick={() => setLocalTheme('dark')}
                                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${localTheme === 'dark' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Moon size={16} /> Dark
                                </button>
                                <button 
                                    onClick={() => setLocalTheme('light')}
                                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${localTheme === 'light' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Sun size={16} /> Light
                                </button>
                            </div>
                        </div>

                        {/* Accent Picker */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.accentLabel}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {accentKeys.map(key => {
                                    const theme = ACCENT_THEMES[key];
                                    const isSelected = localAccent === key;
                                    return (
                                        <button 
                                            key={key}
                                            onClick={() => setLocalAccent(key)}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isSelected ? 'bg-white/5 border-white text-white' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.gradient} shadow-lg scale-90`}></div>
                                            <span className="text-sm font-medium">{theme.label}</span>
                                            {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'personalization' && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.customInstLabel}</label>
                            <textarea
                                value={localCustomPrompt}
                                onChange={(e) => setLocalCustomPrompt(e.target.value)}
                                placeholder={t.customInstPlaceholder}
                                className="w-full h-64 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-all leading-relaxed"
                            />
                            <p className="mt-3 text-[10px] text-slate-500">
                                These instructions will be added to every message you send to GTayr. Use this to define a persona, preferred coding style, or response brevity.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <h4 className="text-white font-bold mb-1">Export Data</h4>
                            <p className="text-xs text-slate-400 mb-4">Download all your chat history as a JSON file.</p>
                            <button onClick={onExportData} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 border border-white/5">
                                <Download size={14} /> {t.exportBtn}
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <h4 className="text-white font-bold mb-1">Import Data</h4>
                            <p className="text-xs text-slate-400 mb-4">{t.importDesc}</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".json" 
                                onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                        onImportData(e.target.files[0]);
                                        // Reset input so same file can be selected again if needed
                                        e.target.value = '';
                                    }
                                }} 
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 border border-violet-500/30">
                                <Upload size={14} /> {t.importBtn}
                            </button>
                        </div>

                        <div className="pt-8 mt-8 border-t border-white/5">
                            <button onClick={onDeleteAllData} className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20">
                                <Trash2 size={14} /> {t.deleteBtn}
                            </button>
                            <p className="text-[10px] text-center text-red-400/50 mt-2">{t.deleteConfirm}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};