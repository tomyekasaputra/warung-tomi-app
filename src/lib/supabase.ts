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

// System Default Fallback Credentials (Bisa diisi agar langsung aktif otomatis di semua HP/Perangkat tanpa perlu input manual)
export const SYSTEM_DEFAULT_SUPABASE_URL = "https://qaxrqacqrwnqitfbqabi.supabase.co";
export const SYSTEM_DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheHJxYWNxcnducWl0ZmJxYWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTE4NDEsImV4cCI6MjEwMDQ4Nzg0MX0.cvBPlhXluhbGWEN0pYzEkdCTNPMJFA9g0PLriMbPXbg";

/**
 * Service untuk migrasi & sinkronisasi data pelanggan ke Supabase
 */
export const SupabaseCustomerService = {
  getCredentials(): { url: string; key: string } {
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
  },

  getClient(): SupabaseClient | null {
    const { url: rawUrl, key } = this.getCredentials();
    let cleanedUrl = rawUrl;
    
    if (!cleanedUrl || !key) return null;

    // Clean quotes
    cleanedUrl = cleanedUrl.replace(/^["']|["']$/g, '');
    const cleanedKey = key.replace(/^["']|["']$/g, '');

    // Convert dashboard URL if accidentally pasted (e.g., https://supabase.com/dashboard/project/xyz)
    if (cleanedUrl.includes('supabase.com/dashboard/project/')) {
      const parts = cleanedUrl.split('project/');
      if (parts[1]) {
        const ref = parts[1].split('/')[0];
        if (ref) cleanedUrl = `https://${ref}.supabase.co`;
      }
    }

    // Clean trailing slashes or /rest/v1
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
  },

  /**
   * Cek status koneksi Supabase
   */
  isConnected(): boolean {
    return !!this.getClient();
  },

  /**
   * Mengambil semua pelanggan dari Supabase
   */
  async getCustomers(): Promise<{ data: SupabaseCustomer[] | null; error: any }> {
    const client = this.getClient();
    if (!client) {
      return { data: null, error: new Error("Supabase URL / Anon Key belum dikonfigurasi.") };
    }
    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('nama', { ascending: true });
    return { data, error };
  },

  /**
   * Menambahkan/update single pelanggan ke Supabase
   */
  async upsertCustomer(customer: SupabaseCustomer): Promise<{ data: any; error: any }> {
    const client = this.getClient();
    if (!client) {
      return { data: null, error: new Error("Supabase belum dikonfigurasi") };
    }
    
    // First try upsert on id_pelanggan
    let { data, error } = await client
      .from('customers')
      .upsert(customer, { onConflict: 'id_pelanggan' })
      .select();

    if (error && (error.message?.includes('ON CONFLICT') || error.code === '42P10')) {
      // Fallback if no ON CONFLICT unique constraint exists: delete then insert or direct insert
      const { data: insData, error: insErr } = await client
        .from('customers')
        .insert(customer)
        .select();
      data = insData;
      error = insErr;
    }

    return { data, error };
  },

  /**
   * Menghapus pelanggan dari Supabase berdasarkan id_pelanggan
   */
  async deleteCustomer(idPelanggan: string): Promise<{ data: any; error: any }> {
    const client = this.getClient();
    if (!client) {
      return { data: null, error: new Error("Supabase belum dikonfigurasi") };
    }
    const { data, error } = await client
      .from('customers')
      .delete()
      .eq('id_pelanggan', idPelanggan);
    return { data, error };
  },

  /**
   * Analisa data sebelum migrasi untuk mendeteksi data yang sudah ada di Supabase
   * dan mencegah duplikasi data
   */
  async analyzeMigration(customersList: any[]): Promise<{
    totalSource: number;
    alreadyInSupabaseCount: number;
    newToMigrateCount: number;
    alreadyInSupabaseList: any[];
    newToMigrateList: any[];
    error: any;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        totalSource: customersList.length,
        alreadyInSupabaseCount: 0,
        newToMigrateCount: customersList.length,
        alreadyInSupabaseList: [],
        newToMigrateList: customersList,
        error: new Error("Client Supabase tidak aktif. Harap periksa URL dan Key.")
      };
    }

    try {
      // Ambil daftar id_pelanggan & nama dari Supabase
      const { data: existingRows, error } = await client
        .from('customers')
        .select('id_pelanggan, nama');

      if (error) {
        return {
          totalSource: customersList.length,
          alreadyInSupabaseCount: 0,
          newToMigrateCount: customersList.length,
          alreadyInSupabaseList: [],
          newToMigrateList: customersList,
          error
        };
      }

      const existingIdSet = new Set((existingRows || []).map(r => String(r.id_pelanggan || '').trim().toLowerCase()));
      const existingNameSet = new Set((existingRows || []).map(r => String(r.nama || '').trim().toLowerCase()));

      const alreadyInSupabaseList: any[] = [];
      const newToMigrateList: any[] = [];

      // Filter deduplikasi lokal source list
      const seenSourceIds = new Set<string>();

      customersList.forEach((c, idx) => {
        const idPelanggan = String(c.id_pelanggan || c.id || `CUST-${String(idx + 1).padStart(3, '0')}`).trim();
        const nama = String(c.Nama || c.nama || '').trim();
        const idLower = idPelanggan.toLowerCase();
        const nameLower = nama.toLowerCase();

        // Hindari duplikasi internal di list sumber sendiri
        if (seenSourceIds.has(idLower)) {
          return;
        }
        seenSourceIds.add(idLower);

        // Cek apakah sudah ada di Supabase (berdasarkan ID atau Nama)
        if (existingIdSet.has(idLower) || (nameLower && existingNameSet.has(nameLower))) {
          alreadyInSupabaseList.push(c);
        } else {
          newToMigrateList.push(c);
        }
      });

      return {
        totalSource: customersList.length,
        alreadyInSupabaseCount: alreadyInSupabaseList.length,
        newToMigrateCount: newToMigrateList.length,
        alreadyInSupabaseList,
        newToMigrateList,
        error: null
      };
    } catch (err: any) {
      return {
        totalSource: customersList.length,
        alreadyInSupabaseCount: 0,
        newToMigrateCount: customersList.length,
        alreadyInSupabaseList: [],
        newToMigrateList: customersList,
        error: err
      };
    }
  },

  /**
   * Migrasi massal (Bulk Migration) list pelanggan dari Google Sheets / Local State ke Supabase
   * dengan callback progress untuk UI dan pencegahan data ganda
   */
  async bulkMigrateCustomers(
    customersList: any[],
    onProgress?: (processed: number, total: number, currentName: string, statusType: 'success' | 'skipped' | 'error', message?: string) => void,
    mode: 'only_new' | 'update_all' = 'only_new'
  ): Promise<{ successCount: number; skippedCount: number; failedCount: number; errors: string[] }> {
    const client = this.getClient();
    if (!client) {
      return {
        successCount: 0,
        skippedCount: 0,
        failedCount: customersList.length,
        errors: ["Client Supabase tidak aktif. Harap isi URL dan Anon Key di konfigurasi."]
      };
    }

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const total = customersList.length;

    // Direct check database untuk data eksis saat ini
    let existingIdSet = new Set<string>();
    let existingNameSet = new Set<string>();

    try {
      const { data: existingRows } = await client
        .from('customers')
        .select('id_pelanggan, nama');
      if (existingRows) {
        existingRows.forEach(r => {
          if (r.id_pelanggan) existingIdSet.add(String(r.id_pelanggan).trim().toLowerCase());
          if (r.nama) existingNameSet.add(String(r.nama).trim().toLowerCase());
        });
      }
    } catch (e) {
      console.warn("Gagal membaca data existing Supabase, melanjutkan migrasi standar:", e);
    }

    for (let i = 0; i < total; i++) {
      const c = customersList[i];
      const idPelanggan = String(c.id_pelanggan || c.id || `CUST-${String(i + 1).padStart(3, '0')}`).trim();
      const nama = String(c.Nama || c.nama || "Pelanggan Tanpa Nama").trim();
      const pin = c.PIN || c.pin || "";
      const tabungan = typeof c.Tabungan === 'number' ? c.Tabungan : parseFloat(String(c.Tabungan || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const investasi = typeof c.Investasi === 'number' ? c.Investasi : parseFloat(String(c.Investasi || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const lainnya = typeof c.Lainnya === 'number' ? c.Lainnya : parseFloat(String(c.Lainnya || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const hutang = typeof c.Hutang === 'number' ? c.Hutang : parseFloat(String(c.Hutang || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const point = typeof c.Point === 'number' ? c.Point : parseInt(String(c.Point || '0'), 10) || 0;
      const level = c.Level || c.level || "Bronze";

      const formattedCustomer: SupabaseCustomer = {
        id_pelanggan: idPelanggan,
        nama: nama,
        pin: pin,
        telepon: c.Telepon || c.telepon || "",
        alamat: c.Alamat || c.alamat || "",
        tabungan: tabungan,
        investasi: investasi,
        lainnya: lainnya,
        hutang: hutang,
        point: point,
        level: level,
        foto: c.Foto || c.foto || ""
      };

      const idLower = idPelanggan.toLowerCase();
      const nameLower = nama.toLowerCase();
      const existsInDb = existingIdSet.has(idLower) || (nameLower !== '' && existingNameSet.has(nameLower));

      // Jika mode 'only_new' dan data sudah ada di Supabase -> lewati! (Mencegah Duplikasi)
      if (mode === 'only_new' && existsInDb) {
        skippedCount++;
        if (onProgress) {
          onProgress(i + 1, total, nama, 'skipped', 'Sudah ada di Supabase (dilewati agar tak ganda)');
        }
        await new Promise(res => setTimeout(res, 15));
        continue;
      }

      let error: any = null;

      if (existsInDb) {
        // Update data eksis berdasarkan id_pelanggan
        const { error: updateErr } = await client
          .from('customers')
          .update(formattedCustomer)
          .eq('id_pelanggan', idPelanggan);
        error = updateErr;
      } else {
        // Insert data baru
        const { error: insErr } = await client
          .from('customers')
          .insert(formattedCustomer);
        
        // Fallback to upsert if needed
        if (insErr && (insErr.message?.includes('ON CONFLICT') || insErr.code === '23505')) {
          const { error: upsertErr } = await client
            .from('customers')
            .upsert(formattedCustomer, { onConflict: 'id_pelanggan' });
          error = upsertErr;
        } else {
          error = insErr;
        }
      }

      if (error) {
        failedCount++;
        const errDetail = `${nama} (${idPelanggan}): ${error.message}`;
        if (!errors.includes(error.message)) {
          errors.push(errDetail);
        }
        if (onProgress) onProgress(i + 1, total, nama, 'error', error.message);
      } else {
        successCount++;
        // Tambahkan ke tracking agar tidak diinsert ganda jika ada item kembar di source
        existingIdSet.add(idLower);
        if (nameLower) existingNameSet.add(nameLower);
        if (onProgress) onProgress(i + 1, total, nama, 'success', existsInDb ? 'Berhasil diperbarui' : 'Berhasil ditambahkan');
      }

      // Small delay so UI progress bar updates smoothly
      await new Promise(res => setTimeout(res, 35));
    }

    return { successCount, skippedCount, failedCount, errors };
  }
};

