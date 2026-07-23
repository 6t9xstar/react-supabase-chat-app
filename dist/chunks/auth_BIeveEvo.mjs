import { createClient } from '@supabase/supabase-js';

const supabaseUrl = undefined                                   ;
const supabaseAnonKey = undefined                                        ;
{
  throw new Error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY environment variables");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    worker: true
  }
});

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`
  });
  if (error) throw error;
}
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      supabase.realtime.setAuth(session.access_token);
    }
    callback(event, session);
  });
}

export { signOut as a, signIn as b, getCurrentUser as g, onAuthStateChange as o, resetPassword as r, supabase as s };
