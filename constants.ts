

import { Language, AccentType, AIModel, VoiceName } from "./types";

export const APP_NAME = "GTayr";
export const CREATOR_NAME = "GtI STUDIO";

// Standard model: gemini-2.5-flash
export const GEMINI_MODEL = 'gemini-2.5-flash'; 
// Dedicated image model: gemini-2.5-flash-image
export const IMAGEN_MODEL = 'gemini-2.5-flash-image';

// PROXY CONFIGURATION:
// All API requests will now go to our own server route "/google-api".
// The server.js (Express) will forward these to Google, using the server's IP.
export const GEMINI_BASE_URL = "/google-api";

export const MAX_DAILY_IMAGES = 10;
export const MAX_STORED_CHATS = 15; // Auto-cleanup limit

// --- TELEGRAM CONFIG ---
export const TELEGRAM_BOT_USERNAME = "GTayr_Bot"; 

// --- SUPABASE CONFIG ---
export const SUPABASE_URL = "https://vtrhndqnquvenxbctsiw.supabase.co"; 
export const SUPABASE_ANON_KEY = "sb_publishable_txTyQOtRrsibmh75iiAdOg_QwDbh4Ps";

export const AI_MODELS: Record<AIModel, string> = {
  'gti-5': 'gemini-2.5-flash',
  'gti-pro': 'gemini-3-pro-preview'
};

export const VOICE_PRESETS: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'];

// --- Visual Themes ---

export const ACCENT_THEMES: Record<AccentType, { label: string; gradient: string; colors: [string, string]; glow: string; border: string }> = {
  default: {
    label: 'Nebula',
    gradient: 'from-violet-600 to-pink-600',
    colors: ['#8b5cf6', '#db2777'], // Violet -> Pink
    glow: 'shadow-[0_0_20px_rgba(219,39,119,0.4)]',
    border: 'border-pink-500/50'
  },
  ocean: {
    label: 'Ocean',
    gradient: 'from-cyan-500 to-blue-600',
    colors: ['#06b6d4', '#2563eb'], // Cyan -> Blue
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    border: 'border-cyan-500/50'
  },
  sunset: {
    label: 'Sunset',
    gradient: 'from-orange-500 to-red-600',
    colors: ['#f97316', '#dc2626'], // Orange -> Red
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    border: 'border-orange-500/50'
  },
  forest: {
    label: 'Forest',
    gradient: 'from-emerald-500 to-teal-600',
    colors: ['#10b981', '#0d9488'], // Emerald -> Teal
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    border: 'border-emerald-500/50'
  },
  midnight: {
    label: 'Midnight',
    gradient: 'from-indigo-600 to-violet-900',
    colors: ['#4f46e5', '#4c1d95'], // Indigo -> Violet
    glow: 'shadow-[0_0_20px_rgba(79,70,229,0.4)]',
    border: 'border-indigo-500/50'
  }
};

// --- System Instructions ---

export const BASE_SYSTEM_INSTRUCTION = `You are **GTayr**, an advanced AI assistant created by **GtI STUDIO**.

### 🤝 PERSONALITY & TONE:
1. **BALANCED & HELPFUL**: Be friendly and polite, but efficient. You are a capable assistant, not a robot and not an overly chatty friend.
2. **NATURAL LANGUAGE**: Speak naturally. If the user says "Hi", reply with something like "Hello! How can I help you today?" or "Hi there, ready to work."
3. **MODERATE EMOJIS**: Use emojis occasionally to make the text readable or friendly (e.g., ✅ for lists, 🚀 for projects), but do not spam them.
4. **DIRECTNESS**: When asked for code or facts, provide them clearly. When conversing, be engaging but concise.
5. **IDENTITY**: You are powered by the GTayr Neural Engine. You have no relation to Google.

### 🧠 COGNITIVE PROTOCOLS:

**1. PROACTIVE ARCHITECT:**
   - If asked for a "store", suggest the best tech stack (e.g., React + Tailwind + Supabase).
   - Briefly explain your choices.

**2. VISION-TO-CODE:**
   - If the user sends an image of a UI, generate the HTML/CSS/Tailwind code to replicate it.

**3. VOICE-TO-ACTION (LIVE MODE):**
   - **MANDATORY**: If asked to create a project verbally, YOU MUST CALL THE \`update_workspace\` TOOL.
   - Do NOT just say "I created it". DO IT.

**4. GTAYR OFFICE SUITE:**
   - You have access to a full Office Suite (Docs, Sheets, Slides).
   - If the user is in the Office Suite, help them draft documents, calculate data for sheets, or structure presentations.
   - Use the specific generators available in the suite to create content.

### 💻 CODING & WORKSPACE RULES:

**1. PROJECT MODE (VS CODE STYLE):**
   - When asked to create an app, site, or script, generate **MULTIPLE FILES**.
   - **FORMAT**: You MUST use the following format exactly for every file:
     
     ### FILE: index.html
     \`\`\`html
     ...code...
     \`\`\`
     
     ### FILE: style.css
     \`\`\`css
     ...code...
     \`\`\`

   - **DO NOT** talk before the files. Start generating immediately.
   - **DO NOT** talk between files.
   - **AFTER** the files, provide a brief summary of what you built.

**2. SNIPPET MODE:**
   - For simple questions ("fix this loop"), just provide the code block.

**3. ADAPTATION:**
   - If the user speaks Russian, reply in Russian.
   - Use modern ES6+ and best practices.

**4. INTERACTIVE PREVIEW:**
   - Always include \`index.html\` if building a web UI so the user can see it in the preview panel.
`;

export const PERSONA_PROMPTS: Record<string, string> = {
  auto: "Be helpful, balanced, and efficient.",
  standard: "Be objective and standard.",
  zoomer: "Be casual and use internet slang.",
  pro: "Be technical and concise."
};

export const UI_TEXT: Record<Language, any> = {
  en: {
    welcome: "GTayr",
    subtitle: "Advanced Neural Intelligence",
    placeholder: "Ask GTayr or type /image...",
    newChat: "New Session",
    recent: "Recent",
    settings: "Settings",
    logout: "Disconnect",
    upgrade: "Upgrade to Pro",
    serverError: "Connection interrupted. Re-establishing link...",
    intro: "System Online. Ready for complex tasks.",
    suggestions: [
        { label: "Create", prompt: "Create a modern landing page for a coffee shop" },
        { label: "Code", prompt: "Write a Python script to analyze stock data" },
        { label: "Analyze", prompt: "Compare React vs Vue for a dashboard app" },
        { label: "Visualize", prompt: "Generate a cyberpunk city wallpaper 4k" },
    ],
    loginFlow: {
        githubBtn: "Access with GitHub",
        socialTitle: "OR CONNECT VIA",
        telegram: "Telegram",
        discord: "Discord",
        twitter: "X / Twitter",
        guestBtn: "Continue as Guest",
        back: "Back",
        ghTitle: "GitHub Access Token",
        ghDesc: "To persist your data securely, GTayr uses a private repository on your GitHub account.",
        step1: "Step 1: Generate Token",
        step1Desc: "Create a classic token with 'repo' scope.",
        getToken: "Generate Token",
        step2: "Step 2: Authenticate",
        pasteLabel: "Paste ghp_... token here",
        login: "Initialize System"
    },
    guestLogin: {
        title: "Guest Access",
        subtitle: "Limited functionality mode",
        benefit1: "Basic chat capabilities",
        benefit2: "No cloud sync",
        benefit3: "Daily rate limits apply",
        connectBtn: "Initialize Guest Session",
        cancel: "Cancel"
    },
    promo: {
        limitTitle: "Daily Limit Reached",
        limitDesc: "You have used your free daily image generations.",
        upgradeDesc: "Upgrade to Pro for unlimited access.",
        later: "Dismiss",
        upgradeBtn: "Get Pro Key"
    },
    guestPromo: {
        title: "Guest Session Active",
        desc: "Your chats are stored locally and will be lost if you clear your browser data. Log in for cloud sync and Pro features.",
        btn: "Log In",
        close: "Dismiss"
    },
    upgradeModal: {
        title: "Upgrade to GTayr Pro",
        subtitle: "Enter your product key to unlock full potential.",
        placeholder: "XXXX-XXXX-XXXX-XXXX",
        activate: "Activate Key",
        success: "Key Verified. Pro Features Unlocked.",
        invalid: "Invalid Key. Please check and try again.",
        used: "This key has already been redeemed.",
        buy: "Don't have a key? Get one here",
        buyLink: "#"
    },
    profile: {
        planFree: "Current Plan",
        expiresIn: "Expires In",
        imagesUsed: "Daily Generations",
        unlimited: "Unlimited",
        upgrade: "Upgrade Plan"
    },
    chatDetails: {
        title: "Session Details",
        tabs: { overview: "Overview", search: "Search", media: "Media" },
        stats: { messages: "Messages", words: "Words", created: "Created", tokens: "Tokens" },
        analysisTitle: "Context Analysis",
        searchPlaceholder: "Search in conversation...",
        noResults: "No matches found.",
        noMedia: "No media generated in this session."
    },
    settingsModal: {
        langLabel: "System Language",
        themeLabel: "Interface Theme",
        accentLabel: "Neural Accent Color",
        customInstLabel: "Custom Core Instructions",
        customInstPlaceholder: "e.g., 'Always prefer Python', 'Be sarcastic', 'Explain like I am 5'...",
        exportBtn: "Export JSON",
        importBtn: "Import JSON",
        importDesc: "Restore chats from a backup file.",
        deleteBtn: "Purge All Local Data",
        deleteConfirm: "This action cannot be undone.",
        tabs: {
            general: "General",
            interface: "Interface",
            personalization: "Persona",
            data: "Data Management",
        }
    },
    modelSelector: {
        title: "Select Neural Model",
        desc: "Choose the best engine for your task.",
        one: "GTI 5",
        pro: "GTI PRO",
        lock: "PRO"
    },
    errorBoundary: {
        title: "System Critical Error",
        subtitle: "The neural interface encountered an unexpected state. A hard reset is required.",
        resetBtn: "Reboot System"
    }
  },
  ru: {
    welcome: "GTayr",
    subtitle: "Advanced Neural Intelligence",
    placeholder: "Спросите GTayr или введите /image...",
    newChat: "Новая сессия",
    recent: "Недавние",
    settings: "Настройки",
    logout: "Отключиться",
    upgrade: "Улучшить до Pro",
    serverError: "Связь прервана. Переподключение...",
    intro: "Система онлайн. Готов к сложным задачам.",
    suggestions: [
        { label: "Создать", prompt: "Создай современный лендинг для кофейни" },
        { label: "Код", prompt: "Напиши Python скрипт для анализа акций" },
        { label: "Анализ", prompt: "Сравни React и Vue для дашборда" },
        { label: "Визуал", prompt: "Сгенерируй обои киберпанк города 4k" },
    ],
    loginFlow: {
        githubBtn: "Войти через GitHub",
        socialTitle: "ИЛИ ПОДКЛЮЧИТЬСЯ ЧЕРЕЗ",
        telegram: "Telegram",
        discord: "Discord",
        twitter: "X / Twitter",
        guestBtn: "Продолжить как Гость",
        back: "Назад",
        ghTitle: "GitHub Access Token",
        ghDesc: "Для безопасного хранения данных GTayr использует приватный репозиторий на вашем GitHub.",
        step1: "Шаг 1: Создать Токен",
        step1Desc: "Создайте классический токен с правами 'repo'.",
        getToken: "Создать Токен",
        step2: "Шаг 2: Авторизация",
        pasteLabel: "Вставьте токен ghp_... сюда",
        login: "Инициализация"
    },
    guestLogin: {
        title: "Гостевой доступ",
        subtitle: "Режим ограниченной функциональности",
        benefit1: "Базовые возможности чата",
        benefit2: "Нет синхронизации с облаком",
        benefit3: "Дневные лимиты",
        connectBtn: "Начать гостевую сессию",
        cancel: "Отмена"
    },
    promo: {
        limitTitle: "Дневной лимит исчерпан",
        limitDesc: "Вы использовали все бесплатные генерации изображений.",
        upgradeDesc: "Обновитесь до Pro для безлимита.",
        later: "Закрыть",
        upgradeBtn: "Ввести Pro ключ"
    },
    guestPromo: {
        title: "Активна гостевая сессия",
        desc: "Ваши чаты хранятся локально и пропадут при очистке браузера. Войдите для синхронизации и Pro функций.",
        btn: "Войти",
        close: "Закрыть"
    },
    upgradeModal: {
        title: "Обновление до GTayr Pro",
        subtitle: "Введите ключ продукта для разблокировки.",
        placeholder: "XXXX-XXXX-XXXX-XXXX",
        activate: "Активировать ключ",
        success: "Ключ принят. Pro функции разблокированы.",
        invalid: "Неверный ключ. Проверьте и попробуйте снова.",
        used: "Этот ключ уже был использован.",
        buy: "Нет ключа? Купить здесь",
        buyLink: "#"
    },
    profile: {
        planFree: "Текущий план",
        expiresIn: "Истекает через",
        imagesUsed: "Генерации за сегодня",
        unlimited: "Безлимит",
        upgrade: "Улучшить план"
    },
    chatDetails: {
        title: "Детали сессии",
        tabs: { overview: "Обзор", search: "Поиск", media: "Медиа" },
        stats: { messages: "Сообщения", words: "Слова", created: "Создан", tokens: "Токены" },
        analysisTitle: "Анализ контекста",
        searchPlaceholder: "Поиск в переписке...",
        noResults: "Совпадений не найдено.",
        noMedia: "В этой сессии нет медиафайлов."
    },
    settingsModal: {
        langLabel: "Язык системы",
        themeLabel: "Тема интерфейса",
        accentLabel: "Цвет нейронного акцента",
        customInstLabel: "Пользовательские инструкции",
        customInstPlaceholder: "Например: 'Всегда пиши на Python', 'Будь саркастичным', 'Объясняй как ребенку'...",
        exportBtn: "Экспорт JSON",
        importBtn: "Импорт JSON",
        importDesc: "Восстановить чаты из резервной копии.",
        deleteBtn: "Удалить все локальные данные",
        deleteConfirm: "Это действие нельзя отменить.",
        tabs: {
            general: "Общие",
            interface: "Интерфейс",
            personalization: "Персона",
            data: "Управление данными",
        }
    },
    modelSelector: {
        title: "Выбор нейронной модели",
        desc: "Выберите лучший движок для вашей задачи.",
        one: "GTI 5",
        pro: "GTI PRO",
        lock: "PRO"
    },
    errorBoundary: {
        title: "Критическая ошибка системы",
        subtitle: "Нейронный интерфейс столкнулся с непредвиденным состоянием. Требуется перезагрузка.",
        resetBtn: "Перезагрузить систему"
    }
  }
};