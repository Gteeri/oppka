import React, { useState } from 'react';
import { UserSettings, Language } from '../types';
import { ACCENT_THEMES } from '../constants';
import { generateOfficeAction } from '../services/geminiService';
import { FileText, Table, Presentation, X, Play, Copy, Download, Briefcase, Loader2, ArrowRight } from 'lucide-react';

interface OfficeHubProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  lang: Language;
}

export const OfficeHub: React.FC<OfficeHubProps> = ({ isOpen, onClose, settings, lang }) => {
  const [activeApp, setActiveApp] = useState<'word' | 'excel' | 'powerpoint'>('word');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const accent = ACCENT_THEMES[settings.accent || 'default'];
  const isLight = settings.theme === 'light';

  if (!isOpen) return null;

  const handleGenerate = async () => {
      if (!prompt.trim()) return;
      setIsGenerating(true);
      setGeneratedContent("");
      try {
          // Map 'word' | 'excel' | 'powerpoint' to 'doc' | 'sheet' | 'slide'
          // OfficeHub uses 'word' | 'excel' | 'powerpoint'
          // generateOfficeAction uses 'doc' | 'sheet' | 'slide'
          // We need to map activeApp to the correct type for generateOfficeAction
          
          let serviceAppType: 'doc' | 'sheet' | 'slide' = 'doc';
          if (activeApp === 'word') serviceAppType = 'doc';
          else if (activeApp === 'excel') serviceAppType = 'sheet';
          else if (activeApp === 'powerpoint') serviceAppType = 'slide';

          const result = await generateOfficeAction(prompt, serviceAppType, lang);
          
          // Result formatting depending on app type
          if (typeof result === 'string') {
               setGeneratedContent(result);
          } else {
               setGeneratedContent(JSON.stringify(result, null, 2));
          }
      } catch (e) {
          setGeneratedContent("Error generating content. Please try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = activeApp === 'excel' ? 'csv' : activeApp === 'word' ? 'md' : 'txt';
      a.download = `gtayr_${activeApp}_draft.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
        <div className={`w-full max-w-4xl h-[80vh] rounded-3xl border shadow-2xl flex flex-col relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#151025] border-white/10'}`}>
            
            {/* Header */}
            <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-white/5'}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl text-white shadow-lg">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>GTayr Office Hub</h2>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Microsoft 365 Bridge & AI Drafter</p>
                    </div>
                </div>
                <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Sidebar / Launchers */}
                <div className={`w-full md:w-64 p-4 border-r flex flex-col gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f0a1e] border-white/5'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Quick Launchers</div>
                    
                    <a href="https://word.new" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-3 rounded-xl bg-[#2b579a] text-white hover:bg-[#204073] transition-all shadow-lg hover:translate-x-1">
                        <FileText size={20} />
                        <span className="font-bold flex-1">Word Online</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    
                    <a href="https://excel.new" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-3 rounded-xl bg-[#217346] text-white hover:bg-[#185533] transition-all shadow-lg hover:translate-x-1">
                        <Table size={20} />
                        <span className="font-bold flex-1">Excel Online</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    <a href="https://powerpoint.new" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-3 rounded-xl bg-[#d24726] text-white hover:bg-[#a3361b] transition-all shadow-lg hover:translate-x-1">
                        <Presentation size={20} />
                        <span className="font-bold flex-1">PowerPoint</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    <div className={`mt-6 text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>AI Generator Mode</div>
                    <div className="space-y-2">
                        <button 
                            onClick={() => setActiveApp('word')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeApp === 'word' ? 'bg-[#2b579a]/20 border border-[#2b579a] text-[#2b579a]' : isLight ? 'text-slate-600 hover:bg-white' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <FileText size={16} /> Word Draft
                        </button>
                        <button 
                            onClick={() => setActiveApp('excel')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeApp === 'excel' ? 'bg-[#217346]/20 border border-[#217346] text-[#217346]' : isLight ? 'text-slate-600 hover:bg-white' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Table size={16} /> Excel Data
                        </button>
                        <button 
                            onClick={() => setActiveApp('powerpoint')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeApp === 'powerpoint' ? 'bg-[#d24726]/20 border border-[#d24726] text-[#d24726]' : isLight ? 'text-slate-600 hover:bg-white' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Presentation size={16} /> PPT Outline
                        </button>
                    </div>
                </div>

                {/* Generator Area */}
                <div className={`flex-1 flex flex-col p-6 overflow-hidden ${isLight ? 'bg-white' : 'bg-[#151025]'}`}>
                    <div className="mb-4">
                        <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {activeApp === 'word' && "Word Document Generator"}
                            {activeApp === 'excel' && "Excel Spreadsheet Generator"}
                            {activeApp === 'powerpoint' && "Presentation Outline Generator"}
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Describe what you need, and GTayr will format it perfectly for {activeApp === 'word' ? 'MS Word' : activeApp === 'excel' ? 'MS Excel' : 'PowerPoint'}.
                        </p>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder={`E.g., "${activeApp === 'excel' ? 'Monthly budget for a family of 4' : activeApp === 'word' ? 'Resignation letter' : 'Startup pitch deck structure'}"`}
                            className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none transition-all ${isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800' : 'bg-black/30 border-white/10 focus:border-blue-500/50 text-white'}`}
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 ${
                                activeApp === 'word' ? 'bg-[#2b579a]' : activeApp === 'excel' ? 'bg-[#217346]' : 'bg-[#d24726]'
                            }`}
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                            Generate
                        </button>
                    </div>

                    <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col relative ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                        {/* Toolbar */}
                        <div className={`p-2 flex justify-end gap-2 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-white/5'}`}>
                             <button onClick={handleCopy} className={`p-2 rounded hover:bg-black/10 transition-colors ${isLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'}`} title="Copy">
                                 {copied ? <span className="text-green-500 text-xs font-bold px-1">Copied!</span> : <Copy size={16} />}
                             </button>
                             <button onClick={handleDownload} className={`p-2 rounded hover:bg-black/10 transition-colors ${isLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'}`} title="Download File">
                                 <Download size={16} />
                             </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {generatedContent ? (
                                <pre className={`font-mono text-sm whitespace-pre-wrap ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                    {generatedContent}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center flex-col opacity-30 gap-4">
                                    <Briefcase size={64} />
                                    <p>Ready to generate office documents</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};