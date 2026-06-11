import { Table } from "@tiptap/extension-table";
import { ReactNodeViewRenderer } from "@tiptap/react";
import DraggableTableView from "./DraggableTableView";

export const DraggableTable = Table.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      x: {
        default: 0,
        parseHTML: (el) => Number((el as HTMLElement).dataset.x ?? 0),
        renderHTML: (attrs) => {
          const v = (attrs as { x?: number }).x ?? 0;
          return v ? { "data-x": String(v) } : {};
        },
      },
      y: {
        default: 0,
        parseHTML: (el) => Number((el as HTMLElement).dataset.y ?? 0),
        renderHTML: (attrs) => {
          const v = (attrs as { y?: number }).y ?? 0;
          return v ? { "data-y": String(v) } : {};
        },
      },
      floating: {
        default: false,
        parseHTML: (el) => (el as HTMLElement).dataset.floating === "true",
        renderHTML: (attrs) => {
          const f = (attrs as { floating?: boolean }).floating;
          return f ? { "data-floating": "true" } : {};
        },
      },
      locked: {
        default: false,
        parseHTML: (el) => (el as HTMLElement).dataset.locked === "true",
        renderHTML: (attrs) => {
          const l = (attrs as { locked?: boolean }).locked;
          return l ? { "data-locked": "true" } : {};
        },
      },
      width: {
        default: null as number | null,
        parseHTML: (el) => {
          const v = Number((el as HTMLElement).dataset.width);
          return Number.isFinite(v) && v > 0 ? v : null;
        },
        renderHTML: (attrs) => {
          const v = (attrs as { width?: number | null }).width;
          return v ? { "data-width": String(v) } : {};
        },
      },
      height: {
        default: null as number | null,
        parseHTML: (el) => {
          const v = Number((el as HTMLElement).dataset.height);
          return Number.isFinite(v) && v > 0 ? v : null;
        },
        renderHTML: (attrs) => {
          const v = (attrs as { height?: number | null }).height;
          return v ? { "data-height": String(v) } : {};
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(DraggableTableView);
  },
});
