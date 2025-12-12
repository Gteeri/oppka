
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

let supabase: SupabaseClient | null = null;

// Initialize Supabase if keys are present
export const getSupabase = () => {
  if (supabase) return supabase;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        console.error("Supabase init error", e);
      }
  }
  return supabase;
};

export const signInWithTwitter = async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase config missing");

    const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
};

export const signInWithDiscord = async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase config missing");

    const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
};

export const getSupabaseSession = async () => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
};

export const signOutSupabase = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
};
