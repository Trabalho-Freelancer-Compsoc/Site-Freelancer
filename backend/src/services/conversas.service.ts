import { supabaseDoUsuario } from './auth.service'

// Todas as consultas usam a conexão do usuário logado: as regras do banco (RLS, script 09)
// garantem que cada pessoa só vê e escreve nas conversas em que participa.

const COLUNAS_MENSAGEM = 'id, remetente_id, conteudo, criado_em'

type Mensagem = { id: string; remetente_id: string; conteudo: string | null; criado_em: string }

// Formato de cada linha que o banco devolve na lista de conversas
type LinhaConversa = {
  id: string
  criado_em: string
  projetos: { id: string; titulo: string } | null
  participantes_conversa: { usuario_id: string; perfis: { nome_completo: string } | null }[]
  mensagens: Omit<Mensagem, 'id'>[]
}

// Abre a conversa com quem publicou o post, ou devolve a que já existe.
// Quem confere as regras é a função abrir_conversa do banco (database/15_abre_conversa.sql).
export async function abrirConversa(token: string, projetoId: string) {
  const { data, error } = await supabaseDoUsuario(token).rpc('abrir_conversa', {
    p_projeto_id: projetoId,
  })

  // P0001: a função recusou (post não existe ou é da própria pessoa). A mensagem já vem em português
  if (error?.code === 'P0001') return { conversaId: null, recusa: error.message }
  // PGRST202: a função não existe no banco
  if (error?.code === 'PGRST202') throw new Error('Falta rodar database/15_abre_conversa.sql no Supabase')
  if (error) throw new Error(error.message)
  return { conversaId: data as string, recusa: null }
}

// Lista as conversas de quem está logado, com o post, a outra pessoa e a última mensagem.
// A mais movimentada aparece primeiro.
export async function listarConversas(token: string, usuarioId: string) {
  const { data, error } = await supabaseDoUsuario(token)
    .from('conversas')
    .select(
      'id, criado_em, projetos(id, titulo), participantes_conversa(usuario_id, perfis(nome_completo)), mensagens(conteudo, remetente_id, criado_em)'
    )
    // de cada conversa, traz só a mensagem mais nova
    .order('criado_em', { referencedTable: 'mensagens', ascending: false })
    .limit(1, { referencedTable: 'mensagens' })

  if (error) throw new Error(error.message)

  const linhas = (data ?? []) as unknown as LinhaConversa[]
  return linhas
    .map((c) => {
      const outro = c.participantes_conversa.find((p) => p.usuario_id !== usuarioId)
      const ultima = c.mensagens[0] ?? null
      return {
        id: c.id,
        projeto: c.projetos,
        outro: { id: outro?.usuario_id ?? null, nome: outro?.perfis?.nome_completo ?? 'Usuário' },
        ultima_mensagem: ultima,
        atualizado_em: ultima?.criado_em ?? c.criado_em,
      }
    })
    .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
}

// Últimas 100 mensagens da conversa, da mais antiga para a mais nova.
// Se a pessoa não participa da conversa, o banco devolve a lista vazia.
export async function listarMensagens(token: string, conversaId: string) {
  const { data, error } = await supabaseDoUsuario(token)
    .from('mensagens')
    .select(COLUNAS_MENSAGEM)
    .eq('conversa_id', conversaId)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return ((data ?? []) as Mensagem[]).reverse()
}

// Grava a mensagem em nome de quem está logado e devolve como ficou no banco.
// Devolve null se a pessoa não participa da conversa.
export async function enviarMensagem(token: string, conversaId: string, remetenteId: string, conteudo: string) {
  const { data, error } = await supabaseDoUsuario(token)
    .from('mensagens')
    .insert({ conversa_id: conversaId, remetente_id: remetenteId, conteudo })
    .select(COLUNAS_MENSAGEM)
    .single()

  // 42501: a regra participante_envia_mensagem (script 09) recusou
  if (error?.code === '42501') return null
  if (error) throw new Error(error.message)
  return data as Mensagem
}
