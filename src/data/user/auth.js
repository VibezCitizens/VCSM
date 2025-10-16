// src/data/auth.js
import { supabase } from '@/lib/supabaseClient';

export async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data; // { user, session }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
