import type { Request, Response } from 'express'
import {
  abrirConversa,
  listarConversas,
  listarMensagens,
  enviarMensagem,
} from '../services/conversas.service'
import type { UsuarioLogado } from '../middlewares/auth.middleware'
import { UUID } from '../utils/validacao'

// Todas as rotas daqui passam antes pelo exigirLogin, que guarda o usuário e o token em res.locals
function quemEstaLogado(res: Response) {
  return { usuario: res.locals.usuario as UsuarioLogado, token: res.locals.token as string }
}

// GET /conversas: as conversas de quem está logado
export async function listar(req: Request, res: Response) {
  const { usuario, token } = quemEstaLogado(res)
  res.json(await listarConversas(token, usuario.id))
}

// POST /conversas  { projeto_id }: abre a conversa com quem publicou o post
export async function abrir(req: Request, res: Response) {
  const { token } = quemEstaLogado(res)
  const projetoId = String(req.body?.projeto_id ?? '')

  if (!UUID.test(projetoId)) {
    res.status(400).json({ erro: 'Post inválido' })
    return
  }

  const { conversaId, recusa } = await abrirConversa(token, projetoId)
  if (recusa) {
    res.status(400).json({ erro: recusa })
    return
  }
  res.json({ id: conversaId })
}

// GET /conversas/:id/mensagens: as mensagens de uma conversa
export async function mensagens(req: Request, res: Response) {
  const { token } = quemEstaLogado(res)
  const conversaId = String(req.params.id)

  if (!UUID.test(conversaId)) {
    res.status(400).json({ erro: 'Conversa inválida' })
    return
  }
  res.json(await listarMensagens(token, conversaId))
}

// POST /conversas/:id/mensagens  { conteudo }: envia uma mensagem
export async function enviar(req: Request, res: Response) {
  const { usuario, token } = quemEstaLogado(res)
  const conversaId = String(req.params.id)
  const conteudo = String(req.body?.conteudo ?? '').trim()

  if (!UUID.test(conversaId)) {
    res.status(400).json({ erro: 'Conversa inválida' })
    return
  }
  if (!conteudo) {
    res.status(400).json({ erro: 'Escreva uma mensagem' })
    return
  }
  if (conteudo.length > 2000) {
    res.status(400).json({ erro: 'Mensagem grande demais (máximo de 2000 caracteres)' })
    return
  }

  const mensagem = await enviarMensagem(token, conversaId, usuario.id, conteudo)
  if (!mensagem) {
    res.status(403).json({ erro: 'Você não participa desta conversa' })
    return
  }
  res.status(201).json(mensagem)
}
