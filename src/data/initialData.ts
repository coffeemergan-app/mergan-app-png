import { Branch, User, ShiftRekap, DailyExpense, BranchBudget, BranchOrder } from '../types';
import { MASTER_BAHAN_BAKU } from './masterBahanBaku';

export const BRANCHES: Branch[] = [
  {
    id: 'pusat-sumbawa',
    name: 'Pusat Cabang Ponorogo Sumbawa',
    shortName: 'Ponorogo Sumbawa',
    city: 'Ponorogo',
    address: 'Jl. Sumbawa No. 14, Ponorogo, Jawa Timur',
    accentColor: '#10B981', // Solid Emerald
    accentBg: 'bg-emerald-600',
    accentBorder: 'border-emerald-600',
    themeClass: 'theme-emerald',
  },
  {
    id: 'ponorogo-urip',
    name: 'Cabang Ponorogo Urip Sumoharjo',
    shortName: 'Ponorogo Urip',
    city: 'Ponorogo',
    address: 'Jl. Urip Sumoharjo No. 88, Ponorogo, Jawa Timur',
    accentColor: '#F59E0B', // Solid Amber
    accentBg: 'bg-amber-600',
    accentBorder: 'border-amber-600',
    themeClass: 'theme-amber',
  },
  {
    id: 'cabang-madiun',
    name: 'Cabang Madiun',
    shortName: 'Madiun Pahlawan',
    city: 'Madiun',
    address: 'Jl. Pahlawan No. 42, Kartoharjo, Kota Madiun, Jawa Timur',
    accentColor: '#6366F1', // Solid Indigo
    accentBg: 'bg-indigo-600',
    accentBorder: 'border-indigo-600',
    themeClass: 'theme-indigo',
  },
];

export const USERS: User[] = [
  {
    id: 'user-1',
    username: 'owner.holding',
    name: 'Bapak Hendra (Owner Holding)',
    role: 'OWNER_HOLDING',
    branchId: 'all',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-2',
    username: 'purchase.holding',
    name: 'Ibu Ratna (Purchase & Stok Holding)',
    role: 'PURCHASE_HOLDING',
    branchId: 'all',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-3',
    username: 'owner.sumbawa',
    name: 'Mas Bayu (Owner Sumbawa)',
    role: 'OWNER_CABANG',
    branchId: 'pusat-sumbawa',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-4',
    username: 'owner.urip',
    name: 'Bapak Joko (Owner Urip)',
    role: 'OWNER_CABANG',
    branchId: 'ponorogo-urip',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-5',
    username: 'owner.madiun',
    name: 'Mbak Cindy (Owner Madiun)',
    role: 'OWNER_CABANG',
    branchId: 'cabang-madiun',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-6',
    username: 'kepala.sumbawa',
    name: 'Rian Pratama (Kepala Toko Sumbawa)',
    role: 'KEPALA_TOKO',
    branchId: 'pusat-sumbawa',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-7',
    username: 'kepala.urip',
    name: 'Dimas Aditya (Kepala Toko Urip)',
    role: 'KEPALA_TOKO',
    branchId: 'ponorogo-urip',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-8',
    username: 'kepala.madiun',
    name: 'Wahyu Saputra (Kepala Toko Madiun)',
    role: 'KEPALA_TOKO',
    branchId: 'cabang-madiun',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-9',
    username: 'purchase.sumbawa',
    name: 'Dewi Anjani (Purchase & Stok Sumbawa)',
    role: 'PURCHASE_CABANG',
    branchId: 'pusat-sumbawa',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-10',
    username: 'purchase.urip',
    name: 'Bagas Pratama (Purchase & Stok Urip)',
    role: 'PURCHASE_CABANG',
    branchId: 'ponorogo-urip',
    passwordHint: 'mergan123',
  },
  {
    id: 'user-11',
    username: 'purchase.madiun',
    name: 'Fajar Nugraha (Purchase & Stok Madiun)',
    role: 'PURCHASE_CABANG',
    branchId: 'cabang-madiun',
    passwordHint: 'mergan123',
  },
];

export const INITIAL_BUDGETS: BranchBudget[] = [
  { branchId: 'pusat-sumbawa', dailyBudgetLimit: 1600000 },
  { branchId: 'ponorogo-urip', dailyBudgetLimit: 1400000 },
  { branchId: 'cabang-madiun', dailyBudgetLimit: 1800000 },
];

export const INITIAL_EXPENSES: DailyExpense[] = [];
export const INITIAL_SHIFTS: ShiftRekap[] = [];
export const INITIAL_ORDERS: BranchOrder[] = [];

