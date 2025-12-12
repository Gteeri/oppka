
import React, { useState, useEffect, useRef } from 'react';
import { VirtualFile, UserSettings, Language } from '../types';
import { ACCENT_THEMES } from '../constants';
import { X, FileCode, FileJson, FileType, Play, Code, Layers, Maximize2, Minimize2, ChevronRight, ChevronDown, Download, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';

interface WorkspacePanelProps {
  files: VirtualFile[];
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  lang: Language;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ files, isOpen, onClose, settings, lang }) => {
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const prevFilesLength = useRef(0);
  
  const accent = ACCENT_THEMES[settings.accent || 'default'];
  
  useEffect(() => {
      // Auto-select initial file if none selected
      if (files.length > 0 && !activeFile) {
          const indexHtml = files.find(f => f.name && f.name.includes('index.html'));
          setActiveFile(indexHtml || files[files.length - 1]);
      }

      // If new files added (e.g. AI updated code), switch to the new file and refresh preview
      if (files.length > prevFilesLength.current) {
           const latest = files[files.length - 1];
           if (!activeFile || viewMode === 'code') setActiveFile(latest);
           setPreviewKey(k => k + 1);
      }
      prevFilesLength.current = files.length;
  }, [files, activeFile, viewMode]);

  useEffect(() => {
      if (viewMode === 'preview') {
          setPreviewKey(prev => prev + 1);
      }
  }, [viewMode]);

  const getFileIcon = (name?: string) => {
      if (!name) return <FileCode size={14} className="text-slate-400" />;
      if (name.endsWith('.html')) return <FileType size={14} className="text-[#E34F26]" />; 
      if (name.endsWith('.css')) return <FileCode size={14} className="text-[#1572B6]" />; 
      if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx')) return <FileCode size={14} className="text-[#F7DF1E]" />; 
      if (name.endsWith('.json')) return <FileJson size={14} className="text-[#CBCB41]" />;
      return <FileCode size={14} className="text-slate-400" />;
  };

  /**
   * ADVANCED PREVIEW GENERATOR
   * Transforms multiple source files (HTML/CSS/JS/React) into a single executable HTML string.
   * Handles: Babel compilation for JSX, Tailwind injection, and Module flattening.
   */
  const generatePreview = () => {
      const htmlFile = files.find(f => f.name && f.name.toLowerCase().includes('index.html'));
      let content = htmlFile?.content || `
        <!DOCTYPE html>
        <html>
            <head><meta charset="utf-8"><title>Preview</title></head>
            <body class="bg-white flex items-center justify-center h-screen text-slate-400">
                <div>No index.html detected. Rendering raw modules...</div>
                <div id="root"></div>
            </body>
        </html>
      `;

      // 1. Detect Stack
      const jsFiles = files.filter(f => f.name && /\.(js|jsx|ts|tsx)$/.test(f.name));
      const cssFiles = files.filter(f => f.name && f.name.endsWith('.css'));
      const isReact = jsFiles.some(f => f.content.includes('react') || f.content.includes('React') || f.name.endsWith('jsx'));

      // 2. Prepare CSS
      // Remove @tailwind directives because we use CDN, they break standard CSS parsers
      const combinedCss = cssFiles.map(c => c.content.replace(/@tailwind.*/g, '')).join('\n');
      
      // 3. Prepare JS (Flattening Modules)
      // AI generates 'import X from "./X"'. We must strip these local imports 
      // and concatenate files in a logical order (utils -> components -> app -> index)
      // We also strip 'export default' so items are available in the global scope of the module block.
      
      // Heuristic sorting: index/main last, components middle, utils first.
      const sortedJs = [...jsFiles].sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA.includes('index') || nameA.includes('main')) return 1;
          if (nameB.includes('index') || nameB.includes('main')) return -1;
          return 0;
      });

      let combinedJs = "";
      sortedJs.forEach(f => {
          let code = f.content;
          
          // STRIP LOCAL IMPORTS (e.g. import App from './App')
          // We keep library imports (e.g. import React from 'react') to be handled by ImportMap
          code = code.replace(/import\s+.*from\s+['"]\.\/.*['"];?/g, '');
          
          // STRIP EXPORTS
          code = code.replace(/export\s+default\s+/g, '');
          code = code.replace(/export\s+/g, '');
          
          // Add File Header for debug
          combinedJs += `\n/* --- ${f.name} --- */\n${code}\n`;
      });

      // 4. Construct Head Injections
      const tailwindCDN = `<script src="https://cdn.tailwindcss.com"></script>`;
      const babelCDN = isReact ? `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>` : '';
      
      // Error Overlay to show "White Screen" causes
      const errorOverlay = `
        <script>
          window.onerror = function(msg, url, line, col, error) {
            const div = document.createElement('div');
            div.style = 'position:fixed;top:0;left:0;width:100%;background:#ffe6e6;color:#cc0000;padding:20px;z-index:9999;font-family:monospace;box-sizing:border-box;border-bottom:2px solid #ff0000;';
            div.innerHTML = '<strong>Preview Error:</strong><br/>' + msg + '<br/><small>' + (url || 'inline') + ':' + line + '</small>';
            document.body.appendChild(div);
            return false;
          };
          window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled rejection (promise):', event.promise, 'reason:', event.reason);
          });
        </script>
      `;

      // Import Map for React
      const importMap = isReact ? `
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react"
          }
        }
        </script>
      ` : '';

      // 5. Inject CSS
      if (combinedCss) {
          const styleTag = `<style>${combinedCss}</style>`;
          if (content.includes('</head>')) content = content.replace('</head>', `${styleTag}</head>`);
          else content = `${styleTag}${content}`;
      }

      // 6. Inject Scripts & CDNs
      const headInjection = `${errorOverlay}${tailwindCDN}${babelCDN}${importMap}`;
      if (content.includes('<head>')) {
          content = content.replace('<head>', `<head>${headInjection}`);
      } else {
          content = `${headInjection}${content}`;
      }

      // 7. Inject User JS
      // For React: type="text/babel" to compile JSX. 
      // We assume variables are global since we stripped modules.
      if (combinedJs) {
          const scriptType = isReact ? 'text/babel' : 'text/javascript';
          // We use data-presets to ensure React is handled
          const scriptTag = `<script type="${scriptType}" data-type="module" data-presets="env,react">${combinedJs}</script>`;
          
          if (content.includes('</body>')) {
              content = content.replace('</body>', `${scriptTag}</body>`);
          } else {
              content += scriptTag;
          }
      }

      return content;
  };

  const handleDownload = async () => {
      if (files.length === 0) return;
      setIsDownloading(true);
      try {
          const zip = new JSZip();
          files.forEach(file => {
              if (file.name && file.content) {
                  zip.file(file.name, file.content);
              }
          });

          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gtayr-project-${Date.now()}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Download failed", e);
      } finally {
          setIsDownloading(false);
      }
  };

  const CodeEditor = ({ content }: { content: string }) => {
      const lines = content.split('\n');
      return (
          <div className="flex font-mono text-sm leading-6 h-full overflow-auto custom-scrollbar">
              <div className="flex-shrink-0 text-right pr-4 select-none text-[#858585] bg-[#1e1e1e] w-12 border-r border-[#333] py-4">
                  {lines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                  ))}
              </div>
              <div className="pl-4 text-[#d4d4d4] whitespace-pre w-full py-4 bg-[#1e1e1e]">
                  {content}
              </div>
          </div>
      );
  };

  if (isPreviewFullScreen) {
      return (
          <div className="fixed inset-0 z-[200] bg-white animate-[fadeIn_0.2s_ease-out]">
               <iframe 
                    key={`fullscreen-${previewKey}`}
                    title="fullscreen-preview"
                    srcDoc={generatePreview()}
                    className="w-full h-full border-none bg-white"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
               />
               <button 
                  onClick={() => setIsPreviewFullScreen(false)}
                  className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all hover:scale-105"
               >
                   <Minimize2 size={16} /> Exit Full Screen
               </button>
          </div>
      );
  }

  return (
    <>
        <div 
            className={`fixed inset-0 z-[100] bg-[#1e1e1e] text-[#cccccc] font-sans text-[13px] flex flex-col transform transition-transform duration-300
                ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <div className="h-12 bg-[#252526] flex items-center justify-between px-4 select-none border-b border-[#333]">
                <div className="flex items-center gap-3">
                    <Layers size={18} className="text-violet-400" />
                    <span className="font-bold text-white text-sm">GTayr IDE</span>
                    {activeFile && <span className="text-[#858585] text-xs hidden md:inline">— {activeFile.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#333] transition-colors text-white mr-2"
                        title="Download ZIP"
                     >
                        <Download size={14} />
                        <span className="hidden md:inline">{isDownloading ? 'Zipping...' : 'Export'}</span>
                     </button>

                     <button 
                         onClick={() => setPreviewKey(k => k + 1)}
                         className="p-2 hover:bg-[#333] rounded text-[#cccccc]"
                         title="Reload Preview"
                     >
                         <RefreshCw size={14} />
                     </button>

                     <button 
                        onClick={() => setViewMode(viewMode === 'code' ? 'preview' : 'code')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all font-bold ${viewMode === 'preview' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'bg-[#333] text-white hover:bg-[#444]'}`}
                    >
                        {viewMode === 'code' ? <Play size={14} fill="currentColor" /> : <Code size={14} />}
                        <span>{viewMode === 'code' ? 'RUN' : 'EDITOR'}</span>
                    </button>
                    
                    {viewMode === 'preview' && (
                        <button 
                            onClick={() => setIsPreviewFullScreen(true)} 
                            className="p-2 hover:bg-[#333] rounded text-[#cccccc] flex items-center gap-2"
                            title="Full Screen Preview"
                        >
                            <Maximize2 size={16} />
                            <span className="hidden md:inline text-xs">Full Screen</span>
                        </button>
                    )}

                    <button onClick={onClose} className="p-2 ml-2 hover:bg-[#c53030] hover:text-white rounded text-[#cccccc]">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-56 bg-[#252526] flex flex-col border-r border-[#333] hidden md:flex">
                    <div className="p-3 text-[11px] font-bold text-[#bbbbbb] tracking-wider flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setFolderOpen(!folderOpen)}>
                        {folderOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        PROJECT FILES
                    </div>
                    
                    {folderOpen && (
                        <div className="flex-1 overflow-y-auto">
                            {files.length === 0 && (
                                <div className="p-4 text-center text-[#666] italic text-xs mt-10">
                                    No files yet.<br/>Ask GTayr to create a project.
                                </div>
                            )}
                            {files.map((file, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setActiveFile(file); setViewMode('code'); }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-[#2a2d2e] transition-colors cursor-pointer border-l-2 ${activeFile?.name === file.name ? 'bg-[#37373d] text-white border-violet-500' : 'text-[#cccccc] border-transparent'}`}
                                >
                                    {getFileIcon(file.name)}
                                    <span className="truncate">{file.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
                    
                    {viewMode === 'code' && (
                        <div className="flex bg-[#252526] overflow-x-auto no-scrollbar">
                            {files.map((file, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveFile(file)}
                                    className={`flex items-center gap-2 px-4 py-2.5 min-w-[120px] max-w-[200px] border-r border-[#333] text-xs cursor-pointer hover:bg-[#1e1e1e] transition-colors ${activeFile?.name === file.name ? 'bg-[#1e1e1e] text-white border-t-2 border-t-violet-500' : 'bg-[#2d2d2d] text-[#969696] border-t-2 border-t-transparent'}`}
                                >
                                    {getFileIcon(file.name)}
                                    <span className="truncate">{file.name}</span>
                                    {activeFile?.name === file.name && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-violet-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden relative">
                        {viewMode === 'preview' ? (
                            <iframe 
                                key={previewKey}
                                title="preview"
                                srcDoc={generatePreview()}
                                className="w-full h-full bg-white"
                                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                            />
                        ) : (
                            activeFile ? (
                                <CodeEditor content={activeFile.content} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-[#555] flex-col">
                                    <div className="text-center opacity-30">
                                        <Layers size={64} className="mx-auto mb-4" />
                                        <p className="text-lg">Select a file to start editing</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
            
            <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] select-none">
                 <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer">
                         <Code size={10} />
                         <span>main*</span>
                     </div>
                     {viewMode === 'preview' && (
                         <div className="flex items-center gap-1 bg-green-500/20 px-2 rounded">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                             Live Preview
                         </div>
                     )}
                 </div>
                 <div className="flex items-center gap-4">
                     {activeFile && <span>Ln {activeFile.content.split('\n').length}, Col 1</span>}
                     <span className="hidden md:inline">UTF-8</span>
                     <span>{activeFile?.language === 'javascript' ? 'JavaScript' : activeFile?.language === 'html' ? 'HTML' : 'Plain Text'}</span>
                 </div>
            </div>
        </div>
    </>
  );
};
