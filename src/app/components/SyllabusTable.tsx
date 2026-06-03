"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Type, Highlighter, X, Home, ChevronRight } from "lucide-react";

export type SyllabusTheme = "teal" | "rose" | "amber";

interface ThemeClasses {
  pill: string;
  header: string;
  gradeText: string;
  gradeHover: string;
  ring: string;
  cellFocus: string;
}

const THEMES: Record<SyllabusTheme, ThemeClasses> = {
  teal: {
    pill: "bg-teal-700",
    header: "bg-teal-700",
    gradeText: "text-teal-700",
    gradeHover: "hover:text-teal-800",
    ring: "focus-visible:ring-teal-500",
    cellFocus: "focus-within:border-teal-600 focus-within:ring-teal-500/30",
  },
  rose: {
    pill: "bg-[#ed1c24]",
    header: "bg-[#ed1c24]",
    gradeText: "text-[#ed1c24]",
    gradeHover: "hover:text-[#c8161d]",
    ring: "focus-visible:ring-[#ed1c24]",
    cellFocus: "focus-within:border-[#ed1c24] focus-within:ring-[#ed1c24]/30",
  },
  amber: {
    pill: "bg-amber-700",
    header: "bg-amber-700",
    gradeText: "text-amber-800",
    gradeHover: "hover:text-amber-900",
    ring: "focus-visible:ring-amber-500",
    cellFocus: "focus-within:border-amber-700 focus-within:ring-amber-500/30",
  },
};

const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af", "#dc2626", "#ea580c",
  "#d97706", "#ca8a04", "#65a30d", "#16a34a", "#059669", "#0891b2",
  "#2563eb", "#4f46e5", "#7c3aed", "#c026d3", "#db2777", "#ef4444",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#fde68a", "#fed7aa", "#fecaca", "#fbcfe8", "#e9d5ff",
  "#bfdbfe", "#bae6fd", "#a7f3d0", "#bbf7d0", "#d9f99d", "#fef3c7",
];

const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const columns = ["enrol", "finished", "balance"] as const;
type ColumnKey = (typeof columns)[number];

type Row = Record<ColumnKey, string>;
type TableState = Record<string, Row>;

const emptyState = (): TableState =>
  Object.fromEntries(grades.map((g) => [g, { enrol: "", finished: "", balance: "" }]));

function normalize(raw: string): string {
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface LiveGradeStat {
  grade: number;
  enrol: number;
  finished: number;
  balance: number;
}

interface Props {
  theme: SyllabusTheme;
  storageKey: string;
  emoji: string;
  label: string;
  gradeHrefBase: string;
  /** When provided, the table renders read-only counts instead of editable cells. */
  liveData?: LiveGradeStat[];
  /** When false, the table renders read-only regardless of liveData. Default true. */
  canEdit?: boolean;
}

export default function SyllabusTable({ theme, storageKey, emoji, label, gradeHrefBase, liveData, canEdit = true }: Props) {
  const readOnly = Array.isArray(liveData) || !canEdit;
  const statsByGrade = new Map((liveData ?? []).map((s) => [s.grade, s]));
  const t = THEMES[theme];
  const [data, setData] = useState<TableState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ grade: string; col: ColumnKey } | null>(null);
  const [activeColor, setActiveColor] = useState("#0f172a");
  const [activeHighlight, setActiveHighlight] = useState("#fde68a");
  const [paletteOpen, setPaletteOpen] = useState<"text" | "highlight" | null>(null);

  useEffect(() => {
    if (!paletteOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-palette]")) setPaletteOpen(null);
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", close);
    };
  }, [paletteOpen]);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedRef = useRef<{ grade: string; col: ColumnKey } | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as TableState;
        const merged: TableState = { ...emptyState() };
        Object.entries(parsed).forEach(([g, row]) => {
          if (merged[g]) {
            merged[g] = {
              enrol: normalize(row?.enrol ?? ""),
              finished: normalize(row?.finished ?? ""),
              balance: normalize(row?.balance ?? ""),
            };
          }
        });
        setData(merged);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, loaded, storageKey]);

  // Push HTML into cell divs whenever the page first loads (so saved formatting renders)
  useEffect(() => {
    if (!loaded) return;
    grades.forEach((g) => {
      columns.forEach((c) => {
        const key = `${g}|${c}`;
        const el = cellRefs.current[key];
        if (el && el.innerHTML !== (data[g]?.[c] ?? "")) {
          el.innerHTML = data[g]?.[c] ?? "";
        }
      });
    });
    // Intentionally only run once when loaded flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const handleInput = (grade: string, col: ColumnKey, el: HTMLDivElement) => {
    const html = el.innerHTML;
    setData((prev) => ({ ...prev, [grade]: { ...prev[grade], [col]: html } }));
  };

  const handleFocus = (grade: string, col: ColumnKey) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocusedCell({ grade, col });
    lastFocusedRef.current = { grade, col };
  };

  const handleBlur = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setFocusedCell(null), 200);
  };

  // Capture the current selection range while it's still in the cell — call this
  // BEFORE any interaction that may steal focus (e.g. opening the color dialog).
  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const focus = lastFocusedRef.current;
    if (!focus) return;
    const cellEl = cellRefs.current[`${focus.grade}|${focus.col}`];
    if (cellEl && cellEl.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = (): HTMLDivElement | null => {
    const focus = lastFocusedRef.current;
    if (!focus) return null;
    const cellEl = cellRefs.current[`${focus.grade}|${focus.col}`];
    if (!cellEl) return null;
    cellEl.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
    return cellEl;
  };

  const exec = (cmd: string, value?: string) => {
    const el = restoreSelection();
    if (!el) return;
    try {
      // Use inline CSS instead of deprecated <font> tags so colors actually render
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      // ignore — some browsers don't support styleWithCSS
    }
    document.execCommand(cmd, false, value);
    const focus = lastFocusedRef.current;
    if (focus) handleInput(focus.grade, focus.col, el);
  };

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
          <Link
            href="/academy/ebright-class-syllabus"
            className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            Ebright Class Syllabus
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">{label}</span>
        </nav>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-2 ${t.pill} text-white px-5 py-2.5 rounded-xl font-bold tracking-wide`}
          >
            <span className="text-xl" aria-hidden="true">{emoji}</span>
            <span>{label}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div
            data-format-toolbar
            hidden={readOnly}
            className={`flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50 transition-opacity ${
              focusedCell ? "opacity-100" : "opacity-50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-2">
              Format
            </span>
            <ToolbarBtn onClick={() => exec("bold")} label="Bold (Ctrl+B)" disabled={!focusedCell}>
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("italic")} label="Italic (Ctrl+I)" disabled={!focusedCell}>
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => exec("underline")}
              label="Underline (Ctrl+U)"
              disabled={!focusedCell}
            >
              <Underline className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ColorPickerButton
              icon={<Type className="w-4 h-4" />}
              currentColor={activeColor}
              open={paletteOpen === "text"}
              onToggle={() => {
                saveSelection();
                setPaletteOpen((p) => (p === "text" ? null : "text"));
              }}
              onPick={(c) => {
                setActiveColor(c);
                exec("foreColor", c);
                setPaletteOpen(null);
              }}
              onCustomPick={(c) => {
                setActiveColor(c);
                exec("foreColor", c);
              }}
              palette={TEXT_COLORS}
              disabled={!focusedCell && !lastFocusedRef.current}
              label={focusedCell ? "Text color" : "Click a cell first"}
              allowClear
              onClear={() => {
                exec("foreColor", "inherit");
                setPaletteOpen(null);
              }}
            />
            <ColorPickerButton
              icon={<Highlighter className="w-4 h-4" />}
              currentColor={activeHighlight}
              open={paletteOpen === "highlight"}
              onToggle={() => {
                saveSelection();
                setPaletteOpen((p) => (p === "highlight" ? null : "highlight"));
              }}
              onPick={(c) => {
                setActiveHighlight(c);
                exec("hiliteColor", c);
                setPaletteOpen(null);
              }}
              onCustomPick={(c) => {
                setActiveHighlight(c);
                exec("hiliteColor", c);
              }}
              palette={HIGHLIGHT_COLORS}
              disabled={!focusedCell && !lastFocusedRef.current}
              label={focusedCell ? "Highlight" : "Click a cell first"}
              allowClear
              onClear={() => {
                exec("hiliteColor", "transparent");
                setPaletteOpen(null);
              }}
            />
            {!focusedCell && (
              <span className="ml-auto text-xs italic text-slate-400">
                Click a cell to enable formatting
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${t.header} text-white`}>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">GRADE</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">ENROL</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm border-r border-white/30">FINISHED</th>
                  <th className="text-left px-6 py-3 font-bold tracking-wide text-sm">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => {
                  const slug = grade.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <tr key={grade} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-2 py-2 whitespace-nowrap border-r border-slate-100">
                        <Link
                          href={`${gradeHrefBase}/${slug}`}
                          className={`inline-block px-4 py-2 font-bold ${t.gradeText} ${t.gradeHover} hover:underline underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 ${t.ring} rounded-sm`}
                        >
                          {grade}
                        </Link>
                      </td>
                      {columns.map((col, colIdx) => {
                        const key = `${grade}|${col}`;
                        const isFocused = focusedCell?.grade === grade && focusedCell?.col === col;
                        const isLast = colIdx === columns.length - 1;
                        if (readOnly) {
                          const gradeNum = Number(grade.replace(/[^0-9]/g, ""));
                          const stat = statsByGrade.get(gradeNum);
                          const value =
                            col === "enrol" ? stat?.enrol :
                            col === "finished" ? stat?.finished :
                            stat?.balance;
                          return (
                            <td
                              key={col}
                              className={`px-2 py-3 text-slate-900 tabular-nums ${isLast ? "" : "border-r border-slate-100"}`}
                            >
                              {value ?? 0}
                            </td>
                          );
                        }
                        return (
                          <td key={col} className={`px-2 py-2 ${isLast ? "" : "border-r border-slate-100"}`}>
                            <div
                              ref={(el) => {
                                cellRefs.current[key] = el;
                              }}
                              contentEditable
                              suppressContentEditableWarning
                              onInput={(e) => handleInput(grade, col, e.currentTarget)}
                              onFocus={() => handleFocus(grade, col)}
                              onBlur={handleBlur}
                              aria-label={`${grade} ${col}`}
                              className={`min-h-[36px] w-full px-3 py-2 rounded-md text-slate-900 border ${
                                isFocused ? "" : "border-transparent"
                              } hover:border-slate-200 ${t.cellFocus} focus:bg-white focus:outline-none focus:ring-2 transition-colors`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPickerButton({
  icon,
  currentColor,
  open,
  onToggle,
  onPick,
  onCustomPick,
  palette,
  disabled,
  label,
  allowClear,
  onClear,
}: {
  icon: React.ReactNode;
  currentColor: string;
  open: boolean;
  onToggle: () => void;
  onPick: (color: string) => void;
  onCustomPick: (color: string) => void;
  palette: string[];
  disabled: boolean;
  label: string;
  allowClear?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="relative inline-block" data-palette>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) onToggle();
        }}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 hover:bg-slate-100 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${open ? "bg-slate-100" : ""}`}
      >
        {icon}
        <span
          className="w-4 h-4 rounded border border-slate-300"
          style={{ backgroundColor: currentColor }}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56"
          onMouseDown={(e) => e.preventDefault()}
          data-palette
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {label}
          </div>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(c);
                }}
                aria-label={c}
                title={c}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-md border transition-transform hover:scale-110 ${
                  c === currentColor ? "ring-2 ring-offset-1 ring-slate-700 border-slate-700" : "border-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              Custom:
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onCustomPick(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
            </label>
            {allowClear && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onClear?.();
                }}
                title="Clear color"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
