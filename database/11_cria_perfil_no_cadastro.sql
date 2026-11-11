-- Cria a linha em perfis quando alguém se cadastra.
-- Antes: não havia gatilho em auth.users nem regra de INSERT em perfis.
-- Quem se cadastrava pelo login ficava sem perfil, e projetos, propostas e chat
-- dependem de perfis.
--
-- O cadastro (supabase.auth.signUp) pode mandar em options.data:
--   nome_completo  texto; se faltar, usa a parte do e-mail antes do @
--   tipo_usuario   'freelancer' ou 'cliente'; qualquer outro valor vira 'cliente'
-- Ninguém vira admin pelo cadastro: só o servidor muda tipo_usuario (script 04).
--
-- Se este gatilho der erro, o cadastro inteiro falha com
-- "Database error saving new user". Por isso ele grava só o mínimo.

begin;

-- 1) Função que roda a cada novo usuário
create or replace function public.cria_perfil_no_cadastro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nome_completo'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
begin
  if new.raw_user_meta_data ->> 'tipo_usuario' = 'freelancer' then
    insert into public.perfis (id, nome_completo, tipo_usuario)
    values (new.id, v_nome, 'freelancer');
  else
    -- tipo_usuario fica com o padrão 'cliente'
    insert into public.perfis (id, nome_completo)
    values (new.id, v_nome);
  end if;
  return new;
end;
$$;

-- 2) Liga a função ao cadastro
drop trigger if exists ao_cadastrar_cria_perfil on auth.users;
create trigger ao_cadastrar_cria_perfil
  after insert on auth.users
  for each row execute function public.cria_perfil_no_cadastro();

-- 3) Cria o perfil de quem já se cadastrou antes deste script
insert into public.perfis (id, nome_completo)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data ->> 'nome_completo'), ''),
                split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
where not exists (select 1 from public.perfis p where p.id = u.id);

commit;
