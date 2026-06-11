import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import EbrightClassSyllabus from "@/app/components/EbrightClassSyllabus";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ebright Class Syllabus",
};

export default async function EbrightClassSyllabusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <EbrightClassSyllabus />
    </AppShell>
  );
}
