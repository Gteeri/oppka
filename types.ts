

export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type Language = 'en' | 'ru';

export type PersonaStyle = 'auto' | 'standard' | 'zoomer' | 'pro';

export type Plan = 'free' | 'pro';

export type AuthProvider = 'github' | 'google' | 'discord' | 'telegram' | 'guest';

export type Theme = 'dark' | 'light';

export type AccentType = 'default' | 'ocean' | 'sunset' | 'forest' | 'midnight';

export type AIModel = 'gti-5' | 'gti-pro';

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr';

export type LiveVideoMode = 'none' | 'camera' | 'screen';

export interface UserSettings {
  style: PersonaStyle;
  customPrompt: string;
  theme: Theme;
  accent: AccentType;
  selectedModel: AIModel;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
}

export interface VirtualFile {
  name: string;
  language: string;
  content: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string; // For AI generated images
  attachments?: Attachment[]; // For User uploaded files
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  showPromo?: boolean; // If true, render the GTayr+ promo after this message
  showGuestPromo?: boolean; // If true, render Guest Login Promo
  action?: 'image_gen' | 'chat'; // Explicit intent
}

export interface UserUsage {
  date: string; // YYYY-MM-DD
  imageCount: number;
}

export interface AuthData {
    telegramId?: string;
    discordId?: string;
    authTimestamp: number;
    hash?: string; // For verification
}

export interface User {
  id: string; // The Database UID (e.g. tg_123456)
  name: string;
  username: string; // Display name
  email?: string;
  avatar: string;
  provider: AuthProvider;
  isGuest?: boolean;
  plan: Plan;
  usage: UserUsage;
  subscriptionExpiry?: number;
  activatedKeys?: string[];
  token?: string; // Github Token (Optional if using other storage)
  settings?: UserSettings; // Persisted user settings
  authData?: AuthData; // Metadata for real auth
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  userId?: string;
  workspaceFiles?: VirtualFile[]; // Persist workspace files per session
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export enum LiveConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// --- Key Database Types ---

export interface ProductKey {
  code: string;
  type: Plan;
  durationDays: number;
  maxUses: number; // How many users can use this key (1 = unique, 100 = promo code)
  currentUses: number;
  createdBy?: string;
  createdAt: number;
}