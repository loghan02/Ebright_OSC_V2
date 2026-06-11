"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FilePen,
  Home,
  ChevronRight,
} from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface AcademyModule {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: IconComponent;
  accent: string;
  accentHover: string;
}

const modules: AcademyModule[] = [
  {
    id: "academy-dashboard",
    title: "Academy Dashboard",
    description: "Events, classes, and scheduling overview",
    href: "#",
    Icon: LayoutDashboard,
    accent: "bg-indigo-600",
    accentHover: "group-hover:bg-indigo-700",
  },
  {
    id: "ebright-class-syllabus",
    title: "Ebright Class Syllabus",
    description: "Course materials and syllabus library",
    href: "/academy/ebright-class-syllabus",
    Icon: BookOpen,
    accent: "bg-rose-600",
    accentHover: "group-hover:bg-rose-700",
  },
  {
    id: "training",
    title: "Employee Training",
    description: "Staff training materials and resources",
    href: "/academy/training",
    Icon: FilePen,
    accent: "bg-emerald-600",
    accentHover: "group-hover:bg-emerald-700",
  },
];

export default function AcademyDashboard() {
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
          <span className="text-slate-900 font-medium">Academy</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Academy
          </h1>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ id, title, description, href, Icon, accent, accentHover }) => (
            <li key={id}>
              <Link
                href={href}
                className="group block h-full bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`${accent} ${accentHover} w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-slate-300 transition-all duration-200 group-hover:text-slate-600 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
