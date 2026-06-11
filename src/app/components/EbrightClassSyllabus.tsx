"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { GraduationCap, Home, ChevronRight, Sparkles, Briefcase, CalendarDays, Trophy, BookOpen, Monitor } from "lucide-react";

interface SyllabusLevel {
  id: string;
  title: string;
  ageRange: string;
  ageColor: string;
  emoji?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg?: string;
  href: string;
}

const levels: SyllabusLevel[] = [
  {
    id: "jnr",
    title: "JNR",
    ageRange: "7 to 9 years old",
    ageColor: "text-teal-600",
    Icon: Sparkles,
    iconBg: "bg-teal-500",
    href: "/academy/ebright-class-syllabus/jnr",
  },
  {
    id: "mdr",
    title: "MDR",
    ageRange: "10 to 12 years old",
    ageColor: "text-[#ed1c24]",
    Icon: Briefcase,
    iconBg: "bg-[#ed1c24]",
    href: "/academy/ebright-class-syllabus/mdr",
  },
  {
    id: "snr",
    title: "SNR",
    ageRange: "15 to 16 years old",
    ageColor: "text-amber-700",
    Icon: GraduationCap,
    iconBg: "bg-amber-600",
    href: "/academy/ebright-class-syllabus/snr",
  },
];

interface CourseItem {
  id: string;
  title: string;
  emoji?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg?: string;
  href: string;
  subtitle?: string;
  subtitleColor?: string;
}

const courses: CourseItem[] = [
  {
    id: "schedule",
    title: "LESSONS",
    Icon: CalendarDays,
    iconBg: "bg-sky-500",
    href: "/academy/ebright-class-syllabus/user/schedule",
  },
  {
    id: "leaderboard",
    title: "LEADERBOARD",
    Icon: Trophy,
    iconBg: "bg-yellow-500",
    href: "/academy/ebright-class-syllabus/user/leaderboard",
  },
  {
    id: "user-manual",
    title: "USER MANUAL",
    Icon: BookOpen,
    iconBg: "bg-emerald-600",
    href: "/academy/ebright-class-syllabus/user/user-manual",
  },
  {
    id: "user-ui",
    title: "USER UI",
    Icon: Monitor,
    iconBg: "bg-slate-700",
    href: "/academy/ebright-class-syllabus/user/user-ui",
  },
];

export default function EbrightClassSyllabus() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/academy"
            className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            Academy
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Ebright Class Syllabus</span>
        </nav>

        <header className="mb-10">
          <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            <GraduationCap className="w-8 h-8 md:w-9 md:h-9" aria-hidden="true" />
            <span>Ebright Class Syllabus</span>
          </h1>
        </header>

        <section>
          <h2 className="text-xl font-bold tracking-wide text-slate-900 mb-4">CONTENT</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {levels.map(({ id, title, ageRange, ageColor, emoji, Icon, iconBg, href }) => (
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
                  <p className={`mt-2 text-sm italic ${ageColor}`}>{ageRange}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-wide text-slate-900 mb-4">COURSE</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(({ id, title, emoji, Icon, iconBg, href, subtitle, subtitleColor }) => (
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
                  {subtitle && (
                    <p className={`mt-2 text-sm italic ${subtitleColor ?? "text-slate-500"}`}>{subtitle}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
