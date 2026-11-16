-- Cria o bucket "curriculo" no Storage, para o upload de currículo do perfil.
-- Antes: só existia o bucket "avatares", e o upload do currículo falhava
-- porque o bucket não existia.
--
-- Segue o mesmo modelo do bucket "avatares":
--   público, e cada usuário só envia e troca arquivos na pasta com o próprio id.
--   O site precisa salvar o arquivo como  <id do usuário>/<nome do arquivo>.
--   Arquivo solto na raiz do bucket é bloqueado pelas regras abaixo.
--
-- Limites: PDF ou Word (.doc e .docx), até 5 MB. São os mesmos que o
-- perfil (frontend/scperfil.js) confere antes de enviar.
-- Atenção: por ser público, qualquer pessoa com o link abre o currículo.
--
-- Pode rodar de novo sem erro: não duplica o bucket nem as regras.
-- Se o bucket já existir, os limites dele são atualizados para os daqui.

begin;

-- 1) Bucket: público, PDF ou Word, até 5 MB (5 * 1024 * 1024 bytes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculo', 'curriculo', true, 5242880, array[
  'application/pdf',
  'application/msword',                                                       -- .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'   -- .docx
])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) O dono envia o próprio currículo, na pasta com o id dele
drop policy if exists curriculo_dono_envia on storage.objects;
create policy curriculo_dono_envia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'curriculo'
              and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) O dono troca o próprio currículo
drop policy if exists curriculo_dono_troca on storage.objects;
create policy curriculo_dono_troca on storage.objects
  for update to authenticated
  using (bucket_id = 'curriculo'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Qualquer pessoa logada pode ver
drop policy if exists curriculo_leitura on storage.objects;
create policy curriculo_leitura on storage.objects
  for select to authenticated
  using (bucket_id = 'curriculo');

commit;
