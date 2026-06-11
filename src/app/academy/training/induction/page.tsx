import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import ChapterCanvas from "@/app/components/ChapterCanvas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Induction",
};

export default async function TrainingInductionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;
  const canEdit = canEditAcademy(userRole);

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ChapterCanvas
        label="INDUCTION"
        storageKey="academy.training.induction"
        pageCount={2}
        theme="teal"
        canEdit={canEdit}
        breadcrumb={[
          { label: "Home", href: "/home" },
          { label: "Academy", href: "/academy" },
          { label: "Training", href: "/academy/training" },
          { label: "Induction" },
        ]}
      />
    </AppShell>
  );
}
