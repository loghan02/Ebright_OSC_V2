import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";
import BranchQuizSummaryTable from "@/app/components/BranchQuizSummaryTable";
import { BRANCHES } from "@/app/components/branches";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quiz",
};

interface QuizCard {
  id: string;
  title: string;
  emoji: string;
  href: string;
}

const cards: QuizCard[] = [
  { id: "existing", title: "EXISTING QUIZES", emoji: "📚", href: "/academy/training/quiz/existing" },
  { id: "create", title: "CREATE QUIZES", emoji: "➕", href: "/academy/training/quiz/create" },
  { id: "update", title: "UPDATE QUIZES", emoji: "✏️", href: "/academy/training/quiz/update" },
];


export default async function QuizPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Training", href: "/academy/training" },
              { label: "Quiz" },
            ]}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
              <span className="text-xl" aria-hidden="true">❓</span>
              <span>QUIZ</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {cards.map(({ id, title, emoji, href }) => (
              <li key={id}>
                <Link
                  href={href}
                  className="group block h-full bg-white border border-slate-200 rounded-2xl p-8 text-center transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="text-5xl mb-4" aria-hidden="true">{emoji}</div>
                  <h3 className="text-lg font-bold tracking-wide text-slate-900">{title}</h3>
                </Link>
              </li>
            ))}
          </ul>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <BranchQuizSummaryTable branches={BRANCHES} />

          </div>
        </div>
      </div>
    </AppShell>
  );
}
