# Blockchain Digital Certificate

Full-stack certificate system: hash-only proof on blockchain + modern admin web app.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma |
| Database | **Supabase** (PostgreSQL) |
| Blockchain | Solidity, Hardhat, Ethers.js |

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

## Smart contract (local)

Terminal 1 — Hardhat node:

```bash
cd contracts
npm install
npx hardhat node
```

Terminal 2 — deploy:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Copy `CERTIFICATE_REGISTRY_ADDRESS` ke `backend/.env`, bersama:

```env
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```

(Private key di atas adalah Hardhat account #0 — **hanya untuk local**.)

Sepolia: set `SEPOLIA_RPC_URL` + `DEPLOYER_PRIVATE_KEY` di `contracts/.env`, lalu:

```bash
npm run deploy:sepolia
```

## Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

API: `http://localhost:4000`

Default admin:

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
