import React, { useState } from 'react';
import { Branch, ShiftRekap, DailyExpense, BranchOrder, User, BranchTheme } from '../types';
import { formatRupiah, getTodayDateString, formatTanggalShort } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import {
  Building2,
  TrendingUp,
  CreditCard,
  Banknote,
  ShoppingCart,
  Clock,
  Printer,
  ChevronRight,
  PackageOpen,
  ArrowUpRight,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  FileSpreadsheet,
  Users,
  UserCheck,
  AlertCircle,
  Receipt,
} from 'lucide-react';

interface BranchOwnerDashboardViewProps {
  branch: Branch;
  theme: BranchTheme;
  shifts: ShiftRekap[];
  expenses: DailyExpense[];
  orders: BranchOrder[];
  currentUser: User;
  dailyBudgetLimit: number;
  onNavigateToRekap: () => void;
  onNavigateToBelanja: () => void;
  onNavigateToOrder: () => void;
  onAdjustLimit?: () => void;
  onOpenExport?: () => void;
  onNavigateToPayroll?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const BranchOwnerDashboardView: React.FC<BranchOwnerDashboardViewProps> = ({
  branch,
  theme,
  shifts,
  expenses,
  orders,
  currentUser,
  dailyBudgetLimit,
  onNavigateToRekap,
  onNavigateToBelanja,
  onNavigateToOrder,
  onAdjustLimit,
  onOpenExport,
  onNavigateToPayroll,
}) => {
  const todayStr = getTodayDateString();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<BranchOrder | null>(null);

  // Employee, Attendance, and Payroll data for this branch
  const branchEmployees = StorageService.getEmployees().filter(
    (e) => e.branchId === branch.id && e.isActive !== false
  );
  const todayAttendance = StorageService.getAttendance(todayStr).filter(
    (a) => a.branchId === branch.id
  );
  const formattedMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const branchPayroll = StorageService.getPayrollRecords(formattedMonthStr).filter(
    (p) => p.branchId === branch.id
  );
  const totalBranchSalary = branchPayroll.reduce((acc, p) => acc + p.gajiBersih, 0);
  const presentCount = todayAttendance.filter((a) => a.status === 'Hadir').length;

  // Filter branch data
  const branchShifts = shifts.filter((s) => s.branchId === branch.id);
  const branchExpenses = expenses.filter((e) => e.branchId === branch.id);
  const branchOrders = orders.filter((o) => o.branchId === branch.id);

  // Today calculations
  const todayShifts = branchShifts.filter((s) => s.tanggal === todayStr);
  const todayExpenses = branchExpenses.filter((e) => e.tanggal === todayStr);

  const todayCash = todayShifts.reduce((acc, s) => acc + s.cash, 0);
  const todayQris = todayShifts.reduce((acc, s) => acc + s.qris, 0);
  const todayOmzet = todayCash + todayQris;
  const todayBelanja = todayExpenses.reduce((acc, e) => acc + e.totalBiaya, 0);
  const todayNet = todayOmzet - todayBelanja;

  const budgetPercent = dailyBudgetLimit > 0 ? Math.min(100, (todayBelanja / dailyBudgetLimit) * 100) : 0;
  const sisaBudget = Math.max(0, dailyBudgetLimit - todayBelanja);

  // Monthly calculations
  const monthlyShifts = branchShifts.filter((s) => {
    const d = new Date(s.tanggal);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const monthlyExpenses = branchExpenses.filter((e) => {
    const d = new Date(e.tanggal);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const monthlyCash = monthlyShifts.reduce((acc, s) => acc + s.cash, 0);
  const monthlyQris = monthlyShifts.reduce((acc, s) => acc + s.qris, 0);
  const monthlyOmzet = monthlyCash + monthlyQris;
  const monthlyBelanja = monthlyExpenses.reduce((acc, e) => acc + e.totalBiaya, 0);
  const monthlyNet = monthlyOmzet - monthlyBelanja;

  // Recent shifts for today (Shift 1 vs Shift 2)
  const shift1 = todayShifts.find((s) => s.shift.includes('Shift 1'));
  const shift2 = todayShifts.find((s) => s.shift.includes('Shift 2'));

  const isOwnerCabang = currentUser.role === 'OWNER_CABANG';

  return (
    <div className="space-y-6 text-left">
      {/* Executive / Branch Welcome Card */}
      <div className={`p-5 rounded-2xl border ${theme.accentBorder} bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.accentBg} text-white font-black text-xl shadow-xs ring-4 ring-neutral-100 dark:ring-neutral-800`}>
            {branch.shortName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {currentUser.role === 'KEPALA_TOKO'
                  ? `Dasbor Kepala Toko — ${branch.name}`
                  : currentUser.role === 'PURCHASE_CABANG'
                  ? `Dasbor Pengadaan & Belanja — ${branch.name}`
                  : `Dasbor Eksekutif Owner — ${branch.name}`}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${theme.accentBgSoft}`}>
                {branch.city}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {branch.address} {branch.phone && `· Telp: ${branch.phone}`}
            </p>
          </div>
        </div>

        {/* Quick actions tailored to user role */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {currentUser.role === 'KEPALA_TOKO' && (
            <>
              <button
                type="button"
                onClick={onNavigateToRekap}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>+ Input Rekap Kasir</span>
              </button>
              {onNavigateToPayroll && (
                <button
                  type="button"
                  onClick={onNavigateToPayroll}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Absensi & Payroll</span>
                </button>
              )}
            </>
          )}

          {currentUser.role === 'PURCHASE_CABANG' && (
            <>
              <button
                type="button"
                onClick={onNavigateToBelanja}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>+ Input Belanja Harian</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToOrder}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <PackageOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Order Barang ke Pusat</span>
              </button>
            </>
          )}

          {onAdjustLimit && (
            <button
              type="button"
              onClick={onAdjustLimit}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-500" />
              <span>Atur Limit Budget</span>
            </button>
          )}
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-opacity shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
              <span>Ekspor PDF / Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* TODAY'S RECAP: 4 Key Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Kinerja Keuangan Hari Ini ({formatTanggalShort(todayStr)})</span>
          </h4>
          <span className="text-[11px] text-neutral-500">
            Real-time sinkronisasi kasir & belanja
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Omzet Hari Ini */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block font-mono">
              Omzet Kasir Hari Ini
            </span>
            <span className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
              {formatRupiah(todayOmzet)}
            </span>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>Cash: {formatRupiah(todayCash)}</span>
              <span>QRIS: {formatRupiah(todayQris)}</span>
            </div>
          </div>

          {/* Belanja Hari Ini & Meter */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block font-mono">
                Belanja Hari Ini
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                budgetPercent >= 100
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
            <span className="text-lg md:text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
              {formatRupiah(todayBelanja)}
            </span>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercent >= 100 ? 'bg-rose-500' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>Plafon: {formatRupiah(dailyBudgetLimit)}</span>
                <span>Sisa: {formatRupiah(sisaBudget)}</span>
              </div>
            </div>
          </div>

          {/* Laba Bersih Hari Ini */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-mono">
              Laba Bersih Hari Ini
            </span>
            <span className="text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
              {formatRupiah(todayNet)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              (Omzet Kotor - Belanja Pengadaan)
            </span>
          </div>

          {/* Jumlah Transaksi Hari Ini */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider block font-mono">
              Aktivitas Shift & Belanja
            </span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {todayShifts.length}
                </span>
                <span className="text-[11px] text-neutral-500 block">Shift Kasir</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700 text-xl font-light">|</span>
              <div>
                <span className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {todayExpenses.length}
                </span>
                <span className="text-[11px] text-neutral-500 block">Item Belanja</span>
              </div>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Status harian terkoneksi
            </span>
          </div>
        </div>
      </div>

      {/* SHIFT COMPARISON TODAY: Shift 1 vs Shift 2 */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Rincian Setoran Shift Hari Ini (Shift 1 vs Shift 2)
            </h4>
          </div>
          {currentUser.role !== 'PURCHASE_CABANG' ? (
            <button
              type="button"
              onClick={onNavigateToRekap}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Tabel Rekap Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToBelanja}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Belanja Harian</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shift 1 (Pagi) */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                  SHIFT 1 (PAGI 07:00 - 15:00)
                </span>
              </div>
              {shift1 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disetor
                </span>
              ) : (
                <span className="text-neutral-400 text-[11px] italic">Belum tercatat</span>
              )}
            </div>

            {shift1 ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Person Kepala Toko:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{shift1.person}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Omzet Cash:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatRupiah(shift1.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Omzet QRIS:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatRupiah(shift1.qris)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Belanja Terkoneksi Shift 1:</span>
                  <span className="font-mono font-bold">-{formatRupiah(shift1.belanjaKasir)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-sm">
                  <span className="text-neutral-900 dark:text-neutral-100">Total Net Kasir:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono">{formatRupiah(shift1.totalNet)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic py-4 text-center">
                Kasir Shift 1 belum menginput form rekap kasir harian.
              </p>
            )}
          </div>

          {/* Shift 2 (Malam) */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 font-mono">
                  SHIFT 2 (MALAM 15:00 - 23:00)
                </span>
              </div>
              {shift2 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disetor
                </span>
              ) : (
                <span className="text-neutral-400 text-[11px] italic">Menunggu tutup shift malam</span>
              )}
            </div>

            {shift2 ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Person Kepala Toko:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{shift2.person}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Omzet Cash:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatRupiah(shift2.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Omzet QRIS:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatRupiah(shift2.qris)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Belanja Terkoneksi Shift 2:</span>
                  <span className="font-mono font-bold">-{formatRupiah(shift2.belanjaKasir)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-sm">
                  <span className="text-neutral-900 dark:text-neutral-100">Total Net Kasir:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono">{formatRupiah(shift2.totalNet)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic py-4 text-center">
                Kasir Shift 2 belum menginput form rekap kasir harian.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY SUMMARY AUDIT WITH YEAR FILTER */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>Rekapitulasi Bulanan Cabang ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})</span>
            </h4>
            <p className="text-[11px] text-neutral-500">
              Evaluasi kinerja total omzet dan belanja bahan bulanan untuk analisis margin outlet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 text-left">
            <span className="text-[11px] text-neutral-500 font-mono uppercase block">Total Omzet Bulan Ini</span>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
              {formatRupiah(monthlyOmzet)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Dari {monthlyShifts.length} sesi shift kasir
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 text-left">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono uppercase block">Total Belanja Bulan Ini</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
              {formatRupiah(monthlyBelanja)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Dari {monthlyExpenses.length} transaksi belanja
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 text-left">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono uppercase block">Net Margin Cabang</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
              {formatRupiah(monthlyNet)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              {monthlyOmzet > 0 ? `${((monthlyNet / monthlyOmzet) * 100).toFixed(1)}% margin operasional` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* SDM, ABSENSI & SISTEM PENGGAJIAN CABANG */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                SDM, Presensi Hari Ini & Penggajian Outlet — {branch.shortName}
              </h4>
              <p className="text-[11px] text-neutral-500">
                Data presensi & gaji dikelola langsung oleh Kepala Toko ({branch.headStore || 'Kepala Toko'}) untuk transparansi Owner.
              </p>
            </div>
          </div>

          {onNavigateToPayroll && currentUser.role !== 'PURCHASE_CABANG' && (
            <button
              type="button"
              onClick={onNavigateToPayroll}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Buka Formulir Absensi & Slip Gaji</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 SDM KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40">
            <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total Staf Aktif</span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5 block">
              {branchEmployees.length} Staf
            </span>
            <span className="text-[10px] text-neutral-500">
              Kepala Toko & Barista/Kasir
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase block">Kehadiran Hari Ini</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
              {presentCount} / {branchEmployees.length} Hadir
            </span>
            <span className="text-[10px] text-neutral-500">
              Shift Pagi & Malam {formatTanggalShort(todayStr)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40">
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono uppercase block">Beban Gaji Bulan Ini</span>
            <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5 block">
              {formatRupiah(totalBranchSalary)}
            </span>
            <span className="text-[10px] text-neutral-500">
              {branchPayroll.length} slip gaji outlet
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono uppercase block">Rasio Beban Gaji</span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
              {monthlyOmzet > 0 ? ((totalBranchSalary / monthlyOmzet) * 100).toFixed(1) : 0}%
            </span>
            <span className="text-[10px] text-neutral-500">
              Dari omzet kotor bulan berjalan
            </span>
          </div>
        </div>

        {/* Staff Attendance Quick Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-mono">
              <tr>
                <th className="px-3.5 py-2">Nama Karyawan</th>
                <th className="px-3.5 py-2">Jabatan</th>
                <th className="px-3.5 py-2 text-center">Status Presensi Hari Ini</th>
                <th className="px-3.5 py-2 text-right">Gaji Pokok</th>
                <th className="px-3.5 py-2 text-right">Tunjangan Harian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {branchEmployees.map((emp) => {
                const att = todayAttendance.find((a) => a.employeeId === emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                      {emp.nama}
                    </td>
                    <td className="px-3.5 py-2.5 text-neutral-600 dark:text-neutral-400">
                      {emp.posisi}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      {att ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : att.status === 'Izin'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : att.status === 'Sakit'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {att.status} {att.jamMasuk && `(${att.jamMasuk})`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Belum absen</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                      {formatRupiah(emp.gajiPokokPerBulan)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      {formatRupiah(emp.tunjanganHarian)}/hr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BRANCH ORDERS STATUS & INVOICE PRINTING */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Status Pengajuan Order Bahan Baku ke Purchase Pusat
            </h4>
          </div>
          {(currentUser.role === 'PURCHASE_CABANG' || currentUser.role === 'PURCHASE_HOLDING') && (
            <button
              type="button"
              onClick={onNavigateToOrder}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Buat Order Baru</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {branchOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-4 text-center">
            Belum ada pengajuan order barang yang tercatat untuk cabang ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branchOrders.slice(0, 6).map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      #{ord.nomorOrder}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ord.status === 'SELESAI / TERKIRIM'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ord.status === 'DIPROSES PURCHASE'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-500 mb-2">
                    Tgl: {formatTanggalShort(ord.tanggal)} · Pemohon: <strong>{ord.pemohon}</strong>
                  </div>

                  <div className="space-y-1 bg-white dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                    {ord.items.slice(0, 2).map((it, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="truncate">{it.merekBarang}</span>
                        <span className="font-mono font-bold tabular-nums">
                          {it.kuantitas} {it.satuan}
                        </span>
                      </div>
                    ))}
                    {ord.items.length > 2 && (
                      <div className="text-[10px] text-neutral-400 italic">
                        +{ord.items.length - 2} item lainnya...
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {ord.urgensi}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceOrder(ord)}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak Invoice PO</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          branch={branch}
          branchName={branch.name}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
