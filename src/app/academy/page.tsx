import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import AcademyDashboard from "@/app/components/AcademyDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Academy",
};

export default async function AcademyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <AcademyDashboard />
    </AppShell>
  );
}
