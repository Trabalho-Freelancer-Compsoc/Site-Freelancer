-- Bucket "avatares" no Storage: a foto de perfil (perfis.url_avatar).
--
-- REGISTRO: o bucket e as regras já existiam no Supabase e foram copiados
-- de lá em 15/11/2026. Este script serve para recriar o banco do zero.
-- Rodar de novo não muda nada.
--
-- Público, só imagens (JPG, PNG ou WebP), até 2 MB.
-- Cada usuário só envia e troca arquivos na pasta com o próprio id:
-- o site salva como  <id do usuário>/<nome do arquivo>.

begin;

-- 1) Bucket: público, só imagens, até 2 MB (2 * 1024 * 1024 bytes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 2) O dono envia a própria foto, na pasta com o id dele
drop policy if exists avatar_dono_envia on storage.objects;
create policy avatar_dono_envia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatares'
              and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) O dono troca a própria foto
drop policy if exists avatar_dono_troca on storage.objects;
create policy avatar_dono_troca on storage.objects
  for update to authenticated
  using (bucket_id = 'avatares'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Qualquer pessoa logada pode ver
drop policy if exists avatar_leitura on storage.objects;
create policy avatar_leitura on storage.objects
  for select to authenticated
  using (bucket_id = 'avatares');

commit;
