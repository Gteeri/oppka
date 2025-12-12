
import React, { useState, useMemo } from 'react';
import { ChatSession, Language } from '../types';
import { UI_TEXT } from '../constants';
import { Logo } from './Logo';
import { Search, Image as ImageIcon, Calendar, MessageSquare, FileText, Clock, X } from 'lucide-react';

interface ChatDetailsModalProps {
  session: ChatSession | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onMessageClick: (messageId: string) => void;
}

export const ChatDetailsModal: React.FC<ChatDetailsModalProps> = ({ session, isOpen, onClose, lang, onMessageClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'media'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const t = UI_TEXT[lang].chatDetails;

  const shouldRender = isOpen && session;

  const stats = useMemo(() => {
    if (!shouldRender || !session) return null;
    const msgCount = session.messages.length;
    const wordCount = session.messages.reduce((acc, m) => acc + (m.text ? m.text.length / 5 : 0), 0); 
    const tokenEst = Math.round(wordCount);
    const created = new Date(Number(session.id)).toLocaleDateString();
    const topic = session.title;
    
    return { msgCount, wordCount: Math.round(wordCount), tokenEst, created, topic };
  }, [session, shouldRender]);

  const searchResults = useMemo(() => {
    if (!shouldRender || !session || !searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return session.messages.filter(m => 
        m.text && m.text.toLowerCase().includes(lowerQuery)
    );
  }, [session, searchQuery, shouldRender]);

  const mediaItems = useMemo(() => {
    if (!shouldRender || !session) return [];
    const items: { type: 'image' | 'file', src?: string, name?: string, id: string }[] = [];
    
    session.messages.forEach(m => {
        // AI Generated
        if (m.image && m.image !== 'pending') {
            items.push({ type: 'image', src: m.image, id: m.id });
        }
        // User Attachments
        if (m.attachments) {
            m.attachments.forEach((att, idx) => {
                if (att.mimeType.startsWith('image/') && att.data) {
                    items.push({ type: 'image', src: `data:${att.mimeType};base64,${att.data}`, id: `${m.id}-${idx}` });
                } else {
                    items.push({ type: 'file', name: 'Document', id: `${m.id}-${idx}` });
                }
            });
        }
    });
    return items;
  }, [session, shouldRender]);

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-[#151025] border border-white/10 rounded-3xl w-full max-w-lg h-[600px] flex flex-col relative overflow-hidden shadow-2xl">
            
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                        <Logo className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t.title}</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex p-2 gap-2 border-b border-white/5 bg-[#0f0a1e]/50">
                <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.tabs.overview}</button>
                <button onClick={() => setActiveTab('search')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.tabs.search}</button>
                <button onClick={() => setActiveTab('media')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'media' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.tabs.media} ({mediaItems.length})</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="bg-gradient-to-br from-violet-900/20 to-pink-900/20 p-5 rounded-2xl border border-white/10">
                            <span className="text-xs text-slate-400 uppercase font-bold">{t.analysisTitle}</span>
                            <h4 className="text-lg font-bold text-white mt-1 mb-4">{stats.topic}</h4>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-black/30 px-3 py-1 rounded-full text-xs text-violet-300 border border-violet-500/30">History</span>
                                <span className="bg-black/30 px-3 py-1 rounded-full text-xs text-pink-300 border border-pink-500/30">Analysis</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><MessageSquare size={16} /> <span className="text-xs">{t.stats.messages}</span></div><span className="text-2xl font-mono font-bold text-white">{stats.msgCount}</span></div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><FileText size={16} /> <span className="text-xs">{t.stats.words}</span></div><span className="text-2xl font-mono font-bold text-white">{stats.wordCount}</span></div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><Calendar size={16} /> <span className="text-xs">{t.stats.created}</span></div><span className="text-sm font-mono font-bold text-white">{stats.created}</span></div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><Clock size={16} /> <span className="text-xs">{t.stats.tokens}</span></div><span className="text-sm font-mono font-bold text-white">~{stats.tokenEst}</span></div>
                        </div>
                    </div>
                )}
                {activeTab === 'search' && (
                    <div className="animate-[fadeIn_0.3s_ease-out] h-full flex flex-col">
                        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-violet-500 transition-colors" autoFocus /></div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {searchResults.length === 0 ? <div className="text-center text-slate-500 mt-10"><Search size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">{t.noResults}</p></div> : searchResults.map((m, i) => (
                                <button key={i} onClick={() => onMessageClick(m.id)} className="w-full text-left p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
                                    <div className="flex justify-between items-center mb-1"><span className={`text-[10px] font-bold uppercase ${m.role === 'user' ? 'text-pink-400' : 'text-violet-400'}`}>{m.role === 'user' ? 'You' : 'GTayr'}</span><span className="text-[10px] text-slate-600">{new Date(m.timestamp).toLocaleTimeString()}</span></div>
                                    <p className="text-xs text-slate-300 line-clamp-2 group-hover:text-white transition-colors">{m.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, idx) => part.toLowerCase() === searchQuery.toLowerCase() ? <span key={idx} className="bg-violet-500/40 text-white font-bold">{part}</span> : part)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'media' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        {mediaItems.length === 0 ? <div className="text-center text-slate-500 mt-20"><ImageIcon size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">{t.noMedia}</p></div> : <div className="grid grid-cols-2 gap-3">
                            {mediaItems.map((item, i) => (
                                <div key={i} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group">
                                    {item.type === 'image' && item.src ? <img src={item.src} alt="media" className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center flex-col gap-2"><FileText size={24} className="text-slate-400" /><span className="text-[10px] text-slate-500">Document</span></div>}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {item.type === 'image' && item.src && <a href={item.src} download={`oni-media-${i}.png`} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>}
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};