import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Sign in · Flashcards",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-12">
      <LoginForm />
    </main>
  );
}
