import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import QuizBuilder from "@/app/components/QuizBuilder";

export const dynamic = "force-dynamic";

interface RouteParams {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  return { title: `Update Quiz · ${id}` };
}

export default async function UpdateQuizPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const quizId = Number.parseInt(id, 10);
  if (!Number.isFinite(quizId) || quizId <= 0) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <QuizBuilder editQuizId={quizId} canEdit={canEdit} />
    </AppShell>
  );
}
