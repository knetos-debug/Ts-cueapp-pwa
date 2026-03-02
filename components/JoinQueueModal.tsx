"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CATEGORIES, type Category } from "@/lib/categories";
import { btn, btnBase } from "@/lib/buttonStyles";
import CategoryCard from "./CategoryCard";

/** Spelar ett kort "ding"-ljud via Web Audio API — ingen ljudfil behövs */
function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);       // A5
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Ljud stöds ej i denna webbläsare — ignorera
  }
}

type QueueEntry = { category: string };

type JoinQueueModalProps = {
  onClose: () => void;
  onSubmit: (user_id: string, category: string) => Promise<void>;
  queue?: QueueEntry[];
};

export default function JoinQueueModal({
  onClose,
  onSubmit,
  queue = [],
}: JoinQueueModalProps) {
  const [user_id, setUser_id] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const countFor = (cat: string) =>
    queue.filter((e) => e.category === cat).length;

  useEffect(() => {
    if (!scanning) return;
    setError("");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "user" },
        { fps: 5, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setUser_id(decodedText.trim());
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
        },
        () => {}
      )
      .catch((err) => {
        setError("Kunde inte starta kameran: " + (err?.message ?? String(err)));
        scannerRef.current = null;
        setScanning(false);
      });
    return () => {
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [scanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user_id.trim()) {
      setError("Ange medlems-ID eller skanna QR.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(user_id.trim(), category);
      playSuccessSound();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card-bg p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Ställ dig i kö</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-primary/50 hover:bg-text-primary/10 hover:text-text-primary"
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Medlems-ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary/80">
              Medlems-ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user_id}
                onChange={(e) => setUser_id(e.target.value)}
                placeholder="Skriv eller skanna QR"
                className="flex-1 rounded-xl border border-text-primary/20 bg-bg-main px-4 py-3 text-text-primary placeholder:text-text-primary/40 focus:border-accent-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                disabled={scanning}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${btn.zinc} disabled:opacity-50`}
              >
                {scanning ? "Skannar…" : "📷 QR"}
              </button>
            </div>
          </div>

          {scanning && (
            <div id="qr-reader" className="overflow-hidden rounded-xl" />
          )}

          {/* Kategori-kort */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary/80">
              Välj kategori
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  count={countFor(cat)}
                  selected={category === cat}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${btnBase} ${btn.zinc}`}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={submitting || !user_id.trim()}
              className={`flex-1 ${btnBase} ${btn.green} disabled:opacity-50`}
            >
              {submitting ? "Skickar…" : "Gå med"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
