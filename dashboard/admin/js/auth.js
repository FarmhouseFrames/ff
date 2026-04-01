import { supabase } from './supabaseClient.js';

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function isAllowlisted(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function requireAdminSession() {
  const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;

  const session = sessionData.session;
  if (!session?.user) {
    window.location.href = './login.html';
    return;
  }

  const ok = await isAllowlisted(session.user.id);
  if (!ok) {
    await signOut();
    throw new Error('Not authorized: this account is not in admin allowlist.');
  }
}
