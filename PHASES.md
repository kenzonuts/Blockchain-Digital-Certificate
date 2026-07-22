# Blockchain Digital Certificate — Implementation Phases

Dokumen ini memecah pembangunan project menjadi phase yang berurutan. Kerjakan satu phase sampai selesai sebelum lanjut ke phase berikutnya.

---

## Phase Overview

| Phase | Nama | Fokus utama | Status |
|-------|------|-------------|--------|
| 0 | Project Setup | Scaffold, tooling, env | Done (Hardhat deferred to Phase 4) |
| 1 | Database & Auth | Schema Prisma, login, session | Done |
| 2 | Template Management | Upload, preview, CRUD template | Done |
| 3 | Certificate & PDF | Create cert, generate PDF, SHA-256 | Done |
| 4 | Smart Contract & Publish | Solidity, Hardhat, publish hash | Pending |
| 5 | Public Verification | Verify page, QR, compare hash | Pending |
| 6 | Dashboard & Polish | Stats, UI, deploy demo | Pending |

---

## Phase 0 — Project Setup

**Goal:** Fondasi repo siap development.

### Deliverables

- [x] Struktur folder (`frontend/`, `backend/`, `contracts/`)
- [x] Next.js + TypeScript + Tailwind (+ utility UI; shadcn penuh opsional)
- [x] Express.js + TypeScript
- [ ] Hardhat project (Solidity)
- [x] PostgreSQL via Supabase + Prisma init
- [x] File `.env.example` (tanpa secret nyata)
- [x] README singkat cara menjalankan lokal

### Stack awal

| Layer | Tech |
|-------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Blockchain | Solidity, Hardhat, Ethers.js |
| PDF / QR / Hash | pdf-lib, qrcode, SHA-256 |

### Done when

Semua service bisa dijalankan lokal (frontend, backend, DB) tanpa error boot.

---

## Phase 1 — Database & Auth

**Goal:** Admin bisa login/logout dan masuk ke area protected.

### Database schema (awal)

**Users**

- id, name, email, password, role, created_at

**Certificate Templates** (siapkan model, CRUD di Phase 2)

- id, template_name, background_image, logo, signature, stamp, status, created_at

**Certificates** (siapkan model, fitur penuh di Phase 3–4)

- id, certificate_id, recipient_name, title, issue_date, issuer, template_id
- pdf_path, certificate_hash, transaction_hash, block_number, blockchain_timestamp, created_at

### Deliverables

- [x] Prisma schema sesuai spek
- [x] Migrasi database (menunggu password Supabase)
- [x] Seed admin user (menunggu password Supabase)
- [x] Endpoint login / logout
- [x] Auth middleware (JWT atau session)
- [x] Halaman Login (frontend)
- [x] Layout Admin (sidebar/nav) + route protection
- [x] Logout

### Pages

- [x] Public: Landing Page (skeleton)
- [x] Auth: Login
- [x] Admin: Dashboard shell (masih kosong/statistik dummy boleh)

### Done when

Admin bisa login → masuk dashboard → logout. User tanpa token tidak bisa akses `/admin/*`.

---

## Phase 2 — Certificate Template Management

**Goal:** Organisasi mengelola template visual sertifikat sendiri (tidak ada desain bawaan).

### Fitur

- [x] Upload Background Template
- [x] Upload Logo
- [x] Upload Signature (optional)
- [x] Upload Company Stamp (optional)
- [x] Preview Template
- [x] Edit Template
- [x] Delete Template
- [x] Set Active Template

### Deliverables

- [x] Storage lokal (atau folder `uploads/`) untuk asset template
- [x] API CRUD templates
- [x] Validasi file (tipe/ukuran image)
- [x] Halaman Template Management
- [x] Form create/edit + preview
- [x] Status active/inactive (hanya satu active, atau flag `is_active`)

### Done when

Admin bisa upload template lengkap, preview, set active, edit, dan hapus.

---

## Phase 3 — Certificate Management & PDF

**Goal:** Sertifikat dibuat, PDF digenerate, hash SHA-256 dihitung, file siap diunduh.

### Input data

- Recipient Name
- Certificate ID
- Certificate Title
- Issue Date
- Issuer Name
- Template

### Fitur

- [x] Create Certificate
- [x] Generate PDF (pdf-lib + template assets)
- [x] Regenerate PDF
- [x] Download PDF
- [x] View Detail
- [x] Generate QR Code (URL only, contoh: `https://yourdomain.com/verify/CERT-2026-00001`)
- [x] Hitung SHA-256 dari file PDF final
- [x] Simpan `pdf_path` + `certificate_hash` ke DB

### Catatan penting

- Hash harus dari **bytes PDF yang tersimpan**, bukan dari objek data mentah.
- Saat regenerate, hash lama diganti; publish ke blockchain dilakukan di Phase 4.
- QR hanya berisi URL verify, bukan seluruh data sertifikat.

### Deliverables

- [x] API create / list / detail / download / regenerate
- [x] Service PDF generation
- [x] Service hashing (SHA-256)
- [x] Service QR (embed di PDF atau simpan terpisah)
- [x] Halaman Certificate List, Create, Detail

### Done when

Admin create certificate → PDF + QR + hash tersimpan → PDF bisa diunduh. Belum perlu on-chain.

---

## Phase 4 — Smart Contract & Publish to Blockchain

**Goal:** Hash sertifikat diterbitkan ke smart contract; metadata tx disimpan di DB.

### Smart Contract

Struktur:

```
certificateId
certificateHash
issuer
issuedAt
```

Fungsi:

- `issueCertificate()`
- `getCertificate()`

### Alur publish

1. Pastikan PDF sudah ada
2. Ambil / hitung SHA-256
3. Kirim hash ke smart contract
4. Simpan Transaction Hash
5. Simpan Block Number
6. Simpan Blockchain Timestamp
7. Tandai sertifikat sebagai published

### Blockchain hanya menyimpan

- Certificate ID
- Certificate Hash
- Issued Timestamp
- Issuer Wallet

**Tidak** menyimpan file PDF.

### Deliverables

- [ ] Contract Solidity + tests Hardhat
- [ ] Deploy script (local + Sepolia)
- [ ] Backend service Ethers.js (issuer wallet di server)
- [ ] Endpoint Publish to Blockchain
- [ ] UI tombol Publish di Certificate Detail
- [ ] Guard: tidak boleh publish ulang ID yang sama
- [ ] Tampilkan tx hash / block number di detail

### Done when

Satu sertifikat bisa di-publish ke chain (local/Sepolia) dan data on-chain + DB konsisten.

---

## Phase 5 — Public Verification

**Goal:** Siapa pun bisa verifikasi keaslian lewat Certificate ID atau QR.

### Alur verifikasi

1. User buka halaman Verify
2. Input Certificate ID atau buka URL dari QR
3. Backend ambil data sertifikat
4. Backend hitung ulang SHA-256 dari PDF tersimpan
5. Backend ambil hash dari blockchain (`getCertificate`)
6. Bandingkan hash (DB PDF vs on-chain)
7. Hasil: **VALID** / **INVALID** (+ alasan singkat jika gagal)

### Deliverables

- [ ] Halaman `/verify` (form input ID)
- [ ] Halaman `/verify/[certificateId]` (dari QR)
- [ ] API verify
- [ ] UI hasil jelas (valid / invalid / not found / not published)
- [ ] Landing page link ke Verify

### Done when

QR / Certificate ID → VALID untuk sertifikat published yang utuh; INVALID jika PDF diubah atau hash tidak cocok.

---

## Phase 6 — Dashboard, Settings & Polish

**Goal:** Produk terasa lengkap untuk demo portfolio.

### Dashboard stats

- [ ] Total Certificates
- [ ] Total Templates
- [ ] Blockchain Transactions (published count)
- [ ] Certificates Verified (opsional: counter log verify)

### Halaman tambahan

- [ ] Settings
- [ ] Profile
- [ ] Landing Page final (modern SaaS, light theme)

### UI style checklist

- Minimalis, professional, clean
- Light theme
- Rounded corners, soft shadow
- Blue accent
- Responsive
- Terinspirasi Vercel / Stripe / Linear

### Deploy & dokumentasi

- [ ] Deploy frontend + backend
- [ ] Contract di Sepolia
- [ ] README: arsitektur, cara verify, link explorer
- [ ] Screenshot / short demo flow

### Done when

Demo end-to-end lancar: login → template → create → publish → verify. README cukup untuk reviewer portfolio.

---

## System Flow (referensi)

### Create Certificate

```
Admin Login
  → Choose Template
  → Input Certificate Data
  → Generate PDF
  → Generate SHA-256
  → Publish to Blockchain
  → Save Transaction Hash
  → Certificate Ready
```

### Verification

```
Open Verify Page
  → Input Certificate ID
  → Retrieve Certificate
  → Calculate SHA-256 (from stored PDF)
  → Retrieve Hash from Blockchain
  → Compare Hash
  → VALID / INVALID
```

---

## Out of Scope (Future Improvements)

Jangan kerjakan di phase di atas kecuali spek berubah:

- Multi Organization / Multi Issuer
- Digital Signature
- Email Certificate Delivery
- Bulk Import (Excel/CSV)
- Certificate Revocation
- Blockchain Explorer Integration (deep)
- Multiple Blockchain Network Support
- IPFS Support

---

## Cara pakai dokumen ini

1. Centang item `[ ]` menjadi `[x]` saat selesai.
- Update kolom **Status** di tabel overview (`Pending` → `In Progress` → `Done`).
3. Satu phase = satu fokus. Hindari loncat ke Phase 4 sebelum Phase 3 stabil.
4. Setelah semua phase Done, project siap sebagai portfolio Full Stack Blockchain Developer.
