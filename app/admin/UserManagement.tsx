"use client";

import { useState, useTransition } from "react";
import {
  createUserAction,
  updateUserAction,
} from "@/app/actions/auth";
import { btn, btnBase } from "@/lib/buttonStyles";
import type { SessionPayload } from "@/lib/auth/session";

type AppUser = {
  id: string;
  username: string;
  display_name: string;
  role: SessionPayload["role"];
  active: boolean;
  visible_password: string | null;
  created_at: string;
};

const ROLE_LABEL: Record<SessionPayload["role"], string> = {
  admin: "Admin",
  superuser: "Superuser",
  user: "Personal",
  kiosk: "Kiosk",
};

const ROLE_COLOR: Record<SessionPayload["role"], string> = {
  admin: "bg-purple-800/60 text-purple-200 border border-purple-600/40",
  superuser: "bg-blue-800/60 text-blue-200 border border-blue-600/40",
  user: "bg-green-800/60 text-green-200 border border-green-600/40",
  kiosk: "bg-amber-800/60 text-amber-200 border border-amber-600/40",
};

const ROLE_RANK: Record<SessionPayload["role"], number> = {
  admin: 4,
  superuser: 3,
  user: 2,
  kiosk: 1,
};

type Props = {
  users: AppUser[];
  currentUser: SessionPayload;
};

type EditState = {
  id: string;
  display_name: string;
  new_password: string;
  active: boolean;
};

export default function UserManagement({ users: initialUsers, currentUser }: Props) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<EditState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vilka roller kan den inloggade skapa?
  const creatableRoles: SessionPayload["role"][] =
    currentUser.role === "admin"
      ? ["admin", "superuser", "user", "kiosk"]
      : ["user", "kiosk"];

  // ── Skapa användare ─────────────────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<SessionPayload["role"]>("user");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createUserAction({
        username: newUsername,
        password: newPassword,
        display_name: newDisplayName,
        role: newRole,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Användaren "${newDisplayName}" skapades.`);
        setShowCreate(false);
        setNewUsername("");
        setNewDisplayName("");
        setNewPassword("");
        setNewRole("user");
        // Ladda om sidan för att hämta ny lista
        window.location.reload();
      }
    });
  }

  // ── Redigera användare ──────────────────────────────────────────────────────
  function startEdit(u: AppUser) {
    setEditUser({
      id: u.id,
      display_name: u.display_name,
      new_password: "",
      active: u.active,
    });
    setError(null);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setError(null);
    startTransition(async () => {
      const res = await updateUserAction({
        id: editUser.id,
        display_name: editUser.display_name,
        new_password: editUser.new_password || undefined,
        active: editUser.active,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Användaren uppdaterades.");
        setEditUser(null);
        window.location.reload();
      }
    });
  }

  // Kiosk-användare för snabb-visning
  const kioskUsers = users.filter((u) => u.role === "kiosk");

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-600/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-900/40 border border-green-600/40 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* Kiosk-credentials (synliga för alla inloggade) */}
      {kioskUsers.length > 0 && (
        <section className="rounded-xl bg-amber-900/20 border border-amber-600/30 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/80">
            🖥 Kiosk-inloggning (delas med personal)
          </h2>
          <div className="space-y-2">
            {kioskUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 text-sm">
                <span className="text-text-primary/60 w-24">Användare:</span>
                <span className="font-mono text-text-primary font-semibold">{u.username}</span>
                <span className="text-text-primary/60 w-24">Lösenord:</span>
                <span className="font-mono text-text-primary font-semibold">
                  {u.visible_password ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Användarlista */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-primary/50">
            Användare ({users.length})
          </h2>
          <button
            onClick={() => { setShowCreate(!showCreate); setError(null); }}
            className={`${btnBase} ${btn.green} text-xs`}
          >
            + Ny användare
          </button>
        </div>

        {/* Skapa-formulär */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-4 rounded-xl bg-card-bg border border-white/10 p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-text-primary">Skapa användare</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-primary/60">Användarnamn</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="t.ex. kiosk1"
                  className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-primary/60">Visningsnamn</label>
                <input
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  placeholder="t.ex. Kiosk 1"
                  className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-primary/60">Lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-primary/60">Roll</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as SessionPayload["role"])}
                  className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-ink"
                >
                  {creatableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className={`${btnBase} ${btn.green}`}>
                {isPending ? "Skapar…" : "Skapa"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={`${btnBase} ${btn.zinc}`}
              >
                Avbryt
              </button>
            </div>
          </form>
        )}

        {/* Tabellrad per användare */}
        <div className="rounded-xl bg-card-bg overflow-hidden divide-y divide-white/5">
          {users.map((u) => {
            const canEdit =
              ROLE_RANK[currentUser.role] > ROLE_RANK[u.role] ||
              u.id === /* own account */ currentUser.id;
            const isEditing = editUser?.id === u.id;

            return (
              <div key={u.id} className="px-4 py-3">
                {/* Huvud-rad */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">
                        {u.display_name}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                      {!u.active && (
                        <span className="rounded-full px-2 py-0.5 text-xs bg-zinc-700/60 text-zinc-400 border border-zinc-600/40">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-primary/40 mt-0.5 font-mono">
                      {u.username}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => isEditing ? setEditUser(null) : startEdit(u)}
                      className={`${btnBase} ${btn.zinc} text-xs`}
                    >
                      {isEditing ? "Stäng" : "Redigera"}
                    </button>
                  )}
                </div>

                {/* Redigera-formulär */}
                {isEditing && editUser && (
                  <form
                    onSubmit={handleUpdate}
                    className="mt-3 pt-3 border-t border-white/5 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-text-primary/60">Visningsnamn</label>
                        <input
                          value={editUser.display_name}
                          onChange={(e) => setEditUser({ ...editUser, display_name: e.target.value })}
                          className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-ink"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-primary/60">
                          Nytt lösenord <span className="text-text-primary/30">(lämna tomt för oförändrat)</span>
                        </label>
                        <input
                          type="password"
                          value={editUser.new_password}
                          onChange={(e) => setEditUser({ ...editUser, new_password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-ink"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-text-primary/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editUser.active}
                          onChange={(e) => setEditUser({ ...editUser, active: e.target.checked })}
                          className="accent-accent-ink"
                        />
                        Aktiv
                      </label>
                      <div className="flex gap-2 ml-auto">
                        <button type="submit" disabled={isPending} className={`${btnBase} ${btn.green} text-xs`}>
                          {isPending ? "Sparar…" : "Spara"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUser(null)}
                          className={`${btnBase} ${btn.zinc} text-xs`}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
