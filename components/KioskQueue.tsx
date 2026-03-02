"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { CATEGORY_META } from "@/lib/categories";
import { joinQueue } from "@/app/actions/queue";
import MachineStatus, { type Station } from "./MachineStatus";
import JoinQueueModal from "./JoinQueueModal";

type QueueEntry = {
  id: string;
  user_id: string;
  category: string;
  status: string;
  created_at: string;
};

/** Spelar ett "ding" när en person börjar betjänas */
function playServedSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);        // A5
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12); // E6
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Web Audio stöds ej — ignorera
  }
}

function estWait(count: number) {
  const min = count * 15;
  return min >= 60 ? `~${Math.round(min / 60)}h` : `~${min}m`;
}

export default function KioskQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const prevInProgressIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

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
        s.from("stations").select("id, name, machine_type, status"),
      ]);

      if (!qRes.error) {
        const newQueue = (qRes.data as QueueEntry[]) ?? [];

        // Spela ljud om ett nytt in_progress-ID dyker upp (ej vid första laddning)
        if (!isFirstLoad.current) {
          const newInProgressIds = new Set(
            newQueue.filter((e) => e.status === "in_progress").map((e) => e.id)
          );
          const hasNewServed = [...newInProgressIds].some(
            (id) => !prevInProgressIds.current.has(id)
          );
          if (hasNewServed) playServedSound();
          prevInProgressIds.current = newInProgressIds;
        } else {
          // Första laddning — spara nuvarande IDs utan att spela ljud
          prevInProgressIds.current = new Set(
            newQueue.filter((e) => e.status === "in_progress").map((e) => e.id)
          );
          isFirstLoad.current = false;
        }

        setQueue(newQueue);
      }
      if (!sRes.error) setStations((sRes.data as Station[]) ?? []);
    };

    fetchAll();

    const channel = s
      .channel("kiosk-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, fetchAll)
      .subscribe();

    return () => { s.removeChannel(channel); };
  }, []);

  const handleJoinSubmit = async (user_id: string, category: string) => {
    const result = await joinQueue(user_id, category);
    if (result.error) throw new Error(result.error);
  };

  const serving = queue.filter((q) => q.status === "in_progress");
  const waiting = queue.filter((q) => q.status === "waiting");
  const next = waiting[0];
  const rest = waiting.slice(1);

  const qrUrl = appUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=F7F8F8&bgcolor=353637&data=${encodeURIComponent(appUrl + "/queue")}`
    : null;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-6 pb-10">
      {/* ─── RUBRIK ──────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Kö</h1>
        <p className="text-sm text-text-primary/40 mt-1">Trainstation Makerspace</p>
      </div>

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded bg-card-bg p-4 text-text-primary/70 text-sm">
          Supabase är inte konfigurerad.
        </p>
      )}

      {/* ─── NU BETJÄNAS ─────────────────────────────────────── */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
          Nu betjänas
        </h2>
        {serving.length === 0 ? (
          <div className="rounded-xl bg-card-bg p-5 text-center text-text-primary/40 text-sm">
            Ingen betjänas just nu
          </div>
        ) : (
          <ul className="space-y-2">
            {serving.map((e) => {
              const meta = CATEGORY_META[e.category as keyof typeof CATEGORY_META];
              return (
                <li
                  key={e.id}
                  className={`flex items-center gap-4 rounded-xl border-l-4 ${meta?.border ?? "border-text-primary/30"} bg-card-bg px-5 py-4`}
                >
                  <span className="text-2xl">{meta?.dot ?? "⚙️"}</span>
                  <div>
                    <p className="text-xl font-bold text-text-primary">{e.user_id}</p>
                    <p className="text-sm text-text-primary/60">{e.category}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── NÄSTA ───────────────────────────────────────────── */}
      {next && (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            Nästa
          </h2>
          <div className="flex items-center gap-4 rounded-xl bg-card-bg px-5 py-4">
            <span className="text-2xl">{CATEGORY_META[next.category as keyof typeof CATEGORY_META]?.dot ?? "⚙️"}</span>
            <div className="flex-1">
              <p className="text-lg font-semibold text-text-primary">{next.user_id}</p>
              <p className="text-sm text-text-primary/60">{next.category}</p>
            </div>
            <span className="text-sm text-text-primary/50">⏱ {estWait(1)}</span>
          </div>
        </section>
      )}

      {/* ─── I KÖN ───────────────────────────────────────────── */}
      {rest.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            I kön
          </h2>
          <ul className="space-y-2">
            {rest.map((e, i) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-card-bg px-5 py-3"
              >
                <span className="w-6 text-center text-sm font-bold text-text-primary/40">
                  {i + 2}
                </span>
                <span className="text-lg">{CATEGORY_META[e.category as keyof typeof CATEGORY_META]?.dot ?? "⚙️"}</span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{e.user_id}</p>
                  <p className="text-sm text-text-primary/60">{e.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── TOM KÖ ──────────────────────────────────────────── */}
      {queue.length === 0 && isSupabaseConfigured && (
        <div className="mb-5 rounded-xl bg-card-bg p-8 text-center text-text-primary/50">
          Kön är tom
        </div>
      )}

      {/* ─── GÅ MED-KNAPP ────────────────────────────────────── */}
      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 w-full rounded-2xl bg-green-600 py-5 text-xl font-bold text-white hover:bg-green-700 active:scale-95 transition-transform"
      >
        Ställ dig i kön  +
      </button>

      {/* ─── MASKINSTATUS ────────────────────────────────────── */}
      {stations.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-primary/50">
            Maskiner
          </h2>
          <MachineStatus stations={stations} />
        </section>
      )}

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="flex items-center justify-between border-t border-text-primary/10 pt-4 text-sm text-text-primary/50">
        <span>
          {waiting.length} {waiting.length === 1 ? "person" : "personer"} i kö
          {waiting.length > 0 && ` · ${estWait(waiting.length)} väntetid`}
        </span>
        {qrUrl && (
          <div className="text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR till /queue" width={60} height={60} className="rounded ml-auto" />
            <p className="mt-1 text-xs">Följ kön på telefon</p>
          </div>
        )}
      </footer>

      {modalOpen && (
        <JoinQueueModal
          queue={queue}
          onClose={() => setModalOpen(false)}
          onSubmit={handleJoinSubmit}
        />
      )}
    </main>
  );
}
