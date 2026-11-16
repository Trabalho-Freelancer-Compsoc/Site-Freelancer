import { Router } from 'express'
import { listar, abrir, mensagens, enviar } from '../controllers/conversas.controller'
import { exigirLogin } from '../middlewares/auth.middleware'

export const conversasRoutes = Router()

// O bate-papo inteiro exige login
conversasRoutes.use(exigirLogin)

conversasRoutes.get('/', listar) // minhas conversas
conversasRoutes.post('/', abrir) // abrir conversa com quem publicou um post
conversasRoutes.get('/:id/mensagens', mensagens) // mensagens de uma conversa
conversasRoutes.post('/:id/mensagens', enviar) // enviar mensagem
