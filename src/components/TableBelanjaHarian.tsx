import React, { useState } from 'react';
import { DailyExpense, ExpenseCategory, BranchTheme, User, ShiftType } from '../types';
import { formatRupiah, formatTanggalShort } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { exportSingleTableBelanjaToPDF } from '../utils/exportReport';
import {
  Search,
  Trash2,
  Edit2,
  Tag,
  Calendar,
  X,
  Clock,
  Layers,
  List,
  CheckCircle2,
  Building2,
  Store,
  Receipt,
  Sparkles,
  Printer,
} from 'lucide-react';

interface TableBelanjaHarianProps {
  expenses: DailyExpense[];
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

const CATEGORIES: ExpenseCategory[] = [
  'Beans',
  'UHT',
  'Freshmilk',
  'SKM',
  'Syrup',
  'Cair',
  'Krimer',
  'Powder',
  'Topping',
  'Non Bahan Baku',
  'Cleo',
  'Cup',
  'Operasional Lainnya',
];

export const TableBelanjaHarian: React.FC<TableBelanjaHarianProps> = ({
  expenses,
  theme,
  currentUser,
  branchNameMap,
  isHoldingView = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'FLAT'>('GROUPED');

  // Editing state
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null);

  const isOwnerHolding = currentUser?.role === 'OWNER_HOLDING';
  const isOwnerCabang = currentUser?.role === 'OWNER_CABANG';
  const isKepalaToko = currentUser?.role === 'KEPALA_TOKO';
  const canEditOrDelete =
    currentUser?.role === 'PURCHASE_HOLDING' ||
    currentUser?.role === 'PURCHASE_CABANG';

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.rincianBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.keterangan && e.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (branchNameMap[e.branchId] &&
        branchNameMap[e.branchId].toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = selectedShiftFilter === 'ALL' || e.shift === selectedShiftFilter;
    const matchesCat = categoryFilter === 'ALL' || e.kategori === categoryFilter;

    const d = new Date(e.tanggal);
    const matchesMonth = selectedMonth === 'ALL' || d.getMonth() + 1 === Number(selectedMonth);
    const matchesYear = !selectedYear || d.getFullYear() === selectedYear;
    const matchesSpecificDate = !dateFilter || e.tanggal === dateFilter;

    return (
      matchesSearch &&
      matchesShift &&
      matchesCat &&
      matchesMonth &&
      matchesYear &&
      matchesSpecificDate
    );
  });

  const totalBiayaFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.totalBiaya, 0);

  const handleDelete = (id: string, barang: string) => {
    if (!canEditOrDelete) {
      alert('Hak akses Anda hanya melihat data (Read-Only). Hanya Kepala Toko dan Tim Purchase yang berwenang mengubah catatan belanja.');
      return;
    }
    if (
      confirm(
        `Hapus catatan belanja "${barang}"? Data belanja akan otomatis disinkronkan ke rekap kasir.`
      )
    ) {
      const res = StorageService.deleteExpense(id, currentUser);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const res = StorageService.updateExpense(editingExpense, currentUser);
    if (res.success) {
      setEditingExpense(null);
    } else {
      alert(res.message || 'Gagal menyimpan perubahan belanja.');
    }
  };

  // Format Indonesian date nicely (e.g. Senin, 24 Oktober 2024)
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Hierarchical grouping: Date -> Shift -> Expense items
  // Sort dates descending
  const uniqueDates = Array.from(new Set(filteredExpenses.map((e) => e.tanggal))).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="space-y-4 text-left">
      {/* Top Filter Bar with View Mode Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari barang, supplier, cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setViewMode('GROUPED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'GROUPED'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Tampilan Rinci Dikelompokkan per Hari dan per Shift"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Rinci per Hari & Shift</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FLAT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'FLAT'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Tampilan Tabel Datar Standar"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel Datar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month & Year Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer font-bold border-l border-neutral-300 dark:border-neutral-700 pl-1"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Shift</option>
            <option value="Shift 1 (Pagi 07:00 - 15:00)">Shift 1 (Pagi)</option>
            <option value="Shift 2 (Malam 15:00 - 23:00)">Shift 2 (Malam)</option>
            <option value="Full Day (Event / Weekend)">Full Day</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Specific Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Total Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-amber-500" />
          <span className="text-neutral-700 dark:text-neutral-300">
            Total Transaksi:{' '}
            <strong className="font-extrabold text-neutral-900 dark:text-neutral-100">
              {filteredExpenses.length}
            </strong>{' '}
            item pembelian
            {uniqueDates.length > 0 && ` tersebar di ${uniqueDates.length} hari operasional.`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-mono text-[11px] uppercase">
              Total Belanja:
            </span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatRupiah(totalBiayaFiltered)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const branchLabel = isHoldingView
                ? 'Holding Konsolidasi 3 Cabang'
                : branchNameMap[theme.branchId || ''] || theme.name;
              const periodLabel = selectedMonth !== 'ALL'
                ? `${MONTH_NAMES[Number(selectedMonth) - 1]} ${selectedYear}`
                : `Tahun ${selectedYear}`;
              exportSingleTableBelanjaToPDF({
                expenses: filteredExpenses,
                branchName: branchLabel,
                filterTitle: `${periodLabel} - ${categoryFilter !== 'ALL' ? categoryFilter : 'Semua Kategori'}`,
              });
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
            title="Download PDF Tabel Belanja Harian"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span>Download PDF Belanja</span>
          </button>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                Edit Catatan Belanja Harian
              </h4>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Rincian Nama Barang
                </label>
                <input
                  type="text"
                  value={editingExpense.rincianBarang}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, rincianBarang: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  required
                />
              </div>

              {/* Shift & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Shift (Terkoneksi)</span>
                  </label>
                  <select
                    value={editingExpense.shift || 'Shift 1 (Pagi 07:00 - 15:00)'}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        shift: e.target.value as ShiftType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium"
                  >
                    <option value="Shift 1 (Pagi 07:00 - 15:00)">Shift 1 (Pagi)</option>
                    <option value="Shift 2 (Malam 15:00 - 23:00)">Shift 2 (Malam)</option>
                    <option value="Full Day (Event / Weekend)">Full Day</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Kategori Bahan
                  </label>
                  <select
                    value={editingExpense.kategori}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        kategori: e.target.value as ExpenseCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Harga Satuan
                  </label>
                  <input
                    type="number"
                    value={editingExpense.hargaSatuan}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        hargaSatuan: Number(e.target.value),
                        totalBiaya: Number(e.target.value) * editingExpense.kuantitas,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Kuantitas (Qty)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingExpense.kuantitas}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        kuantitas: Number(e.target.value),
                        totalBiaya: editingExpense.hargaSatuan * Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={editingExpense.satuan}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, satuan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Supplier / Toko
                </label>
                <input
                  type="text"
                  value={editingExpense.supplier || ''}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, supplier: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={editingExpense.keterangan || ''}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, keterangan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div className="p-2.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500">
                Total Biaya Baru:{' '}
                <strong className="text-amber-500">
                  {formatRupiah(editingExpense.hargaSatuan * editingExpense.kuantitas)}
                </strong>
                . Perubahan otomatis disinkronkan ke form rekap kasir {editingExpense.shift} tgl{' '}
                {editingExpense.tanggal}.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer"
                >
                  Simpan Belanja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODE 1: HIERARCHICAL GROUPED VIEW (Per Hari & Per Shift) */}
      {viewMode === 'GROUPED' ? (
        <div className="space-y-6">
          {uniqueDates.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              Belum ada data belanja yang sesuai dengan kriteria filter.
            </div>
          ) : (
            uniqueDates.map((dateStr) => {
              const dayExpenses = filteredExpenses.filter((e) => e.tanggal === dateStr);
              const dayTotal = dayExpenses.reduce((acc, curr) => acc + curr.totalBiaya, 0);

              // Distinct shifts for this date, ordered logically
              const shiftOrder = [
                'Shift 1 (Pagi 07:00 - 15:00)',
                'Shift 2 (Malam 15:00 - 23:00)',
                'Full Day (Event / Weekend)',
              ];
              const presentShifts = Array.from(new Set(dayExpenses.map((e) => e.shift))).sort(
                (a, b) => {
                  const idxA = shiftOrder.indexOf(a);
                  const idxB = shiftOrder.indexOf(b);
                  return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
                }
              );

              return (
                <div
                  key={dateStr}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm space-y-0"
                >
                  {/* Day Header Bar */}
                  <div className="px-5 py-3.5 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neutral-800 text-amber-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold tracking-tight text-white capitalize">
                          {formatIndonesianDate(dateStr)}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {dateStr} · {dayExpenses.length} transaksi belanja terdaftar
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                        Total Belanja Hari Ini:
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-extrabold text-sm tabular-nums">
                        {formatRupiah(dayTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Day Content: Shift Blocks */}
                  <div className="p-4 sm:p-5 space-y-5 bg-neutral-50/50 dark:bg-neutral-950/40">
                    {presentShifts.map((sh) => {
                      const shiftExpenses = dayExpenses.filter((e) => e.shift === sh);
                      const shiftTotal = shiftExpenses.reduce(
                        (acc, curr) => acc + curr.totalBiaya,
                        0
                      );
                      const isShift1 = sh && sh.includes('Shift 1');
                      const isShift2 = sh && sh.includes('Shift 2');

                      return (
                        <div
                          key={sh}
                          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs"
                        >
                          {/* Shift Sub-Header */}
                          <div className="px-4 py-2.5 bg-neutral-100/80 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold font-mono uppercase tracking-wide ${
                                  isShift1
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                    : isShift2
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800'
                                    : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                                }`}
                              >
                                {sh}
                              </span>
                              <span className="text-xs text-neutral-500 font-medium">
                                ({shiftExpenses.length} item barang)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-500 font-mono">
                                Subtotal Belanja Shift:
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                {formatRupiah(shiftTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Itemized Table under Shift */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-mono tracking-wider">
                                <tr>
                                  <th className="px-3.5 py-2 w-10 text-center">No</th>
                                  {isHoldingView && <th className="px-3.5 py-2">Cabang</th>}
                                  <th className="px-3.5 py-2">Rincian / Merek Bahan</th>
                                  <th className="px-3.5 py-2">Kategori</th>
                                  <th className="px-3.5 py-2 text-right">Harga Satuan</th>
                                  <th className="px-3.5 py-2 text-center">Qty / Satuan</th>
                                  <th className="px-3.5 py-2 text-right font-bold text-neutral-700 dark:text-neutral-300">
                                    Total Biaya
                                  </th>
                                  <th className="px-3.5 py-2">PIC & Supplier</th>
                                  <th className="px-3.5 py-2">Keterangan</th>
                                  {canEditOrDelete && (
                                    <th className="px-3.5 py-2 text-center">Aksi</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-normal">
                                {shiftExpenses.map((e, idx) => (
                                  <tr
                                    key={e.id}
                                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                                  >
                                    <td className="px-3.5 py-2.5 text-center font-mono text-neutral-400">
                                      {idx + 1}
                                    </td>
                                    {isHoldingView && (
                                      <td className="px-3.5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                        {branchNameMap[e.branchId] || e.branchId}
                                      </td>
                                    )}
                                    <td className="px-3.5 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                                      {e.rincianBarang}
                                    </td>
                                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                        {e.kategori}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                                      {formatRupiah(e.hargaSatuan)}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                      {e.kuantitas} {e.satuan}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                                      {formatRupiah(e.totalBiaya)}
                                    </td>
                                    <td className="px-3.5 py-2.5 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                                        {e.personPurchase}
                                      </div>
                                      <div className="text-[10px] text-neutral-400">
                                        {e.supplier || 'Toko Lokal'}
                                      </div>
                                    </td>
                                    <td
                                      className="px-3.5 py-2.5 max-w-xs truncate text-neutral-500 text-[11px]"
                                      title={e.keterangan}
                                    >
                                      {e.keterangan || '-'}
                                    </td>
                                    {canEditOrDelete && (
                                      <td className="px-3.5 py-2.5 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setEditingExpense(e)}
                                            className="p-1 rounded text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                            title="Edit Catatan Belanja"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(e.id, e.rincianBarang)}
                                            className="p-1 rounded text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                            title="Hapus Catatan Belanja"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MODE 2: FLAT TABLE VIEW */
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Shift</th>
                  {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                  <th className="px-4 py-3">Rincian Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Harga Satuan</th>
                  <th className="px-4 py-3 text-center">Qty / Unit</th>
                  <th className="px-4 py-3 text-right font-bold">Total Biaya</th>
                  <th className="px-4 py-3">Petugas & Supplier</th>
                  <th className="px-4 py-3">Keterangan</th>
                  {canEditOrDelete && <th className="px-4 py-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEditOrDelete ? 11 : 10}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      Belum ada data belanja untuk filter periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100">
                        {formatTanggalShort(e.tanggal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {e.shift
                            ? e.shift.includes('Shift 1')
                              ? 'Shift 1'
                              : e.shift.includes('Shift 2')
                              ? 'Shift 2'
                              : 'Full Day'
                            : 'Shift 1'}
                        </span>
                      </td>
                      {isHoldingView && (
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                          {branchNameMap[e.branchId] || e.branchId}
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                        {e.rincianBarang}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                          {e.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatRupiah(e.hargaSatuan)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap tabular-nums font-bold text-neutral-800 dark:text-neutral-200">
                        {e.kuantitas} {e.satuan}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums font-bold text-amber-600 dark:text-amber-400">
                        {formatRupiah(e.totalBiaya)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {e.personPurchase}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {e.supplier || 'Toko Lokal'}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-neutral-500" title={e.keterangan}>
                        {e.keterangan || '-'}
                      </td>
                      {canEditOrDelete && (
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingExpense(e)}
                              className="p-1 rounded text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Edit Catatan Belanja"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e.id, e.rincianBarang)}
                              className="p-1 rounded text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Hapus Catatan Belanja"
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
      )}
    </div>
  );
};
