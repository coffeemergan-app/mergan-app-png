import React, { useState } from 'react';
import { Branch, ShiftRekap, DailyExpense, BranchOrder, User } from '../types';
import { formatRupiah, getTodayDateString, formatTanggalShort } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import {
  Building2,
  ShoppingCart,
  BarChart3,
  Eye,
  Clock,
  AlertTriangle,
  Bell,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Printer,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Receipt,
  Sparkles,
  Users,
  UserCheck,
  Briefcase,
} from 'lucide-react';

interface HoldingDashboardViewProps {
  branches: Branch[];
  shifts: ShiftRekap[];
  expenses: DailyExpense[];
  orders: BranchOrder[];
  currentUser: User | null;
  onSelectBranchView: (branchId: string) => void;
  onNavigateToOrders?: () => void;
  onNavigateToPayroll?: () => void;
}

export const HoldingDashboardView: React.FC<HoldingDashboardViewProps> = ({
  branches,
  shifts,
  expenses,
  orders,
  currentUser,
  onSelectBranchView,
  onNavigateToOrders,
  onNavigateToPayroll,
}) => {
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<BranchOrder | null>(null);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'ALL' | 'ORDERS' | 'BUDGET' | 'SHIFTS'>('ALL');

  const isOwnerHolding = currentUser?.role === 'OWNER_HOLDING';
  const isPurchaseHolding = currentUser?.role === 'PURCHASE_HOLDING';
  const todayStr = getTodayDateString();

  // Branch Name Map
  const branchNameMap: Record<string, string> = branches.reduce(
    (acc, b) => ({ ...acc, [b.id]: b.shortName }),
    {}
  );

  // Consolidated Financials (All Time / Filtered in view)
  const totalCash = shifts.reduce((acc, s) => acc + s.cash, 0);
  const totalQris = shifts.reduce((acc, s) => acc + s.qris, 0);
  const totalOmzetKotor = totalCash + totalQris;
  const totalNetShift = shifts.reduce((acc, s) => acc + s.totalNet, 0);
  const totalBelanjaOperasional = expenses.reduce((acc, e) => acc + e.totalBiaya, 0);
  const totalLabaBersih = totalNetShift - totalBelanjaOperasional;

  // Employee, Attendance, and Payroll data from StorageService
  const allEmployees = StorageService.getEmployees();
  const activeEmployees = allEmployees.filter((e) => e.isActive !== false);
  const todayAttendance = StorageService.getAttendance(todayStr);
  const currentMonthPayroll = StorageService.getPayrollRecords('2024-10');

  const totalHoldingSalary = currentMonthPayroll.reduce((acc, p) => acc + p.gajiBersih, 0);
  const presentTodayCount = todayAttendance.filter((a) => a.status === 'Hadir').length;
  const attendanceRate = activeEmployees.length > 0 ? (presentTodayCount / activeEmployees.length) * 100 : 100;
  const laborCostRatio = totalOmzetKotor > 0 ? (totalHoldingSalary / totalOmzetKotor) * 100 : 0;

  // Today's specific performance across 3 branches
  const todayShifts = shifts.filter((s) => s.tanggal === todayStr);
  const todayExpenses = expenses.filter((e) => e.tanggal === todayStr);
  const todayOmzet = todayShifts.reduce((acc, s) => acc + s.cash + s.qris, 0);
  const todayBelanja = todayExpenses.reduce((acc, e) => acc + e.totalBiaya, 0);
  const todayNet = todayShifts.reduce((acc, s) => acc + s.totalNet, 0) - todayBelanja;

  // Pending branch requisition orders
  const pendingOrders = orders.filter((o) => o.status === 'MENUNGGU KONFIRMASI');
  const urgentOrders = orders.filter(
    (o) => o.urgensi.includes('Mendesak') && o.status !== 'SELESAI / TERKIRIM'
  );

  // Budget warnings per branch for today
  const budgetAlerts = branches.map((b) => {
    const limit = StorageService.getBranchDailyBudget(b.id);
    const spent = StorageService.getDailySpendingForBranch(b.id, todayStr);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      branch: b,
      limit,
      spent,
      percent,
      isOver: spent > limit,
      isWarning: spent >= limit * 0.8 && spent <= limit,
    };
  }).filter((item) => item.isOver || item.isWarning);

  // Check today's shift submissions per branch
  const missingShiftsAlerts = branches.map((b) => {
    const bTodayShifts = todayShifts.filter((s) => s.branchId === b.id);
    const hasShift1 = bTodayShifts.some((s) => s.shift.includes('Shift 1'));
    const hasShift2 = bTodayShifts.some((s) => s.shift.includes('Shift 2'));
    return {
      branch: b,
      hasShift1,
      hasShift2,
      isPendingAny: !hasShift1 || !hasShift2,
    };
  }).filter((item) => item.isPendingAny);

  // Total notification count
  const totalNotifications = pendingOrders.length + budgetAlerts.length + missingShiftsAlerts.length;

  return (
    <div className="space-y-6 text-left">
      {/* Role Banner */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-extrabold tracking-tight uppercase">
              Pusat Kendali Eksekutif Holding — Toko Kopi Mergan
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {isOwnerHolding
              ? 'Mode Audit Owner Holding: Pengawasan konsolidasi omzet, cashflow, belanja, dan integritas laporan 3 cabang secara real-time.'
              : 'Mode Purchase Holding: Manajemen logistik pusat, verifikasi order bahan baku cabang, dan kontrol anggaran pengadaan.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-xs text-neutral-300 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono">
            <strong>3 Outlet Resmi Aktif</strong>
          </div>
          {totalNotifications > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>{totalNotifications} Notifikasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Notification & Alert Center */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Pusat Notifikasi & Peringatan Holding
              </h4>
              <p className="text-[11px] text-neutral-500">
                Peringatan dini order restock mendesak, limit anggaran belanja, dan absensi setoran kasir cabang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveNotificationTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                activeNotificationTab === 'ALL'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Semua ({totalNotifications})
            </button>
            <button
              type="button"
              onClick={() => setActiveNotificationTab('ORDERS')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                activeNotificationTab === 'ORDERS'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Order ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveNotificationTab('BUDGET')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                activeNotificationTab === 'BUDGET'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Budget ({budgetAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveNotificationTab('SHIFTS')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                activeNotificationTab === 'SHIFTS'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Setoran ({missingShiftsAlerts.length})
            </button>
          </div>
        </div>

        {totalNotifications === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Semua sistem cabang berjalan normal dan terkendali.
            </span>
            <span className="text-[11px] text-neutral-400">
              Tidak ada order bahan pending, batas anggaran aman, dan setoran kasir terpantau tertib.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Urgent / Pending Orders Alert Cards */}
            {(activeNotificationTab === 'ALL' || activeNotificationTab === 'ORDERS') &&
              pendingOrders.map((ord) => {
                const bName = branchNameMap[ord.branchId] || ord.branchId;
                const isUrgent = ord.urgensi.includes('Mendesak');
                return (
                  <div
                    key={ord.id}
                    className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      isUrgent
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20'
                        : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />}
                          <span>{bName}</span>
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase font-mono ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          }`}
                        >
                          {ord.urgensi}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mb-2">
                        PO <strong>#{ord.nomorOrder}</strong> · Pemohon: <strong>{ord.pemohon}</strong>
                      </div>

                      <div className="space-y-1 bg-white/80 dark:bg-neutral-800/80 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                        {ord.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex justify-between text-[11px] text-neutral-800 dark:text-neutral-200">
                            <span className="truncate">{item.merekBarang}</span>
                            <span className="font-mono font-bold tabular-nums">
                              {item.kuantitas} {item.satuan}
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

                    <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(ord)}
                        className="px-2.5 py-1 rounded bg-white dark:bg-neutral-800 hover:bg-neutral-100 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-amber-500" />
                        <span>Cetak PO</span>
                      </button>

                      {isPurchaseHolding && (
                        <button
                          type="button"
                          onClick={() => {
                            StorageService.updateOrderStatus(ord.id, 'DIPROSES PURCHASE');
                          }}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Proses Pesanan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Budget Limit Warnings */}
            {(activeNotificationTab === 'ALL' || activeNotificationTab === 'BUDGET') &&
              budgetAlerts.map((bAlert) => (
                <div
                  key={bAlert.branch.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                    bAlert.isOver
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20'
                      : 'border-amber-300 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <ShieldAlert className={`w-3.5 h-3.5 ${bAlert.isOver ? 'text-rose-500' : 'text-amber-500'}`} />
                        <span>{bAlert.branch.shortName}</span>
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${
                          bAlert.isOver ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bAlert.isOver ? 'OVERBUDGET' : 'PERINGATAN 80%'}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                      Pengeluaran hari ini telah mencapai {bAlert.percent.toFixed(0)}% dari plafon harian.
                    </p>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-500">Terpakai:</span>
                        <strong className="text-neutral-900 dark:text-neutral-100 font-mono">
                          {formatRupiah(bAlert.spent)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-500">Plafon Budget:</span>
                        <span className="font-mono text-neutral-600 dark:text-neutral-300">
                          {formatRupiah(bAlert.limit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectBranchView(bAlert.branch.id)}
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Audit Belanja Cabang</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

            {/* Missing Shifts Submission Alerts */}
            {(activeNotificationTab === 'ALL' || activeNotificationTab === 'SHIFTS') &&
              missingShiftsAlerts.map((mAlert) => (
                <div
                  key={mAlert.branch.id}
                  className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        <span>{mAlert.branch.shortName}</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 uppercase font-mono">
                        Shift Hari Ini
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                      Status input setoran kasir tanggal {formatTanggalShort(todayStr)}:
                    </p>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-600 dark:text-neutral-400">Shift 1 (Pagi):</span>
                        {mAlert.hasShift1 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Tercatat
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Belum disubmit</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-600 dark:text-neutral-400">Shift 2 (Malam):</span>
                        {mAlert.hasShift2 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Tercatat
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Menunggu malam</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectBranchView(mAlert.branch.id)}
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Buka Rekap Kasir</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 4 Primary Consolidated KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block font-mono">
            Total Omzet 3 Cabang
          </span>
          <span className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
            {formatRupiah(totalOmzetKotor)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            Cash: {formatRupiah(totalCash)} · QRIS: {formatRupiah(totalQris)}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block font-mono">
            Total Net Kasir Shift
          </span>
          <span className="text-lg md:text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-1 block">
            {formatRupiah(totalNetShift)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            Setelah belanja kasir otomatis
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block font-mono">
            Total Belanja Pengadaan
          </span>
          <span className="text-lg md:text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
            {formatRupiah(totalBelanjaOperasional)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            {expenses.length} transaksi pembelian
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block font-mono">
            Estimasi Laba Bersih
          </span>
          <span className="text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            {formatRupiah(totalLabaBersih)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            Net Kasir - Total Belanja
          </span>
        </div>
      </div>

      {/* SDM & Penggajian Terkonsolidasi Holding */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Ringkasan SDM & Sistem Penggajian 3 Cabang
              </h4>
              <p className="text-[11px] text-neutral-500">
                Data absensi real-time dan beban gaji terintegrasi langsung dari input Kepala Toko masing-masing outlet.
              </p>
            </div>
          </div>

          {onNavigateToPayroll && (
            <button
              type="button"
              onClick={onNavigateToPayroll}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Kelola Absensi & Payroll</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total Karyawan Aktif</span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5 block">
              {activeEmployees.length} Staf Resmi
            </span>
            <span className="text-[10px] text-neutral-500">
              3 Kepala Toko, 8 Barista / Kasir
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase block">Kehadiran Hari Ini</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
              {presentTodayCount} / {activeEmployees.length} Hadir ({attendanceRate.toFixed(0)}%)
            </span>
            <span className="text-[10px] text-neutral-500">
              Tercatat shift pagi & malam
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono uppercase block">Beban Gaji Bulan Ini</span>
            <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5 block">
              {formatRupiah(totalHoldingSalary)}
            </span>
            <span className="text-[10px] text-neutral-500">
              {currentMonthPayroll.length} slip gaji terbit
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono uppercase block">Labor Cost Ratio</span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
              {laborCostRatio.toFixed(1)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              Beban gaji thd omzet kotor
            </span>
          </div>
        </div>
      </div>

      {/* 3 Branch Comparative Matrix Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 font-mono">
            <BarChart3 className="w-4 h-4 text-neutral-500" />
            <span>Kinerja Komparasi 3 Outlet Resmi Toko Kopi Mergan</span>
          </h4>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            Pilih cabang untuk audit mendalam atau kelola pesanan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => {
            const branchShifts = shifts.filter((s) => s.branchId === b.id);
            const branchExpenses = expenses.filter((e) => e.branchId === b.id);
            const bCash = branchShifts.reduce((acc, s) => acc + s.cash, 0);
            const bQris = branchShifts.reduce((acc, s) => acc + s.qris, 0);
            const bOmzet = bCash + bQris;
            const bNetShift = branchShifts.reduce((acc, s) => acc + s.totalNet, 0);
            const bExpense = branchExpenses.reduce((acc, e) => acc + e.totalBiaya, 0);
            const bProfit = bNetShift - bExpense;

            // SDM metrics for branch
            const bEmployees = allEmployees.filter((e) => e.branchId === b.id && e.isActive !== false);
            const bPayroll = currentMonthPayroll.filter((p) => p.branchId === b.id);
            const bSalaryTotal = bPayroll.reduce((acc, p) => acc + p.gajiBersih, 0);
            const bTodayHadir = todayAttendance.filter((a) => a.branchId === b.id && a.status === 'Hadir').length;

            const bLimit = StorageService.getBranchDailyBudget(b.id);
            const bTodaySpent = StorageService.getDailySpendingForBranch(b.id, todayStr);
            const bPercent = bLimit > 0 ? Math.min(100, (bTodaySpent / bLimit) * 100) : 0;
            const bPendingOrders = orders.filter((o) => o.branchId === b.id && o.status === 'MENUNGGU KONFIRMASI');

            return (
              <div
                key={b.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full ${b.accentBg}`} />
                      <div>
                        <h5 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {b.name}
                        </h5>
                        <p className="text-[11px] text-neutral-500">{b.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectBranchView(b.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Audit</span>
                    </button>
                  </div>

                  {/* 3 Financial Points */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 dark:border-neutral-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-mono">Omzet Total</span>
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {formatRupiah(bOmzet)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-mono">Belanja Total</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatRupiah(bExpense)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-mono">Laba Bersih</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatRupiah(bProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Daily Budget Utilization Meter */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">Budget Belanja Hari Ini:</span>
                      <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {formatRupiah(bTodaySpent)} / {formatRupiah(bLimit)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          bPercent >= 100
                            ? 'bg-rose-500'
                            : bPercent >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${bPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Branch SDM & Attendance stats */}
                  <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-500" />
                      <span>{bEmployees.length} Staf ({bTodayHadir} Hadir)</span>
                    </span>
                    <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                      Gaji: {formatRupiah(bSalaryTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Rekap: <strong>{branchShifts.length}</strong> shift
                  </span>
                  {bPendingOrders.length > 0 ? (
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                      {bPendingOrders.length} Order Menunggu
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[11px]">Stok Aman</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable Invoice Modal from Holding */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          branch={branches.find((b) => b.id === selectedInvoiceOrder.branchId)}
          branchName={branchNameMap[selectedInvoiceOrder.branchId] || selectedInvoiceOrder.branchId}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
