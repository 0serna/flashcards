export default function Home() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Ready for a quiet study session
      </h1>
      <p className="mt-3 max-w-sm text-base text-muted-foreground">
        Your review queue will appear here when cards are ready.
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start by adding decks when deck creation is available.
      </p>
    </main>
  );
}
