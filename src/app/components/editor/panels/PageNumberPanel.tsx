"use client";

import { ChevronUp, Hash, Check, Italic, Bold } from "lucide-react";
import type { PageNumberConfig, PageNumberStyle, Position } from "../types";
import { formatPageNumber } from "../types";

const STYLES: { value: PageNumberStyle; label: string }[] = [
  { value: "plain", label: "Plain · 1" },
  { value: "dashes", label: "Dashes · — 1 —" },
  { value: "parens", label: "Parens · ( 1 )" },
  { value: "brackets", label: "Brackets · [ 1 ]" },
  { value: "dots", label: "Dots · · 1 ·" },
  { value: "of-total", label: "X / Y · 1 / 2" },
  { value: "slash-total", label: "X of Y · 1 of 2" },
  { value: "page-n", label: "Page N · Page 1" },
  { value: "page-n-of-total", label: "Page N of M · Page 1 of 2" },
  { value: "leading-zero", label: "Leading zero · 01" },
  { value: "upper-roman", label: "Uppercase Roman · I" },
  { value: "lower-roman", label: "Lowercase Roman · i" },
  { value: "upper-alpha", label: "Uppercase letters · A" },
  { value: "lower-alpha", label: "Lowercase letters · a" },
];

export default function PageNumberPanel({
  config,
  onChange,
  onClose,
  totalPages,
}: {
  config: PageNumberConfig;
  onChange: (next: PageNumberConfig) => void;
  onClose: () => void;
  totalPages: number;
}) {
  const update = (patch: Partial<PageNumberConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Page Number</span>
          {config.enabled && <Check className="w-4 h-4 text-blue-600" />}
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => update({ enabled: !config.enabled })}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg mb-4 border transition-colors ${
          config.enabled ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"
        }`}
      >
        <span className={`font-semibold ${config.enabled ? "text-blue-700" : "text-slate-700"}`}>
          Show page number
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            config.enabled ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700"
          }`}
        >
          {config.enabled ? "ON" : "OFF"}
        </span>
      </button>

      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Position</div>
        <PositionPicker value={config.position} onChange={(p) => update({ position: p })} />
      </div>

      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Style</div>
        <select
          value={config.style}
          onChange={(e) => update({ style: e.target.value as PageNumberStyle })}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="inline-flex items-center px-1.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
          <input
            type="color"
            value={config.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>
        <ToggleIcon active={config.italic} onClick={() => update({ italic: !config.italic })} label="Italic">
          <Italic className="w-4 h-4" />
        </ToggleIcon>
        <ToggleIcon active={config.bold} onClick={() => update({ bold: !config.bold })} label="Bold">
          <Bold className="w-4 h-4" />
        </ToggleIcon>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Preview</div>
      <div
        className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-center"
        style={{
          color: config.color,
          fontStyle: config.italic ? "italic" : "normal",
          fontWeight: config.bold ? 700 : 400,
        }}
      >
        {formatPageNumber(1, config.style, totalPages)}
      </div>
    </div>
  );
}

function PositionPicker({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) {
  const options: { v: Position; label: string }[] = [
    { v: "left", label: "Left" },
    { v: "center", label: "Center" },
    { v: "right", label: "Right" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`text-sm font-semibold py-1.5 rounded-md transition-colors ${
            value === o.v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleIcon({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
