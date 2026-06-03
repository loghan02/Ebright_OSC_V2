import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";

export const dynamic = "force-dynamic";

const VALID_GRADES = new Set([
  "grade-1",
  "grade-2",
  "grade-3",
  "grade-4",
  "grade-5",
  "grade-6",
  "grade-7",
  "grade-8",
]);

const CHAPTERS_PER_GRADE = 12;

function gradeLabel(slug: string): string {
  return slug.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function gradeNumber(slug: string): number {
  return Number(slug.replace("grade-", ""));
}

export async function generateMetadata({ params }: { params: Promise<{ grade: string }> }) {
  const { grade } = await params;
  return { title: `MDR ${gradeLabel(grade)}` };
}

export default async function MdrGradePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade } = await params;
  if (!VALID_GRADES.has(grade)) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;
  const label = gradeLabel(grade);
  const n = gradeNumber(grade);
  const chapters = Array.from({ length: CHAPTERS_PER_GRADE }, (_, i) => i + 1);

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
              { label: "MDR", href: "/academy/ebright-class-syllabus/mdr" },
              { label: label },
            ]}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-rose-800 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
              <span className="text-xl" aria-hidden="true">💼</span>
              <span>{label.toUpperCase()}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-wide text-slate-900 mb-6">CHAPTERS</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {chapters.map((c) => (
                <li key={c}>
                  <Link
                    href={`/academy/ebright-class-syllabus/mdr/${grade}/chapter-${c}`}
                    className="group block bg-rose-200 hover:bg-rose-300 rounded-2xl py-8 px-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                  >
                    <div className="text-5xl mb-3" aria-hidden="true">📘</div>
                    <div className="font-bold tracking-wide text-rose-900">
                      G{n} C{c}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
