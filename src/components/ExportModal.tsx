import React, { useState } from 'react';
import { Branch, ShiftRekap, DailyExpense } from '../types';
import { exportMonthlyReportToPDF, exportMonthlyReportToExcel } from '../utils/exportReport';
import { FileText, FileSpreadsheet, X, Download, Calendar, Building } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  shifts: ShiftRekap[];
  expenses: DailyExpense[];
}

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  branches,
  activeBranchId,
  shifts,
  expenses,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Resolve Target Branch
  const targetBranch =
    selectedBranchId === 'all'
      ? { id: 'all', name: 'Holding Toko Kopi Mergan (Konsolidasi 3 Cabang)' }
      : branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Filter Shifts and Expenses by Branch and Month/Year
  const filteredShifts = shifts.filter((s) => {
    const matchBranch = selectedBranchId === 'all' || s.branchId === selectedBranchId;
    const d = new Date(s.tanggal);
    const matchMonth = d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    return matchBranch && matchMonth;
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchBranch = selectedBranchId === 'all' || e.branchId === selectedBranchId;
    const d = new Date(e.tanggal);
    const matchMonth = d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    return matchBranch && matchMonth;
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportMonthlyReportToPDF({
        branch: targetBranch,
        month: selectedMonth,
        year: selectedYear,
        shifts: filteredShifts,
        expenses: filteredExpenses,
      });
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat file PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportMonthlyReportToExcel({
        branch: targetBranch,
        month: selectedMonth,
        year: selectedYear,
        shifts: filteredShifts,
        expenses: filteredExpenses,
      });
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Export Laporan Bulanan Otomatis
              </h3>
              <p className="text-xs text-neutral-500">
                Pilih format dokumen resmi Toko Kopi Mergan (PDF & Excel)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Settings */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>OUTLET / CABANG</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
            >
              <option value="all">Konsolidasi Holding (Semua Cabang)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>BULAN</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                TAHUN
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              >
                {YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Records summary preview */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Data yang Akan Diexport:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Rekap Sesi Kasir:</span>
                <span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {filteredShifts.length} shift
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Transaksi Belanja:</span>
                <span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {filteredExpenses.length} transaksi
                </span>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 bg-white dark:bg-neutral-800 flex items-center justify-center gap-2.5 font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer transition-all hover:shadow-xs"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export Dokumen PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 bg-white dark:bg-neutral-800 flex items-center justify-center gap-2.5 font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer transition-all hover:shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Data Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
