import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import MdrSyllabus from "@/app/components/MdrSyllabus";
import { getGradeStats } from "@/lib/leads-db";
import { canEditAcademy } from "@/lib/academy-permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MDR Syllabus",
};

export default async function MdrSyllabusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  let liveData;
  try {
    liveData = await getGradeStats("MIDDLER");
  } catch (e) {
    console.error("Failed to load MDR grade stats:", e);
    liveData = undefined;
  }

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <MdrSyllabus liveData={liveData} canEdit={canEdit} />
    </AppShell>
  );
}
