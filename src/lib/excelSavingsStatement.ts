import * as XLSX from "xlsx";
import { Customer, SavingTransaction, parseDate, isCustomerSavingMatch } from "../App";
import { SupabaseSavingsService } from "./supabase";

const get4DigitCustId = (id?: string, name?: string) => {
  if (id && id.trim()) {
    return id.trim();
  }
  if (name && name.trim()) {
    return name.trim().toUpperCase();
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
 * Generate dan download file Excel (.xlsx) e-Statement mutasi tabungan nasabah.
 */
export const downloadSavingsStatementExcel = async (
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
    // 1. Ambil data mutasi LENGKAP nasabah langsung dari Supabase Database
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

    // Filter transaksi spesifik nasabah
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

    // 3. Hitung akumulasi saldo berjalan (running balance)
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

      const priorTxs = allWithBalance.filter((t) => t.dateObj < monthStartDate);
      periodTxs = allWithBalance.filter(
        (t) => t.dateObj >= monthStartDate && t.dateObj <= monthEndDate
      );

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

    // 5. Bangun Data Array untuk Spreadsheet Excel
    const aoaData: any[][] = [
      ["WARUNG TOMI - REKENING KORAN / E-STATEMENT TABUNGAN"],
      ["Layanan Tabungan & Keuangan Digital Terpercaya"],
      [],
      ["INFORMASI NASABAH", "", "INFORMASI AKUN"],
      ["Nama Pemilik Rekening", custName.toUpperCase(), "No. Rekening / ID", custId],
      ["No. Telepon / WhatsApp", custPhone, "Status Akun", "AKTIF"],
      ["Alamat / Wilayah", custAddress, "Mata Uang", "IDR (Rupiah)"],
      ["Periode Mutasi", periodLabel, "Waktu Unduh", `${printDate} WIB`],
      [],
      ["RINGKASAN SALDO"],
      ["Saldo Awal", saldoAwal, "Total Setoran (+)", periodSetor],
      ["Total Penarikan (-)", periodTarik, "Saldo Akhir", saldoAkhir],
      [],
      ["RINCIAN MUTASI TRANSAKSI"],
      ["No", "Tanggal", "ID Mutasi", "Keterangan / Berita", "Debet (-)", "Kredit (+)", "Saldo (Rp)"]
    ];

    if (formattedRows.length > 0) {
      formattedRows.forEach((r) => {
        aoaData.push([
          r.no,
          r.tanggal,
          r.id,
          r.keterangan,
          r.debet > 0 ? r.debet : 0,
          r.kredit > 0 ? r.kredit : 0,
          r.saldo
        ]);
      });
    } else {
      aoaData.push(["-", "-", "-", "Tidak ada mutasi transaksi pada periode ini", 0, 0, saldoAwal]);
    }

    aoaData.push([]);
    aoaData.push(["Total", "", "", "", periodTarik, periodSetor, saldoAkhir]);
    aoaData.push([]);
    aoaData.push(["Dokumen ini dibuat otomatis oleh Sistem Digital Warung Tomi dan sah secara elektronik."]);

    // 6. Buat Workbook dan Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

    // Set Lebar Kolom
    worksheet["!cols"] = [
      { wch: 6 },  // No
      { wch: 14 }, // Tanggal
      { wch: 18 }, // ID Mutasi
      { wch: 40 }, // Keterangan
      { wch: 18 }, // Debet
      { wch: 18 }, // Kredit
      { wch: 20 }  // Saldo
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "e-Statement");

    // 7. Simpan File Excel
    const safeName = custName.replace(/[^a-zA-Z0-9]/g, "_");
    const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(workbook, `e-Statement_Tabungan_${safeName}_${safePeriod}.xlsx`);

    return true;
  } catch (err) {
    console.error("Gagal generate Excel e-Statement:", err);
    alert("Gagal membuat file Excel e-Statement.");
    return false;
  }
};
