-- Adiciona o local do serviço na tabela projetos.
-- O post do site tem o campo "Localidade", mas a tabela não tinha onde guardar.
-- Fica vazio (null) quando o post não informa local.

alter table public.projetos
  add column if not exists localizacao text;
