

import { Plan, UserUsage, UserSettings } from "../types";

// Security constant for salt (In a real app, this might be dynamic or env based, 
// but for client-side obfuscation this is standard practice)
const ONIX_SALT = "onix-secure-salt-v1-do-not-change";

export interface EncryptedProfile {
    payload: string; // Base64 encoded JSON
    signature: string; // HMAC SHA-256
}

export interface UserProfileData {
    plan: Plan;
    usage: UserUsage;
    activatedKeys?: string[];
    subscriptionExpiry?: number;
    settings?: UserSettings; // Persisted user settings
}

// Helper: Convert string to ArrayBuffer
const str2ab = (str: string) => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

// Helper: Convert ArrayBuffer to Hex String
const ab2hex = (buffer: ArrayBuffer) => {
    return Array.prototype.map.call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
};

export const encryptProfile = async (data: UserProfileData): Promise<string> => {
    try {
        const jsonString = JSON.stringify(data);
        const payload = btoa(unescape(encodeURIComponent(jsonString))); // Base64 Safe
        
        // Create Signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(ONIX_SALT);
        const key = await window.crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signatureBuffer = await window.crypto.subtle.sign(
            "HMAC", key, encoder.encode(payload)
        );
        const signature = ab2hex(signatureBuffer);

        // Final Encrypted Object
        const encryptedObj: EncryptedProfile = { payload, signature };
        return JSON.stringify(encryptedObj);
    } catch (e) {
        console.error("Encryption failed", e);
        throw new Error("Security Error: Encryption Failed");
    }
};

export const decryptProfile = async (encryptedString: string): Promise<UserProfileData | null> => {
    try {
        const encryptedObj: EncryptedProfile = JSON.parse(encryptedString);
        
        if (!encryptedObj.payload || !encryptedObj.signature) return null;

        // Verify Signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(ONIX_SALT);
        const key = await window.crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
        );
        
        // Convert hex signature back to buffer for verification (simplified check)
        // Since verify needs buffer, we re-sign and compare strings for simplicity in this context
        const signatureBuffer = await window.crypto.subtle.sign(
            "HMAC", key, encoder.encode(encryptedObj.payload)
        );
        const calculatedSignature = ab2hex(signatureBuffer);

        if (calculatedSignature !== encryptedObj.signature) {
            console.warn("Security Alert: Signature mismatch. Data tampered.");
            return null; // Tampered data
        }

        // Decode
        const jsonString = decodeURIComponent(escape(atob(encryptedObj.payload)));
        return JSON.parse(jsonString);

    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
};
