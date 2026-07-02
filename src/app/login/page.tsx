import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Sign in · Flashcards",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const magicLinkFailedMessage =
  "This sign-in link is invalid or expired. Please request a new link.";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authErrorMessage =
    params.error === "magic_link_failed" ? magicLinkFailedMessage : undefined;

  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/30 px-6 py-8 text-foreground">
      <LoginForm authErrorMessage={authErrorMessage} />
    </main>
  );
}
