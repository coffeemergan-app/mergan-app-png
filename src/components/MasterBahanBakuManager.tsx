import React, { useState } from 'react';
import { MasterBahanBaku, ExpenseCategory, BranchTheme, User } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah } from '../utils/formatters';
import { Plus, Edit2, Trash2, Search, Check, X, Database, ShieldAlert } from 'lucide-react';

interface MasterBahanBakuManagerProps {
  masterBahan: MasterBahanBaku[];
  theme: BranchTheme;
  currentUser: User;
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

export const MasterBahanBakuManager: React.FC<MasterBahanBakuManagerProps> = ({
  masterBahan,
  theme,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Add item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newKategori, setNewKategori] = useState<ExpenseCategory>('Beans');
  const [newHarga, setNewHarga] = useState<number | ''>('');
  const [newSatuan, setNewSatuan] = useState('kg');
  const [newSupplier, setNewSupplier] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<MasterBahanBaku | null>(null);

  const isPurchase = currentUser.role === 'PURCHASE_HOLDING' || currentUser.role === 'PURCHASE_CABANG';

  const filteredItems = masterBahan.filter((item) => {
    const matchesSearch =
      item.merekBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tempatPembelian.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.kategori === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newHarga || Number(newHarga) <= 0) return;

    StorageService.addMasterBahanBaku({
      merekBarang: newNama.trim(),
      kategori: newKategori,
      hargaSatuan: Number(newHarga),
      satuan: newSatuan,
      tempatPembelian: newSupplier.trim() || 'Supplier Lokal',
    });

    setNewNama('');
    setNewHarga('');
    setNewSupplier('');
    setShowAddForm(false);
  };

  const handleStartEdit = (item: MasterBahanBaku) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    StorageService.updateMasterBahanBaku(editingItem);
    setEditingItem(null);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Hapus master bahan baku "${nama}"?`)) {
      StorageService.deleteMasterBahanBaku(id);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Master Data Bahan Baku & Harga Standar Pembelian
            </h3>
            <p className="text-xs text-neutral-500">
              Kelola daftar bahan, penyesuaian harga satuan standar, satuan unit, dan supplier utama
            </p>
          </div>
        </div>

        {isPurchase && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku Baru</span>
          </button>
        )}
      </div>

      {!isPurchase && (
        <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Mode Lihat: Penambahan dan pengeditan master data bahan baku dikhususkan untuk tim <strong>Purchase</strong>.
          </span>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Form Tambah Bahan Baku Baru
          </h4>
          <form onSubmit={handleAddNew} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                NAMA / MEREK BARANG <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Susu Oatly Barista Edition 1L"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                KATEGORI
              </label>
              <select
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value as ExpenseCategory)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                HARGA SATUAN STANDAR (IDR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={newHarga}
                onChange={(e) => setNewHarga(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                SATUAN UNIT
              </label>
              <select
                value={newSatuan}
                onChange={(e) => setNewSatuan(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                {SATUAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                TEMPAT PEMBELIAN / SUPPLIER
              </label>
              <input
                type="text"
                placeholder="Contoh: Lancar Jaya / Shopee"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="md:col-span-3 flex justify-start gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer"
              >
                Simpan Bahan Baku
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari nama bahan, supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Master Items Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Nama / Merek Bahan Baku</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Satuan Standar</th>
                <th className="px-4 py-3 text-center">Satuan Unit</th>
                <th className="px-4 py-3">Tempat Pembelian / Supplier</th>
                {isPurchase && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Tidak ada bahan baku yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingItem?.id === item.id;
                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-amber-50/50 dark:bg-amber-950/20">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingItem.merekBarang}
                            onChange={(e) => setEditingItem({ ...editingItem, merekBarang: e.target.value })}
                            className="w-full text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-semibold"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editingItem.kategori}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, kategori: e.target.value as ExpenseCategory })
                            }
                            className="w-full text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={editingItem.hargaSatuan}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, hargaSatuan: Number(e.target.value) || 0 })
                            }
                            className="w-28 text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-right"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <select
                            value={editingItem.satuan}
                            onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                          >
                            {SATUAN_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingItem.tempatPembelian}
                            onChange={(e) => setEditingItem({ ...editingItem, tempatPembelian: e.target.value })}
                            className="w-full text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                          />
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan Perubahan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="p-1 rounded bg-neutral-200 text-neutral-700 hover:bg-neutral-300 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.merekBarang}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums font-bold text-neutral-800 dark:text-neutral-200">
                        {formatRupiah(item.hargaSatuan)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-neutral-600 dark:text-neutral-400">
                        {item.satuan}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {item.tempatPembelian}
                      </td>
                      {isPurchase && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 rounded text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Edit item ini"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.merekBarang)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Hapus item ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
