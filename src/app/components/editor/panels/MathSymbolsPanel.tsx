"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronUp, Sigma } from "lucide-react";

type Category = "Basic" | "Compare" | "Greek" | "Set" | "Logic" | "Calc" | "Arrows" | "Misc";

const SYMBOLS: Record<Category, string[]> = {
  Basic: ["+", "−", "×", "÷", "±", "∓", "·", "•", "%", "‰"],
  Compare: ["=", "≠", "≈", "≡", "<", ">", "≤", "≥", "≪", "≫"],
  Greek: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "π", "σ", "φ", "ω", "Γ", "Δ", "Θ", "Λ", "Π", "Σ", "Φ", "Ω"],
  Set: ["∈", "∉", "⊂", "⊃", "⊆", "⊇", "∪", "∩", "∅", "∀", "∃"],
  Logic: ["∧", "∨", "¬", "⇒", "⇔", "∴", "∵", "⊕", "⊗"],
  Calc: ["∑", "∏", "∫", "∮", "∂", "∇", "√", "∞", "lim"],
  Arrows: ["→", "←", "↑", "↓", "↔", "⇒", "⇐", "⇑", "⇓", "⇔", "↗", "↘", "↙", "↖"],
  Misc: ["°", "′", "″", "ℝ", "ℕ", "ℤ", "ℚ", "ℂ", "∠", "⊥", "∥", "△", "□"],
};

const CATEGORIES = Object.keys(SYMBOLS) as Category[];

export default function MathSymbolsPanel({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [active, setActive] = useState<Category>("Basic");

  const insert = (sym: string) => {
    editor.chain().focus().insertContent(sym).run();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sigma className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Math Symbols</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              active === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {SYMBOLS[active].map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => insert(sym)}
            className="aspect-square rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xl text-slate-800 font-semibold transition-colors"
            aria-label={`Insert ${sym}`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
