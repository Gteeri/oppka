
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { UserSettings, Language, VoiceName } from '../types';
import { ACCENT_THEMES, VOICE_PRESETS } from '../constants';
import { generateOfficeAction, generateOnixImage, generateSpeech } from '../services/geminiService';
import { 
    FileText, Table, Presentation, X, Play, Save, Download, 
    Bold, Italic, List, AlignLeft, AlignCenter, Layout, Plus, 
    Image as ImageIcon, Loader2, Sparkles, Wand2, Type, 
    ChevronLeft, Maximize2, Minimize2, Grid, ArrowRight, 
    Briefcase, PieChart, Layers, Upload, Settings, RefreshCw,
    Calculator, BarChart3, Eye, MousePointer2, CheckCircle, AlertTriangle, Edit3,
    Mic, Volume2, Music, Info, Menu
} from 'lucide-react';

interface OfficeSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  lang: Language;
}

// --- LOCALIZATION DICTIONARY ---
const OFFICE_TEXT = {
  en: {
    launcher: {
        title: "GTayr Office",
        subtitle: "AI-First Productivity. Select an app.",
        apps: {
            doc: { title: "Writer", desc: "Professional documents." },
            sheet: { title: "Grid", desc: "Data analysis & AI tables." },
            slide: { title: "Cinema", desc: "AI Presentations." },
            audio: { title: "Audio Studio", desc: "AI Neural Speech." }
        },
        templates: "Smart AI Templates",
        templateList: [
             { label: "Startup Pitch Deck", app: 'slide', prompt: "Create a 10 slide pitch deck for a fintech startup" },
             { label: "Resignation Letter", app: 'doc', prompt: "Write a professional resignation letter effective in 2 weeks" },
             { label: "Project Budget", app: 'sheet', prompt: "Create a project budget template with phases" },
             { label: "Audiobook Intro", app: 'audio', prompt: "" }
        ]
    },
    doc: {
        placeholder: "E.g., 'Write a letter', 'Add table'...",
        statsWords: "words",
        statsChars: "chars",
        statsTime: "min read"
    },
    sheet: {
        placeholder: "E.g., 'Startup budget', 'Analyze Q3'...",
        analysis: "Quick Analysis",
        noData: "No numeric data found"
    },
    slide: {
        placeholder: "E.g., 'Cyberpunk theme', 'Slide about tech'...",
        save: "Save",
        genArt: "Generate Art",
        present: "Present",
        manual: "Edit Slide",
        addSlide: "+ Slide",
        titlePlaceholder: "Title",
        contentPlaceholder: "Content",
        artSuccess: "Batch generation complete!",
        artInfo: "Batch generating artworks...",
        artEmpty: "All slides already have art!"
    },
    audio: {
        placeholder: "Enter text to generate speech...",
        generate: "Generate Audio",
        voiceLabel: "Voice Actor",
        download: "Download",
        success: "Audio generated successfully!",
        playing: "Playing...",
        controls: "Controls"
    },
    common: {
        processing: "Processing",
        engineActive: "GTayr Neural Engine",
        saveSuccess: "Project saved!",
        genSuccess: "Generated successfully!",
        genStart: "AI Started...",
        genFail: "Generation failed."
    }
  },
  ru: {
    launcher: {
        title: "GTayr Офис",
        subtitle: "Продуктивность с ИИ. Выберите приложение.",
        apps: {
            doc: { title: "Writer", desc: "Документы и Дзен-режим." },
            sheet: { title: "Grid", desc: "Анализ данных и таблицы." },
            slide: { title: "Cinema", desc: "Презентации с ИИ." },
            audio: { title: "Аудио Студия", desc: "Нейронная озвучка." }
        },
        templates: "Умные ИИ Шаблоны",
        templateList: [
             { label: "Питч-дек Стартапа", app: 'slide', prompt: "Создай питч-дек из 10 слайдов для финтех стартапа" },
             { label: "Заявление об уходе", app: 'doc', prompt: "Напиши официальное заявление об увольнении через 2 недели" },
             { label: "Бюджет Проекта", app: 'sheet', prompt: "Создай шаблон бюджета проекта по фазам" },
             { label: "Интро Книги", app: 'audio', prompt: "" }
        ]
    },
    doc: {
        placeholder: "Напр., 'Напиши заявление'...",
        statsWords: "слов",
        statsChars: "симв",
        statsTime: "мин"
    },
    sheet: {
        placeholder: "Напр., 'Бюджет', 'Анализ продаж'...",
        analysis: "Анализ",
        noData: "Нет данных"
    },
    slide: {
        placeholder: "Напр., 'Киберпанк', 'Слайд про будущее'...",
        save: "Сохранить",
        genArt: "Арт",
        present: "Просмотр",
        manual: "Редактировать",
        addSlide: "+ Слайд",
        titlePlaceholder: "Заголовок",
        contentPlaceholder: "Контент",
        artSuccess: "Генерация завершена!",
        artInfo: "Генерирую...",
        artEmpty: "Фоны уже есть!"
    },
    audio: {
        placeholder: "Введите текст для озвучки...",
        generate: "Озвучить",
        voiceLabel: "Диктор",
        download: "Скачать",
        success: "Аудио успешно создано!",
        playing: "Играет...",
        controls: "Управление"
    },
    common: {
        processing: "Обработка",
        engineActive: "Нейросеть GTayr",
        saveSuccess: "Сохранено!",
        genSuccess: "Готово!",
        genStart: "Запуск...",
        genFail: "Ошибка."
    }
  }
};

// --- TOAST SYSTEM ---
interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts }: { toasts: Toast[] }) => (
    <div className="fixed bottom-20 right-4 md:right-6 z-[300] flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] border backdrop-blur-md ${
                t.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                t.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                'bg-blue-500/10 border-blue-500/50 text-blue-400'
            }`}>
                {t.type === 'success' && <CheckCircle size={16} className="shrink-0" />}
                {t.type === 'error' && <AlertTriangle size={16} className="shrink-0" />}
                {t.type === 'info' && <Info size={16} className="shrink-0" />}
                <span className="text-xs font-bold break-words">{t.message}</span>
            </div>
        ))}
    </div>
);

// --- NEURAL COMMAND BAR ---
const NeuralCommandBar = ({ 
    onPrompt, 
    loading, 
    placeholder,
    isLight,
    t
}: { 
    onPrompt: (p: string) => void, 
    loading: boolean, 
    placeholder?: string,
    isLight: boolean,
    t: any
}) => {
    const [val, setVal] = useState('');
    return (
        <div className="w-full max-w-3xl mx-auto mb-2 md:mb-6 relative z-20 group">
            <div className={`absolute inset-0 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-r from-violet-600 to-pink-600`}></div>
            <div className={`relative border rounded-2xl flex items-center p-1 md:p-2 shadow-2xl transition-all group-focus-within:scale-[1.01] ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1e1e1e] border-white/10 text-white'}`}>
                <div className={`p-2 md:p-3 rounded-xl ${loading ? 'animate-spin' : ''}`}>
                    {loading ? <Loader2 className="text-violet-400" size={20} /> : <Sparkles className="text-violet-400" size={20} />}
                </div>
                <input 
                    className={`flex-1 bg-transparent border-none outline-none text-sm md:text-lg px-2 h-10 md:h-12 ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'}`}
                    placeholder={placeholder || t.common.processing}
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && val.trim()) {
                            onPrompt(val);
                            setVal('');
                        }
                    }}
                    disabled={loading}
                />
                <button 
                    onClick={() => { if(val.trim()) { onPrompt(val); setVal(''); }}}
                    disabled={loading || !val.trim()}
                    className={`p-2 md:p-3 rounded-xl transition-colors disabled:opacity-50 ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

// --- AUDIO STUDIO EDITOR ---
const AudioStudio = ({ isLight, t, notify }: any) => {
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        // Reset and assign new source
        audio.src = audioUrl;
        
        // Attempt playback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.warn("Audio playback prevented:", error);
                }
            });
        }

        return () => {
            // Cleanup
            audio.pause();
            if (audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        // Clear previous audio
        setAudioUrl(null);
        
        try {
            // Generate raw base64 data URI (now wav format from service)
            const dataUri = await generateSpeech(text, selectedVoice);
            
            // Convert Data URI to Blob for efficient streaming playback
            const res = await fetch(dataUri);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            setAudioUrl(blobUrl);
            notify(t.audio.success, 'success');
        } catch (e: any) {
            console.error("Audio Gen Failed", e);
             if (e.message?.includes("AI_REFUSAL") || e.message?.includes("SAFETY")) {
                 notify(e.message.replace("AI_REFUSAL:", "AI:"), 'info');
             } else {
                 notify(t.common.genFail, 'error');
             }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 md:gap-6 p-4">
            <div className={`flex-1 rounded-2xl p-4 md:p-6 border relative ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <textarea 
                    className={`w-full h-full bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-slate-600'}`}
                    placeholder={t.audio.placeholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>
            
            {/* Control Panel: Stack on mobile, Row on desktop */}
            <div className={`p-4 md:p-6 rounded-3xl border flex flex-col md:flex-row items-center gap-4 md:gap-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#1e1e1e] border-white/10'}`}>
                 <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-4">
                     <div className="flex items-center gap-3 w-full md:w-auto">
                         <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                             <Mic size={20} className={isLight ? 'text-slate-500' : 'text-slate-400'} />
                         </div>
                         <div className="flex-1 md:flex-initial">
                             <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{t.audio.voiceLabel}</div>
                             <select 
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                                className={`w-full md:w-40 bg-transparent border-none outline-none font-bold cursor-pointer ${isLight ? 'text-slate-800' : 'text-white'}`}
                             >
                                 {VOICE_PRESETS.map(v => <option key={v} value={v} className="text-black">{v}</option>)}
                             </select>
                         </div>
                     </div>
                     
                     {/* Audio Player */}
                     {audioUrl && (
                        <div className="w-full md:flex-1 flex items-center justify-center bg-black/5 rounded-xl p-2">
                             <audio ref={audioRef} controls className="w-full h-10" />
                        </div>
                     )}
                 </div>

                 <div className="flex items-center gap-3 w-full md:w-auto">
                     {audioUrl && (
                         <a 
                            href={audioUrl} 
                            download={`gtayr-audio-${Date.now()}.wav`}
                            className={`p-4 rounded-xl border flex items-center justify-center transition-all ${isLight ? 'border-slate-200 hover:bg-slate-50 text-slate-600' : 'border-white/10 hover:bg-white/5 text-slate-400 hover:text-white'}`}
                         >
                             <Download size={20} />
                         </a>
                     )}
                     <button 
                        onClick={handleGenerate}
                        disabled={loading || !text}
                        className={`flex-1 md:flex-initial px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 bg-gradient-to-r from-violet-600 to-pink-600`}
                     >
                         {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                         {t.audio.generate}
                     </button>
                 </div>
            </div>
        </div>
    );
};

// --- SLIDE EDITOR ---
const SlideEditor = ({ isLight, t, prompt, notify }: any) => {
    const [slides, setSlides] = useState<any[]>([{ title: "New Slide", content: "Click to edit", type: "title" }]);
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [viewMode, setViewMode] = useState<'edit' | 'present'>('edit');
    const [generatingArt, setGeneratingArt] = useState(false);
    
    // Parse Initial Prompt
    useEffect(() => {
        if (prompt && prompt.slides) {
            setSlides(prompt.slides);
        }
    }, [prompt]);

    const activeSlide = slides[activeSlideIdx];

    const generateAllArt = async () => {
        const slidesWithoutArt = slides.map((s, i) => ({ s, i })).filter(item => !item.s.backgroundImage && item.s.imagePrompt);
        
        if (slidesWithoutArt.length === 0) {
            notify(t.slide.artEmpty, 'info');
            return;
        }

        setGeneratingArt(true);
        notify(t.slide.artInfo, 'info');

        // Process in parallel with concurrency limit of 2 to avoid rate limits
        const processBatch = async (items: any[]) => {
            for (const item of items) {
                try {
                    const img = await generateOnixImage(item.s.imagePrompt + " cinematic, 8k, highly detailed, presentation background, minimal text overlay area");
                    setSlides(prev => {
                        const newSlides = [...prev];
                        newSlides[item.i] = { ...newSlides[item.i], backgroundImage: img };
                        return newSlides;
                    });
                } catch (e: any) {
                    console.error("Art Gen Error", e);
                    if (e.message?.includes("AI_REFUSAL") || e.message?.includes("SAFETY")) {
                         // Silently skip or show small toast
                    }
                }
            }
        };

        const batch1 = slidesWithoutArt.slice(0, Math.ceil(slidesWithoutArt.length / 2));
        const batch2 = slidesWithoutArt.slice(Math.ceil(slidesWithoutArt.length / 2));

        await Promise.all([processBatch(batch1), processBatch(batch2)]);
        
        setGeneratingArt(false);
        notify(t.slide.artSuccess, 'success');
    };

    if (viewMode === 'present') {
        return (
            <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
                <div 
                    className="w-full h-full max-w-7xl aspect-video bg-white relative flex flex-col items-center justify-center text-center p-20 bg-cover bg-center transition-all duration-700"
                    style={{ backgroundImage: activeSlide.backgroundImage ? `url(${activeSlide.backgroundImage})` : undefined }}
                >
                    {activeSlide.backgroundImage && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>}
                    <div className="relative z-10 max-w-4xl">
                         <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 drop-shadow-2xl">{activeSlide.title}</h1>
                         <p className="text-2xl md:text-3xl text-white/90 leading-relaxed drop-shadow-lg">{activeSlide.content}</p>
                    </div>
                </div>
                
                <div className="absolute bottom-8 flex gap-4">
                    <button onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"><ChevronLeft size={32} /></button>
                    <span className="text-white font-mono self-center text-xl">{activeSlideIdx + 1} / {slides.length}</span>
                    <button onClick={() => setActiveSlideIdx(Math.min(slides.length - 1, activeSlideIdx + 1))} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md rotate-180"><ChevronLeft size={32} /></button>
                    <button onClick={() => setViewMode('edit')} className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full backdrop-blur-md ml-8"><X size={32} /></button>
                </div>
            </div>
        );
    }

    // --- MOBILE RESPONSIVE LAYOUT FOR EDITOR ---
    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Slide List: Bottom on Mobile (Horizontal Scroll), Left on Desktop (Vertical) */}
            <div className={`order-2 md:order-1 w-full md:w-64 flex flex-row md:flex-col gap-4 p-4 overflow-x-auto md:overflow-y-auto border-t md:border-r border-b-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f0a1e] border-white/5'}`}>
                {slides.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => setActiveSlideIdx(i)}
                        className={`flex-shrink-0 w-32 md:w-full aspect-video rounded-lg border-2 overflow-hidden relative group transition-all ${activeSlideIdx === i ? 'border-violet-500 shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                        <div className={`w-full h-full p-2 text-[6px] md:text-[8px] overflow-hidden ${isLight ? 'bg-white text-slate-800' : 'bg-[#1e1e1e] text-white'}`} style={{ backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined, backgroundSize: 'cover' }}>
                            <div className="font-bold truncate">{s.title}</div>
                            <div className="line-clamp-4 opacity-70">{s.content}</div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">{i + 1}</div>
                    </button>
                ))}
                <button 
                    onClick={() => setSlides([...slides, { title: "New Slide", content: "Content", type: "content" }])}
                    className={`flex-shrink-0 w-32 md:w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-400' : 'border-white/10 hover:bg-white/5 text-slate-500'}`}
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Main Editor Area */}
            <div className={`order-1 md:order-2 flex-1 flex flex-col p-4 md:p-8 overflow-y-auto ${isLight ? 'bg-slate-100' : 'bg-black/20'}`}>
                
                {/* Toolbar */}
                <div className="flex flex-wrap gap-2 justify-between mb-4 md:mb-6">
                    <div className="flex gap-2">
                         <button onClick={() => setViewMode('present')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${isLight ? 'bg-white text-slate-700 shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                             <Play size={16} fill="currentColor" /> <span className="hidden md:inline">{t.slide.present}</span>
                         </button>
                         <button onClick={generateAllArt} disabled={generatingArt} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${isLight ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg' : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg'}`}>
                             {generatingArt ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} 
                             <span className="hidden md:inline">{t.slide.genArt}</span>
                         </button>
                    </div>
                </div>

                {/* Slide Canvas */}
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                     <div 
                        className={`w-full max-w-4xl aspect-video shadow-2xl rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center p-8 md:p-16 transition-all bg-cover bg-center group ${isLight ? 'bg-white' : 'bg-[#1e1e1e]'}`}
                        style={{ backgroundImage: activeSlide.backgroundImage ? `url(${activeSlide.backgroundImage})` : undefined }}
                     >
                         {activeSlide.backgroundImage && <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors"></div>}
                         
                         <div className="relative z-10 w-full">
                             <input 
                                value={activeSlide.title}
                                onChange={(e) => {
                                    const newSlides = [...slides];
                                    newSlides[activeSlideIdx].title = e.target.value;
                                    setSlides(newSlides);
                                }}
                                className="w-full text-center bg-transparent border-none outline-none text-3xl md:text-5xl font-bold mb-4 md:mb-6 placeholder:opacity-50 text-white drop-shadow-md"
                                placeholder={t.slide.titlePlaceholder}
                             />
                             <textarea 
                                value={activeSlide.content}
                                onChange={(e) => {
                                    const newSlides = [...slides];
                                    newSlides[activeSlideIdx].content = e.target.value;
                                    setSlides(newSlides);
                                }}
                                className="w-full text-center bg-transparent border-none outline-none text-lg md:text-2xl resize-none placeholder:opacity-50 text-white/90 drop-shadow-md h-32 md:h-auto"
                                rows={4}
                                placeholder={t.slide.contentPlaceholder}
                             />
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const OfficeSuite: React.FC<OfficeSuiteProps> = ({ isOpen, onClose, settings, lang }) => {
    const [activeApp, setActiveApp] = useState<'launcher' | 'doc' | 'sheet' | 'slide' | 'audio'>('launcher');
    const [isLoading, setIsLoading] = useState(false);
    const [promptData, setPromptData] = useState<any>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    const isLight = settings.theme === 'light';
    const accent = ACCENT_THEMES[settings.accent || 'default'];
    const t = OFFICE_TEXT[lang];

    const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const handlePrompt = async (text: string) => {
        setIsLoading(true);
        try {
            // Determine app if in launcher
            let targetApp = activeApp;
            if (activeApp === 'launcher') {
                 // Simple keyword check or default to doc. In real app, AI decides.
                 if (text.toLowerCase().includes('presentation') || text.toLowerCase().includes('slide') || text.toLowerCase().includes('deck')) targetApp = 'slide';
                 else if (text.toLowerCase().includes('sheet') || text.toLowerCase().includes('table') || text.toLowerCase().includes('budget')) targetApp = 'sheet';
                 else if (text.toLowerCase().includes('audio') || text.toLowerCase().includes('speech') || text.toLowerCase().includes('speak')) targetApp = 'audio';
                 else targetApp = 'doc';
            }

            if (targetApp === 'audio') {
                 // Audio doesn't need 'generation' logic here, just open the app
                 setActiveApp('audio');
                 setIsLoading(false);
                 return;
            }

            notify(t.common.genStart, 'info');
            const data = await generateOfficeAction(text, targetApp as any, lang);
            
            setPromptData(data);
            setActiveApp(targetApp);
            notify(t.common.genSuccess, 'success');

        } catch (e) {
            console.error(e);
            notify(t.common.genFail, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className={`w-full h-full md:h-[90vh] md:max-w-7xl md:rounded-3xl border shadow-2xl flex flex-col relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#05040a] border-white/10'}`}>
                
                {/* GLOBAL HEADER */}
                <div className={`h-16 flex items-center justify-between px-4 md:px-6 border-b ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f0a1e] border-white/5'}`}>
                    <div className="flex items-center gap-3">
                         {activeApp !== 'launcher' && (
                             <button onClick={() => setActiveApp('launcher')} className={`p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                                 <Grid size={20} />
                             </button>
                         )}
                         <div className="flex flex-col">
                             <h2 className={`text-base font-bold leading-none ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                 {activeApp === 'launcher' ? t.launcher.title : t.launcher.apps[activeApp].title}
                             </h2>
                             {activeApp !== 'launcher' && <span className="text-[10px] text-slate-500">{t.common.engineActive}</span>}
                         </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* APP CONTENT */}
                <div className="flex-1 overflow-hidden relative">
                    
                    {/* LAUNCHER */}
                    {activeApp === 'launcher' && (
                        <div className="h-full overflow-y-auto p-4 md:p-10 custom-scrollbar">
                            <div className="max-w-5xl mx-auto">
                                <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>{t.launcher.title}</h1>
                                <p className={`text-lg mb-8 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.launcher.subtitle}</p>
                                
                                <NeuralCommandBar onPrompt={handlePrompt} loading={isLoading} isLight={isLight} t={t} placeholder="Describe what to create..." />

                                {/* App Grid - Stacked on Mobile (1 col), Grid on Desktop */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                    {[
                                        { id: 'doc', icon: FileText, color: 'text-blue-500' },
                                        { id: 'sheet', icon: Table, color: 'text-green-500' },
                                        { id: 'slide', icon: Presentation, color: 'text-orange-500' },
                                        { id: 'audio', icon: Mic, color: 'text-pink-500' }
                                    ].map((app: any) => (
                                        <button 
                                            key={app.id}
                                            onClick={() => setActiveApp(app.id)}
                                            className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] group ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl' : 'bg-[#0f0a1e] border-white/5 hover:bg-[#151025] hover:border-white/10'}`}
                                        >
                                            <div className={`p-3 rounded-xl w-fit mb-4 ${isLight ? 'bg-white shadow-sm' : 'bg-white/5'} ${app.color}`}>
                                                <app.icon size={24} />
                                            </div>
                                            <h3 className={`font-bold text-lg mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{t.launcher.apps[app.id].title}</h3>
                                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.launcher.apps[app.id].desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Templates */}
                                <div>
                                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{t.launcher.templates}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {t.launcher.templateList.map((tmp: any, i: number) => (
                                            <button 
                                                key={i}
                                                onClick={() => { if(tmp.app === 'audio') setActiveApp('audio'); else handlePrompt(tmp.prompt); }}
                                                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-400' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                            >
                                                <Sparkles size={14} className={isLight ? 'text-violet-500' : 'text-violet-400'} />
                                                <span className="text-sm font-medium">{tmp.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPLICATIONS */}
                    {activeApp === 'doc' && (
                        <div className="h-full flex flex-col items-center justify-center p-10 opacity-50">
                             <FileText size={48} className="mb-4" />
                             <p>Doc Editor Placeholder</p>
                        </div>
                    )}

                    {activeApp === 'sheet' && (
                         <div className="h-full flex flex-col items-center justify-center p-10 opacity-50">
                             <Table size={48} className="mb-4" />
                             <p>Sheet Editor Placeholder</p>
                         </div>
                    )}

                    {activeApp === 'slide' && (
                        <SlideEditor isLight={isLight} t={t} prompt={promptData} notify={notify} />
                    )}

                    {activeApp === 'audio' && (
                        <AudioStudio isLight={isLight} t={t} notify={notify} />
                    )}

                </div>
            </div>
            
            <ToastContainer toasts={toasts} />
        </div>
    );
};
