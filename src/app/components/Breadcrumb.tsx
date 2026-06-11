"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit on the last/current item to render it as plain text
}

interface BreadcrumbProps {
  /** Crumbs in order, e.g. [{label: "Home", href: "/home"}, {label: "Academy", href: "/academy"}, {label: "JNR"}] */
  items: BreadcrumbItem[];
  /** Show a small house icon next to the first crumb. Defaults to true. */
  showHomeIcon?: boolean;
}

export default function Breadcrumb({ items, showHomeIcon = true }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const withHomeIcon = showHomeIcon && i === 0;
        const linkable = item.href && !isLast;

        const labelEl = (
          <span className="inline-flex items-center gap-1">
            {withHomeIcon && <Home className="w-4 h-4" aria-hidden="true" />}
            <span>{item.label}</span>
          </span>
        );

        return (
          <span key={`${i}-${item.label}`} className="inline-flex items-center gap-2">
            {linkable ? (
              <Link
                href={item.href!}
                className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              >
                {labelEl}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-900 font-medium" : ""}>{labelEl}</span>
            )}
            {!isLast && <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}
