-- Flashcard image storage policies.
--
-- The flashcard-images bucket is private and only the owner of a flashcard's
-- parent deck may read, write, update, or delete objects that belong to that
-- flashcard. Object paths are scoped as
--   <deckId>/<cardId>/<side>/<filename>
-- so the deck prefix can be checked against owned decks.

-- Ensure the bucket exists even when the host environment is created without
-- applying supabase/config.toml (e.g. on a fresh remote project).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flashcard-images',
  'flashcard-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Helper used by the policies below to confirm the first path segment is an
-- active deck owned by the current authenticated user.
create or replace function public.flashcard_images_path_belongs_to_user(
  bucket_id text,
  path text
)
returns boolean
language sql
stable
as $$
  select
    bucket_id = 'flashcard-images'
    and split_part(path, '/', 1) ~* '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1
      from public.decks d
      where d.id = split_part(path, '/', 1)::uuid
        and d.user_id = auth.uid()
        and d.archived_at is null
    );
$$;

drop policy if exists "flashcard_images_select" on storage.objects;
create policy "flashcard_images_select"
  on storage.objects
  for select
  to authenticated
  using (public.flashcard_images_path_belongs_to_user(bucket_id, name));

drop policy if exists "flashcard_images_insert" on storage.objects;
create policy "flashcard_images_insert"
  on storage.objects
  for insert
  to authenticated
  with check (public.flashcard_images_path_belongs_to_user(bucket_id, name));

drop policy if exists "flashcard_images_update" on storage.objects;
create policy "flashcard_images_update"
  on storage.objects
  for update
  to authenticated
  using (public.flashcard_images_path_belongs_to_user(bucket_id, name))
  with check (public.flashcard_images_path_belongs_to_user(bucket_id, name));

drop policy if exists "flashcard_images_delete" on storage.objects;
create policy "flashcard_images_delete"
  on storage.objects
  for delete
  to authenticated
  using (public.flashcard_images_path_belongs_to_user(bucket_id, name));
