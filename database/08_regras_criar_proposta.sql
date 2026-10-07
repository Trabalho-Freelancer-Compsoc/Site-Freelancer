-- Corrige a regra de criar proposta.
-- Antes: freelancer_cria_proposta só conferia QUEM envia (auth.uid() = freelancer_id).
-- O freelancer podia criar a proposta já aceita, mandar proposta para o próprio
-- projeto ou para um projeto que não está mais aberto.

begin;

-- 1) Remove a regra antiga
drop policy if exists freelancer_cria_proposta on public.propostas;

-- 2) Cria a regra nova, com todas as condições
create policy freelancer_cria_proposta on public.propostas
  for insert to authenticated
  with check (
    -- a proposta é enviada em nome de quem está logado
    (select auth.uid()) = freelancer_id
    -- toda proposta nasce pendente
    and status = 'pendente'
    -- o projeto existe, está aberto e não é do próprio freelancer
    and exists (
      select 1
      from public.projetos p
      where p.id = propostas.projeto_id
        and p.status = 'aberto'
        and p.cliente_id <> (select auth.uid())
    )
  );

commit;
