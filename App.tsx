
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ChatSession, User, Attachment, Language, UserSettings, Plan, AIModel, VirtualFile } from './types';
import { streamOnixResponse, generateOnixImage, generateSpeech } from './services/geminiService';
import { verifyGithubToken, loadSessionsFromGithub, syncSessionsToGithub, saveUserProfile } from './services/githubStorage';
import { signInWithTwitter, signInWithDiscord, getSupabaseSession } from './services/supabaseService';
import { keyDatabase } from './services/keyDatabase';
import { MessageBubble } from './components/MessageBubble';
import { Logo } from './components/Logo';
import { VoiceModal } from './components/VoiceModal';
import { ProfileMenu } from './components/ProfileMenu';
import { UpgradePromo } from './components/UpgradePromo';
import { GuestPromo } from './components/GuestPromo';
import { UpgradeModal } from './components/UpgradeModal';
import { GuestLoginModal } from './components/GuestLoginModal';
import { ChatDetailsModal } from './components/ChatDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { ModelSelectionModal } from './components/ModelSelectionModal';
import { WorkspacePanel } from './components/WorkspacePanel';
import { OfficeSuite } from './components/OfficeSuite';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { UI_TEXT, MAX_DAILY_IMAGES, ACCENT_THEMES, MAX_STORED_CHATS } from './constants';
import { Paperclip, Send, Mic, Image as ImageIcon, X, Github, ArrowRight, PanelLeft, Sparkles, Palette, Code, ShoppingBag, Map, Brain, Atom, ChevronDown, Lock, Layers, Briefcase } from 'lucide-react';

// --- ICONS ---
const DiscordIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.942 5.556a16.3 16.3 0 0 0-4.126-1.3 0.07 0.07 0 0 0-0.07 0.03 11.25 11.25 0 0 0-0.5 1.024 15.023 15.023 0 0 0-4.49 0 11.33 11.33 0 0 0-0.5-1.024 0.07 0.07 0 0 0-0.07-0.03 16.27 16.27 0 0 0-4.128 1.3 0.05 0.05 0 0 0-0.02 0.08 16.75 16.75 0 0 0 3.37 8.52 0.05 0.05 0 0 0 0.08-0.01 11.95 11.95 0 0 0 3.6-1.78 0.06 0.06 0 0 0 0-0.08 8.6 8.6 0 0 1-1.37-0.66 0.05 0.05 0 0 1 0.05-0.09c0.27 0.13 0.54 0.27 0.81 0.4a0.05 0.05 0 0 1 0.01 0.08 12.01 12.01 0 0 0 9.8 0 0.05 0.05 0 0 1 0.01-0.08c0.27-0.12 0.54-0.26 0.81-0.4a0.05 0.05 0 0 1 0.05 0.09 8.24 8.24 0 0 1-1.38 0.66 0.06 0.06 0 0 0 0 0.08 11.92 11.92 0 0 0 3.6 1.78 0.05 0.05 0 0 0 0.08 0.01 16.72 16.72 0 0 0 3.39-8.52 0.06 0.06 0 0 0-0.02-0.08zM8.5 14.5c-0.89 0-1.6-0.82-1.6-1.83 0-1 0.69-1.83 1.6-1.83 0.92 0 1.64 0.83 1.6 1.83 0 1-0.68 1.83-1.6 1.83zm7 0c-0.89 0-1.6-0.82-1.6-1.83 0-1 0.69-1.83 1.6-1.83 0.92 0 1.64 0.83 1.6 1.83 0 1-0.68 1.83-1.6 1.83z" />
    </svg>
);

const TwitterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h0.001zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
);

const TelegramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm5.225 8.875-1.925 9.075c-.15.6-.487.75-1.012.45l-2.775-2.062-1.35 1.312c-.15.15-.263.263-.525.263l.188-2.85 5.175-4.688c.225-.225-.038-.338-.338-.15L5.7 13.5l-2.738-.863c-.6-.188-.6-.6.113-.863l10.688-4.125c.488-.188.938.113.8.788z"/>
    </svg>
);

const SearchMessageIcon = ({ settings }: { settings: UserSettings }) => {
    const uniqueId = React.useId();
    const gradId = `searchGradient-${uniqueId.replace(/:/g, '')}`;
    const accent = ACCENT_THEMES[settings.accent || 'default'];
    const [startColor, endColor] = accent.colors;
    
    return (
        <div className="relative w-6 h-6 group">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transition-transform group-hover:scale-110 duration-300">
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={startColor} />
                        <stop offset="100%" stopColor={endColor} />
                    </linearGradient>
                </defs>
                <path d="M21 11.5C21.0031 12.8199 20.6951 14.1272 20.1039 15.3078C19.5127 16.4884 18.6568 17.5056 17.6127 18.2694C16.5686 19.0332 15.3688 19.5204 14.1197 19.6879C12.8705 19.8554 11.6102 19.698 10.4504 19.2299" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="11" r="5" className={settings.theme === 'light' ? "fill-white/50" : "fill-[#0f0a1e]/50"} stroke={`url(#${gradId})`} strokeWidth="1.5"/>
                <path d="M19 19L15 15" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        </div>
    );
};

const DEFAULT_SETTINGS: UserSettings = { style: 'auto', customPrompt: '', theme: 'dark', accent: 'default', selectedModel: 'gti-5' };

const App: React.FC = () => {
  const [isAppInitializing, setIsAppInitializing] = useState(true); 
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [lang, setLang] = useState<Language>('en');
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [loginView, setLoginView] = useState<'main' | 'github'>('main');
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isGuestLoginModalOpen, setIsGuestLoginModalOpen] = useState(false);
  const [isChatDetailsOpen, setIsChatDetailsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  
  // Workspace State
  const [workspaceFiles, setWorkspaceFiles] = useState<VirtualFile[]>([]);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const workspaceOpenRef = useRef(false);

  // Office Hub State
  const [isOfficeOpen, setIsOfficeOpen] = useState(false);

  const t = UI_TEXT[lang];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync ref with state
  useEffect(() => { workspaceOpenRef.current = isWorkspaceOpen; }, [isWorkspaceOpen]);

  // Dynamic Theme Colors Helper
  const colors = {
      bg: settings.theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#05040a]',
      text: settings.theme === 'light' ? 'text-slate-900' : 'text-white',
      subText: settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400',
      panel: settings.theme === 'light' ? 'bg-white/80 border-slate-200 shadow-xl' : 'bg-[#0d0d16]/90 border-white/5',
      sidebar: settings.theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-[#0d0d16]/90 border-white/5',
      input: settings.theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-[#0d0d16]/80 border-white/10',
      glass: settings.theme === 'light' ? 'glass-panel-light' : 'glass-panel',
      hover: settings.theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5',
  };

  const currentAccent = ACCENT_THEMES[settings.accent || 'default'];

  // Initialization
  useEffect(() => {
    const initApp = async () => {
        try {
            const browserLang = navigator.language.startsWith('ru') ? 'ru' : 'en';
            setLang((localStorage.getItem('gtayr_lang') as Language) || browserLang);
            
            // Check for logged in user in session
            const savedUser = sessionStorage.getItem('gtayr_local_user');
            if (savedUser) {
                const u = JSON.parse(savedUser);
                setUser(u);
                loadLocalSessions(u.id);
                // Load User-Specific Settings
                const userSettingsKey = `gtayr_settings_${u.id}`;
                const savedSettings = localStorage.getItem(userSettingsKey);
                if (u.settings) {
                    setSettings(u.settings); // Prefer cloud settings
                    localStorage.setItem(userSettingsKey, JSON.stringify(u.settings));
                } else if (savedSettings) {
                    setSettings(JSON.parse(savedSettings));
                } else {
                    setSettings(DEFAULT_SETTINGS);
                }
            } else {
                setSettings(DEFAULT_SETTINGS);
                // Check Supabase Redirect
                await checkSupabaseAuth();
            }

            if (window.innerWidth < 768) setIsSidebarOpen(false);
        } finally {
            setIsAppInitializing(false);
        }
    };
    initApp();
  }, []);

  useEffect(() => { localStorage.setItem('gtayr_lang', lang); }, [lang]);
  
  // Persist Settings Unique to User
  useEffect(() => { 
      if (user) {
          localStorage.setItem(`gtayr_settings_${user.id}`, JSON.stringify(settings));
          setUser(prev => prev ? ({ ...prev, settings }) : null);
      }
  }, [settings]); 
  
  // Sync workspace files to current session
  useEffect(() => {
    if (currentSessionId) {
        setSessions(prev => prev.map(s => 
            s.id === currentSessionId ? { ...s, workspaceFiles: workspaceFiles } : s
        ));
    }
  }, [workspaceFiles]);
  
  // Load workspace files when switching session
  useEffect(() => {
      const sess = sessions.find(s => s.id === currentSessionId);
      if (sess) {
          setWorkspaceFiles(sess.workspaceFiles || []);
      }
  }, [currentSessionId]);

  const checkSupabaseAuth = async () => {
      try {
          const session = await getSupabaseSession();
          if (session?.user) {
              const u: User = {
                  id: `sb_${session.user.id}`,
                  name: session.user.user_metadata.full_name || session.user.user_metadata.name || 'User',
                  username: session.user.user_metadata.user_name || session.user.user_metadata.preferred_username || `user_${session.user.id.slice(0,6)}`,
                  avatar: session.user.user_metadata.avatar_url || session.user.user_metadata.picture || `https://ui-avatars.com/api/?name=${session.user.id}&background=random`,
                  provider: 'github', // Reusing github type for Supabase auth internally
                  plan: 'free',
                  usage: { date: new Date().toDateString(), imageCount: 0 },
                  settings: DEFAULT_SETTINGS
              };
              setUser(u);
              sessionStorage.setItem('gtayr_local_user', JSON.stringify(u));
              loadLocalSessions(u.id);
          }
      } catch (e) {
          console.error("Supabase check failed", e);
      }
  };

  const handleSettingsChange = (newSettings: UserSettings) => {
      setSettings(newSettings);
      if (user) {
          const updatedUser = { ...user, settings: newSettings };
          setUser(updatedUser);
          if (user.token) {
              saveUserProfile(updatedUser);
          } else {
              sessionStorage.setItem('gtayr_local_user', JSON.stringify(updatedUser));
          }
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart) return;
      const touchEnd = e.changedTouches[0].clientX;
      if (touchStart < 50 && touchEnd - touchStart > 75) setIsSidebarOpen(true);
      setTouchStart(null);
  };

  const handleGithubLogin = async () => {
      setAuthError('');
      setIsAuthLoading(true);
      const userData = await verifyGithubToken(tokenInput);
      setIsAuthLoading(false);
      if (userData) {
          setUser(userData);
          if (userData.settings) {
              setSettings(userData.settings);
              localStorage.setItem(`gtayr_settings_${userData.id}`, JSON.stringify(userData.settings));
          } else {
              setSettings(DEFAULT_SETTINGS);
          }

          const sessions = await loadSessionsFromGithub(userData);
          setSessions(sessions);
          createNewSession();
      } else {
          setAuthError('Invalid Token');
      }
  };

  const handleTwitterLogin = async () => {
      try {
          await signInWithTwitter();
      } catch (e: any) {
          console.error(e);
          alert("Twitter Login Error: " + e.message);
      }
  };
  
  const handleDiscordLogin = async () => {
      try {
          await signInWithDiscord();
      } catch (e: any) {
          console.error(e);
          alert("Discord Login Error: " + e.message);
      }
  };

  const handleSocialMockLogin = (provider: 'telegram') => {
      const u: User = {
          id: `local_${provider}_${Date.now()}`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          username: `${provider}_user`,
          avatar: `https://ui-avatars.com/api/?name=${provider}&background=random`,
          provider: provider,
          plan: 'free',
          usage: { date: new Date().toDateString(), imageCount: 0 },
          settings: DEFAULT_SETTINGS
      };
      setUser(u);
      setSettings(DEFAULT_SETTINGS);
      sessionStorage.setItem('gtayr_local_user', JSON.stringify(u));
      loadLocalSessions(u.id);
  };

  const enterAsGuest = () => {
      const u: User = {
          id: 'guest',
          name: 'Guest',
          username: 'guest',
          avatar: 'https://ui-avatars.com/api/?name=Guest&background=334155&color=fff',
          provider: 'guest',
          isGuest: true,
          plan: 'free',
          usage: { date: new Date().toDateString(), imageCount: 0 },
          settings: DEFAULT_SETTINGS
      };
      setUser(u);
      setSettings(DEFAULT_SETTINGS);
      sessionStorage.setItem('gtayr_local_user', JSON.stringify(u));
      loadLocalSessions('guest');
  };

  const loadLocalSessions = (uid: string) => {
      const s = localStorage.getItem(`gtayr_chats_${uid}`);
      if (s) setSessions(JSON.parse(s));
      else createNewSession();
  };

  const compressSessionsForStorage = (sessions: ChatSession[]): ChatSession[] => {
      // Create a shallow copy structure, modify messages deep
      return sessions.map(session => ({
          ...session,
          messages: session.messages.map((msg, index) => {
              // Keep the last 1 message WITH image intact, strip others
              const isVeryRecent = index >= session.messages.length - 1;
              
              if (isVeryRecent) return msg;

              // If it's an old message, check for heavy payloads
              let newMsg = { ...msg };
              if (newMsg.image && newMsg.image.length > 500) {
                  newMsg.image = '[Image Saved in Cloud]'; // Placeholder to save space
              }
              if (newMsg.attachments && newMsg.attachments.length > 0) {
                  // Only keep attachments metadata if needed, or strip data from old attachments
                  newMsg.attachments = newMsg.attachments.map(att => ({
                      ...att,
                      data: '' // Strip data from old attachments
                  }));
              }
              return newMsg;
          })
      }));
  };

  const saveLocalSessions = (uid: string, newSessions: ChatSession[]) => {
      try {
          localStorage.setItem(`gtayr_chats_${uid}`, JSON.stringify(newSessions));
      } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.code === 22) {
              console.warn("Local Storage Full. Compressing images...");
              const compressed = compressSessionsForStorage(newSessions);
              try {
                  localStorage.setItem(`gtayr_chats_${uid}`, JSON.stringify(compressed));
              } catch (retryError) {
                  console.error("Critical Storage Error: Cannot save chats even after compression.", retryError);
              }
          }
      }
  };

  const handleLogout = () => {
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
      setTokenInput('');
      setLoginView('main');
      sessionStorage.clear();
      setIsProfileMenuOpen(false);
      setSettings(DEFAULT_SETTINGS); 
  };
  
  const handleDeleteAllData = () => {
      if (!user) return;
      localStorage.removeItem(`gtayr_chats_${user.id}`);
      setSessions([]);
      createNewSession();
      setIsSettingsOpen(false);
  };
  
  const handleExportData = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `gtayr_chat_history_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const text = e.target?.result as string;
              const importedSessions = JSON.parse(text);
              if (Array.isArray(importedSessions)) {
                  // Merge sessions (prepend imported ones, avoiding ID conflicts if possible, but simplicity first)
                  // We'll regenerate IDs for safety to ensure no React key conflicts
                  const cleanedSessions: ChatSession[] = importedSessions.map((s: any) => ({
                      ...s,
                      id: `${s.id}_imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                  }));
                  
                  const newSessions = [...cleanedSessions, ...sessions];
                  setSessions(newSessions);
                  
                  // Persist
                  if (user) {
                      if (user.token) syncSessionsToGithub(user, newSessions);
                      else saveLocalSessions(user.id, newSessions);
                  }
                  
                  setIsSettingsOpen(false);
                  alert(lang === 'ru' ? 'Чаты успешно импортированы!' : 'Chats imported successfully!');
              } else {
                  throw new Error("Invalid format");
              }
          } catch (err) {
              console.error("Import failed", err);
              alert(lang === 'ru' ? 'Ошибка импорта. Неверный формат файла.' : 'Import failed. Invalid file format.');
          }
      };
      reader.readAsText(file);
  };

  const activateProKey = async (key: string): Promise<{ success: boolean, error?: string }> => {
      if (!user) return { success: false, error: 'unknown' };
      if (user.isGuest) return { success: false, error: 'invalid' };
      const result = await keyDatabase.redeemKey(key, user.id);
      if (result.success && result.expiry) {
          const newUser = { ...user, plan: 'pro' as Plan, usage: { ...user.usage, imageCount: 0 }, subscriptionExpiry: result.expiry };
          setUser(newUser);
          if (user.token) saveUserProfile(newUser);
          else sessionStorage.setItem('gtayr_local_user', JSON.stringify(newUser));
          return { success: true };
      }
      return { success: false, error: result.error || 'unknown' };
  };

  const createNewSession = useCallback(() => {
    let currentSessions = [...sessions];
    if (currentSessions.length >= MAX_STORED_CHATS) {
        const sorted = [...currentSessions].sort((a, b) => a.updatedAt - b.updatedAt);
        const oldestId = sorted[0].id;
        currentSessions = currentSessions.filter(s => s.id !== oldestId);
    }

    const newSession: ChatSession = { 
        id: Date.now().toString(), 
        title: t.newChat, 
        messages: [], 
        updatedAt: Date.now(), 
        userId: user?.id,
        workspaceFiles: []
    };

    const updatedList = [newSession, ...currentSessions];
    setSessions(updatedList);
    setCurrentSessionId(newSession.id);
    setWorkspaceFiles([]);
    setInputValue('');
    setAttachments([]);
    
    if (user) {
        if (user.token) syncSessionsToGithub(user, updatedList);
        else saveLocalSessions(user.id, updatedList);
    }

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [t.newChat, user, sessions]);

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (user?.token) syncSessionsToGithub(user, newSessions);
    else if (user) saveLocalSessions(user.id, newSessions);
    if (currentSessionId === id) createNewSession();
  };

  const parseWorkspaceFiles = (text: string) => {
      const fileRegex = /### FILE: ([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;
      let match;
      const newFiles: VirtualFile[] = [];
      let found = false;

      while ((match = fileRegex.exec(text)) !== null) {
          found = true;
          const name = match[1].trim();
          const language = match[2] || 'text';
          const content = match[3];
          
          newFiles.push({ name, language, content });
      }

      if (found) {
          setWorkspaceFiles(prev => {
              const updated = [...prev];
              newFiles.forEach(nf => {
                  const idx = updated.findIndex(f => f.name === nf.name);
                  if (idx >= 0) updated[idx] = nf;
                  else updated.push(nf);
              });
              return updated;
          });
      }
      return found;
  };

  const handleSendMessage = useCallback(async (msgText?: string) => {
    const textToSend = msgText || inputValue.trim();
    if ((!textToSend && attachments.length === 0) || isLoading || !currentSessionId || !user) return;
    
    if (user.isGuest && isImageMode) {
        setIsGuestLoginModalOpen(true); 
        setIsImageMode(false);
        return;
    }

    // Image combined check
    if (isImageMode && user.plan === 'free') {
        const today = new Date().toDateString();
        let currentCount = user.usage.date === today ? user.usage.imageCount : 0;
        if (currentCount >= MAX_DAILY_IMAGES) {
             const limitMsg: Message = { id: Date.now().toString(), role: Role.MODEL, text: '', timestamp: Date.now(), showPromo: true };
             setSessions(prev => prev.map(s => s.id === currentSessionId ? {...s, messages: [...s.messages, limitMsg]} : s));
             return;
        }
        const newUsage = { date: today, imageCount: currentCount + 1 };
        setUser({ ...user, usage: newUsage });
        if (user.token) saveUserProfile({ ...user, usage: newUsage });
        else sessionStorage.setItem('gtayr_local_user', JSON.stringify({ ...user, usage: newUsage }));
    }

    const currentAttachments = [...attachments]; 
    const isImageAction = isImageMode;
    
    setInputValue(''); setAttachments([]); 
    
    const newMessageId = Date.now().toString();
    const userMessage: Message = { 
        id: newMessageId, 
        role: Role.USER, 
        text: textToSend, 
        attachments: currentAttachments, 
        timestamp: Date.now(), 
        action: isImageAction ? 'image_gen' : 'chat' 
    };

    let sessionToUpdate = sessions.find(s => s.id === currentSessionId)!;
    const updatedMessages = [...sessionToUpdate.messages, userMessage];
    const updatedSession = { ...sessionToUpdate, messages: updatedMessages, updatedAt: Date.now(), title: sessionToUpdate.messages.length === 0 ? (textToSend.slice(0,30) || (isImageAction ? 'Image' : 'New Chat')) : sessionToUpdate.title };
    const newSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
    setSessions(newSessions);
    
    if (user.token) syncSessionsToGithub(user, newSessions);
    else saveLocalSessions(user.id, newSessions);

    setIsLoading(true);
    try {
        const aiMessageId = (Date.now() + 1).toString();
        // Init AI Message placeholder
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { 
            ...s, 
            messages: [...updatedMessages, { 
                id: aiMessageId, 
                role: Role.MODEL, 
                text: '', 
                image: isImageAction ? 'pending' : undefined, 
                isStreaming: !isImageAction, 
                timestamp: Date.now() 
            }] 
        } : s));

        if (isImageAction) {
            const imageUrl = await generateOnixImage(textToSend);
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, image: imageUrl } : m) } : s));
        } else {
            let accText = '';
            await streamOnixResponse(updatedMessages, userMessage, (chunk) => {
                accText += chunk;
                // Parse for files incrementally
                const hasFiles = parseWorkspaceFiles(accText);
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, text: accText } : m) } : s));
            }, lang, settings);
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, isStreaming: false } : m) } : s));
        }
        
        const finalSessions = sessions.map(s => s.id === currentSessionId ? sessions.find(sub => sub.id === currentSessionId)! : s);
        if (user.token) syncSessionsToGithub(user, finalSessions);
        else saveLocalSessions(user.id, finalSessions);
    } catch (e: any) {
        const errId = (Date.now() + 2).toString();
        const errorText = e.message || t.serverError;
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages.filter(m => !m.isStreaming && m.image !== 'pending'), { id: errId, role: Role.MODEL, text: errorText, isError: true, timestamp: Date.now() }] } : s));
    } finally {
        setIsLoading(false);
    }
  }, [inputValue, attachments, isLoading, currentSessionId, user, sessions, lang, settings, isImageMode, isWorkspaceOpen]);

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId) || null;
  const handleJumpToMessage = (messageId: string) => {
    setIsChatDetailsOpen(false);
    setTimeout(() => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2500);
        }
    }, 150);
  };
  const handleGuestLoginRedirect = () => { setIsGuestLoginModalOpen(false); handleLogout(); };

  const handleModelSelect = (model: AIModel) => {
      if (model === 'gti-pro' && user?.plan !== 'pro') {
          setIsModelModalOpen(false);
          setIsUpgradeModalOpen(true);
          return;
      }
      handleSettingsChange({ ...settings, selectedModel: model });
      setIsModelModalOpen(false);
  };

  const handleWorkspaceUpdateFromVoice = (newFiles: VirtualFile[]) => {
      // Merge new files from voice into existing workspace
      setWorkspaceFiles(prev => {
          const updated = [...prev];
          newFiles.forEach(nf => {
              const idx = updated.findIndex(f => f.name === nf.name);
              if (idx >= 0) updated[idx] = nf;
              else updated.push(nf);
          });
          return updated;
      });
      // Don't auto-open workspace here to prevent clashing with voice modal
      // Users will use the new "Open Workspace" button in voice modal

      // INJECT MESSAGE INTO CHAT HISTORY (Commands to Chat AI)
      if (currentSessionId) {
          const confirmationMsg: Message = {
              id: Date.now().toString(),
              role: Role.MODEL,
              text: lang === 'ru' 
                 ? "Я создал файлы проекта в вашем рабочем пространстве на основе голосовой команды."
                 : "I've created the project files in your workspace based on your voice command.",
              timestamp: Date.now(),
          };

          setSessions(prev => prev.map(s => s.id === currentSessionId ? {
              ...s,
              messages: [...s.messages, confirmationMsg]
          } : s));
      }
  };

  // --- CONTEXT MENU HANDLERS ---
  const handleReplyMessage = (text: string) => {
      const quote = text.length > 50 ? text.substring(0, 50) + '...' : text;
      setInputValue(prev => `> ${quote}\n\n${prev}`);
      textareaRef.current?.focus();
  };

  const handleDeleteMessage = (id: string) => {
      if (!currentSessionId || !user) return;
      
      const confirmDelete = window.confirm(lang === 'ru' ? 'Удалить это сообщение?' : 'Delete this message?');
      if (!confirmDelete) return;

      // Ensure we create a new reference for the sessions array to trigger re-render
      const newSessions = sessions.map(s => {
          if (s.id !== currentSessionId) return s;
          return {
              ...s,
              messages: s.messages.filter(m => m.id !== id)
          };
      });

      setSessions(newSessions);
      
      // Save
      if (user.token) syncSessionsToGithub(user, newSessions);
      else saveLocalSessions(user.id, newSessions);
  };

  const handleSpeakMessage = async (text: string) => {
      if (!text) return;
      try {
          const audioUrl = await generateSpeech(text, 'Zephyr');
          const audio = new Audio(audioUrl);
          audio.play();
      } catch (e) {
          console.error("Speak failed", e);
      }
  };

  const handleDetailsMessage = (id: string) => {
      setIsChatDetailsOpen(true);
      // Optional: focus specifically on that ID if needed logic in modal
  };

  const modelLabels = {
      'gti-5': { name: t.modelSelector.one, icon: Atom },
      'gti-pro': { name: t.modelSelector.pro, icon: Brain },
  };

  if (isAppInitializing) return <div className={`h-[100dvh] ${colors.bg} flex items-center justify-center`}><Logo className="w-20 h-20 animate-pulse" accent={settings.accent} /></div>;

  if (!user) {
    return (
      <div className={`min-h-[100dvh] ${colors.bg} flex flex-col items-center justify-center p-6 relative overflow-hidden text-center selection:bg-pink-500/30 transition-colors duration-500`}>
        {/* Welcome Screen Logic */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className={`absolute top-[-20%] left-[-20%] w-[60%] h-[60%] blur-[150px] rounded-full animate-float ${settings.theme === 'light' ? 'bg-violet-300/30' : 'bg-violet-900/20'}`}></div>
            <div className={`absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] blur-[150px] rounded-full animate-float ${settings.theme === 'light' ? 'bg-pink-300/30' : 'bg-pink-900/20'}`} style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 max-w-md w-full animate-[fadeIn_0.8s_ease-out]">
            <div className="w-24 h-24 mx-auto mb-8 relative">
                 <div className={`absolute inset-0 bg-gradient-to-r ${currentAccent.gradient} rounded-full blur-xl opacity-50 animate-pulse`}></div>
                 <Logo className="w-full h-full relative z-10 drop-shadow-2xl" accent={settings.accent} />
            </div>
            
            <h1 className={`text-5xl font-bold ${colors.text} mb-2 tracking-tight`}>{t.welcome}</h1>
            <p className={`${colors.subText} text-lg mb-12 font-light`}>{t.subtitle}</p>

            {loginView === 'main' ? (
                <div className={`${colors.glass} p-8 rounded-[2rem] shadow-2xl flex flex-col gap-4 border ${settings.theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                    <button onClick={() => setLoginView('github')} className="w-full bg-[#24292F] hover:bg-[#1b1f24] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg group hover:scale-[1.02]">
                        <Github className="w-6 h-6" /> {t.loginFlow.githubBtn}
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] text-slate-500 uppercase tracking-widest">{t.loginFlow.socialTitle}</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="flex flex-col gap-3">
                         <button onClick={() => handleSocialMockLogin('telegram')} className="bg-[#24A1DE] hover:bg-[#1f8abf] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]">
                            <TelegramIcon />
                            <span>{t.loginFlow.telegram}</span>
                         </button>
                         <button onClick={handleDiscordLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]">
                            <DiscordIcon />
                            <span>{t.loginFlow.discord}</span>
                         </button>
                         <button onClick={handleTwitterLogin} className="bg-black hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] border border-white/10">
                            <TwitterIcon />
                            <span>{t.loginFlow.twitter}</span>
                         </button>
                    </div>

                    <div className={`mt-4 pt-4 border-t ${settings.theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                        <button onClick={enterAsGuest} className={`w-full ${colors.subText} hover:text-inherit text-sm font-semibold transition-colors flex items-center justify-center gap-2`}>
                            {t.loginFlow.guestBtn} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`${colors.glass} p-8 rounded-[2rem] shadow-2xl text-left border ${settings.theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                    <button onClick={() => setLoginView('main')} className={`${colors.subText} hover:text-inherit mb-6 flex items-center gap-2 text-sm transition-colors`}><ArrowRight className="rotate-180 w-4 h-4"/> {t.loginFlow.back}</button>
                    <h2 className={`text-xl font-bold ${colors.text} mb-2`}>{t.loginFlow.ghTitle}</h2>
                    <p className={`text-xs ${colors.subText} mb-6 leading-relaxed`}>{t.loginFlow.ghDesc}</p>
                    
                    <div className="space-y-5">
                        <div className={`${settings.theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'} p-4 rounded-xl border`}>
                            <div className={`text-xs font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r ${currentAccent.gradient}`}>{t.loginFlow.step1}</div>
                            <div className={`text-[10px] ${colors.subText} mb-3`}>{t.loginFlow.step1Desc}</div>
                            <a href="https://github.com/settings/tokens/new?scopes=repo&description=ONI_AI_Access" target="_blank" rel="noopener noreferrer" className={`block w-full text-center py-2.5 rounded-lg border text-xs font-mono transition-colors ${settings.theme === 'light' ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}>{t.loginFlow.getToken} &rarr;</a>
                        </div>
                        <div>
                             <div className={`text-xs font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${currentAccent.gradient}`}>{t.loginFlow.step2}</div>
                             <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder={t.loginFlow.pasteLabel} className={`w-full rounded-xl py-3 px-4 text-sm outline-none font-mono transition-colors ${settings.theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-violet-500' : 'bg-black/50 border-white/10 text-white focus:border-violet-500'}`} />
                        </div>
                        {authError && <div className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{authError}</div>}
                        <button onClick={handleGithubLogin} disabled={(!tokenInput || isAuthLoading)} className={`w-full bg-gradient-to-r ${currentAccent.gradient} ${currentAccent.glow} text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02]`}>
                            {isAuthLoading ? '...' : t.loginFlow.login}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  const currentSession = getCurrentSession();
  
  const activeModel = settings.selectedModel && modelLabels[settings.selectedModel] 
      ? settings.selectedModel 
      : 'gti-5';

  return (
    <div 
        className={`flex h-[100dvh] ${colors.bg} ${colors.text} overflow-hidden font-sans touch-pan-y transition-colors duration-500 relative`} 
        onTouchStart={handleTouchStart} 
        onTouchEnd={handleTouchEnd}
    >
       {/* Sidebar */}
       {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
       <div className={`fixed md:relative z-50 w-[85vw] md:w-[300px] h-[100dvh] ${colors.sidebar} backdrop-blur-xl border-r flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none overflow-hidden'}`}>
           <div className={`p-6 flex items-center gap-3 border-b ${settings.theme === 'light' ? 'border-slate-200 bg-white/50' : 'border-white/5 bg-gradient-to-b from-white/5 to-transparent'}`}>
               <Logo className="w-8 h-8" accent={settings.accent} />
               <span className={`font-bold text-xl tracking-wide ${settings.theme === 'light' ? 'text-slate-800' : 'bg-clip-text text-transparent bg-gradient-to-r ' + currentAccent.gradient}`}>GTayr</span>
           </div>
           
           <div className="p-4 space-y-2">
               <button onClick={createNewSession} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all text-sm font-bold shadow-lg group border ${settings.theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:border-violet-300' : `bg-white/5 border-white/10 hover:border-white/20 text-white`}`} style={{ borderColor: settings.theme !== 'light' ? '' : undefined }}>
                   <span className={`text-xl leading-none font-light opacity-70 transition-colors bg-clip-text text-transparent bg-gradient-to-r ${currentAccent.gradient}`}>+</span> {t.newChat}
               </button>
               
               {/* Office Hub Toggle */}
               <button 
                  onClick={() => { setIsOfficeOpen(true); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-semibold border group ${settings.theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-blue-600/10 border-blue-500/30 text-blue-300 hover:bg-blue-600/20'}`}
               >
                   <Briefcase size={16} /> Office Suite
               </button>
           </div>
           
           <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
               <div className={`px-2 pb-2 text-[10px] font-bold uppercase tracking-widest ${settings.theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>{t.recent}</div>
               {sessions.map(s => (
                   <button key={s.id} onClick={() => { setCurrentSessionId(s.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 border border-transparent ${currentSessionId === s.id ? (settings.theme === 'light' ? 'bg-slate-200 text-slate-900 border-slate-300' : 'bg-white/10 text-white border-white/5 shadow-inner') : (settings.theme === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200')}`}>
                       <span className="truncate flex-1 font-medium">{s.title}</span>
                       <X size={14} className="opacity-0 group-hover:opacity-100 hover:text-red-400" onClick={(e) => deleteSession(e, s.id)} />
                   </button>
               ))}
           </div>
           
           <div className={`p-4 border-t ${settings.theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a12] border-white/5'}`}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group ${colors.hover}`}>
                    <div className="relative">
                        <img src={user.avatar} alt="User" className={`w-10 h-10 rounded-full border transition-colors ${settings.theme === 'light' ? 'border-slate-300' : 'border-white/10 group-hover:border-white/30'}`} />
                        {user.plan === 'pro' && <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${currentAccent.gradient} w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white`}>★</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate group-hover:opacity-80 transition-colors">{user.name}</div>
                        <div className={`text-[10px] truncate font-mono ${colors.subText}`}>{user.plan === 'pro' ? 'ULTIMATE PLAN' : 'STARTER PLAN'}</div>
                    </div>
                </button>
                <ProfileMenu user={user} isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} onLogout={handleLogout} onOpenSettings={() => setIsSettingsOpen(true)} onUpgrade={() => setIsUpgradeModalOpen(true)} lang={lang} settings={settings} />
           </div>
       </div>

       {/* Main Chat Area */}
       <div className={`flex-1 flex flex-col h-[100dvh] relative ${colors.bg} transition-all duration-300 min-w-0`}>
           {/* Desktop Header */}
           <div className="hidden md:flex absolute top-6 left-6 right-6 z-30 justify-between items-start pointer-events-none">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`pointer-events-auto p-2 backdrop-blur-md border rounded-xl transition-all ${settings.theme === 'light' ? 'bg-white/60 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'} ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}><PanelLeft className="w-5 h-5" /></button>
                
                <div className="flex gap-2 pointer-events-auto">
                    <button 
                        onClick={() => setIsModelModalOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border transition-all shadow-sm ${settings.theme === 'light' ? 'bg-white/80 border-slate-200 hover:bg-white text-slate-700' : 'bg-black/40 border-white/10 hover:bg-white/10 text-white'}`}
                    >
                        {React.createElement(modelLabels[activeModel].icon, { size: 16, className: `text-transparent bg-clip-text bg-gradient-to-r ${currentAccent.gradient}` })}
                        <span className="text-sm font-bold">{modelLabels[activeModel].name}</span>
                        <ChevronDown size={14} className="opacity-50" />
                    </button>

                    <button onClick={() => setIsChatDetailsOpen(true)} className={`p-2.5 backdrop-blur-md border rounded-xl transition-all shadow-lg ${settings.theme === 'light' ? 'bg-white/60 border-slate-200 hover:bg-white' : 'bg-black/40 border-white/10 hover:bg-white/10'}`}><SearchMessageIcon settings={settings} /></button>
                    
                    {/* Workspace Toggle Button (Desktop) - Conditional */}
                    {workspaceFiles.length > 0 && (
                        <button 
                            onClick={() => setIsWorkspaceOpen(true)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border transition-all shadow-sm animate-[fadeIn_0.5s_ease-out] bg-gradient-to-r ${currentAccent.gradient} text-white`}
                        >
                            <Layers size={16} />
                            <span className="text-sm font-bold hidden lg:inline">Workspace</span>
                            <span className="bg-white/20 px-1.5 rounded text-xs">{workspaceFiles.length}</span>
                        </button>
                    )}
                </div>
           </div>
           
           {/* Mobile Header */}
           <div className={`md:hidden flex items-center justify-between px-4 py-3 backdrop-blur border-b absolute top-0 w-full z-20 ${settings.theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-[#05040a]/90 border-white/5'}`}>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 active:bg-white/5 rounded-lg"><PanelLeft className="w-6 h-6" /></button>
                
                <div className="flex gap-2">
                    {/* Mobile Workspace Toggle - Conditional */}
                    {workspaceFiles.length > 0 && (
                        <button 
                            onClick={() => setIsWorkspaceOpen(true)} 
                            className={`p-2 rounded-xl border animate-[fadeIn_0.5s_ease-out] bg-gradient-to-r ${currentAccent.gradient} text-white`}
                        >
                            <Layers size={18} />
                        </button>
                    )}

                    <button 
                        onClick={() => setIsModelModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${settings.theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white'}`}
                    >
                        {React.createElement(modelLabels[activeModel].icon, { size: 16, className: `text-transparent bg-clip-text bg-gradient-to-r ${currentAccent.gradient}` })}
                        <span className="text-xs font-bold">{modelLabels[activeModel].name.replace('GTayr ', '')}</span>
                        <ChevronDown size={12} className="opacity-50" />
                    </button>
                </div>
           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-0 md:p-8 scroll-smooth pt-16 md:pt-20 custom-scrollbar overflow-x-hidden w-full">
               <div className="max-w-4xl mx-auto h-full w-full">
                   {/* EMPTY STATE - REPLACED WITH DASHBOARD */}
                   {(!currentSession || currentSession.messages.length === 0) ? (
                        <div className="h-full flex flex-col justify-center">
                            <WelcomeDashboard 
                                onPrompt={handleSendMessage} 
                                settings={settings} 
                                lang={lang} 
                                t={t}
                            />
                        </div>
                   ) : (
                       <div className="p-4 md:p-0 space-y-6 md:space-y-8 pb-4">
                           {currentSession.messages.map(msg => (
                               <div key={msg.id}>
                                   <MessageBubble 
                                     message={msg} 
                                     isHighlighted={highlightedMessageId === msg.id} 
                                     settings={settings}
                                     onOpenWorkspace={() => setIsWorkspaceOpen(true)}
                                     onReply={handleReplyMessage}
                                     onDelete={handleDeleteMessage}
                                     onSpeak={handleSpeakMessage}
                                     onDetails={handleDetailsMessage}
                                   />
                                   {msg.showPromo && <UpgradePromo onUpgrade={() => setIsUpgradeModalOpen(true)} onDismiss={() => {}} lang={lang} settings={settings} />}
                                   {msg.showGuestPromo && <GuestPromo onLogin={handleLogout} onDismiss={() => {}} lang={lang} />}
                               </div>
                           ))}
                           <div ref={messagesEndRef} className="h-6" />
                       </div>
                   )}
               </div>
           </div>

           {/* Input Area */}
           <div className="p-2 md:p-6 z-10 w-full max-w-4xl mx-auto bg-transparent">
               <div className={`relative backdrop-blur-xl rounded-[2rem] border transition-all duration-300 shadow-2xl ${colors.input} ${(isImageMode) ? `border-pink-500/50 shadow-[0_0_40px_rgba(219,39,119,0.15)]` : `focus-within:border-${currentAccent.colors[0]}/50 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}`} style={{ borderColor: (isImageMode) ? undefined : undefined }}>
                   
                   {isImageMode && <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r ${currentAccent.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-float`}><ImageIcon size={12} /> ARTIST MODE ACTIVATED</div>}

                   {attachments.length > 0 && <div className="px-4 pt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">{attachments.map((att, i) => <div key={i} className="relative w-16 h-16 flex-shrink-0 group/file"><div className={`w-full h-full rounded-xl border flex items-center justify-center text-xs overflow-hidden ${settings.theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800 border-white/20 text-slate-400'}`}>{att.mimeType.startsWith('image/') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" /> : 'FILE'}</div><button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"><X size={10} /></button></div>)}</div>}
                   <div className="flex items-end p-2 gap-1.5 md:gap-2">
                       <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 md:p-3.5 rounded-full transition-colors flex-shrink-0 ${settings.theme === 'light' ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Attach"><Paperclip size={18} className="md:w-5 md:h-5" /></button>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,text/plain" onChange={(e) => { if(e.target.files?.[0]) { const f = e.target.files[0]; const r = new FileReader(); r.onload = (ev) => setAttachments([...attachments, { mimeType: f.type, data: (ev.target?.result as string).split(',')[1] }]); r.readAsDataURL(f); } }} />
                       
                       {/* Artist Mode Toggle */}
                       <button 
                          onClick={() => { setIsImageMode(!isImageMode); }} 
                          className={`p-2.5 md:p-3.5 rounded-full transition-all duration-300 flex-shrink-0 ${isImageMode ? `bg-gradient-to-tr ${currentAccent.gradient} text-white rotate-12 shadow-lg` : settings.theme === 'light' ? 'text-slate-400 hover:text-pink-500 hover:bg-slate-100' : 'text-slate-400 hover:text-pink-400 hover:bg-white/5'}`} 
                          title="Generate Art"
                       >
                           <ImageIcon size={18} className="md:w-5 md:h-5" />
                       </button>

                       <button onClick={() => { if(user.isGuest) setIsGuestLoginModalOpen(true); else setIsVoiceOpen(true); }} className={`p-2.5 md:p-3.5 rounded-full transition-colors flex-shrink-0 ${settings.theme === 'light' ? 'text-slate-400 hover:text-violet-500 hover:bg-slate-100' : 'text-slate-400 hover:text-violet-400 hover:bg-white/5'}`} title="Voice Mode"><Mic size={18} className="md:w-5 md:h-5" /></button>
                       <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}} placeholder={t.placeholder} className={`flex-1 bg-transparent placeholder:text-slate-500 px-2 py-3 md:px-3 md:py-3.5 focus:outline-none resize-none max-h-[150px] overflow-y-auto text-sm md:text-[15px] leading-relaxed ${settings.theme === 'light' ? 'text-slate-900' : 'text-white'}`} rows={1} style={{ minHeight: '44px' }} />
                       <button onClick={() => handleSendMessage()} disabled={(!inputValue.trim() && attachments.length === 0) || isLoading} className={`p-2.5 md:p-3.5 rounded-full transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 flex-shrink-0 ${isImageMode ? `bg-gradient-to-r ${currentAccent.gradient} text-white shadow-lg` : settings.theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]'} disabled:opacity-50 disabled:shadow-none disabled:bg-slate-800 disabled:text-slate-600`}>
                           {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Send size={18} className="md:w-5 md:h-5 ml-0.5" />}
                       </button>
                   </div>
               </div>
               <div className={`text-center mt-3 text-[10px] font-medium tracking-widest flex items-center justify-center gap-2 ${colors.subText}`}>
                    POWERED BY <Brain size={12} className={settings.theme === 'light' ? "text-slate-500" : "text-violet-500"}/> GTayr NEURAL ENGINE
               </div>
           </div>
       </div>

      {/* WORKSPACE PANEL */}
      <WorkspacePanel files={workspaceFiles} isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)} settings={settings} lang={lang} />
      
      {/* OFFICE SUITE OVERLAY */}
      <OfficeSuite isOpen={isOfficeOpen} onClose={() => setIsOfficeOpen(false)} settings={settings} lang={lang} />

      <ChatDetailsModal session={getCurrentSession()} isOpen={isChatDetailsOpen} onClose={() => setIsChatDetailsOpen(false)} lang={lang} onMessageClick={handleJumpToMessage} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} onActivate={activateProKey} lang={lang} settings={settings} />
      <GuestLoginModal isOpen={isGuestLoginModalOpen} onClose={() => setIsGuestLoginModalOpen(false)} onLogin={handleGuestLoginRedirect} lang={lang} />
      
      {/* Voice Modal - Now receives Messages and Tool Callback */}
      <VoiceModal 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        lang={lang} 
        settings={settings} 
        messages={currentSession?.messages || []}
        onWorkspaceUpdate={handleWorkspaceUpdateFromVoice}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSave={handleSettingsChange} 
        lang={lang} 
        onLanguageChange={setLang}
        onDeleteAllData={handleDeleteAllData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
      <ModelSelectionModal 
        isOpen={isModelModalOpen} 
        onClose={() => setIsModelModalOpen(false)} 
        selectedModel={activeModel} 
        onSelect={handleModelSelect}
        userPlan={user.plan}
        lang={lang}
        settings={settings}
      />
    </div>
  );
};

export default App;
