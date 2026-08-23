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
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date(0) : dateStr;
  if (typeof dateStr === 'number') return new Date(dateStr);
  const trimmed = String(dateStr).trim();
  if (!trimmed) return new Date(0);

  // If it's a numeric timestamp string
  if (/^\d{10,13}$/.test(trimmed)) {
    const num = Number(trimmed);
    return new Date(trimmed.length === 10 ? num * 1000 : num);
  }

  // If standard ISO string or parseable by new Date
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // Split date and time by space or T
  const delimiter = trimmed.includes('T') ? 'T' : ' ';
  const partsWithTime = trimmed.split(delimiter);
  const datePart = partsWithTime[0].trim();
  const timePart = (partsWithTime[1] || '').trim();

  let h = 0, m = 0, s = 0;
  if (timePart) {
    const tParts = timePart.replace(/[Zz]/, '').split(':');
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
      // YYYY-MM-DD
      return new Date(p0, p1 - 1, p2, h, m, s);
    }
    if (parts[2].length === 4) {
      // DD-MM-YYYY
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

    // 1. Tabungan: Saldo Otentik Langsung dari Database Pelanggan Supabase
    const userSavings = getMergedUserList(savingsByCustId, savingsByCustName, idPelanggan, name);
    userSavings.sort((a, b) => {
      const timeA = parseDate(a.Tanggal || a.tanggal || a.created_at || a.CreatedAt).getTime();
      const timeB = parseDate(b.Tanggal || b.tanggal || b.created_at || b.CreatedAt).getTime();
      return timeA - timeB;
    });
    const tabungan = Number(
      c.tabungan ?? (c as any).Tabungan ?? 
      (userSavings.length > 0 ? (userSavings[userSavings.length - 1].SaldoAkhir ?? userSavings[userSavings.length - 1].saldo_akhir) : 0) ?? 
      0
    );

    // 2. Investasi: Saldo Otentik Langsung dari Database Pelanggan Supabase
    const investasi = Number(c.investasi ?? (c as any).Investasi ?? 0);

    // 3. Lainnya: Saldo Otentik Langsung dari Database Pelanggan Supabase
    const lainnya = Number(c.lainnya ?? (c as any).Lainnya ?? 0);

    // 4. Hutang: Saldo Otentik Langsung dari Database Pelanggan Supabase
    const userDebts = getMergedUserList(debtsByCustId, debtsByCustName, idPelanggan, name);
    userDebts.sort((a, b) => {
      const timeA = parseDate(a.Tanggal || a.tanggal || a.created_at || a.CreatedAt).getTime();
      const timeB = parseDate(b.Tanggal || b.tanggal || b.created_at || b.CreatedAt).getTime();
      return timeA - timeB;
    });
    const hutang = Number(
      c.hutang ?? (c as any).Hutang ?? 
      (userDebts.length > 0 ? (userDebts[userDebts.length - 1].SaldoAkhir ?? userDebts[userDebts.length - 1].saldo_akhir) : 0) ?? 
      0
    );

    // 5. Poin & Level: Saldo Otentik Langsung dari Database Pelanggan Supabase
    const poin = Number(c.point ?? (c as any).Point ?? (c as any).poin ?? (c as any).Poin ?? 0);
    const level = String(c.level ?? (c as any).Level ?? 'Bronze');

    // 6. Sales (All time)
    const userSales = getMergedUserList(salesByCustId, salesByCustName, idPelanggan, name);
    const userInvestments = getMergedUserList(investmentsByCustId, investmentsByCustName, idPelanggan, name);

    // 7. 10 AKTIVITAS TERAKHIR (Semua Waktu / All Time - Lintas Bulan, Limit 10)
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
      const rawMetode = String(
        t.MetodePembayaran || t.metode_pembayaran || 
        t.Metode || t.metode || 
        t.MetodeBayar || t.metode_bayar || 
        t.Metode_Bayar ||
        t.paymentMethod || t.payment_method || 
        ''
      ).trim().toUpperCase();
      const statusUpper = String(t.Status || t.status || t.StatusPembayaran || t.status_pembayaran || '').trim().toUpperCase();
      const rawCatatan = String(t.Catatan || t.catatan || t.Keterangan || t.keterangan || t.Berita || t.berita || '').trim().toUpperCase();
      
      const isKasbon = 
        statusUpper.includes('KASBON') || 
        statusUpper.includes('HUTANG') ||
        rawMetode.includes('KASBON') || 
        rawMetode.includes('HUTANG') || 
        rawCatatan.includes('KASBON') || 
        rawCatatan.includes('HUTANG') || 
        Boolean(t.Kasbon) || Boolean(t.kasbon) || 
        Boolean(t.IsKasbon) || Boolean(t.isKasbon) || Boolean(t.is_kasbon);

      const isTabungan = rawMetode.includes('TABUNGAN') || rawCatatan.includes('TABUNGAN') || statusUpper.includes('TABUNGAN');

      if (isKasbon) salesKasbonTimes.push(d.getTime());
      if (isTabungan) salesTabunganTimes.push(d.getTime());

      let tag = '';
      if (isKasbon) {
        if (!jenisClean.includes('KASBON') && !jenisClean.includes('HUTANG')) {
          tag = ' (Kasbon)';
        }
      } else if (isTabungan) {
        if (!jenisClean.includes('TABUNGAN')) {
          tag = ' (Tabungan)';
        }
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
        // Cek apakah kasbon ini adalah duplikasi dari sales_transactions yang sudah masuk di userSales
        const isDuplicateFromSales = salesKasbonTimes.some(st => Math.abs(st - d.getTime()) <= 300000);
        if (!isDuplicateFromSales) {
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
    const aktivitas_terakhir = rawActivities.slice(0, 10).map(a => a.text).join('\n') || 'Belum ada aktivitas';

    // 8. 10 MUTASI TABUNGAN TERAKHIR (Semua Waktu / All Time - Termasuk Bulan Sebelumnya, Limit 10 Baris)
    const mappedSavings = userSavings.map(t => {
      const tDate = t.Tanggal || t.tanggal || t.created_at || t.CreatedAt || t.waktu || t.Waktu;
      const d = parseDate(tDate);
      const dateStr = formatDateDDMMYYYY(d, tDate);
      const tipeStr = String(t.Tipe || t.tipe || t.Jenis || t.jenis || '').toUpperCase();
      const isSetor = tipeStr.includes('SETOR') || tipeStr.includes('TAMBAH') || (t.Setor && parseCurrency(t.Setor) > 0) || (t.setor && parseCurrency(t.setor) > 0);
      const nominal = parseCurrency(t.Nominal || t.nominal || t.Jumlah || t.jumlah || t.Setor || t.setor || t.Tarik || t.tarik || 0);
      const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : 'Rp 0';
      const rawKet = (t.Berita || t.berita || t.Keterangan || t.keterangan || t.Catatan || t.catatan || '').trim();
      const rawId = String(t.id_tabungan || t.id || t.ID || '');

      if (isSetor) {
        return {
          d,
          rawId,
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
          rawId,
          text: `* ${dateStr}: Tarik ${formatNominal}${reasonTag}`.replace(/\s+/g, ' ').trim()
        };
      }
    });
    // Urutkan dari transaksi terbaru (semua bulan) dan ambil limit 10 baris
    mappedSavings.sort((a, b) => b.d.getTime() - a.d.getTime() || b.rawId.localeCompare(a.rawId));
    const mutasi_tabungan = mappedSavings.slice(0, 10).map(s => s.text).join('\n') || 'Belum ada mutasi tabungan';

    // 9. 10 CATATAN HUTANG TERAKHIR (Semua Waktu / All Time - Termasuk Bulan Sebelumnya, Limit 10 Baris)
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
      const rawId = String(t.id_hutang || t.id || t.ID || '');

      if (isBayar) {
        if (isFromTabungan) {
          return {
            d,
            rawId,
            text: `* ${dateStr}: Bayar ${formatNominal} (Tabungan)`.replace(/\s+/g, ' ').trim()
          };
        } else {
          return {
            d,
            rawId,
            text: `* ${dateStr}: Bayar ${formatNominal}`.replace(/\s+/g, ' ').trim()
          };
        }
      } else {
        // Coba cari nama produk jika ada
        const cleanReason = extractCleanItemOrReason(rawKet, salesMap);
        const ketTag = cleanReason ? ` (${cleanReason})` : '';
        return {
          d,
          rawId,
          text: `* ${dateStr}: Hutang ${formatNominal}${ketTag}`.replace(/\s+/g, ' ').trim()
        };
      }
    });
    // Urutkan dari transaksi terbaru (semua bulan) dan ambil limit 10 baris
    mappedDebts.sort((a, b) => b.d.getTime() - a.d.getTime() || b.rawId.localeCompare(a.rawId));
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

/**
 * Helper Delta Sync: Menghitung compact hash fingerprint untuk mendeteksi perubahan data pelanggan secara efisien
 */
const hashString = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export const computeCustomerRowFingerprint = (row: any): string => {
  const id = row.id_pelanggan || row.id || '';
  const nama = row.nama || row.Nama || '';
  const tabungan = Number(row.tabungan ?? row.Tabungan ?? 0);
  const investasi = Number(row.investasi ?? row.Investasi ?? 0);
  const lainnya = Number(row.lainnya ?? row.Lainnya ?? 0);
  const hutang = Number(row.hutang ?? row.Hutang ?? 0);
  const poin = Number(row.poin ?? row.point ?? row.Poin ?? row.Point ?? 0);
  const level = row.level || row.Level || 'Bronze';
  const belanja = Number(row.total_belanja_bulan_ini ?? row.TotalBelanjaBulanIni ?? row.belanja_bulan_ini ?? 0);
  const aktivitas = String(row.aktivitas_terakhir || row.AktivitasTerakhir || '').trim();
  const mutasi = String(row.mutasi_tabungan || row.MutasiTabungan || '').trim();
  const catatan = String(row.catatan_hutang || row.CatatanHutang || '').trim();

  const raw = `${id}::${nama}::${tabungan}::${investasi}::${lainnya}::${hutang}::${poin}::${level}::${belanja}::${aktivitas}::${mutasi}::${catatan}`;
  return hashString(raw);
};

/**
 * Mengambil status perubahan data pelanggan dibandingkan sinkronisasi sebelumnya
 */
export const getDeltaSyncChanges = (currentRows: any[]) => {
  try {
    const rawSaved = localStorage.getItem('GOOGLE_SHEETS_CUSTOMER_FINGERPRINTS');
    const savedMap: Record<string, string> = rawSaved ? JSON.parse(rawSaved) : {};
    
    const changedRows: any[] = [];
    const unchangedRows: any[] = [];

    currentRows.forEach(row => {
      const key = (row.id_pelanggan || row.id || row.nama || '').trim().toLowerCase();
      const currentFp = computeCustomerRowFingerprint(row);
      const prevFp = savedMap[key];

      if (!prevFp || prevFp !== currentFp) {
        changedRows.push(row);
      } else {
        unchangedRows.push(row);
      }
    });

    return {
      changedRows,
      unchangedRows,
      changedCount: changedRows.length,
      unchangedCount: unchangedRows.length,
      isAllUnchanged: changedRows.length === 0,
      totalCount: currentRows.length
    };
  } catch {
    return {
      changedRows: currentRows,
      unchangedRows: [],
      changedCount: currentRows.length,
      unchangedCount: 0,
      isAllUnchanged: false,
      totalCount: currentRows.length
    };
  }
};

/**
 * Menyimpan fingerprint data yang telah sukses disinkronkan
 */
export const saveDeltaSyncFingerprints = (rows: any[]) => {
  try {
    const fpMap: Record<string, string> = {};
    rows.forEach(row => {
      const key = (row.id_pelanggan || row.id || row.nama || '').trim().toLowerCase();
      if (key) {
        fpMap[key] = computeCustomerRowFingerprint(row);
      }
    });
    localStorage.setItem('GOOGLE_SHEETS_CUSTOMER_FINGERPRINTS', JSON.stringify(fpMap));
  } catch (e) {
    console.warn('Gagal menyimpan delta fingerprint:', e);
  }
};

/**
 * In-Memory Transaction Cache untuk Delta Fetch (Menghemat Egress Bandwidth Supabase)
 */
interface DeltaSyncMemoryCache {
  lastFetchTime: string | null;
  sales: any[];
  savings: any[];
  debts: any[];
}

const memoryDeltaCache: DeltaSyncMemoryCache = {
  lastFetchTime: null,
  sales: [],
  savings: [],
  debts: []
};

export const syncAllCustomerStatsToGoogleSheets = async (
  custList: any[],
  salesList: any[] = [],
  savingsList: any[] = [],
  debtList: any[] = [],
  investList: any[] = [],
  redeemList: any[] = [],
  scriptUrl: string = DEFAULT_APPS_SCRIPT_URL,
  options?: { deltaOnly?: boolean; forceFull?: boolean; isAutoSync?: boolean }
) => {
  let targetCustList = custList || [];
  let targetSales = salesList || [];
  let targetSavings = savingsList || [];
  let targetDebt = debtList || [];
  let targetInvest = investList || [];
  let targetRedeem = redeemList || [];

  const nowIso = new Date().toISOString();

  // 1. Ambil data master pelanggan dari Supabase secara hemat bandwidth (seleksi kolom ringan tanpa foto besar)
  if (SupabaseCustomerService.isConnected()) {
    try {
      const { data: supaAllCust } = await SupabaseCustomerService.getCustomers({
        select: 'id_pelanggan, nama, pin, telepon, alamat, tabungan, investasi, lainnya, hutang, point, level, created_at'
      });
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

  // 2. Fetch Riwayat Transaksi Penjualan menggunakan Teknik Delta / Incremental Cache
  if (SupabaseSalesService.isConnected()) {
    try {
      const salesQueryOptions: any = {
        select: 'id_transaksi, id_pelanggan, nama, tanggal, pemasukan, jenis, metode, status, melalui, harga_modal, sebagian, created_at',
        limit: memoryDeltaCache.lastFetchTime ? 1000 : 3000
      };
      if (memoryDeltaCache.lastFetchTime) {
        salesQueryOptions.since = memoryDeltaCache.lastFetchTime;
      }
      const { data: supaSales } = await SupabaseSalesService.getSales(salesQueryOptions);
      if (supaSales && supaSales.length > 0) {
        const mapped = supaSales.map((item: any) => ({
          ...item,
          id: item.id_transaksi || item.id,
          id_pelanggan: item.id_pelanggan,
          Tanggal: item.tanggal,
          tanggal: item.tanggal,
          Nama: item.nama,
          nama: item.nama,
          Metode: item.metode,
          metode: item.metode,
          MetodePembayaran: item.metode,
          metode_pembayaran: item.metode,
          paymentMethod: item.metode,
          Status: item.status,
          status: item.status,
          Total: Number(item.pemasukan) || 0,
          total: Number(item.pemasukan) || 0,
          Pemasukan: Number(item.pemasukan) || 0,
          pemasukan: Number(item.pemasukan) || 0,
          Kategori: item.jenis || '',
          kategori: item.jenis || '',
          Catatan: item.melalui || ''
        }));
        
        // Merge into delta cache
        const existingIds = new Set(memoryDeltaCache.sales.map(s => s.id));
        const newOnly = mapped.filter(m => !existingIds.has(m.id));
        memoryDeltaCache.sales = [...newOnly, ...memoryDeltaCache.sales].slice(0, 5000);
      }
      targetSales = memoryDeltaCache.sales.length > 0 ? memoryDeltaCache.sales : targetSales;
    } catch (salesErr) {
      console.warn('Could not fetch sales in delta sync:', salesErr);
    }
  }

  // 3. Fetch Riwayat Transaksi Tabungan menggunakan Teknik Delta / Incremental Cache
  if (SupabaseSavingsService.isConnected()) {
    try {
      const savingsQueryOptions: any = {
        select: 'id_tabungan, id_pelanggan, nama, tanggal, tipe, nominal, saldo_akhir, berita, created_at',
        limit: memoryDeltaCache.lastFetchTime ? 1000 : 3000
      };
      if (memoryDeltaCache.lastFetchTime) {
        savingsQueryOptions.since = memoryDeltaCache.lastFetchTime;
      }
      const { data: supaSavings } = await SupabaseSavingsService.getSavings(savingsQueryOptions);
      if (supaSavings && supaSavings.length > 0) {
        const mapped = supaSavings.map((item: any) => ({
          id: item.id_tabungan || item.id,
          id_tabungan: item.id_tabungan,
          id_pelanggan: item.id_pelanggan || 'CUST-0000',
          Tanggal: item.tanggal || '',
          tanggal: item.tanggal || '',
          Nama: item.nama || 'Nasabah',
          nama: item.nama || 'Nasabah',
          Tipe: String(item.tipe || 'SETOR').toUpperCase(),
          tipe: String(item.tipe || 'SETOR').toUpperCase(),
          Nominal: Number(item.nominal) || 0,
          nominal: Number(item.nominal) || 0,
          SaldoAkhir: Number(item.saldo_akhir) || 0,
          saldo_akhir: Number(item.saldo_akhir) || 0,
          Berita: item.berita || '-'
        }));
        const existingIds = new Set(memoryDeltaCache.savings.map(s => s.id));
        const newOnly = mapped.filter(m => !existingIds.has(m.id));
        memoryDeltaCache.savings = [...newOnly, ...memoryDeltaCache.savings].slice(0, 5000);
      }
      targetSavings = memoryDeltaCache.savings.length > 0 ? memoryDeltaCache.savings : targetSavings;
    } catch (savingsErr) {
      console.warn('Could not fetch savings in delta sync:', savingsErr);
    }
  }

  // 4. Fetch Riwayat Transaksi Hutang menggunakan Teknik Delta / Incremental Cache
  if (SupabaseDebtService.isConnected()) {
    try {
      const debtQueryOptions: any = {
        select: 'id_hutang, id_pelanggan, nama, tanggal, tipe, jumlah, saldo_akhir, keterangan, created_at',
        allHistory: true,
        limit: memoryDeltaCache.lastFetchTime ? 1000 : 3000
      };
      if (memoryDeltaCache.lastFetchTime) {
        debtQueryOptions.since = memoryDeltaCache.lastFetchTime;
      }
      const { data: supaDebts } = await SupabaseDebtService.getDebts(debtQueryOptions);
      if (supaDebts && supaDebts.length > 0) {
        const mapped = supaDebts.map((item: any) => ({
          id: item.id_hutang || item.id,
          id_hutang: item.id_hutang,
          id_pelanggan: item.id_pelanggan || 'CUST-0000',
          Tanggal: item.tanggal || '',
          tanggal: item.tanggal || '',
          Nama: item.nama || 'Pelanggan',
          nama: item.nama || 'Pelanggan',
          Tipe: String(item.tipe || 'HUTANG').toUpperCase(),
          tipe: String(item.tipe || 'HUTANG').toUpperCase(),
          Jumlah: Number(item.jumlah) || 0,
          jumlah: Number(item.jumlah) || 0,
          SaldoAkhir: Number(item.saldo_akhir) || 0,
          saldo_akhir: Number(item.saldo_akhir) || 0,
          Keterangan: item.keterangan || '-'
        }));
        const existingIds = new Set(memoryDeltaCache.debts.map(s => s.id));
        const newOnly = mapped.filter(m => !existingIds.has(m.id));
        memoryDeltaCache.debts = [...newOnly, ...memoryDeltaCache.debts].slice(0, 5000);
      }
      targetDebt = memoryDeltaCache.debts.length > 0 ? memoryDeltaCache.debts : targetDebt;
    } catch (debtErr) {
      console.warn('Could not fetch debts in delta sync:', debtErr);
    }
  }

  // Update timestamp cache
  memoryDeltaCache.lastFetchTime = nowIso;

  if (!targetCustList || targetCustList.length === 0) {
    return { success: false, message: 'Tidak ada data pelanggan' };
  }

  try {
    const formattedStats = computeCustomerStatsForSheets(
      targetCustList,
      targetSales,
      targetSavings,
      targetDebt,
      targetInvest,
      targetRedeem
    );

    // 5. Periksa apakah ada perubahan data (Delta Check)
    const deltaStatus = getDeltaSyncChanges(formattedStats);

    // Jika deltaOnly aktif atau proses otomatis dan TIDAK ada data yang berubah sama sekali:
    if ((options?.deltaOnly || options?.isAutoSync) && !options?.forceFull && deltaStatus.isAllUnchanged) {
      return {
        success: true,
        skipped: true,
        changedCount: 0,
        unchangedCount: deltaStatus.unchangedCount,
        count: targetCustList.length,
        message: 'Semua data pelanggan sudah mutakhir (Delta Sync: 0 data berubah, bandwidth dihemat 100%)'
      };
    }

    const payload = {
      action: 'syncCustomers',
      customers: formattedStats,
      deltaInfo: {
        changedCount: deltaStatus.changedCount,
        totalCount: deltaStatus.totalCount,
        isDeltaSync: true
      }
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
      // Simpan fingerprint data terbaru agar sinkronisasi selanjutnya hanya mengirim data yang berubah
      saveDeltaSyncFingerprints(formattedStats);

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
      return { 
        success: true, 
        timestamp: fullTimeStr, 
        count: targetCustList.length,
        changedCount: deltaStatus.changedCount,
        unchangedCount: deltaStatus.unchangedCount
      };
    } else {
      return { success: false, error: errorMsg || 'Gagal menyinkronkan data' };
    }
  } catch (err: any) {
    console.warn('Notice in syncAllCustomerStatsToGoogleSheets:', err?.message || err);
    return { success: false, error: err?.message || 'Gagal menyinkronkan data' };
  }
};
