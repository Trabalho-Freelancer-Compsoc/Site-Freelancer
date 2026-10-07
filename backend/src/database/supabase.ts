import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const chavePublica = process.env.SUPABASE_PUBLISHABLE_KEY
const chaveSecreta = process.env.SUPABASE_SECRET_KEY

if (!url || !chavePublica) {
  throw new Error('Faltam SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY no .env')
}

// No servidor, não guardar sessão de login na memória
const opcoes = { auth: { persistSession: false, autoRefreshToken: false } }

// Conexão comum: as regras de segurança (RLS) valem
export const supabase = createClient(url, chavePublica, opcoes)

// Conexão admin: ignora o RLS. Só existe se a chave secreta estiver no .env
export const supabaseAdmin = chaveSecreta
  ? createClient(url, chaveSecreta, opcoes)
  : null
