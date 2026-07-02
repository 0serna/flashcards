import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Sign in · Flashcards",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/30 px-6 py-10 text-foreground">
      <LoginForm />
    </main>
  );
}
