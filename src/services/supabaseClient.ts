/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. App running in local-only mode.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({ data: [], error: { message: 'Supabase credentials missing. Running in local-only mode.' } }),
            upsert: () => ({ error: { message: 'Supabase credentials missing. Running in local-only mode.' } })
        }),
        channel: () => ({ on: () => ({ subscribe: () => { } }) })
    } as any;
