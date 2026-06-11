import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canCoachCourse } from "@/lib/academy-permissions";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";
import CourseReviewForm from "@/app/components/course-platform/CourseReviewForm";

export const dynamic = "force-dynamic";

const COURSE_RE = /^course-(\d+)$/;

interface RouteParams {
  course: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) return { title: "Review" };
  return { title: `Course ${n} — Review` };
}

export default async function TrainingCourseReviewPage({ params }: { params: Promise<RouteParams> }) {
  const { course } = await params;
  const n = course.match(COURSE_RE)?.[1];
  if (!n) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userRole = (session.user as { role?: string }).role ?? "";
  if (!canCoachCourse(userRole)) {
    redirect(`/academy/training/${course}`);
  }

  const userEmail = session.user.email;
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Training", href: "/academy/training" },
              { label: "Courses", href: "/academy/training/courses" },
              { label: `Course ${n}`, href: `/academy/training/${course}` },
              { label: "Review" },
            ]}
          />
          <CourseReviewForm courseSlug={course} courseNum={n} />
        </div>
      </div>
    </AppShell>
  );
}
