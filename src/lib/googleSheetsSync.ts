export interface GoogleSheetsAuthStatus {
  authenticated: boolean;
  user?: {
    email?: string;
    name?: string;
    picture?: string;
  } | null;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  autoSyncEnabled?: boolean;
}

export interface CustomerSyncPayload {
  id_pelanggan?: string;
  id?: string;
  nama?: string;
  Nama?: string;
  tabungan?: number;
  Tabungan?: number;
  investasi?: number;
  Investasi?: number;
  lainnya?: number;
  Lainnya?: number;
  hutang?: number;
  Hutang?: number;
  level?: string;
  Level?: string;
  poin?: number;
  Poin?: number;
  [key: string]: any;
}

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyS9FZaw8H-ckTRaCN3ZJP4FVeuMoAFwx9y6-pGSPtHFDCgxxLK-4HRV1WfO1xVBL8T/exec';

export const checkGoogleSheetsAuthStatus = async (): Promise<GoogleSheetsAuthStatus> => {
  try {
    const res = await fetch("/api/auth/google/status");
    const ct = res.headers.get("content-type");
    if (!res.ok || !ct || !ct.includes("application/json")) {
      return { authenticated: false };
    }
    return await res.json();
  } catch (err) {
    console.error("Error checking Google Sheets auth status:", err);
    return { authenticated: false };
  }
};

export const getGoogleOAuthUrl = async (): Promise<string> => {
  const res = await fetch("/api/auth/google/url");
  const ct = res.headers.get("content-type");
  if (!ct || !ct.includes("application/json")) {
    throw new Error("Server backend tidak merespon format JSON. Silakan coba beberapa saat lagi.");
  }
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Gagal mendapatkan URL Login Google");
  return data.url;
};

export const disconnectGoogleAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/auth/google/logout", { method: "POST" });
    return res.ok;
  } catch (err) {
    console.error("Error logging out Google:", err);
    return false;
  }
};

export const updateGoogleSheetsConfig = async (config: { spreadsheetId?: string; autoSync?: boolean }) => {
  try {
    const res = await fetch("/api/sheets/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    const ct = res.headers.get("content-type");
    if (!ct || !ct.includes("application/json")) {
      return { success: false, error: "Server mengembalikan respon tidak valid (HTML error)" };
    }
    return await res.json();
  } catch (err) {
    console.error("Error updating sheet config:", err);
    return { success: false };
  }
};

export const syncCustomersToGoogleSheets = async (customers: CustomerSyncPayload[], title?: string, accessToken?: string | null) => {
  try {
    const sanitizedCustomers = customers.map((c) => {
      const cleanObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(c)) {
        if (typeof value === "string" && value.length > 500 && value.startsWith("data:image")) {
          continue;
        }
        if (key.toLowerCase().includes("foto") || key.toLowerCase().includes("avatar") || key.toLowerCase().includes("image")) {
          if (typeof value === "string" && value.length > 300) continue;
        }
        cleanObj[key] = value;
      }
      return cleanObj;
    });

    const res = await fetch("/api/sheets/sync-customers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ customers: sanitizedCustomers, title, accessToken })
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    } else {
      return { success: false, error: "Server mengembalikan respon tidak valid" };
    }
  } catch (err: any) {
    console.error("Error syncing customers to Google Sheets:", err);
    return { success: false, error: err.message || "Gagal menyinkronkan data" };
  }
};

export const parseDate = (dateStr: any): Date => {
  if (!dateStr || dateStr === "-") return new Date(0);
  if (dateStr instanceof Date) return dateStr;
  const trimmed = String(dateStr).trim();
  
  const spaceIndex = trimmed.indexOf(' ');
  let datePart = trimmed;
  let timePart = '';
  
  if (spaceIndex !== -1) {
    datePart = trimmed.substring(0, spaceIndex);
    timePart = trimmed.substring(spaceIndex + 1).trim();
  }

  let h = 0, m = 0, s = 0;
  if (timePart) {
    const tParts = timePart.split(':');
    h = parseInt(tParts[0], 10) || 0;
    m = parseInt(tParts[1], 10) || 0;
    s = parseInt(tParts[2], 10) || 0;
  }

  const parts = datePart.split(/[/-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10) || 0;
    const p1 = parseInt(parts[1], 10) || 0;
    const p2 = parseInt(parts[2], 10) || 0;

    if (parts[0].length === 4) {
      return new Date(p0, p1 - 1, p2, h, m, s);
    }
    if (parts[2].length === 4) {
      return new Date(p2, p1 - 1, p0, h, m, s);
    }
    const fullYear = p2 < 100 ? 2000 + p2 : p2;
    return new Date(fullYear, p1 - 1, p0, h, m, s);
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

export const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  return parseInt(String(val).replace(/[^\d]/g, '')) || 0;
};

export const formatDateDDMMYYYY = (d: Date, rawStr?: string): string => {
  if (d && !isNaN(d.getTime()) && d.getTime() > 0) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (rawStr && rawStr !== '-') {
    const spaceSplit = String(rawStr).trim().split(' ')[0];
    const parts = spaceSplit.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
  }
  return '-';
};

export const getRelativeTimeString = (dateInput: any): string => {
  if (!dateInput || dateInput === "-") return "Baru-baru ini";
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = parseDate(String(dateInput));
  }

  if (isNaN(date.getTime()) || date.getTime() === 0) return "Baru-baru ini";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 30) return `${diffDays} Hari lalu`;

  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (diffMonths < 12) {
    const months = Math.max(1, diffMonths);
    return `${months} Bulan lalu`;
  }

  const diffYears = Math.max(1, now.getFullYear() - date.getFullYear());
  return `${diffYears} Tahun lalu`;
};

export const isGenericId = (id?: string): boolean => !id || id === 'cust-0000' || id === 'cust-xxxx' || id === 'cust' || id === '0000';

export const computeCustomerStatsForSheets = (
  custList: any[],
  salesList: any[] = [],
  savingsList: any[] = [],
  debtList: any[] = [],
  investList: any[] = [],
  redeemList: any[] = []
) => {
  const salesByCustId = new Map<string, any[]>();
  const salesByCustName = new Map<string, any[]>();
  salesList.forEach(t => {
    if (t.id_pelanggan && !isGenericId(t.id_pelanggan)) {
      const list = salesByCustId.get(t.id_pelanggan) || [];
      list.push(t);
      salesByCustId.set(t.id_pelanggan, list);
    }
    const n = (t.Nama || t.nama || "").toLowerCase().trim();
    if (n) {
      const list = salesByCustName.get(n) || [];
      list.push(t);
      salesByCustName.set(n, list);
    }
  });

  const savingsByCustId = new Map<string, any[]>();
  const savingsByCustName = new Map<string, any[]>();
  savingsList.forEach(t => {
    if (t.id_pelanggan && !isGenericId(t.id_pelanggan)) {
      const list = savingsByCustId.get(t.id_pelanggan) || [];
      list.push(t);
      savingsByCustId.set(t.id_pelanggan, list);
    }
    const n = (t.Nama || t.nama || "").toLowerCase().trim();
    if (n) {
      const list = savingsByCustName.get(n) || [];
      list.push(t);
      savingsByCustName.set(n, list);
    }
  });

  const debtsByCustId = new Map<string, any[]>();
  const debtsByCustName = new Map<string, any[]>();
  debtList.forEach(t => {
    if (t.id_pelanggan && !isGenericId(t.id_pelanggan)) {
      const list = debtsByCustId.get(t.id_pelanggan) || [];
      list.push(t);
      debtsByCustId.set(t.id_pelanggan, list);
    }
    const n = (t.Nama || t.nama || "").toLowerCase().trim();
    if (n) {
      const list = debtsByCustName.get(n) || [];
      list.push(t);
      debtsByCustName.set(n, list);
    }
  });

  const investmentsByCustId = new Map<string, any[]>();
  const investmentsByCustName = new Map<string, any[]>();
  investList.forEach(t => {
    if (t.id_pelanggan && !isGenericId(t.id_pelanggan)) {
      const list = investmentsByCustId.get(t.id_pelanggan) || [];
      list.push(t);
      investmentsByCustId.set(t.id_pelanggan, list);
    }
    const n = (t.Nama || t.nama || "").toLowerCase().trim();
    if (n) {
      const list = investmentsByCustName.get(n) || [];
      list.push(t);
      investmentsByCustName.set(n, list);
    }
  });

  const redeemedByCustId = new Map<string, any[]>();
  const redeemedByCustName = new Map<string, any[]>();
  redeemList.forEach(r => {
    if (r.id_pelanggan && !isGenericId(r.id_pelanggan)) {
      const list = redeemedByCustId.get(r.id_pelanggan) || [];
      list.push(r);
      redeemedByCustId.set(r.id_pelanggan, list);
    }
    const n = (r.Nama || r.nama || "").toLowerCase().trim();
    if (n) {
      const list = redeemedByCustName.get(n) || [];
      list.push(r);
      redeemedByCustName.set(n, list);
    }
  });

  const list = custList.map(c => {
    const name = (c.nama || c.Nama || "").toLowerCase().trim();
    const idPelanggan = c.id_pelanggan;

    // 1. Savings (All time)
    const userSavings = (idPelanggan && savingsByCustId.get(idPelanggan)) || savingsByCustName.get(name) || [];
    const tabungan = userSavings.length > 0 ? (userSavings[userSavings.length - 1].SaldoAkhir ?? userSavings[userSavings.length - 1].saldo_akhir ?? 0) : 0;

    // 2. Investment (All time active)
    const userInvestments = (idPelanggan && investmentsByCustId.get(idPelanggan)) || investmentsByCustName.get(name) || [];
    const investasi = userInvestments.filter(t => t.Status !== "Selesai").reduce((acc, curr) => acc + (curr.Nominal || curr.nominal || 0), 0);

    // 3. Debt (All time)
    const userDebts = (idPelanggan && debtsByCustId.get(idPelanggan)) || debtsByCustName.get(name) || [];
    const hutang = userDebts.length > 0 ? (userDebts[userDebts.length - 1].SaldoAkhir ?? userDebts[userDebts.length - 1].saldo_akhir ?? 0) : 0;

    // 4. Sales (All time)
    const userSales = (idPelanggan && salesByCustId.get(idPelanggan)) || salesByCustName.get(name) || [];

    // 5. Lainnya (All time active)
    const userLainnyaTransactions = userSales.filter(t => {
      const s = (t.Status || t.status || "").toUpperCase().trim();
      return s === "BELUM DIAMBIL" || s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
    });

    const lainnya = userLainnyaTransactions.reduce((acc, curr) => {
      const s = (curr.Status || curr.status || "").toUpperCase().trim();
      if (s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING") {
        return acc + (parseCurrency(curr.Pemasukan || curr.Total || curr.Nominal) || parseCurrency(curr.HargaModal) || 0);
      }
      let base = parseCurrency(curr.HargaModal || curr.Pemasukan || curr.Total || curr.Nominal || 0);
      if ((curr.Melalui || "").toUpperCase().trim() === "EDC BNI" && s === "BELUM DIAMBIL") {
        base -= 1500;
      }
      const net = base - (parseCurrency(curr.Sebagian) || 0);
      return acc + (net > 0 ? net : 0);
    }, 0);

    // Direct from Supabase / customer data without recalculation
    const poin = Number(c.poin ?? (c as any).point ?? (c as any).Poin ?? (c as any).Point ?? 0);
    const level = String(c.level ?? (c as any).Level ?? 'Bronze');

    // 7. 6 AKTIVITAS TERAKHIR (Semua Waktu / All Time)
    const rawActivities: any[] = [];
    userSales.forEach(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const nominal = parseCurrency(t.Pemasukan || t.Total || t.Nominal || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
      let rawJenis = t.Kategori || t.Jenis || t.Keterangan || t.NamaBarang || t.Produk || t.Barang;
      if (!rawJenis || rawJenis === 'Umum' || rawJenis === '-') rawJenis = 'Transaksi';
      const jenisClean = String(rawJenis).replace(/^Transaksi\s+/i, '').trim() || 'Transaksi';
      const rawMetode = String(t.MetodePembayaran || t.Metode || t.MetodeBayar || '').trim().toUpperCase();
      const statusUpper = String(t.Status || t.status || '').trim().toUpperCase();
      const isKasbon = statusUpper.includes('KASBON') || Boolean(t.Kasbon) || Boolean(t.IsKasbon) || rawMetode.includes('KASBON') || rawMetode.includes('HUTANG');
      const isTabungan = rawMetode.includes('TABUNGAN');

      let metodeTag = isKasbon ? ' (KASBON)' : isTabungan ? ' (TABUNGAN)' : (rawMetode && !rawMetode.includes('TUNAI') && !rawMetode.includes('CASH')) ? ` (${rawMetode})` : '';

      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'sales',
        isKasbonOrDebt: isKasbon,
        isTabungan: isTabungan,
        text: `* ${rel}: ${jenisClean} ${formatNominal}${metodeTag}`.replace(/\s+/g, ' ').trim()
      });
    });

    userSavings.forEach(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isSetor = tipeStr.includes('SETOR') || tipeStr.includes('TAMBAH') || (t.Setor && parseCurrency(t.Setor) > 0);
      const tipe = isSetor ? 'Setor Tabungan' : 'Tarik Tabungan';
      const nominal = parseCurrency(t.Nominal || t.Jumlah || t.Setor || t.Tarik || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
      const rawKet = (t.Berita || t.Keterangan || t.Catatan || '').trim();
      const ketClean = (rawKet && rawKet !== '-' && !rawKet.toLowerCase().includes('tabungan')) ? rawKet : '';
      const ketTag = ketClean ? ` (${ketClean.toUpperCase()})` : '';

      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'savings',
        isTabungan: true,
        text: `* ${rel}: ${tipe} ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
      });
    });

    userInvestments.forEach(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const isCair = (t.Jenis || '').toLowerCase().includes('cair') || (t.Jenis || '').toLowerCase().includes('tarik');
      const actionText = isCair ? 'Pencairan Investasi' : 'Tambah Investasi';
      const nominal = parseCurrency(t.Nominal || t.Jumlah || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'investment',
        text: `* ${rel}: ${actionText} ${formatNominal}`.trim()
      });
    });

    userDebts.forEach(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isBayar = tipeStr.includes('BAYAR') || tipeStr.includes('KURANG') || (t.Kredit && parseCurrency(t.Kredit) > 0);
      const tipe = isBayar ? 'Bayar Hutang' : 'Kasbon';
      const nominal = parseCurrency(t.Jumlah || t.Nominal || t.Kredit || t.Debet || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
      const rawKet = (t.Keterangan || t.Berita || t.Catatan || t.Kategori || t.MetodePembayaran || t.Metode || '').trim();
      const upperKet = rawKet.toUpperCase();
      let ketTag = isBayar ? (upperKet.includes('TABUNGAN') ? ' (TABUNGAN)' : '') : (rawKet && rawKet !== '-' ? ` (${rawKet.toUpperCase()})` : '');

      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'debt',
        isKasbonOrDebt: !isBayar,
        isTabungan: isBayar && upperKet.includes('TABUNGAN'),
        text: `* ${rel}: ${tipe} ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
      });
    });

    const userRedeemedList = (idPelanggan && redeemedByCustId.get(idPelanggan)) || redeemedByCustName.get(name) || [];
    userRedeemedList.forEach(r => {
      const tDate = r.Tanggal || r.tanggal;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const poinVal = r.Poin || r.poin || 0;
      rawActivities.push({
        date: d,
        rel,
        nominal: 0,
        source: 'points',
        text: `* ${rel}: Tukar Poin ${poinVal} Poin`.trim()
      });
    });

    rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const aktivitas_terakhir = rawActivities.slice(0, 6).map(a => a.text).join('\n') || 'Belum ada aktivitas';

    // 8. 10 MUTASI TABUNGAN TERAKHIR (Semua Waktu / All Time)
    const mappedSavings = userSavings.map(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const dateStr = formatDateDDMMYYYY(d, tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isSetor = tipeStr.includes('SETOR') || tipeStr.includes('TAMBAH') || (t.Setor && parseCurrency(t.Setor) > 0);
      const tipe = isSetor ? 'Setor Tabungan' : 'Tarik Tabungan';
      const nominal = parseCurrency(t.Nominal || t.Jumlah || t.Setor || t.Tarik || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Berita || t.Keterangan || t.Catatan || '').trim();
      const ketClean = (rawKet && rawKet !== '-' && !rawKet.toLowerCase().includes('tabungan')) ? rawKet : '';
      const ketTag = ketClean ? ` (${ketClean.toUpperCase()})` : '';
      return {
        d,
        text: `* ${dateStr} : ${tipe} ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
      };
    });
    mappedSavings.sort((a, b) => b.d.getTime() - a.d.getTime());
    const mutasi_tabungan = mappedSavings.slice(0, 10).map(s => s.text).join('\n') || 'Belum ada mutasi tabungan';

    // 9. 10 CATATAN HUTANG TERAKHIR (Semua Waktu / All Time)
    const mappedDebts = userDebts.map(t => {
      const tDate = t.Tanggal || t.tanggal;
      const d = parseDate(tDate);
      const dateStr = formatDateDDMMYYYY(d, tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isBayar = tipeStr.includes('BAYAR') || tipeStr.includes('KURANG') || (t.Kredit && parseCurrency(t.Kredit) > 0);
      const tipe = isBayar ? 'BAYAR' : 'HUTANG';
      const nominal = parseCurrency(t.Jumlah || t.Nominal || t.Kredit || t.Debet || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Keterangan || t.Berita || t.Catatan || t.Kategori || t.MetodePembayaran || t.Metode || '').trim();
      const upperKet = rawKet.toUpperCase();
      let ketTag = isBayar 
        ? (upperKet.includes('TABUNGAN') ? ' (TABUNGAN)' : '') 
        : (rawKet && rawKet !== '-' ? ` (${rawKet.toUpperCase()})` : '');
      return {
        d,
        text: `* ${dateStr} : ${tipe} ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
      };
    });
    mappedDebts.sort((a, b) => b.d.getTime() - a.d.getTime());
    const catatan_hutang = mappedDebts.slice(0, 10).map(d => d.text).join('\n') || 'Belum ada catatan hutang';

    // 10. Total Belanja Bulan Ini (YYYY-MM)
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const total_belanja_bulan_ini = userSales
      .filter(t => {
        const d = parseDate(t.Tanggal || t.tanggal);
        return d.getFullYear() === currYear && d.getMonth() === currMonth;
      })
      .reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan || curr.Total || curr.Nominal || 0)), 0);

    return {
      ...c,
      tabungan,
      investasi,
      lainnya,
      hutang,
      poin,
      level,
      aktivitas_terakhir,
      mutasi_tabungan,
      catatan_hutang,
      total_belanja_bulan_ini
    };
  });

  const activeList = list
    .filter(c => (c.total_belanja_bulan_ini || 0) > 0)
    .sort((a, b) => (b.total_belanja_bulan_ini || 0) - (a.total_belanja_bulan_ini || 0));
  const totalActive = activeList.length;

  return list.map(c => {
    const monthlyTotal = c.total_belanja_bulan_ini || 0;
    let peringkat = "Belum ada belanja bulan ini";
    if (monthlyTotal > 0) {
      const rankIdx = activeList.findIndex(item => item.id_pelanggan === c.id_pelanggan || (item.nama || item.Nama || '').toLowerCase() === (c.nama || c.Nama || '').toLowerCase());
      if (rankIdx !== -1) {
        peringkat = `Ke ${rankIdx + 1} dari ${totalActive}`;
      }
    }
    return {
      ...c,
      peringkat,
      Peringkat: peringkat,
      Lainnya: c.lainnya,
      TotalBelanjaBulanIni: monthlyTotal,
      AktivitasTerakhir: c.aktivitas_terakhir,
      MutasiTabungan: c.mutasi_tabungan,
      CatatanHutang: c.catatan_hutang
    };
  });
};

export const syncAllCustomerStatsToGoogleSheets = async (
  custList: any[],
  salesList: any[] = [],
  savingsList: any[] = [],
  debtList: any[] = [],
  investList: any[] = [],
  redeemList: any[] = [],
  scriptUrl: string = DEFAULT_APPS_SCRIPT_URL
) => {
  if (!custList || custList.length === 0) return { success: false, message: 'Tidak ada data pelanggan' };

  try {
    const formattedStats = computeCustomerStatsForSheets(
      custList,
      salesList,
      savingsList,
      debtList,
      investList,
      redeemList
    );

    const payload = {
      action: 'syncCustomers',
      customers: formattedStats
    };

    let syncSuccess = false;
    let errorMsg = '';

    // 1. Try server-side proxy endpoint first to bypass browser CORS / redirect blocks
    try {
      const proxyRes = await fetch('/api/sheets/apps-script-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scriptUrl,
          payload
        })
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json().catch(() => ({ success: true }));
        if (proxyData.success) {
          syncSuccess = true;
        }
      }
    } catch (proxyErr) {
      console.warn('Proxy sync attempt failed, attempting direct sync...', proxyErr);
    }

    // 2. Fallback to direct fetch if proxy was unavailable
    if (!syncSuccess) {
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        let resData: any = {};
        try {
          resData = await response.json();
        } catch {
          resData = { status: response.ok ? 'success' : 'unknown' };
        }

        if (resData.status === 'success' || response.ok) {
          syncSuccess = true;
        } else {
          errorMsg = resData.message || 'Gagal menyinkronkan data ke Google Sheets';
        }
      } catch (directErr: any) {
        errorMsg = directErr?.message || 'Koneksi ke Google Sheets gagal';
      }
    }

    if (syncSuccess) {
      const timeNow = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateNow = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const fullTimeStr = `${dateNow} ${timeNow}`;
      localStorage.setItem('LAST_SHEETS_SYNC', fullTimeStr);
      return { success: true, timestamp: fullTimeStr, count: custList.length };
    } else {
      return { success: false, error: errorMsg || 'Gagal menyinkronkan data' };
    }
  } catch (err: any) {
    console.warn('Notice in syncAllCustomerStatsToGoogleSheets:', err?.message || err);
    return { success: false, error: err?.message || 'Gagal menyinkronkan data' };
  }
};
