"use client";

import { useEffect, useRef, useState } from "react";
import { X, GripHorizontal, Plus, Minus } from "lucide-react";
import type { OverlayTable } from "./types";

export default function TablesOverlay({
  tables,
  onChange,
  onDelete,
}: {
  tables: OverlayTable[];
  onChange: (table: OverlayTable) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {tables.map((table) => (
        <DraggableTable
          key={table.id}
          table={table}
          onChange={onChange}
          onDelete={() => onDelete(table.id)}
        />
      ))}
    </div>
  );
}

function DraggableTable({
  table,
  onChange,
  onDelete,
}: {
  table: OverlayTable;
  onChange: (table: OverlayTable) => void;
  onDelete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; tableX: number; tableY: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tableX: table.x, tableY: table.y };
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onChange({ ...table, x: dragStart.current.tableX + dx, y: dragStart.current.tableY + dy });
    };
    const onUp = () => {
      setDragging(false);
      dragStart.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, onChange, table]);

  const updateCell = (r: number, c: number, value: string) => {
    const cells = table.cells.map((row) => [...row]);
    cells[r][c] = value;
    onChange({ ...table, cells });
  };

  const addRow = (after: boolean) => {
    const blank = Array.from({ length: table.cols }, () => "");
    const cells = [...table.cells];
    cells.splice(after ? cells.length : 0, 0, blank);
    onChange({ ...table, rows: table.rows + 1, cells });
  };

  const addCol = (after: boolean) => {
    const cells = table.cells.map((row) => {
      const next = [...row];
      next.splice(after ? next.length : 0, 0, "");
      return next;
    });
    onChange({ ...table, cols: table.cols + 1, cells });
  };

  const removeRow = () => {
    if (table.rows <= 1) return;
    const cells = table.cells.slice(0, -1);
    onChange({ ...table, rows: table.rows - 1, cells });
  };

  const removeCol = () => {
    if (table.cols <= 1) return;
    const cells = table.cells.map((row) => row.slice(0, -1));
    onChange({ ...table, cols: table.cols - 1, cells });
  };

  return (
    <div
      style={{ position: "absolute", left: table.x, top: table.y }}
      className="pointer-events-auto group inline-block"
    >
      <div className="flex items-center justify-between bg-slate-100 border border-slate-300 border-b-0 rounded-t-md px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onMouseDown={onMouseDown}
          aria-label="Drag table"
          title="Drag to move"
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 cursor-move hover:text-slate-900"
        >
          <GripHorizontal className="w-3 h-3" />
          Drag
        </button>
        <div className="flex items-center gap-0.5">
          <TableHandleButton onClick={() => addRow(true)} title="Add row">
            <Plus className="w-3 h-3" />R
          </TableHandleButton>
          <TableHandleButton onClick={removeRow} title="Remove row" disabled={table.rows <= 1}>
            <Minus className="w-3 h-3" />R
          </TableHandleButton>
          <TableHandleButton onClick={() => addCol(true)} title="Add column">
            <Plus className="w-3 h-3" />C
          </TableHandleButton>
          <TableHandleButton onClick={removeCol} title="Remove column" disabled={table.cols <= 1}>
            <Minus className="w-3 h-3" />C
          </TableHandleButton>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete table"
            title="Delete table"
            className="w-6 h-6 ml-1 rounded text-rose-700 hover:bg-rose-100 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <table className="bg-white border border-slate-300 border-collapse shadow-sm">
        <tbody>
          {table.cells.map((row, r) => (
            <tr key={r}>
              {row.map((value, c) => (
                <td key={c} className="border border-slate-300 p-0 align-top min-w-[5rem]">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                    className={`w-full px-2 py-1.5 text-sm outline-none ${
                      r === 0 ? "bg-slate-50 font-semibold" : "bg-white"
                    } focus:bg-teal-50/40`}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHandleButton({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="inline-flex items-center text-[10px] font-semibold text-slate-600 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent px-1.5 py-1 rounded transition-colors"
    >
      {children}
    </button>
  );
}
