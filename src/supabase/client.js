import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are configured
export const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
);

if (!isConfigured) {
    console.error(
        '⚠️ Supabase not configured!\n\n' +
        'Create a .env.local file in your project root with:\n\n' +
        'VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co\n' +
        'VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY\n\n' +
        'Get these values from: Supabase Dashboard → Settings → API'
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

export default supabase;
