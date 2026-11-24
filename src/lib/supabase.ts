import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Ajuda a diagnosticar builds sem .env sem quebrar a UI inteira.
  console.warn('[OpenStore] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes.')
}

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'anon')

export const ASSET_BUCKET = 'app-assets'
export const FILE_BUCKET = 'app-files'

export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
