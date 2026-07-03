# Private flashcard images

Flashcard images are private study material, so uploads will use a private Supabase Storage bucket and the app will expose temporary signed URLs for display instead of public object URLs. Archived flashcards keep their images, while replacing or removing an image deletes the previous object to avoid stale private media accumulating outside the active flashcard content.
