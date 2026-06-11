"use client";

import { ChevronUp, TextCursorInput, Pencil } from "lucide-react";
import type { TextBox } from "../types";

const PRESETS = [
  { id: "small", label: "Small", w: 200, h: 60 },
  { id: "medium", label: "Medium", w: 320, h: 100 },
  { id: "large", label: "Large", w: 480, h: 160 },
];

export default function TextBoxPanel({
  currentPage,
  onAdd,
  onClose,
}: {
  currentPage: number;
  onAdd: (box: TextBox) => void;
  onClose: () => void;
}) {
  const add = (w: number, h: number) => {
    const box: TextBox = {
      id: `tb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      page: currentPage,
      x: 40,
      y: 40,
      width: w,
      height: h,
      content: "",
    };
    onAdd(box);
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TextCursorInput className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Text Box</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Preset sizes</div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => add(p.w, p.h)}
            className="px-3 py-3 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 text-center transition-colors"
          >
            <div className="font-bold text-slate-900">{p.label}</div>
            <div className="text-xs text-slate-500 mt-1">
              {p.w} × {p.h}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => add(320, 100)}
        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
      >
        <Pencil className="w-4 h-4" />
        Draw Text Box
      </button>

      <p className="text-xs italic text-slate-500 mt-3">
        Box auto-grows in height as you type. Hover the box to reveal a × delete button.
      </p>
    </div>
  );
}
