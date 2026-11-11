import { supabase } from '../database/supabase'
import { supabaseDoUsuario } from './auth.service'

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

// Salva um projeto novo no nome de quem está logado e devolve como ficou no banco.
// Devolve null se a conta ainda não tem linha em perfis.
export async function criarProjeto(token: string, clienteId: string, novo: NovoProjeto) {
  // A conexão age como o usuário: a regra cliente_cria_projeto do banco
  // só aceita se cliente_id for o próprio usuário logado (auth.uid())
  const { data, error } = await supabaseDoUsuario(token)
    .from('projetos')
    .insert({
      cliente_id: clienteId,
      titulo: novo.titulo,
      descricao: novo.descricao,
      orcamento_min: novo.valor,
      orcamento_max: novo.valor,
      localizacao: novo.localizacao,
    })
    .select(COLUNAS)
    .single()

  // 23503: chave estrangeira. cliente_id aponta para perfis.id,
  // então este erro quer dizer que a conta não tem perfil (database/11_cria_perfil_no_cadastro.sql)
  if (error?.code === '23503') return null
  if (error) throw new Error(error.message)
  return data
}
