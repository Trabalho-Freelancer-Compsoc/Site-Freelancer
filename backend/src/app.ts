import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { supabase } from './database/supabase'
import { projetosRoutes } from './routes/projetos.routes'
import { authRoutes } from './routes/auth.routes'
import { contratacoesRoutes } from './routes/contratacoes.routes'
import { conversasRoutes } from './routes/conversas.routes'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ mensagem: 'Servidor funcionando!' })
})

app.get('/teste-banco', async (req, res) => {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome_usuario')
    .limit(1)

  if (error) {
    res.status(500).json({ conectado: false, erro: error.message })
    return
  }

  res.json({ conectado: true, perfis: data })
})

app.use('/projetos', projetosRoutes)
app.use('/auth', authRoutes)
app.use('/contratacoes', contratacoesRoutes)
app.use('/conversas', conversasRoutes)

// Se alguma rota der erro, responde em JSON (o site espera JSON, não uma página de erro)
app.use((erro: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(erro)
  res.status(500).json({ erro: erro.message })
})
