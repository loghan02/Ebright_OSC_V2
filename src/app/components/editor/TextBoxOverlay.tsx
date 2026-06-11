"use client";

import { useEffect, useRef, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import type { TextBox } from "./types";

const MIN_W = 80;
const MIN_H = 40;
const CORNERS: ("tl" | "tr" | "bl" | "br")[] = ["tl", "tr", "bl", "br"];

export default function TextBoxOverlay({
  boxes,
  onChange,
  onDelete,
}: {
  boxes: TextBox[];
  onChange: (box: TextBox) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {boxes.map((box) => (
        <DraggableBox key={box.id} box={box} onChange={onChange} onDelete={() => onDelete(box.id)} />
      ))}
    </div>
  );
}

interface DragStart {
  mx: number;
  my: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Mode = null | "move" | "resize-tl" | "resize-tr" | "resize-bl" | "resize-br";

function DraggableBox({
  box,
  onChange,
  onDelete,
}: {
  box: TextBox;
  onChange: (box: TextBox) => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const startRef = useRef<DragStart | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("textarea, button, [data-resize-handle]")) return;
    setMode("move");
    startRef.current = { mx: e.clientX, my: e.clientY, x: box.x, y: box.y, w: box.width, h: box.height };
    e.preventDefault();
  };

  const startResize = (corner: "tl" | "tr" | "bl" | "br") => (e: React.MouseEvent) => {
    setMode(`resize-${corner}` as Mode);
    startRef.current = {
      mx: e.clientX,
      my: e.clientY,
      x: box.x,
      y: box.y,
      w: box.width,
      h: box.height,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!mode) return;
    const onMove = (e: MouseEvent) => {
      const s = startRef.current;
      if (!s) return;
      if (mode === "move") {
        onChange({ ...box, x: s.x + (e.clientX - s.mx), y: s.y + (e.clientY - s.my) });
      } else if (mode.startsWith("resize-")) {
        const corner = mode.replace("resize-", "");
        const dx = e.clientX - s.mx;
        const dy = e.clientY - s.my;
        let nw = s.w;
        let nh = s.h;
        let nx = s.x;
        let ny = s.y;
        if (corner.includes("r")) nw = Math.max(MIN_W, s.w + dx);
        if (corner.includes("l")) {
          nw = Math.max(MIN_W, s.w - dx);
          nx = s.x + (s.w - nw);
        }
        if (corner.includes("b")) nh = Math.max(MIN_H, s.h + dy);
        if (corner.includes("t")) {
          nh = Math.max(MIN_H, s.h - dy);
          ny = s.y + (s.h - nh);
        }
        onChange({ ...box, x: nx, y: ny, width: nw, height: nh });
      }
    };
    const onUp = () => {
      setMode(null);
      startRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [mode, onChange, box]);

  const borderVisible = box.showBorder !== false; // default to true when undefined

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
      }}
      className={`pointer-events-auto group rounded-lg cursor-move ${
        borderVisible
          ? "bg-white/80 backdrop-blur border-2 border-dashed border-blue-300 hover:border-blue-500"
          : "bg-transparent border-2 border-dashed border-transparent hover:border-blue-300"
      }`}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange({ ...box, showBorder: !borderVisible });
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={borderVisible ? "Hide border" : "Show border"}
          title={borderVisible ? "Hide border (still visible on hover)" : "Always show border"}
          className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-700 shadow hover:bg-slate-50 flex items-center justify-center"
        >
          {borderVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Delete text box"
          title="Delete text box"
          className="w-6 h-6 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <textarea
        value={box.content}
        onChange={(e) => onChange({ ...box, content: e.target.value })}
        placeholder="Type here…"
        className="w-full h-full resize-none border-0 outline-none bg-transparent p-2 text-sm text-slate-900 placeholder:text-slate-400 cursor-text"
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* Corner resize handles — visible on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {CORNERS.map((c) => (
          <div
            key={c}
            data-resize-handle
            onMouseDown={startResize(c)}
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-10 hover:bg-blue-50"
            style={{
              top: c.includes("t") ? -6 : "auto",
              bottom: c.includes("b") ? -6 : "auto",
              left: c.includes("l") ? -6 : "auto",
              right: c.includes("r") ? -6 : "auto",
              cursor: c === "tl" || c === "br" ? "nwse-resize" : "nesw-resize",
            }}
            title="Drag to resize"
          />
        ))}
      </div>
    </div>
  );
}
