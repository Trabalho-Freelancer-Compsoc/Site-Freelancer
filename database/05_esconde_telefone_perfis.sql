-- Esconde o telefone da leitura pública da tabela perfis.
-- A policy leitura_publica libera todas as LINHAS; aqui a leitura é limitada por COLUNA.
-- Efeito: select * em perfis com a chave pública dá erro; liste as colunas no código.
-- O servidor (secret key) continua lendo o telefone.
-- Aplicado no Supabase em 2026-10-06.

-- 1) Tira a permissão de ler a tabela inteira
revoke select on public.perfis from anon, authenticated;

-- 2) Devolve a leitura de todas as colunas, menos telefone
grant select (id, tipo_usuario, nome_completo, nome_usuario, url_avatar,
              bio, localizacao, pais, verificado, criado_em, atualizado_em)
  on public.perfis to anon, authenticated;
