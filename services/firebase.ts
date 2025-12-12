
// FIREBASE REMOVED AS REQUESTED
// This file serves as a placeholder to prevent import errors during refactoring.
// All logic is now in githubStorage.ts

import { User } from '../types';

export const initFirebase = () => {};
export const isFirebaseInitialized = () => false;
export const signInWithGithub = async () => { throw new Error("Use GitHub Token Login"); };
export const mockSocialLogin = async () => { throw new Error("Use Local Mock"); };
export const logoutUser = async () => {};
export const getUserChats = async () => [];
export const saveUserChat = async () => {};
export const deleteUserChat = async () => {};
export const redeemProductKey = async () => ({ success: false, error: "Firebase Disabled" });
export const updateUserUsage = async () => {};
