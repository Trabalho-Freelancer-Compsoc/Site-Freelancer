-- Regras de acesso (RLS) do banco, copiadas do Supabase em 2026-10-29.
-- Serve para recriar o banco do zero: rode depois do 01 e antes do 04 a 10.
-- NÃO rode no banco atual: as regras já existem e o script para no primeiro erro.
--
-- Ficam fora daqui as regras criadas pelos scripts de correção:
--   tickets_suporte (06), INSERT de propostas (08) e chat (09).
-- Sem "to ...", a regra vale para todos (public).
-- Em regra "for all" sem "with check", o banco usa o "using" também ao gravar.

begin;

-- 1) Liga o RLS nas 30 tabelas. Tabela com RLS e sem regra fica fechada
--    para os usuários; só o servidor (chave secreta) acessa.
alter table public.anexos                 enable row level security;
alter table public.assinaturas            enable row level security;
alter table public.avaliacoes             enable row level security;
alter table public.carteiras              enable row level security;
alter table public.categorias             enable row level security;
alter table public.contratos              enable row level security;
alter table public.conversas              enable row level security;
alter table public.denuncias              enable row level security;
alter table public.disputas               enable row level security;
alter table public.emblemas               enable row level security;
alter table public.emblemas_usuario       enable row level security;
alter table public.equipes                enable row level security;
alter table public.favoritos              enable row level security;
alter table public.habilidades            enable row level security;
alter table public.habilidades_freelancer enable row level security;
alter table public.habilidades_projeto    enable row level security;
alter table public.itens_portfolio        enable row level security;
alter table public.logs_auditoria         enable row level security;
alter table public.marcos                 enable row level security;
alter table public.membros_equipe         enable row level security;
alter table public.mensagens              enable row level security;
alter table public.notificacoes           enable row level security;
alter table public.participantes_conversa enable row level security;
alter table public.perfis                 enable row level security;
alter table public.perfis_freelancer      enable row level security;
alter table public.planos                 enable row level security;
alter table public.projetos               enable row level security;
alter table public.propostas              enable row level security;
alter table public.tickets_suporte        enable row level security;
alter table public.transacoes             enable row level security;

-- 2) Leitura pública
create policy leitura_publica on public.avaliacoes             for select using (true);
create policy leitura_publica on public.categorias             for select using (true);
create policy leitura_publica on public.emblemas               for select using (true);
create policy leitura_publica on public.emblemas_usuario       for select using (true);
create policy leitura_publica on public.habilidades            for select using (true);
create policy leitura_publica on public.habilidades_freelancer for select using (true);
create policy leitura_publica on public.habilidades_projeto    for select using (true);
create policy leitura_publica on public.itens_portfolio        for select using (true);
create policy leitura_publica on public.perfis                 for select using (true);
create policy leitura_publica on public.perfis_freelancer      for select using (true);
create policy leitura_publica on public.planos                 for select using (true);
create policy leitura_publica on public.projetos               for select using (true);

-- 3) Perfis
create policy dono_edita_perfil on public.perfis
  for update using (auth.uid() = id);

create policy dono_edita_perfil_freelancer on public.perfis_freelancer
  for all using (auth.uid() = perfil_id);

create policy dono_gerencia_habilidades on public.habilidades_freelancer
  for all using (auth.uid() = freelancer_id);

create policy dono_gerencia_portfolio on public.itens_portfolio
  for all using (auth.uid() = freelancer_id);

-- 4) Projetos e propostas
create policy cliente_cria_projeto on public.projetos
  for insert with check (auth.uid() = cliente_id);

create policy cliente_edita_projeto on public.projetos
  for update using (auth.uid() = cliente_id);

create policy dono_gerencia_favoritos on public.favoritos
  for all using (auth.uid() = usuario_id);

create policy envolvidos_veem_proposta on public.propostas
  for select using (
    auth.uid() = freelancer_id
    or auth.uid() in (
      select projetos.cliente_id
      from public.projetos
      where projetos.id = propostas.projeto_id
    )
  );

create policy envolvidos_veem_contrato on public.contratos
  for select using (auth.uid() = cliente_id or auth.uid() = freelancer_id);

-- 5) Dinheiro e avisos: o dono só lê
create policy dono_ve_carteira on public.carteiras
  for select using (auth.uid() = usuario_id);

create policy dono_ve_assinatura on public.assinaturas
  for select using (auth.uid() = usuario_id);

create policy dono_ve_notificacoes on public.notificacoes
  for select using (auth.uid() = usuario_id);

create policy envolvidos_veem_transacao on public.transacoes
  for select using (auth.uid() = usuario_origem or auth.uid() = usuario_destino);

commit;
