# Kö-app – Makerspace Queue PWA

Ett realtids-kösystem byggt för Trainstation Makerspace. Medlemmar ställer sig i kön via en QR-scan eller manuellt ID, och personalen kan administrera kön direkt i appen.

---

## Funktioner

- **Realtidskö** – listan uppdateras automatiskt för alla inloggade via Supabase Realtime
- **Gå med i kön** – tryck på **+** för att öppna formuläret som modal, välj kategori och ange eller skanna ditt medlems-ID
- **QR-skanning** – använder kameran för att läsa av QR-koder (html5-qrcode)
- **Admin-radering** – varje köpost har en soptunna-knapp som kräver adminlösenord eller en admin-QR för att bekräftas
- **PWA-redo** – fungerar på mobil och surfplatta, hanterar safe-area-insets

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
| QR-skanning | html5-qrcode |
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

Kopiera exempelfilen och fyll i dina värden:

```bash
cp .env.local.example .env.local
```

| Variabel | Var hittar du den |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (secret) |
| `ADMIN_SECRET` | Valfri sträng du väljer själv – används som adminlösenord |

### 3. Databas

Kör migreringarna mot ditt Supabase-projekt:

```bash
# Via Supabase CLI
supabase db push

# Eller kör SQL-filerna manuellt i Supabase SQL-editorn:
# supabase/migrations/001_initial.sql
# supabase/migrations/002_queue_user_id_text.sql
```

### 4. Starta

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

---

## Deploy till Vercel

Projektet är konfigurerat för Vercel. Lägg till miljövariablerna under **Project Settings → Environment Variables** i Vercel-dashboarden och trigga en ny deploy.

---

## Projektstruktur

```
├── app/
│   ├── actions/queue.ts      # Server action: radera köpost (jämför ADMIN_SECRET)
│   ├── globals.css           # Tailwind-direktiv + CSS-variabler
│   ├── layout.tsx            # Root layout med Ubuntu-font och banner
│   └── page.tsx              # Startsida → renderar QueuePage
├── components/
│   ├── AdminAuth.tsx         # Modal: adminlösenord eller QR-skanning
│   ├── JoinQueueModal.tsx    # Modal: gå med i kö
│   ├── MakerspaceBanner.tsx  # Trainstation-banner längst upp
│   └── QueuePage.tsx         # Huvudvy: realtidslista + knapplogik
├── lib/supabase/client.ts    # Supabase-klient (anon-nyckel)
├── public/
│   ├── trainstation-logo.svg
│   └── trainstationbannerback.png
└── supabase/migrations/      # SQL-migreringar
```

---

## Färgtema

| Token | Värde |
|-------|-------|
| `bg-main` | `hsl(200, 2%, 9%)` |
| `card-bg` | `hsl(200, 2%, 21%)` |
| `text-primary` | `hsl(200, 7%, 97%)` |
| `accent-ink` | `hsl(357, 68%, 18%)` |
