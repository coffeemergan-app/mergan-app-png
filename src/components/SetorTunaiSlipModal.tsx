import React from 'react';
import { SetorTunai3HariRecord, Branch } from '../types';
import { formatRupiah, formatTanggalShort } from '../utils/formatters';
import { Printer, X, CheckCircle2, AlertTriangle, Building2, Receipt, ArrowDownToLine } from 'lucide-react';

interface SetorTunaiSlipModalProps {
  record: SetorTunai3HariRecord | null;
  branch?: Branch;
  branchName: string;
  onClose: () => void;
}

export const SetorTunaiSlipModal: React.FC<SetorTunaiSlipModalProps> = ({
  record,
  branch,
  branchName,
  onClose,
}) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSudahDisetor = record.status === 'SUDAH_DISETOR';
  const printTimestamp = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-left">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-slip-setor, #printable-slip-setor * {
            visibility: visible !important;
          }
          #printable-slip-setor {
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
        {/* Modal Top Bar */}
        <div className="no-print px-5 py-3.5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Slip Setor Tunai 3-Harian #{record.cycleNumber} ({record.labelPeriode})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
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

        {/* Printable Slip Sheet (Rich Cream Paper Tone) */}
        <div
          className="overflow-y-auto p-6 sm:p-8 space-y-5 bg-[#FAF5E8] text-neutral-900 border-x border-[#E6DCC8]"
          id="printable-slip-setor"
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
                  Sistem Rekap Keuangan & Setoran Kasir Trihari
                </p>
                <p className="text-[10px] text-neutral-600 font-mono">
                  Outlet: {branchName}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-neutral-900 text-white font-mono mb-1">
                BUKTI SETOR TUNAI KASIR
              </span>
              <h2 className="text-sm font-mono font-bold text-neutral-900">
                SIKLUS #{record.cycleNumber} ({record.labelPeriode})
              </h2>
              <span
                className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                  isSudahDisetor
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    : 'bg-amber-100 text-amber-950 border border-amber-300'
                }`}
              >
                {isSudahDisetor ? 'SUDAH DISETOR KE HOLDING' : 'MENUNGGU SETORAN TUNAI'}
              </span>
            </div>
          </div>

          {/* Amount Hero Banner */}
          <div className="p-4 rounded-xl bg-[#F0E6D2] border border-[#DCceB7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                Total Nominal Wajib Setor (Net Kasir):
              </span>
              <div className="text-2xl font-black font-mono text-neutral-950 tracking-tight mt-0.5">
                {formatRupiah(record.totalNet)}
              </div>
              <span className="text-[11px] text-neutral-700 italic block mt-0.5">
                Dihitung dari akumulasi Total Net Shift Kasir selama 3 hari periode berjalan.
              </span>
            </div>
            <div className="text-right sm:border-l sm:border-[#DCceB7] sm:pl-4">
              <span className="text-[10px] text-neutral-600 font-mono block">Shift Terdata</span>
              <span className="text-base font-bold text-neutral-900 font-mono">{record.shiftCount} Shift</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-mono">
              Rincian Perhitungan Kasir Periode:
            </h4>
            <div className="overflow-x-auto border border-[#D5C6AF] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#EBE0CD] text-neutral-900 uppercase font-mono font-bold text-[10px] border-b border-[#D5C6AF]">
                  <tr>
                    <th className="px-3 py-2">Komponen Rekap</th>
                    <th className="px-3 py-2 text-right">Nominal</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D6C3] font-normal">
                  <tr className="bg-[#FAF5E8]">
                    <td className="px-3 py-2 font-medium text-neutral-800">
                      Total Penerimaan Cash (Fisik)
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(record.totalCash)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 text-[11px]">Uang tunai fisik laci kasir</td>
                  </tr>
                  <tr className="bg-[#F4ECE0]">
                    <td className="px-3 py-2 font-medium text-neutral-800">
                      Total Penerimaan QRIS
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(record.totalQris)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 text-[11px]">Non-tunai rekening settlement</td>
                  </tr>
                  <tr className="bg-[#FAF5E8]">
                    <td className="px-3 py-2 font-medium text-rose-800">
                      Pengeluaran Belanja Harian Kasir
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-800">
                      - {formatRupiah(record.totalBelanjaKasir)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 text-[11px]">Otomatis terkoneksi belanja</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#EBE0CD] font-bold border-t border-[#D5C6AF] text-neutral-900">
                  <tr>
                    <td className="px-3 py-2.5 uppercase font-mono text-[11px]">
                      TOTAL NET SETOR TUNAI:
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm font-black text-neutral-950">
                      {formatRupiah(record.totalNet)}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-700">
                      Cash + QRIS - Belanja
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Deposit Settlement Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F2E9D8] border border-[#DDD0BC] text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-600 uppercase font-mono block">
                Rekening Bank Tujuan Setoran:
              </span>
              <p className="font-semibold text-neutral-900">
                {record.bankTujuan || 'BCA Holding Toko Kopi Mergan'}
              </p>
              <div className="text-[11px] text-neutral-700 pt-0.5">
                Nomor Slip / Bukti: <strong className="font-mono">{record.nomorBukti || '- (Belum Diinput)'}</strong>
              </div>
            </div>
            <div className="space-y-1 sm:border-l sm:border-[#DDD0BC] sm:pl-3">
              <span className="text-[10px] font-bold text-neutral-600 uppercase font-mono block">
                Eksekusi & Petugas Setoran:
              </span>
              <p className="text-neutral-900">
                Tanggal Setor:{' '}
                <strong className="text-neutral-950">
                  {record.tanggalSetor ? formatTanggalShort(record.tanggalSetor) : '- (Belum Disetor)'}
                </strong>
              </p>
              <div className="text-[11px] text-neutral-700 pt-0.5">
                Disetor Oleh:{' '}
                <strong className="text-neutral-900">{record.disetorOleh || 'Kepala Toko Cabang'}</strong>
              </div>
            </div>
            {record.catatan && (
              <div className="sm:col-span-2 pt-2 border-t border-[#DDD0BC] text-[11px] text-neutral-800 italic">
                Catatan: {record.catatan}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-3 border-t border-[#D8C9B8]">
            <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div className="flex flex-col justify-between h-32 p-3 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Disetorkan Oleh:
                  </span>
                  <span className="text-[11px] text-neutral-700 block mt-0.5">
                    Kepala Toko / Kasir Cabang
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-3/4 mx-auto pb-1 font-bold text-neutral-900">
                    {record.disetorOleh || '( .............................. )'}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Outlet: {branchName}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between h-32 p-3 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Diterima & Diverifikasi:
                  </span>
                  <span className="text-[11px] text-neutral-700 block mt-0.5">
                    Finance / Owner Holding
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-3/4 mx-auto pb-1 font-bold text-neutral-900">
                    Owner Holding / Finance Mergan
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Toko Kopi Mergan Pusat
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer timestamp */}
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-2 border-t border-neutral-300">
            <span>TOKO KOPI MERGAN · SLIP SETOR TUNAI TRIHARI RESMI</span>
            <span>Dicetak pada: {printTimestamp}</span>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Gunakan tombol cetak untuk arsip slip setoran bank dan rekonsiliasi holding.
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
              <span>Cetak Slip Setoran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
