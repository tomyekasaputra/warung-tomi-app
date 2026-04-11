import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import Papa from "papaparse";
import { 
  LineChart, 
  Line, 
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
  HeartPulse,
  Droplets,
  Tv,
  Gamepad2,
  FileText,
  DollarSign,
  ArrowLeft,
  Download,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Types ---

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

// --- Components ---

const Header = ({ 
  customers, 
  loggedInUser, 
  onLogin, 
  onLogout,
  setActiveTab,
  isLoading
}: { 
  customers: Customer[], 
  loggedInUser: Customer | null, 
  onLogin: (user: Customer) => void,
  onLogout: () => void,
  setActiveTab: (id: string) => void,
  isLoading: boolean
}) => {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    const trimmedInput = customerName.trim();
    if (trimmedInput.length > 0 && !showPinInput) {
      const filtered = customers.filter(c => 
        c && c.Nama && 
        typeof c.Nama === 'string' && 
        c.Nama.toLowerCase().includes(trimmedInput.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [customerName, customers, showPinInput]);

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
              {loggedInUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-[#005E6A] rounded-full flex items-center justify-center text-white font-black text-sm shadow-inner">
                      {loggedInUser.Nama?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest">{loggedInUser.Nama || "User"}</h3>
                      <p className="text-[10px] text-[#F15A24] font-black uppercase tracking-widest">Nasabah Prioritas</p>
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
              ) : (
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

const AsetPage = ({ user }: { user: Customer | null }) => {
  const navigate = useNavigate();
  // Helper to parse currency string to number
  const parseCurrency = (val: string | undefined) => {
    if (!val) return 0;
    // Remove dots, commas, and any non-digit characters except for the first minus sign
    return parseInt(val.replace(/[^\d]/g, '')) || 0;
  };

  const tabunganBalance = parseCurrency(user?.Tabungan);
  const investasiBalance = parseCurrency(user?.Investasi);
  const lainnyaBalance = 0; // Placeholder for now
  const hutangBalance = parseCurrency(user?.Hutang);
  
  const totalAset = tabunganBalance + investasiBalance + lainnyaBalance - hutangBalance;

  const assetData = [
    { name: 'Tabungan', value: tabunganBalance, color: '#22c55e' },
    { name: 'Investasi', value: investasiBalance, color: '#14b8a6' },
    { name: 'Lainnya', value: lainnyaBalance, color: '#6366f1' },
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
        
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Saldo</h3>
          {[
            { name: "Tabungan", balance: user?.Tabungan || "0", color: "bg-green-500", clickable: true, path: "/detail-tabungan" },
            { name: "Investasi", balance: user?.Investasi || "0", color: "bg-teal-500", clickable: false },
            { name: "Lainnya", balance: "0", color: "bg-indigo-500", clickable: false },
            { name: "Hutang", balance: user?.Hutang || "0", color: "bg-red-500", clickable: true, path: "/detail-hutang" },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.clickable && item.path && navigate(item.path)}
              className={`bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm ${item.clickable ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 ${item.color} rounded-full`} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.name}</p>
                  <p className="text-sm font-black text-[#005E6A]">Rp {item.balance}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-200" />
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

        <div className="bg-gradient-to-br from-[#005E6A] to-[#008E9E] rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Saldo Tabungan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold opacity-80">Rp</span>
              <h2 className="text-4xl font-black tracking-tight">{user?.Tabungan || "0"}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest">Riwayat Mutasi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
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
                          t.Tipe === 'SETOR' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.Tipe}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-xs font-black ${
                          t.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.Tipe === 'SETOR' ? '+' : '-'}{formatCurrency(t.Nominal)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-black text-[#005E6A]">Rp {formatCurrency(t.SaldoAkhir)}</p>
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
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Hutang</p>
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
    .sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime());

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  // Process data for the chart (last 3 months)
  const chartData = React.useMemo(() => {
    const months: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 3 months
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' });
      months[monthLabel] = 0;
    }

    // Use all user transactions for chart, not filtered by search
    const allUserTransactions = transactions.filter(t => t.Nama.toLowerCase() === user?.Nama?.toLowerCase());
    
    allUserTransactions.forEach(t => {
      const tDate = new Date(t.Tanggal);
      const monthLabel = tDate.toLocaleString('id-ID', { month: 'short' });
      if (months[monthLabel] !== undefined) {
        months[monthLabel] += t.Pemasukan;
      }
    });

    return Object.entries(months).map(([name, total]) => ({ name, total }));
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
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total 3 Bulan Terakhir</p>
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
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
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
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl text-[10px] font-black">
                          <p className="text-white/60 uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-white text-sm">Rp {formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="step" 
                  dataKey="total" 
                  stroke="#ffffff" 
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
            userTransactions.map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.Jenis}</p>
                    <p className="text-[10px] text-slate-400">{item.Tanggal}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-green-600">Rp {formatCurrency(item.Pemasukan)}</p>
                  <div className="mt-1">
                    <Badge className={`text-[7px] font-black uppercase tracking-widest border-none px-2 py-0.5 ${
                      item.Status.toLowerCase() === 'lunas' || item.Status.toLowerCase() === 'selesai' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {item.Status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
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
          
          <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-100 mb-6 flex items-center justify-center">
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
  isLoading
}: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  customers: Customer[],
  loggedInUser: Customer | null,
  onLogin: (user: Customer) => void,
  onLogout: () => void,
  isLoading: boolean
}) => (
  <div className="min-h-screen bg-slate-50 selection:bg-primary/30 selection:text-primary-foreground font-sans pb-24">
    <Header 
      customers={customers} 
      loggedInUser={loggedInUser} 
      onLogin={onLogin} 
      onLogout={onLogout} 
      setActiveTab={setActiveTab}
      isLoading={isLoading}
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
  customers,
  onLogin
}: { 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  loggedInUser: Customer | null,
  onLogout: () => void,
  salesTransactions: SalesTransaction[],
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
      {activeTab === "aset" && <AsetPage user={loggedInUser} />}
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
      <div className="w-10 h-10 bg-[#E6F4F5] rounded-xl flex items-center justify-center mb-3">
        <RefreshCw className="w-5 h-5 text-[#005E6A] animate-spin" />
      </div>
      <h3 className="text-[7px] font-black text-[#005E6A] uppercase tracking-[0.2em] mb-0.5 text-center">Mohon Tunggu</h3>
      <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Memuat data...</p>
      
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#005E6A] to-transparent"
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
    <div className="bg-white rounded-[2rem] p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex items-center gap-4">
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
      <div className="flex flex-col gap-2">
        <button 
          onClick={onInstall}
          className="bg-[#F15A24] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-transform"
        >
          Instal
        </button>
        <button 
          onClick={onDismiss}
          className="text-[8px] font-bold text-slate-300 uppercase tracking-widest text-center hover:text-slate-500 transition-colors"
        >
          Nanti
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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customerUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS89JF6HJLZL4wD5YRvaEqqY2nF_VvKmzfKHzrP19PYZnGFudVzpzD94WWC0ueb35rJFCEs7OtEX083/pub?gid=0&single=true&output=csv";
        const savingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwjRmZLCREHIEg4LlJwM_AT7WDpG808cxzY5C5IvKIsK920oQbiSPSSegEvyTD330DvVH0kswepwIE/pub?gid=1607784622&single=true&output=csv";
        const investasiUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBQ5kUdqwv5bBsJcaiponYzqU_JxO0g7qQb6DQ1ujJ9bzTkY5GlI5XQQXL9BVr22gdmM7V7eEIDMH9/pub?gid=799157484&single=true&output=csv";
        const hutangUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQstrKWGJQeYcF3s_GNBSzB4q-PhQ7R4s4Gc-xy5F428uRbVjdf8c4bboL7JfIX5j1a0n-_FJGvPk7Q/pub?gid=2112924939&single=true&output=csv";
        const salesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCGVNALfAsaaLVyQx0halDo9U3Gk_QFEEEY96Zai9cTD4nfW5dQR8IWYig1-Cks01F08PjVVv-KDsW/pub?gid=526494903&single=true&output=csv";
        
        const [customerRes, savingsRes, investasiRes, hutangRes, salesRes] = await Promise.all([
          fetch(customerUrl),
          fetch(savingsUrl),
          fetch(investasiUrl),
          fetch(hutangUrl),
          fetch(salesUrl)
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
                    let totalInvestasi = 0;
                    userInvestasi.forEach(i => {
                      const nominalKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('jumlah') || k.toLowerCase().trim().includes('investasi') || k.toLowerCase().trim().includes('total') || k.toLowerCase().trim().includes('diterima'));
                      if (nominalKey) {
                        const nominalStr = String(i[nominalKey]).replace(/[^\d]/g, '');
                        totalInvestasi += parseInt(nominalStr) || 0;
                      }
                    });

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

                      const nominalStr = pemasukanKey ? String(s[pemasukanKey]).replace(/[^0-9.-]/g, '') : "0";
                      const nominal = parseFloat(nominalStr) || 0;
                      
                      return {
                        Tanggal: tanggalKey ? String(s[tanggalKey]).trim() : "-",
                        Nama: name,
                        Jenis: jenisKey ? String(s[jenisKey]).trim() : "Belanja",
                        Pemasukan: Math.abs(Math.round(nominal)),
                        Status: statusKey ? String(s[statusKey]).trim() : "Selesai"
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
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
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
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
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
          >
            <HomePage 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              salesTransactions={salesTransactions}
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
        <Route path="/qris" element={<QRISPage />} />
      </Routes>
    </BrowserRouter>
  );
}
