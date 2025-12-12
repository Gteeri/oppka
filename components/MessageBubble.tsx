
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Message, Role, UserSettings } from '../types';
import { Logo } from './Logo';
import { Copy, Check, Sparkles, Folder, Play, FileCode, ChevronDown, ChevronRight, Loader2, Cpu, Terminal, Zap, Reply, Trash2, Volume2, Info, MoreHorizontal } from 'lucide-react';
import { ACCENT_THEMES } from '../constants';

interface MessageBubbleProps {
  message: Message;
  isHighlighted?: boolean;
  settings?: UserSettings;
  onOpenWorkspace?: () => void;
  onReply?: (text: string) => void;
  onDelete?: (id: string) => void;
  onSpeak?: (text: string) => void;
  onDetails?: (id: string) => void;
}

interface CodeBlockProps {
    language: string;
    code: string;
}

// Custom Code Block Component (For Snippets)
const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-[#0d0d16] border border-white/10 shadow-xl group w-full max-w-full min-w-0">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider ml-2">
            {language || 'TERMINAL'}
            </span>
        </div>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar touch-pan-x">
        <pre className="text-sm font-mono text-slate-300 leading-relaxed w-full max-w-full min-w-0">
          {code}
        </pre>
      </div>
    </div>
  );
};

// --- PROJECT BUILDER (LOADING STATE v2) ---
interface ProjectBuilderProps {
    files: string[];
    accent: any;
    theme: 'light' | 'dark';
}

const ProjectBuilder: React.FC<ProjectBuilderProps> = ({ files, accent, theme }) => {
    const [logLines, setLogLines] = useState<string[]>([]);
    
    // Matrix style log generation
    useEffect(() => {
        const lastFile = files[files.length - 1];
        if (lastFile) {
            setLogLines(prev => [...prev.slice(-4), `> compiling: ${lastFile}... OK`]);
        }
    }, [files.length]);

    return (
        <div className={`mt-0 mb-6 w-full max-w-full overflow-hidden relative rounded-xl border font-mono ${theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10 backdrop-blur-md'}`}>
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10px] w-full animate-[shimmer_2s_linear_infinite] opacity-10 pointer-events-none"></div>
            
            <div className={`p-4 border-b ${theme === 'light' ? 'border-slate-200 bg-white/50' : 'border-white/5 bg-white/5'} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                     <div className={`relative flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br ${accent.gradient}`}>
                         <Terminal size={16} className="text-white animate-pulse" />
                     </div>
                     <div>
                         <h4 className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                             GTayr System <span className="text-[9px] opacity-60 ml-2">v2.0.4</span>
                         </h4>
                         <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                             Building Project Environment...
                         </p>
                     </div>
                </div>
                <Loader2 size={16} className={`animate-spin ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>

            <div className="p-4 space-y-2">
                {/* File Grid */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {files.map((f, i) => (
                        <div key={i} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1.5 animate-[fadeIn_0.3s_ease-out] ${theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-green-400'}`}>
                            {i === files.length - 1 ? <Loader2 size={10} className="animate-spin"/> : <Check size={10} />}
                            <span className="truncate max-w-[150px]">{f}</span>
                        </div>
                    ))}
                </div>

                {/* Terminal Logs */}
                <div className={`text-[10px] space-y-1 p-3 rounded opacity-80 ${theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-black/50 text-slate-400'}`}>
                    {logLines.map((line, i) => (
                        <div key={i} className="font-mono break-all whitespace-pre-wrap">{line}</div>
                    ))}
                    <div className="font-mono animate-pulse">_</div>
                </div>
            </div>
        </div>
    );
};

// --- PROJECT CARD COMPONENT ---
interface ProjectCardProps {
    files: string[];
    onOpen: () => void;
    accent: any;
    theme: 'light' | 'dark';
}

const ProjectCard: React.FC<ProjectCardProps> = ({ files, onOpen, accent, theme }) => {
    return (
        <div className={`mt-0 mb-6 p-1 rounded-2xl bg-gradient-to-r ${accent.gradient} animate-[fadeIn_0.5s_ease-out] group cursor-pointer hover:scale-[1.01] transition-transform`} onClick={onOpen}>
             <div className={`rounded-xl p-5 overflow-hidden relative ${theme === 'light' ? 'bg-white' : 'bg-[#131020]'}`}>
                 
                 <div className="flex items-start justify-between relative z-10">
                     <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl bg-gradient-to-br ${accent.gradient} shadow-lg`}>
                             <Zap size={24} className="text-white fill-white" />
                         </div>
                         <div>
                             <h4 className={`text-base font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Project Ready</h4>
                             <p className="text-xs text-slate-500 mt-0.5">{files.length} core modules generated</p>
                         </div>
                     </div>
                     <button 
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}
                     >
                         <Play size={14} className="fill-current" /> LAUNCH
                     </button>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-dashed border-slate-500/20">
                     <div className="flex flex-wrap gap-2">
                         {files.slice(0, 4).map((f, i) => (
                             <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border max-w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                                 <FileCode size={10} className="flex-shrink-0" /> 
                                 <span className="truncate">{f}</span>
                             </div>
                         ))}
                         {files.length > 4 && <div className="text-[10px] text-slate-500 self-center">+{files.length - 4} more</div>}
                     </div>
                 </div>
             </div>
        </div>
    )
}

// Helper to parse text AND STRIP file code blocks from it, even while streaming
const parseContent = (text: string) => {
  if (!text) return { parts: [], files: [], cleanedText: '' };
  
  // 1. Extract File names for the Builder UI (using matchAll to get all headers)
  const fileHeaderRegex = /### FILE: (.+)/g;
  const files = [...text.matchAll(fileHeaderRegex)].map(m => m[1].trim());

  // 2. Stream-Aware Content Cleaning
  let visibleText = "";
  let remaining = text;
  
  while (true) {
      const startIdx = remaining.indexOf("### FILE:");
      if (startIdx === -1) {
          visibleText += remaining;
          break;
      }
      
      visibleText += remaining.substring(0, startIdx);
      const blockStart = remaining.substring(startIdx);
      const firstBacktick = blockStart.indexOf("```");
      if (firstBacktick === -1) {
          remaining = "";
          break;
      }
      const closingBacktick = blockStart.indexOf("```", firstBacktick + 3);
      if (closingBacktick === -1) {
          remaining = "";
          break;
      }
      remaining = blockStart.substring(closingBacktick + 3);
  }

  const cleanedText = visibleText.trim();

  // 3. Parse Snippets in the cleaned text (standard markdown parsing)
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: cleanedText.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'text', content: match[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < cleanedText.length) {
    parts.push({ type: 'text', content: cleanedText.slice(lastIndex) });
  }

  return { parts, files, cleanedText };
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, isHighlighted, settings, onOpenWorkspace, onReply, onDelete, onSpeak, onDetails 
}) => {
  const isUser = message.role === Role.USER;
  const [imgError, setImgError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  
  // Use Memo to prevent re-parsing on every render
  const { parts, files } = useMemo(() => parseContent(message.text), [message.text]);
  
  const hasProject = files.length > 0;
  
  const accentKey = settings?.accent || 'default';
  const theme = ACCENT_THEMES[accentKey];
  const userGradient = `bg-gradient-to-br ${theme.gradient}`;
  const isLightTheme = settings?.theme === 'light';

  // Context Menu Logic
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      // Calculate position
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 250);
      setContextMenu({ x, y });
  };

  const handleMobileMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Position menu relative to the button but ensure it fits screen
      const menuWidth = 180;
      const x = Math.min(rect.left - menuWidth + 40, window.innerWidth - menuWidth - 10);
      const y = rect.bottom + 10;
      setContextMenu({ x, y });
  }

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
      const handleClick = () => setContextMenu(null);
      if (contextMenu) {
          window.addEventListener('click', handleClick);
          window.addEventListener('scroll', handleClick);
      }
      return () => {
          window.removeEventListener('click', handleClick);
          window.removeEventListener('scroll', handleClick);
      }
  }, [contextMenu]);

  return (
    <div 
      id={`msg-${message.id}`}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group animate-[fadeIn_0.5s_cubic-bezier(0.2,0.8,0.2,1)] mb-4 md:mb-6`}
    >
      <div className={`flex max-w-full md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 md:gap-3 px-2 md:px-0`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 mb-1 hidden md:block`}>
           {isUser ? null : (
               <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${theme.gradient} p-[1px] ${theme.glow}`}>
                 <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightTheme ? 'bg-white' : 'bg-black/80 backdrop-blur-sm'}`}>
                     <Logo className="w-5 h-5" accent={accentKey} />
                 </div>
               </div>
           )}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col space-y-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} w-full max-w-full`}>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {message.attachments.map((att, index) => (
                <div key={index} className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 max-w-[150px] md:max-w-[180px] group/att transition-transform hover:scale-105">
                  {att.mimeType.startsWith('image/') ? (
                      <img src={`data:${att.mimeType};base64,${att.data}`} alt="Attachment" className="w-full h-auto object-cover block"/>
                  ) : (
                      <div className="bg-slate-800 p-4 text-xs font-mono text-slate-300 flex items-center gap-2">
                          <span className="p-2 bg-white/10 rounded-lg">📄</span> FILE
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text/Code Bubble */}
          {(message.text || message.isStreaming) && (
            <div className="relative group/bubble max-w-full">
                <div
                onContextMenu={handleContextMenu}
                className={`relative px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl text-sm md:text-[15px] leading-relaxed shadow-lg backdrop-blur-md transition-all duration-500 break-words overflow-hidden cursor-auto ${
                    isUser
                    ? `${userGradient} text-white rounded-tr-sm ${theme.glow}`
                    : `${isLightTheme ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-white/5 border border-white/10 text-slate-100'} rounded-tl-sm`
                } ${message.isError ? 'border-red-500 bg-red-500/10 text-red-500 font-medium' : ''} ${
                    isHighlighted || contextMenu 
                    ? `ring-2 shadow-[0_0_40px_rgba(139,92,246,0.4)] z-50` 
                    : ''
                }`}
                style={{ borderColor: (isHighlighted || contextMenu) ? theme.colors[0] : undefined }}
                >
                {hasProject && !isUser && (
                    message.isStreaming ? (
                        <ProjectBuilder 
                            files={files} 
                            accent={theme} 
                            theme={isLightTheme ? 'light' : 'dark'} 
                        />
                    ) : (
                        <ProjectCard 
                            files={files} 
                            onOpen={() => onOpenWorkspace?.()} 
                            accent={theme} 
                            theme={isLightTheme ? 'light' : 'dark'} 
                        />
                    )
                )}

                {parts.map((part, i) => {
                    if (part.type === 'code') {
                    return <CodeBlock key={i} language={part.lang!} code={part.content!} />;
                    }
                    
                    return (
                    <span key={i} className="whitespace-pre-wrap break-words max-w-full">
                        {part.content?.split(/(\*\*.*?\*\*)/g).map((subPart, j) => 
                            subPart.startsWith('**') && subPart.endsWith('**') 
                            ? <strong key={j} className={`${isUser || isLightTheme ? 'text-inherit font-extrabold' : 'text-white font-bold'} tracking-wide`}>{subPart.slice(2, -2)}</strong> 
                            : subPart
                        )}
                    </span>
                    );
                })}
                
                {message.isStreaming && !hasProject && (
                    <span className={`inline-block w-1.5 h-4 ml-1 animate-pulse shadow-[0_0_10px_white] ${isUser ? 'bg-white' : isLightTheme ? 'bg-slate-900' : 'bg-white'}`}></span>
                )}
                
                {/* Mobile Menu Trigger (Visible on tap/hover logic) */}
                <button 
                    onClick={handleMobileMenu}
                    className={`absolute bottom-1 right-1 p-1.5 rounded-full bg-black/10 text-current backdrop-blur md:hidden opacity-70 active:opacity-100 z-10`}
                >
                    <MoreHorizontal size={14} />
                </button>

                </div>
                
                {/* Desktop Hover Menu Trigger */}
                <button 
                    onClick={handleMobileMenu}
                    className={`hidden md:block absolute top-2 ${isUser ? '-left-8' : '-right-8'} p-1.5 rounded-full bg-black/40 text-white backdrop-blur border border-white/10 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10`}
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>
          )}

          {/* Generated Image */}
          {message.image && message.image !== 'pending' && !imgError && (
            <div 
              onContextMenu={handleContextMenu}
              className={`relative mt-2 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black group/image transition-all hover:scale-[1.01] duration-500 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
              <img 
                src={message.image} 
                alt="Generated Art" 
                className="max-w-full h-auto max-h-[400px] md:max-h-[500px] object-contain block"
                onError={() => setImgError(true)}
              />
              <a 
                href={message.image} 
                download={`gtayr-art-${Date.now()}.png`}
                className="absolute bottom-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md opacity-100 md:opacity-0 group-hover/image:opacity-100 transition-all translate-y-0 md:translate-y-2 md:group-hover/image:translate-y-0 text-xs font-bold flex items-center gap-2"
              >
                  DOWNLOAD
              </a>
            </div>
          )}
          
          {/* Pending States */}
          {message.image === 'pending' && (
              <div className={`mt-2 ml-1 p-1 rounded-2xl bg-gradient-to-r ${theme.gradient} bg-[length:200%_auto] animate-shimmer`}>
                  <div className={`${isLightTheme ? 'bg-white' : 'bg-[#131020]'} rounded-[14px] p-4 flex items-center gap-4`}>
                     <Sparkles className="animate-pulse text-current" size={20} style={{ color: theme.colors[0] }} />
                     <span className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.gradient}`}>Creating Masterpiece...</span>
                  </div>
              </div>
          )}
          
          {/* Timestamp / Status */}
          <div className={`px-1 text-[10px] font-medium ${isLightTheme ? 'text-slate-400' : 'text-slate-600'}`}>
             {!isUser && !message.isStreaming && !message.isError && "GTayr"}
          </div>

        </div>
      </div>

      {/* --- TELEGRAM STYLE CONTEXT MENU --- */}
      {contextMenu && (
          <div 
             className={`fixed z-[9999] w-[180px] rounded-xl shadow-2xl overflow-hidden border backdrop-blur-xl animate-[fadeIn_0.1s_ease-out] flex flex-col p-1 ${isLightTheme ? 'bg-white/95 border-slate-200 shadow-slate-200/50' : 'bg-[#1e1e1e]/95 border-white/10'}`}
             style={{ top: contextMenu.y, left: contextMenu.x }}
             onClick={(e) => e.stopPropagation()}
          >
              <MenuButton 
                  icon={Reply} 
                  label="Reply" 
                  onClick={() => { onReply?.(message.text); closeContextMenu(); }} 
                  isLight={isLightTheme} 
              />
              <MenuButton 
                  icon={Copy} 
                  label="Copy Text" 
                  onClick={() => { navigator.clipboard.writeText(message.text); closeContextMenu(); }} 
                  isLight={isLightTheme} 
              />
              {onSpeak && message.text && (
                  <MenuButton 
                      icon={Volume2} 
                      label="Speak" 
                      onClick={() => { onSpeak(message.text); closeContextMenu(); }} 
                      isLight={isLightTheme} 
                  />
              )}
              {onDetails && (
                  <MenuButton 
                      icon={Info} 
                      label="Details" 
                      onClick={() => { onDetails(message.id); closeContextMenu(); }} 
                      isLight={isLightTheme} 
                  />
              )}
              <div className={`h-px w-full my-1 ${isLightTheme ? 'bg-slate-200' : 'bg-white/10'}`}></div>
              <MenuButton 
                  icon={Trash2} 
                  label="Delete" 
                  onClick={() => { onDelete?.(message.id); closeContextMenu(); }} 
                  isLight={isLightTheme} 
                  danger 
              />
          </div>
      )}

      {/* Backdrop for mobile context menu click-away */}
      {contextMenu && (
        <div className="fixed inset-0 z-[9998]" onClick={closeContextMenu}></div>
      )}

    </div>
  );
};

const MenuButton = ({ icon: Icon, label, onClick, isLight, danger }: { icon: any, label: string, onClick: () => void, isLight: boolean, danger?: boolean }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
            danger 
            ? 'text-red-500 hover:bg-red-500/10' 
            : isLight 
                ? 'text-slate-700 hover:bg-slate-100 active:bg-slate-200' 
                : 'text-slate-200 hover:bg-white/10 active:bg-white/20'
        }`}
    >
        <Icon size={16} className={danger ? 'text-red-500' : isLight ? 'text-slate-500' : 'text-slate-400'} />
        {label}
    </button>
);
