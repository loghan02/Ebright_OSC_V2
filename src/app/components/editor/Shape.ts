import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ShapeNodeView from "./ShapeNodeView";

export const Shape = Node.create({
  name: "shape",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  isolating: true,

  addAttributes() {
    return {
      shapeType: {
        default: "circle",
        parseHTML: (el) => (el as HTMLElement).dataset.shape ?? "circle",
        renderHTML: (attrs) => ({ "data-shape": (attrs as { shapeType?: string }).shapeType ?? "circle" }),
      },
      filled: {
        default: true,
        parseHTML: (el) => (el as HTMLElement).dataset.filled !== "false",
        renderHTML: (attrs) => ({
          "data-filled": (attrs as { filled?: boolean }).filled === false ? "false" : "true",
        }),
      },
      color: {
        default: "#3b82f6",
        parseHTML: (el) => (el as HTMLElement).dataset.color ?? "#3b82f6",
        renderHTML: (attrs) => ({ "data-color": (attrs as { color?: string }).color ?? "#3b82f6" }),
      },
      x: {
        default: 60,
        parseHTML: (el) => Number((el as HTMLElement).dataset.x ?? 60),
        renderHTML: (attrs) => ({ "data-x": String((attrs as { x?: number }).x ?? 60) }),
      },
      y: {
        default: 60,
        parseHTML: (el) => Number((el as HTMLElement).dataset.y ?? 60),
        renderHTML: (attrs) => ({ "data-y": String((attrs as { y?: number }).y ?? 60) }),
      },
      rotation: {
        default: 0,
        parseHTML: (el) => Number((el as HTMLElement).dataset.rotation ?? 0),
        renderHTML: (attrs) => ({ "data-rotation": String((attrs as { rotation?: number }).rotation ?? 0) }),
      },
      width: {
        default: 100,
        parseHTML: (el) => Number((el as HTMLElement).dataset.width ?? 100),
        renderHTML: (attrs) => ({ "data-width": String((attrs as { width?: number }).width ?? 100) }),
      },
      height: {
        default: 100,
        parseHTML: (el) => Number((el as HTMLElement).dataset.height ?? 100),
        renderHTML: (attrs) => ({ "data-height": String((attrs as { height?: number }).height ?? 100) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-shape]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-shape-node": "" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeNodeView);
  },
});
