import express from 'express'
import cors from 'cors'
import { supabase } from './database/supabase'

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
