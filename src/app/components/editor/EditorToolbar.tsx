"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Menu,
  History,
  Eye,
  X,
  Search,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  CaseSensitive,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  ChevronDown,
  Table as TableIcon,
  Shapes,
  Hash,
  PanelTop,
  PanelBottom,
  TextCursorInput,
  Sigma,
  Link as LinkIcon,
} from "lucide-react";
import TablesPanel from "./panels/TablesPanel";
import ShapesPanel from "./panels/ShapesPanel";
import PageNumberPanel from "./panels/PageNumberPanel";
import HeaderFooterPanel from "./panels/HeaderFooterPanel";
import TextBoxPanel from "./panels/TextBoxPanel";
import MathSymbolsPanel from "./panels/MathSymbolsPanel";
import LinksPanel from "./panels/LinksPanel";
import type { HeaderFooterConfig, PageNumberConfig, TextBox } from "./types";

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Calibri", value: "Calibri, 'Segoe UI', sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Cambria", value: "Cambria, Georgia, serif" },
  { label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Consolas", value: "Consolas, 'Courier New', monospace" },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive, sans-serif" },
  { label: "Impact", value: "Impact, Haettenschweiler, sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', Monaco, monospace" },
  { label: "Brush Script", value: "'Brush Script MT', cursive" },
];

const SIZE_OPTIONS = [
  { label: "8", value: "8px" },
  { label: "9", value: "9px" },
  { label: "10", value: "10px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "22", value: "22px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "40", value: "40px" },
  { label: "48", value: "48px" },
  { label: "56", value: "56px" },
  { label: "64", value: "64px" },
  { label: "72", value: "72px" },
  { label: "96", value: "96px" },
];

const BLOCK_OPTIONS = [
  { label: "Normal", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
];

const INSERT_CARDS = [
  { id: "tables", label: "Tables", Icon: TableIcon },
  { id: "shapes", label: "Shapes", Icon: Shapes },
  { id: "page-number", label: "Page Number", Icon: Hash },
  { id: "header", label: "Header", Icon: PanelTop },
  { id: "footer", label: "Footer", Icon: PanelBottom },
  { id: "text-box", label: "Text Box", Icon: TextCursorInput },
  { id: "math", label: "Math Symbols", Icon: Sigma },
  { id: "links", label: "Links", Icon: LinkIcon },
] as const;

type InsertId = (typeof INSERT_CARDS)[number]["id"];

interface EditorToolbarProps {
  editor: Editor | null;
  visible: boolean;
  label: string;
  isDirty: boolean;
  isDraft: boolean;
  publishedAt: number | null;
  lastSavedAt: number | null;
  wordCount: number;
  charCount: number;
  pageCount: number;
  currentPage: number;
  previewMode: boolean;
  findOpen: boolean;
  pageNumberConfig: PageNumberConfig;
  headerConfig: HeaderFooterConfig;
  footerConfig: HeaderFooterConfig;
  onPageNumberChange: (c: PageNumberConfig) => void;
  onHeaderChange: (c: HeaderFooterConfig) => void;
  onFooterChange: (c: HeaderFooterConfig) => void;
  onAddTextBox: (box: TextBox) => void;
  onClose: () => void;
  onSave: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onTogglePreview: () => void;
  onToggleFind: () => void;
  onMouseEnter: () => void;
}

export default function EditorToolbar({
  editor,
  visible,
  label,
  isDirty,
  lastSavedAt,
  wordCount,
  charCount,
  pageCount,
  currentPage,
  pageNumberConfig,
  headerConfig,
  footerConfig,
  onPageNumberChange,
  onHeaderChange,
  onFooterChange,
  onAddTextBox,
  onClose,
  onSave,
  onSaveDraft,
  onPublish,
  onTogglePreview,
  onToggleFind,
  previewMode,
  findOpen,
  isDraft,
  publishedAt,
  onMouseEnter,
}: EditorToolbarProps) {
  const [activeInsert, setActiveInsert] = useState<InsertId | null>(null);

  if (!editor) return null;

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(value.replace("h", "")) as 1 | 2 | 3 }).run();
  };

  const setFont = (value: string) => {
    if (value) editor.chain().focus().setFontFamily(value).run();
    else editor.chain().focus().unsetFontFamily().run();
  };

  const setSize = (value: string) => {
    editor.chain().focus().setFontSize(value).run();
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setHighlight = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
  };

  const closePanel = () => setActiveInsert(null);

  const indicators: Record<InsertId, boolean> = {
    tables: false,
    shapes: false,
    "page-number": pageNumberConfig.enabled,
    header: headerConfig.enabled,
    footer: footerConfig.enabled,
    "text-box": false,
    math: false,
    links: false,
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onClose}
      className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="bg-white border-b border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 tracking-wide">
                {previewMode ? "PREVIEW ·" : "EDIT ·"}
              </span>
              <span className="text-base font-bold text-teal-700">{label}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                  isDraft
                    ? "bg-slate-100 text-slate-600"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isDraft ? "Draft" : "Published"}
              </span>
              {!isDraft && publishedAt && (
                <span className="text-xs text-slate-500">
                  · published {new Date(publishedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="History"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onTogglePreview}
              aria-label={previewMode ? "Exit preview" : "Preview"}
              title={previewMode ? "Exit preview (back to editing)" : "Preview (read-only)"}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                previewMode
                  ? "bg-teal-100 text-teal-700"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          <ToolbarSelect onChange={setBlock} options={BLOCK_OPTIONS} defaultLabel="Normal" />
          <ToolbarSelect onChange={setFont} options={FONT_OPTIONS} defaultLabel="Font" />
          <ToolbarSelect onChange={setSize} options={SIZE_OPTIONS} defaultLabel="Size" />
          <ColorSwatch onChange={setColor} ariaLabel="Text color" />
          <ColorSwatch onChange={setHighlight} ariaLabel="Highlight" highlight />
          <button
            type="button"
            onClick={onToggleFind}
            aria-label="Find"
            title="Find text"
            className={`inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-sm transition-colors ${
              findOpen ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find</span>
          </button>
          <Divider />
          <ToolbarIcon
            ariaLabel="Bold (Ctrl+B)"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Italic (Ctrl+I)"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Underline (Ctrl+U)"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarIcon>
          <CaseMenu editor={editor} />
          <Divider />
          <ToolbarIcon
            ariaLabel="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Justify"
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarIcon>
          <Divider />
          <ListMenu editor={editor} kind="bullet" />
          <ListMenu editor={editor} kind="ordered" />
          <Divider />
          <ToolbarIcon
            ariaLabel="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo className="w-4 h-4" />
          </ToolbarIcon>
          <ToolbarIcon
            ariaLabel="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo className="w-4 h-4" />
          </ToolbarIcon>
        </div>

        {findOpen && (
          <FindBar editor={editor} onClose={onToggleFind} />
        )}

        <div className="px-4 py-3 border-t border-slate-100">
          <div className="text-xs font-bold tracking-wider text-slate-400 mb-2">INSERT</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {INSERT_CARDS.map(({ id, label: cardLabel, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveInsert((cur) => (cur === id ? null : id))}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  activeInsert === id
                    ? "bg-teal-50 border-teal-200 text-teal-800"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cardLabel}</span>
                {indicators[id] && <span className="text-blue-600 font-bold">✓</span>}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
          {activeInsert && (
            <div className="mt-3">
              {activeInsert === "tables" && <TablesPanel editor={editor} onClose={closePanel} />}
              {activeInsert === "shapes" && <ShapesPanel editor={editor} onClose={closePanel} />}
              {activeInsert === "page-number" && (
                <PageNumberPanel
                  config={pageNumberConfig}
                  onChange={onPageNumberChange}
                  onClose={closePanel}
                  totalPages={pageCount}
                />
              )}
              {activeInsert === "header" && (
                <HeaderFooterPanel
                  variant="header"
                  config={headerConfig}
                  onChange={onHeaderChange}
                  onClose={closePanel}
                  pageCount={pageCount}
                />
              )}
              {activeInsert === "footer" && (
                <HeaderFooterPanel
                  variant="footer"
                  config={footerConfig}
                  onChange={onFooterChange}
                  onClose={closePanel}
                  pageCount={pageCount}
                />
              )}
              {activeInsert === "text-box" && (
                <TextBoxPanel currentPage={currentPage} onAdd={onAddTextBox} onClose={closePanel} />
              )}
              {activeInsert === "math" && <MathSymbolsPanel editor={editor} onClose={closePanel} />}
              {activeInsert === "links" && <LinksPanel editor={editor} onClose={closePanel} />}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>
              {wordCount} words · {charCount} chars
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDirty ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span>{isDirty ? "Unsaved changes" : "All changes saved"}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="text-xs text-slate-500">
                Last saved {new Date(lastSavedAt).toLocaleString()}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              title="Save current state as a draft"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              title="Save and mark as published"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={onSave}
              title="Save without changing draft / published status"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-slate-200 mx-1" />;
}

const CASE_OPTIONS: { label: string; sample: string; transform: (s: string) => string }[] = [
  { label: "UPPERCASE", sample: "EXAMPLE TEXT", transform: (s) => s.toUpperCase() },
  { label: "lowercase", sample: "example text", transform: (s) => s.toLowerCase() },
  {
    label: "Title Case",
    sample: "Example Text",
    transform: (s) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    label: "Sentence case",
    sample: "Example text",
    transform: (s) => {
      const lower = s.toLowerCase();
      return lower.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p, c) => p + c.toUpperCase());
    },
  },
  {
    label: "iNVERT cASE",
    sample: "eXAMPLE tEXT",
    transform: (s) =>
      Array.from(s)
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
  },
  {
    label: "camelCase",
    sample: "exampleText",
    transform: (s) =>
      s
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_m, c) => c.toUpperCase())
        .replace(/^./, (c) => c.toLowerCase()),
  },
  {
    label: "snake_case",
    sample: "example_text",
    transform: (s) =>
      s
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toLowerCase(),
  },
  {
    label: "kebab-case",
    sample: "example-text",
    transform: (s) =>
      s
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase(),
  },
];

const BULLET_STYLES: { label: string; value: string; sample: string }[] = [
  { label: "Disc", value: "disc", sample: "● item" },
  { label: "Circle", value: "circle", sample: "○ item" },
  { label: "Square", value: "square", sample: "■ item" },
  { label: "Dash", value: '"– "', sample: "– item" },
  { label: "Arrow", value: '"➤ "', sample: "➤ item" },
  { label: "Check", value: '"✓ "', sample: "✓ item" },
  { label: "Star", value: '"★ "', sample: "★ item" },
  { label: "None", value: "none", sample: "  item" },
];

const ORDERED_STYLES: { label: string; value: string; sample: string }[] = [
  { label: "Decimal", value: "decimal", sample: "1. item" },
  { label: "Decimal — leading zero", value: "decimal-leading-zero", sample: "01. item" },
  { label: "Uppercase letters", value: "upper-alpha", sample: "A. item" },
  { label: "Lowercase letters", value: "lower-alpha", sample: "a. item" },
  { label: "Uppercase roman", value: "upper-roman", sample: "I. item" },
  { label: "Lowercase roman", value: "lower-roman", sample: "i. item" },
];

function ListMenu({ editor, kind }: { editor: Editor; kind: "bullet" | "ordered" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(`[data-list-menu-${kind}]`)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [open, kind]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(true);
  };

  const nodeName = kind === "bullet" ? "bulletList" : "orderedList";
  const isActive = editor.isActive(nodeName);

  const apply = (value: string | null) => {
    const chain = editor.chain().focus();
    if (!isActive) {
      if (kind === "bullet") chain.toggleBulletList();
      else chain.toggleOrderedList();
    }
    chain.updateAttributes(nodeName, { listStyleType: value }).run();
    setOpen(false);
  };

  const toggleOff = () => {
    if (kind === "bullet") editor.chain().focus().toggleBulletList().run();
    else editor.chain().focus().toggleOrderedList().run();
    setOpen(false);
  };

  const styles = kind === "bullet" ? BULLET_STYLES : ORDERED_STYLES;
  const Icon = kind === "bullet" ? List : ListOrdered;
  const dataAttr = kind === "bullet" ? "data-list-menu-bullet" : "data-list-menu-ordered";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        {...{ [dataAttr]: "" }}
        onMouseDown={(e) => {
          e.preventDefault();
          toggle();
        }}
        aria-label={kind === "bullet" ? "Bullet list" : "Numbered list"}
        title={kind === "bullet" ? "Bullet list" : "Numbered list"}
        className={`inline-flex items-center gap-0.5 h-9 px-2 rounded-lg transition-colors ${
          isActive ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
        } ${open ? "ring-2 ring-slate-300" : ""}`}
      >
        <Icon className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>
      {open && pos && (
        <div
          {...{ [dataAttr]: "" }}
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-60"
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            {kind === "bullet" ? "Bullet style" : "Numbering style"}
          </div>
          {styles.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                apply(opt.value);
              }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-700">{opt.label}</span>
              <span className="text-xs text-slate-400 font-mono">{opt.sample}</span>
            </button>
          ))}
          {isActive && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleOff();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
            >
              <X className="w-3.5 h-3.5" />
              Remove list
            </button>
          )}
        </div>
      )}
    </>
  );
}

function CaseMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-case-menu]")) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(true);
  };

  const apply = (transform: (s: string) => string) => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, "\n", "\n");
    const next = transform(text);
    editor.chain().focus().insertContentAt({ from, to }, next).run();
    setOpen(false);
  };

  const hasSelection = editor.state.selection.from !== editor.state.selection.to;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-case-menu
        onMouseDown={(e) => {
          e.preventDefault();
          toggle();
        }}
        aria-label="Change case"
        title="Change case"
        className={`inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors ${
          open ? "bg-slate-100" : ""
        }`}
      >
        <CaseSensitive className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>
      {open && pos && (
        <div
          data-case-menu
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-60"
        >
          {!hasSelection && (
            <div className="px-3 py-2 text-xs italic text-slate-400 border-b border-slate-100">
              Select text in the editor first
            </div>
          )}
          {CASE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              disabled={!hasSelection}
              onMouseDown={(e) => {
                e.preventDefault();
                if (hasSelection) apply(opt.transform);
              }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <span className="font-medium text-slate-700">{opt.label}</span>
              <span className="text-xs text-slate-400">{opt.sample}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function FindBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCount, setMatchCount] = useState<number | null>(null);

  // Walk text nodes and return list of {from, to} positions for each match
  const collectMatches = (needle: string) => {
    if (!needle) return [];
    const matches: { from: number; to: number }[] = [];
    const lower = needle.toLowerCase();
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return true;
      const text = node.text ?? "";
      const lowerText = text.toLowerCase();
      let idx = lowerText.indexOf(lower);
      while (idx !== -1) {
        matches.push({ from: pos + idx, to: pos + idx + needle.length });
        idx = lowerText.indexOf(lower, idx + needle.length);
      }
      return true;
    });
    return matches;
  };

  const findNext = () => {
    if (!query.trim()) {
      setMatchCount(null);
      return;
    }
    const matches = collectMatches(query);
    setMatchCount(matches.length);
    if (!matches.length) return;
    const cursor = editor.state.selection.to;
    const next = matches.find((m) => m.from >= cursor) ?? matches[0];
    editor.chain().focus().setTextSelection(next).scrollIntoView().run();
  };

  const replaceCurrent = () => {
    if (!query.trim()) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to);
    if (from !== to && selected.toLowerCase() === query.toLowerCase()) {
      editor.chain().focus().insertContentAt({ from, to }, replacement).run();
    }
    findNext();
  };

  const replaceAll = () => {
    if (!query.trim()) return;
    const matches = collectMatches(query);
    let chain = editor.chain().focus();
    // Apply in reverse so earlier positions aren't shifted by later edits
    for (let i = matches.length - 1; i >= 0; i--) {
      chain = chain.insertContentAt(matches[i], replacement);
    }
    chain.run();
    setMatchCount(matches.length);
  };

  return (
    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Search className="w-3.5 h-3.5" />
        Find
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") findNext();
          if (e.key === "Escape") onClose();
        }}
        autoFocus
        placeholder="Find text…"
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={findNext}
        className="text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg"
      >
        Find next
      </button>
      <input
        type="text"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        placeholder="Replace with…"
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={replaceCurrent}
        className="text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg"
      >
        Replace
      </button>
      <button
        type="button"
        onClick={replaceAll}
        className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
      >
        Replace all
      </button>
      {matchCount !== null && (
        <span className="text-xs text-slate-500">{matchCount} match{matchCount === 1 ? "" : "es"}</span>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close find"
        className="ml-auto w-7 h-7 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}


function ToolbarSelect({
  options,
  defaultLabel,
  onChange,
}: {
  options: { label: string; value: string }[];
  defaultLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const v = e.target.value;
        if (v) onChange(v);
        e.target.value = "";
      }}
      className="text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      <option value="">{defaultLabel}</option>
      {options.map((o) => (
        <option key={o.value || o.label} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ColorSwatch({
  onChange,
  ariaLabel,
  highlight = false,
}: {
  onChange: (color: string) => void;
  ariaLabel: string;
  highlight?: boolean;
}) {
  return (
    <label
      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer"
      aria-label={ariaLabel}
    >
      <input
        type="color"
        defaultValue={highlight ? "#fde68a" : "#0f172a"}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
      />
      {highlight && <span className="text-xs text-slate-500">HL</span>}
    </label>
  );
}

function ToolbarIcon({
  children,
  ariaLabel,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick?.();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:text-slate-300 disabled:cursor-not-allowed ${
        active ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
