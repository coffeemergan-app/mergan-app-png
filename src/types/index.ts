export type UserRole =
  | 'OWNER_HOLDING'
  | 'PURCHASE_HOLDING'
  | 'OWNER_CABANG'
  | 'KEPALA_TOKO'
  | 'PURCHASE_CABANG';

export interface Branch {
  id: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  phone?: string;
  headStore?: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  themeClass: string;
}

export interface BranchTheme {
  branchId: string;
  name: string;
  badgeLabel: string;
  accentHex: string;
  accentText: string;
  accentBg: string;
  accentBgSoft: string;
  accentBorder: string;
  accentRing: string;
  headerGradient: string;
  kpiBorderHover: string;
  cardBg: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  branchId: string; // 'all' for Holding
  passwordHint: string;
  email?: string;
}

export type ShiftType =
  | 'Shift 1 (Pagi 07:00 - 15:00)'
  | 'Shift 2 (Malam 15:00 - 23:00)'
  | 'Full Day (Event / Weekend)';

export interface ShiftRekap {
  id: string;
  branchId: string;
  tanggal: string; // YYYY-MM-DD
  hari: string; // Senin, Selasa, dll
  person: string; // Nama Kasir
  shift: ShiftType;
  cash: number;
  qris: number;
  belanjaKasir: number; // Pengeluaran kasir & belanja harian otomatis terkoneksi (read-only)
  totalNet: number; // cash + qris - belanjaKasir
  catatan?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Beans'
  | 'UHT'
  | 'Freshmilk'
  | 'SKM'
  | 'Syrup'
  | 'Cair'
  | 'Krimer'
  | 'Powder'
  | 'Topping'
  | 'Non Bahan Baku'
  | 'Cleo'
  | 'Cup'
  | 'Operasional Lainnya';

export interface MasterBahanBaku {
  id: string;
  kategori: ExpenseCategory;
  merekBarang: string;
  satuan: string;
  tempatPembelian: string;
  hargaSatuan: number;
}

export interface DailyExpense {
  id: string;
  branchId: string;
  tanggal: string; // YYYY-MM-DD
  shift: ShiftType; // Terhubung langsung dengan shift rekap kasir harian
  rincianBarang: string;
  kategori: ExpenseCategory;
  hargaSatuan: number;
  kuantitas: number;
  satuan: string;
  totalBiaya: number; // hargaSatuan * kuantitas
  personPurchase: string;
  supplier?: string;
  keterangan?: string;
  createdAt: string;
}

export interface BranchOrderItem {
  merekBarang: string;
  kategori: string;
  kuantitas: number;
  satuan: string;
  catatan?: string;
}

export interface BranchOrder {
  id: string;
  nomorOrder: string;
  branchId: string;
  tanggal: string;
  pemohon: string;
  urgensi: 'Biasa' | 'Mendesak / Stok Kritis';
  status: 'MENUNGGU KONFIRMASI' | 'DIPROSES PURCHASE' | 'SELESAI / TERKIRIM';
  items: BranchOrderItem[];
  catatan?: string;
  createdAt: string;
}

export interface BranchBudget {
  branchId: string;
  dailyBudgetLimit: number;
}

export interface SetorTunai3HariRecord {
  id: string; // e.g. `${branchId}-${year}-${month}-${cycleNumber}`
  branchId: string;
  year: number;
  month: number; // 1 - 12
  cycleNumber: number; // 1 to 10
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  labelPeriode: string; // e.g. "01 - 03 Okt 2026"
  totalCash: number;
  totalQris: number;
  totalBelanjaKasir: number;
  totalNet: number; // Total nominal wajib setor tunai (diambil dari net rekap kasir)
  shiftCount: number;
  status: 'BELUM_DISETOR' | 'SUDAH_DISETOR';
  tanggalSetor?: string;
  bankTujuan?: string;
  disetorOleh?: string;
  nomorBukti?: string;
  catatan?: string;
  updatedAt?: string;
}

export type EmployeePosition =
  | 'Kepala Toko'
  | 'Senior Barista'
  | 'Junior Barista'
  | 'Kasir'
  | 'Kitchen / Snack'
  | 'Cleaning & Operasional';

export interface Employee {
  id: string;
  branchId: string;
  nik: string; // e.g. TKM-SBW-001
  nama: string;
  posisi: EmployeePosition;
  phone: string;
  statusKaryawan: 'Tetap' | 'Kontrak' | 'Part Time';
  tanggalBergabung: string;
  gajiPokokPerBulan: number;
  gajiPokok?: number; // convenience alias
  tunjanganHarian: number; // Tunjangan makan/transport per hari hadir
  tarifLemburPerJam: number;
  rekeningBank?: string;
  namaBank?: string;
  isActive?: boolean;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Libur / Off';

export interface AttendanceRecord {
  id: string;
  branchId: string;
  employeeId: string;
  employeeName: string;
  posisi: EmployeePosition;
  tanggal: string; // YYYY-MM-DD
  shift: ShiftType;
  status: AttendanceStatus;
  jamMasuk: string; // e.g. '06:55'
  jamKeluar: string; // e.g. '15:10'
  jamLembur: number; // e.g. 0 or 2
  catatan?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string; // e.g. `${employeeId}-${year}-${month}`
  employeeId: string;
  employeeName: string;
  posisi: EmployeePosition;
  branchId: string;
  periodeBulan: number; // 1 - 12
  periodeTahun: number;
  totalHariKerja: number;
  totalHadir: number;
  totalSakitIzin: number;
  totalAlpa: number;
  totalJamLembur: number;
  gajiPokok: number;
  totalTunjanganHadir: number;
  totalUpahLembur: number;
  bonusKinerja: number;
  potonganKasbon: number;
  potonganAlpa: number;
  gajiBersih: number;
  statusPembayaran: 'DRAF' | 'DISETUJUI' | 'DIBAYAR';
  tanggalDibayar?: string;
  metodePembayaran?: string;
  catatan?: string;
  updatedAt?: string;
}
