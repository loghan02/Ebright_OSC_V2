import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canEditAcademy } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import ChapterCanvas from "@/app/components/ChapterCanvas";

export const dynamic = "force-dynamic";

const COURSE_RE = /^course-(\d+)$/;

interface RouteParams {
  course: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) return { title: "Course Editor" };
  return { title: `Course ${n} — Editor` };
}

export default async function TrainingCourseEditorPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;
  const canEdit = canEditAcademy(userRole);

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ChapterCanvas
        backHref={`/academy/training/${course}`}
        label={`COURSE ${n}`}
        storageKey={`academy.training.${course}`}
        pageCount={2}
        theme="teal"
        canEdit={canEdit}
        breadcrumb={[
          { label: "Home", href: "/home" },
          { label: "Academy", href: "/academy" },
          { label: "Training", href: "/academy/training" },
          { label: `Course ${n}`, href: `/academy/training/${course}` },
          { label: "Editor" },
        ]}
      />
    </AppShell>
  );
}
