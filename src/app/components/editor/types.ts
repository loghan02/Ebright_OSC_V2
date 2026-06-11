export type Position = "left" | "center" | "right";
export type PageNumberStyle =
  | "plain"
  | "dashes"
  | "parens"
  | "of-total"
  | "page-n"
  | "page-n-of-total"
  | "dots"
  | "brackets"
  | "slash-total"
  | "upper-roman"
  | "lower-roman"
  | "upper-alpha"
  | "lower-alpha"
  | "leading-zero";

export interface PageNumberConfig {
  enabled: boolean;
  position: Position;
  style: PageNumberStyle;
  color: string;
  italic: boolean;
  bold: boolean;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  defaultText: string;
  perPage: Record<number, string>;
  editingFor: number | "default";
  position: Position;
  color: string;
  italic: boolean;
  bold: boolean;
}

export interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  showBorder?: boolean; // default true; false = hidden border (only shown on hover)
}

export interface OverlayTable {
  id: string;
  page: number;
  x: number;
  y: number;
  rows: number;
  cols: number;
  cells: string[][];
}

export function makeOverlayTable(page: number, rows: number, cols: number): OverlayTable {
  return {
    id: `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    page,
    x: 40,
    y: 40,
    rows,
    cols,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
  };
}

export const DEFAULT_PAGE_NUMBER: PageNumberConfig = {
  enabled: false,
  position: "center",
  style: "dashes",
  color: "#475569",
  italic: true,
  bold: false,
};

export function makeDefaultHeader(): HeaderFooterConfig {
  return {
    enabled: false,
    defaultText: "",
    perPage: {},
    editingFor: "default",
    position: "center",
    color: "#475569",
    italic: false,
    bold: true,
  };
}

export function makeDefaultFooter(): HeaderFooterConfig {
  return {
    enabled: false,
    defaultText: "",
    perPage: {},
    editingFor: "default",
    position: "center",
    color: "#475569",
    italic: false,
    bold: false,
  };
}

function toRoman(num: number): string {
  if (num <= 0) return String(num);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

function toAlpha(num: number): string {
  if (num <= 0) return String(num);
  let n = num;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

export function formatPageNumber(n: number, style: PageNumberStyle, total: number): string {
  switch (style) {
    case "plain":
      return String(n);
    case "dashes":
      return `— ${n} —`;
    case "parens":
      return `( ${n} )`;
    case "of-total":
      return `${n} / ${total}`;
    case "page-n":
      return `Page ${n}`;
    case "page-n-of-total":
      return `Page ${n} of ${total}`;
    case "dots":
      return `· ${n} ·`;
    case "brackets":
      return `[ ${n} ]`;
    case "slash-total":
      return `${n} of ${total}`;
    case "upper-roman":
      return toRoman(n);
    case "lower-roman":
      return toRoman(n).toLowerCase();
    case "upper-alpha":
      return toAlpha(n);
    case "lower-alpha":
      return toAlpha(n).toLowerCase();
    case "leading-zero":
      return String(n).padStart(2, "0");
    default:
      return String(n);
  }
}

export const POSITION_TO_JUSTIFY: Record<Position, string> = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};
