"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Trash2, Palette } from "lucide-react";
import { renderShapeSvg, type ShapeId } from "./shapes-data";

interface ShapeAttrs {
  shapeType: ShapeId;
  filled: boolean;
  color: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

interface DragStart {
  mx: number;
  my: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

type Mode =
  | null
  | "move"
  | "rotate"
  | "resize-tl"
  | "resize-tr"
  | "resize-bl"
  | "resize-br";

const MIN_SIZE = 24;
const CORNERS: ("tl" | "tr" | "bl" | "br")[] = ["tl", "tr", "bl", "br"];

export default function ShapeNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as unknown as ShapeAttrs;
  const { x = 60, y = 60, width = 100, height = 100, rotation = 0, shapeType, filled, color } = attrs;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<DragStart | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [degreeText, setDegreeText] = useState(String(Math.round(rotation)));

  useEffect(() => {
    setDegreeText(String(Math.round(rotation)));
  }, [rotation]);

  useEffect(() => {
    if (!mode) return;
    const onMove = (e: MouseEvent) => {
      const s = startRef.current;
      if (!s) return;
      if (mode === "move") {
        updateAttributes({ x: s.x + (e.clientX - s.mx), y: s.y + (e.clientY - s.my) });
      } else if (mode === "rotate") {
        const angle = (Math.atan2(e.clientY - s.cy, e.clientX - s.cx) * 180) / Math.PI + 90;
        updateAttributes({ rotation: ((angle % 360) + 360) % 360 });
      } else if (mode.startsWith("resize-")) {
        const corner = mode.replace("resize-", "");
        const dx = e.clientX - s.mx;
        const dy = e.clientY - s.my;
        let nw = s.w;
        let nh = s.h;
        let nx = s.x;
        let ny = s.y;
        if (corner.includes("r")) nw = Math.max(MIN_SIZE, s.w + dx);
        if (corner.includes("l")) {
          nw = Math.max(MIN_SIZE, s.w - dx);
          nx = s.x + (s.w - nw);
        }
        if (corner.includes("b")) nh = Math.max(MIN_SIZE, s.h + dy);
        if (corner.includes("t")) {
          nh = Math.max(MIN_SIZE, s.h - dy);
          ny = s.y + (s.h - nh);
        }
        updateAttributes({ x: nx, y: ny, width: nw, height: nh });
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
  }, [mode, updateAttributes]);

  const seed = (e: React.MouseEvent, extras: Partial<DragStart> = {}) => {
    startRef.current = {
      mx: e.clientX,
      my: e.clientY,
      x,
      y,
      w: width,
      h: height,
      cx: 0,
      cy: 0,
      ...extras,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  const startMove = (e: React.MouseEvent) => {
    setMode("move");
    seed(e);
  };

  const startRotate = (e: React.MouseEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMode("rotate");
    seed(e, { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 });
  };

  const startResize = (corner: "tl" | "tr" | "bl" | "br") => (e: React.MouseEvent) => {
    setMode(`resize-${corner}`);
    seed(e);
  };

  const setRotation = (deg: number) => {
    updateAttributes({ rotation: ((deg % 360) + 360) % 360 });
  };

  const svg = renderShapeSvg(shapeType, filled, color);

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className="shape-node group"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        zIndex: 4,
        userSelect: "none",
      }}
    >
      <div ref={wrapperRef} className="relative w-full h-full">
        {/* The shape itself — rotates only this element */}
        <div
          onMouseDown={startMove}
          style={{
            width: "100%",
            height: "100%",
            transform: `rotate(${rotation}deg)`,
            cursor: "move",
          }}
        >
          <svg
            viewBox="0 0 64 64"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        {/* Dashed selection border (hover) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-dashed border-teal-500/70 rounded-sm"
          aria-hidden
        />

        {/* Corner resize handles */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {CORNERS.map((c) => (
            <div
              key={c}
              onMouseDown={startResize(c)}
              className="absolute w-3 h-3 bg-white border-2 border-teal-500 rounded-sm z-10 hover:bg-teal-50"
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

        {/* Rotation handle — line with a circle above the shape */}
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ top: -34, left: "50%", height: 28, width: 1, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="w-px h-full bg-teal-500/80 mx-auto" />
          <div
            onMouseDown={startRotate}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-teal-500 pointer-events-auto z-10 hover:bg-teal-50"
            style={{ cursor: "grab" }}
            title="Drag to rotate freely"
          />
        </div>

        {/* Toolbar — stays upright below the shape so it doesn't block the rotate handle */}
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md px-1.5 py-1 transition-opacity z-20 whitespace-nowrap ${
            mode === "rotate" ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-md px-1.5 mr-1">
            <input
              type="number"
              value={degreeText}
              onChange={(e) => setDegreeText(e.target.value)}
              onBlur={() => {
                const n = Number(degreeText);
                if (!Number.isNaN(n)) setRotation(n);
                else setDegreeText(String(Math.round(rotation)));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-10 bg-transparent border-0 text-xs text-slate-800 font-semibold text-right tabular-nums focus:outline-none"
              min={-360}
              max={360}
              step={1}
              title="Set rotation in degrees"
            />
            <span className="text-xs text-slate-500 ml-0.5">°</span>
          </div>

          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRotation(deg);
              }}
              title={`Snap to ${deg}°`}
              className={`text-[11px] font-semibold px-1.5 h-7 rounded-md transition-colors ${
                Math.round(rotation) === deg
                  ? "bg-teal-100 text-teal-800"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {deg}°
            </button>
          ))}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <label
            className="inline-flex items-center gap-1 px-1.5 h-7 rounded-md cursor-pointer hover:bg-slate-100"
            title="Change color"
          >
            <Palette className="w-3.5 h-3.5 text-slate-600" />
            <input
              type="color"
              value={color}
              onChange={(e) => updateAttributes({ color: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 cursor-pointer border-0 bg-transparent rounded"
            />
          </label>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            title="Delete shape"
            aria-label="Delete shape"
            className="w-7 h-7 rounded-md flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
