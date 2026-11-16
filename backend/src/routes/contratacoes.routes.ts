import { Router } from 'express'
import { listar, criar, aceitar, recusar, cancelar, finalizar, avaliar } from '../controllers/contratacoes.controller'
import { exigirLogin } from '../middlewares/auth.middleware'

export const contratacoesRoutes = Router()

// Tudo aqui exige login
contratacoesRoutes.use(exigirLogin)

contratacoesRoutes.get('/', listar) // minhas contratações
contratacoesRoutes.post('/', criar) // formulário do "Contratar Serviço"
contratacoesRoutes.post('/propostas/:id/aceitar', aceitar)
contratacoesRoutes.post('/propostas/:id/recusar', recusar)
contratacoesRoutes.post('/propostas/:id/cancelar', cancelar)
contratacoesRoutes.post('/contratos/:id/finalizar', finalizar)
contratacoesRoutes.post('/contratos/:id/avaliar', avaliar)
