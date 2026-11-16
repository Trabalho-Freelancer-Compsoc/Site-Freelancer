-- Abre a conversa entre quem está logado e quem publicou um post (projeto).
-- Antes: nenhuma regra deixava o usuário criar conversas nem participantes_conversa,
-- então o chat não tinha como começar.
--
-- Por que uma função e não uma regra de INSERT: abrir conversa grava em duas tabelas
-- (a conversa e os dois participantes). Com regras soltas, o usuário poderia criar uma
-- conversa e colocar nela quem quisesse. A função confere tudo e grava as três linhas
-- juntas: ou grava tudo, ou nada.
--
-- Uso pelo backend: supabaseDoUsuario(token).rpc('abrir_conversa', { p_projeto_id })
-- Devolve o id da conversa. Se a conversa já existe, devolve a mesma.
-- Ler e enviar mensagens continua com as regras do script 09.

begin;

create or replace function public.abrir_conversa(p_projeto_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu uuid := auth.uid();
  v_autor uuid;
  v_conversa uuid;
begin
  if v_eu is null then
    raise exception 'Faça login para conversar';
  end if;

  -- Quem publicou o post
  select cliente_id into v_autor
  from public.projetos
  where id = p_projeto_id;

  if v_autor is null then
    raise exception 'Post não encontrado';
  end if;

  if v_autor = v_eu then
    raise exception 'Este post é seu';
  end if;

  -- Se a pessoa clicar duas vezes seguidas, a segunda chamada espera a primeira
  -- terminar e encontra a conversa pronta, em vez de criar outra igual.
  perform pg_advisory_xact_lock(hashtext(p_projeto_id::text || v_eu::text));

  -- Já existe conversa deste post entre estas duas pessoas?
  select c.id into v_conversa
  from public.conversas c
  join public.participantes_conversa eu
    on eu.conversa_id = c.id and eu.usuario_id = v_eu
  join public.participantes_conversa autor
    on autor.conversa_id = c.id and autor.usuario_id = v_autor
  where c.projeto_id = p_projeto_id
  limit 1;

  if v_conversa is null then
    insert into public.conversas (projeto_id)
    values (p_projeto_id)
    returning id into v_conversa;

    insert into public.participantes_conversa (conversa_id, usuario_id)
    values (v_conversa, v_eu), (v_conversa, v_autor);
  end if;

  return v_conversa;
end;
$$;

-- Só usuários logados podem usar a função
revoke execute on function public.abrir_conversa(uuid) from public, anon;
grant execute on function public.abrir_conversa(uuid) to authenticated;

commit;
