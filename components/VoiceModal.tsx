import React, { useEffect, useState, useRef } from 'react';
import { LiveService, LiveState, LiveStats } from '../services/liveService';
import { UserSettings, Language, Message, VoiceName, VirtualFile, LiveVideoMode } from '../types';
import { UI_TEXT, ACCENT_THEMES, VOICE_PRESETS } from '../constants';
import { previewVoice } from '../services/geminiService';
import { Mic, MicOff, PhoneOff, Minimize2, Users, Volume2, Check, Activity, Zap, Video, VideoOff, Monitor, Maximize2, Camera, Repeat, Search, Brain, Volume1, Ear, Layers, Play, Loader2, Square } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  settings: UserSettings;
  messages: Message[];
  onWorkspaceUpdate: (files: VirtualFile[]) => void;
  onOpenWorkspace?: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, lang, settings, messages, onWorkspaceUpdate, onOpenWorkspace }) => {
  const [state, setState] = useState<LiveState>('connecting');
  const [stats, setStats] = useState<LiveStats>({ latency: 0, vadState: 'silence', vol: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  
  // Preview State
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // New States for Video & Mini Mode
  const [videoMode, setVideoMode] = useState<LiveVideoMode>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [filesCreated, setFilesCreated] = useState(false);

  const serviceRef = useRef<LiveService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const accent = ACCENT_THEMES[settings.accent || 'default'];

  // Start/Stop Logic
  useEffect(() => {
    if (isOpen) {
      startSession(false);
    } else {
      endSession();
      stopPreview();
      setVideoMode('none');
      setIsMinimized(false);
      setFilesCreated(false);
    }
    return () => {
        endSession();
        stopPreview();
    }
  }, [isOpen]);

  const startSession = async (preview: boolean) => {
    setState('connecting');
    setIsMuted(false);
    setStats({ latency: 0, vadState: 'silence', vol: 0 });
    
    // Cleanup previous if exists
    if (serviceRef.current) {
        serviceRef.current.disconnect();
    }

    try {
      serviceRef.current = new LiveService();
      await serviceRef.current.connect(
        (newState) => setState(newState),
        (newStats) => setStats(newStats), 
        () => { if(isOpen && !showVoicePicker) onClose(); }, // Only close on actual disconnect, not switch
        () => setState('error'),
        (files) => {
            onWorkspaceUpdate(files);
            setFilesCreated(true);
            setTimeout(() => setFilesCreated(false), 3000);
        },
        settings,
        lang,
        messages,
        selectedVoice,
        preview // Auto Preview on connect
      );
    } catch (error) {
      console.error("Failed to start voice session", error);
      setState('error');
    }
  };

  const endSession = () => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }
    setStats({ latency: 0, vadState: 'silence', vol: 0 });
  };

  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      serviceRef.current?.setMute(newState);
  };

  const toggleVideo = async (mode: 'camera' | 'screen') => {
      if (!serviceRef.current) return;
      
      if (videoMode === mode) {
          // Stop
          serviceRef.current.stopVideoStream();
          setVideoMode('none');
      } else {
          // Start
          try {
              await serviceRef.current.startVideoStream(mode, (stream) => {
                  if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                  }
              });
              setVideoMode(mode);
          } catch (e: any) {
              console.error("Failed to start video", e);
              if (e.message.includes("not supported")) {
                  alert(lang === 'ru' ? 'Запись экрана не поддерживается на этом устройстве.' : 'Screen sharing is not supported on this device.');
              } else if (e.name === 'NotAllowedError' || e.message.includes('Permission')) {
                  alert(lang === 'ru' ? 'Доступ к камере/экрану запрещен.' : 'Camera/Screen permission denied.');
              }
              // Fallback
              setVideoMode('none');
          }
      }
  };

  const handleVoiceChange = (voice: VoiceName) => {
      stopPreview();
      setSelectedVoice(voice);
      setShowVoicePicker(false);
      startSession(true);
  };

  const handleVoicePreview = async (e: React.MouseEvent, voice: VoiceName) => {
      e.stopPropagation();
      
      if (previewingVoice === voice) {
          stopPreview();
          return;
      }

      setPreviewingVoice(voice);
      
      try {
          const text = lang === 'ru' ? 'Привет, я GTayr.' : 'Hello, I am GTayr.';
          const audioUrl = await previewVoice(voice, text);
          
          if (audioRef.current) {
              audioRef.current.pause();
          }
          
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.onended = () => {
              setPreviewingVoice(null);
          };
          
          await audio.play();
      } catch (e) {
          console.error("Preview failed", e);
          setPreviewingVoice(null);
      }
  };

  const stopPreview = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
      setPreviewingVoice(null);
  }

  // Helper to get Status Text and Icon
  const getStatusConfig = () => {
      if (isMuted) return { text: "MICROPHONE MUTED", icon: MicOff, color: "text-red-500" };
      switch(state) {
          case 'connecting': return { text: "ESTABLISHING UPLINK...", icon: Activity, color: "text-yellow-500" };
          case 'listening': return { text: "LISTENING", icon: Ear, color: "text-green-400" };
          case 'thinking': return { text: "THINKING", icon: Brain, color: "text-violet-400" };
          case 'searching': return { text: "SEARCHING GOOGLE...", icon: Search, color: "text-blue-400" };
          case 'speaking': return { text: "SPEAKING", icon: Volume1, color: "text-pink-400" };
          case 'error': return { text: "CONNECTION LOST", icon: Zap, color: "text-red-500" };
          default: return { text: "STANDBY", icon: Activity, color: "text-slate-500" };
      }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  if (!isOpen) return null;

  // --- MINIMIZED FLOATING WIDGET ---
  if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 animate-[fadeIn_0.3s_ease-out]">
              {/* Mini Video Preview */}
              {videoMode !== 'none' && (
                  <div className="w-32 h-24 bg-black rounded-xl overflow-hidden border border-white/20 shadow-xl mb-2 relative transform scale-x-[-1]">
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
              )}

              <div className={`p-4 rounded-3xl shadow-2xl flex items-center gap-4 cursor-pointer backdrop-blur-xl border border-white/10 ${settings.theme === 'light' ? 'bg-white/90' : 'bg-black/80'}`} onClick={() => setIsMinimized(false)}>
                   <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${state === 'speaking' ? `bg-gradient-to-r ${accent.gradient} animate-pulse` : 'bg-white/10'}`}>
                        {state === 'thinking' || state === 'searching' ? (
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                             <div className="flex gap-0.5 items-end justify-center h-4">
                                  {[1,2,3].map(i => <div key={i} className="w-1 bg-white rounded-full animate-[wave_1s_ease-in-out_infinite]" style={{height: `${Math.random()*100}%`}}></div>)}
                             </div>
                        )}
                   </div>
                   <div>
                       <div className={`text-xs font-bold ${settings.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>GTayr Live</div>
                       <div className="text-[10px] text-slate-500">{status.text}</div>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-colors">
                       <PhoneOff size={16} />
                   </button>
              </div>
          </div>
      );
  }

  // --- FULL SCREEN MODAL ---
  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden flex flex-col animate-[fadeIn_0.5s_ease-out] ${settings.theme === 'light' ? 'bg-[#f0f9ff]' : 'bg-black'}`}>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-tr ${accent.gradient} animate-aurora filter blur-[80px] ${settings.theme === 'light' ? 'opacity-20' : 'opacity-40'}`}></div>
      </div>

      {/* HEADER */}
      <div className="relative z-10 w-full flex justify-between items-center p-8">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${
                state === 'speaking' ? 'bg-pink-500 text-pink-500 animate-pulse' :
                state === 'thinking' || state === 'searching' ? 'bg-violet-500 text-violet-500 animate-ping' :
                state === 'listening' ? 'bg-green-400 text-green-400' : 
                'bg-yellow-400 text-yellow-400'
            }`}></div>
            <span className={`text-xs font-mono tracking-[0.2em] uppercase ${settings.theme === 'light' ? 'text-slate-500' : 'text-white/50'}`}>
                LIVE // {selectedVoice.toUpperCase()} // {videoMode !== 'none' ? videoMode.toUpperCase() : 'AUDIO ONLY'}
            </span>
        </div>
        <button onClick={() => setIsMinimized(true)} className={`p-3 rounded-full transition-all ${settings.theme === 'light' ? 'bg-white/50 hover:bg-white text-slate-500' : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}>
             <Minimize2 size={20} />
        </button>
      </div>

      {/* CENTERED VOICE PICKER MODAL */}
      {showVoicePicker && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#151025] border-white/10'}`}>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className={`font-bold ${settings.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Select Voice</h3>
                      <button onClick={() => { setShowVoicePicker(false); stopPreview(); }} className="text-slate-500 hover:text-white"><Minimize2 size={18} /></button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {VOICE_PRESETS.map(v => (
                          <div 
                            key={v} 
                            onClick={() => handleVoiceChange(v)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                selectedVoice === v 
                                ? `bg-gradient-to-r ${accent.gradient} text-white border-transparent shadow-lg` 
                                : settings.theme === 'light' 
                                    ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${selectedVoice === v ? 'bg-white/20' : 'bg-black/20'}`}>
                                      <Volume2 size={16} />
                                  </div>
                                  <span className="font-medium">{v}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => handleVoicePreview(e, v)}
                                    className={`p-2 rounded-full transition-colors ${previewingVoice === v ? 'bg-white text-black' : 'bg-black/20 hover:bg-white/20'}`}
                                    title="Listen"
                                  >
                                      {previewingVoice === v ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                                  </button>
                                  {selectedVoice === v && <Check size={16} />}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* CENTER VISUALIZER */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
         <div className="relative">
            {/* Outer Rings */}
            <div className={`absolute inset-0 border rounded-full ${settings.theme === 'light' ? 'border-slate-400' : 'border-white/10'} 
                ${state === 'thinking' || state === 'searching' ? 'animate-[spin_2s_linear_infinite] opacity-60' : 'animate-[spin_10s_linear_infinite] opacity-30'}
                ${isMuted ? 'opacity-10' : ''}`} 
                style={{ width: '300px', height: '300px', margin: '-50px' }}></div>
            
            <div className={`absolute inset-0 border rounded-full ${settings.theme === 'light' ? 'border-slate-400' : 'border-white/5'}
                ${state === 'thinking' || state === 'searching' ? 'animate-[spin_3s_linear_infinite_reverse] opacity-50' : 'animate-[spin_15s_linear_infinite_reverse] opacity-20'}
                ${isMuted ? 'opacity-10' : ''}`} 
                style={{ width: '400px', height: '400px', margin: '-100px' }}></div>

            {/* Core Orb */}
            <div 
                className={`relative w-48 h-48 rounded-full shadow-[0_0_60px_rgba(139,92,246,0.3)] transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${isMuted 
                        ? (settings.theme === 'light' ? 'bg-slate-200' : 'bg-black border border-white/10') 
                        : (videoMode !== 'none' ? 'bg-black border border-white/20' : `bg-gradient-to-b ${accent.gradient}`)
                    }
                    ${state === 'speaking' ? 'scale-110 shadow-[0_0_100px_rgba(219,39,119,0.6)]' : ''}
                    ${state === 'thinking' || state === 'searching' ? 'scale-95 animate-pulse' : ''}
                `}
                style={{ transform: state === 'listening' ? `scale(${1 + stats.vol * 0.2})` : undefined }}
            >
                {/* VIDEO ELEMENT INSIDE ORB */}
                {videoMode !== 'none' && (
                     <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        // Mirror the video for camera mode so user sees themselves naturally
                        className={`absolute inset-0 w-full h-full object-cover opacity-80 ${videoMode === 'camera' ? 'transform scale-x-[-1]' : ''}`} 
                     />
                )}

                {/* Inner Animation (Only if no video) */}
                {!isMuted && videoMode === 'none' && (
                    <div className={`absolute inset-0 rounded-full opacity-80 mix-blend-overlay
                        ${state === 'speaking' ? 'animate-ping' : ''}
                        ${state === 'thinking' || state === 'searching' ? 'bg-white animate-pulse' : `bg-gradient-to-tr ${accent.gradient}`}
                    `}></div>
                )}

                {/* Center Icon/Visual */}
                <div className={`absolute inset-4 rounded-full flex items-center justify-center overflow-hidden z-20 ${videoMode !== 'none' ? 'bg-transparent' : (settings.theme === 'light' ? 'bg-white/90' : 'bg-black')}`}>
                     {isMuted ? (
                         <MicOff className={`${settings.theme === 'light' ? 'text-slate-400' : 'text-white/20'} w-12 h-12`} />
                     ) : (
                         state === 'thinking' || state === 'searching' ? (
                             <div className="flex gap-2">
                                 <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${accent.gradient} animate-bounce`} style={{animationDelay: '0s'}}></div>
                                 <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${accent.gradient} animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                                 <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${accent.gradient} animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                             </div>
                         ) : (
                             // Only show waveform if NOT in video mode
                             videoMode === 'none' && (
                                <div className="flex gap-1 items-center justify-center h-full w-full">
                                    {[1,2,3,4,5].map(i => (
                                        <div 
                                            key={i} 
                                            className={`w-2 rounded-full transition-all duration-75 bg-gradient-to-t ${accent.gradient}`}
                                            style={{ 
                                                height: state === 'speaking' 
                                                    ? `${30 + Math.random() * 60}%` // Random wave for speaking
                                                    : `${Math.max(10, stats.vol * 100 * Math.random())}%` // Mic volume
                                            }}
                                        ></div>
                                    ))}
                                </div>
                             )
                         )
                     )}
                </div>
            </div>
            
            {/* FILES CREATED TOAST + OPEN BTN */}
            {(filesCreated || (messages.find(m => m.text.includes("created")) && onOpenWorkspace)) && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[fadeIn_0.5s_ease-out]">
                    {filesCreated && (
                        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
                            <Check size={16} /> <span>Files Created</span>
                        </div>
                    )}
                    {onOpenWorkspace && (
                         <button 
                            onClick={() => { setIsMinimized(true); onOpenWorkspace(); }}
                            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 transition-transform hover:scale-105 ${settings.theme === 'light' ? 'bg-white text-slate-800' : 'bg-white text-black'}`}
                         >
                             <Layers size={14} /> OPEN WORKSPACE
                         </button>
                    )}
                </div>
            )}
         </div>
         
         {/* AI STATUS (REPLACES TECH STATS) */}
         <div className="mt-16 text-center">
             {/* Status Badge */}
             <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-500 ${settings.theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                 <StatusIcon size={16} className={`animate-pulse ${status.color}`} />
                 <span className={`text-sm font-bold tracking-widest ${settings.theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                    {status.text}
                 </span>
             </div>
         </div>
      </div>

      {/* CONTROLS */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mb-10 px-6">
          <div className={`backdrop-blur-xl border rounded-full p-2 flex items-center justify-between shadow-xl ${settings.theme === 'light' ? 'bg-white/50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              
              <button 
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isMuted ? 'bg-red-500 text-white' : settings.theme === 'light' ? 'bg-white text-slate-700 hover:bg-slate-100' : 'bg-white/5 text-white hover:bg-white/20'}`}
              >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* VIDEO CONTROLS */}
              <div className="flex gap-2">
                   <button 
                        onClick={() => toggleVideo('camera')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoMode === 'camera' ? 'bg-green-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        title="Camera"
                   >
                       {videoMode === 'camera' ? <Video size={20} /> : <VideoOff size={20} />}
                   </button>
                   
                   <button 
                        onClick={() => toggleVideo('screen')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoMode === 'screen' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        title="Share Screen"
                   >
                       <Monitor size={20} />
                   </button>
              </div>

              <button 
                onClick={onClose}
                className="px-8 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold tracking-wider transition-all hover:scale-105 hover:shadow-lg flex items-center gap-3"
              >
                  <PhoneOff size={20} /> END
              </button>
              
              {/* Voice Selector Button */}
              <button 
                  onClick={() => setShowVoicePicker(!showVoicePicker)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showVoicePicker ? 'bg-white text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                  title="Change Voice"
              >
                  <Users size={20} />
              </button>

          </div>
      </div>

    </div>
  );
};