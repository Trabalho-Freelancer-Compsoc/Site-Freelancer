# Site-Freelancer
Repositorio para o site

## Como rodar o projeto

Precisa ter o [Node.js](https://nodejs.org) instalado (versão 22 ou mais nova).

```
git pull
cd backend
npm run setup
npm run dev
```

O `npm run setup` cria o arquivo `backend/.env` com a conexão do banco e instala as dependências. Só precisa rodar na primeira vez.

Para ver se funcionou, abra no navegador:
- http://localhost:3000 → deve aparecer "Servidor funcionando!"
- http://localhost:3000/teste-banco → deve aparecer `"conectado": true`

Para desligar o servidor, aperte `Ctrl + C` no terminal.

## Cuidados

- **Banco compartilhado:** todo mundo usa o mesmo banco do Supabase. O que você cria ou apaga aparece para o grupo inteiro.
- **Secret key:** nunca coloque no GitHub. Se precisar dela, peça para alguém do grupo em particular e cole só no seu `backend/.env`.
