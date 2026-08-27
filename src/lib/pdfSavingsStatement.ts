import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer, SavingTransaction, parseDate, isCustomerSavingMatch } from "../App";
import { SupabaseSavingsService } from "./supabase";

const get4DigitCustId = (id?: string, name?: string) => {
  if (id && id.trim()) {
    const cleanId = id.trim();
    if (/^\d{4}$/.test(cleanId)) return cleanId;
    const match = cleanId.match(/(\d{1,4})$/);
    if (match) return match[1].padStart(4, "0");
    return cleanId;
  }
  return "-";
};

const formatDateForStatement = (dateVal: any): string => {
  if (!dateVal) return "-";
  const parsed = parseDate(dateVal);
  if (isNaN(parsed.getTime()) || parsed.getTime() <= 0) return String(dateVal);
  const d = String(parsed.getDate()).padStart(2, "0");
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const y = parsed.getFullYear();
  return `${d}/${m}/${y}`;
};

/**
 * Generate dan langsung mengunduh file PDF e-Statement mutasi tabungan nasabah untuk bulan yang dipilih.
 * Secara otomatis memanggil seluruh histori tabungan nasabah dari database Supabase untuk memastikan
 * saldo awal dan daftar mutasi bulan terkait terisi 100% akurat tanpa harus membuka bulan tersebut terlebih dahulu.
 */
export const downloadSavingsStatementPdf = async (
  customer: Customer | null,
  allSavingsTransactions?: SavingTransaction[],
  monthValue?: string, // Format: "YYYY-MM" (misal: "2026-08") atau "all"
  monthLabel?: string // Label opsional (misal: "Agustus 2026")
): Promise<boolean> => {
  if (!customer) {
    alert("Data nasabah tidak ditemukan.");
    return false;
  }

  try {
    // 1. Ambil data mutasi LENGKAP nasabah langsung dari Supabase Database (histori komprehensif tanpa batasan bulan)
    let customerTransactions: SavingTransaction[] = [];

    if (SupabaseSavingsService.isConnected()) {
      try {
        const { data: supaSavings } = await SupabaseSavingsService.getSavings({
          name: customer.Nama,
          customerId: customer.id_pelanggan,
          select: "id, id_tabungan, id_pelanggan, tanggal, nama, tipe, nominal, saldo_akhir, berita, created_at"
        });

        if (supaSavings && supaSavings.length > 0) {
          customerTransactions = supaSavings.map((item) => ({
            id: item.id_tabungan || item.id,
            id_tabungan: item.id_tabungan || item.id,
            id_pelanggan: item.id_pelanggan,
            Tanggal: item.tanggal,
            Nama: item.nama,
            Tipe: (item.tipe || "Setor").toUpperCase(),
            Nominal: Number(item.nominal || 0),
            SaldoAkhir: Number(item.saldo_akhir || 0),
            Berita: item.berita || "",
            created_at: item.created_at
          }));
        }
      } catch (fetchErr) {
        console.warn("Gagal mengambil transaksi tabungan dari Supabase, menggunakan data lokal:", fetchErr);
      }
    }

    // Fallback jika offline atau Supabase belum memuat data
    if (customerTransactions.length === 0 && allSavingsTransactions && allSavingsTransactions.length > 0) {
      customerTransactions = allSavingsTransactions;
    }

    // Filter transaksi spesifik nasabah yang bersangkutan
    const filteredCustomerTransactions = customerTransactions.filter((t) =>
      isCustomerSavingMatch(t, customer)
    );

    // 2. Urutkan secara kronologis (dari transaksi terlama ke terbaru)
    const chronologicalAll = [...filteredCustomerTransactions].sort((a, b) => {
      const dateDiff = parseDate(a.Tanggal).getTime() - parseDate(b.Tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      const cA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const cB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return cA - cB;
    });

    // 3. Hitung akumulasi saldo berjalan (running balance) dari awal akun nasabah
    let running = 0;
    const allWithBalance = chronologicalAll.map((t) => {
      const isSetor = String(t.Tipe || "").toUpperCase() === "SETOR";
      const isTarik = String(t.Tipe || "").toUpperCase() === "TARIK";
      const nominal = Number(t.Nominal || 0);

      if (isSetor) {
        running += nominal;
      } else if (isTarik) {
        running = Math.max(0, running - nominal);
      }

      return {
        ...t,
        nominal,
        isSetor,
        isTarik,
        runningBal: running,
        dateObj: parseDate(t.Tanggal)
      };
    });

    // 4. Hitung batas tanggal awal dan akhir untuk periode yang dipilih
    const isAllHistory = !monthValue || monthValue === "all";
    let periodLabel = monthLabel || "";
    let saldoAwal = 0;
    let periodTxs = allWithBalance;

    if (!isAllHistory && monthValue) {
      const [yearStr, monthStr] = monthValue.split("-");
      const yr = Number(yearStr) || new Date().getFullYear();
      const mo = Number(monthStr) || (new Date().getMonth() + 1);

      const monthStartDate = new Date(yr, mo - 1, 1, 0, 0, 0, 0);
      const monthEndDate = new Date(yr, mo, 0, 23, 59, 59, 999);

      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      if (!periodLabel) {
        periodLabel = `${monthNames[mo - 1]} ${yr}`;
      }

      // Pisahkan mutasi sebelum bulan tersebut (Saldo Awal) vs mutasi pada bulan tersebut
      const priorTxs = allWithBalance.filter((t) => t.dateObj < monthStartDate);
      periodTxs = allWithBalance.filter(
        (t) => t.dateObj >= monthStartDate && t.dateObj <= monthEndDate
      );

      // Saldo Awal = Saldo Akhir mutasi terakhir sebelum bulan ini
      saldoAwal = priorTxs.length > 0 ? priorTxs[priorTxs.length - 1].runningBal : 0;
    } else {
      periodLabel = periodLabel || "Semua Riwayat Transaksi";
      saldoAwal = 0;
    }

    let periodSetor = 0;
    let periodTarik = 0;

    const formattedRows = periodTxs.map((t, idx) => {
      if (t.isSetor) periodSetor += t.nominal;
      if (t.isTarik) periodTarik += t.nominal;

      return {
        no: idx + 1,
        id: t.id_tabungan || t.id || `TAB-${idx + 1}`,
        tanggal: formatDateForStatement(t.Tanggal),
        keterangan:
          t.Berita ||
          (t as any).Keterangan ||
          (t as any).keterangan ||
          (t.isSetor
            ? "Setoran Tabungan Nasabah"
            : "Penarikan Saldo Tabungan"),
        debet: t.isTarik ? t.nominal : 0,
        kredit: t.isSetor ? t.nominal : 0,
        saldo: t.runningBal
      };
    });

    const saldoAkhir = periodTxs.length > 0 
      ? periodTxs[periodTxs.length - 1].runningBal 
      : saldoAwal;

    // 6. Buat Dokumen PDF jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const custName = customer.Nama || "Nasabah";
    const custId = customer.id_pelanggan || get4DigitCustId(customer.id_pelanggan, customer.Nama) || "-";
    const custPhone = customer.Telepon || customer.telepon || "-";
    const custAddress = customer.Alamat || customer.alamat || "Pelanggan Warung Tomi";
    const printDate = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Top Primary Header Banner (BNI Blue #005E6A)
    doc.setFillColor(0, 94, 106); // #005E6A
    doc.rect(0, 0, 210, 28, "F");

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("WARUNG TOMI", 14, 12);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("LAYANAN TABUNGAN & KEUANGAN DIGITAL KELUARGA", 14, 17);
    doc.setFontSize(7.5);
    doc.text("Sistem Pembukuan & Tabungan Terpercaya Komunitas", 14, 22);

    // Statement Title (Right Top)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("REKENING KORAN", 196, 12, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("e-Statement Tabungan Nasabah", 196, 17, { align: "right" });
    doc.text(`Periode: ${periodLabel}`, 196, 22, { align: "right" });

    // Orange divider line (#F15A24)
    doc.setFillColor(241, 90, 36);
    doc.rect(0, 28, 210, 2, "F");

    // Box Informasi Nasabah & Rekening
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 182, 32, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 34, 182, 32, 2, 2, "S");

    // Left Column: Data Nasabah
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NAMA PEMILIK REKENING", 20, 42);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(custName.toUpperCase(), 20, 48);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("ALAMAT / WILAYAH", 20, 56);
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(custAddress.substring(0, 45), 20, 61);

    // Right Column: Info Akun
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NO. REKENING / ID", 120, 42);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 94, 106);
    doc.text(custId, 120, 48);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("NO. TELEPON / WA", 120, 56);
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(custPhone, 120, 61);

    doc.text("STATUS: AKTIF", 170, 48, { align: "right" });
    doc.text("MATA UANG: IDR", 170, 61, { align: "right" });

    // Box Ringkasan Saldo (Account Summary Grid)
    const sumY = 70;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, sumY, 182, 18, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, sumY, 182, 18, "S");

    // Saldo Awal
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("SALDO AWAL", 18, sumY + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Rp ${saldoAwal.toLocaleString("id-ID")}`, 18, sumY + 13);

    // Total Setoran (+)
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL SETORAN (+)", 65, sumY + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 149, 106); // Green
    doc.text(`+Rp ${periodSetor.toLocaleString("id-ID")}`, 65, sumY + 13);

    // Total Tarikan (-)
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL PENARIKAN (-)", 115, sumY + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(`-Rp ${periodTarik.toLocaleString("id-ID")}`, 115, sumY + 13);

    // Saldo Akhir
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("SALDO AKHIR", 160, sumY + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 94, 106); // BNI Blue
    doc.text(`Rp ${saldoAkhir.toLocaleString("id-ID")}`, 160, sumY + 13);

    // Table of Mutations
    const tableData = formattedRows.length > 0 
      ? formattedRows.map((r) => [
          r.no.toString(),
          r.tanggal,
          r.id,
          r.keterangan,
          r.debet > 0 ? `Rp ${r.debet.toLocaleString("id-ID")}` : "-",
          r.kredit > 0 ? `Rp ${r.kredit.toLocaleString("id-ID")}` : "-",
          `Rp ${r.saldo.toLocaleString("id-ID")}`
        ])
      : [[
          "-",
          "-",
          "-",
          "Tidak ada mutasi transaksi pada periode ini",
          "-",
          "-",
          `Rp ${saldoAwal.toLocaleString("id-ID")}`
        ]];

    autoTable(doc, {
      startY: 92,
      head: [["No", "Tanggal", "ID Mutasi", "Keterangan / Berita", "Debet (-)", "Kredit (+)", "Saldo (Rp)"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 94, 106],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 24, halign: "center" },
        2: { cellWidth: 28, halign: "left" },
        3: { cellWidth: 50, halign: "left" },
        4: { cellWidth: 22, halign: "right", textColor: [225, 29, 72] },
        5: { cellWidth: 22, halign: "right", textColor: [16, 149, 106] },
        6: { cellWidth: 26, halign: "right", fontStyle: "bold", textColor: [0, 94, 106] }
      },
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        overflow: "linebreak"
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14, bottom: 35 }
    });

    // Footer & Disclaimer Section at bottom of page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer lines & note
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 275, 196, 275);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Dokumen ini dicetak otomatis oleh Sistem Digital Warung Tomi dan sah secara elektronik tanpa tanda tangan basah.",
        14,
        280
      );

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Waktu Cetak: ${printDate} WIB`, 14, 284);
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 284, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 94, 106);
      doc.text("[ VERIFIED E-STATEMENT • WARUNG TOMI ]", 196, 283, { align: "right" });
    }

    // Save/Download PDF file
    const safeName = custName.replace(/[^a-zA-Z0-9]/g, "_");
    const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`e-Statement_Tabungan_${safeName}_${safePeriod}.pdf`);
    return true;
  } catch (err) {
    console.error("Gagal generate PDF e-Statement:", err);
    alert("Gagal membuat file PDF e-Statement.");
    return false;
  }
};
