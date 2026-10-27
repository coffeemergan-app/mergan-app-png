import React from 'react';
import { User, Branch, BranchTheme, BranchOrder } from '../types';
import { Download, LogOut, ChevronDown, ShoppingCart, Settings, Database, Layers, Receipt, ShieldCheck, LayoutDashboard, Users } from 'lucide-react';

export type AppTab = 'HOLDING' | 'DASHBOARD_CABANG' | 'REKAP' | 'BELANJA' | 'ORDER' | 'MASTER' | 'PAYROLL_ABSEN' | 'SETTINGS';

interface NavbarProps {
  currentUser: User;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  theme: BranchTheme;
  onOpenExport: () => void;
  onLogout: () => void;
  orders: BranchOrder[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  branches,
  activeBranchId,
  onSelectBranch,
  activeTab,
  onSelectTab,
  onOpenExport,
  onLogout,
  orders,
}) => {
  const isOwnerHolding = currentUser.role === 'OWNER_HOLDING';
  const isPurchaseHolding = currentUser.role === 'PURCHASE_HOLDING';
  const isOwnerCabang = currentUser.role === 'OWNER_CABANG';
  const isKepalaToko = currentUser.role === 'KEPALA_TOKO';
  const isPurchaseCabang = currentUser.role === 'PURCHASE_CABANG';

  // Strict role-based navigation permissions:
  // KEPALA_TOKO: Dasbor Cabang, Rekap Kasir & Absensi/Payroll
  // PURCHASE_CABANG: Dasbor Cabang, Belanja Harian
  // OWNER_HOLDING: Holding Konsolidasi, Dasbor Cabang (Auditor), Semua data (Read-Only)
  // OWNER_CABANG: Dasbor Cabang (Auditor), Rekap Kasir, Belanja Harian, Payroll (Read-Only)
  // PURCHASE_HOLDING: Holding Konsolidasi, Dasbor Cabang, Order Pusat, Master Bahan, Belanja, Rekap
  const canSeeHolding = isOwnerHolding || isPurchaseHolding;
  const canSeeBranchDashboard = (isOwnerHolding || isOwnerCabang || isKepalaToko || isPurchaseCabang) && activeBranchId !== 'all';
  const canSeeRekap = isKepalaToko || isOwnerHolding || isOwnerCabang || isPurchaseHolding;
  const canSeeBelanja = isPurchaseCabang || isPurchaseHolding || isOwnerHolding || isOwnerCabang;
  const canSeeOrder = isPurchaseCabang || isPurchaseHolding || isOwnerHolding;
  const canSeeMaster = isPurchaseHolding || isOwnerHolding;
  const canSeePayrollAbsen = isKepalaToko || isOwnerHolding || isOwnerCabang || isPurchaseHolding;
  const canSeeSettings = isOwnerHolding;

  const isHoldingUser = isOwnerHolding || isPurchaseHolding;
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  // Pending orders count for central purchase or branch
  const pendingOrdersCount = orders.filter((o) => {
    if (currentUser.role === 'PURCHASE_HOLDING' || currentUser.role === 'OWNER_HOLDING') {
      return o.status === 'MENUNGGU KONFIRMASI';
    }
    return o.branchId === currentUser.branchId && o.status === 'MENUNGGU KONFIRMASI';
  }).length;

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 text-neutral-100 shadow-sm text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Official Brand Wordmark Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="./assets/aistudio/logo_mergan_headroom_76c6dae8.png"
              alt="Logo Toko Kopi Mergan"
              className="h-9 w-auto object-contain brightness-105"
            />
            <div className="border-l border-neutral-800 pl-3">
              <span className="text-[11px] font-bold tracking-wider text-amber-400 font-mono block">
                FINANCIAL & KASIR
              </span>
              <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                {activeBranchId === 'all'
                  ? 'KONSOLIDASI 3 CABANG'
                  : activeBranch?.name || 'OUTLET RESMI'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-Line) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            {canSeeHolding && (
              <button
                onClick={() => onSelectTab('HOLDING')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'HOLDING'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Holding</span>
              </button>
            )}

            {/* Dedicated Branch Dashboard tab when viewing a branch */}
            {canSeeBranchDashboard && (
              <button
                onClick={() => onSelectTab('DASHBOARD_CABANG')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'DASHBOARD_CABANG'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Dasbor Cabang</span>
              </button>
            )}

            {canSeeRekap && (
              <button
                onClick={() => onSelectTab('REKAP')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'REKAP'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Rekap Kasir</span>
              </button>
            )}

            {canSeeBelanja && (
              <button
                onClick={() => onSelectTab('BELANJA')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'BELANJA'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Belanja Harian</span>
              </button>
            )}

            {canSeeOrder && (
              <button
                onClick={() => onSelectTab('ORDER')}
                className={`relative px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ORDER'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>Order Barang</span>
                {pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-bold rounded-full text-[10px]">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            )}

            {canSeeMaster && (
              <button
                onClick={() => onSelectTab('MASTER')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MASTER'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Bahan Baku (51)</span>
              </button>
            )}

            {canSeePayrollAbsen && (
              <button
                onClick={() => onSelectTab('PAYROLL_ABSEN')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PAYROLL_ABSEN'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Absensi & Payroll</span>
              </button>
            )}

            {canSeeSettings && (
              <button
                onClick={() => onSelectTab('SETTINGS')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'SETTINGS'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Branch Switcher & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Branch Switcher (Enabled for Holding users) */}
            {isHoldingUser ? (
              <div className="relative">
                <select
                  value={activeBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-hidden cursor-pointer appearance-none"
                >
                  <option value="all">Semua Cabang (Holding)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            ) : (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 text-neutral-300 border border-neutral-700">
                {activeBranch?.shortName}
              </span>
            )}

            {/* Export Trigger */}
            <button
              onClick={onOpenExport}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              title="Export Laporan Bulanan (PDF / Excel)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* User Pill & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-white leading-tight flex items-center justify-end gap-1">
                  <span>{currentUser.name.split(' (')[0]}</span>
                  {currentUser.role === 'OWNER_HOLDING' && (
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {currentUser.role}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden items-center justify-start py-2 border-t border-neutral-800 text-xs overflow-x-auto gap-1">
          {canSeeHolding && (
            <button
              onClick={() => onSelectTab('HOLDING')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'HOLDING' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Holding
            </button>
          )}
          {canSeeBranchDashboard && (
            <button
              onClick={() => onSelectTab('DASHBOARD_CABANG')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'DASHBOARD_CABANG' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Dasbor Cabang
            </button>
          )}
          {canSeeRekap && (
            <button
              onClick={() => onSelectTab('REKAP')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'REKAP' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Rekap Kasir
            </button>
          )}
          {canSeeBelanja && (
            <button
              onClick={() => onSelectTab('BELANJA')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'BELANJA' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Belanja
            </button>
          )}
          {canSeeOrder && (
            <button
              onClick={() => onSelectTab('ORDER')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap relative ${
                activeTab === 'ORDER' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Order {pendingOrdersCount > 0 ? `(${pendingOrdersCount})` : ''}
            </button>
          )}
          {canSeeMaster && (
            <button
              onClick={() => onSelectTab('MASTER')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'MASTER' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Bahan (51)
            </button>
          )}
          {canSeePayrollAbsen && (
            <button
              onClick={() => onSelectTab('PAYROLL_ABSEN')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'PAYROLL_ABSEN' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Absen & Payroll
            </button>
          )}
          {canSeeSettings && (
            <button
              onClick={() => onSelectTab('SETTINGS')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activeTab === 'SETTINGS' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Pengaturan
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
