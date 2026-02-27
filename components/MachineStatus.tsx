export type Station = {
  id: string;
  name: string;
  machine_type: string | null;
  status: string;
};

type Props = {
  stations: Station[];
};

export default function MachineStatus({ stations }: Props) {
  if (stations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stations.map((s) => {
        const available = s.status === "available";
        return (
          <span
            key={s.id}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              available
                ? "bg-green-900/40 text-green-300"
                : "bg-red-900/40 text-red-300"
            }`}
          >
            <span>{available ? "🟢" : "🔴"}</span>
            {s.name}
          </span>
        );
      })}
    </div>
  );
}
