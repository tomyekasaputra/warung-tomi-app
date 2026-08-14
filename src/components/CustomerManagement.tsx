import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, User, CreditCard, Wallet, 
  TrendingUp, CircleDollarSign, Star, Award, Image as ImageIcon,
  Loader2, X, Check, AlertCircle, Save, PlusCircle, RefreshCw,
  PieChart as PieChartIcon, Calculator, Database, ArrowRight,
  Key, Settings, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Copy
} from 'lucide-react';

const SUPABASE_CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_pelanggan TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    pin TEXT DEFAULT '',
    telepon TEXT DEFAULT '',
    alamat TEXT DEFAULT '',
    tabungan NUMERIC DEFAULT 0,
    investasi NUMERIC DEFAULT 0,
    lainnya NUMERIC DEFAULT 0,
    hutang NUMERIC DEFAULT 0,
    point INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Bronze',
    foto TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;`;
import { motion, AnimatePresence } from 'motion/react';
import { SupabaseCustomerService, SupabaseCustomer } from '../lib/supabase';
import { isCustomerSavingMatch, isCustomerDebtMatch } from '../App';
import GoogleSheetsSyncCard from './GoogleSheetsSyncCard';

interface Customer {
  id_pelanggan: string;
  nama: string;
  pin: string;
  telepon?: string;
  alamat?: string;
  foto: string;
}

const LEVEL_METADATA: Record<string, { color: string }> = {
  'Bronze': { color: '#CD7F32' },
  'Silver': { color: '#94a3b8' },
  'Gold': { color: '#F59E0B' },
  'Platinum': { color: '#1e293b' }
};

interface CustomerManagementProps {
  initialCustomers?: any[];
  setGlobalCustomers?: React.Dispatch<React.SetStateAction<any[]>>;
  onSyncComplete?: (data: Customer[]) => void;
  salesTransactions?: any[];
  savingsTransactions?: any[];
  investmentTransactions?: any[];
  debtTransactions?: any[];
  redeemedPoints?: any[];
}

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyS9FZaw8H-ckTRaCN3ZJP4FVeuMoAFwx9y6-pGSPtHFDCgxxLK-4HRV1WfO1xVBL8T/exec';
const APPS_SCRIPT_URL = DEFAULT_SCRIPT_URL;

export default function CustomerManagement({ 
  initialCustomers,
  setGlobalCustomers,
  onSyncComplete,
  salesTransactions = [],
  savingsTransactions = [],
  investmentTransactions = [],
  debtTransactions = [],
  redeemedPoints = []
}: CustomerManagementProps) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (initialCustomers && initialCustomers.length > 0) {
      return initialCustomers.map((c: any, index: number) => ({
        id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
        nama: c.nama || c.Nama || 'Pelanggan',
        pin: c.pin || '',
        telepon: c.telepon || '',
        alamat: c.alamat || '',
        foto: c.foto || ''
      }));
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialCustomers || initialCustomers.length === 0);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('LAST_SHEETS_SYNC') || 'Belum Pernah';
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);
  const [syncDirectStatus, setSyncDirectStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync initialCustomers if prop updates from outside
  useEffect(() => {
    if (initialCustomers && initialCustomers.length > 0) {
      const formatted = initialCustomers.map((c: any, index: number) => ({
        id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
        nama: c.nama || c.Nama || 'Pelanggan',
        pin: c.pin || '',
        telepon: c.telepon || '',
        alamat: c.alamat || '',
        foto: c.foto || '',
        poin: c.poin ?? c.Poin ?? 0
      }));
      setCustomers(formatted);
      setLoading(false);
    }
  }, [initialCustomers]);

  const [dbSource, setDbSource] = useState<'supabase' | 'sheets'>(() => {
    return (localStorage.getItem('customer_db_source') as 'supabase' | 'sheets') || 
           (SupabaseCustomerService.isConnected() ? 'supabase' : 'sheets');
  });
  const [isMigrating, setIsMigrating] = useState(false);

  // Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => SupabaseCustomerService.getCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => SupabaseCustomerService.getCredentials().key);
  const [copySqlStatus, setCopySqlStatus] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_CREATE_TABLE_SQL);
    setCopySqlStatus(true);
    setTimeout(() => setCopySqlStatus(false), 2500);
  };

  const [formData, setFormData] = useState<Partial<Customer>>({
    nama: '',
    pin: '',
    telepon: '',
    alamat: '',
    foto: ''
  });

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('VITE_SUPABASE_URL', supabaseUrlInput.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseKeyInput.trim());
    setShowConfigModal(false);
    setSuccessMessage('Konfigurasi Supabase berhasil disimpan!');
    setShowSuccess(true);
    fetchCustomers();
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      pin: '',
      telepon: '',
      alamat: '',
      foto: ''
    });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      nama: customer.nama,
      pin: customer.pin,
      telepon: customer.telepon,
      alamat: customer.alamat,
      foto: customer.foto
    });
    setIsModalOpen(true);
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return new Date(0);
    const trimmed = String(dateStr).trim();
    
    // Check if contains time
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

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseInt(String(val).replace(/[^\d]/g, '')) || 0;
  };

  const formatDateDDMMYYYY = (d: Date, rawStr?: string) => {
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

  const getRelativeTimeString = (dateInput: any) => {
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

  const isGenericId = (id?: string) => !id || id === 'cust-0000' || id === 'cust-xxxx' || id === 'cust' || id === '0000';

  // 1. Instant filtered customers for high-performance list rendering (0ms lag)
  const filteredCustomers = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) {
      return [...customers].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    }
    return customers
      .filter(c => {
        const cNama = (c.nama || "").toLowerCase();
        const cId = (c.id_pelanggan || "").toLowerCase();
        return cNama.includes(q) || cId.includes(q);
      })
      .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [customers, search]);

  // Compute Full Stats for Google Sheets Sync (Active Points, All-time Activities, All-time Savings Mutation, All-time Debt Records)
  const computeCustomerStatsForSheets = (
    custList: Customer[],
    salesList: any[] = salesTransactions,
    savingsList: any[] = savingsTransactions,
    debtList: any[] = debtTransactions,
    investList: any[] = investmentTransactions,
    redeemList: any[] = redeemedPoints
  ) => {
    const salesByCustId = new Map<string, any[]>();
    const salesByCustName = new Map<string, any[]>();
    salesList.forEach(t => {
      if (t.id_pelanggan && !isGenericId(t.id_pelanggan)) {
        const list = salesByCustId.get(t.id_pelanggan) || [];
        list.push(t);
        salesByCustId.set(t.id_pelanggan, list);
      }
      const n = (t.Nama || "").toLowerCase().trim();
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
      const n = (t.Nama || "").toLowerCase().trim();
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
      const n = (t.Nama || "").toLowerCase().trim();
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
      const n = (t.Nama || "").toLowerCase().trim();
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
      const n = (r.Nama || "").toLowerCase().trim();
      if (n) {
        const list = redeemedByCustName.get(n) || [];
        list.push(r);
        redeemedByCustName.set(n, list);
      }
    });

    const list = custList.map(c => {
      const name = (c.nama || "").toLowerCase().trim();
      const idPelanggan = c.id_pelanggan;

      // 1. Savings (All time)
      const userSavings = (idPelanggan && savingsByCustId.get(idPelanggan)) || savingsByCustName.get(name) || [];
      const tabungan = userSavings.length > 0 ? userSavings[userSavings.length - 1].SaldoAkhir : 0;

      // 2. Investment (All time active)
      const userInvestments = (idPelanggan && investmentsByCustId.get(idPelanggan)) || investmentsByCustName.get(name) || [];
      const investasi = userInvestments.filter(t => t.Status !== "Selesai").reduce((acc, curr) => acc + (curr.Nominal || 0), 0);

      // 3. Debt (All time)
      const userDebts = (idPelanggan && debtsByCustId.get(idPelanggan)) || debtsByCustName.get(name) || [];
      const hutang = userDebts.length > 0 ? userDebts[userDebts.length - 1].SaldoAkhir : 0;

      // 4. Sales (All time)
      const userSales = (idPelanggan && salesByCustId.get(idPelanggan)) || salesByCustName.get(name) || [];

      // 5. Lainnya (All time active)
      const userLainnyaTransactions = userSales.filter(t => {
        const s = (t.Status || "").toUpperCase().trim();
        return s === "BELUM DIAMBIL" || s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
      });

      const lainnya = userLainnyaTransactions.reduce((acc, curr) => {
        const s = (curr.Status || "").toUpperCase().trim();
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

      // Level (Volume 3 bulan terakhir)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const salesLast3Months = userSales.filter(t => parseDate(t.Tanggal) >= threeMonthsAgo);
      const totalVolume = salesLast3Months.reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);

      let level = "Bronze";
      if (totalVolume >= 20000000) level = "Platinum";
      else if (totalVolume >= 10000000) level = "Gold";
      else if (totalVolume >= 1000000) level = "Silver";

      // 6. POIN AKTIF (All Time: Total Poin Didapat - Poin Kadaluarsa > 1 Thn - Total Poin Ditukar)
      const userRedeemed = ((idPelanggan && redeemedByCustId.get(idPelanggan)) || redeemedByCustName.get(name) || [])
        .reduce((acc: number, curr: any) => acc + (curr.Poin || curr.poin || 0), 0);

      const now = new Date();
      let totalEarned = 0;
      let totalExpired = 0;
      userSales.forEach(t => {
        const nominal = parseCurrency(t.Pemasukan || t.Total || t.Nominal || 0);
        const points = Math.floor(nominal / 10000);
        totalEarned += points;
        const tDate = parseDate(t.Tanggal);
        if (tDate.getTime() > 0) {
          const expiryDate = new Date(tDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          if (expiryDate < now) {
            totalExpired += points;
          }
        }
      });

      const calculatedActivePoints = Math.max(0, totalEarned - totalExpired - userRedeemed);
      const storedPoints = parseCurrency(c.poin ?? (c as any).Poin ?? (c as any).poin_aktif ?? (c as any).PoinAktif);
      const poin = storedPoints > 0 ? storedPoints : calculatedActivePoints;

      // 7. 6 AKTIVITAS TERAKHIR (Semua Waktu / All Time)
      const rawActivities: any[] = [];
      userSales.forEach(t => {
        const d = parseDate(t.Tanggal);
        const rel = getRelativeTimeString(t.Tanggal);
        const nominal = parseCurrency(t.Pemasukan || t.Total || t.Nominal || 0);
        const formatNominal = nominal ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
        let rawJenis = t.Kategori || t.Jenis || t.Keterangan || t.NamaBarang || t.Produk || t.Barang;
        if (!rawJenis || rawJenis === 'Umum' || rawJenis === '-') rawJenis = 'Transaksi';
        const jenisClean = String(rawJenis).replace(/^Transaksi\s+/i, '').trim() || 'Transaksi';
        const rawMetode = String(t.MetodePembayaran || t.Metode || t.MetodeBayar || '').trim().toUpperCase();
        const statusUpper = String(t.Status || '').trim().toUpperCase();
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
        const d = parseDate(t.Tanggal);
        const rel = getRelativeTimeString(t.Tanggal);
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
        const d = parseDate(t.Tanggal);
        const rel = getRelativeTimeString(t.Tanggal);
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
        const d = parseDate(t.Tanggal);
        const rel = getRelativeTimeString(t.Tanggal);
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
        const d = parseDate(r.Tanggal);
        const rel = getRelativeTimeString(r.Tanggal);
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
        const d = parseDate(t.Tanggal);
        const dateStr = formatDateDDMMYYYY(d, t.Tanggal);
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
        const d = parseDate(t.Tanggal);
        const dateStr = formatDateDDMMYYYY(d, t.Tanggal);
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
          const d = parseDate(t.Tanggal);
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
        const rankIdx = activeList.findIndex(item => item.id_pelanggan === c.id_pelanggan || (item.nama || '').toLowerCase() === (c.nama || '').toLowerCase());
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

  const customersWithStatsForSync = useMemo(() => {
    if (!isSyncModalOpen) return [];
    return computeCustomerStatsForSheets(customers);
  }, [isSyncModalOpen, customers, salesTransactions, savingsTransactions, investmentTransactions, debtTransactions, redeemedPoints]);

  // Reusable background / direct sync to Google Apps Script Web App
  const syncToAppsScript = async (customCustomerList?: Customer[], isBackground = false) => {
    const listToSync = customCustomerList || customers;
    if (!listToSync || listToSync.length === 0) return;

    if (!isBackground) {
      setIsSyncingDirect(true);
      setSyncDirectStatus({ type: 'info', text: 'Sedang menyinkronkan data ke Google Sheets...' });
    }

    try {
      const formattedStats = computeCustomerStatsForSheets(listToSync);
      const payload = {
        action: 'syncCustomers',
        customers: formattedStats
      };

      const response = await fetch(DEFAULT_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      let resData: any = {};
      try {
        resData = await response.json();
      } catch (e) {
        resData = { status: 'success' };
      }

      if (resData.status === 'success' || response.ok) {
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
        setLastSyncTime(fullTimeStr);
        if (!isBackground) {
          setSyncDirectStatus({
            type: 'success',
            text: `✓ ${listToSync.length} data pelanggan berhasil disinkronkan ke Google Sheets (${fullTimeStr})`
          });
        }
        if (onSyncComplete) onSyncComplete(listToSync);
      } else {
        throw new Error(resData.message || 'Gagal menyinkronkan ke Google Sheets');
      }
    } catch (err: any) {
      console.error('Error syncing to Apps Script Web App:', err);
      if (!isBackground) {
        setSyncDirectStatus({
          type: 'error',
          text: err.message || 'Gagal menyinkronkan data ke Google Sheets. Pastikan skrip Google sudah aktif.'
        });
      }
    } finally {
      if (!isBackground) {
        setIsSyncingDirect(false);
        setTimeout(() => {
          setSyncDirectStatus(null);
        }, 6000);
      }
    }
  };

  const handleDirectSyncToAppsScript = () => {
    syncToAppsScript(customers, false);
  };

  // Auto-sync debounced trigger when data is updated
  const prevCustomerCount = useRef(customers.length);
  useEffect(() => {
    if (customers.length > 0 && customers.length !== prevCustomerCount.current) {
      prevCustomerCount.current = customers.length;
      const timer = setTimeout(() => {
        syncToAppsScript(customers, true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [customers.length]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCustomers = async () => {
    if (customers && customers.length > 0) return;
    setLoading(true);
    try {
      if (SupabaseCustomerService.isConnected()) {
        const { data, error } = await SupabaseCustomerService.getCustomersMinimal();
        if (!error && data) {
          const formatted = data.map((c: any, index: number) => ({
            id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
            nama: c.nama || 'Pelanggan',
            pin: c.pin || '',
            telepon: c.telepon || '',
            alamat: c.alamat || '',
            foto: c.foto || ''
          }));
          setCustomers(formatted);
          if (onSyncComplete) onSyncComplete(formatted);
        }
      }
    } catch (err) {
      console.error('Error fetching customers from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    setLoading(true);
    const targetId = editingCustomer ? editingCustomer.id_pelanggan : `CUST-${Date.now().toString().slice(-4)}`;

    const updatedCustomerObj: Customer = {
      id_pelanggan: targetId,
      nama: formData.nama.trim(),
      pin: formData.pin || '',
      telepon: formData.telepon || '',
      alamat: formData.alamat || '',
      foto: formData.foto || ''
    };

    let nextCustomerList: Customer[] = [];

    // Optimistically update local state & global state
    setCustomers(prev => {
      const exists = prev.some(c => c.id_pelanggan === targetId);
      const next = exists
        ? prev.map(c => c.id_pelanggan === targetId ? updatedCustomerObj : c)
        : [updatedCustomerObj, ...prev];
      nextCustomerList = next;
      if (setGlobalCustomers) {
        setGlobalCustomers(next);
      }
      return next;
    });

    // Save directly to Supabase
    if (SupabaseCustomerService.isConnected()) {
      try {
        await SupabaseCustomerService.upsertCustomer({
          id_pelanggan: targetId,
          nama: updatedCustomerObj.nama,
          pin: updatedCustomerObj.pin,
          telepon: updatedCustomerObj.telepon,
          alamat: updatedCustomerObj.alamat,
          foto: updatedCustomerObj.foto
        });
      } catch (err) {
        console.error('Error saving customer to Supabase:', err);
      }
    }

    setLoading(false);
    onActionSuccess(editingCustomer ? 'Data pelanggan berhasil diperbarui di Supabase' : 'Pelanggan baru berhasil ditambahkan ke Supabase');

    // Trigger background auto sync to Google Sheets
    if (nextCustomerList.length > 0) {
      syncToAppsScript(nextCustomerList, true);
    }
  };

  const onActionSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setIsModalOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const confirmDelete = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    const targetId = customerToDelete;

    try {
      setLoading(true);
      setIsDeleteModalOpen(false);

      let nextCustomerList: Customer[] = [];

      // Optimistic delete
      setCustomers(prev => {
        const next = prev.filter(c => c.id_pelanggan !== targetId);
        nextCustomerList = next;
        if (setGlobalCustomers) {
          setGlobalCustomers(next);
        }
        return next;
      });

      // Hapus dari Supabase
      if (SupabaseCustomerService.isConnected()) {
        try {
          await SupabaseCustomerService.deleteCustomer(targetId);
        } catch (err) {
          console.error('Error deleting customer from Supabase:', err);
        }
      }
      
      onActionSuccess('Pelanggan berhasil dihapus dari Supabase');

      // Trigger background auto sync to Google Sheets
      if (nextCustomerList.length > 0) {
        syncToAppsScript(nextCustomerList, true);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      onActionSuccess('Pelanggan dihapus secara lokal');
    } finally {
      setLoading(false);
      setCustomerToDelete(null);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    setDisplayLimit(12);
  }, [search, filterLevel]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setDisplayLimit(prev => (prev < filteredCustomers.length ? prev + 12 : prev));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredCustomers.length]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayLimit);
  }, [filteredCustomers, displayLimit]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">Manajemen Pelanggan</h1>
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em]">Data & Pelanggan Warung Tomi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 max-w-7xl mx-auto space-y-4">
        {/* 1. Kolom Cari Paling Atas */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text"
              placeholder="CARI NAMA / ID PELANGGAN..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-[#005E6A] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005E6A]/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Dua Kartu Sejajar: Singkronisasi (Kiri) & Tambah Pelanggan (Kanan) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Kartu Singkronisasi */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-white p-4 sm:p-5 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center gap-3.5 text-left transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-emerald-200 shadow-md shrink-0">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black text-emerald-900 uppercase tracking-tight truncate">Singkronisasi</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Auto Sync Sheets</span>
              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider truncate mt-0.5">
                Terakhir update: {lastSyncTime}
              </span>
            </div>
          </motion.button>

          {/* Kartu Tambah Pelanggan */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setEditingCustomer(null); setIsModalOpen(true); }}
            className="bg-white p-4 sm:p-5 rounded-[2rem] border border-teal-100 shadow-sm flex items-center gap-3.5 text-left transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#005E6A] rounded-2xl flex items-center justify-center text-white shadow-teal-200 shadow-md shrink-0">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black text-[#005E6A] uppercase tracking-tight truncate">Tambah Pelanggan</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Register Pelanggan Baru</span>
            </div>
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Daftar Pelanggan Aktif
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchCustomers}
                className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-[#005E6A] transition-all shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && customers.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
               <Loader2 className="w-8 h-8 text-[#005E6A] animate-spin mx-auto mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sedang memuat data...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
               <Search className="w-8 h-8 text-slate-200 mx-auto mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : (
            <div>
              <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
                {displayedCustomers.map((customer, i) => (
                  <motion.div 
                    layout
                    key={`cust-${customer.id_pelanggan}-${i}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    onClick={() => navigate(`/admin/customers/${encodeURIComponent(customer.nama)}`)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                      {customer.foto ? (
                        <img src={customer.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <h4 className="text-xs font-black text-[#005E6A] uppercase tracking-wide group-hover:text-teal-600 transition-colors">
                      {customer.nama}
                    </h4>
                  </motion.div>
                ))}
              </div>

              {filteredCustomers.length > displayLimit && (
                <div className="mt-8 text-center flex flex-col items-center gap-2 pb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Menampilkan {displayedCustomers.length} dari {filteredCustomers.length} Pelanggan
                  </p>
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 12)}
                    className="px-6 py-3 bg-[#005E6A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Muat ({Math.min(12, filteredCustomers.length - displayLimit)}) Pelanggan Lagi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-10 py-8 bg-[#005E6A] text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">
                    {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                  </h2>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {editingCustomer ? `MENGUBAH DATA ${editingCustomer.id_pelanggan}` : 'PENDAFTARAN PELANGGAN BARU'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-[0.2em] border-b border-teal-50 pb-2 flex items-center gap-2">
                     <User className="w-4 h-4" /> Data Pelanggan
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nama Lengkap *</label>
                      <input 
                        required
                        type="text" 
                        placeholder="NAMA LENGKAP PELANGGAN"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-black text-[#005E6A] placeholder:text-slate-300"
                        value={formData.nama || ''}
                        onChange={(e) => setFormData({...formData, nama: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">No. Telepon / WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="08123456789"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-bold text-[#005E6A] placeholder:text-slate-300"
                        value={formData.telepon || ''}
                        onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Alamat Lengkap</label>
                      <textarea 
                        rows={3}
                        placeholder="ALAMAT LENGKAP PELANGGAN..."
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-bold text-[#005E6A] placeholder:text-slate-300 resize-none"
                        value={formData.alamat || ''}
                        onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-[#005E6A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#004b54] transition-all shadow-xl shadow-teal-100 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Hapus Pelanggan?</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-10">
                Data <span className="text-red-600 underline decoration-2 underline-offset-4">{customerToDelete}</span> akan dihilangkan permanen dari database sistem.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[130] bg-[#005E6A] text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-md"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Berhasil</p>
              <p className="text-xs font-bold text-white/80">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* MODAL PENGATURAN KUNCI SUPABASE */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005E6A] flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Konfigurasi Supabase</h3>
                    <p className="text-[10px] font-bold text-slate-400">Masukkan Project URL & Anon Key Supabase</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSupabaseConfig} className="py-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://xyzproject.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Supabase Anon Key (API Key)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005E6A]"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[10px] font-medium text-slate-600 space-y-2">
                  <p className="font-bold text-[#005E6A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Langkah Konfigurasi Supabase:
                  </p>
                  <p>1. Salin <strong>Project URL</strong> & <strong>anon key</strong> dari Supabase Project Settings -&gt; API</p>
                  <p>2. Buka menu <strong>SQL Editor</strong> di Supabase dan jalankan script pembuat tabel <code className="font-mono">customers</code>.</p>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="w-full mt-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-[#005E6A] border border-teal-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copySqlStatus ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>KODE SQL DISALIN!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>SALIN SCRIPT SQL TABEL CUSTOMERS</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#005E6A] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#004b54] shadow-md transition-all cursor-pointer"
                  >
                    Simpan & Hubungkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popup Modal Singkronisasi Google Sheets */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Auto Sync Google Sheets</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelola Sinkronisasi Data Pelanggan</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSyncModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Direct 1-Click Apps Script Sync UI (Tanpa Perlu Login Google) */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white tracking-wider">
                        Sistem API Otomatis
                      </span>
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase">
                        Web App Apps Script
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Sinkronisasi instan ke Google Sheets tanpa perlu login Google berulang.
                    </p>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                      Terakhir Update: <span className="underline">{lastSyncTime}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectSyncToAppsScript}
                    disabled={isSyncingDirect}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingDirect ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDirect ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>

                {syncDirectStatus && (
                  <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    syncDirectStatus.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : syncDirectStatus.type === 'error'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {syncDirectStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {syncDirectStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{syncDirectStatus.text}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
