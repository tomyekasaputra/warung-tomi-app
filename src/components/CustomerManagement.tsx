import React, { useState, useEffect, useMemo } from 'react';
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SupabaseCustomerService, SupabaseCustomer } from '../lib/supabase';

interface Customer {
  id_pelanggan: string;
  nama: string;
  pin: string;
  foto: string;
}

const LEVEL_METADATA: Record<string, { color: string }> = {
  'Bronze': { color: '#CD7F32' },
  'Silver': { color: '#94a3b8' },
  'Gold': { color: '#F59E0B' },
  'Platinum': { color: '#1e293b' }
};

interface CustomerManagementProps {
  onSyncComplete?: (data: Customer[]) => void;
  salesTransactions?: any[];
  savingsTransactions?: any[];
  investmentTransactions?: any[];
  debtTransactions?: any[];
  redeemedPoints?: any[];
}

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFXIApyWFaY7tGXiq-k7yvRlFAUJB2QNzeSU01-sR2dVL1FrnaVNPlgf2FXxsqSi5L9g/exec';
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL;

export default function CustomerManagement({ 
  onSyncComplete,
  salesTransactions = [],
  savingsTransactions = [],
  investmentTransactions = [],
  debtTransactions = [],
  redeemedPoints = []
}: CustomerManagementProps) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [scriptUrl, setScriptUrl] = useState(() => {
    return localStorage.getItem('APPS_SCRIPT_URL') || APPS_SCRIPT_URL;
  });
  const [isUrlConfigured, setIsUrlConfigured] = useState(!!(localStorage.getItem('APPS_SCRIPT_URL') || APPS_SCRIPT_URL));

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

  // Progress Modal State
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationStage, setMigrationStage] = useState<'analyzing' | 'ready' | 'migrating' | 'completed'>('analyzing');
  const [migrationAnalysis, setMigrationAnalysis] = useState<{
    totalSource: number;
    alreadyInSupabaseCount: number;
    newToMigrateCount: number;
    alreadyInSupabaseList: any[];
    newToMigrateList: any[];
    error: any;
  } | null>(null);

  const [migrationProgress, setMigrationProgress] = useState({
    processed: 0,
    total: 0,
    percentage: 0,
    currentCustomer: '',
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
    logs: [] as { name: string; status: 'success' | 'skipped' | 'error'; message?: string }[],
    isCompleted: false,
    errorsList: [] as string[]
  });

  const [formData, setFormData] = useState<Partial<Customer>>({
    nama: '',
    pin: '',
    foto: ''
  });

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('VITE_SUPABASE_URL', supabaseUrlInput.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseKeyInput.trim());
    setShowConfigModal(false);
    setSuccessMessage('Konfigurasi Supabase berhasil disimpan!');
    setShowSuccess(true);
    if (SupabaseCustomerService.isConnected()) {
      setDbSource('supabase');
      localStorage.setItem('customer_db_source', 'supabase');
      fetchCustomers();
    }
  };

  const handleMigrateToSupabase = async () => {
    if (!SupabaseCustomerService.isConnected()) {
      setShowConfigModal(true);
      return;
    }
    
    const listToMigrate = customersWithStats.length > 0 ? customersWithStats : customers;
    if (listToMigrate.length === 0) {
      alert("Tidak ada data pelanggan untuk dimigrasikan.");
      return;
    }

    setIsMigrating(true);
    setShowMigrationModal(true);
    setMigrationStage('analyzing');
    setMigrationAnalysis(null);

    try {
      // 1. Jalankan analisa data pra-migrasi
      const analysis = await SupabaseCustomerService.analyzeMigration(listToMigrate);
      setMigrationAnalysis(analysis);

      if (analysis.error) {
        setMigrationStage('completed');
        setMigrationProgress(prev => ({
          ...prev,
          isCompleted: true,
          errorsList: [analysis.error.message || String(analysis.error)]
        }));
      } else {
        setMigrationStage('ready');
      }
    } catch (err: any) {
      setMigrationStage('completed');
      setMigrationProgress(prev => ({
        ...prev,
        isCompleted: true,
        errorsList: [err.message || String(err)]
      }));
    } finally {
      setIsMigrating(false);
    }
  };

  const startActualMigration = async (mode: 'only_new' | 'update_all') => {
    if (!migrationAnalysis) return;
    const listToMigrate = customersWithStats.length > 0 ? customersWithStats : customers;
    const itemsToProcess = mode === 'only_new' 
      ? (migrationAnalysis.newToMigrateList.length > 0 ? migrationAnalysis.newToMigrateList : listToMigrate)
      : listToMigrate;

    if (itemsToProcess.length === 0 && mode === 'only_new') {
      alert("Semua data pelanggan sudah ada di Supabase! Tidak ada data baru yang perlu dimigrasikan.");
      return;
    }

    setIsMigrating(true);
    setMigrationStage('migrating');
    setMigrationProgress({
      processed: 0,
      total: itemsToProcess.length,
      percentage: 0,
      currentCustomer: 'Mulai memproses data...',
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      logs: [],
      isCompleted: false,
      errorsList: []
    });

    try {
      const res = await SupabaseCustomerService.bulkMigrateCustomers(
        itemsToProcess,
        (processed, tot, name, statusType, msg) => {
          const percentage = Math.round((processed / tot) * 100);
          setMigrationProgress(prev => {
            const newSuccess = statusType === 'success' ? prev.successCount + 1 : prev.successCount;
            const newSkipped = statusType === 'skipped' ? prev.skippedCount + 1 : prev.skippedCount;
            const newFailed = statusType === 'error' ? prev.failedCount + 1 : prev.failedCount;

            const newLogs = [
              { name, status: statusType, message: msg },
              ...prev.logs
            ].slice(0, 30);

            return {
              ...prev,
              processed,
              total: tot,
              percentage,
              currentCustomer: name,
              successCount: newSuccess,
              skippedCount: newSkipped,
              failedCount: newFailed,
              logs: newLogs
            };
          });
        },
        mode
      );

      setMigrationProgress(prev => ({
        ...prev,
        isCompleted: true,
        errorsList: res.errors
      }));
      setMigrationStage('completed');

      if (res.successCount > 0 || res.skippedCount > 0) {
        setDbSource('supabase');
        localStorage.setItem('customer_db_source', 'supabase');
        setSuccessMessage(`Migrasi Selesai! ${res.successCount} data disinkronkan, ${res.skippedCount} dilewati (tanpa duplikasi).`);
        setShowSuccess(true);
        fetchCustomers();
      }
    } catch (err: any) {
      setMigrationProgress(prev => ({
        ...prev,
        isCompleted: true,
        errorsList: [err.message || String(err)]
      }));
      setMigrationStage('completed');
    } finally {
      setIsMigrating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      pin: '',
      foto: ''
    });
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return new Date(0);
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseInt(String(val).replace(/[^\d]/g, '')) || 0;
  };

  const calculateCustomerStats = (customerNama: string) => {
    const name = customerNama.toLowerCase();
    
    // 1. Savings
    const userSavings = savingsTransactions.filter(t => (t.Nama || "").toLowerCase() === name);
    const tabungan = userSavings.length > 0 ? userSavings[userSavings.length - 1].SaldoAkhir : 0;

    // 2. Investment
    const userInvestments = investmentTransactions.filter(t => (t.Nama || "").toLowerCase() === name);
    const investasi = userInvestments.filter(t => t.Status !== "Selesai").reduce((acc, curr) => acc + (curr.Nominal || 0), 0);

    // 3. Debt
    const userDebts = debtTransactions.filter(t => (t.Nama || "").toLowerCase() === name);
    const hutang = userDebts.length > 0 ? userDebts[userDebts.length - 1].SaldoAkhir : 0;

    // 4. Points & Level
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const userSales = salesTransactions.filter(t => (t.Nama || "").toLowerCase() === name);
    const salesLast3Months = userSales.filter(t => parseDate(t.Tanggal) >= threeMonthsAgo);
    const totalVolume = salesLast3Months.reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);

    let level = "Bronze";
    if (totalVolume >= 20000000) level = "Platinum";
    else if (totalVolume >= 10000000) level = "Gold";
    else if (totalVolume >= 1000000) level = "Silver";

    const userRedeemed = redeemedPoints
      .filter(r => (r.Nama || "").toLowerCase() === name)
      .reduce((acc, curr) => acc + (curr.Poin || 0), 0);

    const now = new Date();
    let totalEarned = 0;
    let totalExpired = 0;
    userSales.forEach(t => {
      const points = Math.floor((parseCurrency(t.Pemasukan) || 0) / 10000);
      totalEarned += points;
      const tDate = parseDate(t.Tanggal);
      const expiryDate = new Date(tDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      if (expiryDate < now) totalExpired += points;
    });

    const poin = totalEarned - totalExpired - userRedeemed;

    return { tabungan, investasi, hutang, poin, level };
  };

  const customersWithStats = useMemo(() => {
    return customers.map(c => ({
      ...c,
      ...calculateCustomerStats(c.nama)
    }));
  }, [customers, salesTransactions, savingsTransactions, investmentTransactions, debtTransactions, redeemedPoints]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Priority 1: Fetch from Supabase if active & selected
      if (dbSource === 'supabase' && SupabaseCustomerService.isConnected()) {
        const { data, error } = await SupabaseCustomerService.getCustomers();
        if (!error && data && data.length > 0) {
          const formatted = data.map((c: any, index: number) => ({
            id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
            nama: c.nama || 'Pelanggan',
            pin: c.pin || '',
            foto: c.foto || ''
          }));
          setCustomers(formatted);
          if (onSyncComplete) onSyncComplete(formatted);
          setLoading(false);
          return;
        }
      }

      // Priority 2: Fetch from Google Sheets Apps Script
      if (!scriptUrl) {
        setLoading(false);
        return;
      }

      const response = await fetch(scriptUrl);
      const data = await response.json();
      
      // Clean and sanitize incoming customer objects to heal any "NaN" or malformed IDs
      const cleanedData = (data || []).map((c: any, index: number) => {
        let cleanId = String(c.id_pelanggan || c.id || '').trim();
        if (!cleanId || cleanId.toLowerCase() === 'nan' || cleanId.includes('NaN')) {
          cleanId = 'CUST-' + String(index + 1).padStart(4, '0');
        }
        return {
          ...c,
          id_pelanggan: cleanId
        };
      });
      setCustomers(cleanedData);
      if (onSyncComplete) {
        onSyncComplete(cleanedData);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (scriptUrl) {
      setIsUrlConfigured(true);
    }
  }, [scriptUrl, dbSource]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const saveUrl = (url: string) => {
    if (!url) return;
    localStorage.setItem('APPS_SCRIPT_URL', url);
    setScriptUrl(url);
    setIsUrlConfigured(true);
    setTimeout(() => fetchCustomers(), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    setLoading(true);
    const action = editingCustomer ? 'UPDATE' : 'ADD';
    const targetId = editingCustomer ? editingCustomer.id_pelanggan : `CUST-${Date.now().toString().slice(-4)}`;

    const updatedCustomerObj: Customer = {
      id_pelanggan: targetId,
      nama: formData.nama.trim(),
      pin: formData.pin || '',
      foto: formData.foto || ''
    };

    // Optimistically update local state so UI updates instantly
    setCustomers(prev => {
      const exists = prev.some(c => c.id_pelanggan === targetId);
      if (exists) {
        return prev.map(c => c.id_pelanggan === targetId ? updatedCustomerObj : c);
      }
      return [updatedCustomerObj, ...prev];
    });

    // 1. Simpan ke Supabase jika terhubung
    if (SupabaseCustomerService.isConnected()) {
      try {
        await SupabaseCustomerService.upsertCustomer({
          id_pelanggan: targetId,
          nama: updatedCustomerObj.nama,
          pin: updatedCustomerObj.pin,
          foto: updatedCustomerObj.foto
        });
      } catch (err) {
        console.error('Error upserting to Supabase:', err);
      }
    }

    // 2. Simpan/Sinkron ke Google Sheets jika scriptUrl ada
    if (scriptUrl) {
      const backendData = {
        nama: updatedCustomerObj.nama,
        pin: updatedCustomerObj.pin,
        foto: updatedCustomerObj.foto
      };

      const payload = {
        action,
        data: editingCustomer ? { ...backendData, id_pelanggan: editingCustomer.id_pelanggan } : backendData
      };

      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          referrerPolicy: 'no-referrer',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Network issue when submitting customer to Sheets:', err);
      }
    }

    setLoading(false);
    onActionSuccess(editingCustomer ? 'Data pelanggan diperbarui' : 'Pelanggan baru ditambahkan');
  };

  const onActionSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    fetchCustomers();
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
      setCustomers(prev => prev.filter(c => c.id_pelanggan !== targetId));

      // 1. Hapus dari Supabase jika terhubung
      if (SupabaseCustomerService.isConnected()) {
        try {
          await SupabaseCustomerService.deleteCustomer(targetId);
        } catch (err) {
          console.error('Error deleting from Supabase:', err);
        }
      }

      // 2. Hapus dari Google Sheets
      if (scriptUrl) {
        try {
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            referrerPolicy: 'no-referrer',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ action: 'DELETE', id: targetId })
          });
        } catch (err) {
          console.warn('Network issue when deleting customer from Sheets:', err);
        }
      }
      
      onActionSuccess('Pelanggan berhasil dihapus');
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

  const filteredCustomers = useMemo(() => {
    return customersWithStats
      .filter(c => {
        const matchesSearch = c.nama.toLowerCase().includes(search.toLowerCase()) || 
                            c.id_pelanggan.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = filterLevel === 'Semua' || c.level === filterLevel;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [customersWithStats, search, filterLevel]);

  const levelStats = useMemo(() => {
    const counts = customersWithStats.reduce((acc: any, c) => {
      const lvl = c.level || 'Bronze';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});

    return ['Bronze', 'Silver', 'Gold', 'Platinum'].map(level => ({
      name: level,
      value: counts[level] || 0,
      color: (LEVEL_METADATA[level] || LEVEL_METADATA['Bronze']).color
    }));
  }, [customersWithStats]);

  if (!isUrlConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-teal-50 rounded-full">
              <AlertCircle className="w-10 h-10 text-[#005E6A]" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 mb-2 uppercase tracking-tight">System Data</h2>
          <p className="text-slate-500 text-center text-sm font-bold uppercase tracking-wider mb-8">Hubungkan ke Google Sheets</p>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="G-APPS SCRIPT URL (EXEC)..."
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#005E6A]/20 outline-none transition-all font-mono text-xs"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
            />
            <button 
              onClick={() => saveUrl(scriptUrl)}
              disabled={!scriptUrl}
              className="w-full py-4 bg-[#005E6A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#004b54] shadow-lg shadow-teal-100 transition-all active:scale-95"
            >
              Hubungkan Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">Manajemen Pelanggan</h1>
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em]">Data & Pelanggan Warung Tomi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 max-w-7xl mx-auto space-y-6">
        {/* CARD SINKRONISASI & MIGRASI SUPABASE */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-tight flex items-center gap-2 flex-wrap">
                  Database & Migrasi Supabase
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    SupabaseCustomerService.isConnected() 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {SupabaseCustomerService.isConnected() ? 'Supabase Terkoneksi' : 'Kunci Env Belum Diisi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="text-[10px] font-bold text-[#005E6A] hover:underline flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Pengaturan Keys</span>
                  </button>
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Sinkronisasi & simpan data pelanggan secara permanen menggunakan PostgreSQL Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDbSource('supabase');
                  localStorage.setItem('customer_db_source', 'supabase');
                  fetchCustomers();
                }}
                className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dbSource === 'supabase'
                    ? 'bg-[#005E6A] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sumber: Supabase
              </button>
              <button
                type="button"
                onClick={() => {
                  setDbSource('sheets');
                  localStorage.setItem('customer_db_source', 'sheets');
                  fetchCustomers();
                }}
                className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dbSource === 'sheets'
                    ? 'bg-[#005E6A] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sumber: Google Sheets
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-[11px] font-bold text-slate-500 space-y-1">
              <p>• Mode Tambah, Edit, dan Hapus otomatis menyimpan ke Supabase & Google Sheets bersamaan.</p>
              <p>• Data yang saat ini ditampilkan berasal dari: <strong className="text-[#005E6A] uppercase">{dbSource === 'supabase' ? 'Database Supabase' : 'Google Sheets Apps Script'}</strong></p>
            </div>

            <button
              type="button"
              disabled={isMigrating}
              onClick={handleMigrateToSupabase}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>MEMIGRASIKAN...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>MIGRASIKAN KE SUPABASE ({customers.length} PELANGGAN)</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-start px-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Pelanggan</p>
                  <h3 className="text-xl font-black text-[#005E6A]">{customers.length} Orang</h3>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Sistem</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <h3 className="text-[10px] font-black text-teal-600 uppercase">Terhubung</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {levelStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-50">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{data.name}</p>
                            <p className="text-[10px] font-black text-[#005E6A]">{data.value} Orang</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {levelStats.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-50 pt-5">
                {levelStats.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.name}</span>
                    </div>
                    <p className="text-[10px] font-black text-[#005E6A]">{s.value} Orang</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setEditingCustomer(null); setIsModalOpen(true); }}
            className="w-full relative overflow-hidden group bg-white p-5 rounded-[2rem] border border-teal-100 shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-[#005E6A] rounded-2xl flex items-center justify-center text-white shadow-teal-100 shadow-lg shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#005E6A] uppercase tracking-widest leading-none mb-1">Tambah Pelanggan</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Register Pelanggan</span>
            </div>
          </motion.button>

          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text"
                placeholder="CARI NAMA / ID PELANGGAN..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-[#005E6A] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005E6A]/5 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[10px] font-black text-[#005E6A] outline-none focus:ring-2 focus:ring-[#005E6A]/5 transition-all appearance-none cursor-pointer"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="Semua">SEMUA LEVEL</option>
              {['Bronze', 'Silver', 'Gold', 'Platinum'].map(lvl => (
                <option key={lvl} value={lvl}>{lvl.toUpperCase()}</option>
              ))}
            </select>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer, i) => (
                <motion.div 
                  layout
                  key={`cust-${customer.id_pelanggan}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/admin/customers/${encodeURIComponent(customer.nama)}`)}
                  className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:border-[#005E6A]/20 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl bg-slate-50 overflow-hidden border flex-shrink-0 flex items-center justify-center transition-all"
                        style={{ borderColor: (LEVEL_METADATA[customer.level || 'Bronze'] || LEVEL_METADATA['Bronze']).color }}
                      >
                        {customer.foto ? (
                          <img src={customer.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User 
                            className="w-6 h-6 animate-pulse" 
                            style={{ color: (LEVEL_METADATA[customer.level || 'Bronze'] || LEVEL_METADATA['Bronze']).color }}
                          />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#005E6A] uppercase leading-none mb-1 group-hover:text-teal-600 transition-colors">{customer.nama}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] font-black font-mono text-slate-400 uppercase tracking-[0.2em]">{customer.id_pelanggan}</p>
                          <span 
                            className="text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border"
                            style={{ 
                              backgroundColor: `${(LEVEL_METADATA[customer.level || 'Bronze'] || LEVEL_METADATA['Bronze']).color}1A`,
                              color: (LEVEL_METADATA[customer.level || 'Bronze'] || LEVEL_METADATA['Bronze']).color,
                              borderColor: `${(LEVEL_METADATA[customer.level || 'Bronze'] || LEVEL_METADATA['Bronze']).color}33`,
                            }}
                          >
                            {customer.level || 'Bronze'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(customer as any); }}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-teal-50 hover:text-[#005E6A] transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(customer.id_pelanggan); }}
                        className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                    {editingCustomer ? 'Edit Nasabah' : 'Nasabah Baru'}
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

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-[0.2em] border-b border-teal-50 pb-2 flex items-center gap-2">
                       <User className="w-4 h-4" /> Informasi Identitas
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Identity ID</label>
                        <input 
                          type="text" 
                          disabled 
                          value={editingCustomer?.id_pelanggan || 'OTOMATIS'} 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nama Lengkap</label>
                        <input 
                          required
                          type="text" 
                          placeholder="NAMA LENGKAP"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-black text-[#005E6A] placeholder:text-slate-200"
                          value={formData.nama}
                          onChange={(e) => setFormData({...formData, nama: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">PIN AKUN</label>
                        <input 
                          required
                          type="password" 
                          maxLength={6}
                          placeholder="6 DIGIT PIN"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-black text-[#005E6A] placeholder:text-slate-200"
                          value={formData.pin}
                          onChange={(e) => setFormData({...formData, pin: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Link Foto Profil</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200" />
                          <input 
                            type="text" 
                            placeholder="HTTPS://..."
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#005E6A]/10 outline-none transition-all text-xs font-bold text-teal-600 placeholder:text-slate-200"
                            value={formData.foto}
                            onChange={(e) => setFormData({...formData, foto: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-teal-50/20 p-6 rounded-[2rem] border border-teal-50">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                          <Calculator className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest mb-1">Perhitungan Otomatis Aktif</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                            Data Tabungan, Investasi, Hutang, Poin, dan Level akan dihitung otomatis oleh sistem berdasarkan riwayat transaksi yang bersangkutan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-[#005E6A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#004b54] transition-all shadow-xl shadow-teal-100 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Member
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

      {/* MODAL PROGRESS BAR & ANALISA MIGRASI SUPABASE */}
      <AnimatePresence>
        {showMigrationModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    migrationStage === 'analyzing' || migrationStage === 'migrating'
                      ? 'bg-teal-100 text-[#005E6A]'
                      : migrationStage === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : migrationProgress.failedCount === 0
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {migrationStage === 'analyzing' || migrationStage === 'migrating' ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : migrationStage === 'ready' ? (
                      <PieChartIcon className="w-6 h-6" />
                    ) : migrationProgress.failedCount === 0 ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      {migrationStage === 'analyzing' && 'Menganalisis Data Supabase...'}
                      {migrationStage === 'ready' && 'Analisis Pra-Migrasi Data'}
                      {migrationStage === 'migrating' && 'Proses Migrasi Pelanggan'}
                      {migrationStage === 'completed' && 'Hasil Akhir Migrasi Supabase'}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400">
                      {migrationStage === 'analyzing' && 'Memeriksa data existing agar tidak terjadi ganda...'}
                      {migrationStage === 'ready' && 'Evaluasi data selesai. Pilih opsi migrasi efisien:'}
                      {migrationStage === 'migrating' && `Memindahkan data ke database Supabase...`}
                      {migrationStage === 'completed' && `Proses migrasi telah selesai disinkronkan.`}
                    </p>
                  </div>
                </div>

                {(migrationStage === 'ready' || migrationStage === 'completed') && (
                  <button
                    onClick={() => setShowMigrationModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* TAMPILAN STAGE 1: ANALYZING */}
              {migrationStage === 'analyzing' && (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-[#005E6A] border border-teal-100">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Menganalisis Ketersediaan Data...</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Sistem sedang membandingkan data lokal/Sheets dengan database Supabase agar <strong>tidak ada data ganda (duplikat)</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAMPILAN STAGE 2: READY (PILIHAN SINKRONISASI EFISIEN) */}
              {migrationStage === 'ready' && migrationAnalysis && (
                <div className="py-6 space-y-5">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <p className="text-[9px] font-black uppercase text-slate-400">Total Sumber</p>
                      <p className="text-xl font-black text-slate-800 mt-0.5">{migrationAnalysis.totalSource}</p>
                      <p className="text-[9px] font-bold text-slate-400">data</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-center">
                      <p className="text-[9px] font-black uppercase text-emerald-700">Sudah Ada</p>
                      <p className="text-xl font-black text-emerald-800 mt-0.5">{migrationAnalysis.alreadyInSupabaseCount}</p>
                      <p className="text-[9px] font-bold text-emerald-600">di Supabase</p>
                    </div>

                    <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3 text-center">
                      <p className="text-[9px] font-black uppercase text-teal-700">Belum Ada</p>
                      <p className="text-xl font-black text-[#005E6A] mt-0.5">{migrationAnalysis.newToMigrateCount}</p>
                      <p className="text-[9px] font-bold text-teal-600">data baru</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px]">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Proteksi Data Ganda Terdeteksi:</span>
                    </p>
                    <p className="text-[10px] leading-relaxed text-amber-900">
                      Terdapat <strong>{migrationAnalysis.alreadyInSupabaseCount} pelanggan</strong> yang sudah pernah tersimpan di Supabase. Anda dapat memilih migrasi hanya data baru agar lebih cepat dan efisien!
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => startActualMigration('only_new')}
                      disabled={migrationAnalysis.newToMigrateCount === 0}
                      className="w-full py-3.5 px-4 bg-[#005E6A] hover:bg-[#004b54] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Migrasikan {migrationAnalysis.newToMigrateCount} Data Baru Saja (Efesien & Bebas Ganda)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startActualMigration('update_all')}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Perbarui & Sinkronkan Semua ({migrationAnalysis.totalSource} Data)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAMPILAN STAGE 3 & 4: MIGRATING & COMPLETED */}
              {(migrationStage === 'migrating' || migrationStage === 'completed') && (
                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <span className="text-slate-600">
                      Progress ({migrationProgress.processed} / {migrationProgress.total})
                    </span>
                    <span className="text-[#005E6A] font-extrabold text-sm">
                      {migrationProgress.percentage}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-[#005E6A] rounded-full transition-all duration-300 relative"
                      style={{ width: `${migrationProgress.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                    </div>
                  </div>

                  {/* Current Customer indicator */}
                  {!migrationProgress.isCompleted && (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="truncate max-w-[280px]">
                        👤 {migrationProgress.currentCustomer || 'Memproses...'}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 shrink-0 font-black text-[10px] uppercase">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Mengirim...
                      </span>
                    </div>
                  )}

                  {/* Counter Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 text-center">
                      <p className="text-[9px] font-black uppercase text-emerald-700">Berhasil</p>
                      <p className="text-base font-black text-emerald-800">{migrationProgress.successCount}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-center">
                      <p className="text-[9px] font-black uppercase text-amber-700">Dilewati</p>
                      <p className="text-base font-black text-amber-800">{migrationProgress.skippedCount}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200/80 rounded-2xl p-2.5 text-center">
                      <p className="text-[9px] font-black uppercase text-red-700">Gagal</p>
                      <p className="text-base font-black text-red-800">{migrationProgress.failedCount}</p>
                    </div>
                  </div>

                  {/* Live Process Log */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Log Proses Real-Time
                    </p>
                    <div className="bg-slate-900 text-slate-200 rounded-2xl p-3 h-32 overflow-y-auto font-mono text-[11px] space-y-1 scrollbar-thin">
                      {migrationProgress.logs.length === 0 ? (
                        <p className="text-slate-500 text-[10px] italic">Memulai koneksi ke Supabase...</p>
                      ) : (
                        migrationProgress.logs.map((log, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1">
                            <span className="truncate text-slate-300">
                              {log.status === 'success' && '✅ '}
                              {log.status === 'skipped' && '⏭️ '}
                              {log.status === 'error' && '❌ '}
                              {log.name}
                            </span>
                            <span className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded ${
                              log.status === 'success' ? 'bg-emerald-900/60 text-emerald-300' :
                              log.status === 'skipped' ? 'bg-amber-900/60 text-amber-300' :
                              'bg-red-900/60 text-red-300'
                            }`}>
                              {log.message || (log.status === 'success' ? 'Berhasil' : log.status === 'skipped' ? 'Dilewati' : 'Gagal')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Error diagnostics instructions if any errors occurred */}
                  {migrationProgress.isCompleted && migrationProgress.failedCount > 0 && (
                    <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 text-[11px] font-medium text-red-900 space-y-3">
                      <div className="flex items-center gap-1.5 font-black text-red-800 text-xs uppercase tracking-tight">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Penyebab Error: "invalid path specified"</span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-red-950">
                        Pesan error ini muncul dari Supabase karena <strong>Tabel <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-red-800">customers</code> belum dibuat</strong> di database Supabase Anda.
                      </p>

                      <div className="bg-white/80 p-3 rounded-xl border border-red-200/80 space-y-2">
                        <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                          🛠️ Cara Mengatasinya (Buat Tabel Supabase):
                        </p>
                        <ol className="list-decimal list-inside text-[10px] space-y-1 text-slate-700 font-medium">
                          <li>Buka Dashboard Supabase -&gt; Pilih Project Anda -&gt; Menu <strong>SQL Editor</strong></li>
                          <li>Klik <strong>New Query</strong>, lalu salin & tempelkan kode SQL di bawah ini</li>
                          <li>Klik tombol <strong>RUN</strong> di kanan bawah SQL Editor Supabase</li>
                        </ol>

                        <button
                          type="button"
                          onClick={handleCopySql}
                          className="w-full mt-2 py-2.5 px-3 bg-[#005E6A] hover:bg-[#004b54] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          {copySqlStatus ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-300" />
                              <span>KODE SQL BERHASIL DISALIN!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>SALIN SCRIPT SQL TABEL SUPABASE</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-2">
                {migrationStage === 'completed' ? (
                  <button
                    onClick={() => setShowMigrationModal(false)}
                    className="w-full py-4 bg-[#005E6A] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#004b54] transition-all shadow-lg cursor-pointer"
                  >
                    Tutup Modal Progress
                  </button>
                ) : migrationStage === 'migrating' ? (
                  <p className="text-center text-[10px] font-bold text-slate-400 animate-pulse">
                    Mohon tunggu, memigrasikan data ke Supabase...
                  </p>
                ) : null}
              </div>
            </motion.div>
          </div>
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
    </div>
  );
}
