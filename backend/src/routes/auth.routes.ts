import { Router } from 'express'
import { eu } from '../controllers/auth.controller'
import { exigirLogin } from '../middlewares/auth.middleware'

export const authRoutes = Router()

authRoutes.get('/eu', exigirLogin, eu)
