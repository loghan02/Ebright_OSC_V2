import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import CourseForm from "@/app/components/CourseForm";

export const dynamic = "force-dynamic";

const COURSE_RE = /^course-(\d+)$/;

interface RouteParams {
  course: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) return { title: "Course" };
  return { title: `Course ${n}` };
}

export default async function TrainingCoursePage({ params }: { params: Promise<RouteParams> }) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <CourseForm
        courseNum={n}
        storageKey={`academy.training.${course}.meta`}
        editorHref={`/academy/training/${course}/editor`}
      />
    </AppShell>
  );
}
