# Blockchain Digital Certificate

Full-stack certificate system: hash-only proof on blockchain + modern admin web app.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma |
| Database | **Supabase** (PostgreSQL) |
| Blockchain | Solidity, Hardhat, Ethers.js (Phase 4) |

## Prerequisites

- Node.js 20+
- Akun [Supabase](https://supabase.com) + project baru

## Setup database (Supabase)

1. Buat project di Supabase Dashboard.
2. Buka **Project Settings → Database → Connection string**.
3. Copy:
   - **Transaction pooler** → `DATABASE_URL` (port `6543`, tambahkan `?pgbouncer=true` jika belum ada)
   - **Direct / Session** → `DIRECT_URL` (port `5432`, untuk Prisma migrate)
4. Isi `backend/.env` (lihat `backend/.env.example`).

## Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init_phase1
npm run db:seed
npm run dev
```

API: `http://localhost:4000`

Default admin (dari seed):

- Email: `admin@cert.local`
- Password: `admin123`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

## Phases

Lihat [PHASES.md](./PHASES.md).
