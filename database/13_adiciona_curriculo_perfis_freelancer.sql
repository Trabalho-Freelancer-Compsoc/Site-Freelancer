-- Coluna url_curriculo em perfis_freelancer: o link do currículo do freelancer.
-- O perfil (frontend/scperfil.js) envia o arquivo para o bucket "curriculo"
-- (script 12) e guarda aqui o link público dele.
--
-- REGISTRO: a coluna e a permissão foram criadas direto no Supabase
-- (conferido em 15/11/2026). Este script serve para recriar o banco do zero.
-- Rodar de novo não muda nada.
--
-- O script 07 só deixa o usuário preencher as colunas que estão numa lista.
-- Coluna fora da lista dá "permission denied", por isso o grant abaixo.
-- Os números de reputação continuam fora da lista (conferido em 15/11/2026).

begin;

-- 1) A coluna, vazia até o freelancer mandar um currículo
alter table public.perfis_freelancer
  add column if not exists url_curriculo text;

-- 2) Entra na lista do script 07: o dono preenche ao criar e ao editar
grant insert (url_curriculo), update (url_curriculo)
  on public.perfis_freelancer to authenticated;

commit;
