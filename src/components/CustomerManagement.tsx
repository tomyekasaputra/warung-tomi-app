import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, User, CreditCard, Wallet, 
  TrendingUp, CircleDollarSign, Star, Award, Image as ImageIcon,
  Loader2, X, Check, AlertCircle, Save, PlusCircle, RefreshCw,
  PieChart as PieChartIcon, Calculator, Database, ArrowRight,
  Key, Settings, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Copy,
  BarChart3, Users, Flame, Zap, Trophy, Crown, ExternalLink, FileSpreadsheet,
  ArrowUpRight, Sparkles
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
import { extractCleanItemOrReason } from '../lib/googleSheetsSync';
import GoogleSheetsSyncCard from './GoogleSheetsSyncCard';

interface Customer {
  id_pelanggan: string;
  nama: string;
  pin: string;
  telepon?: string;
  alamat?: string;
  foto: string;
  poin?: number;
  [key: string]: any;
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
        foto: c.foto || '',
        poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
        level: c.level || c.Level || 'Bronze',
        tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
        investasi: Number(c.investasi ?? c.Investasi ?? 0),
        lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
        hutang: Number(c.hutang ?? c.Hutang ?? 0)
      }));
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'analisa' | 'daftar'>('analisa');
  const [isDeltaChecking, setIsDeltaChecking] = useState(false);

  // Pagination & Database Search States (20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [pagedCustomers, setPagedCustomers] = useState<Customer[]>([]);
  const [loadingPaged, setLoadingPaged] = useState(false);

  // Database RPC Analytics State
  const [analyticsRpcData, setAnalyticsRpcData] = useState<{
    currentMonthName: string;
    topSpenders: any[];
    mostFrequent: any[];
    topProfit: any[];
    activeCustomerCount: number;
  }>({
    currentMonthName: '',
    topSpenders: [],
    mostFrequent: [],
    topProfit: [],
    activeCustomerCount: 0
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // RPC Customer Analytics Fetcher
  const fetchAnalyticsRpc = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await SupabaseCustomerService.calculateCustomerAnalyticsRpc();
      if (res.data) {
        setAnalyticsRpcData({
          currentMonthName: res.data.currentMonthName || '',
          topSpenders: res.data.topSpenders || [],
          mostFrequent: res.data.mostFrequent || [],
          topProfit: res.data.topProfit || [],
          activeCustomerCount: res.data.activeCustomerCount || 0
        });
      }
    } catch (e) {
      console.warn("RPC Customer Analytics Error, using fallback:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Paged Customers Fetcher (20 baris per panggilan basis database)
  const fetchPagedCustomers = async (pageToFetch = 1, searchQuery = search, level = filterLevel) => {
    setLoadingPaged(true);
    try {
      if (SupabaseCustomerService.isConnected()) {
        const { data, totalCount, error } = await SupabaseCustomerService.getCustomersPaged({
          page: pageToFetch,
          pageSize: 20,
          search: searchQuery,
          filterLevel: level
        });

        if (!error && data) {
          const formatted = data.map((c: any, index: number) => ({
            id_pelanggan: c.id_pelanggan || `CUST-${String((pageToFetch - 1) * 20 + index + 1).padStart(4, '0')}`,
            id: c.id_pelanggan || c.id || `CUST-${String((pageToFetch - 1) * 20 + index + 1).padStart(4, '0')}`,
            nama: c.nama || 'Pelanggan',
            Nama: c.nama || 'Pelanggan',
            pin: c.pin || '',
            telepon: c.telepon || '',
            alamat: c.alamat || '',
            foto: c.foto || '',
            poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
            Poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
            level: c.level || c.Level || 'Bronze',
            Level: c.level || c.Level || 'Bronze',
            tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
            investasi: Number(c.investasi ?? c.Investasi ?? 0),
            lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
            hutang: Number(c.hutang ?? c.Hutang ?? 0)
          }));
          setPagedCustomers(formatted);
          setTotalCustomerCount(totalCount ?? formatted.length);
          setCustomers(formatted);
          if (onSyncComplete) onSyncComplete(formatted);
        }
      }
    } catch (err) {
      console.error('Error fetching paged customers from Supabase:', err);
    } finally {
      setLoadingPaged(false);
    }
  };

  // Tab switch handler: lazy load data only when tab is clicked
  const handleTabSwitch = (tab: 'analisa' | 'daftar') => {
    setActiveTab(tab);
    if (tab === 'daftar') {
      fetchPagedCustomers(currentPage, search, filterLevel);
    } else if (tab === 'analisa') {
      fetchAnalyticsRpc();
    }
  };

  // Search debouncing for database query
  const searchTimeoutRef = useRef<any>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchPagedCustomers(1, val, filterLevel);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.max(1, Math.ceil(totalCustomerCount / pageSize));
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchPagedCustomers(newPage, search, filterLevel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load RPC analytics on initial mount (default tab is Analisa)
  useEffect(() => {
    if (activeTab === 'analisa') {
      fetchAnalyticsRpc();
    } else {
      fetchPagedCustomers(1, '', 'Semua');
    }
  }, []);

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
        poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
        level: c.level || c.Level || 'Bronze',
        tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
        investasi: Number(c.investasi ?? c.Investasi ?? 0),
        lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
        hutang: Number(c.hutang ?? c.Hutang ?? 0)
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
    id_pelanggan: '',
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
    if (activeTab === 'daftar') {
      fetchPagedCustomers(1);
    } else if (activeTab === 'analisa') {
      fetchAnalyticsRpc();
    }
  };

  const resetForm = () => {
    setFormData({
      id_pelanggan: '',
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
      id_pelanggan: customer.id_pelanggan || '',
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

  // Direct point and level mapping from customers data
  const customerPointsAndLevels = useMemo(() => {
    const map = new Map<string, { poin: number; level: string }>();
    customers.forEach(c => {
      const key = (c.id_pelanggan || c.nama || "").toLowerCase();
      const poin = Number(c.point ?? c.poin ?? (c as any).Poin ?? (c as any).Point ?? 0);
      const level = String(c.level ?? (c as any).Level ?? "Bronze");
      map.set(key, { poin, level });
    });
    return map;
  }, [customers]);

  // 1. Instant filtered customers for high-performance list rendering (0ms lag)
  const filteredCustomers = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const enriched = customers.map(c => {
      const poin = Number(c.point ?? c.poin ?? (c as any).Poin ?? (c as any).Point ?? 0);
      const level = String(c.level ?? (c as any).Level ?? "Bronze");
      return {
        ...c,
        poin,
        level
      };
    });

    if (!q) {
      return [...enriched].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    }
    return enriched
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
      const idPelanggan = c.id_pelanggan || (c as any).id;

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

      // Level & Point directly from Supabase / customer data without recalculation
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

    const nowJakarta = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    return list.map((item: any) => {
      const monthlyTotal = item.total_belanja_bulan_ini || 0;
      let peringkat = "Belum ada belanja bulan ini";
      if (monthlyTotal > 0) {
        const rankIdx = activeList.findIndex(x => x.id_pelanggan === item.id_pelanggan || (x.nama || '').toLowerCase() === (item.nama || '').toLowerCase());
        if (rankIdx !== -1) {
          peringkat = `Ke ${rankIdx + 1} dari ${totalActive}`;
        }
      }
      return {
        ...item,
        id_pelanggan: item.id_pelanggan || item.id || '',
        nama: item.nama || item.Nama || 'Pelanggan',
        tabungan: item.tabungan || 0,
        investasi: item.investasi || 0,
        lainnya: item.lainnya || 0,
        hutang: item.hutang || 0,
        level: item.level || item.Level || 'Bronze',
        poin: Number(item.poin ?? item.point ?? item.Poin ?? item.Point ?? 0),
        total_belanja_bulan_ini: monthlyTotal,
        peringkat,
        aktivitas_terakhir: item.aktivitas_terakhir,
        mutasi_tabungan: item.mutasi_tabungan,
        catatan_hutang: item.catatan_hutang,
        terakhir_diperbarui: nowJakarta,
        // Aliases
        "id pelanggan": item.id_pelanggan || item.id || '',
        "ID Pelanggan": item.id_pelanggan || item.id || '',
        "Nama": item.nama || item.Nama || 'Pelanggan',
        "Tabungan": item.tabungan || 0,
        "Investasi": item.investasi || 0,
        "Lainnya": item.lainnya || 0,
        "Hutang": item.hutang || 0,
        "Level": item.level || item.Level || 'Bronze',
        "Poin": Number(item.poin ?? item.point ?? item.Poin ?? item.Point ?? 0),
        "total belanja bulan ini": monthlyTotal,
        "Total Belanja Bulan Ini": monthlyTotal,
        "Peringkat": peringkat,
        "aktivitas terakhir": item.aktivitas_terakhir,
        "Aktivitas Terakhir": item.aktivitas_terakhir,
        "mutasi tabungan": item.mutasi_tabungan,
        "Mutasi Tabungan": item.mutasi_tabungan,
        "catatan hutang": item.catatan_hutang,
        "Catatan Hutang": item.catatan_hutang,
        "terakhir diperbarui": nowJakarta,
        "Terakhir Diperbarui": nowJakarta
      };
    });
  };

  const customersWithStatsForSync = useMemo(() => {
    if (!isSyncModalOpen) return [];
    return computeCustomerStatsForSheets(customers);
  }, [isSyncModalOpen, customers, salesTransactions, savingsTransactions, investmentTransactions, debtTransactions, redeemedPoints]);

  // Reusable background / direct sync to Google Apps Script Web App
  const syncToAppsScript = async (customCustomerList?: Customer[], isBackground = false) => {
    let listToSync = customCustomerList || customers;

    // Ensure we fetch all customers from Supabase if connected
    if (SupabaseCustomerService.isConnected()) {
      try {
        const { data: supaAllCust } = await SupabaseCustomerService.getCustomers();
        if (supaAllCust && supaAllCust.length > 0) {
          const formatted = supaAllCust.map((c: any, index: number) => ({
            id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
            id: c.id_pelanggan || c.id || `CUST-${String(index + 1).padStart(4, '0')}`,
            nama: c.nama || 'Pelanggan',
            Nama: c.nama || 'Pelanggan',
            pin: c.pin || '',
            telepon: c.telepon || '',
            alamat: c.alamat || '',
            foto: c.foto || '',
            poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
            Poin: Number(c.point ?? c.poin ?? c.Poin ?? c.Point ?? 0),
            level: c.level || c.Level || 'Bronze',
            Level: c.level || c.Level || 'Bronze',
            tabungan: Number(c.tabungan ?? c.Tabungan ?? 0),
            investasi: Number(c.investasi ?? c.Investasi ?? 0),
            lainnya: Number(c.lainnya ?? c.Lainnya ?? 0),
            hutang: Number(c.hutang ?? c.Hutang ?? 0)
          }));
          listToSync = formatted;
          setCustomers(formatted);
        }
      } catch (e) {
        console.warn('Error fetching all customers for syncToAppsScript:', e);
      }
    }

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

      // 1. Try server proxy endpoint first
      let syncSuccess = false;
      let errorMsg = '';

      try {
        const proxyRes = await fetch('/api/sheets/apps-script-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptUrl: DEFAULT_SCRIPT_URL,
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
        console.warn('Proxy sync attempt failed in CustomerManagement, trying direct fetch...', proxyErr);
      }

      // 2. Fallback direct fetch
      if (!syncSuccess) {
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
          resData = { status: response.ok ? 'success' : 'unknown' };
        }

        if (resData.status === 'success' || response.ok) {
          syncSuccess = true;
        } else {
          errorMsg = resData.message || 'Gagal menyinkronkan ke Google Sheets';
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
        setLastSyncTime(fullTimeStr);
        if (!isBackground) {
          setSyncDirectStatus({
            type: 'success',
            text: `✓ Seluruh (${listToSync.length}) data pelanggan berhasil disinkronkan ke Google Sheets (${fullTimeStr})`
          });
        }
        if (onSyncComplete) onSyncComplete(listToSync);
      } else {
        throw new Error(errorMsg || 'Gagal menyinkronkan ke Google Sheets');
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

  const refreshActiveTabData = () => {
    if (activeTab === 'daftar') {
      fetchPagedCustomers(currentPage, search, filterLevel);
    } else {
      fetchAnalyticsRpc();
    }
  };

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
    const oldId = editingCustomer ? editingCustomer.id_pelanggan : undefined;
    const oldName = editingCustomer ? editingCustomer.nama : undefined;

    const targetId = (formData.id_pelanggan && formData.id_pelanggan.trim())
      ? formData.id_pelanggan.trim().toUpperCase()
      : (editingCustomer ? editingCustomer.id_pelanggan : `CUST-${Date.now().toString().slice(-4)}`);

    const newName = formData.nama.trim().toUpperCase();

    const updatedCustomerObj: Customer = {
      ...(editingCustomer || {}),
      id_pelanggan: targetId,
      nama: newName,
      pin: formData.pin || '',
      telepon: formData.telepon || '',
      alamat: formData.alamat || '',
      foto: formData.foto || ''
    };

    // Optimistically update local state & global state
    const exists = customers.some(c => c.id_pelanggan === targetId || (oldId && c.id_pelanggan === oldId));
    const nextCustomerList = exists
      ? customers.map(c => (c.id_pelanggan === targetId || (oldId && c.id_pelanggan === oldId)) ? updatedCustomerObj : c)
      : [updatedCustomerObj, ...customers];

    setCustomers(nextCustomerList);
    if (setGlobalCustomers) {
      setGlobalCustomers(nextCustomerList);
    }

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

        // If editing and ID or Name changed, run Cascade Update to all transaction histories
        if (editingCustomer && (oldId !== targetId || oldName !== newName)) {
          await SupabaseCustomerService.cascadeUpdateCustomer({
            oldIdPelanggan: oldId,
            newIdPelanggan: targetId,
            oldName: oldName,
            newName: newName
          });
        }
      } catch (err) {
        console.error('Error saving customer to Supabase:', err);
      }
    }

    setLoading(false);
    onActionSuccess(editingCustomer ? 'Data pelanggan & seluruh riwayat transaksi berhasil diselaraskan di Supabase' : 'Pelanggan baru berhasil ditambahkan ke Supabase');

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

      // Optimistic delete
      const nextCustomerList = customers.filter(c => c.id_pelanggan !== targetId);
      setCustomers(nextCustomerList);
      if (setGlobalCustomers) {
        setGlobalCustomers(nextCustomerList);
      }

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

  // Analytics for Current Month
  const analyticsThisMonth = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth(); // 0-indexed

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const currentMonthName = `${monthNames[currMonth]} ${currYear}`;

    // Filter helper: ignore generic "Pelanggan Umum" / unnamed entries
    const isGenericOrUmum = (nama?: string, id?: string) => {
      const n = (nama || '').trim().toLowerCase();
      const i = (id || '').trim().toLowerCase();
      if (!n || n === '-' || n === 'pelanggan') return true;
      if (
        n === 'umum' || 
        n === 'pelanggan umum' || 
        n.includes('pelanggan umum') || 
        n.includes('umum') || 
        n === 'non-member' || 
        n === 'non member' || 
        n === 'anonim' || 
        n === 'pembeli umum' ||
        n === 'guest'
      ) return true;
      if (i === 'umum' || i === 'cust-umum') return true;
      return false;
    };

    // Filter sales this month
    const thisMonthSales = (salesTransactions || []).filter(t => {
      const d = parseDate(t.Tanggal || t.tanggal);
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    });

    const customerStatsMap = new Map<string, {
      key: string;
      id_pelanggan: string;
      nama: string;
      foto: string;
      totalSpending: number;
      transactionCount: number;
      totalProfit: number;
      rawSales: any[];
    }>();

    // Initialize with all named registered customers (exclude umum)
    customers.forEach(c => {
      if (isGenericOrUmum(c.nama, c.id_pelanggan)) return;
      const key = (c.id_pelanggan || c.nama || '').trim().toLowerCase();
      if (!key) return;
      customerStatsMap.set(key, {
        key,
        id_pelanggan: c.id_pelanggan || '',
        nama: c.nama || '',
        foto: c.foto || '',
        totalSpending: 0,
        transactionCount: 0,
        totalProfit: 0,
        rawSales: []
      });
    });

    // Calculate from this month's sales
    thisMonthSales.forEach(t => {
      const cId = (t.id_pelanggan || '').trim();
      const cName = (t.Nama || t.nama || '').trim();
      
      // Abaikan transaksi pelanggan umum
      if (isGenericOrUmum(cName, cId)) return;

      const key = (cId || cName).toLowerCase();
      if (!key) return;

      let stat = customerStatsMap.get(key);
      if (!stat) {
        const matched = customers.find(c => 
          (c.id_pelanggan && c.id_pelanggan.toLowerCase() === key) ||
          (c.nama && c.nama.toLowerCase() === cName.toLowerCase())
        );

        const finalName = matched?.nama || cName;
        if (isGenericOrUmum(finalName, cId || matched?.id_pelanggan)) return;

        stat = {
          key,
          id_pelanggan: cId || matched?.id_pelanggan || '',
          nama: finalName,
          foto: matched?.foto || '',
          totalSpending: 0,
          transactionCount: 0,
          totalProfit: 0,
          rawSales: []
        };
        customerStatsMap.set(key, stat);
      }

      const spending = parseCurrency(t.Pemasukan || t.Total || t.Nominal || 0);
      const modal = parseCurrency(t.HargaModal || t.harga_modal || 0);
      // Profit: Total Pemasukan - Harga Modal (estimasi 15% jika harga modal belum diinput)
      const profit = modal > 0 ? Math.max(0, spending - modal) : Math.round(spending * 0.15);

      stat.totalSpending += spending;
      stat.transactionCount += 1;
      stat.totalProfit += profit;
      stat.rawSales.push(t);
    });

    // Filter only active customers with names (strictly excluding umum)
    const activePelanggan = Array.from(customerStatsMap.values()).filter(c => 
      !isGenericOrUmum(c.nama, c.id_pelanggan) && (c.transactionCount > 0 || c.totalSpending > 0)
    );

    // 1. Transaksi Terbesar (Top 3 Spenders Bulan Ini)
    const topSpenders = [...activePelanggan].sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 3);

    // 2. Transaksi Tersering (Top 3 Paling Sering Belanja Bulan Ini)
    const mostFrequent = [...activePelanggan].sort((a, b) => b.transactionCount - a.transactionCount || b.totalSpending - a.totalSpending).slice(0, 3);

    // 3. Paling Banyak Memberi Keuntungan (Top 3 Margin Keuntungan Bulan Ini)
    const topProfit = [...activePelanggan].sort((a, b) => b.totalProfit - a.totalProfit || b.totalSpending - a.totalSpending).slice(0, 3);

    return {
      currentMonthName,
      topSpenders,
      mostFrequent,
      topProfit,
      activeCustomerCount: activePelanggan.length
    };
  }, [customers, salesTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Area */}
      <div className="bg-[#005E6A] text-white px-6 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">Manajemen Pelanggan</h1>
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em]">Data, Analisa & Sinkronisasi Warung Tomi</p>
            </div>
          </div>

          {/* Delta Sync Badge Indicator */}
          {isDeltaChecking && (
            <div className="self-start md:self-auto bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-teal-100 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-200" />
              <span>Memeriksa Delta Sync...</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-8 relative z-20 max-w-7xl mx-auto space-y-5">
        {/* 2 TAB UTAMA PALING ATAS */}
        <div className="bg-white p-2 rounded-[2.2rem] border border-slate-200/80 shadow-md flex items-center gap-2">
          <button
            id="tab-analisa-btn"
            onClick={() => handleTabSwitch('analisa')}
            className={`flex-1 py-3.5 px-4 rounded-[1.8rem] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'analisa'
                ? 'bg-[#005E6A] text-white shadow-lg shadow-teal-900/20'
                : 'text-slate-500 hover:text-[#005E6A] hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Analisa</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              activeTab === 'analisa' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
            }`}>
              Bulan Ini
            </span>
          </button>

          <button
            id="tab-daftar-btn"
            onClick={() => handleTabSwitch('daftar')}
            className={`flex-1 py-3.5 px-4 rounded-[1.8rem] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'daftar'
                ? 'bg-[#005E6A] text-white shadow-lg shadow-teal-900/20'
                : 'text-slate-500 hover:text-[#005E6A] hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Daftar</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'daftar' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {customers.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENT: ANALISA */}
        {activeTab === 'analisa' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 3 KARTU ANALISA UTAMA BULAN INI (DIHITUNG DATABASE DENGAN RPC) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. Transaksi Terbesar (Top Spenders) */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-amber-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Transaksi Terbesar</h3>
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                          {analyticsRpcData.currentMonthName || analyticsThisMonth.currentMonthName || "Bulan Ini"} (RPC Database)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl border border-amber-200/60">
                      Nominal
                    </span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span>Menghitung di Supabase RPC...</span>
                    </div>
                  ) : (analyticsRpcData.topSpenders.length > 0 ? analyticsRpcData.topSpenders : analyticsThisMonth.topSpenders).length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Belum ada transaksi di bulan ini
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(analyticsRpcData.topSpenders.length > 0 ? analyticsRpcData.topSpenders : analyticsThisMonth.topSpenders).map((cust: any, idx: number) => (
                        <div
                          key={`top-spender-${cust.id_pelanggan || cust.key || idx}`}
                          onClick={() => navigate(`/admin/customers/${encodeURIComponent(cust.nama)}`)}
                          className="p-3 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl border border-amber-100/80 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              idx === 0 ? 'bg-amber-500 text-white shadow-xs' :
                              idx === 1 ? 'bg-slate-300 text-slate-800' :
                              idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-amber-200 shrink-0 flex items-center justify-center">
                              {cust.foto ? (
                                <img src={cust.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-amber-700" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate group-hover:text-amber-700 transition-colors">
                                {cust.nama}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 tracking-wider">
                                {cust.transactionCount}x Transaksi
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-amber-700 block">
                              Rp {Number(cust.totalSpending || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Transaksi Tersering (Most Frequent) */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-teal-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#005E6A] text-white flex items-center justify-center shadow-md shadow-teal-200">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Transaksi Tersering</h3>
                        <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">
                          Paling Sering Belanja (RPC Database)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-xl border border-teal-200/60">
                      Frekuensi
                    </span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      <span>Menghitung di Supabase RPC...</span>
                    </div>
                  ) : (analyticsRpcData.mostFrequent.length > 0 ? analyticsRpcData.mostFrequent : analyticsThisMonth.mostFrequent).length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Belum ada transaksi di bulan ini
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(analyticsRpcData.mostFrequent.length > 0 ? analyticsRpcData.mostFrequent : analyticsThisMonth.mostFrequent).map((cust: any, idx: number) => (
                        <div
                          key={`most-frequent-${cust.id_pelanggan || cust.key || idx}`}
                          onClick={() => navigate(`/admin/customers/${encodeURIComponent(cust.nama)}`)}
                          className="p-3 bg-teal-50/40 hover:bg-teal-50/80 rounded-2xl border border-teal-100/80 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              idx === 0 ? 'bg-[#005E6A] text-white shadow-xs' :
                              idx === 1 ? 'bg-teal-600 text-white' :
                              idx === 2 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-teal-200 shrink-0 flex items-center justify-center">
                              {cust.foto ? (
                                <img src={cust.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-teal-700" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate group-hover:text-teal-700 transition-colors">
                                {cust.nama}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 tracking-wider">
                                Total: Rp {Number(cust.totalSpending || 0).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-[#005E6A] bg-teal-100/70 px-2.5 py-1 rounded-xl block">
                              {cust.transactionCount}x Beli
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Paling Banyak Memberi Keuntungan (Top Margin/Profit) */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Paling Menguntungkan</h3>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                          Laba Bersih Terbesar (RPC Database)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                      Profit
                    </span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Menghitung di Supabase RPC...</span>
                    </div>
                  ) : (analyticsRpcData.topProfit.length > 0 ? analyticsRpcData.topProfit : analyticsThisMonth.topProfit).length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Belum ada transaksi di bulan ini
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(analyticsRpcData.topProfit.length > 0 ? analyticsRpcData.topProfit : analyticsThisMonth.topProfit).map((cust: any, idx: number) => (
                        <div
                          key={`top-profit-${cust.id_pelanggan || cust.key || idx}`}
                          onClick={() => navigate(`/admin/customers/${encodeURIComponent(cust.nama)}`)}
                          className="p-3 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl border border-emerald-100/80 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              idx === 0 ? 'bg-emerald-600 text-white shadow-xs' :
                              idx === 1 ? 'bg-emerald-700 text-white' :
                              idx === 2 ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-emerald-200 shrink-0 flex items-center justify-center">
                              {cust.foto ? (
                                <img src={cust.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-emerald-700" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate group-hover:text-emerald-700 transition-colors">
                                {cust.nama}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 tracking-wider">
                                Omset: Rp {Number(cust.totalSpending || 0).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-700 block">
                              +Rp {Number(cust.totalProfit || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UI SINGKRONISASI KE GOOGLE SHEETS & UPDATE TERAKHIR */}
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                        Singkronisasi ke Google Sheets
                      </h3>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Auto Sync Aktif
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 tracking-wide mt-0.5">
                      Pembaruan Terakhir: <span className="text-emerald-700 font-black">{lastSyncTime}</span>
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Singkronisasi */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDirectSyncToAppsScript}
                    disabled={isSyncingDirect}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-emerald-200/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingDirect ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDirect ? 'Menyinkronkan...' : 'Singkronkan Sekarang'}</span>
                  </button>

                  <button
                    onClick={() => setIsSyncModalOpen(true)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Detail & Konfigurasi</span>
                  </button>
                </div>
              </div>

              {/* Status Feedback Banner */}
              {syncDirectStatus && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border transition-all ${
                  syncDirectStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : syncDirectStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {syncDirectStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {syncDirectStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {syncDirectStatus.type === 'info' && <RefreshCw className="w-4 h-4 text-teal-600 animate-spin shrink-0" />}
                  <span className="flex-1">{syncDirectStatus.text}</span>
                </div>
              )}

              {/* Kolom Data yang Disinkronkan */}
              <div className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Format Data yang Disinkronkan Otomatis:
                  </p>
                  <span className="text-[10px] font-black text-[#005E6A] uppercase bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                    {totalCustomerCount || customers.length} Data Pelanggan Terintegrasi
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "ID Pelanggan",
                    "Nama",
                    "Tabungan",
                    "Investasi",
                    "Lainnya",
                    "Hutang",
                    "Level",
                    "Poin",
                    "Total Belanja Bulan Ini",
                    "Peringkat",
                    "Aktivitas Terakhir",
                    "Mutasi Tabungan",
                    "Catatan Hutang",
                    "Terakhir Diperbarui"
                  ].map((col, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB CONTENT: DAFTAR PELANGGAN (DIPANGGIL HANYA SAAT TAB DIKLIK - 20 BARIS PAGINATION BASIS DATABASE) */}
        {activeTab === 'daftar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* 1. Kolom Pencarian Pelanggan Berbasis Database */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text"
                  placeholder="CARI NAMA / ID PELANGGAN (BERBASIS DATABASE)..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-[#005E6A] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005E6A]/5 transition-all"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filter Level */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto max-w-full pb-1 sm:pb-0">
                {['Semua', 'Bronze', 'Silver', 'Gold', 'Platinum'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setFilterLevel(lvl);
                      setCurrentPage(1);
                      fetchPagedCustomers(1, search, lvl);
                    }}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterLevel === lvl
                        ? 'bg-[#005E6A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tombol Aksi Tambah Pelanggan & Refresh */}
            <div className="flex items-center justify-between gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { resetForm(); setEditingCustomer(null); setIsModalOpen(true); }}
                className="flex-1 bg-white p-4 sm:p-5 rounded-[2rem] border border-teal-100 shadow-sm flex items-center gap-3.5 text-left transition-all hover:shadow-md group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#005E6A] rounded-2xl flex items-center justify-center text-white shadow-teal-200 shadow-md shrink-0">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-black text-[#005E6A] uppercase tracking-tight truncate">Tambah Pelanggan Baru</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Registrasi Akun Baru</span>
                </div>
              </motion.button>

              <button 
                onClick={() => fetchPagedCustomers(currentPage, search, filterLevel)}
                className="p-4 sm:p-5 bg-white rounded-[2rem] border border-slate-100 text-slate-400 hover:text-[#005E6A] transition-all shadow-sm flex items-center justify-center cursor-pointer group shrink-0"
                title="Segarkan Data Halaman Ini"
              >
                <RefreshCw className={`w-5 h-5 ${loadingPaged ? 'animate-spin text-[#005E6A]' : 'group-hover:rotate-180 transition-transform'}`} />
              </button>
            </div>

            {/* 3. Daftar List Pelanggan Aktif (Paginasi 20 Baris) */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Daftar Pelanggan Aktif (Urutan A-Z)
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Database: {totalCustomerCount} Pelanggan
                </span>
              </div>

              {loadingPaged ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
                  <Loader2 className="w-8 h-8 text-[#005E6A] animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat 20 baris data dari database...</p>
                </div>
              ) : pagedCustomers.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
                  <Search className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada pelanggan ditemukan</p>
                </div>
              ) : (
                <div>
                  <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
                    {pagedCustomers.map((customer, i) => (
                      <motion.div 
                        layout
                        key={`cust-${customer.id_pelanggan}-${i}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        onClick={() => navigate(`/admin/customers/${encodeURIComponent(customer.nama)}`)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                            {customer.foto ? (
                              <img src={customer.foto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#005E6A] uppercase tracking-wide group-hover:text-teal-600 transition-colors truncate">
                              {customer.nama}
                            </h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              ID: {customer.id_pelanggan || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {customer.level && (
                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                              customer.level === "Platinum" ? "bg-slate-900 text-slate-100 border-slate-700" :
                              customer.level === "Gold" ? "bg-amber-100 text-amber-800 border-amber-300" :
                              customer.level === "Silver" ? "bg-slate-100 text-slate-700 border-slate-300" :
                              "bg-amber-50 text-[#A57164] border-[#CD7F32]/30"
                            }`}>
                              {customer.level}
                            </span>
                          )}
                          {customer.poin !== undefined && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-200">
                              {customer.poin} Poin
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#005E6A] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Paginasi Berbasis Database (20 baris per halaman) */}
                  <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-bold text-slate-500">
                      Menampilkan <span className="text-[#005E6A] font-black">{totalCustomerCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> - <span className="text-[#005E6A] font-black">{Math.min(currentPage * pageSize, totalCustomerCount)}</span> dari <span className="text-[#005E6A] font-black">{totalCustomerCount}</span> Pelanggan
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || loadingPaged}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all"
                      >
                        ← Sebelumnya
                      </button>

                      <span className="px-3 py-1.5 bg-teal-50 text-[#005E6A] border border-teal-100 rounded-xl text-xs font-black">
                        Hal {currentPage} / {Math.max(1, Math.ceil(totalCustomerCount / pageSize))}
                      </span>

                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalCustomerCount / pageSize) || loadingPaged}
                        className="px-4 py-2 bg-[#005E6A] hover:bg-teal-700 text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
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
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Pelanggan (Kode Unik)</label>
                        <span className="text-[8px] font-bold text-teal-600 uppercase">
                          {editingCustomer ? 'Opsional - Ubah jika perlu' : 'Otomatis jika kosong'}
                        </span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="CONTOH: CUST-0001 (OTOMATIS JIKA KOSONG)"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-black text-[#005E6A] placeholder:text-slate-300 uppercase tracking-wider"
                        value={formData.id_pelanggan || ''}
                        onChange={(e) => setFormData({...formData, id_pelanggan: e.target.value.toUpperCase()})}
                      />
                    </div>
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
