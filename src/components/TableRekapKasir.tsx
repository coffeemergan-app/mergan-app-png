import React, { useState } from 'react';
import { ShiftRekap, BranchTheme, User, SetorTunai3HariRecord } from '../types';
import { formatRupiah, formatTanggalShort } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { exportSingleTableRekapKasirToPDF } from '../utils/exportReport';
import { SetorTunaiSlipModal } from './SetorTunaiSlipModal';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Check,
  X,
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface TableRekapKasirProps {
  shifts: ShiftRekap[];
  theme: BranchTheme;
  currentUser: User | null;
  branchNameMap: Record<string, string>;
  isHoldingView?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const TableRekapKasir: React.FC<TableRekapKasirProps> = ({
  shifts,
  theme,
  currentUser,
  branchNameMap,
  isHoldingView = false,
}) => {
  // Main view toggle: 'SHIFTS' or 'SETOR_TUNAI'
  const [activeSubTab, setActiveSubTab] = useState<'SHIFTS' | 'SETOR_TUNAI'>('SHIFTS');

  // Filter state for Shift Rekap
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '1'..'12'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState('');

  // Filter state for 3-Day Cash Deposit Report
  const [depositMonth, setDepositMonth] = useState<number>(10); // default to October
  const [depositYear, setDepositYear] = useState<number>(2026);
  const [depositStatusFilter, setDepositStatusFilter] = useState<'ALL' | 'SUDAH_DISETOR' | 'BELUM_DISETOR'>('ALL');

  // Editing Shift State
  const [editingShift, setEditingShift] = useState<ShiftRekap | null>(null);

  // Setor Tunai Modal States
  const [editingDepositRecord, setEditingDepositRecord] = useState<SetorTunai3HariRecord | null>(null);
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<SetorTunai3HariRecord | null>(null);

  // Permission: Owner Holding, Owner Cabang, and Purchase Holding are Read-Only. Only Kepala Toko can edit/delete
  const canEditOrDelete = currentUser?.role === 'KEPALA_TOKO';

  // 1. Filtered Daily Shifts
  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      s.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.catatan && s.catatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (branchNameMap[s.branchId] && branchNameMap[s.branchId].toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift =
      selectedShiftFilter === 'ALL' ||
      (selectedShiftFilter === 'S1' && s.shift.includes('Shift 1')) ||
      (selectedShiftFilter === 'S2' && s.shift.includes('Shift 2')) ||
      (selectedShiftFilter === 'FULL' && s.shift.includes('Full Day'));

    const d = new Date(s.tanggal);
    const matchesMonth = selectedMonth === 'ALL' || d.getMonth() + 1 === Number(selectedMonth);
    const matchesYear = !selectedYear || d.getFullYear() === selectedYear;
    const matchesSpecificDate = !dateFilter || s.tanggal === dateFilter;

    return matchesSearch && matchesShift && matchesMonth && matchesYear && matchesSpecificDate;
  });

  const totalCash = filteredShifts.reduce((acc, curr) => acc + curr.cash, 0);
  const totalQris = filteredShifts.reduce((acc, curr) => acc + curr.qris, 0);
  const totalBelanja = filteredShifts.reduce((acc, curr) => acc + curr.belanjaKasir, 0);
  const totalNet = filteredShifts.reduce((acc, curr) => acc + curr.totalNet, 0);

  // 2. Compute 3-Day Cash Deposit Cycles from total net rekap kasir
  const activeBranchTarget = theme.branchId || 'pusat-sumbawa';
  const rawDepositCycles = StorageService.get3DayCashDepositCycles(
    activeBranchTarget,
    depositYear,
    depositMonth
  );

  const filteredDepositCycles = rawDepositCycles.filter((c) => {
    if (depositStatusFilter === 'ALL') return true;
    return c.status === depositStatusFilter;
  });

  const totalWajibSetorBulan = rawDepositCycles.reduce((acc, c) => acc + c.totalNet, 0);
  const totalSudahDisetorBulan = rawDepositCycles
    .filter((c) => c.status === 'SUDAH_DISETOR')
    .reduce((acc, c) => acc + c.totalNet, 0);
  const totalSisaBelumDisetorBulan = rawDepositCycles
    .filter((c) => c.status === 'BELUM_DISETOR')
    .reduce((acc, c) => acc + c.totalNet, 0);
  const completedCyclesCount = rawDepositCycles.filter((c) => c.status === 'SUDAH_DISETOR').length;

  const handleDelete = (id: string, person: string) => {
    if (!canEditOrDelete) {
      alert('Hak akses Anda terbatas. Hanya Kepala Toko dan Tim Holding yang berwenang menghapus data transaksi.');
      return;
    }
    if (confirm(`Hapus catatan rekap kasir oleh ${person}? Tindakan ini tidak dapat dibatalkan.`)) {
      const res = StorageService.deleteShift(id, currentUser);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    const res = StorageService.updateShift(editingShift, currentUser);
    if (res.success) {
      setEditingShift(null);
    } else {
      alert(res.message || 'Gagal menyimpan perubahan');
    }
  };

  const handleSaveDepositUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepositRecord) return;

    StorageService.saveSetorTunaiRecord(editingDepositRecord);
    setEditingDepositRecord(null);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Sub-view Switch: Daily Shift Records vs 3-Day Deposit Report */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('SHIFTS')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'SHIFTS'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Riwayat Shift Kasir (Harian)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
              {shifts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('SETOR_TUNAI')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'SETOR_TUNAI'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Laporan Setor Tunai 3-Harian</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
              Trihari (Awal - Akhir Bulan)
            </span>
          </button>
        </div>

        <div className="text-right hidden sm:block pr-2">
          <span className="text-[11px] text-neutral-500 font-medium">
            Outlet:{' '}
            <strong className="text-neutral-800 dark:text-neutral-200">
              {branchNameMap[activeBranchTarget] || 'Semua Cabang'}
            </strong>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW A: LAPORAN SETOR TUNAI SETIAP 3 HARI (TRIHARI)            */}
      {/* ============================================================== */}
      {activeSubTab === 'SETOR_TUNAI' && (
        <div className="space-y-4">
          {/* Hero Explainer & Month/Year Selectors */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-neutral-800 dark:text-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-neutral-950 font-mono">
                  Siklus 3 Hari (Trihari)
                </span>
                <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Laporan Setor Tunai Kasir ke Rekening Holding
                </h3>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
                Nominal setor tunai diambil otomatis dari <strong>Total Net Rekap Kasir</strong> (Cash + QRIS - Belanja) setiap 3 hari mulai tanggal 1 sampai akhir bulan.
              </p>
            </div>

            {/* Filter Periode Bulan & Tahun */}
            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-0.5">
                  Bulan
                </label>
                <select
                  value={depositMonth}
                  onChange={(e) => setDepositMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-0.5">
                  Tahun
                </label>
                <select
                  value={depositYear}
                  onChange={(e) => setDepositYear(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium cursor-pointer"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-0.5">
                  Status
                </label>
                <select
                  value={depositStatusFilter}
                  onChange={(e) => setDepositStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUDAH_DISETOR">Sudah Disetor</option>
                  <option value="BELUM_DISETOR">Belum Disetor</option>
                </select>
              </div>
            </div>
          </div>

          {/* KPI Cards Strip for 3-Day Deposits */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Total Net Wajib Setor
              </span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {formatRupiah(totalWajibSetorBulan)}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Bulan {MONTH_NAMES[depositMonth - 1]} {depositYear}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block font-mono">
                Sudah Disetor ke Holding
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                {formatRupiah(totalSudahDisetorBulan)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-0.5">
                {completedCyclesCount} dari 10 Siklus Tuntas
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block font-mono">
                Sisa Belum Disetor
              </span>
              <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
                {formatRupiah(totalSisaBelumDisetorBulan)}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">
                {10 - completedCyclesCount} Siklus Menunggu / Berjalan
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Rekening Holding Penerima
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">
                BCA: 822-091-2331
              </span>
              <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">
                a.n Toko Kopi Mergan Pusat
              </span>
            </div>
          </div>

          {/* 3-Day Cash Deposit Cycles Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-neutral-900 dark:text-neutral-100">
                  Daftar 10 Siklus Setor Tunai Trihari ({MONTH_NAMES[depositMonth - 1]} {depositYear})
                </h4>
              </div>
              <span className="text-[11px] text-neutral-500">
                1 Bulan = 10 Interval Setoran (1-3 s/d 28-Akhir Bulan)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">Siklus</th>
                    <th className="px-3.5 py-3">Rentang Periode (3 Hari)</th>
                    {isHoldingView && <th className="px-3.5 py-3">Cabang</th>}
                    <th className="px-3.5 py-3 text-center">Shift Terdata</th>
                    <th className="px-3.5 py-3 text-right">Cash (Fisik)</th>
                    <th className="px-3.5 py-3 text-right">QRIS</th>
                    <th className="px-3.5 py-3 text-right">Belanja Kasir</th>
                    <th className="px-3.5 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                      Total Net Setor
                    </th>
                    <th className="px-3.5 py-3 text-center">Status Setor</th>
                    <th className="px-3.5 py-3">Bukti & Tgl Setor</th>
                    <th className="px-3.5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredDepositCycles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isHoldingView ? 11 : 10}
                        className="px-4 py-8 text-center text-neutral-400"
                      >
                        Tidak ada siklus setoran yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDepositCycles.map((cycle) => {
                      const isDeposited = cycle.status === 'SUDAH_DISETOR';
                      return (
                        <tr
                          key={cycle.id}
                          className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="px-3.5 py-3 text-center font-mono font-bold text-neutral-600 dark:text-neutral-400">
                            #{cycle.cycleNumber}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                            <span>{cycle.labelPeriode}</span>
                            <span className="block text-[10px] text-neutral-400 font-mono">
                              {cycle.startDate} s/d {cycle.endDate}
                            </span>
                          </td>
                          {isHoldingView && (
                            <td className="px-3.5 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                              {branchNameMap[cycle.branchId] || cycle.branchId}
                            </td>
                          )}
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {cycle.shiftCount} Shift
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                            {formatRupiah(cycle.totalCash)}
                          </td>
                          <td className="px-3.5 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                            {formatRupiah(cycle.totalQris)}
                          </td>
                          <td className="px-3.5 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
                            - {formatRupiah(cycle.totalBelanjaKasir)}
                          </td>
                          <td className="px-3.5 py-3 text-right tabular-nums font-black text-amber-600 dark:text-amber-400 text-sm">
                            {formatRupiah(cycle.totalNet)}
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isDeposited
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {isDeposited ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>SUDAH DISETOR</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>BELUM DISETOR</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-[11px] text-neutral-600 dark:text-neutral-400">
                            {isDeposited ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                                  Tgl: {cycle.tanggalSetor ? formatTanggalShort(cycle.tanggalSetor) : '-'}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500 block">
                                  {cycle.nomorBukti || 'Slip CDM/Teller'} · {cycle.disetorOleh || 'Kepala Toko'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic">Belum dikonfirmasi</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit / Konfirmasi Setor Tunai */}
                              <button
                                type="button"
                                onClick={() => setEditingDepositRecord({ ...cycle })}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer flex items-center gap-1 transition-colors"
                                title="Catat / Update Konfirmasi Setor Tunai"
                              >
                                <Edit2 className="w-3 h-3 text-amber-500" />
                                <span>{isDeposited ? 'Update' : 'Konfirmasi'}</span>
                              </button>

                              {/* Cetak Slip Setoran 3-Hari */}
                              <button
                                type="button"
                                onClick={() => setSelectedSlipRecord(cycle)}
                                className="p-1 rounded-md text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition-colors"
                                title="Cetak Slip Bukti Setoran Tunai"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: RIWAYAT SHIFT KASIR (HARIAN)                           */}
      {/* ============================================================== */}
      {activeSubTab === 'SHIFTS' && (
        <div className="space-y-4">
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Total Cash (Fisik)
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {formatRupiah(totalCash)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Total QRIS
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {formatRupiah(totalQris)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block font-mono">
                Belanja Kasir Terhubung
              </span>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1 block">
                {formatRupiah(totalBelanja)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block font-mono">
                Total Net Kasir
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                {formatRupiah(totalNet)}
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari kasir / catatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                >
                </input>
              </div>

              {/* Shift Filter */}
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Shift</option>
                <option value="S1">Shift 1 (Pagi)</option>
                <option value="S2">Shift 2 (Malam)</option>
                <option value="FULL">Full Day</option>
              </select>

              {/* Month Filter */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Bulan</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={String(idx + 1)}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {/* Specific Date Filter */}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Reset tanggal spesifik"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                {filteredShifts.length} Shift Tercatat
              </span>
              <button
                type="button"
                onClick={() => {
                  const branchLabel = isHoldingView
                    ? 'Holding Konsolidasi 3 Cabang'
                    : branchNameMap[theme.branchId || ''] || theme.name;
                  const periodLabel = selectedMonth !== 'ALL'
                    ? `${MONTH_NAMES[Number(selectedMonth) - 1]} ${selectedYear}`
                    : `Tahun ${selectedYear}`;
                  exportSingleTableRekapKasirToPDF({
                    shifts: filteredShifts,
                    branchName: branchLabel,
                    filterTitle: periodLabel,
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
                title="Download PDF Tabel Rekap Kasir"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Download PDF Rekap</span>
              </button>
            </div>
          </div>

          {/* Edit Shift Modal */}
          {editingShift && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                    Edit Rekap Shift Kasir
                  </h4>
                  <button
                    onClick={() => setEditingShift(null)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-500 mb-1 font-semibold">TANGGAL</label>
                    <input
                      type="date"
                      value={editingShift.tanggal}
                      onChange={(e) => setEditingShift({ ...editingShift, tanggal: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1 font-semibold">KASIR / PERSON</label>
                    <input
                      type="text"
                      value={editingShift.person}
                      onChange={(e) => setEditingShift({ ...editingShift, person: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-500 mb-1 font-semibold">CASH (FISIK)</label>
                      <input
                        type="number"
                        value={editingShift.cash}
                        onChange={(e) => setEditingShift({ ...editingShift, cash: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-500 mb-1 font-semibold">QRIS</label>
                      <input
                        type="number"
                        value={editingShift.qris}
                        onChange={(e) => setEditingShift({ ...editingShift, qris: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-[11px] flex justify-between">
                    <span className="text-neutral-500">Belanja Kasir Terkoneksi:</span>
                    <strong className="text-rose-600">{formatRupiah(editingShift.belanjaKasir)}</strong>
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1 font-semibold">CATATAN</label>
                    <input
                      type="text"
                      value={editingShift.catatan || ''}
                      onChange={(e) => setEditingShift({ ...editingShift, catatan: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Shifts Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Tanggal / Hari</th>
                    {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                    <th className="px-4 py-3">Kasir / Person</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3 text-right">Cash (Fisik)</th>
                    <th className="px-4 py-3 text-right">QRIS</th>
                    <th className="px-4 py-3 text-right">Belanja Kasir</th>
                    <th className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                      Total Net
                    </th>
                    <th className="px-4 py-3">Catatan</th>
                    {canEditOrDelete && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isHoldingView ? (canEditOrDelete ? 10 : 9) : canEditOrDelete ? 9 : 8}
                        className="px-4 py-8 text-center text-neutral-400"
                      >
                        Tidak ada catatan rekap kasir yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                            {formatTanggalShort(s.tanggal)}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">{s.hari}</span>
                        </td>
                        {isHoldingView && (
                          <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                            {branchNameMap[s.branchId] || s.branchId}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-800 dark:text-neutral-200">
                          {s.person}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium">
                            {s.shift.replace('Shift ', 'S').split(' (')[0]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-neutral-800 dark:text-neutral-200">
                          {formatRupiah(s.cash)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-neutral-800 dark:text-neutral-200">
                          {formatRupiah(s.qris)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-rose-600 dark:text-rose-400">
                          {formatRupiah(s.belanjaKasir)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(s.totalNet)}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-neutral-500" title={s.catatan}>
                          {s.catatan || '-'}
                        </td>
                        {canEditOrDelete && (
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingShift({ ...s })}
                                className="p-1 rounded text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                title="Edit data rekap shift"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id, s.person)}
                                className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Hapus data ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KONFIRMASI & CATAT SETOR TUNAI 3-HARI                   */}
      {/* ============================================================== */}
      {editingDepositRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 max-w-lg w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                  Konfirmasi Setor Tunai Trihari #{editingDepositRecord.cycleNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingDepositRecord(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Nominal Net Display */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase font-mono block">
                  Periode Setoran ({editingDepositRecord.labelPeriode})
                </span>
                <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {formatRupiah(editingDepositRecord.totalNet)}
                </div>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {editingDepositRecord.shiftCount} Shift Terdata
              </span>
            </div>

            <form onSubmit={handleSaveDepositUpdate} className="space-y-3.5 text-xs">
              {/* Status Setor Radio */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1.5 font-bold uppercase tracking-wider font-mono">
                  STATUS SETORAN TUNAI
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      editingDepositRecord.status === 'SUDAH_DISETOR'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deposit_status"
                      value="SUDAH_DISETOR"
                      checked={editingDepositRecord.status === 'SUDAH_DISETOR'}
                      onChange={() =>
                        setEditingDepositRecord({
                          ...editingDepositRecord,
                          status: 'SUDAH_DISETOR',
                          tanggalSetor: editingDepositRecord.tanggalSetor || new Date().toISOString().split('T')[0],
                        })
                      }
                      className="sr-only"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sudah Disetor ke Holding</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      editingDepositRecord.status === 'BELUM_DISETOR'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deposit_status"
                      value="BELUM_DISETOR"
                      checked={editingDepositRecord.status === 'BELUM_DISETOR'}
                      onChange={() =>
                        setEditingDepositRecord({
                          ...editingDepositRecord,
                          status: 'BELUM_DISETOR',
                        })
                      }
                      className="sr-only"
                    />
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Belum / Menunggu Setoran</span>
                  </label>
                </div>
              </div>

              {/* Tanggal Setor & Disetor Oleh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    TANGGAL DISETOR
                  </label>
                  <input
                    type="date"
                    value={editingDepositRecord.tanggalSetor || ''}
                    onChange={(e) =>
                      setEditingDepositRecord({ ...editingDepositRecord, tanggalSetor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    PETUGAS PENYETOR
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Kepala Toko / Kasir"
                    value={editingDepositRecord.disetorOleh || ''}
                    onChange={(e) =>
                      setEditingDepositRecord({ ...editingDepositRecord, disetorOleh: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Bank Tujuan & Nomor Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    BANK / REKENING TUJUAN
                  </label>
                  <input
                    type="text"
                    value={editingDepositRecord.bankTujuan || ''}
                    onChange={(e) =>
                      setEditingDepositRecord({ ...editingDepositRecord, bankTujuan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    NOMOR SLIP / BUKTI SETOR
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SLIP-BCA-202610-08"
                    value={editingDepositRecord.nomorBukti || ''}
                    onChange={(e) =>
                      setEditingDepositRecord({ ...editingDepositRecord, nomorBukti: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  CATATAN / KETERANGAN SETORAN
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan teller, CDM, selisih jika ada..."
                  value={editingDepositRecord.catatan || ''}
                  onChange={(e) =>
                    setEditingDepositRecord({ ...editingDepositRecord, catatan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingDepositRecord(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold cursor-pointer"
                >
                  Simpan Status Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRINTABLE SLIP SETOR TUNAI 3-HARI                       */}
      {/* ============================================================== */}
      {selectedSlipRecord && (
        <SetorTunaiSlipModal
          record={selectedSlipRecord}
          branchName={branchNameMap[selectedSlipRecord.branchId] || selectedSlipRecord.branchId}
          onClose={() => setSelectedSlipRecord(null)}
        />
      )}
    </div>
  );
};
