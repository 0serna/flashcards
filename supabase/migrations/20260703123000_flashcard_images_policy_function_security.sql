-- Allow flashcard image storage policies to check deck ownership without
-- granting broad table access to authenticated users.
create or replace function public.flashcard_images_path_belongs_to_user(
  bucket_id text,
  path text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
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

revoke all on function public.flashcard_images_path_belongs_to_user(text, text) from public;
grant execute on function public.flashcard_images_path_belongs_to_user(text, text) to authenticated;
