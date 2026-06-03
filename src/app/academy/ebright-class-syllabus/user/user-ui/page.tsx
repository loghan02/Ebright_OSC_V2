import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import UserUITable from "@/app/components/UserUITable";
import { canEditAcademy } from "@/lib/academy-permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User UI",
};

export default async function UserUIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <UserUITable canEdit={canEdit} />
    </AppShell>
  );
}
