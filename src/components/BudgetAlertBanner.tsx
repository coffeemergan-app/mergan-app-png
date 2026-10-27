import React from 'react';
import { AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface BudgetAlertBannerProps {
  branchName: string;
  dailySpent: number;
  dailyBudgetLimit: number;
  dateStr: string;
  onAdjustLimit?: () => void;
  canEditLimit?: boolean;
}

export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
  branchName,
  dailySpent,
  dailyBudgetLimit,
  dateStr,
  onAdjustLimit,
  canEditLimit = false,
}) => {
  const percentage = dailyBudgetLimit > 0 ? (dailySpent / dailyBudgetLimit) * 100 : 0;
  const isOverBudget = dailySpent > dailyBudgetLimit;
  const isWarning = !isOverBudget && percentage >= 85;

  if (!isOverBudget && !isWarning) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Status Anggaran Harian ({dateStr}):</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatRupiah(dailySpent)} / {formatRupiah(dailyBudgetLimit)} ({percentage.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-neutral-500">Sisa Anggaran Aman: {formatRupiah(Math.max(0, dailyBudgetLimit - dailySpent))}</span>
          {canEditLimit && onAdjustLimit && (
            <button
              onClick={onAdjustLimit}
              className="text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer font-medium"
            >
              Ubah Limit
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isOverBudget) {
    const selisihLebih = dailySpent - dailyBudgetLimit;
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-900 dark:text-rose-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold tracking-tight">
                PERINGATAN: PENGELUARAN MELEBIHI BATAS ANGGARAN HARIAN!
              </h4>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white tabular-nums">
                {percentage.toFixed(1)}% Terpakai
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
              Total belanja operasional hari ini pada <strong className="font-semibold">{branchName}</strong> telah mencapai{' '}
              <strong className="font-semibold tabular-nums">{formatRupiah(dailySpent)}</strong>, melebihi batas anggaran yang ditentukan yaitu{' '}
              <strong className="font-semibold tabular-nums">{formatRupiah(dailyBudgetLimit)}</strong> (Over-budget sebesar{' '}
              <strong className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">+{formatRupiah(selisihLebih)}</strong>).
            </p>
            <div className="mt-2.5 flex items-center gap-3 text-xs">
              <span className="font-medium text-rose-700 dark:text-rose-300">
                Langkah: Evaluasi kembali nota belanja darurat atau minta persetujuan Purchase Holding.
              </span>
              {canEditLimit && onAdjustLimit && (
                <button
                  onClick={onAdjustLimit}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-200/50 dark:bg-rose-900/50 rounded hover:bg-rose-200 transition-colors"
                >
                  Sesuaikan Batas Limit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Warning (>= 85%)
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-900 dark:text-amber-200 shadow-sm">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0 text-xs">
          <span className="font-semibold">Mendekati Batas Anggaran ({percentage.toFixed(0)}%):</span> Pengeluaran hari ini telah terpakai{' '}
          <span className="font-bold tabular-nums">{formatRupiah(dailySpent)}</span> dari limit{' '}
          <span className="font-bold tabular-nums">{formatRupiah(dailyBudgetLimit)}</span>. Sisa kuota belanja:{' '}
          <span className="font-bold tabular-nums">{formatRupiah(dailyBudgetLimit - dailySpent)}</span>.
        </div>
        {canEditLimit && onAdjustLimit && (
          <button
            onClick={onAdjustLimit}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
          >
            Ubah Limit
          </button>
        )}
      </div>
    </div>
  );
};
