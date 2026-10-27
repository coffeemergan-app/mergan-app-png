import React, { useState } from 'react';
import {
  Employee,
  AttendanceRecord,
  PayrollRecord,
  BranchTheme,
  User,
  Branch,
  EmployeePosition,
  ShiftType,
  AttendanceStatus,
} from '../types';
import { formatRupiah, formatTanggalShort, getTodayDateString } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { exportPresensiToPDF, exportPayrollToPDF } from '../utils/exportReport';
import { SlipGajiModal } from './SlipGajiModal';
import { FormAbsenKaryawan } from './FormAbsenKaryawan';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
  Building2,
  Check,
  X,
  FileText,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AbsensiPayrollViewProps {
  theme: BranchTheme;
  currentUser: User;
  branches: Branch[];
  branchNameMap: Record<string, string>;
  activeBranchId: string;
  isHoldingView?: boolean;
}

const POSITIONS: EmployeePosition[] = [
  'Kepala Toko',
  'Senior Barista',
  'Junior Barista',
  'Kasir',
  'Kitchen / Snack',
  'Cleaning & Operasional',
];

const SHIFTS: ShiftType[] = [
  'Shift 1 (Pagi 07:00 - 15:00)',
  'Shift 2 (Malam 15:00 - 23:00)',
  'Full Day (Event / Weekend)',
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const AbsensiPayrollView: React.FC<AbsensiPayrollViewProps> = ({
  theme,
  currentUser,
  branches,
  branchNameMap,
  activeBranchId,
  isHoldingView = false,
}) => {
  const [subTab, setSubTab] = useState<'ABSENSI' | 'KARYAWAN' | 'PAYROLL'>('ABSENSI');

  // Permission guard: Yang bisa mengedit cuma Kepala Toko
  const isKepalaToko = currentUser.role === 'KEPALA_TOKO';
  const isOwnerHolding = currentUser.role === 'OWNER_HOLDING';
  const isOwnerCabang = currentUser.role === 'OWNER_CABANG';
  const isPurchaseHolding = currentUser.role === 'PURCHASE_HOLDING';

  // Can edit is STRICTLY KEPALA_TOKO
  const canEdit = isKepalaToko;

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // default October
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Editing states
  const [showAddAttendanceModal, setShowAddAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [selectedSlipPayroll, setSelectedSlipPayroll] = useState<PayrollRecord | null>(null);

  // New Attendance Form State
  const [attEmployeeId, setAttEmployeeId] = useState('');
  const [attShift, setAttShift] = useState<ShiftType>('Shift 1 (Pagi 07:00 - 15:00)');
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('Hadir');
  const [attJamMasuk, setAttJamMasuk] = useState('06:55');
  const [attJamKeluar, setAttJamKeluar] = useState('15:10');
  const [attJamLembur, setAttJamLembur] = useState<number>(0);
  const [attCatatan, setAttCatatan] = useState('');

  // New Employee Form State
  const [empNama, setEmpNama] = useState('');
  const [empNik, setEmpNik] = useState('');
  const [empPosisi, setEmpPosisi] = useState<EmployeePosition>('Junior Barista');
  const [empPhone, setEmpPhone] = useState('');
  const [empStatus, setEmpStatus] = useState<'Tetap' | 'Kontrak' | 'Part Time'>('Kontrak');
  const [empGajiPokok, setEmpGajiPokok] = useState<number>(2500000);
  const [empTunjanganHarian, setEmpTunjanganHarian] = useState<number>(20000);
  const [empTarifLembur, setEmpTarifLembur] = useState<number>(18000);
  const [empRekening, setEmpRekening] = useState('');
  const [empBank, setEmpBank] = useState('BCA');

  // Load Data
  const targetBranch = activeBranchId === 'all' ? undefined : activeBranchId;
  const employees = StorageService.getEmployees(targetBranch);
  const attendanceList = StorageService.getAttendance(targetBranch);
  const payrollList = StorageService.getPayrollRecords(targetBranch, selectedYear, selectedMonth);

  // Filtered Attendance
  const filteredAttendance = attendanceList.filter((a) => {
    const matchesDate = !selectedDate || a.tanggal === selectedDate;
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.posisi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Filtered Employees
  const filteredEmployees = employees.filter((e) => {
    return (
      e.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.posisi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filtered Payroll
  const filteredPayroll = payrollList.filter((p) => {
    return (
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.posisi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Attendance Statistics Today
  const todayAttendance = attendanceList.filter((a) => a.tanggal === selectedDate);
  const totalHadirToday = todayAttendance.filter((a) => a.status === 'Hadir').length;
  const totalIzinToday = todayAttendance.filter((a) => a.status === 'Izin' || a.status === 'Sakit').length;
  const totalAlpaToday = todayAttendance.filter((a) => a.status === 'Alpa').length;

  // Payroll Statistics
  const totalBebanGaji = filteredPayroll.reduce((acc, p) => acc + p.gajiBersih, 0);
  const totalLemburHours = filteredPayroll.reduce((acc, p) => acc + p.totalJamLembur, 0);

  // Submit New Attendance
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hak akses Anda terbatas. Hanya Kepala Toko yang berwenang mencatat absensi.');
      return;
    }

    const emp = employees.find((x) => x.id === attEmployeeId);
    if (!emp) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }

    const branchToUse = emp.branchId || (activeBranchId === 'all' ? 'pusat-sumbawa' : activeBranchId);

    const record: AttendanceRecord = {
      id: editingAttendance ? editingAttendance.id : 'att-' + Date.now(),
      branchId: branchToUse,
      employeeId: emp.id,
      employeeName: emp.nama,
      posisi: emp.posisi,
      tanggal: selectedDate,
      shift: attShift,
      status: attStatus,
      jamMasuk: attJamMasuk,
      jamKeluar: attJamKeluar,
      jamLembur: Number(attJamLembur) || 0,
      catatan: attCatatan,
      createdAt: new Date().toISOString(),
    };

    const res = StorageService.saveAttendance(record, currentUser);
    if (res.success) {
      setShowAddAttendanceModal(false);
      setEditingAttendance(null);
      setAttCatatan('');
      setAttJamLembur(0);
    } else {
      alert(res.message);
    }
  };

  // Submit New Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hak akses Anda terbatas. Hanya Kepala Toko yang berwenang mengelola data karyawan.');
      return;
    }

    const branchToUse = activeBranchId === 'all' ? 'pusat-sumbawa' : activeBranchId;
    const empData: Employee = {
      id: editingEmployee ? editingEmployee.id : 'emp-' + Date.now(),
      branchId: editingEmployee ? editingEmployee.branchId : branchToUse,
      nik: empNik.trim(),
      nama: empNama.trim(),
      posisi: empPosisi,
      phone: empPhone.trim(),
      statusKaryawan: empStatus,
      tanggalBergabung: editingEmployee ? editingEmployee.tanggalBergabung : getTodayDateString(),
      gajiPokokPerBulan: Number(empGajiPokok) || 0,
      tunjanganHarian: Number(empTunjanganHarian) || 0,
      tarifLemburPerJam: Number(empTarifLembur) || 0,
      rekeningBank: empRekening.trim(),
      namaBank: empBank.trim(),
    };

    const res = StorageService.saveEmployee(empData, currentUser);
    if (res.success) {
      setShowAddEmployeeModal(false);
      setEditingEmployee(null);
      setEmpNama('');
      setEmpNik('');
      setEmpPhone('');
      setEmpRekening('');
    } else {
      alert(res.message);
    }
  };

  // Delete Attendance
  const handleDeleteAttendance = (id: string, name: string) => {
    if (!canEdit) return;
    if (confirm(`Hapus catatan absensi untuk ${name}?`)) {
      StorageService.deleteAttendance(id, currentUser);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = (id: string, name: string) => {
    if (!canEdit) return;
    if (confirm(`Hapus data karyawan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      StorageService.deleteEmployee(id, currentUser);
    }
  };

  // Save Payroll Edit
  const handleSavePayrollEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingPayroll) return;

    // Recalculate net pay
    const gajiBersih =
      editingPayroll.gajiPokok +
      editingPayroll.totalTunjanganHadir +
      editingPayroll.totalUpahLembur +
      editingPayroll.bonusKinerja -
      editingPayroll.potonganKasbon -
      editingPayroll.potonganAlpa;

    const res = StorageService.savePayrollRecord({ ...editingPayroll, gajiBersih }, currentUser);
    if (res.success) {
      setEditingPayroll(null);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Top Banner: Role-based status indicator */}
      {!canEdit && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Pemantauan Eksekutif ({currentUser.role}):</strong> Anda memiliki akses Read-Only untuk memantau data kehadiran dan sistem penggajian. Pengeditan dan input hanya dapat dilakukan oleh <strong>Kepala Toko</strong>.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0 font-bold">
            AUDIT ONLY
          </span>
        </div>
      )}

      {/* Main Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('ABSENSI')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'ABSENSI'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Form & Absensi Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('KARYAWAN')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'KARYAWAN'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Data Karyawan ({employees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('PAYROLL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'PAYROLL'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Penggajian (Payroll)</span>
          </button>
        </div>

        <div className="text-right text-[11px] text-neutral-500 pr-2 hidden sm:block">
          Outlet Aktif:{' '}
          <strong className="text-neutral-800 dark:text-neutral-200">
            {branchNameMap[activeBranchId] || 'Semua Cabang'}
          </strong>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: FORM & CATATAN ABSENSI HARIAN                        */}
      {/* ============================================================== */}
      {subTab === 'ABSENSI' && (
        <div className="space-y-5">
          {/* Form Input Presensi & Absensi Karyawan */}
          <FormAbsenKaryawan
            branchId={activeBranchId}
            theme={theme}
            currentUser={currentUser}
            canInput={canEdit}
            employees={employees}
            branchName={branchNameMap[activeBranchId]}
          />

          {/* Daily Attendance KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Total Staf Cabang
              </span>
              <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {employees.length} Orang
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Semua Posisi</span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block font-mono">
                Hadir Bertugas ({selectedDate})
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                {totalHadirToday} Orang
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-0.5">
                {employees.length > 0 ? Math.round((totalHadirToday / employees.length) * 100) : 0}% Tingkat Kehadiran
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block font-mono">
                Izin / Sakit
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
                {totalIzinToday} Orang
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">Izin Terkonfirmasi</span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block font-mono">
                Alpa / Tanpa Keterangan
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1 block">
                {totalAlpaToday} Orang
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-500 block mt-0.5">Potongan Gaji Otomatis</span>
            </div>
          </div>

          {/* Action Bar & Date Filter */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700">
                <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Tanggal Absensi:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-hidden cursor-pointer"
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama barista / kasir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  exportPresensiToPDF({
                    attendance: todayAttendance,
                    branchName: branchNameMap[activeBranchId] || 'Cabang Mergan',
                    dateStr: selectedDate,
                  });
                }}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Download PDF Rekap Presensi Tanggal Terpilih"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download PDF Presensi</span>
              </button>

              {/* Tambah Absensi Button (Only for Kepala Toko) */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAttendance(null);
                    if (employees.length > 0) {
                      setAttEmployeeId(employees[0].id);
                    }
                    setShowAddAttendanceModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Absensi Shift Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Table of Daily Attendance */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Karyawan</th>
                    <th className="px-4 py-3">Posisi / Jabatan</th>
                    {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                    <th className="px-4 py-3">Shift Kerja</th>
                    <th className="px-4 py-3 text-center">Jam Masuk - Pulang</th>
                    <th className="px-4 py-3 text-center">Status Kehadiran</th>
                    <th className="px-4 py-3 text-center">Lembur</th>
                    <th className="px-4 py-3">Catatan / Keterangan</th>
                    {canEdit && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 9 : 8} className="px-4 py-8 text-center text-neutral-400">
                        Belum ada catatan absensi untuk tanggal {formatTanggalShort(selectedDate)}.
                        {canEdit && ' Klik tombol "Catat Absensi Shift Baru" untuk mulai mengisi.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((att) => {
                      const isHadir = att.status === 'Hadir';
                      return (
                        <tr key={att.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                            {att.employeeName}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                              {att.posisi}
                            </span>
                          </td>
                          {isHoldingView && (
                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                              {branchNameMap[att.branchId] || att.branchId}
                            </td>
                          )}
                          <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {att.shift.replace('Shift ', 'S').split(' (')[0]}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                            {att.jamMasuk} - {att.jamKeluar}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isHadir
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : att.status === 'Alpa'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {att.jamLembur > 0 ? `+${att.jamLembur} Jam` : '-'}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 max-w-xs truncate" title={att.catatan}>
                            {att.catatan || '-'}
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAttendance(att);
                                    setAttEmployeeId(att.employeeId);
                                    setAttShift(att.shift);
                                    setAttStatus(att.status);
                                    setAttJamMasuk(att.jamMasuk);
                                    setAttJamKeluar(att.jamKeluar);
                                    setAttJamLembur(att.jamLembur);
                                    setAttCatatan(att.catatan || '');
                                    setShowAddAttendanceModal(true);
                                  }}
                                  className="p-1 rounded text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                  title="Edit absensi"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(att.id, att.employeeName)}
                                  className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  title="Hapus catatan"
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
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: DATA KARYAWAN (MASTER STAF CABANG)                   */}
      {/* ============================================================== */}
      {subTab === 'KARYAWAN' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-neutral-900 dark:text-neutral-100">
                Master Data Karyawan Outlet Toko Kopi Mergan
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Struktur jabatan, gaji pokok, tunjangan kehadiran, dan nomor rekening staf.
              </p>
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setEditingEmployee(null);
                  setEmpNama('');
                  setEmpNik(`TKM-${activeBranchId === 'pusat-sumbawa' ? 'SBW' : activeBranchId === 'ponorogo-urip' ? 'URP' : 'MDN'}-00${employees.length + 1}`);
                  setEmpPhone('');
                  setEmpRekening('');
                  setShowAddEmployeeModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Karyawan Baru</span>
              </button>
            ) : (
              <span className="text-[11px] text-neutral-400 italic">
                Kelola master data: Khusus Kepala Toko
              </span>
            )}
          </div>

          {/* Employees Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">NIK / ID Staf</th>
                    <th className="px-4 py-3">Nama Karyawan</th>
                    <th className="px-4 py-3">Jabatan</th>
                    {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                    <th className="px-4 py-3">Status Kerja</th>
                    <th className="px-4 py-3 text-right">Gaji Pokok / Bln</th>
                    <th className="px-4 py-3 text-right">Tunjangan / Hari</th>
                    <th className="px-4 py-3 text-right">Tarif Lembur / Jam</th>
                    <th className="px-4 py-3">Rekening Bank</th>
                    {canEdit && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {emp.nik}
                      </td>
                      <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {emp.nama}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                          {emp.posisi}
                        </span>
                      </td>
                      {isHoldingView && (
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                          {branchNameMap[emp.branchId] || emp.branchId}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {emp.statusKaryawan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {formatRupiah(emp.gajiPokokPerBulan)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {formatRupiah(emp.tunjanganHarian)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {formatRupiah(emp.tarifLemburPerJam)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                        {emp.namaBank} {emp.rekeningBank || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmpNama(emp.nama);
                                setEmpNik(emp.nik);
                                setEmpPosisi(emp.posisi);
                                setEmpPhone(emp.phone);
                                setEmpStatus(emp.statusKaryawan);
                                setEmpGajiPokok(emp.gajiPokokPerBulan);
                                setEmpTunjanganHarian(emp.tunjanganHarian);
                                setEmpTarifLembur(emp.tarifLemburPerJam);
                                setEmpRekening(emp.rekeningBank || '');
                                setEmpBank(emp.namaBank || 'BCA');
                                setShowAddEmployeeModal(true);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-amber-500 cursor-pointer"
                              title="Edit Karyawan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp.id, emp.nama)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus Karyawan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 3: SISTEM PENGGAJIAN (PAYROLL & SLIP GAJI)              */}
      {/* ============================================================== */}
      {subTab === 'PAYROLL' && (
        <div className="space-y-4">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Total Beban Gaji Bersih
              </span>
              <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {formatRupiah(totalBebanGaji)}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block font-mono">
                Status Pembayaran
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                {filteredPayroll.filter((p) => p.statusPembayaran === 'DIBAYAR' || p.statusPembayaran === 'DISETUJUI').length} / {filteredPayroll.length}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-0.5">Disetujui / Terbayar</span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block font-mono">
                Total Lembur Staf
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
                {totalLemburHours} Jam
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">Akumulasi Lembur Periode</span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-mono">
                Rata-rata Gaji Bersih
              </span>
              <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 tabular-nums mt-1 block">
                {filteredPayroll.length > 0 ? formatRupiah(totalBebanGaji / filteredPayroll.length) : 'Rp 0'}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Per Karyawan Outlet</span>
            </div>
          </div>

          {/* Month / Year Filter Strip */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-0.5">
                  Periode Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-semibold cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-0.5">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-semibold cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-neutral-500 hidden md:inline">
                {canEdit
                  ? 'Kepala Toko dapat mengedit bonus/kasbon & status bayar.'
                  : 'Owner Holding & Cabang dapat memantau dan mencetak slip gaji.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  exportPayrollToPDF({
                    payrollRecords: filteredPayroll,
                    branchName: isHoldingView ? 'Holding Konsolidasi 3 Cabang' : branchNameMap[activeBranchId] || 'Cabang Mergan',
                    monthName: MONTH_NAMES[selectedMonth - 1],
                    year: selectedYear,
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
                title="Download PDF Tabel Rekapitulasi Gaji Karyawan"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Download PDF Rekap Gaji</span>
              </button>
            </div>
          </div>

          {/* Payroll Records Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Karyawan / Posisi</th>
                    {isHoldingView && <th className="px-4 py-3">Cabang</th>}
                    <th className="px-4 py-3 text-center">Kehadiran</th>
                    <th className="px-4 py-3 text-right">Gaji Pokok</th>
                    <th className="px-4 py-3 text-right">Tunjangan</th>
                    <th className="px-4 py-3 text-right">Lembur</th>
                    <th className="px-4 py-3 text-right">Bonus</th>
                    <th className="px-4 py-3 text-right">Potongan</th>
                    <th className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                      Gaji Bersih
                    </th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-normal">
                  {filteredPayroll.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">{p.employeeName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{p.posisi}</div>
                      </td>
                      {isHoldingView && (
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                          {branchNameMap[p.branchId] || p.branchId}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{p.totalHadir}</span>
                        <span className="text-neutral-400"> / {p.totalHariKerja} Hari</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {formatRupiah(p.gajiPokok)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {formatRupiah(p.totalTunjanganHadir)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {formatRupiah(p.totalUpahLembur)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{formatRupiah(p.bonusKinerja)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        -{formatRupiah(p.potonganAlpa + p.potonganKasbon)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-sm text-neutral-950 dark:text-neutral-50 whitespace-nowrap">
                        {formatRupiah(p.gajiBersih)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.statusPembayaran === 'DIBAYAR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {p.statusPembayaran}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Slip Gaji */}
                          <button
                            type="button"
                            onClick={() => setSelectedSlipPayroll(p)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Cetak Slip Gaji Resmi"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Slip</span>
                          </button>

                          {/* Edit Payroll params (Kepala Toko only) */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingPayroll({ ...p })}
                              className="p-1 rounded text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Edit parameter gaji & bonus"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: INPUT / EDIT ABSENSI HARIAN                           */}
      {/* ============================================================== */}
      {showAddAttendanceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                  {editingAttendance ? 'Edit Absensi Karyawan' : 'Catat Absensi Karyawan'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAttendanceModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  PILIH KARYAWAN
                </label>
                <select
                  value={attEmployeeId}
                  onChange={(e) => setAttEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                >
                  <option value="">-- Pilih Staf --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} ({emp.posisi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    STATUS KEHADIRAN
                  </label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                    <option value="Libur / Off">Libur / Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    SHIFT PENUGASAN
                  </label>
                  <select
                    value={attShift}
                    onChange={(e) => setAttShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('Shift ', 'S').split(' (')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    JAM MASUK
                  </label>
                  <input
                    type="time"
                    value={attJamMasuk}
                    onChange={(e) => setAttJamMasuk(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    JAM PULANG
                  </label>
                  <input
                    type="time"
                    value={attJamKeluar}
                    onChange={(e) => setAttJamKeluar(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  JAM LEMBUR (JAM)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={attJamLembur}
                  onChange={(e) => setAttJamLembur(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  CATATAN OPERASIONAL / ALASAN
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Datang on time, lembur restock beans"
                  value={attCatatan}
                  onChange={(e) => setAttCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddAttendanceModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold cursor-pointer"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: INPUT / EDIT DATA KARYAWAN (MASTER)                   */}
      {/* ============================================================== */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 max-w-lg w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                  {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    NIK / ID KARYAWAN
                  </label>
                  <input
                    type="text"
                    value={empNik}
                    onChange={(e) => setEmpNik(e.target.value)}
                    placeholder="TKM-SBW-005"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    STATUS KERJA
                  </label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Part Time">Part Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  NAMA LENGKAP KARYAWAN
                </label>
                <input
                  type="text"
                  value={empNama}
                  onChange={(e) => setEmpNama(e.target.value)}
                  placeholder="Nama Lengkap Staf"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    JABATAN / POSISI
                  </label>
                  <select
                    value={empPosisi}
                    onChange={(e) => setEmpPosisi(e.target.value as EmployeePosition)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    NOMOR TELEPON / WA
                  </label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    GAJI POKOK (BLN)
                  </label>
                  <input
                    type="number"
                    value={empGajiPokok}
                    onChange={(e) => setEmpGajiPokok(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    TUNJANGAN (HARI)
                  </label>
                  <input
                    type="number"
                    value={empTunjanganHarian}
                    onChange={(e) => setEmpTunjanganHarian(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    LEMBUR (JAM)
                  </label>
                  <input
                    type="number"
                    value={empTarifLembur}
                    onChange={(e) => setEmpTarifLembur(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    NAMA BANK
                  </label>
                  <input
                    type="text"
                    value={empBank}
                    onChange={(e) => setEmpBank(e.target.value)}
                    placeholder="BCA / BRI / Mandiri"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    NOMOR REKENING
                  </label>
                  <input
                    type="text"
                    value={empRekening}
                    onChange={(e) => setEmpRekening(e.target.value)}
                    placeholder="Nomor rekening transfer"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EDIT PARAMETER PAYROLL (KEPALA TOKO ONLY)             */}
      {/* ============================================================== */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                  Edit Parameter Gaji: {editingPayroll.employeeName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayroll(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayrollEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">TOTAL HARI HADIR</label>
                  <input
                    type="number"
                    value={editingPayroll.totalHadir}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        totalHadir: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">JAM LEMBUR</label>
                  <input
                    type="number"
                    value={editingPayroll.totalJamLembur}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        totalJamLembur: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">BONUS KINERJA</label>
                  <input
                    type="number"
                    value={editingPayroll.bonusKinerja}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        bonusKinerja: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">POTONGAN KASBON</label>
                  <input
                    type="number"
                    value={editingPayroll.potonganKasbon}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        potonganKasbon: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">STATUS PEMBAYARAN</label>
                <select
                  value={editingPayroll.statusPembayaran}
                  onChange={(e) =>
                    setEditingPayroll({
                      ...editingPayroll,
                      statusPembayaran: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold"
                >
                  <option value="DRAF">DRAF (Menunggu)</option>
                  <option value="DISETUJUI">DISETUJUI</option>
                  <option value="DIBAYAR">DIBAYAR (Lunas)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">CATATAN PENGGAJIAN</label>
                <input
                  type="text"
                  value={editingPayroll.catatan || ''}
                  onChange={(e) =>
                    setEditingPayroll({
                      ...editingPayroll,
                      catatan: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold cursor-pointer"
                >
                  Simpan Perubahan Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: PRINTABLE SLIP GAJI                                   */}
      {/* ============================================================== */}
      {selectedSlipPayroll && (
        <SlipGajiModal
          payroll={selectedSlipPayroll}
          branch={branches.find((b) => b.id === selectedSlipPayroll.branchId)}
          branchName={branchNameMap[selectedSlipPayroll.branchId] || selectedSlipPayroll.branchId}
          onClose={() => setSelectedSlipPayroll(null)}
        />
      )}
    </div>
  );
};
