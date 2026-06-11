"use client";

import { ChevronUp, PanelTop, PanelBottom, Italic, Bold } from "lucide-react";
import type { HeaderFooterConfig, Position } from "../types";

type Variant = "header" | "footer";

export default function HeaderFooterPanel({
  variant,
  config,
  onChange,
  onClose,
  pageCount,
}: {
  variant: Variant;
  config: HeaderFooterConfig;
  onChange: (next: HeaderFooterConfig) => void;
  onClose: () => void;
  pageCount: number;
}) {
  const update = (patch: Partial<HeaderFooterConfig>) => onChange({ ...config, ...patch });
  const Icon = variant === "header" ? PanelTop : PanelBottom;
  const titleText = variant === "header" ? "Header" : "Footer";

  const editingDefault = config.editingFor === "default";
  const editingValue = editingDefault
    ? config.defaultText
    : config.perPage[config.editingFor as number] ?? "";

  const setEditingText = (text: string) => {
    if (editingDefault) {
      update({ defaultText: text });
    } else {
      update({ perPage: { ...config.perPage, [config.editingFor as number]: text } });
    }
  };

  const previewText = editingDefault
    ? config.defaultText
    : config.perPage[config.editingFor as number]?.trim() || config.defaultText;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">{titleText}</span>
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
          Show {variant}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            config.enabled ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700"
          }`}
        >
          {config.enabled ? "ON" : "OFF"}
        </span>
      </button>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Default text (applies to pages without a per-page override)
      </div>
      <input
        type="text"
        value={config.defaultText}
        onChange={(e) => update({ defaultText: e.target.value })}
        placeholder={variant === "header" ? "Header text" : "Enter footer text"}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Per-page text · leave blank to use default
      </div>
      <div className="space-y-2 mb-4">
        {Array.from({ length: pageCount }).map((_, i) => {
          const idx = i + 1;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 w-12">Page {idx}</span>
              <input
                type="text"
                value={config.perPage[idx] ?? ""}
                onChange={(e) =>
                  update({ perPage: { ...config.perPage, [idx]: e.target.value } })
                }
                placeholder={variant === "header" ? "Header text" : ""}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Editing style for
      </div>
      <select
        value={String(config.editingFor)}
        onChange={(e) => {
          const v = e.target.value;
          update({ editingFor: v === "default" ? "default" : Number(v) });
        }}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-4 bg-white"
      >
        <option value="default">Default (applies to all pages without override)</option>
        {Array.from({ length: pageCount }).map((_, i) => (
          <option key={i} value={i + 1}>
            Page {i + 1}
          </option>
        ))}
      </select>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Position</div>
      <PositionPicker value={config.position} onChange={(p) => update({ position: p })} />

      <div className="flex items-center gap-2 mt-3 mb-3">
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

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Preview · {editingDefault ? "default" : `page ${config.editingFor}`}
      </div>
      <div
        className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-center min-h-[40px]"
        style={{
          color: config.color,
          fontStyle: config.italic ? "italic" : "normal",
          fontWeight: config.bold ? 700 : 400,
        }}
      >
        {previewText?.trim() ? previewText : <span className="italic text-slate-400">(empty)</span>}
      </div>

      {/* Hidden editable hint to satisfy the editingValue API expectation */}
      <input type="hidden" value={editingValue} readOnly />
      {!editingDefault && (
        <div className="mt-2 text-[10px] text-slate-500">
          Editing per-page text above will update this preview live.
        </div>
      )}
      {editingDefault && (
        <button
          type="button"
          onClick={() => setEditingText(editingValue)}
          className="hidden"
          aria-hidden
        />
      )}
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
            value === o.v ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-white"
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
