-- Dados iniciais: categorias de serviço.
-- A tabela estava vazia, e sem categorias a pesquisa por categoria não funciona.
-- Pode rodar mais de uma vez: só insere a categoria cujo slug ainda não existe.
-- icone fica vazio até o front-end decidir o formato (nome de ícone ou emoji).

begin;

insert into public.categorias (nome, slug)
select v.nome, v.slug
from (values
  ('Desenvolvimento e TI',      'desenvolvimento-ti'),
  ('Design e criação',          'design-criacao'),
  ('Redação e tradução',        'redacao-traducao'),
  ('Marketing e redes sociais', 'marketing-redes-sociais'),
  ('Fotografia e vídeo',        'fotografia-video'),
  ('Aulas e reforço',           'aulas-reforco'),
  ('Reformas e manutenção',     'reformas-manutencao'),
  ('Serviços domésticos',       'servicos-domesticos'),
  ('Eventos',                   'eventos'),
  ('Administração e finanças',  'administracao-financas')
) as v(nome, slug)
where not exists (
  select 1 from public.categorias c where c.slug = v.slug
);

commit;
