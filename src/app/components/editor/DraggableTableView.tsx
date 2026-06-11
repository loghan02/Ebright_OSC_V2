"use client";

import {
  NodeViewWrapper,
  NodeViewContent as RawNodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Move } from "lucide-react";

// NodeViewContent's `as` prop is typed too narrowly (defaults to "div"). Cast to a
// permissive component so we can use as="table".
const NodeViewContent = RawNodeViewContent as unknown as (props: { as?: string }) => React.ReactElement;

interface TableAttrs {
  x: number;
  y: number;
  floating: boolean;
  locked: boolean;
}

interface DragStart {
  mx: number;
  my: number;
  x: number;
  y: number;
}

export default function DraggableTableView({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as unknown as TableAttrs;
  const { x = 0, y = 0, floating = false, locked = false } = attrs;
  const innerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<DragStart | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const s = startRef.current;
      if (!s) return;
      updateAttributes({ x: s.x + (e.clientX - s.mx), y: s.y + (e.clientY - s.my) });
    };
    const onUp = () => {
      setDragging(false);
      startRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, updateAttributes]);

  const startDrag = (e: React.MouseEvent) => {
    if (locked) return;
    // If not floating, flip into floating mode at current position so the drag has somewhere to go
    if (!floating) {
      const rect = innerRef.current?.getBoundingClientRect();
      const parentRect = (innerRef.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect();
      const px = rect && parentRect ? rect.left - parentRect.left : 80;
      const py = rect && parentRect ? rect.top - parentRect.top : 80;
      updateAttributes({ floating: true, locked: false, x: px, y: py });
    }
    setDragging(true);
    startRef.current = { mx: e.clientX, my: e.clientY, x, y };
    e.preventDefault();
    e.stopPropagation();
  };

  const wrapperStyle: React.CSSProperties = floating
    ? { position: "absolute", left: x, top: y, zIndex: 5 }
    : {};

  return (
    <NodeViewWrapper
      as="div"
      className={`group ${floating ? "floating-table" : "tableWrapper"}`}
      style={wrapperStyle}
    >
      <div ref={innerRef} className="relative">
        <NodeViewContent as="table" />

        {!locked && (
          <div
            onMouseDown={startDrag}
            contentEditable={false}
            title="Drag to move the table"
            className="absolute -top-6 left-0 w-5 h-5 border border-slate-400 bg-white flex items-center justify-center cursor-move select-none z-10 hover:bg-slate-50"
          >
            <Move className="w-3.5 h-3.5 text-slate-700" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
