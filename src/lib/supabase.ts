import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseCustomer {
  id?: string;
  id_pelanggan: string;
  nama: string;
  pin?: string;
  telepon?: string;
  alamat?: string;
  tabungan?: number;
  investasi?: number;
  lainnya?: number;
  hutang?: number;
  point?: number;
  level?: string;
  foto?: string;
  created_at?: string;
}

export interface SupabaseProduct {
  id?: string;
  id_barang: string;
  nama: string;
  kategori?: string;
  stok: number;
  satuan?: string;
  min_stok?: number;
  harga_modal: number;
  harga_jual: number;
  gambar?: string;
  update_terakhir?: string;
  created_at?: string;
}

export interface SupabaseSavingTransaction {
  id?: string;
  id_tabungan: string;
  id_pelanggan?: string;
  tanggal: string;
  nama: string;
  nama_nasabah?: string;
  tipe: string;
  nominal: number;
  saldo_akhir?: number;
  berita?: string;
  keterangan?: string;
  sebagian?: number;
  created_at?: string;
}

export interface SupabaseDebtTransaction {
  id?: string;
  id_hutang: string;
  id_pelanggan?: string;
  tanggal: string;
  nama: string;
  nama_pelanggan?: string;
  tipe: string;
  jumlah: number;
  keterangan?: string;
  saldo_akhir?: number;
  sebagian?: number;
  created_at?: string;
}

export interface SupabaseSalesTransaction {
  id?: string;
  id_transaksi: string;
  id_pelanggan?: string;
  tanggal: string;
  nama: string;
  jenis: string;
  metode?: string;
  pemasukan: number;
  poin?: number;
  status?: string;
  melalui?: string;
  harga_modal?: number;
  sebagian?: number;
  created_at?: string;
}

export interface SupabaseInvestmentTransaction {
  id?: string;
  id_investasi: string;
  id_pelanggan?: string;
  tanggal: string;
  nama: string;
  nama_investor?: string;
  nominal: number;
  tenor?: string;
  tenor_bulan?: number;
  jatuh_tempo?: string;
  status?: string;
  keterangan?: string;
  nisbah?: string;
  nisbah_persen?: number;
  sebagian?: number;
  created_at?: string;
}

export interface SupabaseRedeemedPoint {
  id?: string;
  id_tukar: string;
  id_pelanggan?: string;
  tanggal: string;
  nama: string;
  poin: number;
  hadiah: string;
  created_at?: string;
}

export const SUPABASE_MASTER_CREATE_TABLES_SQL = `-- 1. TABEL PELANGGAN
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_pelanggan TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  pin TEXT,
  telepon TEXT,
  alamat TEXT,
  tabungan NUMERIC DEFAULT 0,
  investasi NUMERIC DEFAULT 0,
  lainnya NUMERIC DEFAULT 0,
  hutang NUMERIC DEFAULT 0,
  point NUMERIC DEFAULT 0,
  level TEXT DEFAULT 'Bronze',
  foto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Customers" ON public.customers;
CREATE POLICY "Akses Publik Customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- 2. TABEL BARANG / STOK
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_barang TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT DEFAULT 'Lainnya',
  stok NUMERIC DEFAULT 0,
  satuan TEXT DEFAULT 'pcs',
  min_stok NUMERIC DEFAULT 5,
  harga_modal NUMERIC DEFAULT 0,
  harga_jual NUMERIC DEFAULT 0,
  gambar TEXT,
  update_terakhir TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Products" ON public.products;
CREATE POLICY "Akses Publik Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

// 3. TABEL TABUNGAN
CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_tabungan TEXT UNIQUE,
  id_pelanggan TEXT,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL,
  nominal NUMERIC DEFAULT 0,
  saldo_akhir NUMERIC DEFAULT 0,
  berita TEXT,
  sebagian NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_id_tabungan ON public.savings_transactions (id_tabungan);
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Savings" ON public.savings_transactions;
CREATE POLICY "Akses Publik Savings" ON public.savings_transactions FOR ALL USING (true) WITH CHECK (true);

-- 4. TABEL INVESTASI
CREATE TABLE IF NOT EXISTS public.investment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_investasi TEXT UNIQUE,
  id_pelanggan TEXT,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  nominal NUMERIC DEFAULT 0,
  tenor TEXT,
  jatuh_tempo TEXT,
  status TEXT DEFAULT 'Aktif',
  keterangan TEXT,
  nisbah TEXT,
  sebagian NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_id_investasi ON public.investment_transactions (id_investasi);
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Investment" ON public.investment_transactions;
CREATE POLICY "Akses Publik Investment" ON public.investment_transactions FOR ALL USING (true) WITH CHECK (true);

-- 5. TABEL HUTANG
CREATE TABLE IF NOT EXISTS public.debt_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_hutang TEXT UNIQUE,
  id_pelanggan TEXT,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL,
  jumlah NUMERIC DEFAULT 0,
  keterangan TEXT,
  saldo_akhir NUMERIC DEFAULT 0,
  sebagian NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_debt_id_hutang ON public.debt_transactions (id_hutang);
ALTER TABLE public.debt_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Debt" ON public.debt_transactions;
CREATE POLICY "Akses Publik Debt" ON public.debt_transactions FOR ALL USING (true) WITH CHECK (true);

-- 6. TABEL TRANSAKSI PENJUALAN
CREATE TABLE IF NOT EXISTS public.sales_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_transaksi TEXT UNIQUE,
  id_pelanggan TEXT,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL,
  metode TEXT,
  pemasukan NUMERIC DEFAULT 0,
  poin NUMERIC DEFAULT 0,
  status TEXT,
  melalui TEXT,
  harga_modal NUMERIC DEFAULT 0,
  sebagian NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_id_transaksi ON public.sales_transactions (id_transaksi);
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Sales" ON public.sales_transactions;
CREATE POLICY "Akses Publik Sales" ON public.sales_transactions FOR ALL USING (true) WITH CHECK (true);

-- 7. TABEL TUKAR POIN
CREATE TABLE IF NOT EXISTS public.redeemed_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_tukar TEXT UNIQUE,
  id_pelanggan TEXT,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  poin NUMERIC DEFAULT 0,
  hadiah TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_id_tukar ON public.redeemed_points (id_tukar);
ALTER TABLE public.redeemed_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Points" ON public.redeemed_points;
CREATE POLICY "Akses Publik Points" ON public.redeemed_points FOR ALL USING (true) WITH CHECK (true);`;

export const SUPABASE_CREATE_PRODUCTS_TABLE_SQL = SUPABASE_MASTER_CREATE_TABLES_SQL;

// System Default Credentials
export const SYSTEM_DEFAULT_SUPABASE_URL = "https://qaxrqacqrwnqitfbqabi.supabase.co";
export const SYSTEM_DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheHJxYWNxcnducWl0ZmJxYWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTE4NDEsImV4cCI6MjEwMDQ4Nzg0MX0.cvBPlhXluhbGWEN0pYzEkdCTNPMJFA9g0PLriMbPXbg";

export function getSupabaseCredentials(): { url: string; key: string } {
  let rawUrl = (
    localStorage.getItem('VITE_SUPABASE_URL') || 
    import.meta.env.VITE_SUPABASE_URL || 
    SYSTEM_DEFAULT_SUPABASE_URL || 
    ''
  ).trim();

  let key = (
    localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    SYSTEM_DEFAULT_SUPABASE_ANON_KEY || 
    ''
  ).trim();

  return { url: rawUrl, key };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url: rawUrl, key } = getSupabaseCredentials();
  let cleanedUrl = rawUrl;
  
  if (!cleanedUrl || !key) return null;

  cleanedUrl = cleanedUrl.replace(/^["']|["']$/g, '');
  const cleanedKey = key.replace(/^["']|["']$/g, '');

  if (cleanedUrl.includes('supabase.com/dashboard/project/')) {
    const parts = cleanedUrl.split('project/');
    if (parts[1]) {
      const ref = parts[1].split('/')[0];
      if (ref) cleanedUrl = `https://${ref}.supabase.co`;
    }
  }

  cleanedUrl = cleanedUrl.replace(/\/+$/, '');
  if (cleanedUrl.endsWith('/rest/v1')) {
    cleanedUrl = cleanedUrl.replace(/\/rest\/v1$/, '');
  }

  if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
    cleanedUrl = 'https://' + cleanedUrl;
  }

  try {
    return createClient(cleanedUrl, cleanedKey);
  } catch (e) {
    console.error("Failed to create Supabase client:", e);
    return null;
  }
}

/**
 * Helper untuk mengambil set ID yang sudah ada di Supabase secara cepat
 */
export async function getExistingIdsSet(tableName: string, column: string): Promise<Set<string>> {
  const client = getSupabaseClient();
  const existingSet = new Set<string>();
  if (!client) return existingSet;

  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    try {
      const { data, error } = await client
        .from(tableName)
        .select(column)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach((item: any) => {
          const val = item[column];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            existingSet.add(String(val).trim());
          }
        });
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    } catch (e) {
      hasMore = false;
    }
  }
  return existingSet;
}

/**
 * Helper untuk membersihkan data duplikat di tabel Supabase berdasarkan uniqueColumn
 */
export async function cleanupTableDuplicates(tableName: string, uniqueColumn: string): Promise<{
  success: boolean;
  message: string;
  totalFound: number;
  deletedCount: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: "Client Supabase tidak aktif", totalFound: 0, deletedCount: 0 };
  }

  try {
    let allRows: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from(tableName)
        .select(`id, ${uniqueColumn}`)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    const map = new Map<string, string[]>();
    allRows.forEach(row => {
      const key = String(row[uniqueColumn] || '').trim();
      if (key && row.id) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(String(row.id));
      }
    });

    const duplicateIdsToDelete: string[] = [];
    map.forEach((uuids) => {
      if (uuids.length > 1) {
        // Simpan 1 baris pertama, hapus sisanya yang duplikat
        duplicateIdsToDelete.push(...uuids.slice(1));
      }
    });

    if (duplicateIdsToDelete.length === 0) {
      return { success: true, message: `Tidak ditemukan data duplikat di tabel '${tableName}'.`, totalFound: 0, deletedCount: 0 };
    }

    let deletedCount = 0;
    const batchSize = 100;
    for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
      const batch = duplicateIdsToDelete.slice(i, i + batchSize);
      const { error: delErr } = await client
        .from(tableName)
        .delete()
        .in('id', batch);

      if (!delErr) {
        deletedCount += batch.length;
      } else {
        console.error(`Error deleting batch in ${tableName}:`, delErr);
      }
    }

    return {
      success: true,
      message: `Berhasil menghapus ${deletedCount} data duplikat di tabel '${tableName}'.`,
      totalFound: duplicateIdsToDelete.length,
      deletedCount
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || `Gagal membersihkan duplikat di ${tableName}`,
      totalFound: 0,
      deletedCount: 0
    };
  }
}

/**
 * Service Pelanggan Supabase
 */
export const SupabaseCustomerService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getCustomers(): Promise<{ data: SupabaseCustomer[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseCustomer[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('customers')
        .select('*')
        .order('nama', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertCustomer(customer: SupabaseCustomer): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi") };
    let { data, error } = await client.from('customers').upsert(customer, { onConflict: 'id_pelanggan' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('customers').insert(customer).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async deleteCustomer(idPelanggan: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi") };
    const { data, error } = await client.from('customers').delete().eq('id_pelanggan', idPelanggan);
    return { data, error };
  },

  async bulkMigrateCustomers(
    customersList: any[],
    onProgress?: (processed: number, total: number, currentName: string, statusType: 'success' | 'skipped' | 'error', message?: string) => void
  ): Promise<{ successCount: number; skippedCount: number; failedCount: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: customersList.length, errors: ["Client Supabase tidak aktif."] };

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const total = customersList.length;

    const existingSet = await getExistingIdsSet('customers', 'id_pelanggan');

    for (let i = 0; i < total; i++) {
      const c = customersList[i];
      const idPelanggan = String(c.id_pelanggan || c.id || `CUST-${String(i + 1).padStart(3, '0')}`).trim();
      const nama = String(c.Nama || c.nama || "Pelanggan Tanpa Nama").trim();

      if (existingSet.has(idPelanggan)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const formattedCustomer: SupabaseCustomer = {
        id_pelanggan: idPelanggan,
        nama: nama,
        pin: c.PIN || c.pin || "",
        telepon: c.Telepon || c.telepon || "",
        alamat: c.Alamat || c.alamat || "",
        tabungan: typeof c.Tabungan === 'number' ? c.Tabungan : parseFloat(String(c.Tabungan || '0').replace(/[^0-9.-]+/g, "")) || 0,
        investasi: typeof c.Investasi === 'number' ? c.Investasi : parseFloat(String(c.Investasi || '0').replace(/[^0-9.-]+/g, "")) || 0,
        lainnya: typeof c.Lainnya === 'number' ? c.Lainnya : parseFloat(String(c.Lainnya || '0').replace(/[^0-9.-]+/g, "")) || 0,
        hutang: typeof c.Hutang === 'number' ? c.Hutang : parseFloat(String(c.Hutang || '0').replace(/[^0-9.-]+/g, "")) || 0,
        point: typeof c.Point === 'number' ? c.Point : parseInt(String(c.Point || '0'), 10) || 0,
        level: c.Level || c.level || "Bronze",
        foto: c.Foto || c.foto || ""
      };

      const { error } = await client.from('customers').upsert(formattedCustomer, { onConflict: 'id_pelanggan' });
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idPelanggan);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idPelanggan);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil dimigrasikan');
      }
      await new Promise(res => setTimeout(res, 5));
    }

    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Stok / Barang Supabase
 */
export const SupabaseStockService = {
  isConnected(): boolean { return SupabaseCustomerService.isConnected(); },

  async getProducts(): Promise<{ data: SupabaseProduct[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseProduct[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('nama', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertProduct(product: SupabaseProduct): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('products').upsert(product, { onConflict: 'id_barang' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('products').insert(product).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async deleteProduct(idBarang: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    const { data, error } = await client.from('products').delete().eq('id_barang', idBarang);
    return { data, error };
  },

  async bulkMigrateStock(
    stockList: any[],
    onProgress?: (processed: number, total: number, currentName: string, statusType: 'success' | 'skipped' | 'error', message?: string) => void,
    mode: 'only_new' | 'update_all' = 'update_all'
  ): Promise<{ successCount: number; skippedCount: number; failedCount: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: stockList.length, errors: ["Client Supabase tidak aktif."] };

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const total = stockList.length;

    const existingSet = await getExistingIdsSet('products', 'id_barang');

    for (let i = 0; i < total; i++) {
      const item = stockList[i];
      const idBarang = String(item.id || item.id_barang || `BRG-${String(i + 1).padStart(4, '0')}`).trim();
      const nama = String(item.Nama || item.nama || 'Barang Tanpa Nama').trim();

      if (mode === 'only_new' && existingSet.has(idBarang)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const sImgKey = Object.keys(item).find(k => k.toLowerCase().trim().includes('gambar') || k.toLowerCase().trim().includes('foto') || k.toLowerCase().trim().includes('image'));
      const imgVal = item.Image || item.gambar || (sImgKey ? item[sImgKey] : '') || '';

      const formattedProduct: SupabaseProduct = {
        id_barang: idBarang,
        nama: nama,
        kategori: String(item.Kategori || item.kategori || 'Sembako').trim(),
        stok: typeof item.Stok === 'number' ? item.Stok : parseInt(String(item.Stok || '0').replace(/\D/g, ''), 10) || 0,
        satuan: String(item.Satuan || item.satuan || 'pcs').trim(),
        min_stok: typeof item.MinStok === 'number' ? item.MinStok : parseInt(String(item.MinStok || '5'), 10) || 5,
        harga_modal: typeof item.HargaModal === 'number' ? item.HargaModal : parseFloat(String(item.HargaModal || '0').replace(/[^0-9.-]+/g, "")) || 0,
        harga_jual: typeof item.HargaJual === 'number' ? item.HargaJual : parseFloat(String(item.HargaJual || '0').replace(/[^0-9.-]+/g, "")) || 0,
        gambar: String(imgVal).trim(),
        update_terakhir: new Date().toLocaleDateString('id-ID')
      };

      const { error } = await client.from('products').upsert(formattedProduct, { onConflict: 'id_barang' });
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idBarang);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idBarang);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil dimigrasikan');
      }
      await new Promise(res => setTimeout(res, 5));
    }

    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Tabungan Supabase
 */
export const SupabaseSavingsService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getSavings(): Promise<{ data: SupabaseSavingTransaction[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseSavingTransaction[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('savings_transactions')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertSaving(saving: SupabaseSavingTransaction): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('savings_transactions').upsert(saving, { onConflict: 'id_tabungan' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('savings_transactions').insert(saving).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async addSavingTransaction(saving: SupabaseSavingTransaction): Promise<{ data: any; error: any }> {
    return this.upsertSaving(saving);
  },

  async deleteSaving(idTabungan: string, altId?: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('savings_transactions').delete().eq('id_tabungan', idTabungan);
    if (!error && altId && altId !== idTabungan) {
      const res = await client.from('savings_transactions').delete().eq('id', altId);
      if (res.error) error = res.error;
    }
    return { data, error };
  },

  async bulkMigrateSavings(
    list: any[],
    onProgress?: (processed: number, total: number, name: string, status: 'success' | 'skipped' | 'error', msg?: string) => void
  ) {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: list.length, errors: ["Supabase tidak aktif."] };
    let successCount = 0, skippedCount = 0, failedCount = 0; const errors: string[] = [];
    const total = list.length;

    const existingSet = await getExistingIdsSet('savings_transactions', 'id_tabungan');

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const idTabungan = String(item.id_tabungan || item.id || `TBG-${i+1}`).trim();
      const nama = String(item.Nama || item.nama || 'Nasabah').trim();

      if (existingSet.has(idTabungan)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const payload = {
        id_tabungan: idTabungan,
        id_pelanggan: item.id_pelanggan || '',
        tanggal: item.Tanggal || item.tanggal || new Date().toISOString().split('T')[0],
        nama: nama,
        tipe: item.Tipe || item.tipe || 'Setor',
        nominal: typeof item.Nominal === 'number' ? item.Nominal : parseFloat(String(item.Nominal || '0').replace(/[^0-9.-]+/g, "")) || 0,
        saldo_akhir: typeof item.SaldoAkhir === 'number' ? item.SaldoAkhir : parseFloat(String(item.SaldoAkhir || '0').replace(/[^0-9.-]+/g, "")) || 0,
        berita: item.Berita || item.berita || '',
        sebagian: item.Sebagian || 0
      };

      const { error } = await client.from('savings_transactions').insert(payload);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idTabungan);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idTabungan);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil disimpan');
      }
      await new Promise(res => setTimeout(res, 5));
    }
    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Investasi Supabase
 */
export const SupabaseInvestmentService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getInvestments(): Promise<{ data: SupabaseInvestmentTransaction[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseInvestmentTransaction[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('investment_transactions')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertInvestment(investment: SupabaseInvestmentTransaction): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('investment_transactions').upsert(investment, { onConflict: 'id_investasi' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('investment_transactions').insert(investment).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async addInvestmentTransaction(investment: SupabaseInvestmentTransaction): Promise<{ data: any; error: any }> {
    return this.upsertInvestment(investment);
  },

  async deleteInvestment(idInvestasi: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    const { data, error } = await client.from('investment_transactions').delete().eq('id_investasi', idInvestasi);
    return { data, error };
  },

  async bulkMigrateInvestment(
    list: any[],
    onProgress?: (processed: number, total: number, name: string, status: 'success' | 'skipped' | 'error', msg?: string) => void
  ) {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: list.length, errors: ["Supabase tidak aktif."] };
    let successCount = 0, skippedCount = 0, failedCount = 0; const errors: string[] = [];
    const total = list.length;

    const existingSet = await getExistingIdsSet('investment_transactions', 'id_investasi');

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const idInvestasi = String(item.id_investasi || item.id || `INV-${i+1}`).trim();
      const nama = String(item.Nama || item.nama || 'Investor').trim();

      if (existingSet.has(idInvestasi)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const payload = {
        id_investasi: idInvestasi,
        id_pelanggan: item.id_pelanggan || '',
        tanggal: item.Tanggal || item.tanggal || new Date().toISOString().split('T')[0],
        nama: nama,
        nominal: typeof item.Nominal === 'number' ? item.Nominal : parseFloat(String(item.Nominal || '0').replace(/[^0-9.-]+/g, "")) || 0,
        tenor: item.Tenor || item.tenor || '12 Bulan',
        jatuh_tempo: item.JatuhTempo || item.jatuh_tempo || '',
        status: item.Status || item.status || 'Aktif',
        keterangan: item.Keterangan || item.keterangan || '',
        nisbah: item.Nisbah || item.nisbah || '70:30',
        sebagian: item.Sebagian || 0
      };

      const { error } = await client.from('investment_transactions').insert(payload);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idInvestasi);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idInvestasi);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil disimpan');
      }
      await new Promise(res => setTimeout(res, 5));
    }
    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Hutang Supabase
 */
export const SupabaseDebtService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getDebts(): Promise<{ data: SupabaseDebtTransaction[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseDebtTransaction[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('debt_transactions')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertDebt(debt: SupabaseDebtTransaction): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('debt_transactions').upsert(debt, { onConflict: 'id_hutang' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('debt_transactions').insert(debt).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async addDebtTransaction(debt: SupabaseDebtTransaction): Promise<{ data: any; error: any }> {
    return this.upsertDebt(debt);
  },

  async deleteDebt(idHutang: string, altId?: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('debt_transactions').delete().eq('id_hutang', idHutang);
    if (!error && altId && altId !== idHutang) {
      const res = await client.from('debt_transactions').delete().eq('id', altId);
      if (res.error) error = res.error;
    }
    return { data, error };
  },

  async bulkMigrateDebt(
    list: any[],
    onProgress?: (processed: number, total: number, name: string, status: 'success' | 'skipped' | 'error', msg?: string) => void
  ) {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: list.length, errors: ["Supabase tidak aktif."] };
    let successCount = 0, skippedCount = 0, failedCount = 0; const errors: string[] = [];
    const total = list.length;

    const existingSet = await getExistingIdsSet('debt_transactions', 'id_hutang');

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const idHutang = String(item.id_hutang || item.id || `HTG-${i+1}`).trim();
      const nama = String(item.Nama || item.nama || 'Pelanggan').trim();

      if (existingSet.has(idHutang)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const payload = {
        id_hutang: idHutang,
        id_pelanggan: item.id_pelanggan || '',
        tanggal: item.Tanggal || item.tanggal || new Date().toISOString().split('T')[0],
        nama: nama,
        tipe: item.Tipe || item.tipe || 'Kasbon',
        jumlah: typeof item.Jumlah === 'number' ? item.Jumlah : parseFloat(String(item.Jumlah || '0').replace(/[^0-9.-]+/g, "")) || 0,
        keterangan: item.Keterangan || item.keterangan || '',
        saldo_akhir: typeof item.SaldoAkhir === 'number' ? item.SaldoAkhir : parseFloat(String(item.SaldoAkhir || '0').replace(/[^0-9.-]+/g, "")) || 0,
        sebagian: item.Sebagian || 0
      };

      const { error } = await client.from('debt_transactions').insert(payload);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idHutang);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idHutang);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil disimpan');
      }
      await new Promise(res => setTimeout(res, 5));
    }
    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Transaksi Penjualan Supabase
 */
export const SupabaseSalesService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getSales(): Promise<{ data: SupabaseSalesTransaction[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseSalesTransaction[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('sales_transactions')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertSale(sale: SupabaseSalesTransaction): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };

    // 1. If id_transaksi exists, try updating existing row first
    if (sale.id_transaksi) {
      const { data: updateData, error: updateErr } = await client
        .from('sales_transactions')
        .update(sale)
        .eq('id_transaksi', sale.id_transaksi)
        .select();

      if (!updateErr && updateData && updateData.length > 0) {
        return { data: updateData, error: null };
      }
    }

    // 2. If no existing row was updated, attempt upsert or insert
    let { data, error } = await client.from('sales_transactions').upsert(sale, { onConflict: 'id_transaksi' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('sales_transactions').insert(sale).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async addSalesTransaction(sale: SupabaseSalesTransaction): Promise<{ data: any; error: any }> {
    return this.upsertSale(sale);
  },

  async deleteSale(idTransaksi: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    const { data, error } = await client.from('sales_transactions').delete().eq('id_transaksi', idTransaksi);
    return { data, error };
  },

  async bulkMigrateSales(
    list: any[],
    onProgress?: (processed: number, total: number, name: string, status: 'success' | 'skipped' | 'error', msg?: string) => void
  ) {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: list.length, errors: ["Supabase tidak aktif."] };
    let successCount = 0, skippedCount = 0, failedCount = 0; const errors: string[] = [];
    const total = list.length;

    const existingSet = await getExistingIdsSet('sales_transactions', 'id_transaksi');

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const idTransaksi = String(item.id_transaksi || item.id || `TRX-${i+1}`).trim();
      const nama = String(item.Nama || item.nama || 'Pelanggan').trim();

      if (existingSet.has(idTransaksi)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const payload = {
        id_transaksi: idTransaksi,
        id_pelanggan: item.id_pelanggan || '',
        tanggal: item.Tanggal || item.tanggal || new Date().toISOString().split('T')[0],
        nama: nama,
        jenis: item.Jenis || item.jenis || 'Penjualan',
        metode: item.Metode || item.metode || 'Tunai',
        pemasukan: typeof item.Pemasukan === 'number' ? item.Pemasukan : parseFloat(String(item.Pemasukan || '0').replace(/[^0-9.-]+/g, "")) || 0,
        poin: typeof item.Poin === 'number' ? item.Poin : parseInt(String(item.Poin || '0'), 10) || 0,
        status: item.Status || item.status || 'Selesai',
        melalui: item.Melalui || item.melalui || 'Kasir',
        harga_modal: typeof item.HargaModal === 'number' ? item.HargaModal : parseFloat(String(item.HargaModal || '0').replace(/[^0-9.-]+/g, "")) || 0,
        sebagian: item.Sebagian || 0
      };

      const { error } = await client.from('sales_transactions').insert(payload);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idTransaksi);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idTransaksi);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil disimpan');
      }
      await new Promise(res => setTimeout(res, 5));
    }
    return { successCount, skippedCount, failedCount, errors };
  }
};

/**
 * Service Tukar Poin Supabase
 */
export const SupabasePointsService = {
  getCredentials: getSupabaseCredentials,
  getClient: getSupabaseClient,
  isConnected(): boolean {
    return !!getSupabaseClient();
  },

  async getPoints(): Promise<{ data: SupabaseRedeemedPoint[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let allData: SupabaseRedeemedPoint[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError: any = null;

    while (hasMore) {
      const { data, error } = await client
        .from('redeemed_points')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        lastError = error;
        hasMore = false;
      } else if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      }
    }

    if (allData.length === 0 && lastError) return { data: null, error: lastError };
    return { data: allData, error: null };
  },

  async upsertPoint(point: SupabaseRedeemedPoint): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    let { data, error } = await client.from('redeemed_points').upsert(point, { onConflict: 'id_tukar' }).select();
    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      const { data: insData, error: insErr } = await client.from('redeemed_points').insert(point).select();
      data = insData;
      error = insErr;
    }
    return { data, error };
  },

  async addPointTransaction(point: SupabaseRedeemedPoint): Promise<{ data: any; error: any }> {
    return this.upsertPoint(point);
  },

  async deletePoint(idTukar: string): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
    const { data, error } = await client.from('redeemed_points').delete().eq('id_tukar', idTukar);
    return { data, error };
  },

  async bulkMigratePoints(
    list: any[],
    onProgress?: (processed: number, total: number, name: string, status: 'success' | 'skipped' | 'error', msg?: string) => void
  ) {
    const client = getSupabaseClient();
    if (!client) return { successCount: 0, skippedCount: 0, failedCount: list.length, errors: ["Supabase tidak aktif."] };
    let successCount = 0, skippedCount = 0, failedCount = 0; const errors: string[] = [];
    const total = list.length;

    const existingSet = await getExistingIdsSet('redeemed_points', 'id_tukar');

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const idTukar = String(item.id_tukar || item.id || `TKR-${i+1}`).trim();
      const nama = String(item.Nama || item.nama || 'Pelanggan').trim();

      if (existingSet.has(idTukar)) {
        skippedCount++;
        if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        continue;
      }

      const payload = {
        id_tukar: idTukar,
        id_pelanggan: item.id_pelanggan || '',
        tanggal: item.Tanggal || item.tanggal || new Date().toISOString().split('T')[0],
        nama: nama,
        poin: typeof item.Poin === 'number' ? item.Poin : parseInt(String(item.Poin || '0'), 10) || 0,
        hadiah: item.Hadiah || item.hadiah || 'Voucher'
      };

      const { error } = await client.from('redeemed_points').insert(payload);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          skippedCount++;
          existingSet.add(idTukar);
          if (onProgress) onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase');
        } else {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
          if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
        }
      } else {
        successCount++;
        existingSet.add(idTukar);
        if (onProgress) onProgress(i + 1, total, nama, 'success', 'Berhasil disimpan');
      }
      await new Promise(res => setTimeout(res, 5));
    }
    return { successCount, skippedCount, failedCount, errors };
  }
};
