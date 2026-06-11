"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronUp, Link as LinkIcon, Bookmark } from "lucide-react";

export default function LinksPanel({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"none" | "link" | "bookmark">("none");
  const [url, setUrl] = useState("https://");
  const [name, setName] = useState("");

  const insertLink = () => {
    if (!url.trim()) return;
    const selection = editor.state.selection;
    if (selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setMode("none");
    setUrl("https://");
    onClose();
  };

  const insertBookmark = () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    editor
      .chain()
      .focus()
      .insertContent(`<a id="${slug}" href="#${slug}">⚓ ${name}</a>`)
      .run();
    setMode("none");
    setName("");
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Links</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {mode === "none" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("link")}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <LinkIcon className="w-4 h-4 text-slate-700" />
            <span className="font-semibold text-slate-900">Hyperlink</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("bookmark")}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Bookmark className="w-4 h-4 text-slate-700" />
            <span className="font-semibold text-slate-900">Bookmark</span>
          </button>
        </div>
      )}

      {mode === "link" && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-sm font-semibold text-slate-700 px-3 py-1.5 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={insertLink}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Insert link
            </button>
          </div>
        </div>
      )}

      {mode === "bookmark" && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bookmark name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="My bookmark"
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-sm font-semibold text-slate-700 px-3 py-1.5 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={insertBookmark}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Insert bookmark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
