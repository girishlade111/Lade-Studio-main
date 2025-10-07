import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using placeholder values for development')
}

// Use placeholder values if environment variables are not set (for development)
const url = supabaseUrl || 'https://placeholder.supabase.co'
const anonKey = supabaseAnonKey || 'placeholder-key'

// Client for browser/client-side operations
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'lade-studio-web'
    }
  },
  db: {
    schema: 'public'
  }
})

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = createClient<Database>(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'lade-studio-admin'
      }
    },
    db: {
      schema: 'public'
    }
  }
)