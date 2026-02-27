"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { deleteQueueEntry } from "@/app/actions/queue";

type AdminAuthProps = {
  queueId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actionLabel?: string;
};

export default function AdminAuth({
  queueId,
  onSuccess,
  onCancel,
  actionLabel = "Radera",
}: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const performDelete = async (adminInput: string) => {
    const result = await deleteQueueEntry(queueId, adminInput);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccessRef.current();
  };

  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5Qrcode("admin-qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 5, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          performDelete(decodedText);
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
    setSubmitting(true);
    await performDelete(password);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-card-bg p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">
          Admin – {actionLabel}
        </h3>
        <p className="mb-4 text-sm text-text-primary/80">
          Skanna Admin QR eller ange lösenord:
        </p>

        {scanning ? (
          <>
            <div id="admin-qr-reader" className="mb-4 rounded overflow-hidden" />
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="w-full rounded py-2 text-text-primary ring-1 ring-text-primary/30 hover:bg-text-primary/10"
            >
              Avbryt skanning
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lösenord"
                className="flex-1 rounded border border-text-primary/20 bg-bg-main px-4 py-2 text-text-primary placeholder:text-text-primary/50 focus:border-accent-ink focus:outline-none focus:ring-1 focus:ring-accent-ink"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                className="rounded bg-accent-ink px-4 py-2 text-text-primary hover:opacity-90"
              >
                Skanna QR
              </button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded py-2 text-text-primary ring-1 ring-text-primary/30 hover:bg-text-primary/10"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded bg-accent-ink py-2 text-text-primary hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Raderar…" : "Bekräfta"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
