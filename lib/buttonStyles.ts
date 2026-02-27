/** Färgade knapp-varianter — konsekvent genom hela appen */
export const btn = {
  /** Lägg till / Bekräfta / Starta / Klar */
  green: "bg-green-600 hover:bg-green-700 text-white",
  /** Ta bort / Radera */
  red: "bg-red-600 hover:bg-red-700 text-white",
  /** Hoppa över / Pausa */
  amber: "bg-amber-600 hover:bg-amber-700 text-white",
  /** Avbryt / Stäng / Neutral */
  zinc: "bg-zinc-600 hover:bg-zinc-700 text-white",
  /** Logga in */
  blue: "bg-blue-600 hover:bg-blue-700 text-white",
} as const;

/** Grundform — storlek, rundning, transition, disabled */
export const btnBase =
  "rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50";

/** Stor variant för touch-targets (kiosk) */
export const btnLg =
  "rounded-xl px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-50";
