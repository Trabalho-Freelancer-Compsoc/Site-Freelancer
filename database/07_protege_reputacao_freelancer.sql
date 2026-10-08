-- Impede que o freelancer altere os próprios números de reputação.
-- A policy dono_edita_perfil_freelancer (ALL) confere DE QUEM é o perfil,
-- mas não O QUE está sendo mudado: o dono podia escrever qualquer valor em
-- avaliacao_media, total_ganho e trabalhos_concluidos.
-- Agora o dono só cria e edita os campos descritivos; os números ficam com o servidor.

begin;

-- 1) Tira a permissão de criar e editar a tabela inteira
revoke insert, update on public.perfis_freelancer from anon, authenticated;

-- 2) Ao criar: só os campos descritivos (os números começam com o padrão 0)
grant insert (perfil_id, titulo, valor_hora, disponibilidade,
              nivel_experiencia, idiomas)
  on public.perfis_freelancer to authenticated;

-- 3) Ao editar: só os campos descritivos
grant update (titulo, valor_hora, disponibilidade, nivel_experiencia,
              idiomas, atualizado_em)
  on public.perfis_freelancer to authenticated;

commit;
