import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import UpdateQuizesList from "@/app/components/UpdateQuizesList";
import { listQuizzes } from "@/app/academy/training/quiz/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Update Quizes",
};

export default async function UpdateQuizesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  const result = await listQuizzes();
  const quizzes = result.ok ? result.data : [];

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <UpdateQuizesList quizzes={quizzes} canEdit={canEdit} />
    </AppShell>
  );
}
