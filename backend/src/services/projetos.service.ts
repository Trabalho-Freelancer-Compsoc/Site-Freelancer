import { supabase, supabaseAdmin } from '../database/supabase'

// Temporário: enquanto o site não tem login, todo post fica no nome deste usuário de teste
const ID_USUARIO_TESTE = '9cd8b44b-30d0-4118-a421-032af498e6a2'

// Colunas que o site recebe
const COLUNAS = 'id, titulo, descricao, orcamento_min, localizacao, criado_em'

type NovoProjeto = {
  titulo: string
  descricao: string
  valor: number | null
  localizacao: string | null
}

// Busca os projetos abertos, do mais novo para o mais antigo
export async function listarProjetos() {
  const { data, error } = await supabase
    .from('projetos')
    .select(COLUNAS)
    .eq('status', 'aberto')
    .order('criado_em', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Salva um projeto novo e devolve como ficou no banco
export async function criarProjeto(novo: NovoProjeto) {
  // Sem login ainda, só a conexão admin consegue salvar no nome do usuário de teste
  if (!supabaseAdmin) throw new Error('Falta SUPABASE_SECRET_KEY no .env')

  const { data, error } = await supabaseAdmin
    .from('projetos')
    .insert({
      cliente_id: ID_USUARIO_TESTE,
      titulo: novo.titulo,
      descricao: novo.descricao,
      orcamento_min: novo.valor,
      orcamento_max: novo.valor,
      localizacao: novo.localizacao,
    })
    .select(COLUNAS)
    .single()

  if (error) throw new Error(error.message)
  return data
}
