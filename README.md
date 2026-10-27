# SecureBlock Cloud — Encrypted Cloud File Storage & Integrity Verification

> **Academic Project:** Third-Year Computer Engineering Cloud Computing Mini-Project  
> **Architecture:** Pure Client-Side Zero-Knowledge Cloud Console (Frontend-Only)  
> **Cryptographic Primitives:** AES-256-GCM (AEAD), SHA-256, W3C Web Crypto API, IndexedDB Object Vault

---

## 1. Project Overview

**SecureBlock Cloud** is a functional client-side cloud object storage demonstration featuring authenticated encryption at rest, block segmentation, persistent IndexedDB storage, hexadecimal ciphertext inspection, and end-to-end cryptographic integrity verification.

In conventional cloud storage, files are often sent as plaintext over HTTPS to a central server that encrypts them before saving to disk. In contrast, SecureBlock Cloud shifts encryption to the client:
1. The browser reads local file bytes into memory.
2. The pre-encryption SHA-256 hash is computed.
3. The file is encrypted using **AES-256-GCM** with a fresh 96-bit random IV and 128-bit authentication tag.
4. The ciphertext is split into numbered binary blocks (1 KiB, 64 KiB, 1 MiB, or 4 MiB).
5. Individual SHA-256 digests are calculated for every block.
6. Blocks are persisted in IndexedDB under virtual cloud object keys (`vault/{fileId}/blocks/block-0001.enc`).
7. The per-file encryption key is wrapped under a non-extractable browser vault Master Key.
8. File reconstruction validates each block's integrity, unwraps the key, decrypts with AES-256-GCM, and compares the reconstructed SHA-256 hash against the original recorded fingerprint for a real **MATCH / MISMATCH** verdict.

---

## 2. Technology Stack

- **Framework:** React 19 with Vite & TypeScript
- **Styling:** Tailwind CSS with custom dark navy and security-oriented color palette
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Cryptography:** Native W3C Web Crypto API (`crypto.subtle`)
  - AES-256-GCM authenticated encryption/decryption
  - SHA-256 cryptographic digests
  - Cryptographically secure random IV generation (`crypto.getRandomValues`)
  - Master Vault Key generation and key wrapping (`wrapKey` / `unwrapKey`)
- **Persistence:** Browser IndexedDB (`secureblock_cloud_vault_v1`)
  - `files` store: Metadata, original hashes, initialization vectors, wrapped keys
  - `blocks` store: Segmented raw ciphertext `ArrayBuffer` payloads, block digests, object keys
  - `activity` store: Chronological operational and security audit records
  - `settings` store: Vault configuration and block sizing preferences
  - `keys` store: Master Vault CryptoKey

---

## 3. Project Structure

```
SecureBlock Cloud/
├── index.html                   # HTML entry point with Inter & JetBrains Mono fonts
├── package.json                 # Dependencies and scripts (dev, build, test)
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # Vite React TypeScript compiler configuration
├── tailwind.config.js           # Theme styling with navy & security tokens
├── tests/
│   └── crypto-pipeline.test.mjs # 11-step automated acceptance test suite
└── src/
    ├── types/
    │   └── index.ts             # FileRecord, BlockRecord, ActivityRecord, VaultSettings
    ├── services/
    │   ├── crypto.ts            # Web Crypto AES-256-GCM, SHA-256, Key Wrapping, Hex Viewer
    │   ├── db.ts                # IndexedDB stores, transactions, tamper simulator, export/import
    │   └── verification.ts      # Payload reassembly, unwrap/decrypt, SHA-256 comparison
    ├── context/
    │   ├── ToastContext.tsx     # Toast notifications
    │   └── VaultContext.tsx     # Reactive vault state, storage metrics, file operations
    ├── components/
    │   ├── layout/
    │   │   ├── Shell.tsx        # Persistent shell with sidebar and topbar
    │   │   ├── Sidebar.tsx      # Dark navy console sidebar with 8 navigation routes
    │   │   └── Topbar.tsx       # Breadcrumb, Browser Storage Mode badge, architecture modal
    │   ├── common/
    │   │   ├── Badge.tsx        # Status, algorithm, and size badges
    │   │   ├── Button.tsx       # Primary, secondary, outline, danger buttons
    │   │   ├── Card.tsx         # Standardized cloud console cards
    │   │   ├── EmptyState.tsx   # Zero-fake-data empty states
    │   │   ├── Modal.tsx        # Accessible dialog with backdrop blur
    │   │   └── StatCard.tsx     # Real storage metrics cards
    │   └── viewer/
    │       └── HexViewer.tsx    # Raw ciphertext byte viewer with offset, hex & ASCII dump
    ├── pages/
    │   ├── DashboardPage.tsx    # Real storage metrics, recent files, audit trail, quota bar
    │   ├── UploadPage.tsx       # Drag-drop, block size selector, 6-stage live encryption pipeline
    │   ├── BlockExplorerPage.tsx# Block inspection, hex viewer, tamper attack simulator
    │   ├── CloudObjectsPage.tsx # Browser Object Vault S3 console with search & filters
    │   ├── DownloadVerifyPage.tsx# Encrypted payload download (.enc), reconstruction & SHA-256 check
    │   ├── ActivityLogPage.tsx  # Persistent audit log with JSON export and filters
    │   ├── DocumentationPage.tsx# Architecture guide, math behind IV/GCM, comparison matrix
    │   └── SettingsPage.tsx     # Default block size, vault backup export/import, safe purge
    ├── App.tsx                  # Router setup and providers
    ├── main.tsx                 # Application mount
    └── index.css                # Tailwind directives and custom scrollbars
```

---

## 4. How to Run Locally

### Prerequisites
- Node.js (version 18 or higher)
- npm (version 9 or higher)

### Installation
```bash
# Clone or navigate to the directory
cd "SecureBlock Cloud"

# Install dependencies
npm install
```

### Run Development Server
```bash
npm run dev
```
Open your browser and navigate to:
**http://localhost:5173/**

### Run Production Build
```bash
npm run build
```

### Run Cryptographic Acceptance Tests
```bash
npm test
```

---

## 5. Acceptance Verification Checklist

- [x] Clean installation opens with an empty dashboard (0 files, 0 blocks, 0 B usage).
- [x] Zero sample data or fake records inserted.
- [x] Real uploaded files are encrypted using Web Crypto API (`AES-256-GCM`).
- [x] Encrypted payloads segmented into selectable block sizes (1 KiB, 64 KiB, 1 MiB, 4 MiB).
- [x] Refreshing the browser preserves uploaded files and blocks in IndexedDB.
- [x] Raw ciphertext inspected with offset, hex bytes, and ASCII translation in Block Explorer.
- [x] Raw encrypted binary payload can be downloaded as `.enc`.
- [x] Original file can be reconstructed, decrypted, and downloaded.
- [x] SHA-256 hash calculated on reconstructed file and compared with original (real MATCH).
- [x] "Simulate Block Tamper" test in Block Explorer alters a byte, triggering real AES-GCM authentication failure / MISMATCH in Download & Verify.
- [x] File deletion purges metadata and all segmented blocks in an atomic transaction.
- [x] Browser storage mode clearly marked with zero false claims of connecting to AWS S3.
- [x] Production build passes cleanly with zero TypeScript errors.
