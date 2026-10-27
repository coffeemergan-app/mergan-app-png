import React, { useState } from 'react';
import { BranchOrder, BranchOrderItem, BranchTheme, User, MasterBahanBaku, Branch } from '../types';
import { StorageService } from '../services/storage';
import { getTodayDateString, formatTanggalShort } from '../utils/formatters';
import { Send, Plus, Trash2, Mail, Copy, Check, Clock, CheckCircle2, AlertTriangle, PackageOpen, Printer, FileText, ShieldAlert } from 'lucide-react';
import { OrderInvoiceModal } from './OrderInvoiceModal';

interface FormOrderBarangCabangProps {
  branchId: string;
  theme: BranchTheme;
  currentUser: User;
  orders: BranchOrder[];
  masterBahan: MasterBahanBaku[];
  branchNameMap: Record<string, string>;
  isHoldingView?: boolean;
  branches?: Branch[];
}

const CENTRAL_PURCHASE_EMAIL = 'coffeemergan@gmail.com';

export const FormOrderBarangCabang: React.FC<FormOrderBarangCabangProps> = ({
  branchId,
  theme,
  currentUser,
  orders,
  masterBahan,
  branchNameMap,
  isHoldingView = false,
  branches = [],
}) => {
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Beans');
  const [itemQty, setItemQty] = useState<number | ''>('');
  const [itemSatuan, setItemSatuan] = useState('kg');
  const [itemNote, setItemNote] = useState('');
  
  // Pending items in the current draft order
  const [draftItems, setDraftItems] = useState<BranchOrderItem[]>([]);
  const [urgensi, setUrgensi] = useState<BranchOrder['urgensi']>('Biasa');
  const [orderCatatan, setOrderCatatan] = useState('');
  const [pemohon, setPemohon] = useState(currentUser.name);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<BranchOrder | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<BranchOrder | null>(null);

  const canManageOrderStatus = currentUser.role === 'PURCHASE_HOLDING';
  const effectiveBranchId = branchId === 'all' ? 'pusat-sumbawa' : branchId;
  const currentBranchName = branchNameMap[effectiveBranchId] || 'Outlet Mergan';

  // Master selection handler
  const handleSelectMaster = (mId: string) => {
    setSelectedMasterId(mId);
    if (!mId) return;
    const m = masterBahan.find((item) => item.id === mId);
    if (m) {
      setCustomItemName(m.merekBarang);
      setItemCategory(m.kategori);
      setItemSatuan(m.satuan);
    }
  };

  const handleAddDraftItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !itemQty || Number(itemQty) <= 0) return;

    const newItem: BranchOrderItem = {
      merekBarang: customItemName.trim(),
      kategori: itemCategory,
      kuantitas: Number(itemQty),
      satuan: itemSatuan,
      catatan: itemNote.trim() || undefined,
    };

    setDraftItems([...draftItems, newItem]);
    setSelectedMasterId('');
    setCustomItemName('');
    setItemQty('');
    setItemNote('');
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(draftItems.filter((_, idx) => idx !== index));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      alert('Tambahkan minimal 1 item barang yang ingin diorder.');
      return;
    }

    const newOrder = StorageService.addBranchOrder({
      branchId: effectiveBranchId,
      tanggal: getTodayDateString(),
      pemohon: pemohon.trim() || currentUser.name,
      urgensi,
      status: 'MENUNGGU KONFIRMASI',
      items: draftItems,
      catatan: orderCatatan.trim() || undefined,
    });

    setDraftItems([]);
    setOrderCatatan('');
    setLastCreatedOrder(newOrder);
    setSuccessMsg(`Order ${newOrder.nomorOrder} berhasil diajukan ke Purchase Pusat! Siap untuk input order berikutnya.`);
    setTimeout(() => setSuccessMsg(''), 10000);
  };

  const generateEmailLink = (ord: BranchOrder) => {
    const bName = branchNameMap[ord.branchId] || ord.branchId;
    const subject = encodeURIComponent(`[ORDER BARANG MERGAN] - ${bName} - ${ord.nomorOrder}`);
    
    const itemListText = ord.items
      .map((it, idx) => `${idx + 1}. ${it.merekBarang} [${it.kategori}] : ${it.kuantitas} ${it.satuan}${it.catatan ? ` (${it.catatan})` : ''}`)
      .join('\n');

    const bodyText = encodeURIComponent(
      `Yth. Purchase Pusat Toko Kopi Mergan (${CENTRAL_PURCHASE_EMAIL}),\n\n` +
      `Berikut adalah pengajuan order barang & restock dari cabang kami:\n\n` +
      `Nomor Order : ${ord.nomorOrder}\n` +
      `Cabang Outlet : ${bName}\n` +
      `Tanggal Order : ${ord.tanggal}\n` +
      `Status Urgensi : ${ord.urgensi}\n` +
      `Pemohon : ${ord.pemohon}\n\n` +
      `DAFTAR BARANG YANG DIBUTUHKAN:\n` +
      `----------------------------------------\n` +
      `${itemListText}\n` +
      `----------------------------------------\n` +
      `Catatan Tambahan: ${ord.catatan || '-'}\n\n` +
      `Mohon untuk segera diproses dan diterbitkan Surat Jalan / PO Supplier.\n` +
      `Terima kasih.`
    );

    return `mailto:${CENTRAL_PURCHASE_EMAIL}?subject=${subject}&body=${bodyText}`;
  };

  const handleCopyOrderText = (ord: BranchOrder) => {
    const bName = branchNameMap[ord.branchId] || ord.branchId;
    const itemListText = ord.items
      .map((it, idx) => `${idx + 1}. ${it.merekBarang} : ${it.kuantitas} ${it.satuan}`)
      .join('\n');

    const text =
      `*ORDER BARANG TOKO KOPI MERGAN*\n` +
      `No. PO: ${ord.nomorOrder}\n` +
      `Cabang: ${bName}\n` +
      `Tgl: ${ord.tanggal}\n` +
      `Urgensi: ${ord.urgensi}\n` +
      `Pemohon: ${ord.pemohon}\n\n` +
      `*Item Barang:*\n${itemListText}\n\n` +
      `Catatan: ${ord.catatan || '-'}`;

    navigator.clipboard.writeText(text);
    setCopiedId(ord.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const isPurchaseTeam =
    currentUser.role === 'OWNER_HOLDING' ||
    currentUser.role === 'PURCHASE_HOLDING' ||
    currentUser.role === 'PURCHASE_CABANG';

  if (!isPurchaseTeam) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 text-center space-y-3 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold uppercase font-mono tracking-wide">
          Akses Terbatas: Khusus Tim Purchase
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          Formulir Pengajuan Order Barang hanya dapat diakses dan diisi oleh <strong>Tim Purchase Holding</strong> dan <strong>Tim Purchase Cabang</strong>.
        </p>
        <span className="text-[11px] text-neutral-500 block font-mono">
          Role Anda saat ini: <strong>{currentUser.role}</strong> ({currentUser.name})
        </span>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => isHoldingView || o.branchId === effectiveBranchId);

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Form Pengajuan Order Barang Cabang ke Purchase Pusat
            </h3>
            <p className="text-xs text-neutral-500">
              Setiap pengajuan otomatis masuk ke antrean Purchase Pusat dan terhubung ke email: <code className="text-amber-500 font-mono font-semibold">{CENTRAL_PURCHASE_EMAIL}</code>
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded border self-start md:self-auto ${theme.accentBgSoft}`}>
          {currentBranchName}
        </span>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {lastCreatedOrder && (
            <button
              type="button"
              onClick={() => setSelectedInvoiceOrder(lastCreatedOrder)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Lihat / Cetak Invoice PO ({lastCreatedOrder.nomorOrder})
            </button>
          )}
        </div>
      )}

      {/* Form Input Order (Accessible for branch users & purchase) */}
      {!isHoldingView && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Buat Formulir Pengajuan Barang Baru ({currentBranchName})
          </h4>

          {/* Step 1: Draft item form */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase block font-mono">
              1. Pilih / Masukkan Rincian Barang
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  PILIH DARI MASTER BAHAN BAKU MERGAN
                </label>
                <select
                  value={selectedMasterId}
                  onChange={(e) => handleSelectMaster(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">-- Pilih dari Katalog Bahan Baku Mergan --</option>
                  {masterBahan.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.kategori}] {m.merekBarang} ({m.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  NAMA BARANG KUSTOM (JIKA TIDAK ADA)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Biji Kopi Flores Bajawa 1kg"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  KUANTITAS DIBUTUHKAN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="Contoh: 5"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  SATUAN UNIT
                </label>
                <input
                  type="text"
                  placeholder="kg / dus / pcs / crtn"
                  value={itemSatuan}
                  onChange={(e) => setItemSatuan(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  CATATAN ITEM
                </label>
                <input
                  type="text"
                  placeholder="Sisa stok tipis, permintaan ramai..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleAddDraftItem}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Daftar Order</span>
              </button>
            </div>
          </div>

          {/* List of draft items */}
          {draftItems.length > 0 && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 font-bold text-xs text-neutral-700 dark:text-neutral-300">
                Item Dalam Pengajuan Ini ({draftItems.length} barang):
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 text-xs">
                {draftItems.map((it, idx) => (
                  <li key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{it.merekBarang}</span>
                      <span className="text-neutral-500 ml-2">({it.kategori})</span>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Kuantitas: <strong className="text-neutral-800 dark:text-neutral-200">{it.kuantitas} {it.satuan}</strong>
                        {it.catatan && ` · Note: ${it.catatan}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftItem(idx)}
                      className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 2: Urgensi & Submit */}
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                TINGKAT URGENSI <span className="text-rose-500">*</span>
              </label>
              <select
                value={urgensi}
                onChange={(e) => setUrgensi(e.target.value as BranchOrder['urgensi'])}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="Biasa">Biasa (Jadwal Pengiriman Reguler)</option>
                <option value="Mendesak / Stok Kritis">Mendesak / Stok Kritis (Segera Kirim)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                NAMA PEMOHON / PENANGGUNG JAWAB <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pemohon}
                onChange={(e) => setPemohon(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                CATATAN UNTUK PURCHASE PUSAT
              </label>
              <input
                type="text"
                placeholder="Catatan jadwal terima barang..."
                value={orderCatatan}
                onChange={(e) => setOrderCatatan(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="md:col-span-3 flex justify-start pt-1">
              <button
                type="submit"
                disabled={draftItems.length === 0}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors ${
                  draftItems.length > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pengajuan Order ke Purchase Pusat</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table: History of Branch Orders */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Daftar Pengajuan Order Barang Masuk ({filteredOrders.length})
          </h4>
          <span className="text-xs text-neutral-500">
            Terhubung ke email purchase pusat: {CENTRAL_PURCHASE_EMAIL}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">No. Order & Tgl</th>
                {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                <th className="px-4 py-3">Rincian Barang</th>
                <th className="px-4 py-3">Urgensi</th>
                <th className="px-4 py-3">Pemohon</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi / Kirim Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Belum ada pengajuan order barang yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isUrgent = ord.urgensi.includes('Mendesak');
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 block">
                          {ord.nomorOrder}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {formatTanggalShort(ord.tanggal)}
                        </span>
                      </td>

                      {isHoldingView && (
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-700 dark:text-neutral-300">
                          {branchNameMap[ord.branchId] || ord.branchId}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {ord.items.map((it, i) => (
                            <div key={i} className="text-[11px]">
                              <strong className="text-neutral-900 dark:text-neutral-100">{it.merekBarang}</strong>: {it.kuantitas} {it.satuan}
                              {it.catatan && <span className="text-neutral-400 italic"> ({it.catatan})</span>}
                            </div>
                          ))}
                        </div>
                        {ord.catatan && (
                          <div className="text-[10px] text-neutral-400 mt-1 italic">
                            Ket: {ord.catatan}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isUrgent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>MENDESAK</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            Biasa
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                        {ord.pemohon}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {canManageOrderStatus ? (
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              StorageService.updateOrderStatus(ord.id, e.target.value as BranchOrder['status'])
                            }
                            className="text-[11px] font-semibold px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                          >
                            <option value="MENUNGGU KONFIRMASI">MENUNGGU</option>
                            <option value="DIPROSES PURCHASE">DIPROSES</option>
                            <option value="SELESAI / TERKIRIM">SELESAI</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'SELESAI / TERKIRIM'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : ord.status === 'DIPROSES PURCHASE'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {ord.status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Invoice Order */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                            title="Cetak Invoice / Bukti Purchase Order Resmi"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="hidden sm:inline">Cetak Invoice</span>
                          </button>

                          {/* Send to Central Purchase Email */}
                          <a
                            href={generateEmailLink(ord)}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 flex items-center gap-1 text-[11px] font-medium"
                            title="Buka email dan kirim notifikasi ke coffeemergan@gmail.com"
                          >
                            <Mail className="w-3.5 h-3.5 text-sky-500" />
                            <span className="hidden sm:inline">Kirim Email</span>
                          </a>

                          {/* Copy WhatsApp text */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrderText(ord)}
                            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Salin teks order untuk WhatsApp / Chat"
                          >
                            {copiedId === ord.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal */}
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
