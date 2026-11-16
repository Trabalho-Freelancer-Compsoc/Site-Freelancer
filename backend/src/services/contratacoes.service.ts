import { supabase, supabaseAdmin } from '../database/supabase'
import { supabaseDoUsuario } from './auth.service'

// Erro "esperado" (regra do negócio): o controller devolve o status e a mensagem para o site
export class ErroNegocio extends Error {
  status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

// Aceitar, recusar, finalizar e avaliar só funcionam com a chave secreta (veja database/README.md,
// "Quem pode o quê"): nenhuma regra do banco libera isso para o usuário comum.
function admin() {
  if (!supabaseAdmin) {
    throw new ErroNegocio(
      503,
      'O servidor ainda não tem a SUPABASE_SECRET_KEY no backend/.env. Peça a chave para alguém do grupo, em particular.'
    )
  }
  return supabaseAdmin
}

function falhou(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

const COLUNAS_PROJETO = 'id, titulo, descricao, orcamento_min, localizacao, cliente_id, status'
const COLUNAS_PROPOSTA =
  'id, projeto_id, freelancer_id, valor_proposto, prazo_estimado_dias, carta_apresentacao, status, criado_em'
const COLUNAS_CONTRATO = 'id, proposta_id, projeto_id, cliente_id, freelancer_id, valor_total, status, data_inicio, data_fim'

type NovaSolicitacao = { projetoId: string; valor: number; prazoDias: number; mensagem: string }

// ---------------------------------------------------------------------
// 1) Quem clica em "Contratar Serviço" e preenche o formulário
// ---------------------------------------------------------------------
// Vira uma "proposta" pendente. A conexão age como o usuário, então as regras do banco
// (script 08) já impedem: contratar o próprio serviço e contratar serviço que não está aberto.
export async function criarSolicitacao(token: string, usuarioId: string, nova: NovaSolicitacao) {
  const cliente = supabaseDoUsuario(token)

  const { data: repetida, error: erroBusca } = await cliente
    .from('propostas')
    .select('id')
    .eq('projeto_id', nova.projetoId)
    .eq('freelancer_id', usuarioId)
    .eq('status', 'pendente')
    .limit(1)
  falhou(erroBusca)
  if (repetida && repetida.length > 0) {
    throw new ErroNegocio(409, 'Você já enviou um pedido para este serviço. Acompanhe em "Contratações".')
  }

  const { data, error } = await cliente
    .from('propostas')
    .insert({
      projeto_id: nova.projetoId,
      freelancer_id: usuarioId,
      valor_proposto: nova.valor,
      prazo_estimado_dias: nova.prazoDias,
      carta_apresentacao: nova.mensagem,
      status: 'pendente',
    })
    .select('id, status')
    .single()

  // 42501: a regra do banco recusou (serviço próprio ou serviço que não está mais aberto)
  if (error?.code === '42501') {
    throw new ErroNegocio(403, 'Não foi possível contratar: você não pode contratar o próprio serviço, ou ele não está mais aberto.')
  }
  // 23503: chave estrangeira (conta sem perfil ou serviço que não existe)
  if (error?.code === '23503') {
    throw new ErroNegocio(409, 'Sua conta ainda não tem perfil, ou o serviço não existe mais.')
  }
  falhou(error)
  return data
}

// ---------------------------------------------------------------------
// 2) Lista as contratações de quem está logado (as que fez e as recebidas)
// ---------------------------------------------------------------------
export async function listarContratacoes(token: string, usuarioId: string) {
  const cliente = supabaseDoUsuario(token)

  // O banco já entrega só as propostas em que o usuário é o freelancer ou o dono do projeto
  const { data: propostas, error } = await cliente
    .from('propostas')
    .select(COLUNAS_PROPOSTA)
    .order('criado_em', { ascending: false })
  falhou(error)
  const lista = propostas ?? []
  if (lista.length === 0) return []

  const projetoIds = [...new Set(lista.map((p) => p.projeto_id as string))]
  const propostaIds = lista.map((p) => p.id as string)

  const [resProjetos, resContratos] = await Promise.all([
    supabase.from('projetos').select(COLUNAS_PROJETO).in('id', projetoIds),
    cliente.from('contratos').select(COLUNAS_CONTRATO).in('proposta_id', propostaIds),
  ])
  falhou(resProjetos.error)
  falhou(resContratos.error)
  const projetos = resProjetos.data ?? []
  const contratos = resContratos.data ?? []

  const contratoIds = contratos.map((c) => c.id as string)
  const resAvaliacoes = contratoIds.length
    ? await supabase
        .from('avaliacoes')
        .select('contrato_id, avaliador_id, avaliado_id, nota, comentario')
        .in('contrato_id', contratoIds)
    : { data: [], error: null }
  falhou(resAvaliacoes.error)
  const avaliacoes = resAvaliacoes.data ?? []

  // Nomes das pessoas (perfis é de leitura pública, sem a coluna telefone)
  const pessoaIds = [
    ...new Set([...lista.map((p) => p.freelancer_id as string), ...projetos.map((p) => p.cliente_id as string)]),
  ]
  const resPerfis = await supabase.from('perfis').select('id, nome_completo').in('id', pessoaIds)
  falhou(resPerfis.error)
  const nomes = new Map((resPerfis.data ?? []).map((p) => [p.id as string, p.nome_completo as string]))

  return lista.map((p) => {
    const projeto = projetos.find((x) => x.id === p.projeto_id)
    const contrato = contratos.find((c) => c.proposta_id === p.id) ?? null
    const souPublicador = projeto?.cliente_id === usuarioId // dono do serviço publicado
    const outraPessoaId = souPublicador ? p.freelancer_id : projeto?.cliente_id
    const deste = avaliacoes.filter((a) => contrato && a.contrato_id === contrato.id)

    return {
      proposta_id: p.id,
      eu_sou: souPublicador ? 'publicador' : 'solicitante',
      status: p.status,
      valor: p.valor_proposto,
      prazo_dias: p.prazo_estimado_dias,
      mensagem: p.carta_apresentacao,
      criado_em: p.criado_em,
      outra_pessoa: nomes.get(outraPessoaId as string) ?? 'Usuário',
      projeto: projeto
        ? { id: projeto.id, titulo: projeto.titulo, localizacao: projeto.localizacao }
        : { id: p.projeto_id, titulo: 'Serviço', localizacao: null },
      contrato: contrato
        ? { id: contrato.id, status: contrato.status, valor_total: contrato.valor_total, data_fim: contrato.data_fim }
        : null,
      minha_avaliacao: deste.find((a) => a.avaliador_id === usuarioId) ?? null,
      avaliacao_recebida: deste.find((a) => a.avaliado_id === usuarioId) ?? null,
    }
  })
}

// ---------------------------------------------------------------------
// 3) Resposta de quem publicou o serviço (os dois precisam concordar)
// ---------------------------------------------------------------------
async function buscarPropostaPendente(propostaId: string) {
  const { data: proposta, error } = await admin()
    .from('propostas')
    .select(COLUNAS_PROPOSTA)
    .eq('id', propostaId)
    .maybeSingle()
  falhou(error)
  if (!proposta) throw new ErroNegocio(404, 'Pedido não encontrado.')
  if (proposta.status !== 'pendente') throw new ErroNegocio(409, 'Este pedido já foi respondido.')
  return proposta
}

async function buscarProjeto(projetoId: string) {
  const { data: projeto, error } = await admin().from('projetos').select(COLUNAS_PROJETO).eq('id', projetoId).maybeSingle()
  falhou(error)
  if (!projeto) throw new ErroNegocio(404, 'Serviço não encontrado.')
  return projeto
}

// Aceitar: a proposta vira contrato, o serviço passa a "em andamento" e os outros pedidos são recusados
export async function aceitarSolicitacao(usuarioId: string, propostaId: string) {
  const proposta = await buscarPropostaPendente(propostaId)
  const projeto = await buscarProjeto(proposta.projeto_id)

  if (projeto.cliente_id !== usuarioId) throw new ErroNegocio(403, 'Só quem publicou o serviço pode aceitar.')
  if (projeto.status !== 'aberto') throw new ErroNegocio(409, 'Este serviço não está mais aberto.')

  const { data: contrato, error: erroContrato } = await admin()
    .from('contratos')
    .insert({
      projeto_id: projeto.id,
      proposta_id: proposta.id,
      cliente_id: projeto.cliente_id,
      freelancer_id: proposta.freelancer_id,
      valor_total: proposta.valor_proposto,
    })
    .select('id')
    .single()
  falhou(erroContrato)

  const { error: e1 } = await admin().from('propostas').update({ status: 'aceita' }).eq('id', proposta.id)
  falhou(e1)
  const { error: e2 } = await admin().from('projetos').update({ status: 'em_andamento' }).eq('id', projeto.id)
  falhou(e2)
  const { error: e3 } = await admin()
    .from('propostas')
    .update({ status: 'rejeitada' })
    .eq('projeto_id', projeto.id)
    .eq('status', 'pendente')
  falhou(e3)

  return { contrato_id: contrato.id }
}

export async function recusarSolicitacao(usuarioId: string, propostaId: string) {
  const proposta = await buscarPropostaPendente(propostaId)
  const projeto = await buscarProjeto(proposta.projeto_id)
  if (projeto.cliente_id !== usuarioId) throw new ErroNegocio(403, 'Só quem publicou o serviço pode recusar.')

  const { error } = await admin().from('propostas').update({ status: 'rejeitada' }).eq('id', proposta.id)
  falhou(error)
}

// Quem pediu o serviço desiste antes de ser aceito
export async function cancelarSolicitacao(usuarioId: string, propostaId: string) {
  const proposta = await buscarPropostaPendente(propostaId)
  if (proposta.freelancer_id !== usuarioId) throw new ErroNegocio(403, 'Só quem fez o pedido pode cancelar.')

  const { error } = await admin().from('propostas').update({ status: 'retirada' }).eq('id', proposta.id)
  falhou(error)
}

// ---------------------------------------------------------------------
// 4) Finalizar o serviço e avaliar
// ---------------------------------------------------------------------
async function buscarContrato(contratoId: string) {
  const { data: contrato, error } = await admin()
    .from('contratos')
    .select(COLUNAS_CONTRATO)
    .eq('id', contratoId)
    .maybeSingle()
  falhou(error)
  if (!contrato) throw new ErroNegocio(404, 'Contrato não encontrado.')
  return contrato
}

// Quem publicou o serviço confirma que ele foi concluído
export async function finalizarServico(usuarioId: string, contratoId: string) {
  const contrato = await buscarContrato(contratoId)
  if (contrato.cliente_id !== usuarioId) throw new ErroNegocio(403, 'Só quem publicou o serviço pode finalizar.')
  if (contrato.status !== 'ativo') throw new ErroNegocio(409, 'Este serviço não está em andamento.')

  const hoje = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD, no horário do servidor
  const { error: e1 } = await admin().from('contratos').update({ status: 'concluido', data_fim: hoje }).eq('id', contrato.id)
  falhou(e1)
  const { error: e2 } = await admin().from('projetos').update({ status: 'concluido' }).eq('id', contrato.projeto_id)
  falhou(e2)
}

// Depois de concluído, cada um dos dois avalia o outro uma vez (1 a 5 estrelas)
export async function avaliarContrato(usuarioId: string, contratoId: string, nota: number, comentario: string | null) {
  const contrato = await buscarContrato(contratoId)

  const participa = contrato.cliente_id === usuarioId || contrato.freelancer_id === usuarioId
  if (!participa) throw new ErroNegocio(403, 'Só quem participou do serviço pode avaliar.')
  if (contrato.status !== 'concluido') throw new ErroNegocio(409, 'Só é possível avaliar depois que o serviço for finalizado.')

  const { data: jaAvaliou, error: erroBusca } = await admin()
    .from('avaliacoes')
    .select('id')
    .eq('contrato_id', contrato.id)
    .eq('avaliador_id', usuarioId)
    .limit(1)
  falhou(erroBusca)
  if (jaAvaliou && jaAvaliou.length > 0) throw new ErroNegocio(409, 'Você já avaliou este serviço.')

  const avaliadoId = contrato.cliente_id === usuarioId ? contrato.freelancer_id : contrato.cliente_id
  const { error } = await admin().from('avaliacoes').insert({
    contrato_id: contrato.id,
    avaliador_id: usuarioId,
    avaliado_id: avaliadoId,
    nota,
    comentario,
  })
  falhou(error)

  await recalcularMedia(avaliadoId)
}

// Recalcula avaliacao_media em perfis_freelancer, só com as notas recebidas como freelancer.
// Se a pessoa não tem linha em perfis_freelancer, não muda nada.
async function recalcularMedia(pessoaId: string) {
  const { data: contratos, error: e1 } = await admin().from('contratos').select('id').eq('freelancer_id', pessoaId)
  falhou(e1)
  const ids = (contratos ?? []).map((c) => c.id as string)
  if (ids.length === 0) return

  const { data: notas, error: e2 } = await admin()
    .from('avaliacoes')
    .select('nota')
    .eq('avaliado_id', pessoaId)
    .in('contrato_id', ids)
  falhou(e2)
  if (!notas || notas.length === 0) return

  const soma = notas.reduce((total, n) => total + Number(n.nota), 0)
  const media = Math.round((soma / notas.length) * 100) / 100
  const { error: e3 } = await admin().from('perfis_freelancer').update({ avaliacao_media: media }).eq('perfil_id', pessoaId)
  falhou(e3)
}
