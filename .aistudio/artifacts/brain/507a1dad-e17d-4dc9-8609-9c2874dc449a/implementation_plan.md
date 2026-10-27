# TOKO KOPI MERGAN — Sistem Rekap Keuangan Kasir & Operasional Multi-Cabang

Aplikasi manajemen operasional dan rekapitulasi keuangan kasir harian terintegrasi untuk jaringan **Toko Kopi Mergan**, mendukung multi-cabang (4 outlet), manajemen pengeluaran belanja harian dengan notifikasi over-budget, ekspor laporan otomatis bulanan ke PDF & Excel, inventaris pergerakan stok, serta otentikasi multi-user Role-Based Access Control (RBAC).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Terkonfirmasi dari Tanya Jawab:**
> - **Cabang ke-4**: Dilengkapi 4 cabang operasional lengkap:
>   1. *Pusat Cabang Ponorogo Sumbawa*
>   2. *Cabang Ponorogo Urip Sumoharjo*
>   3. *Cabang Madiun*
>   4. *Cabang Ponorogo Soekarno Hatta*
> - **Sistem Login**: Form login manual yang bersih, aman, dan profesional dengan kartu panduan kredensial akun untuk setiap tingkatan hak akses (Holding & Cabang).
> - **Tema Visual Dashboard**: Desain monokrom minimalis modern dengan aksen warna solid yang khas dan berbeda untuk setiap cabang/holding (Obsidian-Emerald, Slate-Amber, Charcoal-Indigo, Neutral-Crimson, dan Platinum-Holding).

---

### 1. Overview & Core Concept

- **Tujuan Aplikasi**: Menyederhanakan pencatatan kasir tiap pergantian shift (pagi/malam), mengontrol arus belanja harian, memantau batas anggaran pengeluaran secara real-time, mengelola stok bahan baku kopi & kemasan, serta memberikan laporan konsolidasi holding yang transparan.
- **Pengguna & Hak Akses (RBAC)**:
  1. `OWNER HOLDING`: Akses menyeluruh (full access) semua cabang secara read-only tanpa hak merubah/menghapus catatan transaksi (audit proof).
  2. `PURCHASE HOLDING`: Rekapitulasi belanja seluruh cabang, evaluasi harga supplier, dan notifikasi kebutuhan order barang/restock lintas cabang.
  3. `OWNER CABANG`: Memantau ringkasan performa penjualan harian/bulanan, omzet, dan pengeluaran cabangnya sendiri.
  4. `KEPALA TOKO CABANG`: Membuka shift, menginput data rekap kasir harian (Hari/Tanggal, Person/Kasir, Shift, Cash, QRIS, Belanja Kasir, Total).
  5. `PURCHASE CABANG`: Menginput rincian form belanja harian (Barang, Satuan, Kuantitas, Harga, Kategori Biaya Operasional) dengan validasi anggaran harian.
  6. `MANAJER STOK`: Mengelola data master barang, stok minimum, pencatatan mutasi barang masuk/keluar, dan audit sisa stok harian.

---

### 2. User Experience & Visual Design

- **Desain Monokrom Minimalis & Aksen Solid Tiap Cabang**:
  - **Pusat Ponorogo Sumbawa**: Monokrom Obsidian dengan Aksen Solid Emerald (`#10B981`)
  - **Ponorogo Urip Sumoharjo**: Monokrom Slate dengan Aksen Solid Amber Gold (`#F59E0B`)
  - **Cabang Madiun**: Monokrom Charcoal dengan Aksen Solid Cobalt Indigo (`#6366F1`)
  - **Ponorogo Soekarno Hatta**: Monokrom Neutral dengan Aksen Solid Crimson Rose (`#F43F5E`)
  - **Holding Executive View**: Dark Platinum Titanium dengan Aksen Modern Minimalist (`#0F172A` / `#64748B`)
- **Key Flows**:
  1. **Login Flow**: Input username & password dengan proteksi sesi token, validasi peran, dan pengarahan langsung ke dashboard sesuai izin akses.
  2. **Form Rekap Kasir Shift**: Antarmuka ringkas input Hari & Tanggal, Kasir/Person, Shift (Pagi / Siang / Malam), Pemasukan Cash, QRIS, Pengeluaran Kasir Kecil, otomatis kalkulasi Net Total omzet shift.
  3. **Form Belanja & Operasional Harian**: Input multi-item dengan kalkulasi subtotal instan, pengecekan batas anggaran harian (Budget Limit Alert System).
  4. **Export Engine**: Satu klik untuk mengunduh laporan bulanan format **PDF** (terformat rapi dengan kop Toko Kopi Mergan) dan format **Excel (XLSX)**.
  5. **Manajemen Stok Real-Time**: Kartu stok bahan (Kopi Espresso Blend, Susu UHT, Sirup, Gula Aren, Cup 16oz/12oz, dll.), mutasi harian, dan notifikasi stok menipis.

---

### 3. Key Product Decisions & Trade-Offs

- **Struktur Data Dokumen & Express API Server**:
  - *Pendekatan*: Express backend API di `./server.ts` dengan penyimpanan dokumen JSON/Mongo-compatible yang persisten di disk dan memori, disinkronkan melalui endpoint RESTful (`/api/rekap`, `/api/belanja`, `/api/stok`, `/api/budget`, `/api/auth`).
  - *Alasan*: Kompatibel penuh dengan spesifikasi MERN stack, cepat, stabil, tanpa dependensi eksternal yang rentan putus koneksi di sandbox runtime.
- **Ekspor Dokumen Client-Side Berstandar Tinggi**:
  - *Pendekatan*: Menggunakan `jspdf` + `jspdf-autotable` untuk dokumen PDF resmi Toko Kopi Mergan, dan library `xlsx` untuk spreadsheet data Excel multi-kolom yang rapi.
  - *Alasan*: Menjamin export instan langsung dari browser tanpa latensi server, bekerja sempurna bahkan dalam kondisi koneksi lambat.
- **Sistem Notifikasi Anggaran Dinamis**:
  - Batas anggaran harian dapat disetel per cabang (misal: Rp 1.500.000/hari).
  - Ketika total belanja harian mencapai 85% atau melampaui 100%, sistem menampilkan badge peringatan visual dan banner peringatan pengeluaran berlebih.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TOKO KOPI MERGAN — Web Application                   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌──────────────────────────────┐        ┌───────────────────────────────┐
│     Client (React + TS)      │        │      Express Backend API      │
│  - Tailwind CSS Styling      │◄──────►│  - Auth & Role Verification   │
│  - State Management          │  HTTP  │  - JSON Doc Database (Mongo-  │
│  - PDF/Excel Generators      │  REST  │    like collections store)    │
│  - Branch Theme Switching    │        │  - Budget Alert Engine        │
└──────────────────────────────┘        └───────────────────────────────┘
       │                                                        │
       ├─► Views:                                               ├─► Collections:
       │    ├─ RekapKasirView (Shift Recaps)                    │    ├─ users
       │    ├─ BelanjaHarianView (Procurement & Expense)        │    ├─ shifts_rekap
       │    ├─ StokInventarisView (Stock & Movement)            │    ├─ daily_expenses
       │    ├─ HoldingDashboardView (Cross-branch KPIs)         │    ├─ inventory_items
       │    └─ LaporanExportModal (PDF / Excel Bulanan)         │    └─ branch_budgets
```

#### Komponen Entitas Data Utama:
- **ShiftRekap**: `id`, `branchId`, `tanggal`, `hari`, `person`, `shift`, `cash`, `qris`, `belanjaKasir`, `totalNet`, `catatan`, `createdAt`.
- **DailyExpense**: `id`, `branchId`, `tanggal`, `rincianBarang`, `kategori`, `hargaSatuan`, `kuantitas`, `satuan`, `totalBiaya`, `personPurchase`, `supplier`, `createdAt`.
- **InventoryItem**: `id`, `branchId`, `namaBarang`, `kategori`, `stokSaatIni`, `satuan`, `stokMin`, `hargaPerUnit`, `updatedAt`.
- **StockMovement**: `id`, `itemId`, `branchId`, `tanggal`, `tipe` (MASUK/KELUAR), `jumlah`, `keterangan`.
- **BranchBudget**: `branchId`, `dailyLimit`, `currentSpent`, `isOverBudget`.

---

### 5. Rencana Langkah Implementasi

1. **Instalasi Paket Dependensi**: Menginstal `jspdf`, `jspdf-autotable`, `xlsx`, serta dependensi pendukung untuk render PDF dan Excel.
2. **Setup Backend Data Store & Express Proxy**: Menyiapkan API endpoint untuk otentikasi peran, rekap kasir, belanja harian, inventaris stok, dan limit anggaran dengan seed data awal 4 cabang Toko Kopi Mergan.
3. **Konfigurasi Tema Visual Monokrom Aksen Cabang**: Membangun context tema dinamis yang merespons cabang aktif dengan aksen visual yang konsisten dan kontras tinggi.
4. **Implementasi UI Modul Lengkap**:
   - Sistem Login Multi-Role & Switcher akun info.
   - Form Rekap Kasir Praktis (Hari/Tanggal, Person, Shift, Cash, QRIS, Belanja, Total).
   - Form Belanja Harian (Rincian barang, harga, kuantitas, total biaya, notifikasi over-budget).
   - Modul Ekspor Laporan Bulanan (PDF format resmi & Excel spreadsheet).
   - Modul Manajemen & Pemantauan Pergerakan Stok Harian.
   - Dashboard Khusus Owner Holding & Purchase Holding (Semua Cabang).
5. **Verifikasi & Build Test**: Memastikan kompilasi bersih bebas error TypeScript dan performa responsif di semua resolusi layar (desktop & mobile outlet).
