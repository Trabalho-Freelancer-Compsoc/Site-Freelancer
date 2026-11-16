import type { Request, Response } from 'express'
import type { UsuarioLogado } from '../middlewares/auth.middleware'
import {
  ErroNegocio,
  criarSolicitacao,
  listarContratacoes,
  aceitarSolicitacao,
  recusarSolicitacao,
  cancelarSolicitacao,
  finalizarServico,
  avaliarContrato,
} from '../services/contratacoes.service'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Erros "esperados" viram resposta com o status certo; o resto cai no tratador de erros do app.ts
async function tratar(res: Response, acao: () => Promise<void>) {
  try {
    await acao()
  } catch (erro) {
    if (erro instanceof ErroNegocio) {
      res.status(erro.status).json({ erro: erro.message })
      return
    }
    throw erro
  }
}

function idDaRota(req: Request, res: Response) {
  const id = String(req.params.id ?? '')
  if (!UUID.test(id)) {
    res.status(400).json({ erro: 'Identificador inválido' })
    return null
  }
  return id
}

// GET /contratacoes: pedidos que fiz e pedidos nos meus serviços
export async function listar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const token = res.locals.token as string
  await tratar(res, async () => {
    res.json(await listarContratacoes(token, usuario.id))
  })
}

// POST /contratacoes: formulário do "Contratar Serviço"
export async function criar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const token = res.locals.token as string

  const projetoId = String(req.body?.projeto_id ?? '')
  const valor = Number(String(req.body?.valor ?? '').trim())
  const prazoDias = Number(String(req.body?.prazo_dias ?? '').trim())
  const mensagem = String(req.body?.mensagem ?? '').trim()

  // Nunca confiar só no site: o servidor confere tudo antes de salvar
  if (!UUID.test(projetoId)) {
    res.status(400).json({ erro: 'Serviço inválido' })
    return
  }
  if (!Number.isFinite(valor) || valor < 0) {
    res.status(400).json({ erro: 'Valor inválido' })
    return
  }
  if (!Number.isInteger(prazoDias) || prazoDias < 1 || prazoDias > 365) {
    res.status(400).json({ erro: 'O prazo precisa ser de 1 a 365 dias' })
    return
  }
  if (!mensagem) {
    res.status(400).json({ erro: 'Escreva os detalhes do que você precisa' })
    return
  }
  if (mensagem.length > 1000) {
    res.status(400).json({ erro: 'Texto grande demais' })
    return
  }

  await tratar(res, async () => {
    const proposta = await criarSolicitacao(token, usuario.id, { projetoId, valor, prazoDias, mensagem })
    res.status(201).json(proposta)
  })
}

// POST /contratacoes/propostas/:id/aceitar
export async function aceitar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const id = idDaRota(req, res)
  if (!id) return
  await tratar(res, async () => {
    res.json(await aceitarSolicitacao(usuario.id, id))
  })
}

// POST /contratacoes/propostas/:id/recusar
export async function recusar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const id = idDaRota(req, res)
  if (!id) return
  await tratar(res, async () => {
    await recusarSolicitacao(usuario.id, id)
    res.json({ ok: true })
  })
}

// POST /contratacoes/propostas/:id/cancelar
export async function cancelar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const id = idDaRota(req, res)
  if (!id) return
  await tratar(res, async () => {
    await cancelarSolicitacao(usuario.id, id)
    res.json({ ok: true })
  })
}

// POST /contratacoes/contratos/:id/finalizar
export async function finalizar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const id = idDaRota(req, res)
  if (!id) return
  await tratar(res, async () => {
    await finalizarServico(usuario.id, id)
    res.json({ ok: true })
  })
}

// POST /contratacoes/contratos/:id/avaliar   { nota: 1 a 5, comentario?: texto }
export async function avaliar(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioLogado
  const id = idDaRota(req, res)
  if (!id) return

  const nota = Number(req.body?.nota)
  const comentario = String(req.body?.comentario ?? '').trim() || null
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    res.status(400).json({ erro: 'A nota precisa ser de 1 a 5 estrelas' })
    return
  }
  if ((comentario?.length ?? 0) > 500) {
    res.status(400).json({ erro: 'Comentário grande demais' })
    return
  }

  await tratar(res, async () => {
    await avaliarContrato(usuario.id, id, nota, comentario)
    res.status(201).json({ ok: true })
  })
}
