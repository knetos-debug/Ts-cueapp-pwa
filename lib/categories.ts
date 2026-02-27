export const CATEGORIES = [
  "3D-print",
  "Laserskärning",
  "Plotter",
  "Printing",
  "Tröjtryck",
  "Muggtryck",
  "CNC/Verkstad",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<
  Category,
  { bg: string; border: string; dot: string }
> = {
  "3D-print": {
    bg: "bg-blue-900/60",
    border: "border-blue-500",
    dot: "🔵",
  },
  Laserskärning: {
    bg: "bg-red-900/60",
    border: "border-red-500",
    dot: "🔴",
  },
  Plotter: {
    bg: "bg-green-900/60",
    border: "border-green-500",
    dot: "🟢",
  },
  Printing: {
    bg: "bg-yellow-900/60",
    border: "border-yellow-500",
    dot: "🟡",
  },
  Tröjtryck: {
    bg: "bg-purple-900/60",
    border: "border-purple-500",
    dot: "🟣",
  },
  Muggtryck: {
    bg: "bg-pink-900/60",
    border: "border-pink-500",
    dot: "🩷",
  },
  "CNC/Verkstad": {
    bg: "bg-orange-900/60",
    border: "border-orange-500",
    dot: "🟠",
  },
};
