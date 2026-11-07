import { createClient } from '@supabase/supabase-js'
import { supabase } from '../database/supabase'

// Descobre quem é o dono do token (JWT) que o site mandou.
// Devolve null se o token for inválido ou estiver expirado.
export async function identificarUsuario(token: string) {
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}

// Conexão que age COMO o usuário logado: no banco, auth.uid() passa a ser o id dele,
// então as políticas de segurança (RLS) valem para ele.
// (supabase.ts já garante que SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY existem)
export function supabaseDoUsuario(token: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}
