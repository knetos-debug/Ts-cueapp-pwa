"use client";

import { useState } from "react";
import { deleteQueueEntry } from "@/app/actions/queue";
import { btn, btnBase } from "@/lib/buttonStyles";

type Props = {
  queueId: string;
  userName: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ConfirmDelete({
  queueId,
  userName,
  onSuccess,
  onCancel,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    const result = await deleteQueueEntry(queueId);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card-bg p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          Radera köpost?
        </h3>
        <p className="mb-6 text-sm text-text-primary/70">
          <span className="font-medium text-text-primary">{userName}</span>{" "}
          tas bort från kön. Detta går inte att ångra.
        </p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 ${btnBase} ${btn.zinc}`}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 ${btnBase} ${btn.red}`}
          >
            {deleting ? "Raderar…" : "Radera"}
          </button>
        </div>
      </div>
    </div>
  );
}
