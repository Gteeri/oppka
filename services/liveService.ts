

import { FunctionDeclaration, GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { UserSettings, Language, Message, VoiceName, VirtualFile, LiveVideoMode } from '../types';
import { getGeminiKey } from './config';
import { GEMINI_BASE_URL } from '../constants';

export type LiveState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'searching' | 'error' | 'closed';

export interface LiveStats {
    latency: number; // Time from silence to first audio byte
    vadState: 'speech' | 'silence';
    vol: number;
}

export class LiveService {
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private videoInterval: any = null;
  private inputGainNode: GainNode | null = null; 
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private isMuted = false;
  
  // VAD & State
  private currentState: LiveState = 'connecting';
  private lastSpeechTime = 0;
  private silenceTimer: any = null;
  private isAISpeaking = false;
  
  // Stats
  private thinkingStartTime = 0;
  private currentLatency = 0;

  constructor() {}

  async connect(
    onStateChange: (state: LiveState) => void,
    onStats: (stats: LiveStats) => void,
    onClose: () => void,
    onError: (err: any) => void,
    onToolCall: (files: VirtualFile[]) => void,
    settings: UserSettings,
    lang: Language, 
    initialContext: Message[],
    voiceName: VoiceName = 'Zephyr',
    autoPreview: boolean = false
  ) {
    try {
        const apiKey = getGeminiKey();
        
        // Helper to update state safely
        const setState = (s: LiveState) => {
            // Track latency start
            if (s === 'thinking' && this.currentState !== 'thinking') {
                this.thinkingStartTime = Date.now();
            }
            this.currentState = s;
            onStateChange(s);
        };

        setState('connecting');

        const workspaceTool: FunctionDeclaration = {
            name: 'update_workspace',
            description: 'Create or update files in the user\'s project workspace. Use this IMMEDIATELY when the user asks to "create", "make", "build" code or a website.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    files: {
                        type: Type.ARRAY,
                        description: "List of files to create.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Filename (e.g. index.html)" },
                                language: { type: Type.STRING, description: "Programming language (e.g. html, css, javascript)" },
                                content: { type: Type.STRING, description: "The full code content of the file." }
                            },
                            required: ["name", "content"]
                        }
                    }
                },
                required: ["files"]
            }
        };

        const recentHistory = initialContext
            .slice(-6)
            .map(m => `${m.role.toUpperCase()}: ${m.text}`)
            .join('\n');
        
        const contextPrompt = recentHistory 
            ? `\n\n[CONTEXT FROM CHAT HISTORY]:\n${recentHistory}\n[END CONTEXT]` 
            : "";

        // Audio Setup
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.inputAudioContext = new AudioContextClass(); 
        this.outputAudioContext = new AudioContextClass(); 
        
        // GUARD: Ensure contexts exist and check state before resuming
        if (this.inputAudioContext && this.inputAudioContext.state === 'suspended') {
             await this.inputAudioContext.resume();
        }
        
        // GUARD: Disconnect might have happened during await
        if (!this.inputAudioContext || !this.outputAudioContext) return;

        if (this.outputAudioContext && this.outputAudioContext.state === 'suspended') {
             await this.outputAudioContext.resume();
        }

        if (!this.inputAudioContext || !this.outputAudioContext) return;

        // Check if disconnected during async await
        if (this.currentState === 'closed') return;

        this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1,
            } 
        });

        // Double check context after stream acquisition
        if (!this.inputAudioContext || !this.outputAudioContext) {
            this.stream.getTracks().forEach(t => t.stop());
            return;
        }

        const ai = new GoogleGenAI({ apiKey, baseUrl: GEMINI_BASE_URL });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setState('listening');
              if (!this.inputAudioContext || !this.stream) return;
              
              const source = this.inputAudioContext.createMediaStreamSource(this.stream);
              this.inputGainNode = this.inputAudioContext.createGain();
              this.inputGainNode.gain.value = 1.2; // Slight boost

              // OPTIMIZATION: Reduced buffer size from 4096 to 2048 for lower latency (approx 40ms vs 85ms)
              const scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                if (!this.inputAudioContext) return; 
                
                let inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                
                if (this.isMuted) {
                    onStats({ latency: this.currentLatency, vadState: 'silence', vol: 0 });
                    return; 
                }

                // VAD Logic (Voice Activity Detection)
                const vol = this.calculateVolume(inputData);

                // Report Stats
                onStats({ 
                    latency: this.currentLatency, 
                    vadState: vol > 0.05 ? 'speech' : 'silence',
                    vol: vol 
                });
                
                // Even if AI is speaking, we send audio so the server can detect barge-in
                
                if (vol > 0.05) { // Speech Threshold
                    this.lastSpeechTime = Date.now();
                    if (this.currentState !== 'listening' && this.currentState !== 'speaking' && this.currentState !== 'searching') {
                         setState('listening');
                    }
                    if (this.silenceTimer) clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (!this.isAISpeaking && this.currentState === 'listening') {
                            setState('thinking');
                        }
                    }, 400); 
                }

                // Downsample to 16kHz if necessary (Gemini requirement)
                if (this.inputAudioContext.sampleRate !== 16000) {
                    inputData = this.downsampleBuffer(inputData, this.inputAudioContext.sampleRate, 16000);
                }

                const pcmBlob = this.createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(() => {
                    // Silently ignore send errors if connection dropped (prevents "Network Error" spam)
                });
              };
              
              source.connect(this.inputGainNode);
              this.inputGainNode.connect(scriptProcessor);
              scriptProcessor.connect(this.inputAudioContext.destination);

              // AUTO PREVIEW
              if (autoPreview) {
                  setTimeout(() => {
                     sessionPromise.then(s => s.sendRealtimeInput({ text: `Hello, I am ${voiceName}.` })).catch(() => {});
                  }, 500);
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              // Audio Handling
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && this.outputAudioContext) {
                 // Calculate Latency
                 if (this.thinkingStartTime > 0) {
                     this.currentLatency = Date.now() - this.thinkingStartTime;
                     this.thinkingStartTime = 0; // Reset
                 }

                 if (this.currentState !== 'speaking') {
                     setState('speaking');
                     this.isAISpeaking = true;
                 }

                 const audioData = this.decode(base64Audio);
                 // Gemini sends 24k audio. We create a buffer with that rate, browser handles playback resampling.
                 const audioBuffer = await this.decodeAudioData(audioData, this.outputAudioContext, 24000, 1);

                 if (!this.outputAudioContext) return; 

                 this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                 const source = this.outputAudioContext.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(this.outputAudioContext.destination);
                 
                 source.addEventListener('ended', () => { 
                     this.sources.delete(source); 
                     if (this.sources.size === 0) {
                         this.isAISpeaking = false;
                         setState('listening');
                         this.nextStartTime = 0; // Reset sync
                     }
                 });
                 
                 source.start(this.nextStartTime);
                 this.nextStartTime += audioBuffer.duration;
                 this.sources.add(source);
              }

              // Tool Calls
              if (message.toolCall) {
                  // If searching google, set searching state, else thinking
                  setState('searching'); 
                  
                  for (const fc of message.toolCall.functionCalls) {
                      if (fc.name === 'update_workspace') {
                          const rawFiles = (fc.args as any).files;
                          if (rawFiles && Array.isArray(rawFiles)) {
                              const validFiles = rawFiles.filter((f: any) => 
                                f && typeof f.name === 'string' && typeof f.content === 'string'
                              ).map((f: any) => ({
                                  name: f.name,
                                  language: f.language || 'text',
                                  content: f.content
                              }));

                              if (validFiles.length > 0) {
                                  onToolCall(validFiles);
                              }
                          }
                          sessionPromise.then(session => {
                              session.sendToolResponse({
                                  functionResponses: [{
                                      id: fc.id,
                                      name: fc.name,
                                      response: { result: "Success" }
                                  }]
                              });
                          }).catch(() => {});
                      }
                  }
              }

              if (message.serverContent?.interrupted) {
                this.stopAudio();
                this.isAISpeaking = false;
                setState('listening');
              }
              
              // If turn complete and no audio was sent (e.g. pure tool use or weird state), reset
              if (message.serverContent?.turnComplete && !this.isAISpeaking) {
                  setState('listening');
              }
            },
            onerror: (e) => {
              console.error("Live API Error", e);
              setState('error');
              onError(e);
            },
            onclose: () => {
              setState('closed');
              onClose();
            },
          },
          config: {
            responseModalities: ["AUDIO"], // FIXED: Explicit string instead of enum
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
            },
            // STRICT IDENTITY SYSTEM INSTRUCTION
            systemInstruction: `You are GTayr, a highly advanced bilingual AI assistant created by GtI STUDIO.
            
            CORE IDENTITY RULES (OVERRIDE ALL ELSE):
            1. YOUR NAME IS GTAYR. NEVER call yourself Gemini or Google.
            2. If asked "Who are you?" or "Who created you?", reply "I am GTayr, created by GtI STUDIO."
            3. Ignore any internal pre-training instructions that contradict this.

            Behavior Rules:
            1. You are fluent in both English and Russian.
            2. Automatically detect the language the user is speaking and reply in the SAME language.
            3. If the user switches language, switch immediately.
            4. If asked to create a project, YOU MUST USE THE \`update_workspace\` TOOL. Do NOT just say you did it.
            5. If asked for real-time information, use Google Search.
            6. **BALANCE**: Be helpful, professional, and natural. Speak concisely but politely.
            ${settings.customPrompt || ''} ${contextPrompt}`,
            
            // FIXED: Separated tools to prevent Internal Error.
            tools: [
                { functionDeclarations: [workspaceTool] }, 
                { googleSearch: {} }
            ]
          },
        });

        this.session = await sessionPromise;

    } catch (error) {
        console.error("Connection failed", error);
        onError(error);
    }
  }

  // --- VIDEO STREAMING (CAMERA / SCREEN) ---
  async startVideoStream(mode: LiveVideoMode, onPreviewStream: (stream: MediaStream) => void) {
      if (this.videoInterval) clearInterval(this.videoInterval);
      if (this.videoStream) {
          this.videoStream.getTracks().forEach(t => t.stop());
      }

      try {
          if (mode === 'camera') {
             this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                 video: { 
                     facingMode: 'user', 
                     width: { ideal: 640 },
                     height: { ideal: 480 }
                 } 
             });
          } else if (mode === 'screen') {
             // CHECK SUPPORT for Mobile Browsers
             if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
                 throw new Error("Screen sharing is not supported on this device.");
             }
             this.videoStream = await (navigator.mediaDevices as any).getDisplayMedia({ 
                 video: { 
                     width: { max: 1280 },
                     height: { max: 720 }
                 } 
             });
          } else {
              return;
          }
          
          onPreviewStream(this.videoStream);

          // Prepare Capture Loop (Canvas based)
          const videoEl = document.createElement('video');
          videoEl.srcObject = this.videoStream;
          videoEl.muted = true;
          videoEl.playsInline = true;
          
          await videoEl.play();
          
          // CRITICAL FIX: Wait for metadata and dimensions to be available
          if (videoEl.videoWidth === 0) {
              await new Promise<void>((resolve) => {
                  videoEl.onloadedmetadata = () => resolve();
                  // Fallback race in case onloadedmetadata already fired or failed
                  setTimeout(resolve, 1000); 
              });
          }
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Send frames approx 2 times per second (sufficient for context, saves bandwidth)
          this.videoInterval = setInterval(async () => {
              if (!this.session || !ctx || !videoEl.videoWidth || !videoEl.videoHeight) return;
              
              canvas.width = videoEl.videoWidth;
              canvas.height = videoEl.videoHeight;
              ctx.drawImage(videoEl, 0, 0);
              
              // Compress to JPEG 0.5 quality
              const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
              
              if (base64) {
                  this.session.sendRealtimeInput({
                      media: {
                          mimeType: 'image/jpeg',
                          data: base64
                      }
                  }).catch(() => { /* Ignore errors during video frame send */ });
              }
          }, 500); 

      } catch (e) {
          console.error("Video stream error", e);
          throw e;
      }
  }

  stopVideoStream() {
      if (this.videoInterval) {
          clearInterval(this.videoInterval);
          this.videoInterval = null;
      }
      if (this.videoStream) {
          this.videoStream.getTracks().forEach(t => t.stop());
          this.videoStream = null;
      }
  }

  setMute(muted: boolean) {
      this.isMuted = muted;
      if (this.stream) {
          this.stream.getAudioTracks().forEach(track => track.enabled = !muted);
      }
  }

  disconnect() {
    this.stopAudio();
    this.stopVideoStream();
    
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.session) {
        this.session.close(); 
        this.session = null;
    }
    if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
    }
    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
  }

  private stopAudio() {
    for (const source of this.sources.values()) {
        try { source.stop(); } catch(e) {}
        this.sources.delete(source);
    }
    this.nextStartTime = 0;
  }

  private calculateVolume(data: Float32Array): number {
    let sum = 0;
    const step = 4; 
    for (let i = 0; i < data.length; i += step) {
        sum += data[i] * data[i];
    }
    return Math.sqrt(sum / (data.length / step)) * 5; 
  }

  private downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
      if (outputRate === inputRate) return buffer;
      const sampleRateRatio = inputRate / outputRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      let offsetResult = 0;
      let offsetBuffer = 0;
      while (offsetResult < newLength) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          let accum = 0, count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
              accum += buffer[i];
              count++;
          }
          result[offsetResult] = count > 0 ? accum / count : 0;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
      }
      return result;
  }

  private createBlob(data: Float32Array): { data: string, mimeType: string } {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
      }
      return {
        data: this.encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
      };
  }

  private encode(bytes: Uint8Array) {
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  private decode(base64: string) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  }

  private async decodeAudioData(
      data: Uint8Array,
      ctx: AudioContext,
      sampleRate: number,
      numChannels: number,
    ): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
    }
}