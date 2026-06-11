import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import TrainingHub from "@/app/components/TrainingHub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Courses",
};

export default async function TrainingCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;
  const canEdit = canEditAcademy(userRole);

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <TrainingHub canEdit={canEdit} />
    </AppShell>
  );
}
