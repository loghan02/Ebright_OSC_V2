"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Shapes as ShapesIcon, ChevronUp } from "lucide-react";
import { SHAPE_DEFS, type ShapeId } from "../shapes-data";

const SHAPE_IDS: ShapeId[] = [
  "circle",
  "square",
  "rectangle",
  "triangle",
  "diamond",
  "pentagon",
  "hexagon",
  "star",
  "heart",
  "arrow",
  "ellipse",
  "plus",
];

export default function ShapesPanel({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [fill, setFill] = useState(true);
  const [color, setColor] = useState("#3b82f6");

  const insert = (id: ShapeId) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "shape",
        attrs: {
          shapeType: id,
          filled: fill,
          color,
          x: 60 + Math.floor(Math.random() * 40),
          y: 60 + Math.floor(Math.random() * 40),
          rotation: 0,
          width: 100,
          height: 100,
        },
      })
      .run();
    onClose();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShapesIcon className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-900">Shapes</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse">
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label
          className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer"
          aria-label="Shape color"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>
        <div className="inline-flex rounded-lg overflow-hidden border border-slate-200 text-sm">
          <button
            type="button"
            onClick={() => setFill(true)}
            className={`px-3 py-1.5 font-semibold ${
              fill ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Fill
          </button>
          <button
            type="button"
            onClick={() => setFill(false)}
            className={`px-3 py-1.5 font-semibold ${
              !fill ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            No fill
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-2">Click a shape to insert it</p>
      <div className="grid grid-cols-4 gap-2">
        {SHAPE_IDS.map((id) => {
          const f = fill ? color : "none";
          const stroke = fill ? "none" : color;
          return (
            <button
              key={id}
              type="button"
              onClick={() => insert(id)}
              aria-label={`Insert ${id}`}
              className="aspect-square rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition-colors"
            >
              <svg
                viewBox="0 0 64 64"
                className="w-8 h-8"
                dangerouslySetInnerHTML={{ __html: SHAPE_DEFS[id](f, stroke) }}
              />
            </button>
          );
        })}
      </div>
      <p className="text-xs italic text-slate-500 mt-3">
        Hover an inserted shape to rotate or delete it. Drag to move.
      </p>
    </div>
  );
}
