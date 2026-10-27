import React, { useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  AttendanceStatus,
  ShiftType,
  BranchTheme,
  User,
  Branch,
} from '../types';
import { getTodayDateString, formatTanggalShort, getHariIndonesia, formatRupiah } from '../utils/formatters';
import { StorageService } from '../services/storage';
import {
  CalendarCheck,
  Clock,
  UserCheck,
  Check,
  AlertCircle,
  PlusCircle,
  Users,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface FormAbsenKaryawanProps {
  branchId: string;
  theme: BranchTheme;
  currentUser: User;
  onSuccess?: () => void;
  canInput: boolean;
  employees: Employee[];
  branchName?: string;
}

const SHIFT_OPTIONS: { label: ShiftType; short: string; defaultIn: string; defaultOut: string }[] = [
  {
    label: 'Shift 1 (Pagi 07:00 - 15:00)',
    short: 'Shift 1 (Pagi)',
    defaultIn: '06:55',
    defaultOut: '15:05',
  },
  {
    label: 'Shift 2 (Malam 15:00 - 23:00)',
    short: 'Shift 2 (Malam)',
    defaultIn: '14:55',
    defaultOut: '23:10',
  },
  {
    label: 'Full Day (Event / Weekend)',
    short: 'Full Day',
    defaultIn: '07:00',
    defaultOut: '23:00',
  },
];

const STATUS_OPTIONS: { status: AttendanceStatus; label: string; colorClass: string; desc: string }[] = [
  {
    status: 'Hadir',
    label: 'Hadir',
    colorClass: 'bg-emerald-500 text-white border-emerald-600',
    desc: 'Bekerja penuh sesuai jam shift',
  },
  {
    status: 'Izin',
    label: 'Izin',
    colorClass: 'bg-sky-500 text-white border-sky-600',
    desc: 'Izin terkonfirmasi Kepala Toko',
  },
  {
    status: 'Sakit',
    label: 'Sakit',
    colorClass: 'bg-amber-500 text-white border-amber-600',
    desc: 'Surat dokter / pemberitahuan sakit',
  },
  {
    status: 'Alpa',
    label: 'Alpa',
    colorClass: 'bg-rose-500 text-white border-rose-600',
    desc: 'Tanpa kabar (potongan gaji)',
  },
  {
    status: 'Libur / Off',
    label: 'Libur / Off',
    colorClass: 'bg-neutral-600 text-white border-neutral-700',
    desc: 'Hari libur terjadwal staf',
  },
];

export const FormAbsenKaryawan: React.FC<FormAbsenKaryawanProps> = ({
  branchId,
  theme,
  currentUser,
  onSuccess,
  canInput,
  employees,
  branchName,
}) => {
  const [formMode, setFormMode] = useState<'SINGLE' | 'ROSTER'>('SINGLE');
  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [shift, setShift] = useState<ShiftType>('Shift 1 (Pagi 07:00 - 15:00)');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [jamMasuk, setJamMasuk] = useState<string>('06:55');
  const [jamKeluar, setJamKeluar] = useState<string>('15:05');
  const [jamLembur, setJamLembur] = useState<number>(0);
  const [catatan, setCatatan] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter employees for this branch
  const activeBranchEmployees = employees.filter((e) => {
    if (branchId === 'all') return e.isActive !== false;
    return e.branchId === branchId && e.isActive !== false;
  });

  // Set initial selected employee
  useEffect(() => {
    if (activeBranchEmployees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(activeBranchEmployees[0].id);
    }
  }, [activeBranchEmployees, selectedEmpId]);

  // Adjust default times when shift changes
  useEffect(() => {
    const shiftConf = SHIFT_OPTIONS.find((s) => s.label === shift);
    if (shiftConf && status === 'Hadir') {
      setJamMasuk(shiftConf.defaultIn);
      setJamKeluar(shiftConf.defaultOut);
    } else if (status !== 'Hadir') {
      setJamMasuk('-');
      setJamKeluar('-');
      setJamLembur(0);
    }
  }, [shift, status]);

  const selectedEmployee = activeBranchEmployees.find((e) => e.id === selectedEmpId);

  // Estimasi upah lembur
  const estimasiUpahLembur = selectedEmployee && jamLembur > 0
    ? jamLembur * selectedEmployee.tarifLemburPerJam
    : 0;

  // Handle single attendance submission
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!canInput) {
      setFeedback({
        type: 'error',
        message: 'Hak akses Anda terbatas. Hanya Kepala Toko yang berwenang menginput absensi karyawan.',
      });
      return;
    }

    if (!selectedEmployee) {
      setFeedback({
        type: 'error',
        message: 'Pilih karyawan yang akan dicatat absensinya.',
      });
      return;
    }

    const targetBranch = branchId === 'all' ? selectedEmployee.branchId : branchId;

    const record: AttendanceRecord = {
      id: `att-${selectedEmployee.id}-${tanggal}-${shift.startsWith('Shift 1') ? 'S1' : 'S2'}`,
      branchId: targetBranch,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.nama,
      posisi: selectedEmployee.posisi,
      tanggal,
      shift,
      status,
      jamMasuk: status === 'Hadir' ? jamMasuk : '-',
      jamKeluar: status === 'Hadir' ? jamKeluar : '-',
      jamLembur: status === 'Hadir' ? Number(jamLembur) || 0 : 0,
      catatan: catatan.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const res = StorageService.saveAttendance(record, currentUser);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Absensi ${selectedEmployee.nama} (${status} - ${shift.split(' (')[0]}) berhasil disimpan ke sistem!`,
      });
      setCatatan('');
      setJamLembur(0);
      onSuccess?.();
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Gagal menyimpan data absensi.',
      });
    }
  };

  // Quick Roster State
  const [rosterMap, setRosterMap] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        jamMasuk: string;
        jamKeluar: string;
        jamLembur: number;
        catatan: string;
      }
    >
  >({});

  // Initialize or update roster map when date/shift/employees change
  useEffect(() => {
    const shiftConf = SHIFT_OPTIONS.find((s) => s.label === shift) || SHIFT_OPTIONS[0];
    const targetBranch = branchId === 'all' ? undefined : branchId;
    const existing = StorageService.getAttendance(targetBranch).filter(
      (a) => a.tanggal === tanggal && a.shift === shift
    );

    const initial: Record<
      string,
      {
        status: AttendanceStatus;
        jamMasuk: string;
        jamKeluar: string;
        jamLembur: number;
        catatan: string;
      }
    > = {};

    activeBranchEmployees.forEach((emp) => {
      const match = existing.find((a) => a.employeeId === emp.id);
      if (match) {
        initial[emp.id] = {
          status: match.status,
          jamMasuk: match.jamMasuk,
          jamKeluar: match.jamKeluar,
          jamLembur: match.jamLembur || 0,
          catatan: match.catatan || '',
        };
      } else {
        initial[emp.id] = {
          status: 'Hadir',
          jamMasuk: shiftConf.defaultIn,
          jamKeluar: shiftConf.defaultOut,
          jamLembur: 0,
          catatan: '',
        };
      }
    });

    setRosterMap(initial);
  }, [branchId, tanggal, shift, activeBranchEmployees.length]);

  // Handle Roster Save (Save All in 1 click)
  const handleSaveAllRoster = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!canInput) {
      setFeedback({
        type: 'error',
        message: 'Hak akses Anda terbatas. Hanya Kepala Toko yang berwenang menginput absensi karyawan.',
      });
      return;
    }

    let savedCount = 0;
    activeBranchEmployees.forEach((emp) => {
      const state = rosterMap[emp.id];
      if (!state) return;

      const targetBranch = branchId === 'all' ? emp.branchId : branchId;
      const record: AttendanceRecord = {
        id: `att-${emp.id}-${tanggal}-${shift.startsWith('Shift 1') ? 'S1' : 'S2'}`,
        branchId: targetBranch,
        employeeId: emp.id,
        employeeName: emp.nama,
        posisi: emp.posisi,
        tanggal,
        shift,
        status: state.status,
        jamMasuk: state.status === 'Hadir' ? state.jamMasuk : '-',
        jamKeluar: state.status === 'Hadir' ? state.jamKeluar : '-',
        jamLembur: state.status === 'Hadir' ? Number(state.jamLembur) || 0 : 0,
        catatan: state.catatan.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const res = StorageService.saveAttendance(record, currentUser);
      if (res.success) savedCount++;
    });

    setFeedback({
      type: 'success',
      message: `Presensi seluruh staf (${savedCount} orang) untuk ${shift.split(' (')[0]} tgl ${formatTanggalShort(tanggal)} berhasil disimpan serempak!`,
    });
    onSuccess?.();
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden text-left">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-neutral-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 text-amber-400 border border-neutral-700/60 shadow-2xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white font-mono uppercase">
                Form Presensi & Absensi Karyawan
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {branchName || 'Toko Kopi Mergan'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Catat jam kerja, status kehadiran, dan lembur staf shift harian. Terhubung langsung ke slip gaji & dasbor keuangan.
            </p>
          </div>
        </div>

        {/* View Mode Switcher: Form Input Satuan vs Lembar Cepat Seluruh Tim */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setFormMode('SINGLE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              formMode === 'SINGLE'
                ? 'bg-neutral-800 text-white shadow-2xs font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Input Per Karyawan</span>
          </button>
          <button
            type="button"
            onClick={() => setFormMode('ROSTER')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              formMode === 'ROSTER'
                ? 'bg-neutral-800 text-white shadow-2xs font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lembar Tim Cepat ({activeBranchEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* Role Notice if Read-Only */}
      {!canInput && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Mode Pantau Audit:</strong> Formulir ini hanya dapat diinput atau disubmit oleh <strong>Kepala Toko</strong>. Owner dan Purchase dapat melihat riwayat kehadiran secara real-time.
          </span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 text-xs flex items-center gap-2 border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* MODE 1: SINGLE EMPLOYEE FORM */}
      {formMode === 'SINGLE' ? (
        <form onSubmit={handleSubmitSingle} className="p-5 sm:p-6 space-y-5">
          {/* Row 1: Tanggal, Shift, dan Pilih Karyawan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Tanggal Absensi <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                required
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Hari: <strong className="text-neutral-700 dark:text-neutral-300">{getHariIndonesia(tanggal)}</strong>
              </span>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Shift Kerja Operasional <span className="text-rose-500">*</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold cursor-pointer"
              >
                {SHIFT_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Terkoneksi langsung dengan shift rekap kasir & belanja
              </span>
            </div>

            {/* Pilih Karyawan */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>Nama Karyawan Bertugas <span className="text-rose-500">*</span></span>
                {selectedEmployee && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {selectedEmployee.nik}
                  </span>
                )}
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold cursor-pointer"
                required
              >
                {activeBranchEmployees.length === 0 ? (
                  <option value="">Belum ada karyawan terdaftar</option>
                ) : (
                  activeBranchEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} — {emp.posisi}
                    </option>
                  ))
                )}
              </select>
              {selectedEmployee && (
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Status: <strong>{selectedEmployee.statusKaryawan}</strong> · Tunjangan:{' '}
                  <strong>{formatRupiah(selectedEmployee.tunjanganHarian)}/hr</strong>
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Status Kehadiran (Interactive Chips) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Status Presensi Hari Ini <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setStatus(opt.status)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${opt.colorClass} shadow-xs ring-2 ring-neutral-400 dark:ring-neutral-600 scale-[1.02]`
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide font-mono">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-normal ${
                        isSelected ? 'text-white/90' : 'text-neutral-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Jam Kerja & Lembur (Hanya aktif jika status Hadir) */}
          {status === 'Hadir' && (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-mono uppercase">
                  Waktu Presensi & Jam Lembur
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    JAM MASUK KERJA
                  </label>
                  <input
                    type="time"
                    value={jamMasuk}
                    onChange={(e) => setJamMasuk(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Jadwal standar shift pagi: 07:00
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    JAM PULANG KERJA
                  </label>
                  <input
                    type="time"
                    value={jamKeluar}
                    onChange={(e) => setJamKeluar(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Jadwal standar shift pagi: 15:00
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 flex items-center justify-between">
                    <span>JUMLAH JAM LEMBUR</span>
                    {estimasiUpahLembur > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px]">
                        +{formatRupiah(estimasiUpahLembur)}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={jamLembur}
                      onChange={(e) => setJamLembur(Number(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono font-bold text-center"
                    />
                    <span className="text-xs text-neutral-500 font-mono">Jam</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Tarif lembur: {formatRupiah(selectedEmployee?.tarifLemburPerJam || 0)}/jam
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Catatan / Keterangan Shift (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Tukar shift dengan Mas Doni, lembur closing bulanan, izin urusan keluarga..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500">
              Absensi yang tersimpan akan otomatis menghitung <strong>tunjangan kehadiran harian</strong> dan <strong>upah lembur</strong> pada slip gaji bulanan staf.
            </div>

            <button
              type="submit"
              disabled={!canInput || activeBranchEmployees.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                canInput && activeBranchEmployees.length > 0
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>Simpan Absensi Karyawan</span>
            </button>
          </div>
        </form>
      ) : (
        /* MODE 2: QUICK ROSTER CHECKLIST (SELURUH STAF CABANG SEKALIGUS) */
        <form onSubmit={handleSaveAllRoster} className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono block">
                  Tanggal Presensi:
                </span>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="bg-transparent font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer"
                />
              </div>

              <div className="border-l border-neutral-300 dark:border-neutral-700 pl-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono block">
                  Shift:
                </span>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="bg-transparent font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer"
                >
                  {SHIFT_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.short}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500">
              Total <strong>{activeBranchEmployees.length} staf</strong> terdaftar di outlet ini.
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Nama & Posisi</th>
                  <th className="px-3.5 py-2.5 text-center">Status Kehadiran</th>
                  <th className="px-3.5 py-2.5 text-center">Jam Masuk</th>
                  <th className="px-3.5 py-2.5 text-center">Jam Pulang</th>
                  <th className="px-3.5 py-2.5 text-center">Lembur</th>
                  <th className="px-3.5 py-2.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {activeBranchEmployees.map((emp) => {
                  const state = rosterMap[emp.id] || {
                    status: 'Hadir',
                    jamMasuk: '07:00',
                    jamKeluar: '15:00',
                    jamLembur: 0,
                    catatan: '',
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">{emp.nama}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{emp.posisi}</div>
                      </td>

                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex rounded-lg border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-100 dark:bg-neutral-800">
                          {(['Hadir', 'Izin', 'Sakit', 'Alpa', 'Libur / Off'] as AttendanceStatus[]).map(
                            (st) => {
                              const isCur = state.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setRosterMap({
                                      ...rosterMap,
                                      [emp.id]: {
                                        ...state,
                                        status: st,
                                        jamMasuk: st === 'Hadir' ? (state.jamMasuk !== '-' ? state.jamMasuk : '07:00') : '-',
                                        jamKeluar: st === 'Hadir' ? (state.jamKeluar !== '-' ? state.jamKeluar : '15:00') : '-',
                                        jamLembur: st === 'Hadir' ? state.jamLembur : 0,
                                      },
                                    })
                                  }
                                  className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                                    isCur
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : st === 'Izin'
                                        ? 'bg-sky-600 text-white shadow-2xs'
                                        : st === 'Sakit'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : st === 'Alpa'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-neutral-600 text-white shadow-2xs'
                                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                                  }`}
                                >
                                  {st === 'Libur / Off' ? 'Off' : st}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {state.status === 'Hadir' ? (
                          <input
                            type="time"
                            value={state.jamMasuk}
                            onChange={(e) =>
                              setRosterMap({
                                ...rosterMap,
                                [emp.id]: { ...state, jamMasuk: e.target.value },
                              })
                            }
                            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                          />
                        ) : (
                          <span className="text-neutral-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {state.status === 'Hadir' ? (
                          <input
                            type="time"
                            value={state.jamKeluar}
                            onChange={(e) =>
                              setRosterMap({
                                ...rosterMap,
                                [emp.id]: { ...state, jamKeluar: e.target.value },
                              })
                            }
                            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                          />
                        ) : (
                          <span className="text-neutral-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {state.status === 'Hadir' ? (
                          <input
                            type="number"
                            min="0"
                            max="8"
                            step="0.5"
                            value={state.jamLembur}
                            onChange={(e) =>
                              setRosterMap({
                                ...rosterMap,
                                [emp.id]: { ...state, jamLembur: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-14 text-xs px-1.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-center"
                          />
                        ) : (
                          <span className="text-neutral-400 font-mono">0</span>
                        )}
                      </td>

                      <td className="px-3.5 py-2.5">
                        <input
                          type="text"
                          placeholder="Keterangan..."
                          value={state.catatan}
                          onChange={(e) =>
                            setRosterMap({
                              ...rosterMap,
                              [emp.id]: { ...state, catatan: e.target.value },
                            })
                          }
                          className="w-full text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!canInput || activeBranchEmployees.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                canInput && activeBranchEmployees.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Simpan Seluruh Presensi Shift Ini ({activeBranchEmployees.length} Staf)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
