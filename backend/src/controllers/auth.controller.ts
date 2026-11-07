import type { Request, Response } from 'express'

// GET /auth/eu: devolve quem está logado (id e e-mail).
// Só chega aqui quem passou pelo exigirLogin, que já colocou o usuário em res.locals.
export function eu(req: Request, res: Response) {
  res.json({ usuario: res.locals.usuario })
}
