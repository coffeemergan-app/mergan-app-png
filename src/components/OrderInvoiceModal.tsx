import React from 'react';
import { BranchOrder, Branch } from '../types';
import { formatTanggalShort } from '../utils/formatters';
import { Printer, X, CheckCircle2, Clock, AlertTriangle, Building2, Mail, FileText } from 'lucide-react';

interface OrderInvoiceModalProps {
  order: BranchOrder | null;
  branch?: Branch;
  branchName: string;
  onClose: () => void;
}

const CENTRAL_PURCHASE_EMAIL = 'coffeemergan@gmail.com';

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  branch,
  branchName,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isUrgent = order.urgensi.includes('Mendesak');
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalQuantity = order.items.reduce((acc, it) => acc + (Number(it.kuantitas) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-left">
      {/* Print-specific style block with rich cream stationery styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #mergan-printable-invoice, #mergan-printable-invoice * {
            visibility: visible !important;
          }
          #mergan-printable-invoice {
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

      <div className="relative w-full max-w-3xl bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Preview Invoice / Dokumen Purchase Order #{order.nomorOrder}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              Kertas Cream
            </span>
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

        {/* Invoice Printable Sheet - Cream Paper Tone for Logo Contrast */}
        <div
          className="overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#FAF5E8] text-neutral-900 border-x border-[#E6DCC8]"
          id="mergan-printable-invoice"
          style={{ backgroundColor: '#FAF5E8' }}
        >
          {/* Header Zone with Mergan Logo & PO Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="p-1.5 rounded-lg bg-[#F2E8D5] border border-[#DFD2BC] shadow-xs">
                <img
                  src="/assets/aistudio/logo_mergan_headroom_76c6dae8.png"
                  alt="Logo Toko Kopi Mergan"
                  className="h-14 w-auto object-contain filter contrast-110 drop-shadow-xs"
                />
              </div>
              <div className="border-l-2 border-neutral-400 pl-3">
                <h1 className="text-lg font-black tracking-tight text-neutral-900 uppercase">
                  Toko Kopi Mergan
                </h1>
                <p className="text-xs text-neutral-700 font-medium">
                  Sistem Pengadaan & Logistik Bahan Baku Outlet
                </p>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Email Pusat: {CENTRAL_PURCHASE_EMAIL}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-neutral-900 text-white font-mono mb-1">
                PURCHASE ORDER INVOICE
              </span>
              <h2 className="text-xl font-mono font-black text-neutral-900 tracking-tight">
                {order.nomorOrder}
              </h2>
              <p className="text-xs text-neutral-500">
                Tanggal Pengajuan: <strong className="text-neutral-800">{formatTanggalShort(order.tanggal)}</strong>
              </p>
            </div>
          </div>

          {/* Info Columns: Pemohon vs Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F2E9D8] border border-[#DDD0BC] text-xs">
            {/* Sender / Requester */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">
                CABANG PEMOHON (REQUESTER):
              </div>
              <div className="text-sm font-bold text-neutral-900">
                {branchName}
              </div>
              <div className="text-neutral-700 leading-relaxed text-[11px]">
                {branch?.address || 'Outlet Operasional Toko Kopi Mergan'}
              </div>
              <div className="pt-1 text-neutral-800">
                Pemohon: <strong>{order.pemohon}</strong>
              </div>
            </div>

            {/* Recipient / Central Purchase */}
            <div className="space-y-1.5 sm:border-l sm:border-[#DDD0BC] sm:pl-4">
              <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono">
                TUJUAN ORDER (DESTINATION):
              </div>
              <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-800" />
                <span>Purchase Holding Pusat</span>
              </div>
              <div className="text-neutral-700 text-[11px]">
                Kantor Pusat Logistik & Gudang Toko Kopi Mergan
              </div>
              <div className="text-neutral-800 font-mono text-[11px]">
                Email: {CENTRAL_PURCHASE_EMAIL}
              </div>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] text-neutral-600">Urgensi:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isUrgent
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-[#E5DAC6] text-neutral-900 border border-[#D5C6AF]'
                  }`}
                >
                  {order.urgensi}
                </span>
                <span className="text-[10px] text-neutral-600 ml-1">Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Table of Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-mono">
              Rincian Bahan Baku & Barang Yang Diorder:
            </h4>
            <div className="overflow-x-auto border border-[#D5C6AF] rounded-lg shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#EBE0CD] text-neutral-900 uppercase font-mono font-bold text-[10px] border-b border-[#D5C6AF]">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">No</th>
                    <th className="px-3 py-2">Merek / Nama Bahan Baku</th>
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2 text-right">Kuantitas</th>
                    <th className="px-3 py-2">Satuan</th>
                    <th className="px-3 py-2">Catatan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D6C3] font-normal">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-[#FAF5E8]' : 'bg-[#F4ECE0]'}>
                      <td className="px-3 py-2.5 text-center font-mono text-neutral-600">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-neutral-900">
                        {item.merekBarang}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E8DDD0] text-neutral-800 border border-[#D8C9B8]">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-neutral-900">
                        {item.kuantitas}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-neutral-800">
                        {item.satuan}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-600 italic text-[11px]">
                        {item.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#EBE0CD] font-bold border-t border-[#D5C6AF] text-neutral-900">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right uppercase font-mono text-[11px]">
                      Total Macam Barang & Unit:
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-extrabold text-neutral-900">
                      {totalQuantity}
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-neutral-700 font-mono text-[11px]">
                      ({order.items.length} jenis item)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          {order.catatan && (
            <div className="p-3 rounded-lg bg-[#F5ECE0] border border-[#DECDAD] text-xs">
              <span className="font-bold text-amber-950 font-mono uppercase text-[10px] block mb-0.5">
                Catatan Pemohon / Instruksi Pengiriman:
              </span>
              <p className="text-neutral-900 italic">{order.catatan}</p>
            </div>
          )}

          {/* Official Signatures Blocks (3 Pillars) */}
          <div className="pt-4 border-t border-[#D8C9B8]">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              {/* Pillar 1: Pemohon Cabang */}
              <div className="flex flex-col justify-between h-36 p-3 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Diajukan Oleh:
                  </span>
                  <span className="text-[11px] text-neutral-700 block mt-0.5">
                    PIC / Staf Cabang
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-3/4 mx-auto pb-1 font-bold text-neutral-900">
                    {order.pemohon}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Tgl: {formatTanggalShort(order.tanggal)}
                  </div>
                </div>
              </div>

              {/* Pillar 2: Mengetahui Kepala Toko / Owner Cabang */}
              <div className="flex flex-col justify-between h-36 p-3 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Mengetahui:
                  </span>
                  <span className="text-[11px] text-neutral-700 block mt-0.5">
                    Kepala Toko / Owner Cabang
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-3/4 mx-auto pb-1 font-bold text-neutral-900">
                    ( .............................. )
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Tanda Tangan & Nama Terang
                  </div>
                </div>
              </div>

              {/* Pillar 3: Purchase Holding */}
              <div className="flex flex-col justify-between h-36 p-3 rounded-lg border border-dashed border-[#CBB8A0] bg-[#F2E8D7]/80">
                <div>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider font-mono block">
                    Disetujui & Diproses:
                  </span>
                  <span className="text-[11px] text-neutral-700 block mt-0.5">
                    Purchase Holding Mergan
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="border-b border-neutral-700 w-3/4 mx-auto pb-1 font-bold text-neutral-900">
                    Tim Purchase Pusat
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {CENTRAL_PURCHASE_EMAIL}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer watermark & print timestamp */}
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-3 border-t border-neutral-200">
            <span>TOKO KOPI MERGAN · INVOICE ORDER INTERNAL</span>
            <span>Dicetak pada: {printDate}</span>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Hidden on print) */}
        <div className="no-print px-6 py-3 bg-neutral-100 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Format A4 otomatis disesuaikan saat memilih <strong>Cetak / Simpan PDF</strong>.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Invoice PO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
