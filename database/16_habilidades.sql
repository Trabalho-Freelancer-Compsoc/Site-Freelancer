-- Dados iniciais: lista de habilidades (tabela habilidades), para o freelancer marcar as suas.
-- REGISTRO: já aplicado no Supabase (44 habilidades, conferido em 16/11/2026).
-- Este script serve para recriar o banco do zero. O site ainda não tem tela que use a lista.
-- A tabela estava vazia, e só o servidor pode gravar nela (não há regra de INSERT).
-- Pode rodar mais de uma vez: só insere a habilidade cujo slug ainda não existe.
-- Os grupos seguem as categorias do script 03, só para organizar a lista.

begin;

insert into public.habilidades (nome, slug)
select v.nome, v.slug
from (values
  -- Desenvolvimento e TI
  ('Sites e lojas virtuais',          'sites-lojas-virtuais'),
  ('Aplicativos de celular',          'aplicativos-celular'),
  ('Manutenção de computadores',      'manutencao-computadores'),
  ('Planilhas e Excel',               'planilhas-excel'),
  ('Banco de dados',                  'banco-de-dados'),
  -- Design e criação
  ('Design gráfico',                  'design-grafico'),
  ('Criação de logotipos',            'criacao-logotipos'),
  ('Ilustração',                      'ilustracao'),
  ('Edição de imagens',               'edicao-imagens'),
  -- Redação e tradução
  ('Redação de textos',               'redacao-textos'),
  ('Revisão de textos',               'revisao-textos'),
  ('Tradução de inglês',              'traducao-ingles'),
  ('Tradução de espanhol',            'traducao-espanhol'),
  -- Marketing e redes sociais
  ('Gestão de redes sociais',         'gestao-redes-sociais'),
  ('Anúncios on-line',                'anuncios-online'),
  ('Criação de conteúdo',             'criacao-conteudo'),
  -- Fotografia e vídeo
  ('Fotografia de eventos',           'fotografia-eventos'),
  ('Fotografia de produtos',          'fotografia-produtos'),
  ('Edição de vídeo',                 'edicao-video'),
  ('Filmagem',                        'filmagem'),
  -- Aulas e reforço
  ('Reforço escolar',                 'reforco-escolar'),
  ('Aulas de matemática',             'aulas-matematica'),
  ('Aulas de inglês',                 'aulas-ingles'),
  ('Aulas de música',                 'aulas-musica'),
  -- Reformas e manutenção
  ('Pintura',                         'pintura'),
  ('Elétrica',                        'eletrica'),
  ('Hidráulica',                      'hidraulica'),
  ('Alvenaria',                       'alvenaria'),
  ('Marcenaria',                      'marcenaria'),
  ('Jardinagem',                      'jardinagem'),
  -- Serviços domésticos
  ('Faxina',                          'faxina'),
  ('Passar roupa',                    'passar-roupa'),
  ('Cozinhar',                        'cozinhar'),
  ('Cuidado de crianças',             'cuidado-criancas'),
  ('Cuidado de idosos',               'cuidado-idosos'),
  ('Costura',                         'costura'),
  -- Eventos
  ('Garçom',                          'garcom'),
  ('Decoração de festas',             'decoracao-festas'),
  ('Animação de festas',              'animacao-festas'),
  ('Bolos e doces',                   'bolos-doces'),
  -- Administração e finanças
  ('Contabilidade',                   'contabilidade'),
  ('Declaração de imposto de renda',  'imposto-de-renda'),
  ('Atendimento ao cliente',          'atendimento-cliente'),
  ('Organização de documentos',       'organizacao-documentos')
) as v(nome, slug)
where not exists (
  select 1 from public.habilidades h where h.slug = v.slug
);

commit;
