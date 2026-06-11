"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Table as TableIcon, ChevronUp } from "lucide-react";

const MAX_ROWS = 6;
const MAX_COLS = 6;

export default function TablesPanel({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const insert = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Tables</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Hover to pick size · click to insert{" "}
        {hover && (
          <span className="font-semibold text-slate-700">
            — {hover.r}×{hover.c}
          </span>
        )}
      </p>
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, minmax(0, 1fr))` }}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: MAX_ROWS }).map((_, r) =>
          Array.from({ length: MAX_COLS }).map((_, c) => {
            const isActive = hover && r < hover.r && c < hover.c;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
                onClick={() => insert(r + 1, c + 1)}
                aria-label={`Insert ${r + 1}x${c + 1} table`}
                className={`w-6 h-6 rounded border transition-colors ${
                  isActive
                    ? "bg-teal-500 border-teal-600"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
              />
            );
          }),
        )}
      </div>
      <p className="text-xs italic text-slate-500 mt-3">
        Click any cell to edit. Use the table toolbar to add or remove rows and columns.
      </p>
    </div>
  );
}
