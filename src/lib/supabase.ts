import { createClient } from '@supabase/supabase-js'

// Check if environment variables are available and provide fallbacks for SSG
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the browser
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: typeof window !== 'undefined', // Only persist sessions in browser environments
    }
  }
); 