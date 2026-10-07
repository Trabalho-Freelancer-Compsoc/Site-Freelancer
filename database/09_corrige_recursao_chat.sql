-- Corrige a recursão infinita nas regras do chat.
-- Antes: a policy de participantes_conversa consultava a própria participantes_conversa.
-- Para consultar, o banco aplicava a policy de novo, que consultava de novo... para sempre.
-- Erro: "infinite recursion detected in policy". Como conversas e mensagens também
-- consultam participantes_conversa, o chat inteiro parava de funcionar.
--
-- Solução: uma função com SECURITY DEFINER faz a verificação "sem passar pelas regras",
-- e as policies usam essa função.

begin;

-- 1) Função: "o usuário logado participa desta conversa?"
create or replace function public.eh_participante(p_conversa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participantes_conversa
    where conversa_id = p_conversa_id
      and usuario_id = (select auth.uid())
  );
$$;

-- Só usuários logados podem usar a função
revoke execute on function public.eh_participante(uuid) from public, anon;
grant execute on function public.eh_participante(uuid) to authenticated;

-- 2) participantes_conversa: vê os participantes das conversas em que está
drop policy if exists participante_ve_participantes on public.participantes_conversa;
create policy participante_ve_participantes on public.participantes_conversa
  for select to authenticated
  using (public.eh_participante(conversa_id));

-- 3) conversas: vê as conversas em que está
drop policy if exists participante_ve_conversa on public.conversas;
create policy participante_ve_conversa on public.conversas
  for select to authenticated
  using (public.eh_participante(id));

-- 4) mensagens: vê as mensagens das conversas em que está
drop policy if exists participante_ve_mensagens on public.mensagens;
create policy participante_ve_mensagens on public.mensagens
  for select to authenticated
  using (public.eh_participante(conversa_id));

-- 5) mensagens: envia em nome próprio, só em conversa em que está
drop policy if exists participante_envia_mensagem on public.mensagens;
create policy participante_envia_mensagem on public.mensagens
  for insert to authenticated
  with check (
    (select auth.uid()) = remetente_id
    and public.eh_participante(conversa_id)
  );

commit;
