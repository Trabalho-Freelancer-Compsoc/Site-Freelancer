import type { Request, Response } from 'express'
import { listarProjetos, criarProjeto } from '../services/projetos.service'

// GET /projetos: devolve a lista de projetos para o site
export async function listar(req: Request, res: Response) {
  const projetos = await listarProjetos()
  res.json(projetos)
}

// POST /projetos: recebe o post do site, confere os dados e salva
export async function criar(req: Request, res: Response) {
  const titulo = String(req.body?.servico ?? '').trim()
  const descricao = String(req.body?.descricao ?? '').trim()
  const localizacao = String(req.body?.local ?? '').trim() || null
  const valorTexto = String(req.body?.valor ?? '').trim()
  const valor = valorTexto === '' ? null : Number(valorTexto)

  // Nunca confiar só no site: o servidor confere tudo antes de salvar
  if (!titulo || !descricao) {
    res.status(400).json({ erro: 'Preencha o tipo do serviço e a descrição' })
    return
  }
  if (titulo.length > 100 || descricao.length > 2000 || (localizacao?.length ?? 0) > 100) {
    res.status(400).json({ erro: 'Texto grande demais' })
    return
  }
  if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
    res.status(400).json({ erro: 'Valor inválido' })
    return
  }

  const projeto = await criarProjeto({ titulo, descricao, valor, localizacao })
  res.status(201).json(projeto)
}
