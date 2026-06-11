import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";
import QuizAnswerForm from "@/app/components/QuizAnswerForm";
import { loadQuizForAnswering } from "@/app/academy/training/quiz/actions";

export const dynamic = "force-dynamic";

interface RouteParams {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  return { title: `Answer Quiz · ${id}` };
}

export default async function AnswerQuizPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const quizId = Number.parseInt(id, 10);
  if (!Number.isFinite(quizId) || quizId <= 0) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  const result = await loadQuizForAnswering(quizId);
  if (!result.ok) {
    return (
      <AppShell email={userEmail} role={userRole} name={userName}>
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Training", href: "/academy/training" },
              { label: "Quiz", href: "/academy/training/quiz" },
              { label: "Existing Quizes", href: "/academy/training/quiz/existing" },
              { label: "Answer" },
            ]}
          />
          <div
            role="alert"
            className="bg-rose-50 border border-rose-300 text-rose-800 rounded-lg px-4 py-3 text-sm font-medium mt-6"
          >
            Could not load quiz: {result.error}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Training", href: "/academy/training" },
              { label: "Quiz", href: "/academy/training/quiz" },
              { label: "Existing Quizes", href: "/academy/training/quiz/existing" },
              { label: result.data.title },
            ]}
          />
          <QuizAnswerForm quiz={result.data} />
        </div>
      </div>
    </AppShell>
  );
}
