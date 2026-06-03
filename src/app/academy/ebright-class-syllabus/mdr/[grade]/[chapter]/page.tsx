import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import ChapterCanvas from "@/app/components/ChapterCanvas";
import { canEditAcademy } from "@/lib/academy-permissions";

export const dynamic = "force-dynamic";

const GRADE_RE = /^grade-([1-8])$/;
const CHAPTER_RE = /^chapter-(1[0-2]|[1-9])$/;

interface RouteParams {
  grade: string;
  chapter: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { grade, chapter } = await params;
  const g = grade.match(GRADE_RE)?.[1];
  const c = chapter.match(CHAPTER_RE)?.[1];
  if (!g || !c) return { title: "Chapter" };
  return { title: `MDR G${g} C${c}` };
}

export default async function MdrChapterPage({ params }: { params: Promise<RouteParams> }) {
  const { grade, chapter } = await params;
  const g = grade.match(GRADE_RE)?.[1];
  const c = chapter.match(CHAPTER_RE)?.[1];
  if (!g || !c) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const canEdit = canEditAcademy(userRole);
  const userName = session.user.name ?? null;

  const label = `G${g} C${c}`;
  const backHref = `/academy/ebright-class-syllabus/mdr/${grade}`;
  const storageKey = `academy.mdr.${grade}.${chapter}`;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ChapterCanvas
        backHref={backHref}
        label={label}
        storageKey={storageKey}
        pageCount={2}
        theme="rose"
        canEdit={canEdit}
        breadcrumb={[
          { label: "Home", href: "/home" },
          { label: "Academy", href: "/academy" },
          { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
          { label: "MDR", href: "/academy/ebright-class-syllabus/mdr" },
          {
            label: grade.replace("-", " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
            href: backHref,
          },
          { label },
        ]}
      />
    </AppShell>
  );
}
