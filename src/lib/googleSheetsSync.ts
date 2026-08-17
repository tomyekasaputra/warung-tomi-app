import { 
  SupabaseCustomerService, 
  SupabaseSalesService, 
  SupabaseSavingsService, 
  SupabaseDebtService, 
  SupabaseInvestmentService, 
  SupabasePointsService 
} from "./supabase";

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

export const extractCleanItemOrReason = (rawStr: string, salesMap?: Map<string, any>): string => {
  if (!rawStr || rawStr === '-' || rawStr === '0') return '';
  let str = String(rawStr).trim();

  // If there's a transaction ID like "Kasbon Belanja Virtual - TRX-1234" or "Kasbon Belanja - POS-1234", try lookup in salesMap
  const txMatch = str.match(/[-:]\s*([A-Za-z0-9_-]{3,})$/);
  if (txMatch && salesMap) {
    const txId = txMatch[1].trim();
    const matchedTx = salesMap.get(txId);
    if (matchedTx) {
      let rawJenis = matchedTx.Kategori || matchedTx.Jenis || matchedTx.Keterangan || matchedTx.NamaBarang || matchedTx.Produk || matchedTx.Barang || matchedTx.kategori || matchedTx.jenis;
      if (rawJenis && rawJenis !== 'Umum' && rawJenis !== '-' && rawJenis !== 'Transaksi') {
        const clean = String(rawJenis).replace(/^Transaksi\s+/i, '').trim();
        if (clean) {
          return clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    }
  }

  // Remove common prefix noise
  str = str.replace(/^(kasbon\s+belanja\s+virtual|kasbon\s+belanja|kasbon\s+manual|kasbon\s+barang|kasbon|hutang\s+belanja|hutang)\s*[-:]?\s*/i, '');
  // Remove transaction code suffix like - TRX-1234 or - POS-1234
  str = str.replace(/\s*-\s*[A-Za-z0-9_-]{3,}\s*$/, '');
  str = str.trim();

  // If after cleaning it's empty or just noise
  if (!str || /^(transaksi|umum|-|belanja|kasbon|hutang)$/i.test(str)) {
    return '';
  }

  // Capitalize nicely: "pulsa telkomsel" -> "Pulsa Telkomsel"
  return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const computeCustomerStatsForSheets = (
  custList: any[],
  salesList: any[] = [],
  savingsList: any[] = [],
  debtList: any[] = [],
  investList: any[] = [],
  redeemList: any[] = []
) => {
  const salesMap = new Map<string, any>();
  const salesByCustId = new Map<string, any[]>();
  const salesByCustName = new Map<string, any[]>();

  salesList.forEach(t => {
    const txId = t.id_transaksi || t.id || t.ID || t.IdTransaksi;
    if (txId) {
      salesMap.set(String(txId).trim(), t);
    }
    const cId = (t.id_pelanggan || t.IdPelanggan || t.idPelanggan || t.pelanggan_id || '').toLowerCase().trim();
    if (cId && !isGenericId(cId)) {
      const list = salesByCustId.get(cId) || [];
      list.push(t);
      salesByCustId.set(cId, list);
    }
    const n = (t.Nama || t.nama || t.NamaPelanggan || t.nama_pelanggan || t.Pelanggan || t.pelanggan || '').toLowerCase().trim();
    if (n) {
      const list = salesByCustName.get(n) || [];
      list.push(t);
      salesByCustName.set(n, list);
    }
  });

  const savingsByCustId = new Map<string, any[]>();
  const savingsByCustName = new Map<string, any[]>();
  savingsList.forEach(t => {
    const cId = (t.id_pelanggan || t.IdPelanggan || t.idPelanggan || t.pelanggan_id || '').toLowerCase().trim();
    if (cId && !isGenericId(cId)) {
      const list = savingsByCustId.get(cId) || [];
      list.push(t);
      savingsByCustId.set(cId, list);
    }
    const n = (t.Nama || t.nama || t.NamaPelanggan || t.nama_pelanggan || t.Pelanggan || t.pelanggan || '').toLowerCase().trim();
    if (n) {
      const list = savingsByCustName.get(n) || [];
      list.push(t);
      savingsByCustName.set(n, list);
    }
  });

  const debtsByCustId = new Map<string, any[]>();
  const debtsByCustName = new Map<string, any[]>();
  debtList.forEach(t => {
    const cId = (t.id_pelanggan || t.IdPelanggan || t.idPelanggan || t.pelanggan_id || '').toLowerCase().trim();
    if (cId && !isGenericId(cId)) {
      const list = debtsByCustId.get(cId) || [];
      list.push(t);
      debtsByCustId.set(cId, list);
    }
    const n = (t.Nama || t.nama || t.NamaPelanggan || t.nama_pelanggan || t.Pelanggan || t.pelanggan || '').toLowerCase().trim();
    if (n) {
      const list = debtsByCustName.get(n) || [];
      list.push(t);
      debtsByCustName.set(n, list);
    }
  });

  const investmentsByCustId = new Map<string, any[]>();
  const investmentsByCustName = new Map<string, any[]>();
  investList.forEach(t => {
    const cId = (t.id_pelanggan || t.IdPelanggan || t.idPelanggan || t.pelanggan_id || '').toLowerCase().trim();
    if (cId && !isGenericId(cId)) {
      const list = investmentsByCustId.get(cId) || [];
      list.push(t);
      investmentsByCustId.set(cId, list);
    }
    const n = (t.Nama || t.nama || t.NamaPelanggan || t.nama_pelanggan || t.Pelanggan || t.pelanggan || '').toLowerCase().trim();
    if (n) {
      const list = investmentsByCustName.get(n) || [];
      list.push(t);
      investmentsByCustName.set(n, list);
    }
  });

  const redeemedByCustId = new Map<string, any[]>();
  const redeemedByCustName = new Map<string, any[]>();
  redeemList.forEach(r => {
    const cId = (r.id_pelanggan || r.IdPelanggan || r.idPelanggan || r.pelanggan_id || '').toLowerCase().trim();
    if (cId && !isGenericId(cId)) {
      const list = redeemedByCustId.get(cId) || [];
      list.push(r);
      redeemedByCustId.set(cId, list);
    }
    const n = (r.Nama || r.nama || r.NamaPelanggan || r.nama_pelanggan || r.Pelanggan || r.pelanggan || '').toLowerCase().trim();
    if (n) {
      const list = redeemedByCustName.get(n) || [];
      list.push(r);
      redeemedByCustName.set(n, list);
    }
  });

  const getMergedUserList = (byIdMap: Map<string, any[]>, byNameMap: Map<string, any[]>, id?: string, name?: string): any[] => {
    const matched: any[] = [];
    const seen = new Set<string>();

    const add = (item: any) => {
      const uniqueKey = item.id_transaksi || item.id || item.ID || `${item.Tanggal || item.tanggal || item.created_at || ''}_${item.Total || item.total || item.Pemasukan || item.pemasukan || item.Nominal || item.nominal || item.Jumlah || item.jumlah || ''}_${item.Keterangan || item.keterangan || item.Kategori || item.kategori || ''}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        matched.push(item);
      }
    };

    const normId = (id || '').toLowerCase().trim();
    if (normId && !isGenericId(normId)) {
      const list = byIdMap.get(normId);
      if (list) list.forEach(add);
    }

    const normName = (name || '').toLowerCase().trim();
    if (normName) {
      const list = byNameMap.get(normName);
      if (list) list.forEach(add);
    }

    return matched;
  };

  const list = custList.map(c => {
    const name = (c.nama || c.Nama || "").toLowerCase().trim();
    const idPelanggan = c.id_pelanggan || c.id;

    // 1. Savings (All time)
    const userSavings = getMergedUserList(savingsByCustId, savingsByCustName, idPelanggan, name);
    const tabungan = userSavings.length > 0 ? (userSavings[userSavings.length - 1].SaldoAkhir ?? userSavings[userSavings.length - 1].saldo_akhir ?? 0) : 0;

    // 2. Investment (All time active)
    const userInvestments = getMergedUserList(investmentsByCustId, investmentsByCustName, idPelanggan, name);
    const investasi = userInvestments.filter(t => (t.Status || t.status || '') !== "Selesai").reduce((acc, curr) => acc + (curr.Nominal || curr.nominal || 0), 0);

    // 3. Debt (All time)
    const userDebts = getMergedUserList(debtsByCustId, debtsByCustName, idPelanggan, name);
    const hutang = userDebts.length > 0 ? (userDebts[userDebts.length - 1].SaldoAkhir ?? userDebts[userDebts.length - 1].saldo_akhir ?? 0) : 0;

    // 4. Sales (All time)
    const userSales = getMergedUserList(salesByCustId, salesByCustName, idPelanggan, name);

    // 5. Lainnya (All time active)
    const userLainnyaTransactions = userSales.filter(t => {
      const s = (t.Status || t.status || "").toUpperCase().trim();
      return s === "BELUM DIAMBIL" || s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
    });

    const lainnya = userLainnyaTransactions.reduce((acc, curr) => {
      const s = (curr.Status || curr.status || "").toUpperCase().trim();
      if (s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING") {
        return acc + (parseCurrency(curr.Pemasukan || curr.pemasukan || curr.Total || curr.total || curr.Nominal || curr.nominal) || parseCurrency(curr.HargaModal || curr.harga_modal) || 0);
      }
      let base = parseCurrency(curr.HargaModal || curr.harga_modal || curr.Pemasukan || curr.pemasukan || curr.Total || curr.total || curr.Nominal || curr.nominal || 0);
      if ((curr.Melalui || curr.melalui || "").toUpperCase().trim() === "EDC BNI" && s === "BELUM DIAMBIL") {
        base -= 1500;
      }
      const net = base - (parseCurrency(curr.Sebagian || curr.sebagian) || 0);
      return acc + (net > 0 ? net : 0);
    }, 0);

    // Direct from Supabase / customer data without recalculation
    const poin = Number(c.poin ?? (c as any).point ?? (c as any).Poin ?? (c as any).Point ?? 0);
    const level = String(c.level ?? (c as any).Level ?? 'Bronze');

    // 7. 6 AKTIVITAS TERAKHIR (Semua Waktu / All Time)
    const rawActivities: any[] = [];
    const salesKasbonTimes: number[] = [];
    const salesTabunganTimes: number[] = [];
    const debtPaidTabunganTimes: number[] = [];

    userSales.forEach(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const nominal = parseCurrency(t.Pemasukan || t.pemasukan || t.Total || t.total || t.Nominal || t.nominal || t.HargaModal || t.harga_modal || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      let rawJenis = t.Kategori || t.kategori || t.Jenis || t.jenis || t.Keterangan || t.keterangan || t.NamaBarang || t.nama_barang || t.Produk || t.produk || t.Barang || t.barang;
      if (!rawJenis || rawJenis === 'Umum' || rawJenis === '-' || rawJenis === 'Transaksi') rawJenis = 'Belanja';
      const jenisClean = String(rawJenis).replace(/^Transaksi\s+/i, '').trim().toUpperCase() || 'BELANJA';
      const rawMetode = String(t.MetodePembayaran || t.metode_pembayaran || t.Metode || t.metode || t.MetodeBayar || t.metode_bayar || '').trim().toUpperCase();
      const statusUpper = String(t.Status || t.status || '').trim().toUpperCase();
      const isKasbon = statusUpper.includes('KASBON') || Boolean(t.Kasbon) || Boolean(t.IsKasbon) || rawMetode.includes('KASBON') || rawMetode.includes('HUTANG');
      const isTabungan = rawMetode.includes('TABUNGAN');

      if (isKasbon) salesKasbonTimes.push(d.getTime());
      if (isTabungan) salesTabunganTimes.push(d.getTime());

      let tag = '';
      if (isKasbon) {
        tag = ' (Kasbon)';
      } else if (isTabungan) {
        tag = ' (Tabungan)';
      } else if (rawMetode && !rawMetode.includes('TUNAI') && !rawMetode.includes('CASH')) {
        const titleMetode = rawMetode.charAt(0) + rawMetode.slice(1).toLowerCase();
        tag = ` (${titleMetode})`;
      } else {
        tag = '';
      }

      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'sales',
        text: `* ${rel}: ${jenisClean} ${formatNominal}${tag}`.replace(/\s+/g, ' ').trim()
      });
    });

    userDebts.forEach(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isBayar = tipeStr.includes('BAYAR') || tipeStr.includes('KURANG') || (t.Kredit && parseCurrency(t.Kredit) > 0) || (t.kredit && parseCurrency(t.kredit) > 0);
      const nominal = parseCurrency(t.Jumlah || t.jumlah || t.Nominal || t.nominal || t.Kredit || t.kredit || t.Debet || t.debet || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Keterangan || t.keterangan || t.Berita || t.berita || t.Catatan || t.catatan || t.Kategori || t.kategori || t.MetodePembayaran || t.metode_pembayaran || t.Metode || t.metode || '').trim();
      const upperKet = rawKet.toUpperCase();
      const isFromTabungan = upperKet.includes('TABUNGAN') || String(t.Metode || t.metode || '').toUpperCase().includes('TABUNGAN');

      if (isBayar) {
        if (isFromTabungan) {
          debtPaidTabunganTimes.push(d.getTime());
          rawActivities.push({
            date: d,
            rel,
            nominal,
            source: 'debt',
            text: `* ${rel}: Bayar Hutang ${formatNominal} Dari Tabungan`.replace(/\s+/g, ' ').trim()
          });
        } else {
          rawActivities.push({
            date: d,
            rel,
            nominal,
            source: 'debt',
            text: `* ${rel}: Bayar Hutang ${formatNominal}`.replace(/\s+/g, ' ').trim()
          });
        }
      } else {
        // Cek apakah kasbon ini berasal dari penjualan belanja/virtual yang sudah dicatat di userSales
        const isFromSales = /belanja|virtual|trx|pos|inv/i.test(rawKet) || salesKasbonTimes.some(st => Math.abs(st - d.getTime()) <= 300000);
        if (!isFromSales) {
          const itemReason = extractCleanItemOrReason(rawKet, salesMap);
          const tag = itemReason ? ` (${itemReason})` : '';
          rawActivities.push({
            date: d,
            rel,
            nominal,
            source: 'debt',
            text: `* ${rel}: Kasbon ${formatNominal}${tag}`.replace(/\s+/g, ' ').trim()
          });
        }
      }
    });

    userSavings.forEach(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isSetor = tipeStr.includes('SETOR') || tipeStr.includes('TAMBAH') || (t.Setor && parseCurrency(t.Setor) > 0) || (t.setor && parseCurrency(t.setor) > 0);
      const nominal = parseCurrency(t.Nominal || t.nominal || t.Jumlah || t.jumlah || t.Setor || t.setor || t.Tarik || t.tarik || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Berita || t.berita || t.Keterangan || t.keterangan || t.Catatan || t.catatan || '').trim();

      if (isSetor) {
        rawActivities.push({
          date: d,
          rel,
          nominal,
          source: 'savings',
          text: `* ${rel}: Setor Tabungan ${formatNominal}`.replace(/\s+/g, ' ').trim()
        });
      } else {
        // Cek apakah penarikan ini sudah dicatat sebagai bayar hutang dari tabungan atau belanja metode tabungan
        const isDebtPayment = debtPaidTabunganTimes.some(dt => Math.abs(dt - d.getTime()) <= 300000) || /bayar\s*hutang|pelunasan/i.test(rawKet);
        const isSalesPayment = salesTabunganTimes.some(st => Math.abs(st - d.getTime()) <= 300000) || /belanja|virtual|bayar\s*belanja|pos|trx/i.test(rawKet);

        if (isDebtPayment || isSalesPayment) {
          return;
        }

        const reason = extractCleanItemOrReason(rawKet);
        let reasonTag = '';
        if (reason) {
          reasonTag = ` (${reason})`;
        } else if (rawKet && rawKet !== '-' && !/tabungan|tarik/i.test(rawKet)) {
          reasonTag = ` (${rawKet})`;
        }

        rawActivities.push({
          date: d,
          rel,
          nominal,
          source: 'savings',
          text: `* ${rel}: Tarik Tabungan ${formatNominal}${reasonTag}`.replace(/\s+/g, ' ').trim()
        });
      }
    });

    userInvestments.forEach(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const rel = getRelativeTimeString(tDate);
      const isCair = (t.Jenis || t.jenis || '').toLowerCase().includes('cair') || (t.Jenis || t.jenis || '').toLowerCase().includes('tarik');
      const actionText = isCair ? 'Pencairan Investasi' : 'Tambah Investasi';
      const nominal = parseCurrency(t.Nominal || t.nominal || t.Jumlah || t.jumlah || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      rawActivities.push({
        date: d,
        rel,
        nominal,
        source: 'investment',
        text: `* ${rel}: ${actionText} ${formatNominal}`.trim()
      });
    });

    const userRedeemedList = getMergedUserList(redeemedByCustId, redeemedByCustName, idPelanggan, name);
    userRedeemedList.forEach(r => {
      const tDate = r.Tanggal || r.tanggal || r.created_at || r.CreatedAt || r.waktu || r.Waktu;
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
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const dateStr = formatDateDDMMYYYY(d, tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isSetor = tipeStr.includes('SETOR') || tipeStr.includes('TAMBAH') || (t.Setor && parseCurrency(t.Setor) > 0) || (t.setor && parseCurrency(t.setor) > 0);
      const nominal = parseCurrency(t.Nominal || t.nominal || t.Jumlah || t.jumlah || t.Setor || t.setor || t.Tarik || t.tarik || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Berita || t.berita || t.Keterangan || t.keterangan || t.Catatan || t.catatan || '').trim();

      if (isSetor) {
        return {
          d,
          text: `* ${dateStr}: Setor ${formatNominal}`.replace(/\s+/g, ' ').trim()
        };
      } else {
        let reasonTag = '';
        if (/bayar\s*hutang|pelunasan/i.test(rawKet)) {
          reasonTag = ' (Bayar Hutang)';
        } else if (/pulsa/i.test(rawKet)) {
          reasonTag = ' (Bayar Pulsa)';
        } else if (/paket\s*data/i.test(rawKet)) {
          reasonTag = ' (Bayar Paket Data)';
        } else if (/belanja|virtual|pos|trx/i.test(rawKet)) {
          // Cari apakah ada nama produk
          const itemReason = extractCleanItemOrReason(rawKet);
          reasonTag = itemReason ? ` (Bayar ${itemReason})` : ' (Bayar Belanja)';
        } else {
          const itemReason = extractCleanItemOrReason(rawKet);
          if (itemReason) {
            reasonTag = itemReason.toLowerCase().startsWith('bayar') ? ` (${itemReason})` : ` (Bayar ${itemReason})`;
          } else if (rawKet && rawKet !== '-' && !/tabungan|tarik/i.test(rawKet)) {
            reasonTag = ` (${rawKet})`;
          }
        }
        return {
          d,
          text: `* ${dateStr}: Tarik ${formatNominal}${reasonTag}`.replace(/\s+/g, ' ').trim()
        };
      }
    });
    mappedSavings.sort((a, b) => b.d.getTime() - a.d.getTime());
    const mutasi_tabungan = mappedSavings.slice(0, 10).map(s => s.text).join('\n') || 'Belum ada mutasi tabungan';

    // 9. 10 CATATAN HUTANG TERAKHIR (Semua Waktu / All Time)
    const mappedDebts = userDebts.map(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const dateStr = formatDateDDMMYYYY(d, tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isBayar = tipeStr.includes('BAYAR') || tipeStr.includes('KURANG') || (t.Kredit && parseCurrency(t.Kredit) > 0) || (t.kredit && parseCurrency(t.kredit) > 0);
      const nominal = parseCurrency(t.Jumlah || t.jumlah || t.Nominal || t.nominal || t.Kredit || t.kredit || t.Debet || t.debet || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Keterangan || t.keterangan || t.Berita || t.berita || t.Catatan || t.catatan || t.Kategori || t.kategori || t.MetodePembayaran || t.metode_pembayaran || t.Metode || t.metode || '').trim();
      const upperKet = rawKet.toUpperCase();
      const isFromTabungan = upperKet.includes('TABUNGAN') || String(t.Metode || t.metode || '').toUpperCase().includes('TABUNGAN');

      if (isBayar) {
        if (isFromTabungan) {
          return {
            d,
            text: `* ${dateStr}: Bayar ${formatNominal} (Tabungan)`.replace(/\s+/g, ' ').trim()
          };
        } else {
          return {
            d,
            text: `* ${dateStr}: Bayar ${formatNominal}`.replace(/\s+/g, ' ').trim()
          };
        }
      } else {
        // Coba cari nama produk jika ada
        const cleanReason = extractCleanItemOrReason(rawKet, salesMap);
        const ketTag = cleanReason ? ` (${cleanReason})` : '';
        return {
          d,
          text: `* ${dateStr}: Hutang ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
        };
      }
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
    const nowJakarta = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const tabungan = Number(c.tabungan ?? c.Tabungan ?? 0);
    const investasi = Number(c.investasi ?? c.Investasi ?? 0);
    const lainnya = Number(c.lainnya ?? c.Lainnya ?? 0);
    const hutang = Number(c.hutang ?? c.Hutang ?? 0);
    const level = c.level || c.Level || 'Bronze';
    const poin = Number(c.poin ?? c.point ?? c.Poin ?? c.Point ?? 0);
    const total_belanja_bulan_ini = monthlyTotal;
    const aktivitas_terakhir = c.aktivitas_terakhir || 'Belum ada aktivitas';
    const mutasi_tabungan = c.mutasi_tabungan || 'Belum ada mutasi tabungan';
    const catatan_hutang = c.catatan_hutang || 'Belum ada catatan hutang';

    return {
      ...c,
      id_pelanggan: c.id_pelanggan || c.id || '',
      nama: c.nama || c.Nama || 'Pelanggan',
      tabungan,
      investasi,
      lainnya,
      hutang,
      level,
      poin,
      total_belanja_bulan_ini,
      peringkat,
      aktivitas_terakhir,
      mutasi_tabungan,
      catatan_hutang,
      terakhir_diperbarui: nowJakarta,
      // Field aliases for compatibility
      "id pelanggan": c.id_pelanggan || c.id || '',
      "ID Pelanggan": c.id_pelanggan || c.id || '',
      "Nama": c.nama || c.Nama || 'Pelanggan',
      "Tabungan": tabungan,
      "Investasi": investasi,
      "Lainnya": lainnya,
      "Hutang": hutang,
      "Level": level,
      "Poin": poin,
      "total belanja bulan ini": total_belanja_bulan_ini,
      "Total Belanja Bulan Ini": total_belanja_bulan_ini,
      "Peringkat": peringkat,
      "aktivitas terakhir": aktivitas_terakhir,
      "Aktivitas Terakhir": aktivitas_terakhir,
      "mutasi tabungan": mutasi_tabungan,
      "Mutasi Tabungan": mutasi_tabungan,
      "catatan hutang": catatan_hutang,
      "Catatan Hutang": catatan_hutang,
      "terakhir diperbarui": nowJakarta,
      "Terakhir Diperbarui": nowJakarta
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
  let targetCustList = custList || [];
  let targetSales = salesList || [];
  let targetSavings = savingsList || [];
  let targetDebt = debtList || [];
  let targetInvest = investList || [];
  let targetRedeem = redeemList || [];

  // Always fetch the complete customer database from Supabase if connected to ensure 100% of customers are synced
  if (SupabaseCustomerService.isConnected()) {
    try {
      const { data: supaAllCust } = await SupabaseCustomerService.getCustomers();
      if (supaAllCust && supaAllCust.length > 0) {
        targetCustList = supaAllCust.map((c: any, index: number) => ({
          id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
          id: c.id_pelanggan || c.id || `CUST-${String(index + 1).padStart(4, '0')}`,
          nama: c.nama || 'Pelanggan',
          Nama: c.nama || 'Pelanggan',
          pin: c.pin || '',
          PIN: c.pin || '',
          telepon: c.telepon || '',
          Telepon: c.telepon || '',
          alamat: c.alamat || '',
          Alamat: c.alamat || '',
          foto: c.foto || '',
          Foto: c.foto || '',
          poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
          Poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
          level: c.level || c.Level || 'Bronze',
          Level: c.level || c.Level || 'Bronze',
          tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
          Tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
          investasi: Number(c.investasi ?? c.Investasi ?? 0),
          Investasi: Number(c.investasi ?? c.Investasi ?? 0),
          lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
          Lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
          hutang: Number(c.hutang ?? c.Hutang ?? 0),
          Hutang: Number(c.hutang ?? c.Hutang ?? 0)
        }));
      }
    } catch (custErr) {
      console.warn('Could not fetch all customers from Supabase in syncAllCustomerStatsToGoogleSheets:', custErr);
    }
  }

  if (!targetCustList || targetCustList.length === 0) return { success: false, message: 'Tidak ada data pelanggan' };

  try {
    const formattedStats = computeCustomerStatsForSheets(
      targetCustList,
      targetSales,
      targetSavings,
      targetDebt,
      targetInvest,
      targetRedeem
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
      return { success: true, timestamp: fullTimeStr, count: targetCustList.length };
    } else {
      return { success: false, error: errorMsg || 'Gagal menyinkronkan data' };
    }
  } catch (err: any) {
    console.warn('Notice in syncAllCustomerStatsToGoogleSheets:', err?.message || err);
    return { success: false, error: err?.message || 'Gagal menyinkronkan data' };
  }
};
