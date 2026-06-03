import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import QuizBuilder from "@/app/components/QuizBuilder";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Quiz",
};

export default async function CreateQuizPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <QuizBuilder canEdit={canEdit} />
    </AppShell>
  );
}
