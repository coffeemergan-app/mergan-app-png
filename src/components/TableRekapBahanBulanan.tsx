import React, { useState } from 'react';
import { DailyExpense, BranchTheme } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Calendar, Search, Layers, TrendingUp, Printer } from 'lucide-react';
import { exportSingleTableRekapBahanBulananToPDF } from '../utils/exportReport';

interface TableRekapBahanBulananProps {
  expenses: DailyExpense[];
  theme: BranchTheme;
  branchName: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface ItemRecap {
  namaBarang: string;
  kategori: string;
  satuan: string;
  totalKuantitas: number;
  totalBiaya: number;
  rataHarga: number;
  frekuensi: number;
  supplier: string;
}

export const TableRekapBahanBulanan: React.FC<TableRekapBahanBulananProps> = ({
  expenses,
  theme,
  branchName,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter expenses by selected Month and Year
  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.tanggal);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Group by item name
  const recapMap = new Map<string, ItemRecap>();

  monthlyExpenses.forEach((exp) => {
    const key = exp.rincianBarang.trim();
    if (!recapMap.has(key)) {
      recapMap.set(key, {
        namaBarang: exp.rincianBarang,
        kategori: exp.kategori,
        satuan: exp.satuan,
        totalKuantitas: 0,
        totalBiaya: 0,
        rataHarga: exp.hargaSatuan,
        frekuensi: 0,
        supplier: exp.supplier || 'Toko Langganan',
      });
    }

    const current = recapMap.get(key)!;
    current.totalKuantitas += exp.kuantitas;
    current.totalBiaya += exp.totalBiaya;
    current.frekuensi += 1;
    if (exp.supplier) current.supplier = exp.supplier;
  });

  const recapList = Array.from(recapMap.values()).map((item) => ({
    ...item,
    rataHarga: item.totalKuantitas > 0 ? item.totalBiaya / item.totalKuantitas : item.rataHarga,
  }));

  const filteredList = recapList.filter(
    (item) =>
      item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBelanjaBulanIni = filteredList.reduce((acc, curr) => acc + curr.totalBiaya, 0);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden text-left">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Tabel Rekap Total Pembelian per Barang per Bulan
            </h3>
            <p className="text-xs text-neutral-500">
              Akumulasi kuantitas dan total rupiah belanja per jenis item ({branchName})
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer font-medium ml-1"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari barang di rekap bulanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Total Akumulasi Pembelian ({MONTH_NAMES[selectedMonth - 1]}):</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatRupiah(totalBelanjaBulanIni)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              exportSingleTableRekapBahanBulananToPDF({
                recapList: filteredList,
                branchName,
                monthName: MONTH_NAMES[selectedMonth - 1],
                year: selectedYear,
              });
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
            title="Download PDF Tabel Rekapitulasi Bahan Baku Bulanan"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span>Download PDF Bahan</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Nama Bahan / Barang</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-center">Total Kuantitas Terbeli</th>
              <th className="px-4 py-3 text-right">Rata-Rata Harga Satuan</th>
              <th className="px-4 py-3 text-right font-bold">Total Biaya Akumulasi</th>
              <th className="px-4 py-3 text-center">Frekuensi Beli</th>
              <th className="px-4 py-3">Supplier Utama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Tidak ada data pembelian barang untuk periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                    {item.namaBarang}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap tabular-nums font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {item.totalKuantitas} {item.satuan}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-neutral-600 dark:text-neutral-400">
                    {formatRupiah(item.rataHarga)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums font-bold text-amber-600 dark:text-amber-400">
                    {formatRupiah(item.totalBiaya)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap tabular-nums text-neutral-700 dark:text-neutral-300">
                    {item.frekuensi} kali order
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                    {item.supplier}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
