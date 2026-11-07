import type { Request, Response, NextFunction } from 'express'
import { identificarUsuario } from '../services/auth.service'

// Formato do usuário que fica disponível em res.locals.usuario nas rotas protegidas
export type UsuarioLogado = { id: string; email: string | null }

// Como usar: projetosRoutes.post('/', exigirLogin, criar)
// Dentro do controller: const usuario = res.locals.usuario as UsuarioLogado  (usuario.id é o dono)
export async function exigirLogin(req: Request, res: Response, next: NextFunction) {
  // O site manda o token no cabeçalho:  Authorization: Bearer <token>
  const [tipo, token] = (req.headers.authorization ?? '').split(' ')

  if (tipo !== 'Bearer' || !token) {
    res.status(401).json({ erro: 'Faça login para continuar' })
    return
  }

  const usuario = await identificarUsuario(token)
  if (!usuario) {
    res.status(401).json({ erro: 'Sessão inválida ou expirada. Entre novamente' })
    return
  }

  res.locals.usuario = usuario
  res.locals.token = token // útil para supabaseDoUsuario(token)
  next()
}
