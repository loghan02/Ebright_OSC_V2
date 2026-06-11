import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import ExistingQuizesTable from "@/app/components/ExistingQuizesTable";
import { listQuizzes } from "@/app/academy/training/quiz/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Existing Quizes",
};

export default async function ExistingQuizesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  const result = await listQuizzes();
  const quizzes = result.ok ? result.data : [];
  const loadError = result.ok ? null : result.error;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      {loadError && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div
            role="alert"
            className="bg-rose-50 border border-rose-300 text-rose-800 rounded-lg px-4 py-3 text-sm font-medium"
          >
            Could not load quizzes: {loadError}
          </div>
        </div>
      )}
      <ExistingQuizesTable quizzes={quizzes} canEdit={canEdit} />
    </AppShell>
  );
}
