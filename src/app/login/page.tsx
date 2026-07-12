import { AppScreen } from "@/components/app-screen";

import { LoginForm } from "./login-form";

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
    <AppScreen variant="centered">
      <LoginForm authErrorMessage={authErrorMessage} />
    </AppScreen>
  );
}
