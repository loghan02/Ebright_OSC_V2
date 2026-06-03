import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import ExistingQuizesTable from "@/app/components/ExistingQuizesTable";

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

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ExistingQuizesTable canEdit={canEdit} />
    </AppShell>
  );
}
