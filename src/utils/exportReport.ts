import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ShiftRekap, DailyExpense, Branch, AttendanceRecord, PayrollRecord } from '../types';
import { formatRupiah, formatTanggalIndonesia } from './formatters';

interface ExportReportParams {
  branch: Branch | { id: string; name: string };
  month: number; // 1 - 12
  year: number;
  shifts: ShiftRekap[];
  expenses: DailyExpense[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function exportMonthlyReportToPDF({
  branch,
  month,
  year,
  shifts,
  expenses,
}: ExportReportParams): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const monthName = MONTH_NAMES[month - 1];

  // Header Title
  doc.setFillColor(24, 24, 27); // Zinc 900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(`LAPORAN KEUANGAN KASIR & OPERASIONAL BULANAN — ${monthName.toUpperCase()} ${year}`, 14, 18);
  doc.text(`Outlet: ${branch.name}`, 200, 18);

  // Summary Metrics Calculation
  const totalCash = shifts.reduce((sum, s) => sum + s.cash, 0);
  const totalQris = shifts.reduce((sum, s) => sum + s.qris, 0);
  const totalBelanjaKasir = shifts.reduce((sum, s) => sum + s.belanjaKasir, 0);
  const totalNetShift = shifts.reduce((sum, s) => sum + s.totalNet, 0);
  const totalBelanjaHarian = expenses.reduce((sum, e) => sum + e.totalBiaya, 0);
  const estimasiLabaBersih = totalNetShift - totalBelanjaHarian;

  // Metric Cards
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(248, 250, 252);

  // Box 1: Total Omzet Kotor
  doc.roundedRect(14, 28, 62, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL OMZET (CASH + QRIS)', 18, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(totalCash + totalQris), 18, 42);

  // Box 2: Total Belanja Kasir Shift
  doc.roundedRect(80, 28, 62, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BELANJA KASIR SHIFT', 84, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72);
  doc.text(formatRupiah(totalBelanjaKasir), 84, 42);

  // Box 3: Total Belanja Operasional/Purchase
  doc.roundedRect(146, 28, 68, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL BELANJA OPERASIONAL', 150, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(formatRupiah(totalBelanjaHarian), 150, 42);

  // Box 4: Estimasi Bersih
  doc.roundedRect(218, 28, 65, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMASI SISA KAS BERSIH', 222, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(formatRupiah(estimasiLabaBersih), 222, 42);

  // Section 1: Tabel Rekap Kasir Harian
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('1. REKAPITULASI TRANSAKSI KASIR PER SHIFT', 14, 52);

  const shiftTableRows = shifts.map((s, idx) => [
    idx + 1,
    `${s.hari}, ${s.tanggal}`,
    s.person,
    s.shift.replace('Shift ', 'S').replace(/\s*\(.*\)/, ''),
    formatRupiah(s.cash),
    formatRupiah(s.qris),
    formatRupiah(s.belanjaKasir),
    formatRupiah(s.totalNet),
    s.catatan || '-',
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['No', 'Hari & Tanggal', 'Person (Kepala Toko)', 'Shift', 'Cash', 'QRIS', 'Belanja Kasir', 'Net Shift', 'Catatan']],
    body: shiftTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 41 },
    },
    margin: { left: 14, right: 14 },
  });

  // Section 2: Tabel Belanja Harian (Add new page if needed or continuation)
  doc.addPage('landscape');

  // Header second page
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN — RINCIAN BELANJA & OPERASIONAL HARIAN', 14, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('2. RINCIAN BELANJA HARIAN & BIAYA OPERASIONAL', 14, 25);

  const expenseTableRows = expenses.map((e, idx) => [
    idx + 1,
    formatTanggalIndonesia(e.tanggal),
    e.shift ? (e.shift.includes('Shift 1') ? 'Shift 1' : e.shift.includes('Shift 2') ? 'Shift 2' : 'Full Day') : 'Shift 1',
    e.rincianBarang,
    e.kategori,
    formatRupiah(e.hargaSatuan),
    `${e.kuantitas} ${e.satuan}`,
    formatRupiah(e.totalBiaya),
    e.personPurchase,
    e.supplier || '-',
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Tanggal', 'Shift', 'Rincian Barang', 'Kategori Biaya', 'Harga Satuan', 'Qty / Satuan', 'Total Biaya', 'Person Purchase', 'Supplier']],
    body: expenseTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { cellWidth: 52 },
      4: { cellWidth: 34 },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 26 },
      9: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Authorization Sign-offs at bottom of page
  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 25;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh (Kepala Toko / Kasir)', 24, signY);
  doc.text('Diperiksa oleh (Purchase)', 118, signY);
  doc.text('Disetujui oleh (Owner Holding)', 214, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('( ........................................ )', 20, signY + 15);
  doc.text('( ........................................ )', 114, signY + 15);
  doc.text('( ........................................ )', 210, signY + 15);

  const filename = `Laporan_Bulanan_Mergan_${branch.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
  doc.save(filename);
}

export function exportMonthlyReportToExcel({
  branch,
  month,
  year,
  shifts,
  expenses,
}: ExportReportParams): void {
  const monthName = MONTH_NAMES[month - 1];
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Ringkasan
  const totalCash = shifts.reduce((sum, s) => sum + s.cash, 0);
  const totalQris = shifts.reduce((sum, s) => sum + s.qris, 0);
  const totalBelanjaKasir = shifts.reduce((sum, s) => sum + s.belanjaKasir, 0);
  const totalNetShift = shifts.reduce((sum, s) => sum + s.totalNet, 0);
  const totalBelanjaHarian = expenses.reduce((sum, e) => sum + e.totalBiaya, 0);

  const summaryData = [
    ['TOKO KOPI MERGAN'],
    [`LAPORAN KEUANGAN & OPERASIONAL BULANAN — ${monthName.toUpperCase()} ${year}`],
    [`Outlet / Cabang: ${branch.name}`],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    [],
    ['INDIKATOR KEUANGAN', 'NOMINAL (IDR)'],
    ['Total Pemasukan Tunai (Cash)', totalCash],
    ['Total Pemasukan Non-Tunai (QRIS)', totalQris],
    ['Total Omzet Kotor (Cash + QRIS)', totalCash + totalQris],
    ['Total Belanja Kecil Kasir Shift', totalBelanjaKasir],
    ['Total Net Kasir Shift', totalNetShift],
    ['Total Belanja Operasional & Pengadaan', totalBelanjaHarian],
    ['Estimasi Kas Bersih Operasional', totalNetShift - totalBelanjaHarian],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 38 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Finansial');

  // 2. Sheet Rekap Kasir Shift
  const shiftHeaders = [
    'No',
    'Tanggal',
    'Hari',
    'Person (Kepala Toko)',
    'Shift',
    'Cash (IDR)',
    'QRIS (IDR)',
    'Belanja Kasir (IDR)',
    'Total Net Shift (IDR)',
    'Catatan Operasional',
  ];
  const shiftRows = shifts.map((s, idx) => [
    idx + 1,
    s.tanggal,
    s.hari,
    s.person,
    s.shift,
    s.cash,
    s.qris,
    s.belanjaKasir,
    s.totalNet,
    s.catatan || '',
  ]);
  const shiftSheet = XLSX.utils.aoa_to_sheet([shiftHeaders, ...shiftRows]);
  shiftSheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 10 },
    { wch: 20 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(workbook, shiftSheet, 'Rekap Shift Kasir');

  // 3. Sheet Belanja Harian & Operasional
  const expenseHeaders = [
    'No',
    'Tanggal',
    'Shift Operasional',
    'Rincian Barang',
    'Kategori Biaya Operasional',
    'Harga Satuan (IDR)',
    'Kuantitas',
    'Satuan',
    'Total Biaya (IDR)',
    'Person Purchase',
    'Supplier / Toko',
    'Keterangan',
  ];
  const expenseRows = expenses.map((e, idx) => [
    idx + 1,
    e.tanggal,
    e.shift || 'Shift 1 (Pagi 07:00 - 15:00)',
    e.rincianBarang,
    e.kategori,
    e.hargaSatuan,
    e.kuantitas,
    e.satuan,
    e.totalBiaya,
    e.personPurchase,
    e.supplier || '',
    e.keterangan || '',
  ]);
  const expenseSheet = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  expenseSheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 40 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Belanja Harian');

  const filename = `Laporan_Bulanan_Mergan_${branch.name.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// -------------------------------------------------------------
// DEDICATED PER-TABLE PDF EXPORTS (Download PDF per Tabel Rekap)
// -------------------------------------------------------------

export function exportSingleTableRekapKasirToPDF({
  shifts,
  branchName,
  filterTitle = 'Semua Periode',
}: {
  shifts: ShiftRekap[];
  branchName: string;
  filterTitle?: string;
}): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header Title
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(`TABEL REKAPITULASI TRANSAKSI KASIR PER SHIFT — ${filterTitle.toUpperCase()}`, 14, 18);
  doc.text(`Outlet: ${branchName}`, 210, 18);

  // Summary Metrics Calculation
  const totalCash = shifts.reduce((sum, s) => sum + s.cash, 0);
  const totalQris = shifts.reduce((sum, s) => sum + s.qris, 0);
  const totalBelanjaKasir = shifts.reduce((sum, s) => sum + s.belanjaKasir, 0);
  const totalNetShift = shifts.reduce((sum, s) => sum + s.totalNet, 0);

  // Metric Cards
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(248, 250, 252);

  // Box 1: Total Cash
  doc.roundedRect(14, 28, 62, 17, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN CASH', 18, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(totalCash), 18, 41);

  // Box 2: Total QRIS
  doc.roundedRect(80, 28, 62, 17, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN QRIS', 84, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(totalQris), 84, 41);

  // Box 3: Total Belanja Kasir
  doc.roundedRect(146, 28, 68, 17, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BELANJA KECIL KASIR SHIFT', 150, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(225, 29, 72);
  doc.text(formatRupiah(totalBelanjaKasir), 150, 41);

  // Box 4: Total Net Setoran
  doc.roundedRect(218, 28, 65, 17, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL NET SETORAN KASIR', 222, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text(formatRupiah(totalNetShift), 222, 41);

  const shiftTableRows = shifts.map((s, idx) => [
    idx + 1,
    `${s.hari}, ${s.tanggal}`,
    s.person,
    s.shift.replace('Shift ', 'S').replace(/\s*\(.*\)/, ''),
    formatRupiah(s.cash),
    formatRupiah(s.qris),
    formatRupiah(s.belanjaKasir),
    formatRupiah(s.totalNet),
    s.catatan || '-',
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['No', 'Hari & Tanggal', 'Kepala Toko / Kasir', 'Shift', 'Cash (IDR)', 'QRIS (IDR)', 'Belanja Kasir', 'Net Shift (IDR)', 'Catatan']],
    body: shiftTableRows.length > 0 ? shiftTableRows : [['-', 'Belum ada data rekapan kasir', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 41 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer Signatures
  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh (Kepala Toko)', 24, signY);
  doc.text('Diperiksa oleh (Auditor Cabang)', 118, signY);
  doc.text('Disetujui oleh (Owner Holding)', 214, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('( ........................................ )', 20, signY + 13);
  doc.text('( ........................................ )', 114, signY + 13);
  doc.text('( ........................................ )', 210, signY + 13);

  const cleanBranch = branchName.replace(/\s+/g, '_');
  doc.save(`Tabel_Rekap_Kasir_${cleanBranch}_${Date.now()}.pdf`);
}

export function exportSingleTableBelanjaToPDF({
  expenses,
  branchName,
  filterTitle = 'Semua Transaksi',
}: {
  expenses: DailyExpense[];
  branchName: string;
  filterTitle?: string;
}): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header Title
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(`DAFTAR TRANSAKSI BELANJA & BIAYA OPERASIONAL — ${filterTitle.toUpperCase()}`, 14, 18);
  doc.text(`Outlet: ${branchName}`, 210, 18);

  const totalBiaya = expenses.reduce((sum, e) => sum + e.totalBiaya, 0);

  // Metric Card
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 28, 90, 16, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN BELANJA OPERASIONAL', 18, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(formatRupiah(totalBiaya), 18, 41);

  doc.roundedRect(110, 28, 80, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL NOTA / TRANSAKSI BELANJA', 114, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${expenses.length} Transaksi Tercatat`, 114, 41);

  const expenseTableRows = expenses.map((e, idx) => [
    idx + 1,
    formatTanggalIndonesia(e.tanggal),
    e.shift ? (e.shift.includes('Shift 1') ? 'Shift 1' : e.shift.includes('Shift 2') ? 'Shift 2' : 'Full Day') : 'Shift 1',
    e.rincianBarang,
    e.kategori,
    formatRupiah(e.hargaSatuan),
    `${e.kuantitas} ${e.satuan}`,
    formatRupiah(e.totalBiaya),
    e.personPurchase,
    e.supplier || '-',
    e.keterangan || '-',
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Tanggal', 'Shift', 'Rincian Barang', 'Kategori Biaya', 'Harga Satuan', 'Qty / Satuan', 'Total Biaya', 'Person Purchase', 'Supplier', 'Keterangan']],
    body: expenseTableRows.length > 0 ? expenseTableRows : [['-', 'Belum ada catatan belanja harian', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 18 },
      3: { cellWidth: 46 },
      4: { cellWidth: 30 },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 24 },
      9: { cellWidth: 22 },
      10: { cellWidth: 23 },
    },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh (Purchase Cabang)', 24, signY);
  doc.text('Diperiksa oleh (Purchase Pusat)', 118, signY);
  doc.text('Disetujui oleh (Owner Holding)', 214, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('( ........................................ )', 20, signY + 13);
  doc.text('( ........................................ )', 114, signY + 13);
  doc.text('( ........................................ )', 210, signY + 13);

  const cleanBranch = branchName.replace(/\s+/g, '_');
  doc.save(`Tabel_Belanja_Harian_${cleanBranch}_${Date.now()}.pdf`);
}

export function exportSingleTableRekapBahanBulananToPDF({
  recapList,
  branchName,
  monthName,
  year,
}: {
  recapList: Array<{
    namaBarang: string;
    kategori: string;
    satuan: string;
    totalKuantitas: number;
    totalBiaya: number;
    rataHarga: number;
    frekuensi: number;
    supplier: string;
  }>;
  branchName: string;
  monthName: string;
  year: number;
}): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header Title
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(`REKAPITULASI TOTAL PEMBELIAN BAHAN BAKU PER ITEM — ${monthName.toUpperCase()} ${year}`, 14, 18);
  doc.text(`Outlet: ${branchName}`, 210, 18);

  const totalBelanja = recapList.reduce((sum, item) => sum + item.totalBiaya, 0);

  // Metric Card
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 28, 90, 16, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN BAHAN BULAN INI', 18, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(formatRupiah(totalBelanja), 18, 41);

  doc.roundedRect(110, 28, 80, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('JUMLAH VARIAN BAHAN BAKU', 114, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${recapList.length} Item Bahan Digunakan`, 114, 41);

  const rows = recapList.map((item, idx) => [
    idx + 1,
    item.namaBarang,
    item.kategori,
    `${item.totalKuantitas} ${item.satuan}`,
    formatRupiah(Math.round(item.rataHarga)),
    formatRupiah(item.totalBiaya),
    `${item.frekuensi}x Beli`,
    item.supplier,
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Nama Bahan Baku', 'Kategori', 'Total Volume / Qty', 'Rata-rata Harga Satuan', 'Total Akumulasi Biaya', 'Frekuensi Beli', 'Supplier Utama']],
    body: rows.length > 0 ? rows : [['-', 'Belum ada pembelian bahan pada periode ini', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 36, halign: 'right' },
      5: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 26, halign: 'center' },
      7: { cellWidth: 37 },
    },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh (Purchase Cabang)', 24, signY);
  doc.text('Diperiksa oleh (Purchase Pusat)', 118, signY);
  doc.text('Disetujui oleh (Owner Holding)', 214, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('( ........................................ )', 20, signY + 13);
  doc.text('( ........................................ )', 114, signY + 13);
  doc.text('( ........................................ )', 210, signY + 13);

  const cleanBranch = branchName.replace(/\s+/g, '_');
  doc.save(`Rekap_Bahan_Bulanan_${cleanBranch}_${monthName}_${year}.pdf`);
}

export function exportPresensiToPDF({
  attendance,
  branchName,
  dateStr,
}: {
  attendance: AttendanceRecord[];
  branchName: string;
  dateStr: string;
}): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 212, 216);
  doc.text(`REKAP PRESENSI KARYAWAN — TANGGAL ${dateStr}`, 14, 16);
  doc.text(`Outlet: ${branchName}`, 140, 16);

  const rows = attendance.map((a, idx) => [
    idx + 1,
    a.employeeName,
    a.posisi,
    a.shift.replace('Shift ', 'S').replace(/\s*\(.*\)/, ''),
    a.status,
    a.jamMasuk ? `${a.jamMasuk} - ${a.jamKeluar || '...'}` : '-',
    `${a.jamLembur || 0} Jam`,
    a.catatan || '-',
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Nama Karyawan', 'Jabatan', 'Shift', 'Status', 'Jam Kerja', 'Lembur', 'Catatan']],
    body: rows.length > 0 ? rows : [['-', 'Belum ada catatan presensi pada tanggal ini', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    margin: { left: 14, right: 14 },
  });

  const cleanBranch = branchName.replace(/\s+/g, '_');
  doc.save(`Presensi_${cleanBranch}_${dateStr}.pdf`);
}

export function exportPayrollToPDF({
  payrollRecords,
  branchName,
  monthName,
  year,
}: {
  payrollRecords: PayrollRecord[];
  branchName: string;
  monthName: string;
  year: number;
}): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('TOKO KOPI MERGAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(`REKAPITULASI PENGGAJIAN KARYAWAN (PAYROLL) — ${monthName.toUpperCase()} ${year}`, 14, 18);
  doc.text(`Outlet: ${branchName}`, 210, 18);

  const totalGaji = payrollRecords.reduce((sum, p) => sum + p.gajiBersih, 0);

  // Metric Card
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 28, 85, 16, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL BEBAN GAJI OUTLET', 18, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(formatRupiah(totalGaji), 18, 41);

  const rows = payrollRecords.map((p, idx) => [
    idx + 1,
    p.employeeName,
    p.posisi,
    formatRupiah(p.gajiPokok),
    `${p.totalHadir} Hari (${formatRupiah(p.totalTunjanganHadir)})`,
    `${p.totalJamLembur} Jam (${formatRupiah(p.totalUpahLembur)})`,
    formatRupiah(p.bonusKinerja),
    formatRupiah(p.potonganKasbon + p.potonganAlpa),
    formatRupiah(p.gajiBersih),
    p.statusPembayaran,
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Nama Karyawan', 'Posisi', 'Gaji Pokok', 'Tunjangan Harian', 'Lembur', 'Bonus', 'Potongan', 'Gaji Bersih (IDR)', 'Status Bayar']],
    body: rows.length > 0 ? rows : [['-', 'Belum ada data penggajian untuk periode ini', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 28 },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 28, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh (Kepala Toko)', 24, signY);
  doc.text('Diperiksa oleh (Auditor Cabang)', 118, signY);
  doc.text('Disetujui oleh (Owner Holding)', 214, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('( ........................................ )', 20, signY + 13);
  doc.text('( ........................................ )', 114, signY + 13);
  doc.text('( ........................................ )', 210, signY + 13);

  const cleanBranch = branchName.replace(/\s+/g, '_');
  doc.save(`Payroll_${cleanBranch}_${monthName}_${year}.pdf`);
}

