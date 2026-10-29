import { Router } from 'express'
import { listar, criar } from '../controllers/projetos.controller'

export const projetosRoutes = Router()

projetosRoutes.get('/', listar)
projetosRoutes.post('/', criar)
