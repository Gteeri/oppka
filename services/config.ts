
// Internal Configuration Storage
// Reads the API key from environment variable

export const getGeminiKey = (): string => {
    const key = import.meta.env.VITE_GOOGLE_API_KEY || '';
    if (!key) {
        console.error("GOOGLE_API_KEY not configured");
    }
    return key;
};
