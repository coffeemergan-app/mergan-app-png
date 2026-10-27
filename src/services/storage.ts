import { User, ShiftRekap, DailyExpense, BranchBudget, Branch, MasterBahanBaku, BranchOrder, SetorTunai3HariRecord, Employee, AttendanceRecord, PayrollRecord } from '../types';
import { USERS, INITIAL_SHIFTS, INITIAL_EXPENSES, INITIAL_BUDGETS, BRANCHES } from '../data/initialData';
import { MASTER_BAHAN_BAKU } from '../data/masterBahanBaku';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE } from '../data/initialEmployees';

const STORAGE_KEYS = {
  CURRENT_USER: 'tkm_current_user',
  USERS: 'tkm_users_list',
  BRANCHES: 'tkm_branches_list',
  SHIFTS: 'tkm_shifts_rekap',
  EXPENSES: 'tkm_daily_expenses',
  MASTER_BAHAN: 'tkm_master_bahan_baku',
  BRANCH_ORDERS: 'tkm_branch_orders',
  BUDGETS: 'tkm_branch_budgets',
  ACTIVE_BRANCH: 'tkm_active_branch_view',
  SETOR_TUNAI: 'tkm_setor_tunai_records',
  EMPLOYEES: 'tkm_employees_list',
  ATTENDANCE: 'tkm_attendance_records',
  PAYROLL: 'tkm_payroll_records',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Listener callback error', e);
    }
  });
}

const INITIAL_ORDERS: BranchOrder[] = [];

// Automatic one-time cleanup to ensure all recaps are empty as requested
const CLEAN_RECAP_VERSION = 'tkm_recaps_wiped_v1';
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  if (localStorage.getItem(CLEAN_RECAP_VERSION) !== 'true') {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.SETOR_TUNAI);
    localStorage.setItem(CLEAN_RECAP_VERSION, 'true');
  }
}

export const StorageService = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // USERS MANAGEMENT
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(USERS));
        return USERS;
      }
      return JSON.parse(data);
    } catch {
      return USERS;
    }
  },

  updateUser(user: User): { success: boolean; message?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index === -1) {
      users.push(user);
    } else {
      users[index] = user;
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // If current logged in user was modified, update their session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
    notifyAll();
    return { success: true };
  },

  deleteUser(userId: string): { success: boolean; message?: string } {
    const users = this.getUsers().filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyAll();
    return { success: true };
  },

  // AUTH
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyAll();
  },

  login(username: string, pin: string): { success: boolean; user?: User; message?: string } {
    const trimmedUser = username.trim().toLowerCase();
    const users = this.getUsers();
    const found = users.find((u) => u.username.toLowerCase() === trimmedUser);
    if (!found) {
      return { success: false, message: 'Username ID tidak ditemukan dalam sistem.' };
    }
    if (pin !== found.passwordHint) {
      return { success: false, message: 'Kata sandi / PIN tidak cocok. Silakan coba lagi.' };
    }
    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  // BRANCHES MANAGEMENT
  getBranches(): Branch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(BRANCHES));
        return BRANCHES;
      }
      return JSON.parse(data);
    } catch {
      return BRANCHES;
    }
  },

  updateBranch(updatedBranch: Branch): { success: boolean } {
    const branches = this.getBranches();
    const index = branches.findIndex((b) => b.id === updatedBranch.id);
    if (index >= 0) {
      branches[index] = updatedBranch;
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
      notifyAll();
    }
    return { success: true };
  },

  getActiveBranchView(user: User | null): string {
    if (!user) return 'pusat-sumbawa';
    if (user.branchId !== 'all') {
      return user.branchId;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH);
    return saved || 'all';
  },

  setActiveBranchView(branchId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH, branchId);
    notifyAll();
  },

  // SHIFTS REKAP
  getShifts(): ShiftRekap[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
        return INITIAL_SHIFTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SHIFTS;
    }
  },

  syncShiftBelanjaWithExpenses(branchId: string, tanggal: string): void {
    const shifts = this.getShifts();
    let hasChanges = false;
    const updated = shifts.map((s) => {
      if (s.branchId === branchId && s.tanggal === tanggal) {
        hasChanges = true;
        const newBelanja = this.getSpendingForBranchShift(branchId, tanggal, s.shift);
        const newTotalNet = Number(s.cash) + Number(s.qris) - newBelanja;
        return {
          ...s,
          belanjaKasir: newBelanja,
          totalNet: newTotalNet,
        };
      }
      return s;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
    }
  },

  addShift(shift: Omit<ShiftRekap, 'id' | 'createdAt' | 'totalNet'>): ShiftRekap {
    const shifts = this.getShifts();
    const autoBelanja = this.getSpendingForBranchShift(shift.branchId, shift.tanggal, shift.shift);
    const effectiveBelanja = autoBelanja > 0 ? autoBelanja : Number(shift.belanjaKasir) || 0;
    const totalNet = Number(shift.cash) + Number(shift.qris) - effectiveBelanja;

    const newEntry: ShiftRekap = {
      ...shift,
      belanjaKasir: effectiveBelanja,
      id: 'shift-' + Date.now(),
      totalNet,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...shifts];
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
    notifyAll();
    return newEntry;
  },

  updateShift(updatedShift: ShiftRekap, user: User | null): { success: boolean; message?: string } {
    if (user?.role === 'OWNER_HOLDING' || user?.role === 'OWNER_CABANG' || user?.role === 'PURCHASE_HOLDING') {
      return { success: false, message: 'Hak akses Anda adalah Read-Only (hanya Kepala Toko yang berwenang mengedit transaksi kasir).' };
    }
    const shifts = this.getShifts();
    const index = shifts.findIndex((s) => s.id === updatedShift.id);
    if (index === -1) return { success: false, message: 'Data tidak ditemukan.' };

    const autoBelanja = this.getSpendingForBranchShift(updatedShift.branchId, updatedShift.tanggal, updatedShift.shift);
    const effectiveBelanja = autoBelanja > 0 ? autoBelanja : Number(updatedShift.belanjaKasir) || 0;
    const totalNet = Number(updatedShift.cash) + Number(updatedShift.qris) - effectiveBelanja;

    shifts[index] = {
      ...updatedShift,
      belanjaKasir: effectiveBelanja,
      totalNet,
    };
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    notifyAll();
    return { success: true };
  },

  deleteShift(shiftId: string, user: User | null): { success: boolean; message?: string } {
    if (user?.role === 'OWNER_HOLDING' || user?.role === 'OWNER_CABANG' || user?.role === 'PURCHASE_HOLDING') {
      return { success: false, message: 'Hak akses Anda adalah Read-Only (hanya Kepala Toko yang berwenang menghapus transaksi kasir).' };
    }
    const shifts = this.getShifts().filter((s) => s.id !== shiftId);
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    notifyAll();
    return { success: true };
  },

  // DAILY EXPENSES
  getExpenses(): DailyExpense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
        return INITIAL_EXPENSES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  addExpense(expense: Omit<DailyExpense, 'id' | 'createdAt' | 'totalBiaya'>): DailyExpense {
    const expenses = this.getExpenses();
    const totalBiaya = Number(expense.hargaSatuan) * Number(expense.kuantitas);
    const newEntry: DailyExpense = {
      ...expense,
      id: 'exp-' + Date.now(),
      totalBiaya,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...expenses];
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    this.syncShiftBelanjaWithExpenses(expense.branchId, expense.tanggal);
    notifyAll();
    return newEntry;
  },

  updateExpense(updatedExpense: DailyExpense, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'PURCHASE_HOLDING' && user?.role !== 'PURCHASE_CABANG') {
      return { success: false, message: 'Hak akses Anda terbatas. Hanya Tim Purchase yang berwenang mengedit catatan belanja.' };
    }
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === updatedExpense.id);
    if (index === -1) return { success: false, message: 'Data pengeluaran tidak ditemukan.' };

    const totalBiaya = Number(updatedExpense.hargaSatuan) * Number(updatedExpense.kuantitas);
    expenses[index] = { ...updatedExpense, totalBiaya };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    this.syncShiftBelanjaWithExpenses(updatedExpense.branchId, updatedExpense.tanggal);
    notifyAll();
    return { success: true };
  },

  deleteExpense(expenseId: string, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'PURCHASE_HOLDING' && user?.role !== 'PURCHASE_CABANG') {
      return { success: false, message: 'Hak akses Anda terbatas. Hanya Tim Purchase yang berwenang menghapus catatan belanja.' };
    }
    const expenses = this.getExpenses();
    const target = expenses.find((e) => e.id === expenseId);
    const remaining = expenses.filter((e) => e.id !== expenseId);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remaining));

    if (target) {
      this.syncShiftBelanjaWithExpenses(target.branchId, target.tanggal);
    }
    notifyAll();
    return { success: true };
  },

  // MASTER BAHAN BAKU (Editable by Purchase)
  getMasterBahanBaku(): MasterBahanBaku[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTER_BAHAN);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.MASTER_BAHAN, JSON.stringify(MASTER_BAHAN_BAKU));
        return MASTER_BAHAN_BAKU;
      }
      return JSON.parse(data);
    } catch {
      return MASTER_BAHAN_BAKU;
    }
  },

  addMasterBahanBaku(item: Omit<MasterBahanBaku, 'id'>): MasterBahanBaku {
    const list = this.getMasterBahanBaku();
    const newItem: MasterBahanBaku = {
      ...item,
      id: 'mb-' + Date.now(),
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEYS.MASTER_BAHAN, JSON.stringify(updated));
    notifyAll();
    return newItem;
  },

  updateMasterBahanBaku(updatedItem: MasterBahanBaku): { success: boolean } {
    const list = this.getMasterBahanBaku();
    const index = list.findIndex((m) => m.id === updatedItem.id);
    if (index >= 0) {
      list[index] = updatedItem;
      localStorage.setItem(STORAGE_KEYS.MASTER_BAHAN, JSON.stringify(list));
      notifyAll();
    }
    return { success: true };
  },

  deleteMasterBahanBaku(id: string): { success: boolean } {
    const list = this.getMasterBahanBaku().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MASTER_BAHAN, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  // BRANCH ORDER REQUISITIONS (Form Order Cabang ke Pusat)
  getBranchOrders(): BranchOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCH_ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ORDERS;
    }
  },

  getOrders(): BranchOrder[] {
    return this.getBranchOrders();
  },

  addBranchOrder(order: Omit<BranchOrder, 'id' | 'nomorOrder' | 'createdAt'>): BranchOrder {
    const orders = this.getBranchOrders();
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const dateCode = order.tanggal.replace(/-/g, '');
    const nomorOrder = `PO-${dateCode}-${randomDigits}`;

    const newOrder: BranchOrder = {
      ...order,
      id: 'ord-' + Date.now(),
      nomorOrder,
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders];
    localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(updated));
    notifyAll();
    return newOrder;
  },

  updateOrderStatus(orderId: string, status: BranchOrder['status']): { success: boolean } {
    const orders = this.getBranchOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index >= 0) {
      orders[index].status = status;
      localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(orders));
      notifyAll();
    }
    return { success: true };
  },

  deleteBranchOrder(orderId: string): { success: boolean } {
    const orders = this.getBranchOrders().filter((o) => o.id !== orderId);
    localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(orders));
    notifyAll();
    return { success: true };
  },

  // BUDGETS & LIMITS
  getBudgets(): BranchBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
        return INITIAL_BUDGETS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BUDGETS;
    }
  },

  getBranchDailyBudget(branchId: string): number {
    const budgets = this.getBudgets();
    const b = budgets.find((item) => item.branchId === branchId);
    return b ? b.dailyBudgetLimit : 1500000;
  },

  setBranchDailyBudget(branchId: string, limit: number): void {
    const budgets = this.getBudgets();
    const index = budgets.findIndex((b) => b.branchId === branchId);
    if (index >= 0) {
      budgets[index].dailyBudgetLimit = limit;
    } else {
      budgets.push({ branchId, dailyBudgetLimit: limit });
    }
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    notifyAll();
  },

  getSpendingForBranchShift(branchId: string, dateStr: string, shift: string): number {
    const expenses = this.getExpenses();
    return expenses
      .filter(
        (e) =>
          (branchId === 'all' || e.branchId === branchId) &&
          e.tanggal === dateStr &&
          (e.shift === shift || (!e.shift && shift.includes('Shift 1')))
      )
      .reduce((sum, item) => sum + item.totalBiaya, 0);
  },

  getDailySpendingForBranch(branchId: string, dateStr: string): number {
    const expenses = this.getExpenses();
    return expenses
      .filter((e) => (branchId === 'all' || e.branchId === branchId) && e.tanggal === dateStr)
      .reduce((sum, item) => sum + item.totalBiaya, 0);
  },

  // LAPORAN SETOR TUNAI SETIAP 3 HARI (AWAL BULAN S/D AKHIR BULAN DARI NET KASIR)
  getSetorTunaiOverrides(): Record<string, Partial<SetorTunai3HariRecord>> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETOR_TUNAI);
      if (!data) {
        // Pre-populate sample deposit confirmations for earlier cycles
        const sampleOverrides: Record<string, Partial<SetorTunai3HariRecord>> = {
          'pusat-sumbawa-2026-10-C1': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-04',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-01',
            catatan: 'Setor tunai melalui CDM BCA Malang Sutoyo tepat waktu.',
          },
          'pusat-sumbawa-2026-10-C2': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-07',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-02',
            catatan: 'Setoran periode 4-6 Okt aman.',
          },
          'pusat-sumbawa-2026-10-C3': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-10',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-03',
            catatan: 'Slip setoran sudah diverifikasi finance holding.',
          },
          'pusat-sumbawa-2026-10-C4': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-13',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-04',
            catatan: 'Setor tunai via teller BCA.',
          },
          'pusat-sumbawa-2026-10-C5': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-16',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-05',
            catatan: 'Sesuai rekonsiliasi kasir.',
          },
          'pusat-sumbawa-2026-10-C6': {
            status: 'SUDAH_DISETOR',
            tanggalSetor: '2026-10-19',
            bankTujuan: 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
            disetorOleh: 'Tri Sutrisno (Kepala Toko Sumbawa)',
            nomorBukti: 'SLIP-BCA-202610-06',
            catatan: 'Setoran siklus 16-18 Oktober selesai.',
          },
        };
        localStorage.setItem(STORAGE_KEYS.SETOR_TUNAI, JSON.stringify(sampleOverrides));
        return sampleOverrides;
      }
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  saveSetorTunaiRecord(record: Partial<SetorTunai3HariRecord> & { id: string }): { success: boolean } {
    const overrides = this.getSetorTunaiOverrides();
    overrides[record.id] = {
      ...(overrides[record.id] || {}),
      ...record,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SETOR_TUNAI, JSON.stringify(overrides));
    notifyAll();
    return { success: true };
  },

  get3DayCashDepositCycles(branchId: string, year: number, month: number): SetorTunai3HariRecord[] {
    const shifts = this.getShifts();
    const overrides = this.getSetorTunaiOverrides();

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthLabel = monthShortNames[month - 1] || `${month}`;

    const cycles: SetorTunai3HariRecord[] = [];

    // 10 cycles covering day 1 to day 30/31 (or 28/29)
    // Siklus 1: 01-03, Siklus 2: 04-06, Siklus 3: 07-09, Siklus 4: 10-12, Siklus 5: 13-15,
    // Siklus 6: 16-18, Siklus 7: 19-21, Siklus 8: 22-24, Siklus 9: 25-27, Siklus 10: 28-akhir bulan
    const intervals: { cycleNumber: number; startDay: number; endDay: number }[] = [
      { cycleNumber: 1, startDay: 1, endDay: 3 },
      { cycleNumber: 2, startDay: 4, endDay: 6 },
      { cycleNumber: 3, startDay: 7, endDay: 9 },
      { cycleNumber: 4, startDay: 10, endDay: 12 },
      { cycleNumber: 5, startDay: 13, endDay: 15 },
      { cycleNumber: 6, startDay: 16, endDay: 18 },
      { cycleNumber: 7, startDay: 19, endDay: 21 },
      { cycleNumber: 8, startDay: 22, endDay: 24 },
      { cycleNumber: 9, startDay: 25, endDay: 27 },
      { cycleNumber: 10, startDay: 28, endDay: lastDayOfMonth },
    ];

    intervals.forEach(({ cycleNumber, startDay, endDay }) => {
      const startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      const labelPeriode = `${String(startDay).padStart(2, '0')} - ${String(endDay).padStart(2, '0')} ${monthLabel} ${year}`;
      const cycleId = `${branchId}-${year}-${month}-C${cycleNumber}`;

      // Aggregate cashier shift transactions in this branch and 3-day interval
      const cycleShifts = shifts.filter((s) => {
        const matchesBranch = branchId === 'all' || s.branchId === branchId;
        const matchesDate = s.tanggal >= startStr && s.tanggal <= endStr;
        return matchesBranch && matchesDate;
      });

      const totalCash = cycleShifts.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
      const totalQris = cycleShifts.reduce((acc, curr) => acc + (Number(curr.qris) || 0), 0);
      const totalBelanjaKasir = cycleShifts.reduce((acc, curr) => acc + (Number(curr.belanjaKasir) || 0), 0);
      const totalNet = cycleShifts.reduce((acc, curr) => acc + (Number(curr.totalNet) || 0), 0);

      const savedOverride = overrides[cycleId] || {};

      cycles.push({
        id: cycleId,
        branchId,
        year,
        month,
        cycleNumber,
        startDate: startStr,
        endDate: endStr,
        labelPeriode,
        totalCash,
        totalQris,
        totalBelanjaKasir,
        totalNet,
        shiftCount: cycleShifts.length,
        status: savedOverride.status || 'BELUM_DISETOR',
        tanggalSetor: savedOverride.tanggalSetor || '',
        bankTujuan: savedOverride.bankTujuan || 'BCA Holding Toko Kopi Mergan (Rek: 822-091-2331)',
        disetorOleh: savedOverride.disetorOleh || '',
        nomorBukti: savedOverride.nomorBukti || '',
        catatan: savedOverride.catatan || '',
        updatedAt: savedOverride.updatedAt || '',
      });
    });

    return cycles;
  },

  // ==========================================
  // EMPLOYEES & ATTENDANCE & PAYROLL
  // ==========================================
  getEmployees(branchId?: string): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      let list: Employee[] = data ? JSON.parse(data) : INITIAL_EMPLOYEES;
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      }
      if (branchId && branchId !== 'all') {
        return list.filter((e) => e.branchId === branchId);
      }
      return list;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  },

  saveEmployee(employee: Employee, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'KEPALA_TOKO') {
      return { success: false, message: 'Hak akses terbatas. Hanya Kepala Toko yang berwenang menambah atau mengedit data karyawan.' };
    }
    const list = this.getEmployees();
    const index = list.findIndex((e) => e.id === employee.id);
    if (index >= 0) {
      list[index] = employee;
    } else {
      list.push(employee);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  deleteEmployee(employeeId: string, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'KEPALA_TOKO') {
      return { success: false, message: 'Hak akses terbatas. Hanya Kepala Toko yang berwenang menghapus data karyawan.' };
    }
    const list = this.getEmployees().filter((e) => e.id !== employeeId);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  getAttendance(branchId?: string, dateStr?: string): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      let list: AttendanceRecord[] = data ? JSON.parse(data) : INITIAL_ATTENDANCE;
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      }
      if (branchId && branchId !== 'all') {
        list = list.filter((a) => a.branchId === branchId);
      }
      if (dateStr) {
        list = list.filter((a) => a.tanggal === dateStr);
      }
      return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },

  saveAttendance(record: AttendanceRecord, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'KEPALA_TOKO') {
      return { success: false, message: 'Hak akses terbatas. Hanya Kepala Toko yang berwenang mencatat atau mengubah absensi karyawan.' };
    }
    const list = this.getAttendance();
    const index = list.findIndex((a) => a.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  deleteAttendance(recordId: string, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'KEPALA_TOKO') {
      return { success: false, message: 'Hak akses terbatas. Hanya Kepala Toko yang berwenang menghapus absensi karyawan.' };
    }
    const list = this.getAttendance().filter((a) => a.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  getPayrollRecords(branchId?: string, year?: number, month?: number): PayrollRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYROLL);
      let list: PayrollRecord[] = data ? JSON.parse(data) : [];
      if (list.length === 0) {
        // Generate baseline payroll for October 2026
        list = this.generateBaselinePayroll(2026, 10);
        localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(list));
      }
      if (branchId && branchId !== 'all') {
        list = list.filter((p) => p.branchId === branchId);
      }
      if (year) {
        list = list.filter((p) => p.periodeTahun === year);
      }
      if (month) {
        list = list.filter((p) => p.periodeBulan === month);
      }
      return list;
    } catch {
      return [];
    }
  },

  generateBaselinePayroll(year: number, month: number): PayrollRecord[] {
    const employees = this.getEmployees();
    return employees.map((emp) => {
      const totalHariKerja = 26;
      const totalHadir = 25;
      const totalSakitIzin = 1;
      const totalAlpa = 0;
      const totalJamLembur = emp.posisi.includes('Barista') ? 4 : 0;
      const gajiPokok = emp.gajiPokokPerBulan;
      const totalTunjanganHadir = totalHadir * emp.tunjanganHarian;
      const totalUpahLembur = totalJamLembur * emp.tarifLemburPerJam;
      const bonusKinerja = 150000;
      const potonganKasbon = 0;
      const potonganAlpa = 0;
      const gajiBersih = gajiPokok + totalTunjanganHadir + totalUpahLembur + bonusKinerja - potonganKasbon - potonganAlpa;

      return {
        id: `pay-${emp.id}-${year}-${month}`,
        employeeId: emp.id,
        employeeName: emp.nama,
        posisi: emp.posisi,
        branchId: emp.branchId,
        periodeBulan: month,
        periodeTahun: year,
        totalHariKerja,
        totalHadir,
        totalSakitIzin,
        totalAlpa,
        totalJamLembur,
        gajiPokok,
        totalTunjanganHadir,
        totalUpahLembur,
        bonusKinerja,
        potonganKasbon,
        potonganAlpa,
        gajiBersih,
        statusPembayaran: 'DISETUJUI',
        tanggalDibayar: `${year}-${String(month).padStart(2, '0')}-25`,
        metodePembayaran: 'Transfer Bank ' + (emp.namaBank || 'BCA'),
        catatan: 'Penggajian reguler periode ' + month + '/' + year,
      };
    });
  },

  savePayrollRecord(record: PayrollRecord, user: User | null): { success: boolean; message?: string } {
    if (user?.role !== 'KEPALA_TOKO') {
      return { success: false, message: 'Hak akses terbatas. Hanya Kepala Toko yang berwenang menghitung atau mengedit data penggajian.' };
    }
    const list = this.getPayrollRecords();
    const index = list.findIndex((p) => p.id === record.id);
    if (index >= 0) {
      list[index] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...record, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(list));
    notifyAll();
    return { success: true };
  },

  updateBranchOrder(updatedOrder: BranchOrder): { success: boolean } {
    const orders = this.getBranchOrders();
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index >= 0) {
      orders[index] = updatedOrder;
      localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(orders));
      notifyAll();
    }
    return { success: true };
  },

  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.MASTER_BAHAN, JSON.stringify(MASTER_BAHAN_BAKU));
    localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(USERS));
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(BRANCHES));
    localStorage.removeItem(STORAGE_KEYS.SETOR_TUNAI);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    notifyAll();
  },

  clearAllRecaps(): void {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BRANCH_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.SETOR_TUNAI);
    notifyAll();
  },
};

