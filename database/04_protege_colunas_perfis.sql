-- Impede que o usuário altere o próprio tipo_usuario e verificado.
-- O RLS controla linhas; aqui a permissão é controlada por COLUNA.
-- Aplicado no Supabase em 2026-10-06.

-- 1) Tira a permissão de editar a tabela inteira
revoke update on public.perfis from anon, authenticated;

-- 2) Devolve a permissão só para as colunas seguras
grant update (nome_completo, nome_usuario, url_avatar, bio,
              localizacao, pais, telefone, atualizado_em)
  on public.perfis to authenticated;
