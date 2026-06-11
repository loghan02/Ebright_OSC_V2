import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { BookOpen } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";
import ExerciseList from "@/app/components/course-platform/ExerciseList";
import StudentUpload from "@/app/components/course-platform/StudentUpload";
import AnswerNow from "@/app/components/course-platform/AnswerNow";
import MarkAnswers from "@/app/components/course-platform/MarkAnswers";
import { canCoachCourse } from "@/lib/academy-permissions";

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
  const canCoach = canCoachCourse(userRole);

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Training", href: "/academy/training" },
              { label: "Courses", href: "/academy/training/courses" },
              { label: `Course ${n}` },
            ]}
          />
          <header className="mb-10">
            <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              <BookOpen className="w-8 h-8 md:w-9 md:h-9" aria-hidden="true" />
              <span>COURSE {n}</span>
            </h1>
          </header>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold tracking-wide text-slate-900">Link To Watch Video</h2>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-wide text-slate-900 mb-4">Exercises</h2>
            <ExerciseList courseSlug={course} />
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-start gap-3">
              <StudentUpload courseSlug={course} />
              <AnswerNow courseSlug={course} />
              {canCoach && <MarkAnswers courseSlug={course} />}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
