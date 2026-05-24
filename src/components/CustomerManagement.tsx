import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, User, CreditCard, Wallet, 
  TrendingUp, CircleDollarSign, Star, Award, Image as ImageIcon,
  Loader2, X, Check, AlertCircle, Save, PlusCircle, RefreshCw,
  PieChart as PieChartIcon, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

  const [formData, setFormData] = useState<Partial<Customer>>({
    nama: '',
    pin: '',
    foto: ''
  });

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
    if (!scriptUrl) return;
    setLoading(true);
    try {
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
    if (scriptUrl) {
      fetchCustomers();
      setIsUrlConfigured(true);
    }
  }, [scriptUrl]);

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
    if (!scriptUrl) return;

    const action = editingCustomer ? 'UPDATE' : 'ADD';
    // Only send relevant fields to backend as per user request
    const backendData = {
      nama: formData.nama,
      pin: formData.pin,
      foto: formData.foto
    };

    const payload = {
      action,
      data: editingCustomer ? { ...backendData, id_pelanggan: editingCustomer.id_pelanggan } : backendData
    };

    try {
      setLoading(true);
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      try {
        const result = await response.json();
        if (result.success) {
          onActionSuccess(editingCustomer ? 'Data pelanggan diperbarui' : 'Pelanggan baru ditambahkan');
        }
      } catch (e) {
        onActionSuccess(editingCustomer ? 'Data pelanggan diperbarui' : 'Pelanggan baru ditambahkan');
      }
    } catch (err) {
      console.error('Error submitting customer:', err);
      onActionSuccess('Data dikirim ke sistem');
    } finally {
      setLoading(false);
    }
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
    if (!customerToDelete || !scriptUrl) return;

    try {
      setLoading(true);
      setIsDeleteModalOpen(false);
      await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id: customerToDelete })
      });
      
      onActionSuccess('Pelanggan berhasil dihapus');
    } catch (err) {
      console.error('Error deleting customer:', err);
      onActionSuccess('Permintaan hapus dikirim');
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
    </div>
  );
}
