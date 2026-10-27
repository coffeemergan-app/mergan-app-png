import React, { useState } from 'react';
import { User, Branch, UserRole, BranchTheme } from '../types';
import { StorageService } from '../services/storage';
import {
  Settings,
  Shield,
  User as UserIcon,
  Building,
  Key,
  Edit,
  Plus,
  Trash2,
  Check,
  Lock,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  ChevronDown,
  X,
} from 'lucide-react';

interface AccessManagementSettingsProps {
  currentUser: User;
  branches: Branch[];
  users: User[];
  theme: BranchTheme;
}

const SUPER_ADMIN_EMAIL = 'coffeemergan@gmail.com';

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string; badgeColor: string }[] = [
  {
    role: 'OWNER_HOLDING',
    label: 'Owner Holding',
    desc: 'Mode Audit Eksekutif holding (Read-Only seluruh transaksi 3 cabang) dan manajemen akun & hak akses.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  {
    role: 'PURCHASE_HOLDING',
    label: 'Purchase Holding',
    desc: 'Menerima, memproses & mengedit order barang (PO) cabang, belanja holding, serta master bahan baku (51 item).',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    role: 'OWNER_CABANG',
    label: 'Owner Cabang',
    desc: 'Mode Audit Eksekutif cabang (Read-Only dasbor analitik, rekap kasir, belanja, absensi & penggajian outlet).',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    role: 'KEPALA_TOKO',
    label: 'Kepala Toko',
    desc: 'Hanya Rekap Kasir (shift kasir & setor tunai 3-hari) serta Absensi & Sistem Penggajian (Payroll) karyawan.',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  },
  {
    role: 'PURCHASE_CABANG',
    label: 'Purchase Cabang',
    desc: 'Hanya Belanja Harian operasional dan monitoring pagu anggaran belanja cabang.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
];

export const AccessManagementSettings: React.FC<AccessManagementSettingsProps> = ({
  currentUser,
  branches,
  users,
  theme,
}) => {
  const isOwnerHolding = currentUser.role === 'OWNER_HOLDING' || currentUser.role === 'PURCHASE_HOLDING';

  // Default to USERS tab for holding users so they have immediate access to the list system
  const [activeTab, setActiveTab] = useState<'USERS' | 'PROFILE' | 'BRANCHES'>(
    isOwnerHolding ? 'USERS' : 'PROFILE'
  );

  // Search & Filter for User List
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Profile Edit State
  const [profileUsername, setProfileUsername] = useState(currentUser.username);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePin, setProfilePin] = useState(currentUser.passwordHint);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Edit / Add User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('KEPALA_TOKO');
  const [newBranchId, setNewBranchId] = useState('pusat-sumbawa');
  const [newPin, setNewPin] = useState('mergan123');

  // Quick PIN Edit Inline State
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState<string>('');

  // Edit Branch State
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Toast Notification
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotifMsg(msg);
    setTimeout(() => setNotifMsg(null), 3500);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername.trim() || !profilePin.trim()) return;

    StorageService.updateUser({
      ...currentUser,
      username: profileUsername.trim(),
      name: profileName.trim(),
      passwordHint: profilePin.trim(),
    });

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Instant list-based role updater (Owner Holding can change roles on the fly)
  const handleQuickRoleChange = (targetUser: User, newRole: UserRole) => {
    if (!isOwnerHolding) return;
    const updated: User = {
      ...targetUser,
      role: newRole,
      // If changing to holding role, set branch to 'all'
      branchId: newRole === 'OWNER_HOLDING' || newRole === 'PURCHASE_HOLDING' ? 'all' : targetUser.branchId === 'all' ? 'pusat-sumbawa' : targetUser.branchId,
    };
    StorageService.updateUser(updated);
    showNotif(`Hak akses ${targetUser.name} berhasil diubah menjadi "${newRole}"!`);
  };

  // Instant list-based branch updater
  const handleQuickBranchChange = (targetUser: User, newBranchId: string) => {
    if (!isOwnerHolding) return;
    const updated: User = {
      ...targetUser,
      branchId: newBranchId,
    };
    StorageService.updateUser(updated);
    showNotif(`Penugasan cabang untuk ${targetUser.name} berhasil diperbarui!`);
  };

  // Instant PIN save
  const handleSavePin = (targetUser: User) => {
    if (!tempPin.trim()) {
      setEditingPinUserId(null);
      return;
    }
    const updated: User = {
      ...targetUser,
      passwordHint: tempPin.trim(),
    };
    StorageService.updateUser(updated);
    setEditingPinUserId(null);
    setTempPin('');
    showNotif(`PIN/Password untuk ${targetUser.name} berhasil disimpan!`);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    StorageService.updateUser(editingUser);
    setEditingUser(null);
    showNotif('Data akun berhasil diperbarui!');
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPin.trim()) return;

    StorageService.updateUser({
      id: 'user-' + Date.now(),
      username: newUsername.trim(),
      name: newName.trim(),
      role: newRole,
      branchId: newRole === 'OWNER_HOLDING' || newRole === 'PURCHASE_HOLDING' ? 'all' : newBranchId,
      passwordHint: newPin.trim(),
    });

    setShowAddUser(false);
    setNewUsername('');
    setNewName('');
    setNewPin('mergan123');
    showNotif('Akun pengguna baru berhasil ditambahkan ke sistem!');
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      alert('Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      return;
    }
    if (confirm(`Hapus akun pengguna "${u.name}" (${u.username})? Tindakan ini tidak dapat dibatalkan.`)) {
      StorageService.deleteUser(u.id);
      showNotif(`Akun "${u.name}" telah dihapus dari sistem.`);
    }
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    StorageService.updateBranch(editingBranch);
    setEditingBranch(null);
    showNotif('Data outlet & alamat cabang berhasil diperbarui!');
  };

  // Filter users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBranch = branchFilter === 'ALL' || u.branchId === branchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  return (
    <div className="space-y-5 text-left">
      {/* Toast Notification */}
      {notifMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xl border border-neutral-700 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notifMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Pengaturan Akun & Hak Akses Pengguna
            </h3>
            <p className="text-xs text-neutral-500">
              Sistem kontrol otoritas multi-outlet Toko Kopi Mergan (Sumbawa, Madiun, Ponorogo).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'OWNER_HOLDING' && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Access: Owner Holding</span>
            </span>
          )}
          {currentUser.role === 'PURCHASE_HOLDING' && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Access: Purchase Holding</span>
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-4">
        {isOwnerHolding && (
          <button
            onClick={() => setActiveTab('USERS')}
            className={`pb-2.5 flex items-center gap-1.5 cursor-pointer border-b-2 transition-colors ${
              activeTab === 'USERS'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sistem List Hak Akses Karyawan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
              {users.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer border-b-2 transition-colors ${
            activeTab === 'PROFILE'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Profil Saya & Ganti PIN</span>
        </button>

        {isOwnerHolding && (
          <button
            onClick={() => setActiveTab('BRANCHES')}
            className={`pb-2.5 flex items-center gap-1.5 cursor-pointer border-b-2 transition-colors ${
              activeTab === 'BRANCHES'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Outlet & Alamat Cabang (3)</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SISTEM LIST HAK AKSES KARYAWAN (EDITABLE ON THE FLY)    */}
      {/* ============================================================== */}
      {activeTab === 'USERS' && isOwnerHolding && (
        <div className="space-y-4">
          {/* Header & Quick Add */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Sistem List Hak Akses & Peran Karyawan
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Owner Holding dapat merubah peran, cabang, dan kata sandi seluruh pengguna sewaktu-waktu secara langsung.
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          {/* Quick Add Form Drawer */}
          {showAddUser && (
            <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase font-mono">
                  Form Tambah Akun & Otoritas Baru
                </h5>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddNewUser} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    USERNAME (ID LOGIN)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: kasir.madiun / kepala.baru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    NAMA LENGKAP KARYAWAN
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Staf / PIC"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    KATA SANDI / PIN
                  </label>
                  <input
                    type="text"
                    placeholder="mergan123"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    PERAN / HAK AKSES
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    PENUGASAN CABANG OUTLET
                  </label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                  >
                    <option value="all">Holding (Semua Cabang)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-start gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer shadow-xs"
                  >
                    Simpan Akun Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filters */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari staf, username..."
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                />
              </div>

              {/* Filter Role */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Peran</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Filter Branch */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Cabang</option>
                <option value="all">Holding</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono">
              Menampilkan {filteredUsers.length} dari {users.length} akun terdaftar
            </div>
          </div>

          {/* Interactive List-Based Users Management Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Karyawan / Akun</th>
                    <th className="px-4 py-3">Username (Login ID)</th>
                    <th className="px-4 py-3">Peran / Hak Akses (Ubah Langsung)</th>
                    <th className="px-4 py-3">Penugasan Cabang</th>
                    <th className="px-4 py-3">Kata Sandi / PIN</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const isEditingPin = editingPinUserId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        {/* Name & Initials */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                ID: {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Username ID */}
                        <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {u.username}
                        </td>

                        {/* Interactive Role Dropdown (Instant Change on the fly) */}
                        <td className="px-4 py-3">
                          <div className="relative min-w-[210px]">
                            <select
                              value={u.role}
                              onChange={(e) => handleQuickRoleChange(u, e.target.value as UserRole)}
                              className="w-full text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer appearance-none shadow-2xs"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.role} value={r.role}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
                          </div>
                        </td>

                        {/* Interactive Branch Assignment Dropdown */}
                        <td className="px-4 py-3">
                          <div className="relative min-w-[160px]">
                            <select
                              value={u.branchId}
                              onChange={(e) => handleQuickBranchChange(u, e.target.value)}
                              className="w-full text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-pointer appearance-none shadow-2xs"
                            >
                              <option value="all">Holding (Semua Cabang)</option>
                              {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.shortName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
                          </div>
                        </td>

                        {/* Password / PIN Inline Editor */}
                        <td className="px-4 py-3">
                          {isEditingPin ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempPin}
                                onChange={(e) => setTempPin(e.target.value)}
                                className="w-24 px-2 py-1 text-xs font-mono rounded border border-amber-400 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePin(u)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Simpan PIN"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPinUserId(null)}
                                className="p-1 rounded bg-neutral-200 text-neutral-700 hover:bg-neutral-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                {u.passwordHint}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPinUserId(u.id);
                                  setTempPin(u.passwordHint);
                                }}
                                className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline"
                              >
                                Ubah PIN
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isSelf ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer transition-colors"
                                title="Hapus akun pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">Login Saat Ini</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Explanations Info Cards */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono block">
              Panduan Hak Akses Sistem Toko Kopi Mergan:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {ROLE_OPTIONS.map((r) => (
                <div
                  key={r.role}
                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[11px]">
                      {r.label}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${r.badgeColor}`}>
                      {r.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PROFIL SAYA & GANTI PIN                                 */}
      {/* ============================================================== */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-xl space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Ubah Data Profil & Kata Sandi Login Anda
          </h4>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Username dan Kata Sandi Anda berhasil diperbarui!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                NAMA LENGKAP
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                USERNAME (USER ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                KATA SANDI / PIN BARU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profilePin}
                onChange={(e) => setProfilePin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                required
              />
              <p className="mt-1 text-[11px] text-neutral-400">
                Gunakan kata sandi yang mudah diingat untuk login operasional shift Anda.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-[11px] text-neutral-500">
              Peran Akun: <strong>{currentUser.role}</strong> · Cabang:{' '}
              <strong>{currentUser.branchId}</strong>
            </div>

            <div className="flex justify-start pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Akun</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: KELOLA ALAMAT & OUTLET CABANG                           */}
      {/* ============================================================== */}
      {activeTab === 'BRANCHES' && isOwnerHolding && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Daftar Outlet Cabang Resmi & Alamat Operasional
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => {
              const isEditing = editingBranch?.id === b.id;
              if (isEditing) {
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm space-y-3"
                  >
                    <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                      Edit Outlet: {b.shortName}
                    </h5>
                    <form onSubmit={handleSaveEditBranch} className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase">Nama Resmi Cabang</label>
                        <input
                          type="text"
                          value={editingBranch.name}
                          onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase">Nama Pendek</label>
                        <input
                          type="text"
                          value={editingBranch.shortName}
                          onChange={(e) => setEditingBranch({ ...editingBranch, shortName: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase">Alamat Lengkap</label>
                        <textarea
                          rows={2}
                          value={editingBranch.address}
                          onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase">Kota</label>
                        <input
                          type="text"
                          value={editingBranch.city}
                          onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingBranch(null)}
                          className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs font-semibold rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                        {b.shortName}
                      </span>
                      <button
                        onClick={() => setEditingBranch({ ...b })}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                        title="Edit Alamat Cabang"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      {b.name}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {b.address}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Kota: {b.city}</span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      ID: {b.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
