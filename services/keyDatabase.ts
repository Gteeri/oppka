
import { Plan, ProductKey } from "../types";
import { MOCK_KEYS } from "./mockKeys"; // Used for initial seeding if file missing

// In a real environment, this logic sits on a server.
// Here we simulate the database operations using localStorage (or GitHub if we had the token here, but we keep it simple for now).
// This acts as the "Server-Side" Logic for Key Management.

const KEYS_STORAGE_KEY = 'gtayr_system_product_keys_v2';

class KeyDatabaseService {
    
    // Initialize the DB with seed data if empty
    private initDB(): ProductKey[] {
        const stored = localStorage.getItem(KEYS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        
        // Convert Mock Keys to new Structure for v2
        const initialKeys: ProductKey[] = MOCK_KEYS.map(k => ({
            code: k.code,
            type: k.type,
            durationDays: k.durationDays,
            maxUses: 1, // Legacy mock keys are single use
            currentUses: 0,
            createdAt: Date.now()
        }));
        
        // Add a multi-use promo key example
        initialKeys.push({
            code: "TELEGRAM2025",
            type: 'pro',
            durationDays: 7,
            maxUses: 1000,
            currentUses: 0,
            createdAt: Date.now()
        });

        localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(initialKeys));
        return initialKeys;
    }

    private saveDB(keys: ProductKey[]) {
        localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
    }

    async redeemKey(inputKey: string, userId: string): Promise<{ success: boolean, plan?: Plan, expiry?: number, error?: string }> {
        const keys = this.initDB();
        const keyIndex = keys.findIndex(k => k.code === inputKey.trim());
        
        if (keyIndex === -1) {
            return { success: false, error: 'invalid' };
        }

        const key = keys[keyIndex];

        // Validation
        if (key.currentUses >= key.maxUses) {
            return { success: false, error: 'used' }; // Limit reached
        }

        // Check if user already used this specific key code (prevent double dipping on promo codes)
        const userRedemptionLogKey = `redeemed_${userId}_${key.code}`;
        if (localStorage.getItem(userRedemptionLogKey)) {
             return { success: false, error: 'used' }; // User already used this code
        }

        // Activate
        const expiry = Date.now() + (key.durationDays * 24 * 60 * 60 * 1000);
        
        // Update DB
        keys[keyIndex].currentUses += 1;
        this.saveDB(keys);

        // Log redemption for user
        localStorage.setItem(userRedemptionLogKey, 'true');
        
        return { success: true, plan: key.type, expiry };
    }

    // Admin function to add keys (would be used in an admin panel)
    async generateKey(type: Plan, durationDays: number, maxUses: number = 1, code?: string): Promise<string> {
        const keys = this.initDB();
        const newCode = code || `GTI-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        const newKey: ProductKey = {
            code: newCode,
            type,
            durationDays,
            maxUses,
            currentUses: 0,
            createdAt: Date.now()
        };
        
        keys.push(newKey);
        this.saveDB(keys);
        return newCode;
    }
}

export const keyDatabase = new KeyDatabaseService();