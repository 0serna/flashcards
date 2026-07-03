import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Sign in · Flashcards",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const googleSignInFailedMessage =
  "Google sign-in could not be completed. Please try again.";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authErrorMessage =
    params.error === "google_sign_in_failed"
      ? googleSignInFailedMessage
      : undefined;

  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/30 px-6 py-8 text-foreground">
      <LoginForm authErrorMessage={authErrorMessage} />
    </main>
  );
}
