"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  updateQueueStatus,
  updateStationStatus,
} from "@/app/actions/queue";
import { CATEGORY_META } from "@/lib/categories";
import { btn, btnBase } from "@/lib/buttonStyles";
import MachineStatus, { type Station } from "./MachineStatus";
import ConfirmDelete from "./ConfirmDelete";

type QueueEntry = {
  id: string;
  user_id: string;
  category: string;
  status: string;
  created_at: string;
};

type Props = {
  staffName: string;
  staffRole: string;
};

export default function StaffQueue({ staffName, staffRole }: Props) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [deleteFor, setDeleteFor] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const s = supabase;

    const fetchAll = async () => {
      const [qRes, sRes] = await Promise.all([
        s
          .from("queue")
          .select("id, user_id, category, status, created_at")
          .in("status", ["waiting", "in_progress"])
          .order("created_at", { ascending: true }),
        s.from("stations").select("id, name, machine_type, status").order("name"),
      ]);
      if (!qRes.error) setQueue((qRes.data as QueueEntry[]) ?? []);
      if (!sRes.error) setStations((sRes.data as Station[]) ?? []);
    };

    fetchAll();

    const channel = s
      .channel("staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, fetchAll)
      .subscribe();

    return () => { s.removeChannel(channel); };
  }, []);

  const act = async (fn: () => Promise<{ error?: string }>, key: string) => {
    setLoading(key);
    await fn();
    setLoading(null);
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Kö ({queue.filter((q) => q.status === "waiting").length} väntande)
          </h1>
          <p className="text-sm text-text-primary/50">
            Inloggad som {staffName} · {staffRole}
          </p>
        </div>
      </div>

      {/* Kö-lista */}
      <section className="mb-8">
        {queue.length === 0 ? (
          <p className="rounded-xl bg-card-bg p-6 text-center text-text-primary/50">
            Kön är tom
          </p>
        ) : (
          <ul className="space-y-3">
            {queue.map((e) => {
              const meta = CATEGORY_META[e.category as keyof typeof CATEGORY_META];
              const isServing = e.status === "in_progress";
              return (
                <li
                  key={e.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl p-4 ${
                    isServing ? "bg-green-900/30 ring-1 ring-green-500/40" : "bg-card-bg"
                  }`}
                >
                  {/* Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-xl">{meta?.dot ?? "⚙️"}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{e.user_id}</p>
                      <p className="text-sm text-text-primary/60">{e.category}</p>
                    </div>
                    {isServing && (
                      <span className="rounded-full bg-green-700/50 px-2 py-0.5 text-xs text-green-300">
                        Betjänas
                      </span>
                    )}
                  </div>

                  {/* Knappar */}
                  <div className="flex flex-wrap gap-2">
                    {!isServing && (
                      <>
                        <button
                          onClick={() =>
                            act(() => updateQueueStatus(e.id, "in_progress"), `serve-${e.id}`)
                          }
                          disabled={loading === `serve-${e.id}`}
                          className={`${btnBase} ${btn.green}`}
                        >
                          ▶ Betjäna
                        </button>
                        <button
                          onClick={() =>
                            act(() => updateQueueStatus(e.id, "done"), `skip-${e.id}`)
                          }
                          disabled={loading === `skip-${e.id}`}
                          className={`${btnBase} ${btn.amber}`}
                        >
                          ⏭ Hoppa över
                        </button>
                      </>
                    )}
                    {isServing && (
                      <button
                        onClick={() =>
                          act(() => updateQueueStatus(e.id, "done"), `done-${e.id}`)
                        }
                        disabled={loading === `done-${e.id}`}
                        className={`${btnBase} ${btn.green}`}
                      >
                        ✓ Klar
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteFor(e)}
                      className={`${btnBase} ${btn.red}`}
                    >
                      🗑 Ta bort
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Maskiner */}
      {stations.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-primary/50">
            Maskiner
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stations.map((s) => {
              const available = s.status === "available";
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-xl p-4 ${
                    available ? "bg-green-900/20" : "bg-red-900/20"
                  }`}
                >
                  <div>
                    <p className="font-medium text-text-primary text-sm">{s.name}</p>
                    <p className="text-xs text-text-primary/50">
                      {available ? "Tillgänglig" : "Pausad"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      act(
                        () =>
                          updateStationStatus(
                            s.id,
                            available ? "maintenance" : "available"
                          ),
                        `station-${s.id}`
                      )
                    }
                    disabled={loading === `station-${s.id}`}
                    className={`${btnBase} text-xs ${available ? btn.amber : btn.green}`}
                  >
                    {available ? "Pausa" : "Starta"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bekräfta radera */}
      {deleteFor && (
        <ConfirmDelete
          queueId={deleteFor.id}
          userName={deleteFor.user_id}
          onSuccess={() => setDeleteFor(null)}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </main>
  );
}
