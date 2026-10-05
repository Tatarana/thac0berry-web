import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'

// Cliente único do app. PKCE: o login com Google volta para o site com
// `?code=…`, que o cliente troca sozinho por uma sessão (detectSessionInUrl).
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Para onde o Google/Supabase devolve o usuário depois do login: a raiz do
// site (local ou GitHub Pages). Precisa estar em "Redirect URLs" no Supabase.
export function siteRootURL(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}
