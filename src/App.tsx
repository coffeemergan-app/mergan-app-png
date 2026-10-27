import React, { useState, useEffect } from 'react';
import { User, Branch, ShiftRekap, DailyExpense, BranchOrder, MasterBahanBaku, Employee } from './types';
import { StorageService } from './services/storage';
import { getTheme, BranchTheme } from './utils/theme';
import { getTodayDateString } from './utils/formatters';

// Components
import { Navbar, AppTab } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { BudgetAlertBanner } from './components/BudgetAlertBanner';
import { FormRekapKasir } from './components/FormRekapKasir';
import { FormAbsenKaryawan } from './components/FormAbsenKaryawan';
import { TableRekapKasir } from './components/TableRekapKasir';
import { FormBelanjaHarian } from './components/FormBelanjaHarian';
import { TableBelanjaHarian } from './components/TableBelanjaHarian';
import { TableRekapBahanBulanan } from './components/TableRekapBahanBulanan';
import { FormOrderBarangCabang } from './components/FormOrderBarangCabang';
import { MasterBahanBakuManager } from './components/MasterBahanBakuManager';
import { AccessManagementSettings } from './components/AccessManagementSettings';
import { HoldingDashboardView } from './components/HoldingDashboardView';
import { BranchOwnerDashboardView } from './components/BranchOwnerDashboardView';
import { AbsensiPayrollView } from './components/AbsensiPayrollView';
import { ExportModal } from './components/ExportModal';

import { MapPin, Receipt, CalendarCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [branches, setBranches] = useState<Branch[]>(() => StorageService.getBranches());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [masterBahan, setMasterBahan] = useState<MasterBahanBaku[]>(() => StorageService.getMasterBahanBaku());
  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees());
  const [activeBranchId, setActiveBranchId] = useState<string>('pusat-sumbawa');
  const [activeTab, setActiveTab] = useState<AppTab>('REKAP');
  const [rekapFormMode, setRekapFormMode] = useState<'KASIR' | 'ABSEN'>('KASIR');
  
  // Data State
  const [shifts, setShifts] = useState<ShiftRekap[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  
  // UI Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState<number | ''>('');

  // Sync state with storage
  const syncData = () => {
    setShifts(StorageService.getShifts());
    setExpenses(StorageService.getExpenses());
    setOrders(StorageService.getOrders());
    setBranches(StorageService.getBranches());
    setUsers(StorageService.getUsers());
    setMasterBahan(StorageService.getMasterBahanBaku());
    setEmployees(StorageService.getEmployees());
    const latestUser = StorageService.getCurrentUser();
    if (latestUser) {
      setCurrentUser(latestUser);
    }
  };

  useEffect(() => {
    syncData();
    const unsubscribe = StorageService.subscribe(syncData);
    return () => unsubscribe();
  }, []);

  // Set default view based on user role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'OWNER_HOLDING' || currentUser.role === 'PURCHASE_HOLDING') {
        setActiveBranchId('all');
        setActiveTab('HOLDING');
      } else {
        setActiveBranchId(currentUser.branchId);
        if (currentUser.role === 'KEPALA_TOKO') {
          setActiveTab('REKAP');
        } else if (currentUser.role === 'PURCHASE_CABANG') {
          setActiveTab('BELANJA');
        } else {
          setActiveTab('DASHBOARD_CABANG');
        }
      }
    }
  }, [currentUser]);

  // Strict route/tab security guard:
  // KEPALA_TOKO is permitted to: DASHBOARD_CABANG, REKAP, PAYROLL_ABSEN
  // PURCHASE_CABANG is permitted to: DASHBOARD_CABANG, BELANJA
  // OWNER_CABANG is permitted to: DASHBOARD_CABANG, REKAP, BELANJA, PAYROLL_ABSEN (Read-Only)
  useEffect(() => {
    if (!currentUser) return;
    if (
      currentUser.role === 'KEPALA_TOKO' &&
      activeTab !== 'DASHBOARD_CABANG' &&
      activeTab !== 'REKAP' &&
      activeTab !== 'PAYROLL_ABSEN'
    ) {
      setActiveTab('DASHBOARD_CABANG');
    } else if (
      currentUser.role === 'PURCHASE_CABANG' &&
      activeTab !== 'DASHBOARD_CABANG' &&
      activeTab !== 'BELANJA' &&
      activeTab !== 'ORDER'
    ) {
      setActiveTab('DASHBOARD_CABANG');
    } else if (
      currentUser.role === 'OWNER_CABANG' &&
      (activeTab === 'HOLDING' || activeTab === 'SETTINGS' || activeTab === 'ORDER' || activeTab === 'MASTER')
    ) {
      setActiveTab('DASHBOARD_CABANG');
    }
  }, [currentUser, activeTab]);

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Branch Name Dictionary (3 Cabang)
  const branchNameMap: Record<string, string> = {
    all: 'Holding Konsolidasi',
    ...branches.reduce((acc, b) => ({ ...acc, [b.id]: b.shortName }), {}),
  };

  // Branch Theme
  const theme: BranchTheme = getTheme(activeBranchId);
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  // Check Role Permissions
  const isOwnerHolding = currentUser.role === 'OWNER_HOLDING';
  const isPurchaseHolding = currentUser.role === 'PURCHASE_HOLDING';
  const isOwnerCabang = currentUser.role === 'OWNER_CABANG';
  const isKepalaToko = currentUser.role === 'KEPALA_TOKO';
  const isPurchaseCabang = currentUser.role === 'PURCHASE_CABANG';
  // Permission Checks:
  // Kepala Toko: HANYA Rekap Kasir, Absensi, dan Payroll
  // Purchase Cabang: HANYA Belanja Harian
  // Owner Holding & Owner Cabang: Mode Audit Eksekutif (Read-Only)
  // Purchase Holding: Observes all data, menerima/mengedit order barang pusat
  const canInputRekap = isKepalaToko;
  const canInputBelanja = isPurchaseCabang || isPurchaseHolding;
  const canAdjustLimit = isOwnerHolding || isPurchaseHolding || isOwnerCabang;

  // Filter Data for Active View
  const viewShifts = activeBranchId === 'all'
    ? shifts
    : shifts.filter((s) => s.branchId === activeBranchId);

  const viewExpenses = activeBranchId === 'all'
    ? expenses
    : expenses.filter((e) => e.branchId === activeBranchId);

  // Today's Spending and Budget calculation
  const todayStr = getTodayDateString();
  const dailyBudgetLimit = StorageService.getBranchDailyBudget(activeBranchId);
  const currentDailySpent = StorageService.getDailySpendingForBranch(activeBranchId, todayStr);

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLimitInput && Number(newLimitInput) > 0) {
      StorageService.setBranchDailyBudget(activeBranchId, Number(newLimitInput));
      setShowLimitModal(false);
      setNewLimitInput('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Bar Header with Mergan Logo */}
      <Navbar
        currentUser={currentUser}
        branches={branches}
        activeBranchId={activeBranchId}
        onSelectBranch={(id) => {
          setActiveBranchId(id);
          if (id === 'all') setActiveTab('HOLDING');
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onOpenExport={() => setShowExportModal(true)}
        onLogout={() => {
          StorageService.logout();
          setCurrentUser(null);
        }}
        orders={orders}
      />

      {/* Atmospheric Branch Banner */}
      <div className={`border-b border-neutral-800 bg-linear-to-r ${theme.headerGradient} py-4 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${theme.accentBg} shrink-0 ring-2 ring-white/20`} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  {theme.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${theme.accentBgSoft}`}>
                  {theme.badgeLabel}
                </span>
              </div>
              <p className="text-xs text-neutral-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span>
                  {activeBranchId === 'all'
                    ? 'Pusat Kendali Holding (Cabang Ponorogo Sumbawa · Cabang Urip Sumoharjo · Cabang Madiun)'
                    : activeBranch?.address || 'Outlet Operasional'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-300">
              Pengguna: <strong className="text-white font-semibold">{currentUser.name}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport - Left Aligned Forms & Tables */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
        {/* Real-Time Budget Alert System Banner */}
        {activeBranchId !== 'all' && (
          <BudgetAlertBanner
            branchName={activeBranch?.shortName || 'Cabang'}
            dailySpent={currentDailySpent}
            dailyBudgetLimit={dailyBudgetLimit}
            dateStr={todayStr}
            canEditLimit={canAdjustLimit}
            onAdjustLimit={() => {
              setNewLimitInput(dailyBudgetLimit);
              setShowLimitModal(true);
            }}
          />
        )}

        {/* TAB: HOLDING DASHBOARD */}
        {activeTab === 'HOLDING' && (
          <HoldingDashboardView
            branches={branches}
            shifts={shifts}
            expenses={expenses}
            orders={orders}
            currentUser={currentUser}
            onSelectBranchView={(bId) => {
              setActiveBranchId(bId);
              setActiveTab('DASHBOARD_CABANG');
            }}
            onNavigateToOrders={() => setActiveTab('ORDER')}
            onNavigateToPayroll={() => setActiveTab('PAYROLL_ABSEN')}
          />
        )}

        {/* TAB: DASBOR OWNER CABANG */}
        {activeTab === 'DASHBOARD_CABANG' && activeBranch && (
          <BranchOwnerDashboardView
            branch={activeBranch}
            theme={theme}
            shifts={shifts}
            expenses={expenses}
            orders={orders}
            currentUser={currentUser}
            dailyBudgetLimit={dailyBudgetLimit}
            onNavigateToRekap={() => setActiveTab('REKAP')}
            onNavigateToBelanja={() => setActiveTab('BELANJA')}
            onNavigateToOrder={() => setActiveTab('ORDER')}
            onNavigateToPayroll={() => setActiveTab('PAYROLL_ABSEN')}
            onAdjustLimit={
              canAdjustLimit
                ? () => {
                    setNewLimitInput(dailyBudgetLimit);
                    setShowLimitModal(true);
                  }
                : undefined
            }
            onOpenExport={() => setShowExportModal(true)}
          />
        )}

        {/* TAB: REKAP SHIFT KASIR */}
        {activeTab === 'REKAP' && (
          <div className="space-y-6 text-left">
            {/* Form Selector for Kepala Toko: Rekap Kasir vs Absen Karyawan */}
            {activeBranchId !== 'all' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRekapFormMode('KASIR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      rekapFormMode === 'KASIR'
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Rekap Keuangan Kasir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapFormMode('ABSEN')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      rekapFormMode === 'ABSEN'
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. Form Absen Karyawan Shift</span>
                  </button>
                </div>

                <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                  Outlet: <strong>{branchNameMap[activeBranchId]}</strong>
                </span>
              </div>
            )}

            {/* Form Rekap Kasir */}
            {activeBranchId !== 'all' && rekapFormMode === 'KASIR' && (
              <FormRekapKasir
                branchId={activeBranchId}
                theme={theme}
                currentUser={currentUser}
                canInput={canInputRekap}
              />
            )}

            {/* Form Absen Karyawan */}
            {activeBranchId !== 'all' && rekapFormMode === 'ABSEN' && (
              <FormAbsenKaryawan
                branchId={activeBranchId}
                theme={theme}
                currentUser={currentUser}
                canInput={canInputRekap}
                employees={employees}
                branchName={branchNameMap[activeBranchId]}
              />
            )}

            {/* Shift History Table with Month & Year filter and Edit/Delete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                  Riwayat Rekap Keuangan Kasir Per Shift
                </h3>
                <span className="text-xs text-neutral-500">
                  {viewShifts.length} Sesi Shift Kasir Tercatat
                </span>
              </div>
              <TableRekapKasir
                shifts={viewShifts}
                theme={theme}
                currentUser={currentUser}
                branchNameMap={branchNameMap}
                isHoldingView={activeBranchId === 'all'}
              />
            </div>
          </div>
        )}

        {/* TAB: BELANJA HARIAN & OPERASIONAL */}
        {activeTab === 'BELANJA' && (
          <div className="space-y-6 text-left">
            {/* Form Belanja Harian (HANYA untuk Tim Purchase, dihilangkan untuk seluruh Kepala Cabang / Owner) */}
            {activeBranchId !== 'all' && canInputBelanja && (
              <FormBelanjaHarian
                branchId={activeBranchId}
                theme={theme}
                currentUser={currentUser}
                dailyBudgetLimit={dailyBudgetLimit}
                currentDailySpent={currentDailySpent}
                canInput={canInputBelanja}
              />
            )}

            {/* Monthly Recap Table per Item as explicitly requested */}
            <TableRekapBahanBulanan
              expenses={viewExpenses}
              theme={theme}
              branchName={activeBranch?.name || 'Holding 3 Cabang'}
            />

            {/* Table Belanja Harian Details with Month & Year Filter and Edit/Delete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                  Daftar Transaksi Belanja & Biaya Operasional Lengkap
                </h3>
                <span className="text-xs text-neutral-500">
                  Total {viewExpenses.length} Nota Pembelian
                </span>
              </div>
              <TableBelanjaHarian
                expenses={viewExpenses}
                theme={theme}
                currentUser={currentUser}
                branchNameMap={branchNameMap}
                isHoldingView={activeBranchId === 'all'}
              />
            </div>
          </div>
        )}

        {/* TAB: ORDER BARANG CABANG KE PURCHASE PUSAT */}
        {activeTab === 'ORDER' && (
          <FormOrderBarangCabang
            branchId={activeBranchId}
            theme={theme}
            currentUser={currentUser}
            orders={orders}
            masterBahan={masterBahan}
            branchNameMap={branchNameMap}
            isHoldingView={activeBranchId === 'all'}
            branches={branches}
          />
        )}

        {/* TAB: MASTER BAHAN BAKU (51 ITEM) */}
        {activeTab === 'MASTER' && (
          <MasterBahanBakuManager
            masterBahan={masterBahan}
            theme={theme}
            currentUser={currentUser}
          />
        )}

        {/* TAB: ABSENSI KARYAWAN & SISTEM PENGGAJIAN (PAYROLL) */}
        {activeTab === 'PAYROLL_ABSEN' && (
          <AbsensiPayrollView
            activeBranchId={activeBranchId}
            theme={theme}
            currentUser={currentUser}
            branches={branches}
            branchNameMap={branchNameMap}
          />
        )}

        {/* TAB: PENGATURAN AKSES & AKUN (ID, PW, ALAMAT CABANG) */}
        {activeTab === 'SETTINGS' && (
          <AccessManagementSettings
            currentUser={currentUser}
            branches={branches}
            users={users}
            theme={theme}
          />
        )}
      </main>

      {/* Export Modal (PDF & Excel) */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        branches={branches}
        activeBranchId={activeBranchId}
        shifts={shifts}
        expenses={expenses}
      />

      {/* Adjust Daily Budget Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xl text-left">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Sesuaikan Batas Anggaran Harian
            </h4>
            <p className="text-xs text-neutral-500 mb-4">
              Tentukan pagu batas belanja harian untuk {branchNameMap[activeBranchId]}
            </p>

            <form onSubmit={handleUpdateLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  BATAS ANGGARAN (IDR)
                </label>
                <input
                  type="number"
                  min="100000"
                  step="50000"
                  value={newLimitInput}
                  onChange={(e) => setNewLimitInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Simpan Batas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Footer with Mergan Logo */}
      <footer className="border-t border-neutral-800 py-4 px-6 text-xs text-neutral-400 bg-neutral-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <img
              src="./assets/aistudio/logo_mergan_headroom_76c6dae8.png"
              alt="Logo Toko Kopi Mergan"
              className="h-6 w-auto object-contain brightness-95 opacity-80"
            />
            <span className="text-[11px] text-neutral-400">
              © 2026 <strong>TOKO KOPI MERGAN</strong> · Ponorogo Sumbawa · Ponorogo Urip · Madiun
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            Sistem Rekap Kasir, Pengadaan Bahan Baku & Order Pusat (coffeemergan@gmail.com)
          </span>
        </div>
      </footer>
    </div>
  );
}
