import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseUrl = 'https://placeholder.supabase.co';

try {
  const parsedUrl = new URL(rawUrl);
  if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
    supabaseUrl = parsedUrl.toString();
  }
} catch (e) {
  // Invalid URL, fallback to placeholder
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
