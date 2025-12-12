
import { User, ChatSession, Plan, UserUsage, UserSettings } from '../types';
import { encryptProfile, decryptProfile } from './security';

const REPO_NAME = 'gtayr-data-storage'; // Dedicated repo for data

// --- API HELPERS ---

const ghRequest = async (token: string, path: string, options: RequestInit = {}) => {
    const url = `https://api.github.com/${path}`;
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok && res.status !== 404) {
        throw new Error(`GitHub API Error: ${res.status}`);
    }
    return res;
};

// --- AUTH & PROFILE ---

export const verifyGithubToken = async (token: string): Promise<User | null> => {
    try {
        // 1. Get User Info
        const userRes = await ghRequest(token, 'user');
        if (!userRes.ok) return null;
        const userData = await userRes.json();
        const identifier = userData.login || userData.id.toString(); // Use username as filename

        // 2. Check/Create Storage Repo
        let repoRes = await ghRequest(token, `repos/${userData.login}/${REPO_NAME}`);
        if (repoRes.status === 404) {
            // Create Private Repo
            await ghRequest(token, 'user/repos', {
                method: 'POST',
                body: JSON.stringify({
                    name: REPO_NAME,
                    private: true,
                    description: 'GTayr Data Storage (Do not delete)',
                    auto_init: true
                })
            });
            // Wait a moment for propagation
            await new Promise(r => setTimeout(r, 2000));
        }

        // 3. Load Profile Data (UserInfo, Settings, Theme, Keys)
        let plan: Plan = 'free';
        let usage = { date: new Date().toDateString(), imageCount: 0 };
        let expiry: number | undefined = undefined;
        let activatedKeys: string[] = [];
        let settings: UserSettings | undefined = undefined;

        try {
            // PATH CHANGE: storage/users/[username].json
            const fileRes = await ghRequest(token, `repos/${userData.login}/${REPO_NAME}/contents/storage/users/${identifier}.json`);
            if (fileRes.ok) {
                const fileData = await fileRes.json();
                const content = decodeURIComponent(escape(atob(fileData.content)));
                const decrypted = await decryptProfile(content);
                if (decrypted) {
                    plan = decrypted.plan;
                    usage = decrypted.usage;
                    activatedKeys = decrypted.activatedKeys || [];
                    expiry = decrypted.subscriptionExpiry;
                    settings = decrypted.settings;

                    // Reset usage if new day
                    if (usage.date !== new Date().toDateString()) {
                        usage = { date: new Date().toDateString(), imageCount: 0 };
                    }
                }
            }
        } catch (e) {
            console.warn("Profile load failed, starting fresh", e);
        }

        return {
            id: identifier, // Ensure ID matches filename logic
            name: userData.name || userData.login,
            username: userData.login,
            email: userData.email,
            avatar: userData.avatar_url,
            provider: 'github',
            plan,
            usage,
            subscriptionExpiry: expiry,
            activatedKeys,
            token: token, // Keep token in memory for session
            settings // Load persisted settings
        };

    } catch (e) {
        console.error("Token Verification Failed", e);
        return null;
    }
};

// --- CHAT STORAGE ---

export const loadSessionsFromGithub = async (user: User): Promise<ChatSession[]> => {
    if (!user.token) return []; // Fallback for social logins (local)

    try {
        // PATH CHANGE: storage/chats/[username].json
        const res = await ghRequest(user.token, `repos/${user.username}/${REPO_NAME}/contents/storage/chats/${user.id}.json`);
        if (!res.ok) return [];
        
        const data = await res.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
};

export const syncSessionsToGithub = async (user: User, sessions: ChatSession[]) => {
    if (!user.token) return; // Social login users save to localStorage only

    try {
        // 1. Get current SHA
        // PATH CHANGE: storage/chats/[username].json
        const path = `storage/chats/${user.id}.json`;
        const currentRes = await ghRequest(user.token, `repos/${user.username}/${REPO_NAME}/contents/${path}`);
        let sha: string | undefined;
        if (currentRes.ok) {
            const data = await currentRes.json();
            sha = data.sha;
        }

        // 2. Save
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(sessions))));
        await ghRequest(user.token, `repos/${user.username}/${REPO_NAME}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Sync chats for ${user.id}`,
                content,
                sha
            })
        });
    } catch (e) {
        console.error("Sync Failed", e);
    }
};

// --- PROFILE STORAGE ---

export const saveUserProfile = async (user: User) => {
    if (!user.token) return;

    const profileData = {
        plan: user.plan,
        usage: user.usage,
        activatedKeys: user.activatedKeys,
        subscriptionExpiry: user.subscriptionExpiry,
        settings: user.settings // Save settings to cloud
    };

    try {
        const encrypted = await encryptProfile(profileData);
        
        // PATH CHANGE: storage/users/[username].json
        const path = `storage/users/${user.id}.json`;

        const currentRes = await ghRequest(user.token, `repos/${user.username}/${REPO_NAME}/contents/${path}`);
        let sha: string | undefined;
        if (currentRes.ok) {
            const data = await currentRes.json();
            sha = data.sha;
        }

        const content = btoa(unescape(encodeURIComponent(encrypted)));
        await ghRequest(user.token, `repos/${user.username}/${REPO_NAME}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Update profile for ${user.id}`,
                content,
                sha
            })
        });
    } catch (e) {
        console.error("Profile Save Failed", e);
    }
};