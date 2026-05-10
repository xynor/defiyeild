import { createClient } from '@supabase/supabase-js'

// Server-side client — uses service_role key for full DB access (cron jobs, server components)
export function createServerClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
    )
}

// Browser-side client — uses anon key, safe for client components
export function createBrowserClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}
