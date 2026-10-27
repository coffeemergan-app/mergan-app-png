import React from 'react';
import { PayrollRecord, Branch } from '../types';
import { formatRupiah, formatTanggalShort } from '../utils/formatters';
import { Printer, X, CheckCircle2, Building2, Receipt, FileText } from 'lucide-react';

interface SlipGajiModalProps {
  payroll: PayrollRecord | null;
  branch?: Branch;
  branchName: string;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({
  payroll,
  branch,
  branchName,
  onClose,
}) => {
  if (!payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  const monthLabel = MONTH_NAMES[payroll.periodeBulan - 1] || `${payroll.periodeBulan}`;
  const totalPenerimaan =
    payroll.gajiPokok +
    payroll.totalTunjanganHadir +
    payroll.totalUpahLembur +
    payroll.bonusKinerja;
  const totalPotongan = payroll.potonganAlpa + payroll.potonganKasbon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-left">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #mergan-printable-payslip, #mergan-printable-payslip * {
            visibility: visible !important;
          }
          #mergan-printable-payslip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background-color: #FAF5E8 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #1c1917 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top bar (Hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Slip Gaji Resmi · {payroll.employeeName} ({monthLabel} {payroll.periodeTahun})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Slip Gaji Sheet (Cream Stationery) */}
        <div
          className="overflow-y-auto p-6 sm:p-8 space-y-5 bg-[#FAF5E8] text-neutral-900 border-x border-[#E6DCC8]"
          id="mergan-printable-payslip"
          style={{ backgroundColor: '#FAF5E8' }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-[#F2E8D5] border border-[#DFD2BC]">
                <img
                  src="/assets/aistudio/logo_mergan_headroom_76c6dae8.png"
                  alt="Logo Toko Kopi Mergan"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="border-l-2 border-neutral-400 pl-3">
                <h1 className="text-base font-black tracking-tight text-neutral-900 uppercase">
                  Toko Kopi Mergan
                </h1>
                <p className="text-[11px] text-neutral-700 font-medium">
                  Slip Gaji & Upah Karyawan Outlet Resmi
                </p>
                <p className="text-[10px] text-neutral-600 font-mono">
                  Outlet: {branchName}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-neutral-900 text-white font-mono mb-1">
                SLIP GAJI RESMI
              </span>
              <h2 className="text-sm font-mono font-bold text-neutral-900">
                PERIODE: {monthLabel.toUpperCase()} {payroll.periodeTahun}
              </h2>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                STATUS: {payroll.statusPembayaran}
              </span>
            </div>
          </div>

          {/* Employee Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F0E6D2] border border-[#DCceB7] text-xs">
            <div>
              <span className="text-[10px] text-neutral-600 uppercase font-mono block">Nama Karyawan</span>
              <span className="font-bold text-neutral-950 text-sm block">{payroll.employeeName}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-600 uppercase font-mono block">Jabatan / Posisi</span>
              <span className="font-semibold text-neutral-900 block">{payroll.posisi}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-600 uppercase font-mono block">Cabang Penempatan</span>
              <span className="font-semibold text-neutral-900 block">{branchName}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-600 uppercase font-mono block">Kehadiran / Hari</span>
              <span className="font-bold text-neutral-950 font-mono block">
                {payroll.totalHadir} / {payroll.totalHariKerja} Hari
              </span>
            </div>
          </div>

          {/* Table Breakdown: Penerimaan & Potongan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Penerimaan */}
            <div className="border border-[#D5C6AF] rounded-xl overflow-hidden bg-[#FAF5E8]">
              <div className="px-3.5 py-2 bg-[#EBE0CD] border-b border-[#D5C6AF] text-xs font-bold text-neutral-900 uppercase font-mono flex items-center justify-between">
                <span>Rincian Penerimaan (Gaji)</span>
                <span>(IDR)</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">Gaji Pokok Bulanan</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatRupiah(payroll.gajiPokok)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">
                    Tunjangan Kehadiran ({payroll.totalHadir} hari)
                  </span>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatRupiah(payroll.totalTunjanganHadir)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">
                    Upah Lembur ({payroll.totalJamLembur} jam)
                  </span>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatRupiah(payroll.totalUpahLembur)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">Bonus Kinerja Outlet</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatRupiah(payroll.bonusKinerja)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-neutral-950">
                  <span>Subtotal Penerimaan:</span>
                  <span className="font-mono text-emerald-800">{formatRupiah(totalPenerimaan)}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Potongan & Kehadiran */}
            <div className="border border-[#D5C6AF] rounded-xl overflow-hidden bg-[#FAF5E8]">
              <div className="px-3.5 py-2 bg-[#EBE0CD] border-b border-[#D5C6AF] text-xs font-bold text-neutral-900 uppercase font-mono flex items-center justify-between">
                <span>Rincian Potongan & Absen</span>
                <span>(IDR)</span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">Potongan Alpa ({payroll.totalAlpa} hari)</span>
                  <span className="font-mono font-bold text-rose-800">
                    - {formatRupiah(payroll.potonganAlpa)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-700">Kasbon / Pinjaman Karyawan</span>
                  <span className="font-mono font-bold text-rose-800">
                    - {formatRupiah(payroll.potonganKasbon)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-600">Catatan Sakit / Izin</span>
                  <span className="font-mono text-neutral-700">{payroll.totalSakitIzin} Hari</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8DDCA]">
                  <span className="text-neutral-600">Metode Bayar</span>
                  <span className="font-medium text-neutral-800">{payroll.metodePembayaran || 'Transfer Bank'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-neutral-950">
                  <span>Subtotal Potongan:</span>
                  <span className="font-mono text-rose-800">- {formatRupiah(totalPotongan)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Take Home Pay Hero Banner */}
          <div className="p-4 rounded-xl bg-[#EBE0CD] border-2 border-[#D2C3AA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider font-mono block">
                TOTAL GAJI BERSIH (TAKE HOME PAY)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 tracking-tight mt-0.5">
                {formatRupiah(payroll.gajiBersih)}
              </div>
              <span className="text-[11px] text-neutral-700 italic block mt-0.5">
                {payroll.catatan || 'Ditransfer langsung ke rekening bank terdaftar karyawan.'}
              </span>
            </div>
            <div className="text-right sm:border-l sm:border-[#D2C3AA] sm:pl-4">
              <span className="text-[10px] text-neutral-600 font-mono block">Tanggal Pembayaran:</span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {payroll.tanggalDibayar ? formatTanggalShort(payroll.tanggalDibayar) : '25 Oktober 2026'}
              </span>
            </div>
          </div>

          {/* Signatures Blocks (3 Pillars) */}
          <div className="pt-3 border-t border-[#D8C9B8]">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="flex flex-col justify-between h-32 p-2.5 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Dibuat Oleh:
                  </span>
                  <span className="text-[10px] text-neutral-700 block">Kepala Toko Cabang</span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-4/5 mx-auto pb-1 font-bold text-neutral-900 text-[11px]">
                    ( Kepala Toko )
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">{branchName}</div>
                </div>
              </div>

              <div className="flex flex-col justify-between h-32 p-2.5 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Mengetahui / Verifikasi:
                  </span>
                  <span className="text-[10px] text-neutral-700 block">Owner Holding / Cabang</span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-4/5 mx-auto pb-1 font-bold text-neutral-900 text-[11px]">
                    ( Owner Mergan )
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">Toko Kopi Mergan</div>
                </div>
              </div>

              <div className="flex flex-col justify-between h-32 p-2.5 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Diterima Oleh:
                  </span>
                  <span className="text-[10px] text-neutral-700 block">Karyawan Bersangkutan</span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-4/5 mx-auto pb-1 font-bold text-neutral-900 text-[11px]">
                    {payroll.employeeName}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">{payroll.posisi}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer timestamp */}
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-2 border-t border-neutral-300">
            <span>TOKO KOPI MERGAN · SLIP GAJI INTERNAL OUTLET</span>
            <span>Dokumen Rahasia & Resmi Perusahaan</span>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Gunakan tombol cetak untuk arsip slip fisik atau simpan format PDF.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip Gaji</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
