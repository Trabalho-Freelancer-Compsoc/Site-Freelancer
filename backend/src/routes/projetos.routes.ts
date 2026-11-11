import { Router } from 'express'
import { listar, criar } from '../controllers/projetos.controller'
import { exigirLogin } from '../middlewares/auth.middleware'

export const projetosRoutes = Router()

projetosRoutes.get('/', listar) // ver os posts: aberto para todos
projetosRoutes.post('/', exigirLogin, criar) // publicar: só quem está logado
