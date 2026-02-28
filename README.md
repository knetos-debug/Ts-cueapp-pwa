# Köapp – Trainstation Makerspace

Ett realtids-kösystem för Trainstation Makerspace i Karlskoga. Personal och kiosker hanterar kön via rollbaserad inloggning; besökare kan följa kön live via QR-kod utan att logga in.

---

## Funktioner

- **Realtidskö** – uppdateras automatiskt för alla via Supabase Realtime
- **Rollbaserat inloggningsflöde** – skriv bara bas-URL:en, appen tar dig rätt beroende på roll
- **Kiosk-vy** – visas på skärm i lokalen, stor "Ställ dig i kön"-knapp, QR-kod till fjärrvy
- **Personal-vy** – betjäna, hoppa över, ta bort köposter; pausa/starta maskiner
- **Fjärr-vy** – `/queue` är publik, ingen inloggning krävs, perfekt för mobil via QR
- **Admin-panel** – superuser/admin kan skapa och hantera användare med roller
- **Säkerhet** – bcrypt-lösenord, JWT-sessioner (httpOnly), rate limiting (10 försök → 15 min lockout), unik köplats per användare
- **PWA-redo** – fungerar på mobil, surfplatta och smartklocka

---

## Roller

| Roll | Åtkomst |
|------|---------|
| `kiosk` | Kiosk-vy (`/`) |
| `user` | Personal-vy (`/staff`) |
| `superuser` | Personal + skapa user/kiosk-konton (`/admin`) |
| `admin` | Allt inklusive skapa superuser/admin-konton |

---

## Kategorier

| Kategori |
|----------|
| 3D-print |
| Laserskärning |
| Plotter |
| Printing |
| Tröjtryck |
| Muggtryck |
| CNC/Verkstad |

---

## Tech-stack

| Del | Teknologi |
|-----|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v3 + Ubuntu (Google Fonts) |
| Databas | Supabase (PostgreSQL + Realtime) |
| Auth | Eget system – `app_users`-tabell, bcryptjs, JWT via `jose` |
| Deploy | Vercel |

---

## Kom igång lokalt

### 1. Klona och installera

```bash
git clone https://github.com/knetos-debug/Ts-cueapp-pwa.git
cd Ts-cueapp-pwa
npm install
```

### 2. Miljövariabler

```bash
cp .env.local.example .env.local
```

| Variabel | Beskrivning |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (secret) |
| `SESSION_SECRET` | Minst 32 tecken – signerar JWT-sessionscookies |

### 3. Databas

Kör alla migreringar i Supabase SQL-editorn i ordning:

```
supabase/migrations/001_initial.sql
supabase/migrations/002_queue_user_id_text.sql
supabase/migrations/003_app_users.sql
supabase/migrations/004_stations.sql
supabase/migrations/005_visible_password.sql
supabase/migrations/006_queue_category_text.sql
supabase/migrations/007_security_hardening.sql   ← rate limiting + unik kö-plats
```

Skapa sedan ett första admin-konto direkt i tabellen `app_users` (bcrypt-hash för lösenordet).

### 4. Starta

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

---

## Deploy till Vercel

Lägg till miljövariablerna under **Project Settings → Environment Variables**.

> **OBS:** Stäng av **Deployment Protection** (Vercel → Settings → Deployment Protection → Disabled) annars hamnar QR-koden för `/queue` bakom Vercels inloggningssida.

---

## Projektstruktur

```
app/
├── (kiosk)/
│   ├── layout.tsx          # Banner visas bara för kiosk-roll
│   └── page.tsx            # Smart root: login | kiosk-vy | redirect /staff
├── (remote)/
│   └── queue/page.tsx      # Publik realtidsvy (ingen inloggning)
├── (staff)/ — saknas, staff ligger direkt under app/
├── staff/
│   └── page.tsx            # Personal-vy
├── admin/
│   ├── page.tsx            # Användarhantering
│   └── UserManagement.tsx
├── actions/
│   ├── auth.ts             # login, logout, skapa/uppdatera användare
│   └── queue.ts            # Köåtgärder (betjäna, ta bort osv)
└── globals.css             # Tailwind + brand guide-färger + .gradient-text

components/
├── AppNav.tsx              # Nav för inloggade vyer
├── KioskQueue.tsx          # Kiosk-vy med realtid + QR
├── StaffQueue.tsx          # Personal-vy med knappar
├── RemoteQueue.tsx         # Publik fjärrvy
├── LoginUI.tsx             # Login-formulär (Suspense-wrappad)
├── MakerspaceBanner.tsx    # Trainstation-banner
├── MachineStatus.tsx       # Maskin-status-grid
├── JoinQueueModal.tsx      # Modal: ställ dig i kön
├── ChangePasswordModal.tsx # Modal: byt lösenord
└── ConfirmDelete.tsx       # Modal: bekräfta radering

lib/
├── auth/session.ts         # JWT-session (jose, httpOnly-cookie)
├── categories.ts           # Kategorier + metadata
├── buttonStyles.ts         # Gemensamma knapp-klasser
└── supabase/
    ├── client.ts           # Anon-klient (browser)
    └── server.ts           # Service role-klient (server)

supabase/migrations/        # SQL-migreringar 001–007
middleware.ts               # Rollbaserad routing + skydd
```

---

## Färgtema (brand guide)

| Token | Värde | Källa |
|-------|-------|-------|
| `bg-main` | `hsl(200, 2%, 21%)` | `--neutral-100` |
| `nav-bg` | `hsl(200, 2%, 12%)` | Nav-separation |
| `card-bg` | `hsl(200, 2%, 30%)` | `--neutral-90` |
| `text-primary` | `hsl(200, 7%, 97%)` | |
| `accent-ink` | `hsl(357, 68%, 18%)` | Trainstation-röd |

Gradient-rubriker använder klassen `.gradient-text` (teal → grön → amber → rosa → lila).
