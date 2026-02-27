"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { CATEGORY_META } from "@/lib/categories";
import MachineStatus, { type Station } from "./MachineStatus";

type QueueEntry = {
  id: string;
  user_id: string;
  category: string;
  status: string;
  created_at: string;
};

function estWait(count: number) {
  const min = count * 15;
  return min >= 60 ? `~${Math.round(min / 60)} h` : `~${min} min`;
}

export default function RemoteQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

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
      .channel("remote-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, fetchAll)
      .subscribe();

    return () => { s.removeChannel(channel); };
  }, []);

  const serving = queue.filter((q) => q.status === "in_progress");
  const waiting = queue.filter((q) => q.status === "waiting");
  const next = waiting[0];
  const rest = waiting.slice(1);

  return (
    <main className="container mx-auto max-w-sm px-4 py-6">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Kö</h1>
        <p className="text-xs text-text-primary/40 mt-1 uppercase tracking-widest">
          Realtid · Trainstation
        </p>
      </div>

      {/* NU BETJÄNAS */}
      <section className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
          Nu betjänas
        </h2>
        {serving.length === 0 ? (
          <div className="rounded-xl bg-card-bg p-4 text-center text-sm text-text-primary/40">
            —
          </div>
        ) : (
          <ul className="space-y-2">
            {serving.map((e) => {
              const meta = CATEGORY_META[e.category as keyof typeof CATEGORY_META];
              return (
                <li key={e.id} className={`flex items-center gap-3 rounded-xl border-l-4 ${meta?.border ?? "border-text-primary/30"} bg-card-bg px-4 py-3`}>
                  <span>{meta?.dot ?? "⚙️"}</span>
                  <div>
                    <p className="font-bold text-text-primary">{e.user_id}</p>
                    <p className="text-xs text-text-primary/60">{e.category}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* NÄSTA */}
      {next && (
        <section className="mb-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            Nästa
          </h2>
          <div className="flex items-center gap-3 rounded-xl bg-card-bg px-4 py-3">
            <span>{CATEGORY_META[next.category as keyof typeof CATEGORY_META]?.dot ?? "⚙️"}</span>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{next.user_id}</p>
              <p className="text-xs text-text-primary/60">{next.category}</p>
            </div>
          </div>
        </section>
      )}

      {/* I KÖN */}
      {rest.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            I kön
          </h2>
          <ul className="space-y-1.5">
            {rest.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg bg-card-bg px-4 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-text-primary/40">{i + 2}</span>
                <span>{CATEGORY_META[e.category as keyof typeof CATEGORY_META]?.dot ?? "⚙️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{e.user_id}</p>
                  <p className="text-xs text-text-primary/60">{e.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {queue.length === 0 && (
        <div className="mb-4 rounded-xl bg-card-bg p-6 text-center text-sm text-text-primary/40">
          Kön är tom
        </div>
      )}

      {/* MASKINER */}
      {stations.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            Maskiner
          </h2>
          <MachineStatus stations={stations} />
        </section>
      )}

      {/* VÄNTETID */}
      {waiting.length > 0 && (
        <p className="text-center text-sm text-text-primary/40">
          Uppskattad väntetid: {estWait(waiting.length)}
        </p>
      )}
    </main>
  );
}
