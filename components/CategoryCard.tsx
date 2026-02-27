import { type Category, CATEGORY_META } from "@/lib/categories";

type Props = {
  category: Category;
  count: number;
  selected: boolean;
  onClick: () => void;
};

export default function CategoryCard({
  category,
  count,
  selected,
  onClick,
}: Props) {
  const meta = CATEGORY_META[category];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        meta.bg
      } ${
        selected
          ? `${meta.border} ring-2 ring-offset-1 ring-offset-card-bg ring-white/20`
          : "border-transparent hover:border-white/20"
      }`}
    >
      <span className="text-2xl">{meta.dot}</span>
      <div className="flex-1">
        <p className="font-semibold text-text-primary">{category}</p>
        <p className="text-xs text-text-primary/60">
          {count > 0 ? `${count} i kön` : "Ingen kö"}
        </p>
      </div>
      {selected && (
        <span className="text-text-primary/70">✓</span>
      )}
    </button>
  );
}
