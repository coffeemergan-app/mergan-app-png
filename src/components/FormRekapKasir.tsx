import React, { useState, useEffect } from 'react';
import { ShiftRekap, BranchTheme } from '../types';
import { getHariIndonesia, getTodayDateString, formatRupiah } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { Calculator, Check, AlertCircle, Lock, Link as LinkIcon, PlusCircle } from 'lucide-react';

interface FormRekapKasirProps {
  branchId: string;
  theme: BranchTheme;
  currentUser: { name: string; role: string };
  onSuccess?: () => void;
  canInput: boolean;
}

export const FormRekapKasir: React.FC<FormRekapKasirProps> = ({
  branchId,
  theme,
  currentUser,
  onSuccess,
  canInput,
}) => {
  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [person, setPerson] = useState<string>(currentUser.name.split(' (')[0] || '');
  const [shift, setShift] = useState<ShiftRekap['shift']>('Shift 1 (Pagi 07:00 - 15:00)');
  const [cash, setCash] = useState<number | ''>('');
  const [qris, setQris] = useState<number | ''>('');
  const [catatan, setCatatan] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Total Belanja Harian otomatis tersambung dari tabel belanja purchase untuk shift & tanggal cabang ini
  const [connectedBelanja, setConnectedBelanja] = useState<number>(0);

  useEffect(() => {
    const updateConnectedBelanja = () => {
      const spending = StorageService.getSpendingForBranchShift(branchId, tanggal, shift);
      setConnectedBelanja(spending);
    };

    updateConnectedBelanja();
    const unsubscribe = StorageService.subscribe(updateConnectedBelanja);
    return () => unsubscribe();
  }, [branchId, tanggal, shift]);

  const hari = getHariIndonesia(tanggal);

  const numCash = typeof cash === 'number' ? cash : 0;
  const numQris = typeof qris === 'number' ? qris : 0;
  // Belanja kasir tidak bisa diubah oleh pengisi kasir, langsung terkoneksi dengan belanja harian purchase
  const totalNet = numCash + numQris - connectedBelanja;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canInput) {
      setErrorMsg('Hak akses Anda terbatas. Hanya Kepala Toko yang berwenang menginput data rekap kasir.');
      return;
    }

    if (!tanggal || !person.trim()) {
      setErrorMsg('Mohon lengkapi Tanggal dan Person (Kepala Toko).');
      return;
    }

    if (numCash === 0 && numQris === 0) {
      setErrorMsg('Nominal Cash atau QRIS minimal salah satu harus terisi.');
      return;
    }

    StorageService.addShift({
      branchId,
      tanggal,
      hari,
      person: person.trim(),
      shift,
      cash: numCash,
      qris: numQris,
      belanjaKasir: connectedBelanja,
      catatan: catatan.trim() || undefined,
    });

    setIsSubmitted(true);
    setCash('');
    setQris('');
    setCatatan('');
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
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Form Input Rekap Kasir Harian
            </h3>
            <p className="text-xs text-neutral-500">
              Input setor omzet kasir per shift dengan integrasi otomatis belanja harian
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
            Mode Read-Only: Role Anda saat ini tidak diizinkan menginput rekap kasir. Hanya <strong>Kepala Toko Cabang</strong> yang dapat menambahkan data ini.
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
          <span className="font-medium">Data Rekap Kasir Berhasil Disimpan & Terkoneksi ke Database!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Row 1: Hari & Tanggal, Person Kepala Toko, Shift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              HARI & TANGGAL <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={!canInput}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                required
              />
              <span className="px-2.5 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                {hari || '-'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              PERSON (KEPALA TOKO) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Rian Pratama (Kepala Toko)"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              SHIFT OPERASIONAL <span className="text-rose-500">*</span>
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftRekap['shift'])}
              disabled={!canInput}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="Shift 1 (Pagi 07:00 - 15:00)">Shift 1 (Pagi 07:00 - 15:00)</option>
              <option value="Shift 2 (Malam 15:00 - 23:00)">Shift 2 (Malam 15:00 - 23:00)</option>
              <option value="Full Day (Event / Weekend)">Full Day (Event / Weekend)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Cash, QRIS, and Auto-Connected Belanja Harian (Locked/Read-Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              PEMASUKAN CASH (TUNAI) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">Rp</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="0"
                value={cash}
                onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canInput}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">Uang fisik dalam cash drawer</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              PEMASUKAN QRIS (NON-TUNAI) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">Rp</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="0"
                value={qris}
                onChange={(e) => setQris(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canInput}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">Settlement QRIS EDC / Dynamic QR</p>
          </div>

          {/* BELANJA: Otomatis tersambung dari form belanja harian sesuai shift & tanggal dan terkunci */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <span>BELANJA TERHUBUNG SHIFT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Terkunci</span>
                </span>
              </label>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                <LinkIcon className="w-2.5 h-2.5" />
                <span>Sync Shift Otomatis</span>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-rose-500">Rp</span>
              <input
                type="text"
                value={formatRupiah(connectedBelanja).replace('Rp', '').trim()}
                readOnly
                disabled
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold tabular-nums cursor-not-allowed select-none"
                title={`Total belanja terhubung otomatis dari form belanja untuk ${shift} pada tgl ${tanggal}.`}
              />
            </div>
            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>Diambil otomatis dari belanja {shift.split(' ')[0]} {shift.split(' ')[1]} tgl {tanggal}</span>
            </p>
          </div>
        </div>

        {/* Row 3: Catatan */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            CATATAN OPERASIONAL SHIFT (OPSIONAL)
          </label>
          <input
            type="text"
            placeholder="Keterangan kondisi outlet, kendala mesin espresso, atau catatan shift..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            disabled={!canInput}
            className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        {/* Kalkulasi Otomatis TOTAL BERSIH */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-mono">
                KALKULASI OTOMATIS NET SHIFT
              </span>
              <div className="text-xs text-neutral-300 mt-0.5">
                Cash ({formatRupiah(numCash)}) + QRIS ({formatRupiah(numQris)}) - Belanja Terkoneksi ({formatRupiah(connectedBelanja)})
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-mono">TOTAL SETOR BERSIH</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">
                {formatRupiah(totalNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
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
            <span>Simpan Rekap Kasir Harian</span>
          </button>
        </div>
      </form>
    </div>
  );
};
