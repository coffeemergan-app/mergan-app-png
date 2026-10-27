import React, { useState } from 'react';
import { DailyExpense, ExpenseCategory, BranchTheme, ShiftType } from '../types';
import { MASTER_BAHAN_BAKU } from '../data/masterBahanBaku';
import { getTodayDateString, formatRupiah } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { ShoppingBag, PlusCircle, AlertTriangle, Check, AlertCircle, Sparkles, Layers, Clock, Link as LinkIcon } from 'lucide-react';

interface FormBelanjaHarianProps {
  branchId: string;
  theme: BranchTheme;
  currentUser: { name: string; role: string };
  dailyBudgetLimit: number;
  currentDailySpent: number;
  canInput: boolean;
  onSuccess?: () => void;
}

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

const SATUAN_OPTIONS = ['kg', 'liter', 'dus', 'crtn', 'pcs', 'pak', 'slop', 'ikat', 'krat', 'galon', 'botol'];

export const FormBelanjaHarian: React.FC<FormBelanjaHarianProps> = ({
  branchId,
  theme,
  currentUser,
  dailyBudgetLimit,
  currentDailySpent,
  canInput,
  onSuccess,
}) => {
  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [shift, setShift] = useState<ShiftType>('Shift 1 (Pagi 07:00 - 15:00)');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [rincianBarang, setRincianBarang] = useState<string>('');
  const [kategori, setKategori] = useState<ExpenseCategory>('Beans');
  const [hargaSatuan, setHargaSatuan] = useState<number | ''>('');
  const [kuantitas, setKuantitas] = useState<number | ''>('');
  const [satuan, setSatuan] = useState<string>('kg');
  const [personPurchase, setPersonPurchase] = useState<string>(currentUser.name.split(' (')[0] || '');
  const [supplier, setSupplier] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const numHarga = typeof hargaSatuan === 'number' ? hargaSatuan : 0;
  const numQty = typeof kuantitas === 'number' ? kuantitas : 0;
  const totalBiayaOperasional = numHarga * numQty;

  const projectedTotalSpent = currentDailySpent + totalBiayaOperasional;
  const willExceedBudget = dailyBudgetLimit > 0 && projectedTotalSpent > dailyBudgetLimit;

  // Auto-fill from Master Bahan Baku selection
  const handleSelectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
    if (!masterId) return;

    const item = MASTER_BAHAN_BAKU.find((m) => m.id === masterId);
    if (item) {
      setRincianBarang(item.merekBarang);
      setKategori(item.kategori);
      setHargaSatuan(item.hargaSatuan);
      setSatuan(item.satuan);
      setSupplier(item.tempatPembelian);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canInput) {
      setErrorMsg('Akses terbatas: Anda tidak memiliki izin input belanja operasional.');
      return;
    }

    if (!rincianBarang.trim()) {
      setErrorMsg('Rincian nama barang belanja wajib diisi.');
      return;
    }

    if (numHarga <= 0 || numQty <= 0) {
      setErrorMsg('Harga satuan dan kuantitas harus bernilai lebih dari 0.');
      return;
    }

    StorageService.addExpense({
      branchId,
      tanggal,
      shift,
      rincianBarang: rincianBarang.trim(),
      kategori,
      hargaSatuan: numHarga,
      kuantitas: numQty,
      satuan,
      personPurchase: personPurchase.trim() || 'Purchase',
      supplier: supplier.trim() || undefined,
      keterangan: keterangan.trim() || undefined,
    });

    setIsSubmitted(true);
    setSelectedMasterId('');
    setRincianBarang('');
    setHargaSatuan('');
    setKuantitas('');
    setSupplier('');
    setKeterangan('');
    if (onSuccess) onSuccess();
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3500);
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden text-left">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Form Belanja Harian & Pengadaan Bahan Baku
            </h3>
            <p className="text-xs text-neutral-500">
              Pencatatan nota pembelian bahan kopi, susu, sirup, krimer, powder, cup & non-bahan
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${theme.accentBgSoft} ${theme.accentBorder}`}>
          {theme.badgeLabel}
        </span>
      </div>

      {!canInput && (
        <div className="p-3 mx-5 my-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Mode Read-Only: Role Anda tidak memiliki izin input belanja operasional. Hanya <strong>Purchase Cabang</strong> yang dapat mencatat pengadaan.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSubmitted && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-medium">Data Belanja Berhasil Disimpan & Otomatis Tersambung ke Rekap Kasir!</span>
        </div>
      )}

      {/* Over-budget Warning Preview */}
      {willExceedBudget && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Pengingat Anggaran Harian:</span>
            Item ini akan membuat total belanja hari ini menjadi{' '}
            <strong className="tabular-nums font-bold">{formatRupiah(projectedTotalSpent)}</strong>, melampaui pagu harian{' '}
            <strong className="tabular-nums font-bold">{formatRupiah(dailyBudgetLimit)}</strong>. Notifikasi pengingat over-budget akan ditampilkan di dashboard.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Quick Fill from Master Bahan Baku (From User's uploaded PDF) */}
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5 uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pilih Cepat dari Master Bahan Baku Mergan (Katalog Resmi)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMasterId}
              onChange={(e) => handleSelectMaster(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="">-- Pilih dari 51 Bahan Baku Toko Kopi Mergan (Isi Otomatis) --</option>
              {MASTER_BAHAN_BAKU.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.kategori}] {item.merekBarang} — {item.satuan} ({formatRupiah(item.hargaSatuan)}) · {item.tempatPembelian}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Memilih item di atas akan mengisi otomatis nama barang, kategori, satuan, supplier, dan harga satuan standar.
          </span>
        </div>

        {/* Row 1: Tanggal, Shift, Kategori, Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              TANGGAL BELANJA <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>SHIFT OPERASIONAL</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                <LinkIcon className="w-2.5 h-2.5" />
                <span>Sync Kasir</span>
              </span>
            </div>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftType)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none font-medium"
            >
              <option value="Shift 1 (Pagi 07:00 - 15:00)">Shift 1 (Pagi 07:00 - 15:00)</option>
              <option value="Shift 2 (Malam 15:00 - 23:00)">Shift 2 (Malam 15:00 - 23:00)</option>
              <option value="Full Day (Event / Weekend)">Full Day (Event / Weekend)</option>
            </select>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Terhubung otomatis ke rekap shift kasir
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              KATEGORI BIAYA OPERASIONAL <span className="text-rose-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as ExpenseCategory)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              PERSON PURCHASE (PETUGAS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Dewi Anjani / Bagas Pratama"
              value={personPurchase}
              onChange={(e) => setPersonPurchase(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Row 2: Rincian Barang & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              RINCIAN BARANG <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Mergan House Blend / Diamond UHT"
              value={rincianBarang}
              onChange={(e) => setRincianBarang(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              SUPPLIER / TEMPAT PEMBELIAN
            </label>
            <input
              type="text"
              placeholder="Contoh: Sans Roastery / Lancar Jaya / Tirta Warna"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 3: Harga Satuan, Kuantitas, Satuan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              HARGA SATUAN (IDR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">Rp</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={hargaSatuan}
                onChange={(e) => setHargaSatuan(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canInput}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              KUANTITAS <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              placeholder="Jumlah..."
              value={kuantitas}
              onChange={(e) => setKuantitas(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              SATUAN UNIT <span className="text-rose-500">*</span>
            </label>
            <select
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              {SATUAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Keterangan */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            KETERANGAN / NO. INVOICE / BATCH
          </label>
          <input
            type="text"
            placeholder="Nomor invoice/nota, keterangan batch, atau catatan pengadaan..."
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={!canInput}
            className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        {/* Kalkulasi Otomatis TOTAL BIAYA OPERASIONAL */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-mono">
                TOTAL BIAYA OPERASIONAL ITEM INI
              </span>
              <div className="text-xs text-neutral-300 mt-0.5">
                {numQty} {satuan} × {formatRupiah(numHarga)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-mono">TOTAL BIAYA SUB</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                {formatRupiah(totalBiayaOperasional)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button - Aligned to left */}
        <div className="flex justify-start pt-1">
          <button
            type="submit"
            disabled={!canInput || isSubmitted}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm ${
              canInput
                ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simpan Belanja Operasional</span>
          </button>
        </div>
      </form>
    </div>
  );
};
