# Blockchain Digital Certificate

Full-stack certificate system: **hash-only proof on blockchain** + modern admin web app.

Issue branded PDFs, store only SHA-256 on an EVM smart contract, and let anyone verify authenticity via Certificate ID or QR.

## Architecture

```
Frontend (Next.js)
  → Express API (auth, templates, certificates, verify)
  → PostgreSQL (Supabase) via Prisma
  → Local PDF storage (uploads/)
  → Smart contract CertificateRegistry (Hardhat / Sepolia)
```

**On-chain:** `certificateId`, `certificateHash`, `issuer`, `issuedAt`  
**Off-chain:** PDF file, template assets, admin users

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma |
| Database | Supabase (PostgreSQL) |
| Blockchain | Solidity, Hardhat, Ethers.js, OpenZeppelin |
| PDF / QR / Hash | pdf-lib, qrcode, SHA-256 |

## Demo flow

1. Admin login → upload template  
2. Create certificate → PDF + QR + SHA-256  
3. Publish hash to smart contract  
4. Open `/verify/{certificateId}` (or scan QR) → **VALID**  

Tamper the PDF → verification becomes **INVALID**.

## Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL)
- For local chain: Hardhat node

## Setup database (Supabase)

1. Create a Supabase project.
2. Copy connection strings into `backend/.env`:
   - **Transaction pooler** → `DATABASE_URL` (port `6543`, `?pgbouncer=true`)
   - **Direct / Session** → `DIRECT_URL` (port `5432`)

See `backend/.env.example`.

## Smart contract (local)

Terminal 1:

```bash
cd contracts
npm install
npx hardhat node
```

Terminal 2:

```bash
cd contracts
npx hardhat test
npx hardhat run scripts/deploy.ts --network localhost
```

Put the printed address into `backend/.env`:

```env
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_PRIVATE_KEY="<Account #0 private key from hardhat node output>"
CERTIFICATE_REGISTRY_ADDRESS="<deployed-address>"
```

Use Hardhat Account #0 **only for local development**. Never commit real private keys.

### Sepolia (optional)

1. Set `SEPOLIA_RPC_URL` + `DEPLOYER_PRIVATE_KEY` in `contracts/.env`  
2. `npm run deploy:sepolia`  
3. Update backend env with Sepolia RPC, the same funded key, and registry address  
4. Restart API  

Explorer: paste `transactionHash` into [https://sepolia.etherscan.io](https://sepolia.etherscan.io)

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

Public verify: `http://localhost:3000/verify`

## Key API routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | No | Admin login |
| CRUD | `/api/templates` | Yes | Template assets |
| CRUD | `/api/certificates` | Yes | Issue / download / regenerate |
| POST | `/api/certificates/:id/publish` | Yes | Write hash on-chain |
| GET | `/api/verify/:certificateId` | No | Public authenticity check |

## Phases

All core phases (0–6) are implemented. See [PHASES.md](./PHASES.md).

## Notes for reviewers

- PDFs are **not** stored on-chain — only SHA-256.  
- Verification always re-hashes the stored PDF file, then compares with `getCertificate()` on-chain.  
- After publish, PDF regenerate is locked so the hash stays stable.
