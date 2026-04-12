import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import Papa from "papaparse";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShoppingBag, 
  Zap, 
  Smartphone, 
  CreditCard, 
  MapPin, 
  Phone, 
  Clock, 
  Menu as MenuIcon, 
  X,
  ChevronRight,
  Star,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Receipt,
  Truck,
  History,
  User,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  LayoutGrid,
  Settings,
  QrCode,
  Send,
  Globe,
  Home,
  Bot,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Info,
  Lock,
  HeartPulse,
  Droplets,
  Tv,
  Gamepad2,
  FileText,
  DollarSign,
  Download,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Types ---

const parseDate = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return new Date(0);
  
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[/-]/);
  if (parts.length === 3) {
    // Check if it's YYYY-MM-DD
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Assume DD/MM/YYYY
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

interface Customer {
  Nama: string;
  PIN?: string;
  Saldo?: string;
  ID?: string;
  Tabungan?: string;
  [key: string]: any;
}

interface SavingTransaction {
  Tanggal: string;
  Nama: string;
  Tipe: string;
  Nominal: number;
  SaldoAkhir: number;
}

interface DebtTransaction {
  Tanggal: string;
  Nama: string;
  Tipe: string;
  Jumlah: number;
  Keterangan: string;
  SaldoAkhir: number;
}

interface SalesTransaction {
  Tanggal: string;
  Nama: string;
  Jenis: string;
  Pemasukan: number;
  Status: string;
  Melalui: string;
  HargaModal: number;
  Sebagian: number;
}

interface InvestmentTransaction {
  Tanggal: string;
  Nama: string;
  Nominal: number;
  Tenor: string;
  JatuhTempo: string;
  Status: string;
}

// --- Data ---

const MAIN_SERVICES = [
  { id: 1, name: "Belanja", icon: <ShoppingBag className="w-6 h-6 text-blue-600" />, bgColor: "bg-[#EBF5FF]" },
  { id: 2, name: "QRIS", icon: <QrCode className="w-6 h-6 text-purple-600" />, bgColor: "bg-[#F3E8FF]" },
  { id: 3, name: "Tarik", icon: <CreditCard className="w-6 h-6 text-orange-600" />, bgColor: "bg-[#FFF7ED]" },
  { id: 4, name: "Kirim", icon: <Send className="w-6 h-6 text-blue-600" />, bgColor: "bg-[#EEF2FF]" },
  { id: 5, name: "E-Walet", icon: <Wallet className="w-6 h-6 text-green-600" />, bgColor: "bg-[#F0FDF4]" },
  { id: 6, name: "Pulsa", icon: <Smartphone className="w-6 h-6 text-pink-600" />, bgColor: "bg-[#FDF2F8]" },
  { id: 7, name: "Data", icon: <Globe className="w-6 h-6 text-teal-600" />, bgColor: "bg-[#F0FDFA]" },
  { id: 8, name: "Listrik", icon: <Zap className="w-6 h-6 text-yellow-600" />, bgColor: "bg-[#FEFCE8]" },
  { id: 9, name: "BPJS", icon: <HeartPulse className="w-6 h-6 text-red-600" />, bgColor: "bg-[#FEF2F2]" },
  { id: 10, name: "PDAM", icon: <Droplets className="w-6 h-6 text-cyan-600" />, bgColor: "bg-[#ECFEFF]" },
  { id: 11, name: "Voucher TV", icon: <Tv className="w-6 h-6 text-indigo-600" />, bgColor: "bg-[#EEF2FF]" },
  { id: 12, name: "Voucher Game", icon: <Gamepad2 className="w-6 h-6 text-rose-600" />, bgColor: "bg-[#FFF1F2]" },
  { id: 13, name: "Bayar VA", icon: <FileText className="w-6 h-6 text-amber-600" />, bgColor: "bg-[#FFFBEB]" },
  { id: 14, name: "Multi Finance", icon: <DollarSign className="w-6 h-6 text-emerald-600" />, bgColor: "bg-[#ECFDF5]" },
];

// --- Constants ---

const LEVELS = [
  { 
    name: "Bronze", 
    min: 0, 
    max: 999999, 
    color: "from-orange-400 to-orange-600", 
    icon: "🥉",
    benefits: ["Dapat 1 Poin (Tiap kelipatan Rp10.000)"]
  },
  { 
    name: "Silver", 
    min: 1000000, 
    max: 9999999, 
    color: "from-slate-300 to-slate-500", 
    icon: "🥈",
    benefits: [
      "Dapat 1 Poin (Tiap kelipatan Rp10.000)",
      "Voucher Tabungan Rp2.000 (Min. setor Rp20.000)"
    ]
  },
  { 
    name: "Gold", 
    min: 10000000, 
    max: 19999999, 
    color: "from-yellow-400 to-amber-600", 
    icon: "🥇",
    benefits: [
      "Dapat 1 Poin (Tiap kelipatan Rp10.000)",
      "Voucher Tabungan Rp5.000 (Min. setor Rp50.000)",
      "Voucher Investasi Rp.10.000 (Min. investasi Rp 500.000)"
    ]
  },
  { 
    name: "Platinum", 
    min: 20000000, 
    max: Infinity, 
    color: "from-blue-400 to-indigo-600", 
    icon: "💎",
    benefits: [
      "Dapat 1 Poin (Tiap kelipatan Rp10.000)",
      "Voucher Tabungan Rp10.000 (Min. setor Rp100.000)",
      "Voucher Investasi Rp.25.000 (Min. investasi Rp 1.000.000)",
      "Voucher Gratis admin senilai Rp 5.000"
    ]
  }
];

const calculateCustomerLevel = (transactions: SalesTransaction[], userName: string) => {
  if (!userName) return { ...LEVELS[0], total: 0 };
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const total = transactions
    .filter(t => t.Nama.toLowerCase() === userName.toLowerCase())
    .filter(t => parseDate(t.Tanggal) >= threeMonthsAgo)
    .reduce((acc, curr) => acc + (Number(curr.Pemasukan) || 0), 0);

  if (total >= 20000000) return { ...LEVELS[3], total };
  if (total >= 10000000) return { ...LEVELS[2], total };
  if (total >= 1000000) return { ...LEVELS[1], total };
  return { ...LEVELS[0], total };
};

// --- Components ---

const Header = ({ 
  customers, 
  loggedInUser, 
  onLogin, 
  onLogout,
  setActiveTab,
  isLoading,
  salesTransactions
}: { 
  customers: Customer[], 
  loggedInUser: Customer | null, 
  onLogin: (user: Customer) => void,
  onLogout: () => void,
  setActiveTab: (id: string) => void,
  isLoading: boolean,
  salesTransactions: SalesTransaction[]
}) => {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState<"USER" | "ADMIN">("USER");
  const [customerName, setCustomerName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const navigate = useNavigate();

  const ADMIN_ACCESS_CODE = "160910"; // In a real app, this would be hashed/encrypted

  const customerLevel = calculateCustomerLevel(salesTransactions, loggedInUser?.Nama || "");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    const trimmedInput = customerName.trim();
    if (trimmedInput.length > 0 && !showPinInput && activePortalTab === "USER") {
      const filtered = customers.filter(c => 
        c && c.Nama && 
        typeof c.Nama === 'string' && 
        c.Nama.toLowerCase().includes(trimmedInput.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [customerName, customers, showPinInput, activePortalTab]);

  const handleAdminSubmit = () => {
    if (adminCode === ADMIN_ACCESS_CODE) {
      setIsPortalOpen(false);
      setAdminCode("");
      navigate("/admin");
    } else {
      setError("Kode Akses Salah");
    }
  };

  const handleLoginAttempt = () => {
    const user = customers.find(c => 
      c && c.Nama && typeof c.Nama === 'string' && c.Nama.toLowerCase() === customerName.toLowerCase()
    );
    if (user) {
      if (user.PIN && user.PIN.trim() !== "") {
        setSelectedCustomer(user);
        setShowPinInput(true);
        setError("");
      } else {
        onLogin(user);
        setIsPortalOpen(false);
        setCustomerName("");
        setActiveTab("aset");
      }
    } else {
      setError("Nama tidak ditemukan");
    }
  };

  const handlePinSubmit = () => {
    if (selectedCustomer && selectedCustomer.PIN === pinInput) {
      onLogin(selectedCustomer);
      setIsPortalOpen(false);
      setCustomerName("");
      setPinInput("");
      setShowPinInput(false);
      setSelectedCustomer(null);
      setError("");
      setActiveTab("aset");
    } else {
      setError("PIN Salah");
    }
  };

  const handleSelectSuggestion = (user: Customer) => {
    setCustomerName(user.Nama);
    setSuggestions([]);
    
    if (user.PIN && user.PIN.trim() !== "") {
      setSelectedCustomer(user);
      setShowPinInput(true);
    } else {
      onLogin(user);
      setIsPortalOpen(false);
      setCustomerName("");
      setActiveTab("aset");
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100 transition-all duration-300">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tighter text-[#005E6A]">WARUNG</span>
            <span className="text-lg font-black tracking-tighter text-[#F15A24]">TOMI</span>
          </div>
          <span className="text-[8px] font-bold text-muted-foreground tracking-[0.2em] uppercase leading-none">Solusi Digital & Keuangan</span>
        </div>
        
        <motion.button
          layout
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPortalOpen(!isPortalOpen)}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-500 relative ${
            isPortalOpen 
              ? "bg-[#F15A24] text-white" 
              : "bg-white border border-slate-200 text-slate-700 hover:border-orange-200"
          }`}
        >
          <motion.div 
            layout
            className={`rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              isPortalOpen 
                ? "w-10 h-10 bg-transparent" 
                : "w-8 h-8 border-2 border-[#F15A24] bg-white"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isPortalOpen ? "close" : "user"}
                initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
              >
                {isPortalOpen ? (
                  <X className="w-5 h-5 text-white" strokeWidth={3} />
                ) : (
                  <User className="w-4 h-4 text-[#F15A24]" strokeWidth={3} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isPortalOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white"
          >
            <div className="px-6 py-6 border-t border-slate-50 bg-gradient-to-b from-slate-50/50 to-white">
              {/* Tabs */}
              {!loggedInUser && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                  <button
                    onClick={() => {
                      setActivePortalTab("USER");
                      setError("");
                    }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      activePortalTab === "USER" ? "bg-white text-[#005E6A] shadow-sm" : "text-slate-400"
                    }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => {
                      setActivePortalTab("ADMIN");
                      setError("");
                    }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      activePortalTab === "ADMIN" ? "bg-white text-[#F15A24] shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              )}

              {loggedInUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-[#005E6A] rounded-full flex items-center justify-center text-white font-black text-sm shadow-inner">
                      {loggedInUser.Nama?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest">{loggedInUser.Nama || "User"}</h3>
                      <button 
                        onClick={() => {
                          navigate("/level");
                          setIsPortalOpen(false);
                        }}
                        className="flex items-center gap-1 group"
                      >
                        <p className="text-[10px] text-[#F15A24] font-black uppercase tracking-widest group-hover:underline">{customerLevel.name}</p>
                        <ChevronRight className="w-2.5 h-2.5 text-[#F15A24] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      onLogout();
                      setIsPortalOpen(false);
                    }}
                    className="w-full bg-red-50 text-red-600 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    Keluar Akun
                  </button>
                </div>
              ) : activePortalTab === "USER" ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-[#F15A24] rounded-full" />
                      <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Portal Pelanggan</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium ml-3">
                      {isLoading ? "Sedang memuat data nasabah..." : (showPinInput ? `Verifikasi PIN Keamanan: ${selectedCustomer?.Nama}` : "Lihat aset dan semua riwayat transaksi")}
                    </p>
                  </div>
                  
                  {!showPinInput ? (
                    <div className="relative">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#F15A24] transition-colors pointer-events-none" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ketik Nama Anda..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold focus:outline-none focus:border-[#F15A24] focus:ring-2 focus:ring-orange-50 transition-all shadow-sm"
                        />
                      </div>
                      
                      {suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl z-[60] overflow-hidden divide-y divide-slate-50"
                        >
                          {suggestions.map((user, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectSuggestion(user)}
                              className="w-full text-left px-4 py-3 text-[10px] hover:bg-orange-50 transition-colors flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                                  <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F15A24]" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-[#005E6A]">{user.Nama}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#F15A24] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                            </button>
                          ))}
                        </motion.div>
                      )}

                      {error && !suggestions.length && (
                        <p className="mt-2 text-[10px] font-bold text-red-500 ml-3 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#F15A24]" />
                        <p className="text-[9px] font-bold text-[#F15A24] uppercase tracking-wider">Masukkan PIN 6 Digit</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={6}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder="••••••"
                          autoFocus
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#F15A24] focus:ring-2 focus:ring-orange-50 transition-all text-center tracking-[0.4em] font-black shadow-sm"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePinSubmit}
                          className="bg-[#005E6A] text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-100"
                        >
                          Verifikasi
                        </motion.button>
                      </div>
                      {error && (
                        <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>
                      )}
                      <button 
                        onClick={() => {
                          setShowPinInput(false);
                          setPinInput("");
                          setError("");
                        }}
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-[#F15A24] rounded-full" />
                      <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Akses Administrator</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium ml-3">
                      Masukkan kode akses khusus untuk masuk ke dashboard admin
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#F15A24] transition-colors pointer-events-none" />
                      <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Kode Akses Admin..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold focus:outline-none focus:border-[#F15A24] focus:ring-2 focus:ring-orange-50 transition-all shadow-sm"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAdminSubmit}
                      className="w-full bg-[#F15A24] text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100"
                    >
                      Masuk Dashboard Admin
                    </motion.button>
                    {error && (
                      <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const PROMO_SLIDES = [
  { id: 1, image: "https://lh3.googleusercontent.com/d/1mIuvZjLO0eroPRfJR5fw38mo1iIueuzq", title: "Promo 1" },
  { id: 2, image: "https://lh3.googleusercontent.com/d/1RwJbtl5zMaZjpB5EOI2nmXNqPmbQx6Ep", title: "Promo 2" },
  { id: 3, image: "https://lh3.googleusercontent.com/d/1BK2wG7qAlYgTJyX3yLk4BdGi-IEjkbpc", title: "Promo 3" },
  { id: 4, image: "https://lh3.googleusercontent.com/d/1q06qTXISxLvOMCQnTT4f3MATAmBo5is-", title: "Promo 4" },
  { id: 5, image: "https://lh3.googleusercontent.com/d/1GpNZ4yIov99m-EDWMUmfb3m9aISQBEe6", title: "Promo 5" },
];

const PromoSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
      setImageError(false);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
      setImageError(false);
    } else if (info.offset.x > swipeThreshold) {
      // Swiped right
      setCurrentSlide((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
      setImageError(false);
    }
  };

  return (
    <section className="px-6 py-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-black uppercase tracking-wider">Promo & Info</h2>
        <div className="flex gap-1">
          {PROMO_SLIDES.map((_, index) => (
            <motion.div
              key={index}
              animate={{ 
                width: currentSlide === index ? 16 : 4,
                backgroundColor: currentSlide === index ? "#F15A24" : "#E2E8F0"
              }}
              className="h-1 rounded-full cursor-pointer"
              onClick={() => {
                setCurrentSlide(index);
                setImageError(false);
              }}
            />
          ))}
        </div>
      </div>
      <div className="relative rounded-[2rem] overflow-hidden aspect-[16/9] shadow-sm border-2 border-white bg-slate-100 touch-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            {!imageError ? (
              <img
                src={PROMO_SLIDES[currentSlide].image}
                alt={PROMO_SLIDES[currentSlide].title}
                className="w-full h-full object-cover pointer-events-none"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400 p-8 text-center">
                <Bot className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                  Gambar tidak dapat dimuat.<br/>Pastikan file Drive dibagikan ke "Siapa saja yang memiliki link".
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

const MainServices = () => {
  const navigate = useNavigate();
  return (
    <section className="px-6 py-1">
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-black uppercase tracking-wider">Layanan Utama</h2>
          <div className="bg-[#E6F4F5] px-3 py-1 rounded-full flex items-center gap-1">
            <span className="text-[8px] font-extrabold text-[#005E6A] uppercase tracking-wider">Agen BNI</span>
            <span className="text-[8px] font-extrabold text-[#F15A24]">46</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-widest font-medium">Transaksi cepat & aman</p>
        
        <div className="grid grid-cols-4 gap-y-8 gap-x-2">
          {MAIN_SERVICES.map((service) => (
            <motion.button
              key={service.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (service.name === "QRIS") navigate("/qris");
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 ${service.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}>
                {service.icon}
              </div>
              <span className="text-[9px] font-bold text-slate-500 text-center leading-tight px-0.5">{service.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => {
  const navItems = [
    { id: "beranda", label: "Beranda", icon: Home },
    { id: "aset", label: "Aset", icon: Wallet },
    { id: "riwayat", label: "Riwayat", icon: History },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-50 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="relative flex flex-col items-center justify-center py-1 px-2 min-w-[70px] transition-colors duration-300"
          >
            {/* Floating Indicator Background */}
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute inset-0 bg-[#005E6A]/5 rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Icon with Micro-interaction */}
            <motion.div
              animate={{
                y: isActive ? -4 : 0,
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Icon 
                className={`w-5 h-5 transition-colors duration-300 ${
                  isActive ? "text-[#F15A24]" : "text-slate-400"
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </motion.div>

            {/* Label with Active State Animation */}
            <div className="mt-1 relative h-4 flex items-center justify-center">
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                isActive ? "text-[#005E6A] opacity-100 scale-100" : "text-slate-400 opacity-70 scale-95"
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute -bottom-1 w-1 h-1 bg-[#F15A24] rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

const ProtectedPage = ({ 
  user, 
  children, 
  title 
}: { 
  user: Customer | null, 
  children: React.ReactNode,
  title: string
}) => {
  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 py-12 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-lg font-black text-[#005E6A] uppercase tracking-wider mb-2">Akses Terbatas</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-[240px]">
          Silakan masuk melalui portal pelanggan di pojok kanan atas untuk melihat halaman <span className="font-black text-[#F15A24]">{title}</span>.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <ArrowUpRight className="w-4 h-4" />
          <span>Klik Ikon User di Atas</span>
        </div>
      </motion.div>
    );
  }
  return <>{children}</>;
};

const AssetPieChart = ({ data }: { data: any[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Komposisi</p>
        <p className="text-xs font-black text-[#005E6A]">{data.length} Kategori</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
            cornerRadius={10}
            animationBegin={0}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
                    <p className="text-xs font-black text-[#005E6A]">Rp {item.value.toLocaleString('id-ID')}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{percentage}% dari total</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const AsetPage = ({ user, transactions, investmentTransactions }: { user: Customer | null, transactions: SalesTransaction[], investmentTransactions: InvestmentTransaction[] }) => {
  const navigate = useNavigate();
  // Helper to parse currency string to number
  const parseCurrency = (val: string | undefined) => {
    if (!val) return 0;
    // Remove dots, commas, and any non-digit characters except for the first minus sign
    return parseInt(val.replace(/[^\d]/g, '')) || 0;
  };

  const tabunganBalance = parseCurrency(user?.Tabungan);
  
  // Calculate Investasi balance from investmentTransactions
  const userInvestments = investmentTransactions.filter(t => 
    t.Nama.toLowerCase() === user?.Nama?.toLowerCase() &&
    t.Status.toLowerCase() !== "sukses dicairkan"
  );
  const investasiBalance = userInvestments.reduce((acc, curr) => acc + curr.Nominal, 0);
  
  // Calculate Lainnya balance from "BELUM DIAMBIL" transactions
  const lainnyaTransactions = transactions.filter(t => 
    t.Nama.toLowerCase() === user?.Nama?.toLowerCase() && 
    t.Status.toUpperCase() === "BELUM DIAMBIL"
  );
  
  const lainnyaBalance = lainnyaTransactions.reduce((acc, curr) => {
    const net = curr.HargaModal - curr.Sebagian;
    return acc + (net > 0 ? net : 0);
  }, 0);

  const hutangBalance = parseCurrency(user?.Hutang);
  
  const totalAset = tabunganBalance + investasiBalance + lainnyaBalance - hutangBalance;

  const assetData = [
    { name: 'Tabungan', value: tabunganBalance, color: '#22c55e' },
    { name: 'Investasi', value: investasiBalance, color: '#6366f1' },
    { name: 'Lainnya', value: lainnyaBalance, color: '#14b8a6' },
    { name: 'Hutang', value: hutangBalance, color: '#ef4444' },
  ].filter(item => item.value !== 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  return (
    <ProtectedPage user={user} title="Aset">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4"
      >
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider">Total Aset</h2>
            <Badge className="bg-[#E6F4F5] text-[#005E6A] border-none text-[8px] font-black uppercase tracking-widest">
              Ringkasan Portofolio
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-bold text-slate-400">Rp</span>
            <span className="text-3xl font-black text-[#005E6A]">{formatCurrency(totalAset)}</span>
          </div>
          
          <AssetPieChart data={assetData} />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Saldo</h3>
          {[
            { 
              name: "Tabungan", 
              balance: user?.Tabungan || "0", 
              gradient: "from-green-500 to-emerald-600",
              icon: Wallet,
              clickable: true, 
              path: "/detail-tabungan" 
            },
            { 
              name: "Investasi", 
              balance: formatCurrency(investasiBalance), 
              gradient: "from-indigo-500 to-violet-600",
              icon: TrendingUp,
              clickable: true, 
              path: "/detail-investasi" 
            },
            { 
              name: "Lainnya", 
              balance: formatCurrency(lainnyaBalance), 
              gradient: "from-teal-500 to-cyan-600",
              icon: Layers,
              clickable: true, 
              path: "/detail-lainnya" 
            },
            { 
              name: "Hutang", 
              balance: user?.Hutang || "0", 
              gradient: "from-rose-500 to-red-600",
              icon: CreditCard,
              clickable: true, 
              path: "/detail-hutang" 
            },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.clickable && item.path && navigate(item.path)}
              className={`relative overflow-hidden bg-gradient-to-br ${item.gradient} p-5 rounded-[2rem] flex items-center justify-between shadow-lg shadow-slate-200/50 ${item.clickable ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
              {/* Decorative Circle */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1.5">{item.name}</p>
                  <p className="text-lg font-black text-white tracking-tight">Rp {item.balance}</p>
                </div>
              </div>
              
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center relative z-10">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const SavingsDetailPage = ({ user, transactions }: { user: Customer | null, transactions: SavingTransaction[] }) => {
  const navigate = useNavigate();
  
  const userTransactions = transactions
    .filter(t => t.Nama.toLowerCase() === user?.Nama?.toLowerCase())
    .reverse();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  return (
    <ProtectedPage user={user} title="Detail Tabungan">
      <div className="px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Saldo Tabungan</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold opacity-80">Rp</span>
              <h2 className="text-4xl font-black tracking-tight">{user?.Tabungan || "0"}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-green-600 uppercase tracking-widest">Riwayat Mutasi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tipe</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userTransactions.length > 0 ? (
                  userTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-600">{t.Tanggal}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`text-[8px] font-black uppercase tracking-widest border-none ${
                          t.Tipe === 'SETOR' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.Tipe}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className={`text-xs font-black ${
                          t.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.Tipe === 'SETOR' ? '+' : '-'}{formatCurrency(t.Nominal)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-black text-green-600">Rp {formatCurrency(t.SaldoAkhir)}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <History className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada transaksi</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

const DebtDetailPage = ({ user, transactions }: { user: Customer | null, transactions: DebtTransaction[] }) => {
  const navigate = useNavigate();
  
  const userTransactions = transactions
    .filter(t => t.Nama.toLowerCase() === user?.Nama?.toLowerCase())
    .reverse();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  return (
    <ProtectedPage user={user} title="Detail Hutang">
      <div className="px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <CreditCard className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Hutang</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold opacity-80">Rp</span>
              <h2 className="text-4xl font-black tracking-tight">{user?.Hutang || "0"}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Riwayat Hutang</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Jumlah</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userTransactions.length > 0 ? (
                  userTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600">{t.Tanggal}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[8px] font-black uppercase tracking-widest border-none ${
                          t.Tipe === 'TAMBAH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {t.Tipe}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-xs font-black ${
                          t.Tipe === 'TAMBAH' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {t.Tipe === 'TAMBAH' ? '+' : '-'}{formatCurrency(t.Jumlah)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] text-slate-500 line-clamp-1">{t.Keterangan}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <History className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada transaksi</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

const InvestasiPage = ({ user, transactions }: { user: Customer | null, transactions: InvestmentTransaction[] }) => {
  const navigate = useNavigate();
  
  const userTransactions = transactions.filter(t => 
    t.Nama.toLowerCase() === user?.Nama?.toLowerCase()
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const totalInvestasi = userTransactions
    .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => acc + curr.Nominal, 0);

  return (
    <ProtectedPage user={user} title="Investasi">
      <div className="px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Investasi Aktif</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold opacity-80">Rp</span>
              <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalInvestasi)}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Riwayat Investasi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Tenor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Jatuh Tempo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userTransactions.length > 0 ? (
                  userTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-600">{t.Tanggal}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-black text-slate-700">Rp {formatCurrency(t.Nominal)}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-600">{t.Tenor}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-600">{t.JatuhTempo}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Badge className={`text-[8px] font-black uppercase tracking-widest border-none ${
                          t.Status.toUpperCase() === 'AKTIF' 
                            ? 'bg-green-50 text-green-600' 
                            : t.Status.toLowerCase() === 'sukses dicairkan'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-slate-50 text-slate-400'
                        }`}>
                          {t.Status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <History className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada investasi</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

const LainnyaPage = ({ user, transactions }: { user: Customer | null, transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  
  const userTransactions = transactions.filter(t => 
    t.Nama.toLowerCase() === user?.Nama?.toLowerCase() && 
    t.Status.toUpperCase() === "BELUM DIAMBIL"
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const totalBelumDiambil = userTransactions.reduce((acc, curr) => {
    const net = curr.HargaModal - curr.Sebagian;
    return acc + (net > 0 ? net : 0);
  }, 0);

  const getWaktuLabel = (dateStr: string) => {
    const tDate = parseDate(dateStr);
    if (tDate.getTime() === 0) return "-";
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDate = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
    
    const diffTime = today.getTime() - txDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 30) return `${diffDays} hari lalu`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} bulan lalu`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} tahun lalu`;
  };

  return (
    <ProtectedPage user={user} title="Lainnya">
      <div className="px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <Layers className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Lainnya Belum Diambil</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold opacity-80">Rp</span>
              <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalBelumDiambil)}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-teal-600 uppercase tracking-widest">Daftar Belum Diambil</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Waktu</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Potongan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Terima Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userTransactions.length > 0 ? (
                  userTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-600">{getWaktuLabel(t.Tanggal)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-[#005E6A]">{t.Jenis}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Melalui {t.Melalui}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-black text-slate-700">Rp {formatCurrency(t.Pemasukan)}</p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-[10px] font-bold text-red-500">Admin: {formatCurrency(t.Pemasukan - t.HargaModal)}</p>
                        {t.Sebagian > 0 && (
                          <p className="text-[8px] font-medium text-orange-500 mt-0.5">Sudah Diambil {formatCurrency(t.Sebagian)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-black text-green-600">Rp {formatCurrency(t.HargaModal - t.Sebagian)}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <History className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Semua data sudah diambil</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

const AdminReportPage = ({ transactions }: { transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for matching
  const formattedFilterDate = filterDate.split('-').reverse().join('/');

  // Filter transactions for selected date
  const filteredTransactions = transactions.filter(t => t.Tanggal.startsWith(formattedFilterDate));

  const totalPemasukan = filteredTransactions.reduce((acc, curr) => acc + curr.Pemasukan, 0);
  const totalModal = filteredTransactions.reduce((acc, curr) => acc + curr.HargaModal, 0);
  const totalKeuntungan = totalPemasukan - totalModal;
  const totalTransaksi = filteredTransactions.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-white/70 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Laporan Transaksi</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Data Penjualan Harian</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Penjualan</p>
            <h3 className="text-[10px] font-black text-[#005E6A]">Rp {totalPemasukan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Keuntungan</p>
            <h3 className="text-[10px] font-black text-green-600">Rp {totalKeuntungan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaksi</p>
            <h3 className="text-[10px] font-black text-[#F15A24]">{totalTransaksi}</h3>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pilih Tanggal:</span>
          </div>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-[#005E6A] focus:outline-none focus:border-[#F15A24] appearance-none"
          />
        </div>

        {/* Transaction List Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Daftar Transaksi</h3>
            <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
              {filteredTransactions.length} Data
            </Badge>
          </div>

          <div className="grid gap-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, i) => {
                const service = MAIN_SERVICES.find(s => 
                  s.name.toLowerCase() === t.Jenis.toLowerCase() || 
                  (t.Jenis.toLowerCase() === 'qris' && s.name.toLowerCase() === 'qris')
                );
                const statusLower = t.Status.toLowerCase();
                let ribbonColor = 'bg-slate-500';
                if (statusLower.includes('selesai') || statusLower.includes('sukses')) ribbonColor = 'bg-green-500';
                else if (statusLower.includes('kasbon')) ribbonColor = 'bg-red-500';
                else if (statusLower.includes('proses')) ribbonColor = 'bg-yellow-500';
                else if (statusLower.includes('belum') || statusLower.includes('ambil')) ribbonColor = 'bg-blue-500';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative"
                  >
                    <div className="p-3 pb-7 flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${service?.bgColor || 'bg-slate-50'}`}>
                          {service ? React.cloneElement(service.icon as React.ReactElement, { className: "w-4 h-4" }) : <ShoppingBag className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-tight">{t.Nama}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold text-slate-700 uppercase">{t.Jenis}</span>
                            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">• {t.Melalui}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-[#005E6A]">Rp {t.Pemasukan.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    
                    {/* Ribbon at bottom right with uniform width */}
                    <div className={`absolute bottom-0 right-0 w-28 py-1 rounded-tl-xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm text-center ${ribbonColor}`}>
                      {t.Status}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <FileText className="w-8 h-8" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada transaksi</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ transactions, user }: { transactions: SalesTransaction[], user: Customer | null }) => {
  const navigate = useNavigate();
  
  // Filter transactions for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlySales = transactions.filter(t => {
    const date = parseDate(t.Tanggal);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Group by date
  const salesByDate = monthlySales.reduce((acc: any, curr) => {
    const dateStr = curr.Tanggal.split(' ')[0]; // Assuming "DD/MM/YYYY" or similar
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr] += curr.Pemasukan;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    total: salesByDate[date]
  })).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  const totalPemasukan = monthlySales.reduce((acc, curr) => acc + curr.Pemasukan, 0);
  const totalTransaksi = monthlySales.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/70 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Beranda</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Dashboard Admin</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Laporan Penjualan Bulan Ini</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Penjualan</p>
            <h3 className="text-lg font-black text-[#005E6A]">Rp {totalPemasukan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transaksi</p>
            <h3 className="text-lg font-black text-[#F15A24]">{totalTransaksi} <span className="text-[10px] font-bold text-slate-400">Order</span></h3>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Grafik Harian</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Penjualan per Tanggal</p>
            </div>
            <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#F15A24]" />
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              < BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.split('/')[0]} // Just show day
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `Rp ${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Penjualan']}
                />
                <Bar 
                  dataKey="total" 
                  fill="#F15A24" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Transaksi Terakhir</h3>
            <button 
              onClick={() => navigate("/admin/report")}
              className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#F15A24] hover:bg-orange-50 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {monthlySales.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{t.Nama}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.Jenis} • {t.Tanggal}</p>
                  </div>
                </div>
                <p className="text-[10px] font-black text-[#005E6A]">Rp {t.Pemasukan.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LevelPage = ({ user, transactions }: { user: Customer | null, transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentLevelInfo = calculateCustomerLevel(transactions, user?.Nama || "");
  const currentLevelIndex = LEVELS.findIndex(l => l.name === currentLevelInfo.name);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 260 - 100; 
      const scrollAmount = currentLevelIndex * cardWidth;
      
      const containerWidth = container.offsetWidth;
      const centerOffset = (containerWidth - 260) / 2;
      
      container.scrollTo({
        left: scrollAmount - centerOffset + 40,
        behavior: 'smooth'
      });
      setActiveIndex(currentLevelIndex);
    }
  }, [currentLevelIndex]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 260 - 100;
      const containerWidth = container.offsetWidth;
      const centerOffset = (containerWidth - 260) / 2;
      const index = Math.round((scrollLeft + centerOffset - 40) / cardWidth);
      if (index >= 0 && index < LEVELS.length) {
        setActiveIndex(index);
      }
    }
  };

  return (
    <ProtectedPage user={user} title="Level Pelanggan">
      <div className="min-h-screen bg-slate-50 pb-24 overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#005E6A] leading-tight">Level Pelanggan</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">Tingkatkan transaksi Anda untuk level lebih tinggi</p>
          </div>

          {/* New Carousel Card Above Level Cards */}
          <div className="mb-8">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border-2 border-white overflow-hidden">
              <div className="relative aspect-[16/9] rounded-[1.8rem] overflow-hidden mb-4">
                <PromoSection />
              </div>
              <div className="px-4 pb-2">
                <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Keuntungan Eksklusif</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Nikmati berbagai penawaran menarik sesuai level Anda</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Container with Progressive Stack Effect */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative overflow-x-auto flex px-[30%] pb-12 snap-x snap-mandatory no-scrollbar items-center py-12" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          {LEVELS.map((level, i) => {
            const isLocked = i > currentLevelIndex;
            const isCompleted = i < currentLevelIndex;
            const distance = Math.abs(i - activeIndex);
            const zIndex = 50 - distance;
            
            return (
              <motion.div 
                key={i}
                initial={{ scale: 0.6, opacity: 1 }}
                whileInView={{ 
                  scale: 1, 
                  opacity: 1,
                  transition: { type: "spring", stiffness: 300, damping: 25 }
                }}
                viewport={{ once: false, amount: 0.8 }}
                className={`flex-shrink-0 w-[260px] -mx-[50px] snap-center bg-gradient-to-br ${level.color} rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[460px] transition-all duration-500`}
                style={{
                  zIndex: zIndex,
                }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 h-full flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner">
                      {isLocked ? <Lock className="w-6 h-6 text-white/60" /> : level.icon}
                    </div>
                    {level.name === currentLevelInfo.name && (
                      <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                        Level Anda
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge className="bg-black/20 text-white/60 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                        Terkunci
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                        Tercapai
                      </Badge>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-black mb-1 tracking-tight">{level.name}</h3>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                      {level.max === Infinity ? `Min Rp ${formatCurrency(level.min)}` : `Rp ${formatCurrency(level.min)} - ${formatCurrency(level.max)}`}
                    </p>
                  </div>

                  {/* Integrated Transaction Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-5 border border-white/10 mb-6 shadow-inner">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Total Transaksi</p>
                        <h4 className="text-sm font-black">Rp {formatCurrency(currentLevelInfo.total)}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Target</p>
                        <p className="text-[10px] font-bold">Rp {formatCurrency(level.min)}</p>
                      </div>
                    </div>

                    {/* Progress Bar for this specific level */}
                    <div className="space-y-2">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: isCompleted ? "100%" : 
                                   isLocked ? `${Math.min(100, Math.max(0, (currentLevelInfo.total / level.min) * 100))}%` :
                                   `${Math.min(100, Math.max(0, (currentLevelInfo.total / (LEVELS[i+1]?.min || level.min)) * 100))}%`
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full rounded-full bg-white shadow-sm`}
                        />
                      </div>
                      <p className="text-[8px] font-bold text-white/60 text-center italic">
                        {isCompleted ? "Level telah terlampaui" : 
                         isLocked ? `Butuh Rp ${formatCurrency(level.min - currentLevelInfo.total)} lagi` :
                         i < LEVELS.length - 1 ? `Butuh Rp ${formatCurrency(LEVELS[i+1].min - currentLevelInfo.total)} lagi ke ${LEVELS[i+1].name}` : 
                         "Anda berada di level tertinggi"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Keuntungan:</p>
                    <ul className="space-y-2.5">
                      {level.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[11px] font-bold">
                          <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5" />
                          </div>
                          <span className={isLocked ? "opacity-50" : ""}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ProtectedPage>
  );
};

const RiwayatPage = ({ user, transactions }: { user: Customer | null, transactions: SalesTransaction[] }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userTransactions = transactions
    .filter(t => t.Nama.toLowerCase() === user?.Nama?.toLowerCase())
    .filter(t => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.Jenis.toLowerCase().includes(query) ||
        t.Tanggal.toLowerCase().includes(query) ||
        t.Status.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  // Process data for the chart (last 3 months) - Fixed logic
  const chartData = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const last3Months: { month: number, year: number, label: string, total: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      last3Months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('id-ID', { month: 'short' }),
        total: 0
      });
    }

    const allUserTransactions = transactions.filter(t => 
      t.Nama.toLowerCase() === user?.Nama?.toLowerCase()
    );
    
    allUserTransactions.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate.getTime() === 0) return;

      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      const bucket = last3Months.find(m => m.month === tMonth && m.year === tYear);
      if (bucket) {
        bucket.total += t.Pemasukan;
      }
    });

    return last3Months.map(m => ({ name: m.label, total: m.total }));
  }, [transactions, user]);

  const totalThreeMonths = chartData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <ProtectedPage user={user} title="Riwayat">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-black uppercase tracking-wider">Riwayat Belanja</h2>
        </div>

        {/* Transaction Chart Section - Redesigned */}
        <div className="bg-[#005E6A] rounded-[2.5rem] p-6 shadow-xl border border-[#005E6A]/10 mb-8 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Belanja (3 Bln Terakhir)</p>
              <h3 className="text-2xl font-black text-white">Rp {formatCurrency(totalThreeMonths)}</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <History className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="h-40 w-full mb-8 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F15A24" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#F15A24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900 }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(241, 90, 36, 0.2)', strokeWidth: 2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl text-[10px] font-black">
                          <p className="text-white/60 uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-[#F15A24] text-sm">Rp {formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#F15A24" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 relative z-10">
            {chartData.map((item, i) => (
              <div key={i} className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{item.name}</p>
                <p className="text-[11px] font-black text-white">Rp {formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 relative overflow-hidden h-12">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.h3 
                key="title"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Daftar Transaksi
              </motion.h3>
            ) : (
              <motion.div 
                key="search-input"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "calc(100% - 48px)", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-1 mr-2"
              >
                <input 
                  autoFocus
                  type="text"
                  placeholder="Cari jenis, tanggal, status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-slate-100 rounded-full px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005E6A]/20"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            className={`p-2 rounded-full transition-all duration-300 ${isSearchOpen ? 'bg-[#005E6A] text-white rotate-90 scale-110 shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-4">
          {userTransactions.length > 0 ? (
            userTransactions.map((item, i) => {
              // Find matching service for icon and color
              let service = MAIN_SERVICES.find(s => 
                item.Jenis.toLowerCase().includes(s.name.toLowerCase()) || 
                s.name.toLowerCase().includes(item.Jenis.toLowerCase())
              );

              // Special case for E-Wallet topups
              const isEWalletTopup = ["dana", "ovo", "gopay", "shopeepay"].some(wallet => 
                item.Jenis.toLowerCase().includes(wallet.toLowerCase())
              );

              if (isEWalletTopup) {
                service = MAIN_SERVICES.find(s => s.name === "E-Walet");
              }
              
              const IconComponent = service ? (service.icon as any).type : ShoppingBag;
              const iconColorClass = service ? (service.icon as any).props.className.split(' ').find((c: string) => c.startsWith('text-')) : 'text-blue-600';
              const bgColorClass = service ? service.bgColor : 'bg-blue-50';

              const getStatusColor = (status: string) => {
                const s = status.toLowerCase();
                if (s.includes('selesai') || s.includes('lunas')) return 'bg-green-500';
                if (s.includes('kasbon')) return 'bg-red-500';
                if (s.includes('proses')) return 'bg-yellow-500';
                if (s.includes('belum diambil')) return 'bg-blue-500';
                return 'bg-slate-400';
              };

              return (
                <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass}`}>
                      <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.Jenis}</p>
                      <p className="text-[10px] text-slate-400">{item.Tanggal}</p>
                    </div>
                  </div>
                  <div className="text-right pr-2">
                    <p className="text-xs font-black text-green-600">Rp {formatCurrency(item.Pemasukan)}</p>
                  </div>
                  
                  {/* Horizontal Ribbon Status - Fixed Width */}
                  <div className={`absolute bottom-0 right-0 w-24 py-1 rounded-tl-2xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm flex justify-center items-center ${getStatusColor(item.Status)}`}>
                    {item.Status}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <History className="w-12 h-12 mb-2" />
              <p className="text-xs font-black uppercase tracking-widest">Belum ada riwayat belanja</p>
            </div>
          )}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const SettingsPage = ({ user, onLogout }: { user: Customer | null, onLogout: () => void }) => (
  <ProtectedPage user={user} title="Pengaturan">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-4"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-[#005E6A] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md text-white font-black text-2xl">
          {user?.Nama?.charAt(0) || "U"}
        </div>
        <h2 className="text-lg font-bold text-slate-800">{user?.Nama || "User"}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user?.ID || "N/A"}</p>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
        {[
          { icon: User, label: "Profil Saya", color: "text-blue-500" },
          { icon: ShieldCheck, label: "Keamanan", color: "text-green-500" },
          { icon: Bell, label: "Notifikasi", color: "text-orange-500" },
          { icon: Globe, label: "Bahasa", color: "text-purple-500" },
          { icon: Bot, label: "Bantuan AI", color: "text-[#005E6A]" },
        ].map((item, i) => (
          <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-xs font-bold text-slate-700">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        ))}
      </div>

      <button 
        onClick={onLogout}
        className="w-full mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest"
      >
        Keluar Akun
      </button>
    </motion.div>
  </ProtectedPage>
);

const QRISPage = () => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const qrisUrl = "https://lh3.googleusercontent.com/d/1P7Itn82Za-1G1a_4wpEa5BmarzCPvtn_";

  const handleDownload = async () => {
    try {
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QRIS_WARUNG_TOMI.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if fetch fails (e.g. CORS)
      window.open(qrisUrl, '_blank');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
      <div className="bg-[#005E6A] p-6 text-white flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold uppercase tracking-wider">QRIS Pembayaran</h1>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <QrCode className="w-6 h-6 text-[#005E6A]" />
            <span className="text-xl font-black text-[#005E6A]">QRIS</span>
          </div>
          
          <div 
            className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-100 mb-6 flex items-center justify-center cursor-pointer"
            onClick={() => setIsFullScreen(true)}
          >
            <img 
              src={qrisUrl} 
              alt="QRIS Warung Tomi" 
              className="w-full h-full object-contain p-4"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#005E6A] uppercase tracking-tight">WARUNG TOMI</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NMID: ID102030405060</p>
          </div>

          <button 
            className="w-full bg-[#F15A24] text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-200 active:scale-95 transition-transform"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Download QRIS</span>
          </button>
        </div>

        <div className="mt-10 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-[#005E6A]" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Cara Pembayaran</h3>
          </div>
          
          <div className="space-y-4">
            {[
              "Buka aplikasi e-wallet atau mobile banking Anda.",
              "Pilih menu 'Scan' atau 'Bayar'.",
              "Arahkan kamera ke kode QR di atas.",
              "Masukkan nominal pembayaran yang sesuai.",
              "Konfirmasi pembayaran dan masukkan PIN Anda.",
              "Transaksi selesai! Simpan bukti pembayaran Anda."
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-[#E6F4F5] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-[#005E6A]">{i + 1}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={qrisUrl}
              alt="QRIS Full Screen"
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Layout = ({ 
  children, 
  activeTab, 
  setActiveTab,
  customers,
  loggedInUser,
  onLogin,
  onLogout,
  isLoading,
  salesTransactions
}: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  customers: Customer[],
  loggedInUser: Customer | null,
  onLogin: (user: Customer) => void,
  onLogout: () => void,
  isLoading: boolean,
  salesTransactions: SalesTransaction[]
}) => (
  <div className="min-h-screen bg-slate-50 selection:bg-primary/30 selection:text-primary-foreground font-sans pb-24">
    <Header 
      customers={customers} 
      loggedInUser={loggedInUser} 
      onLogin={onLogin} 
      onLogout={onLogout} 
      setActiveTab={setActiveTab}
      isLoading={isLoading}
      salesTransactions={salesTransactions}
    />
    <main className="container mx-auto max-w-lg">
      {children}
    </main>
    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
);

const HomePage = ({ 
  activeTab, 
  setActiveTab,
  loggedInUser,
  onLogout,
  salesTransactions,
  investmentTransactions,
  customers,
  onLogin
}: { 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  loggedInUser: Customer | null,
  onLogout: () => void,
  salesTransactions: SalesTransaction[],
  investmentTransactions: InvestmentTransaction[],
  customers: Customer[],
  onLogin: (user: Customer) => void
}) => {
  const { customerName, subPage } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (customerName && customers.length > 0 && !loggedInUser) {
      const user = customers.find(c => c.Nama.toLowerCase() === customerName.toLowerCase());
      if (user) {
        onLogin(user);
        
        if (subPage === 'tabungan') {
          navigate('/detail-tabungan', { replace: true });
        } else if (subPage === 'hutang') {
          navigate('/detail-hutang', { replace: true });
        } else if (subPage === 'lainnya') {
          navigate('/detail-lainnya', { replace: true });
        } else if (subPage === 'investasi') {
          navigate('/detail-investasi', { replace: true });
        } else {
          setActiveTab("aset");
        }
      }
    }
  }, [customerName, subPage, customers, loggedInUser, onLogin, setActiveTab, navigate]);

  return (
    <AnimatePresence mode="wait">
      {activeTab === "beranda" && (
        <motion.div
          key="beranda"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PromoSection />
          <MainServices />
        </motion.div>
      )}
      {activeTab === "aset" && <AsetPage user={loggedInUser} transactions={salesTransactions} investmentTransactions={investmentTransactions} />}
      {activeTab === "riwayat" && <RiwayatPage user={loggedInUser} transactions={salesTransactions} />}
      {activeTab === "settings" && <SettingsPage user={loggedInUser} onLogout={onLogout} />}
    </AnimatePresence>
  );
};

const LoadingPopup = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-[1.5rem] p-5 w-full max-w-[160px] flex flex-col items-center shadow-2xl"
    >
      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
        <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
      </div>
      <h3 className="text-[7px] font-black text-orange-600 uppercase tracking-[0.2em] mb-0.5 text-center">Mohon Tunggu</h3>
      <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Memuat data...</p>
      
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
        />
      </div>
    </motion.div>
  </motion.div>
);

const InstallPrompt = ({ onInstall, onDismiss }: { onInstall: () => void, onDismiss: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 100 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 100 }}
    className="fixed bottom-6 left-6 right-6 z-[90] flex items-center justify-center"
  >
    <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
          <img 
            src="https://lh3.googleusercontent.com/d/1VTlCXt_WlEUiF0s7fVHUM3JtjO3q4cqk" 
            alt="Warung Tomi Icon" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-black text-[#005E6A] uppercase tracking-wider mb-0.5">Instal Warung Tomi</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Akses lebih cepat & mudah langsung dari layar utama Anda</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onDismiss}
          className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform border border-slate-100"
        >
          Nanti
        </button>
        <button 
          onClick={onInstall}
          className="flex-[2] bg-[#F15A24] text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-transform"
        >
          Instal Sekarang
        </button>
      </div>
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState("beranda");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingTransaction[]>([]);
  const [debtTransactions, setDebtTransactions] = useState<DebtTransaction[]>([]);
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isDismissed = localStorage.getItem('install_prompt_dismissed');

    if (!isStandalone && !isDismissed) {
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !isDismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    } else {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      alert("Untuk menginstal: Ketuk ikon 'Bagikan' (Share) di browser Anda, lalu pilih 'Tambah ke Layar Utama' (Add to Home Screen).");
      setShowInstallPrompt(false);
      localStorage.setItem('install_prompt_dismissed', 'true');
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install_prompt_dismissed', 'true');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("warung_tomi_user");
    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }

    const fetchData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const customerUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS89JF6HJLZL4wD5YRvaEqqY2nF_VvKmzfKHzrP19PYZnGFudVzpzD94WWC0ueb35rJFCEs7OtEX083/pub?gid=0&single=true&output=csv";
        const savingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwjRmZLCREHIEg4LlJwM_AT7WDpG808cxzY5C5IvKIsK920oQbiSPSSegEvyTD330DvVH0kswepwIE/pub?gid=1607784622&single=true&output=csv";
        const investasiUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBQ5kUdqwv5bBsJcaiponYzqU_JxO0g7qQb6DQ1ujJ9bzTkY5GlI5XQQXL9BVr22gdmM7V7eEIDMH9/pub?gid=799157484&single=true&output=csv";
        const hutangUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQstrKWGJQeYcF3s_GNBSzB4q-PhQ7R4s4Gc-xy5F428uRbVjdf8c4bboL7JfIX5j1a0n-_FJGvPk7Q/pub?gid=2112924939&single=true&output=csv";
        const salesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCGVNALfAsaaLVyQx0halDo9U3Gk_QFEEEY96Zai9cTD4nfW5dQR8IWYig1-Cks01F08PjVVv-KDsW/pub?gid=526494903&single=true&output=csv";
        
        const cacheBuster = `&cb=${Date.now()}`;
        
        const [customerRes, savingsRes, investasiRes, hutangRes, salesRes] = await Promise.all([
          fetch(customerUrl + cacheBuster),
          fetch(savingsUrl + cacheBuster),
          fetch(investasiUrl + cacheBuster),
          fetch(hutangUrl + cacheBuster),
          fetch(salesUrl + cacheBuster)
        ]);

        const customerCsv = customerRes.ok ? await customerRes.text() : "";
        const savingsCsv = savingsRes.ok ? await savingsRes.text() : "";
        const investasiCsv = investasiRes.ok ? await investasiRes.text() : "";
        const hutangCsv = hutangRes.ok ? await hutangRes.text() : "";
        const salesCsv = salesRes.ok ? await salesRes.text() : "";

        const parseCsv = (csv: string): Promise<any[]> => new Promise((resolve) => {
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: () => resolve([])
          });
        });

        const [savingsData, investasiData, hutangData, salesData] = await Promise.all([
          parseCsv(savingsCsv),
          parseCsv(investasiCsv),
          parseCsv(hutangCsv),
          parseCsv(salesCsv)
        ]);

        Papa.parse(customerCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const firstRow = results.data[0] as any;
              const namaKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'nama');
              const pinKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'pin');
              const saldoKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'saldo');
              const idKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'id');

              if (namaKey) {
                const allSavingsTransactions: SavingTransaction[] = [];
                const allDebtTransactions: DebtTransaction[] = [];
                const allSalesTransactions: SalesTransaction[] = [];
                const allInvestmentTransactions: InvestmentTransaction[] = [];
                const validCustomers = results.data
                  .filter((c: any) => c && c[namaKey])
                  .map((c: any) => {
                    const name = String(c[namaKey]).trim();
                    
                    // Calculate savings balance from transactions (SETOR - TARIK)
                    // User requested calculation from bottom to top
                    const userTransactions = savingsData.filter(s => {
                      const sNamaKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('nama'));
                      return sNamaKey && String(s[sNamaKey]).trim().toLowerCase() === name.toLowerCase();
                    });

                    // Reverse the array to calculate from the bottom of the spreadsheet upwards
                    const chronologicalTransactions = [...userTransactions].reverse();

                    let runningBalance = 0;
                    const transactions: SavingTransaction[] = [];

                    chronologicalTransactions.forEach(t => {
                      const tipeKey = Object.keys(t).find(k => k.toLowerCase().trim().includes('tipe') || k.toLowerCase().trim().includes('type'));
                      const nominalKey = Object.keys(t).find(k => k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('tabungan') || k.toLowerCase().trim().includes('jumlah') || k.toLowerCase().trim().includes('setor') || k.toLowerCase().trim().includes('tarik'));
                      const tanggalKey = Object.keys(t).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                      
                      if (tipeKey && nominalKey) {
                        const tipe = String(t[tipeKey]).trim().toUpperCase();
                        const nominalStr = String(t[nominalKey]).replace(/[^\d]/g, '');
                        const nominal = parseInt(nominalStr) || 0;
                        const tanggal = tanggalKey ? String(t[tanggalKey]).trim() : "-";

                        if (tipe === 'SETOR') {
                          runningBalance += nominal;
                        } else if (tipe === 'TARIK') {
                          runningBalance -= nominal;
                        }

                        transactions.push({
                          Tanggal: tanggal,
                          Nama: name,
                          Tipe: tipe,
                          Nominal: nominal,
                          SaldoAkhir: runningBalance
                        });
                      }
                    });

                    allSavingsTransactions.push(...transactions);

                    // Calculate Investasi
                    const userInvestasi = investasiData.filter(i => {
                      const iNamaKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('nama'));
                      return iNamaKey && String(i[iNamaKey]).trim().toLowerCase() === name.toLowerCase();
                    });
                    
                    const iTransactions: InvestmentTransaction[] = userInvestasi.map(i => {
                      const tanggalKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                      const nominalKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('diterima') || k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('jumlah'));
                      const tenorKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('tenor'));
                      const jatuhTempoKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('jatuh tempo'));
                      const statusKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('status'));
                      
                      const nominalStr = nominalKey ? String(i[nominalKey]).replace(/[^\d]/g, '') : "0";
                      const nominal = parseInt(nominalStr) || 0;
                      
                      return {
                        Tanggal: tanggalKey ? String(i[tanggalKey]).trim() : "-",
                        Nama: name,
                        Nominal: nominal,
                        Tenor: tenorKey ? String(i[tenorKey]).trim() : "-",
                        JatuhTempo: jatuhTempoKey ? String(i[jatuhTempoKey]).trim() : "-",
                        Status: statusKey ? String(i[statusKey]).trim() : "Aktif"
                      };
                    });
                    
                    allInvestmentTransactions.push(...iTransactions);
                    
                    let totalInvestasi = iTransactions
                      .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
                      .reduce((acc, curr) => acc + curr.Nominal, 0);

                    // Calculate Hutang
                    const userHutangData = hutangData.filter(h => {
                      const hNamaKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('nama'));
                      return hNamaKey && String(h[hNamaKey]).trim().toLowerCase() === name.toLowerCase();
                    });

                    // Reverse for chronological calculation (bottom to top)
                    const chronologicalHutang = [...userHutangData].reverse();
                    let runningHutang = 0;
                    const dTransactions: DebtTransaction[] = [];

                    chronologicalHutang.forEach(h => {
                      const tipeKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('tipe') || k.toLowerCase().trim().includes('type'));
                      const nominalKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('jumlah') || k.toLowerCase().trim().includes('hutang') || k.toLowerCase().trim().includes('total') || k.toLowerCase().trim().includes('diterima'));
                      const tanggalKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                      const keteranganKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('keterangan') || k.toLowerCase().trim().includes('ket') || k.toLowerCase().trim().includes('note'));

                      if (tipeKey && nominalKey) {
                        const tipe = String(h[tipeKey]).trim().toUpperCase();
                        const nominalStr = String(h[nominalKey]).replace(/[^\d]/g, '');
                        const nominal = parseInt(nominalStr) || 0;
                        const tanggal = tanggalKey ? String(h[tanggalKey]).trim() : "-";
                        const keterangan = keteranganKey ? String(h[keteranganKey]).trim() : "-";

                        if (tipe === 'TAMBAH') {
                          runningHutang += nominal;
                        } else if (tipe === 'BAYAR') {
                          runningHutang -= nominal;
                        }

                        dTransactions.push({
                          Tanggal: tanggal,
                          Nama: name,
                          Tipe: tipe,
                          Jumlah: nominal,
                          Keterangan: keterangan,
                          SaldoAkhir: runningHutang
                        });
                      }
                    });

                    allDebtTransactions.push(...dTransactions);

                    // Calculate Sales (Belanja)
                    const userSalesData = salesData.filter(s => {
                      const sNamaKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('nama'));
                      return sNamaKey && String(s[sNamaKey]).trim().toLowerCase() === name.toLowerCase();
                    });

                    const sTransactions: SalesTransaction[] = userSalesData.map(s => {
                      const jenisKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('jenis'));
                      const tanggalKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                      const pemasukanKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('harga jual') || k.toLowerCase().trim().includes('pemasukan') || k.toLowerCase().trim().includes('jumlah') || k.toLowerCase().trim().includes('nominal'));
                      const statusKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('status'));
                      const melaluiKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('melalui'));
                      const modalKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('harga modal') || k.toLowerCase().trim().includes('modal'));
                      const sebagianKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('sebagian'));

                      const nominalStr = pemasukanKey ? String(s[pemasukanKey]).replace(/[^\d]/g, '') : "0";
                      const nominal = parseInt(nominalStr) || 0;
                      
                      const modalStr = modalKey ? String(s[modalKey]).replace(/[^\d]/g, '') : "0";
                      const modal = parseInt(modalStr) || 0;

                      const sebagianStr = sebagianKey ? String(s[sebagianKey]).replace(/[^\d]/g, '') : "0";
                      const sebagian = parseInt(sebagianStr) || 0;

                      return {
                        Tanggal: tanggalKey ? String(s[tanggalKey]).trim() : "-",
                        Nama: name,
                        Jenis: jenisKey ? String(s[jenisKey]).trim() : "Belanja",
                        Pemasukan: Math.abs(Math.round(nominal)),
                        Status: statusKey ? String(s[statusKey]).trim() : "Selesai",
                        Melalui: melaluiKey ? String(s[melaluiKey]).trim() : "-",
                        HargaModal: Math.abs(Math.round(modal)),
                        Sebagian: Math.abs(Math.round(sebagian))
                      };
                    });

                    allSalesTransactions.push(...sTransactions);

                    return {
                      ...c,
                      Nama: name,
                      PIN: pinKey ? String(c[pinKey]).trim() : "",
                      Saldo: saldoKey ? String(c[saldoKey]).trim() : "0",
                      ID: idKey ? String(c[idKey]).trim() : "",
                      Tabungan: runningBalance.toLocaleString('id-ID'),
                      Investasi: totalInvestasi.toLocaleString('id-ID'),
                      Hutang: runningHutang.toLocaleString('id-ID')
                    };
                  });
                setCustomers(validCustomers);
                setSavingsTransactions(allSavingsTransactions);
                setDebtTransactions(allDebtTransactions);
                setSalesTransactions(allSalesTransactions);
                setInvestmentTransactions(allInvestmentTransactions);
                
                // Update logged in user using functional update to avoid closure issues
                setLoggedInUser(prev => {
                  if (!prev) return null;
                  const updated = validCustomers.find(vc => vc.Nama.toLowerCase() === prev.Nama.toLowerCase());
                  if (updated) {
                    localStorage.setItem("warung_tomi_user", JSON.stringify(updated));
                    return updated;
                  }
                  return prev;
                });
              }
            }
            setIsLoading(false);
          },
          error: (error) => {
            console.error("PapaParse error:", error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(() => fetchData(false), 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: Customer) => {
    setLoggedInUser(user);
    localStorage.setItem("warung_tomi_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem("warung_tomi_user");
  };

  return (
    <BrowserRouter>
      <AnimatePresence>
        {isLoading && <LoadingPopup />}
      </AnimatePresence>
      <AnimatePresence>
        {showInstallPrompt && (
          <InstallPrompt 
            onInstall={handleInstallClick} 
            onDismiss={handleDismissInstall} 
          />
        )}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            customers={customers}
            loggedInUser={loggedInUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoading={isLoading}
            salesTransactions={salesTransactions}
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
              investmentTransactions={investmentTransactions}
              customers={customers}
              onLogin={handleLogin}
            />
          </Layout>
        } />
        <Route path="/:customerName" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            customers={customers}
            loggedInUser={loggedInUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoading={isLoading}
            salesTransactions={salesTransactions}
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
              investmentTransactions={investmentTransactions}
              customers={customers}
              onLogin={handleLogin}
            />
          </Layout>
        } />
        <Route path="/:customerName/:subPage" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            customers={customers}
            loggedInUser={loggedInUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoading={isLoading}
            salesTransactions={salesTransactions}
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
              investmentTransactions={investmentTransactions}
              customers={customers}
              onLogin={handleLogin}
            />
          </Layout>
        } />
        <Route path="/detail-tabungan" element={
          <SavingsDetailPage user={loggedInUser} transactions={savingsTransactions} />
        } />
        <Route path="/detail-hutang" element={
          <DebtDetailPage user={loggedInUser} transactions={debtTransactions} />
        } />
        <Route path="/detail-lainnya" element={
          <LainnyaPage user={loggedInUser} transactions={salesTransactions} />
        } />
        <Route path="/detail-investasi" element={
          <InvestasiPage user={loggedInUser} transactions={investmentTransactions} />
        } />
        <Route path="/qris" element={<QRISPage />} />
        <Route path="/level" element={<LevelPage user={loggedInUser} transactions={salesTransactions} />} />
        <Route path="/admin" element={<AdminDashboard transactions={salesTransactions} user={loggedInUser} />} />
        <Route path="/admin/report" element={<AdminReportPage transactions={salesTransactions} />} />
      </Routes>
    </BrowserRouter>
  );
}
