"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { joinQueue } from "@/app/actions/queue";
import JoinQueueModal from "./JoinQueueModal";
import AdminAuth from "./AdminAuth";

type QueueEntry = {
  id: string;
  user_id: string;
  category: string;
  status: string;
  staff_notes: string | null;
  created_at: string;
};

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminAuthFor, setAdminAuthFor] = useState<string | null>(null);
  const [hasKioskSecret, setHasKioskSecret] = useState(false);

  // Läs kiosk-nyckel från URL (?kiosk=xxx) och spara i sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("kiosk");
    if (fromUrl) {
      sessionStorage.setItem("kiosk_secret", fromUrl);
    }
    setHasKioskSecret(!!sessionStorage.getItem("kiosk_secret"));
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const fetchQueue = async () => {
      const { data, error } = await client
        .from("queue")
        .select("id, user_id, category, status, staff_notes, created_at")
        .order("created_at", { ascending: true });
      if (!error) setQueue((data as QueueEntry[]) ?? []);
    };

    fetchQueue();

    const channel = client
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        () => fetchQueue()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const handleJoinSubmit = async (user_id: string, category: string) => {
    const kiosk_secret = sessionStorage.getItem("kiosk_secret") ?? "";
    const result = await joinQueue(user_id, category, kiosk_secret);
    if (result.error) throw new Error(result.error);
  };

  const handleDeleteRequest = (id: string) => {
    setAdminAuthFor(id);
  };

  const handleAdminSuccess = () => {
    setAdminAuthFor(null);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Kö</h1>
        {hasKioskSecret && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-ink text-2xl text-text-primary shadow-lg hover:opacity-90"
            aria-label="Gå med i kö"
          >
            +
          </button>
        )}
      </header>

      {!isSupabaseConfigured && (
        <p className="rounded bg-card-bg p-4 text-text-primary/80">
          Supabase är inte konfigurerad. Lägg till NEXT_PUBLIC_SUPABASE_URL och
          NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}

      <ul className="space-y-3">
        {queue.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-4 rounded-lg bg-card-bg p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{entry.user_id}</p>
              <p className="text-sm text-text-primary/70">{entry.category}</p>
              <p className="text-xs text-text-primary/50">
                {new Date(entry.created_at).toLocaleString("sv-SE")}
              </p>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-1 text-xs ${
                entry.status === "done"
                  ? "bg-green-900/50 text-green-300"
                  : entry.status === "in_progress"
                    ? "bg-amber-900/50 text-amber-300"
                    : "bg-text-primary/10 text-text-primary"
              }`}
            >
              {entry.status}
            </span>
            <button
              onClick={() => handleDeleteRequest(entry.id)}
              className="shrink-0 rounded p-2 text-red-400 hover:bg-red-900/30"
              aria-label="Radera"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {queue.length === 0 && isSupabaseConfigured && (
        <p className="rounded bg-card-bg p-6 text-center text-text-primary/70">
          Köen är tom.{" "}
          {hasKioskSecret
            ? "Tryck på + för att gå med."
            : "Öppna kiosk-URL:en för att ställa dig i kön."}
        </p>
      )}

      {modalOpen && (
        <JoinQueueModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleJoinSubmit}
        />
      )}

      {adminAuthFor && (
        <AdminAuth
          queueId={adminAuthFor}
          onSuccess={handleAdminSuccess}
          onCancel={() => setAdminAuthFor(null)}
          actionLabel="Radera köpost"
        />
      )}
    </main>
  );
}
