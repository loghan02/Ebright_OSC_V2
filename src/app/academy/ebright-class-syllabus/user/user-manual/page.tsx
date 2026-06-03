import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import ChapterCanvas from "@/app/components/ChapterCanvas";
import { canEditAcademy } from "@/lib/academy-permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Manual",
};

export default async function UserManualPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ChapterCanvas
        backHref="/academy/ebright-class-syllabus/user"
        label="USER MANUAL"
        storageKey="academy.ebright-class-syllabus.user.user-manual"
        pageCount={2}
        theme="amber"
        enableDocumentUpload
        canEdit={canEdit}
        breadcrumb={[
          { label: "Home", href: "/home" },
          { label: "Academy", href: "/academy" },
          { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
          { label: "User", href: "/academy/ebright-class-syllabus/user" },
          { label: "User Manual" },
        ]}
      />
    </AppShell>
  );
}
