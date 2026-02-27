"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const CATEGORIES = [
  "3D-print",
  "Laserskärning",
  "Plotter",
  "Printing",
  "Tröjtryck",
  "Muggtryck",
  "CNC/Verkstad",
] as const;

type JoinQueueModalProps = {
  onClose: () => void;
  onSubmit: (user_id: string, category: string) => Promise<void>;
};

export default function JoinQueueModal({
  onClose,
  onSubmit,
}: JoinQueueModalProps) {
  const [user_id, setUser_id] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scanning) return;
    setError("");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-card-bg p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">
            Gå med i kö
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-text-primary/70 hover:bg-text-primary/10 hover:text-text-primary"
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-primary/80">
              Medlems-ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user_id}
                onChange={(e) => setUser_id(e.target.value)}
                placeholder="Skriv eller skanna QR"
                className="flex-1 rounded border border-text-primary/20 bg-bg-main px-4 py-2 text-text-primary placeholder:text-text-primary/50 focus:border-accent-ink focus:outline-none focus:ring-1 focus:ring-accent-ink"
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                disabled={scanning}
                className="rounded bg-accent-ink px-4 py-2 text-text-primary hover:opacity-90 disabled:opacity-50"
              >
                {scanning ? "Skannar…" : "Skanna"}
              </button>
            </div>
          </div>

          {scanning && (
            <div id="qr-reader" className="rounded overflow-hidden" />
          )}

          <div>
            <label className="mb-1 block text-sm text-text-primary/80">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-text-primary/20 bg-bg-main px-4 py-2 text-text-primary focus:border-accent-ink focus:outline-none focus:ring-1 focus:ring-accent-ink"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded py-2 text-text-primary ring-1 ring-text-primary/30 hover:bg-text-primary/10"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded bg-accent-ink py-2 text-text-primary hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Skickar…" : "Gå med"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
