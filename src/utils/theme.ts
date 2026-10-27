import { BranchTheme } from '../types';
export type { BranchTheme };

export const BRANCH_THEMES: Record<string, BranchTheme> = {
  'pusat-sumbawa': {
    branchId: 'pusat-sumbawa',
    name: 'Pusat Cabang Ponorogo Sumbawa',
    badgeLabel: 'PUSAT SUMBAWA',
    accentHex: '#10B981',
    accentText: 'text-emerald-500 dark:text-emerald-400',
    accentBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accentBgSoft: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    accentBorder: 'border-emerald-500/60',
    accentRing: 'focus:ring-emerald-500',
    headerGradient: 'from-emerald-950/70 via-neutral-900 to-[#0A140F]',
    kpiBorderHover: 'hover:border-emerald-500/50',
    cardBg: 'bg-[#0E1A14]/40 border-emerald-900/30',
  },
  'ponorogo-urip': {
    branchId: 'ponorogo-urip',
    name: 'Cabang Ponorogo Urip Sumoharjo',
    badgeLabel: 'URIP SUMOHARJO',
    accentHex: '#F59E0B',
    accentText: 'text-amber-500 dark:text-amber-400',
    accentBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    accentBgSoft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    accentBorder: 'border-amber-500/60',
    accentRing: 'focus:ring-amber-500',
    headerGradient: 'from-amber-950/70 via-neutral-900 to-[#191106]',
    kpiBorderHover: 'hover:border-amber-500/50',
    cardBg: 'bg-[#1C1307]/40 border-amber-900/30',
  },
  'cabang-madiun': {
    branchId: 'cabang-madiun',
    name: 'Cabang Madiun',
    badgeLabel: 'CABANG MADIUN',
    accentHex: '#6366F1',
    accentText: 'text-indigo-500 dark:text-indigo-400',
    accentBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accentBgSoft: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    accentBorder: 'border-indigo-500/60',
    accentRing: 'focus:ring-indigo-500',
    headerGradient: 'from-indigo-950/70 via-neutral-900 to-[#0D0F1E]',
    kpiBorderHover: 'hover:border-indigo-500/50',
    cardBg: 'bg-[#101223]/40 border-indigo-900/30',
  },
  'all': {
    branchId: 'all',
    name: 'Holding Toko Kopi Mergan (Konsolidasi 3 Cabang)',
    badgeLabel: 'HOLDING HEADQUARTERS',
    accentHex: '#0EA5E9',
    accentText: 'text-sky-500 dark:text-sky-400',
    accentBg: 'bg-sky-600 hover:bg-sky-700 text-white',
    accentBgSoft: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    accentBorder: 'border-sky-500/60',
    accentRing: 'focus:ring-sky-500',
    headerGradient: 'from-sky-950/70 via-neutral-900 to-[#0A131B]',
    kpiBorderHover: 'hover:border-sky-500/50',
    cardBg: 'bg-[#0A131B]/40 border-sky-900/30',
  },
};

export function getTheme(branchId: string): BranchTheme {
  return BRANCH_THEMES[branchId] || BRANCH_THEMES['all'];
}
