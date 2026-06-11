"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { FilePen, Clapperboard, BookOpen, ListChecks } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

interface TrainingCard {
  id: string;
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg: string;
  href: string;
}

const cards: TrainingCard[] = [
  {
    id: "induction",
    title: "INDUCTION",
    Icon: Clapperboard,
    iconBg: "bg-violet-600",
    href: "/academy/training/induction",
  },
  {
    id: "courses",
    title: "COURSES",
    Icon: BookOpen,
    iconBg: "bg-emerald-600",
    href: "/academy/training/courses",
  },
  {
    id: "quiz",
    title: "QUIZ",
    Icon: ListChecks,
    iconBg: "bg-indigo-600",
    href: "/academy/training/quiz",
  },
];

export default function TrainingLanding() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Training" },
          ]}
        />
        <header className="mb-10">
          <h1 className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            <FilePen className="w-8 h-8 md:w-9 md:h-9" aria-hidden="true" />
            <span>TRAINING</span>
          </h1>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(({ id, title, Icon, iconBg, href }) => (
            <li key={id}>
              <Link
                href={href}
                className="group block h-full bg-white border border-slate-200 rounded-2xl p-8 text-center transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="flex justify-center mb-4">
                  <div
                    className={`${iconBg} w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-lg font-bold tracking-wide text-slate-900">{title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
