import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { User, CalendarDays, Trophy, BookOpen, Monitor } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import Breadcrumb from "@/app/components/Breadcrumb";
import UserAuthGate from "@/app/components/UserAuthGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User",
};

interface UserCard {
  id: string;
  title: string;
  emoji?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg?: string;
  href: string;
}

const cards: UserCard[] = [
  { id: "schedule", title: "LESSONS", Icon: CalendarDays, iconBg: "bg-sky-500", href: "/academy/ebright-class-syllabus/user/schedule" },
  { id: "leaderboard", title: "LEADERBOARD", Icon: Trophy, iconBg: "bg-yellow-500", href: "/academy/ebright-class-syllabus/user/leaderboard" },
  { id: "user-manual", title: "USER MANUAL", Icon: BookOpen, iconBg: "bg-emerald-600", href: "/academy/ebright-class-syllabus/user/user-manual" },
  { id: "user-ui", title: "USER UI", Icon: Monitor, iconBg: "bg-slate-700", href: "/academy/ebright-class-syllabus/user/user-ui" },
];

export default async function UserPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <UserAuthGate email={userEmail}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/home" },
              { label: "Academy", href: "/academy" },
              { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
              { label: "User" },
            ]}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide">
              <User className="w-5 h-5" aria-hidden="true" />
              <span>USER</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map(({ id, title, emoji, Icon, iconBg, href }) => (
              <li key={id}>
                <Link
                  href={href}
                  className="group block h-full bg-white border border-slate-200 rounded-2xl p-8 text-center transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {Icon ? (
                    <div className="flex justify-center mb-4">
                      <div
                        className={`${iconBg ?? "bg-slate-500"} w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm`}
                      >
                        <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-5xl mb-4" aria-hidden="true">{emoji}</div>
                  )}
                  <h3 className="text-lg font-bold tracking-wide text-slate-900">{title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </UserAuthGate>
    </AppShell>
  );
}
