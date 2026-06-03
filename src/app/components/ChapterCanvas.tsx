"use client";

import { useEffect, useRef, useState } from "react";
import Breadcrumb from "./Breadcrumb";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  Minus,
  Move,
  Pin,
  PaintBucket,
  Upload,
  FileText,
  Download,
  X,
} from "lucide-react";

const CELL_COLOR_PALETTE = [
  "#fef08a",
  "#fed7aa",
  "#fecaca",
  "#fbcfe8",
  "#e9d5ff",
  "#bfdbfe",
  "#bae6fd",
  "#a7f3d0",
  "#bbf7d0",
  "#fde68a",
  "#e2e8f0",
  "#f5f5f4",
];
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import {
  TableRow,
  TableCell as RawTableCell,
  TableHeader as RawTableHeader,
} from "@tiptap/extension-table";

const cellBackgroundAttribute = {
  default: null as string | null,
  parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
  renderHTML: (attrs: Record<string, unknown>) => {
    const bg = attrs.backgroundColor as string | null | undefined;
    return bg ? { style: `background-color: ${bg}` } : {};
  },
};

const TableCell = RawTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: cellBackgroundAttribute,
    };
  },
});

const TableHeader = RawTableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: cellBackgroundAttribute,
    };
  },
});
import { DraggableTable } from "@/app/components/editor/DraggableTable";
import { Shape } from "@/app/components/editor/Shape";
import Image from "@tiptap/extension-image";
import { BulletList, OrderedList } from "@tiptap/extension-list";

const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: null as string | null,
        parseHTML: (el) => {
          const inline = (el as HTMLElement).style.listStyleType;
          return inline ? inline : null;
        },
        renderHTML: (attrs) => {
          const v = (attrs as { listStyleType?: string | null }).listStyleType;
          return v ? { style: `list-style-type: ${v}` } : {};
        },
      },
    };
  },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: null as string | null,
        parseHTML: (el) => {
          const inline = (el as HTMLElement).style.listStyleType;
          return inline ? inline : null;
        },
        renderHTML: (attrs) => {
          const v = (attrs as { listStyleType?: string | null }).listStyleType;
          return v ? { style: `list-style-type: ${v}` } : {};
        },
      },
    };
  },
});
import EditorToolbar from "@/app/components/editor/EditorToolbar";
import TextBoxOverlay from "@/app/components/editor/TextBoxOverlay";
import {
  DEFAULT_PAGE_NUMBER,
  formatPageNumber,
  makeDefaultFooter,
  makeDefaultHeader,
  POSITION_TO_JUSTIFY,
  type HeaderFooterConfig,
  type PageNumberConfig,
  type TextBox,
} from "@/app/components/editor/types";

export type ChapterTheme = "teal" | "rose" | "amber";

interface ThemeClasses {
  pill: string;
}

const THEMES: Record<ChapterTheme, ThemeClasses> = {
  teal: { pill: "bg-teal-700" },
  rose: { pill: "bg-rose-800" },
  amber: { pill: "bg-amber-700" },
};

interface ChapterCanvasProps {
  /** @deprecated - use `breadcrumb` instead. Retained for backwards compatibility. */
  backHref?: string;
  label: string;
  storageKey: string;
  pageCount?: number;
  theme?: ChapterTheme;
  hideEditTab?: boolean;
  breadcrumb?: import("./Breadcrumb").BreadcrumbItem[];
  enableDocumentUpload?: boolean;
  /** When false, the editor and edit toolbar are visible but disabled. Default true. */
  canEdit?: boolean;
}

interface UploadedDoc {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: number;
}

interface SavedState {
  pages: string[];
  lastSavedAt: number | null;
  publishedAt: number | null;
  isDraft: boolean;
  pageNumber: PageNumberConfig;
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  textBoxes: Record<number, TextBox[]>;
}

function normalizeContent(raw: string): string {
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}

function resolveText(config: HeaderFooterConfig, page: number): string {
  return config.perPage[page]?.trim() || config.defaultText;
}

function moveTable(editor: ReturnType<typeof useEditor>, direction: -1 | 1) {
  if (!editor) return;
  const { state, view } = editor;
  const { $from } = state.selection;

  let tableNode: ReturnType<typeof $from.node> | null = null;
  let tablePos = -1;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === "table") {
      tableNode = $from.node(d);
      tablePos = $from.before(d);
      break;
    }
  }
  if (!tableNode || tablePos === -1) return;

  const $table = state.doc.resolve(tablePos);
  const parent = $table.parent;
  const idx = $table.index();
  if (direction === -1 && idx === 0) return;
  if (direction === 1 && idx === parent.childCount - 1) return;

  const tableEnd = tablePos + tableNode.nodeSize;
  let tr;
  if (direction === -1) {
    const prevStart = tablePos - parent.child(idx - 1).nodeSize;
    tr = state.tr.delete(tablePos, tableEnd).insert(prevStart, tableNode);
  } else {
    const nextEnd = tableEnd + parent.child(idx + 1).nodeSize;
    tr = state.tr.delete(tablePos, tableEnd).insert(nextEnd - tableNode.nodeSize, tableNode);
  }
  view.dispatch(tr);
  editor.commands.focus();
}

function IconAction({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center min-w-8 h-8 px-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
    >
      {children}
    </button>
  );
}

function IconDivider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

// A4 dimensions at 96 DPI: 210mm × 297mm
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_PADDING = 64;
const CONTENT_MAX_HEIGHT = A4_HEIGHT - 2 * PAGE_PADDING;

export default function ChapterCanvas({
  label,
  storageKey,
  pageCount = 2,
  theme = "teal",
  hideEditTab = false,
  enableDocumentUpload = false,
  breadcrumb,
  canEdit = true,
}: ChapterCanvasProps) {
  const t = THEMES[theme];
  const [pages, setPages] = useState<string[]>(() => Array(pageCount).fill(""));
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showTab, setShowTab] = useState(false);
  const [savedPages, setSavedPages] = useState<string[]>(() => Array(pageCount).fill(""));
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [pageNumberConfig, setPageNumberConfig] = useState<PageNumberConfig>(DEFAULT_PAGE_NUMBER);
  const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig>(makeDefaultHeader);
  const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig>(makeDefaultFooter);
  const [textBoxes, setTextBoxes] = useState<Record<number, TextBox[]>>({});
  const [publishedAt, setPublishedAt] = useState<number | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [cellPaletteOpen, setCellPaletteOpen] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isSwappingPage = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bulletList: false, orderedList: false }),
      CustomBulletList,
      CustomOrderedList,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      DraggableTable.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: true, allowBase64: true }),
      Shape,
    ],
    content: "",
    editable: canEdit,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      if (isSwappingPage.current) return;
      const html = editor.getHTML();
      const dom = editor.view.dom as HTMLElement;

      // No overflow → just save the page content
      if (!dom || dom.scrollHeight <= CONTENT_MAX_HEIGHT) {
        setPages((prev) => {
          if (prev[current] === html) return prev;
          const next = [...prev];
          next[current] = html;
          return next;
        });
        return;
      }

      // Find the first top-level block that overflows the A4 page
      const blocks = Array.from(dom.children) as HTMLElement[];
      let splitIdx = -1;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.offsetTop + b.offsetHeight > CONTENT_MAX_HEIGHT) {
          splitIdx = i;
          break;
        }
      }

      // If we can't split cleanly (no clean break or first block too big),
      // just save current HTML as-is and let the user handle it manually.
      if (splitIdx <= 0) {
        setPages((prev) => {
          if (prev[current] === html) return prev;
          const next = [...prev];
          next[current] = html;
          return next;
        });
        return;
      }

      const keepHTML = blocks.slice(0, splitIdx).map((b) => b.outerHTML).join("");
      const overflowHTML = blocks.slice(splitIdx).map((b) => b.outerHTML).join("");

      isSwappingPage.current = true;
      setPages((prev) => {
        const next = [...prev];
        next[current] = keepHTML;
        if (current + 1 < next.length) {
          next[current + 1] = overflowHTML + (next[current + 1] || "");
        } else {
          next.push(overflowHTML);
        }
        return next;
      });
      setCurrent((c) => c + 1);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none text-slate-900 text-base leading-relaxed",
        style: `min-height: ${CONTENT_MAX_HEIGHT}px`,
      },
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedState>;
        const arr = Array.isArray(parsed.pages) ? parsed.pages : [];
        const normalized = arr.length > 0
          ? arr.map((v) => (typeof v === "string" ? normalizeContent(v) : ""))
          : Array(pageCount).fill("");
        setPages(normalized);
        setSavedPages(normalized);
        if (typeof parsed.lastSavedAt === "number") setLastSavedAt(parsed.lastSavedAt);
        if (parsed.pageNumber) setPageNumberConfig({ ...DEFAULT_PAGE_NUMBER, ...parsed.pageNumber });
        if (parsed.header) setHeaderConfig({ ...makeDefaultHeader(), ...parsed.header });
        if (parsed.footer) setFooterConfig({ ...makeDefaultFooter(), ...parsed.footer });
        if (parsed.textBoxes) setTextBoxes(parsed.textBoxes);
        if (typeof parsed.publishedAt === "number") setPublishedAt(parsed.publishedAt);
        if (typeof parsed.isDraft === "boolean") setIsDraft(parsed.isDraft);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [storageKey, pageCount]);

  // Load uploaded document (when feature is enabled)
  useEffect(() => {
    if (!enableDocumentUpload) return;
    try {
      const raw = localStorage.getItem(`${storageKey}.doc`);
      if (raw) {
        const parsed = JSON.parse(raw) as UploadedDoc;
        if (parsed?.dataUrl) setUploadedDoc(parsed);
      }
    } catch {
      // ignore
    }
  }, [enableDocumentUpload, storageKey]);

  // Persist uploaded document
  useEffect(() => {
    if (!enableDocumentUpload) return;
    try {
      if (uploadedDoc) {
        localStorage.setItem(`${storageKey}.doc`, JSON.stringify(uploadedDoc));
      } else {
        localStorage.removeItem(`${storageKey}.doc`);
      }
    } catch {
      // ignore (likely quota — large files can blow localStorage)
    }
  }, [uploadedDoc, enableDocumentUpload, storageKey]);

  const handleDocUpload = (file?: File) => {
    if (!file) return;
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_BYTES) {
      alert("Document is too large (max 5 MB for localStorage storage).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDoc({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: reader.result as string,
        uploadedAt: Date.now(),
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!loaded) return;
    try {
      const state: SavedState = {
        pages,
        lastSavedAt,
        publishedAt,
        isDraft,
        pageNumber: pageNumberConfig,
        header: headerConfig,
        footer: footerConfig,
        textBoxes,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [
    pages,
    lastSavedAt,
    publishedAt,
    isDraft,
    pageNumberConfig,
    headerConfig,
    footerConfig,
    textBoxes,
    storageKey,
    loaded,
  ]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(canEdit && !previewMode);
  }, [editor, previewMode, canEdit]);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      if (!editor.isActive("table") || previewMode) {
        setTableRect(null);
        return;
      }
      try {
        const { from } = editor.state.selection;
        const domAt = editor.view.domAtPos(from);
        let n: Node | null = domAt.node;
        while (n && n.nodeType !== 1) n = n.parentNode;
        let el = n as HTMLElement | null;
        while (el && el.tagName !== "TABLE") el = el.parentElement;
        if (el) setTableRect(el.getBoundingClientRect());
        else setTableRect(null);
      } catch {
        setTableRect(null);
      }
    };
    update();
    editor.on("selectionUpdate", update);
    editor.on("update", update);
    editor.on("transaction", update);
    document.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("update", update);
      editor.off("transaction", update);
      document.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor, previewMode]);

  useEffect(() => {
    if (!editor || !loaded) return;
    isSwappingPage.current = true;
    editor.commands.setContent(pages[current] ?? "", { emitUpdate: false });
    isSwappingPage.current = false;
    // Scroll the current page into view so the user follows along after auto-paginate
    const target = pageRefs.current[current];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [editor, loaded, current]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 70) setShowTab(true);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const total = pages.length;
  const canPrev = current > 0;
  const canNext = current < total - 1;

  const isDirty = pages.some((p, i) => p !== (savedPages[i] ?? ""));

  const wordCount =
    (editor?.storage as { characterCount?: { words: () => number } } | undefined)?.characterCount?.words() ??
    0;
  const charCount =
    (editor?.storage as { characterCount?: { characters: () => number } } | undefined)?.characterCount?.characters() ??
    0;

  const handleSave = () => {
    setSavedPages(pages);
    setLastSavedAt(Date.now());
  };

  const handleSaveDraft = () => {
    setSavedPages(pages);
    setLastSavedAt(Date.now());
    setIsDraft(true);
  };

  const handlePublish = () => {
    setSavedPages(pages);
    const now = Date.now();
    setLastSavedAt(now);
    setPublishedAt(now);
    setIsDraft(false);
  };

  const handleAddTextBox = (box: TextBox) => {
    setTextBoxes((prev) => ({
      ...prev,
      [box.page]: [...(prev[box.page] ?? []), box],
    }));
  };

  const handleUpdateTextBox = (box: TextBox) => {
    setTextBoxes((prev) => ({
      ...prev,
      [box.page]: (prev[box.page] ?? []).map((b) => (b.id === box.id ? box : b)),
    }));
  };

  const handleDeleteTextBox = (id: string) => {
    setTextBoxes((prev) => ({
      ...prev,
      [current + 1]: (prev[current + 1] ?? []).filter((b) => b.id !== id),
    }));
  };

  const currentPageNum = current + 1;

  return (
    <div className="min-h-full bg-slate-50 relative">
      {!hideEditTab ? (
        <div
          className={canEdit ? "" : "opacity-60 cursor-not-allowed pointer-events-none"}
          title={canEdit ? undefined : "View only — contact your administrator to edit."}
        >
          <EditorToolbar
            editor={editor}
            visible={showTab}
            label={label}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
            wordCount={wordCount}
            charCount={charCount}
            pageCount={total}
            currentPage={currentPageNum}
            pageNumberConfig={pageNumberConfig}
            headerConfig={headerConfig}
            footerConfig={footerConfig}
            onPageNumberChange={setPageNumberConfig}
            onHeaderChange={setHeaderConfig}
            onFooterChange={setFooterConfig}
            onAddTextBox={handleAddTextBox}
            onClose={() => setShowTab(false)}
            onSave={handleSave}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            previewMode={previewMode}
            onTogglePreview={() => setPreviewMode((p) => !p)}
            findOpen={findOpen}
            onToggleFind={() => setFindOpen((f) => !f)}
            isDraft={isDraft}
            publishedAt={publishedAt}
            onMouseEnter={() => setShowTab(true)}
          />
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto px-6 pt-4 pb-24">
        {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-2 ${t.pill} text-white px-5 py-2.5 rounded-xl font-bold tracking-wide`}
          >
            <span className="text-xl" aria-hidden="true">📘</span>
            <span>{label}</span>
          </div>
          {enableDocumentUpload && (
            <>
              <button
                type="button"
                onClick={() => docFileInputRef.current?.click()}
                disabled={!canEdit}
                title={canEdit ? "Upload a document (PDF, DOC, image, etc.)" : "View only — contact your administrator to edit."}
                className={`inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors ${canEdit ? "" : "opacity-60 cursor-not-allowed"}`}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
              <input
                ref={docFileInputRef}
                type="file"
                disabled={!canEdit}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain"
                className="hidden"
                onChange={(e) => {
                  handleDocUpload(e.target.files?.[0]);
                  e.target.value = ""; // allow re-upload of the same file
                }}
              />
            </>
          )}
        </div>

        {enableDocumentUpload && uploadedDoc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {uploadedDoc.name}
                </div>
                <div className="text-xs text-slate-500">
                  {(uploadedDoc.size / 1024).toFixed(1)} KB · uploaded{" "}
                  {new Date(uploadedDoc.uploadedAt).toLocaleString()}
                </div>
              </div>
              <a
                href={uploadedDoc.dataUrl}
                download={uploadedDoc.name}
                title="Download document"
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                type="button"
                onClick={() => setUploadedDoc(null)}
                title="Remove document"
                className="w-9 h-9 rounded-md text-rose-600 hover:bg-rose-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {uploadedDoc.type === "application/pdf" && (
              <iframe
                src={uploadedDoc.dataUrl}
                title={uploadedDoc.name}
                className="w-full h-[60vh] border border-slate-200 rounded-lg"
              />
            )}
            {uploadedDoc.type.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploadedDoc.dataUrl}
                alt={uploadedDoc.name}
                className="max-w-full max-h-[60vh] rounded-lg border border-slate-200 mx-auto"
              />
            )}
          </div>
        )}

        <div className="space-y-8">
          {pages.map((html, idx) => {
            const pageNum = idx + 1;
            const isCurrent = idx === current;
            const pageHeader = resolveText(headerConfig, pageNum);
            const pageFooter = resolveText(footerConfig, pageNum);
            const pageBoxes = textBoxes[pageNum] ?? [];

            return (
              <div key={idx} className="relative">
                <div
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  onMouseDown={() => {
                    if (!isCurrent) setCurrent(idx);
                  }}
                  className={`bg-white border rounded-sm shadow-md mx-auto relative overflow-hidden transition-colors ${
                    isCurrent ? "border-teal-300 shadow-lg" : "border-slate-200 cursor-pointer hover:border-slate-300"
                  }`}
                  style={{
                    width: A4_WIDTH,
                    height: A4_HEIGHT,
                    padding: PAGE_PADDING,
                  }}
                >
                  {headerConfig.enabled && (
                    <div
                      className={`flex ${POSITION_TO_JUSTIFY[headerConfig.position]} mb-4 pb-2 border-b border-slate-100`}
                      style={{
                        color: headerConfig.color,
                        fontStyle: headerConfig.italic ? "italic" : "normal",
                        fontWeight: headerConfig.bold ? 700 : 400,
                      }}
                    >
                      <span className="text-sm">{pageHeader}</span>
                    </div>
                  )}

                  <div
                    className="relative"
                    style={{
                      height:
                        CONTENT_MAX_HEIGHT -
                        (headerConfig.enabled ? 40 : 0) -
                        (footerConfig.enabled ? 40 : 0) -
                        (pageNumberConfig.enabled ? 28 : 0),
                      overflow: "hidden",
                    }}
                  >
                    {isCurrent ? (
                      <EditorContent editor={editor} />
                    ) : (
                      <div
                        className="ProseMirror text-slate-900 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: html || "<p></p>" }}
                      />
                    )}
                    {isCurrent && (
                      <TextBoxOverlay
                        boxes={pageBoxes}
                        onChange={handleUpdateTextBox}
                        onDelete={handleDeleteTextBox}
                      />
                    )}
                  </div>

                  {footerConfig.enabled && (
                    <div
                      className={`absolute left-0 right-0 px-16 flex ${POSITION_TO_JUSTIFY[footerConfig.position]} pt-2 border-t border-slate-100`}
                      style={{
                        bottom: pageNumberConfig.enabled ? 36 : 16,
                        color: footerConfig.color,
                        fontStyle: footerConfig.italic ? "italic" : "normal",
                        fontWeight: footerConfig.bold ? 700 : 400,
                      }}
                    >
                      <span className="text-sm">{pageFooter}</span>
                    </div>
                  )}

                  {pageNumberConfig.enabled && (
                    <div
                      className={`absolute bottom-3 left-0 right-0 px-16 flex ${POSITION_TO_JUSTIFY[pageNumberConfig.position]}`}
                      style={{
                        color: pageNumberConfig.color,
                        fontStyle: pageNumberConfig.italic ? "italic" : "normal",
                        fontWeight: pageNumberConfig.bold ? 700 : 400,
                      }}
                    >
                      <span className="text-sm">
                        {formatPageNumber(pageNum, pageNumberConfig.style, total)}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {editor && tableRect && (
        <div
          style={{
            position: "fixed",
            top: Math.max(8, tableRect.top - 68),
            left: tableRect.left,
            zIndex: 30,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-lg flex items-center gap-0.5 px-1.5 py-1"
        >
          <IconAction onClick={() => moveTable(editor, -1)} title="Move table up">
            <ArrowUp className="w-4 h-4" />
          </IconAction>
          <IconAction onClick={() => moveTable(editor, 1)} title="Move table down">
            <ArrowDown className="w-4 h-4" />
          </IconAction>
          <IconAction
            onClick={() => {
              const attrs = editor.getAttributes("table");
              const floating = Boolean(attrs.floating);
              const locked = Boolean(attrs.locked);
              if (!floating) {
                // inline → floating + draggable
                editor
                  .chain()
                  .focus()
                  .updateAttributes("table", {
                    floating: true,
                    locked: false,
                    x: Number(attrs.x) || 80,
                    y: Number(attrs.y) || 80,
                  })
                  .run();
              } else if (!locked) {
                // floating draggable → pinned (keep current x/y, hide drag handle)
                editor.chain().focus().updateAttributes("table", { locked: true }).run();
              } else {
                // pinned → back to inline document flow
                editor
                  .chain()
                  .focus()
                  .updateAttributes("table", { floating: false, locked: false, x: 0, y: 0 })
                  .run();
              }
            }}
            title={(() => {
              const a = editor.getAttributes("table");
              if (!a.floating) return "Float — drag and place anywhere on the page";
              if (!a.locked) return "Pin table here (lock at current position)";
              return "Return table to document flow";
            })()}
          >
            {(() => {
              const a = editor.getAttributes("table");
              if (!a.floating) return <Move className="w-4 h-4" />;
              if (!a.locked) return <Pin className="w-4 h-4 text-teal-600" />;
              return <Move className="w-4 h-4 text-teal-600" />;
            })()}
          </IconAction>
          <IconDivider />
          <IconAction
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Insert row above"
          >
            <ArrowUpToLine className="w-4 h-4" />
          </IconAction>
          <IconAction
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Insert row below"
          >
            <ArrowDownToLine className="w-4 h-4" />
          </IconAction>
          <IconAction
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Insert column to the left"
          >
            <ArrowLeftToLine className="w-4 h-4" />
          </IconAction>
          <IconAction
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Insert column to the right"
          >
            <ArrowRightToLine className="w-4 h-4" />
          </IconAction>
          <IconDivider />
          <IconAction
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete current row"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold ml-0.5">R</span>
          </IconAction>
          <IconAction
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete current column"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold ml-0.5">C</span>
          </IconAction>
          <IconDivider />
          <div className="relative" data-cell-palette>
            <button
              type="button"
              onClick={() => setCellPaletteOpen((o) => !o)}
              title="Set cell background color"
              aria-label="Cell color"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                cellPaletteOpen ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <PaintBucket className="w-4 h-4" />
            </button>
            {cellPaletteOpen && (
              <div
                data-cell-palette
                className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 z-50"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Cell background
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {CELL_COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setCellAttribute("backgroundColor", c).run();
                        setCellPaletteOpen(false);
                      }}
                      style={{ backgroundColor: c }}
                      title={c}
                      className="w-7 h-7 rounded-md border border-slate-200 hover:scale-110 transition-transform"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    Custom:
                    <input
                      type="color"
                      onChange={(e) => {
                        editor
                          .chain()
                          .focus()
                          .setCellAttribute("backgroundColor", e.target.value)
                          .run();
                      }}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setCellAttribute("backgroundColor", null).run();
                      setCellPaletteOpen(false);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-[10px] italic text-slate-400 mt-2">
                  Tip: click and drag across cells to select a range, then pick a color.
                </p>
              </div>
            )}
          </div>
          <IconDivider />
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete entire table"
            className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}


      <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-full shadow-md flex items-center gap-1 px-2 py-1 z-30">
        <button
          type="button"
          onClick={() => canPrev && setCurrent((c) => c - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="px-3 text-sm font-semibold text-slate-700 tabular-nums">
          Page {current + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => canNext && setCurrent((c) => c + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
