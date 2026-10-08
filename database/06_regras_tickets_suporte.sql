-- Corrige as regras da tabela tickets_suporte.
-- Antes: a policy dono_ve_ticket (ALL) deixava o dono ler, criar, editar e APAGAR,
-- inclusive mudar o próprio status para "resolvido".
-- Depois: o dono só lê e abre chamados; status e respostas ficam com o servidor (suporte).

begin;

-- 1) Status com valores fixos, obrigatório e começando como 'aberto'
alter table public.tickets_suporte
  alter column status set default 'aberto';

alter table public.tickets_suporte
  alter column status set not null;

alter table public.tickets_suporte
  add constraint tickets_suporte_status_valido
  check (status in ('aberto', 'em_andamento', 'resolvido', 'fechado'));

-- 2) Remove a regra que deixava o dono fazer tudo
drop policy if exists dono_ve_ticket on public.tickets_suporte;

-- 3) O dono vê só os próprios chamados
create policy dono_ve_ticket on public.tickets_suporte
  for select to authenticated
  using (auth.uid() = usuario_id);

-- 4) O dono abre chamado em nome dele mesmo, sempre como 'aberto'
create policy dono_abre_ticket on public.tickets_suporte
  for insert to authenticated
  with check (auth.uid() = usuario_id and status = 'aberto');

-- Sem policy de UPDATE e DELETE: só o servidor (secret key) altera ou apaga.

commit;
