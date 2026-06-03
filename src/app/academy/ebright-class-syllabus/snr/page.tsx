import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import SnrSyllabus from "@/app/components/SnrSyllabus";
import { getGradeStats } from "@/lib/leads-db";
import { canEditAcademy } from "@/lib/academy-permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SNR Syllabus",
};

export default async function SnrSyllabusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  let liveData;
  try {
    liveData = await getGradeStats("SENIOR");
  } catch (e) {
    console.error("Failed to load SNR grade stats:", e);
    liveData = undefined;
  }

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <SnrSyllabus liveData={liveData} canEdit={canEdit} />
    </AppShell>
  );
}
