import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
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

const Header = () => {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100 transition-all duration-300">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tighter text-black">WARUNG</span>
            <span className="text-lg font-black tracking-tighter text-[#F15A24]">TOMI</span>
          </div>
          <span className="text-[8px] font-bold text-muted-foreground tracking-[0.2em] uppercase leading-none">Solusi Digital</span>
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
          className={`h-10 rounded-full flex items-center transition-colors duration-500 relative ${
            isPortalOpen 
              ? "bg-[#F15A24] text-white w-10 justify-center shadow-lg shadow-orange-200" 
              : "bg-white border border-slate-200 text-slate-700 pl-4 pr-1 gap-2 shadow-sm hover:border-orange-200"
          }`}
        >
          <AnimatePresence mode="popLayout">
            {!isPortalOpen && (
              <motion.span
                key="text"
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
              >
                Masuk
              </motion.span>
            )}
          </AnimatePresence>

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
            className="overflow-hidden bg-white"
          >
            <div className="px-6 py-5 border-t border-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Portal Pelanggan</h3>
                  <p className="text-[9px] text-slate-500 font-medium">Masuk untuk melihat riwayat transaksi Anda</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masukkan Nama Anda"
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#F15A24] transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#005E6A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    Masuk
                  </motion.button>
                </div>
              </div>
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

const AsetPage = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-6 py-4"
  >
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
      <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-4">Total Aset</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold text-slate-400">Rp</span>
        <span className="text-3xl font-black text-[#005E6A]">2.450.000</span>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Saldo</h3>
      {[
        { name: "Tabungan Utama", balance: "1.200.000", color: "bg-blue-500" },
        { name: "E-Walet BNI", balance: "850.000", color: "bg-orange-500" },
        { name: "Investasi", balance: "400.000", color: "bg-teal-500" },
      ].map((item, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 ${item.color} rounded-full`} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
              <p className="text-sm font-bold text-slate-800">Rp {item.balance}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      ))}
    </div>
  </motion.div>
);

const RiwayatPage = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-6 py-4"
  >
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold text-black uppercase tracking-wider">Riwayat Transaksi</h2>
      <button className="p-2 bg-slate-100 rounded-full">
        <Search className="w-4 h-4 text-slate-500" />
      </button>
    </div>

    <div className="space-y-4">
      {[
        { title: "Top Up E-Walet", date: "10 Apr 2026", amount: "-50.000", type: "out" },
        { title: "Transfer Masuk", date: "09 Apr 2026", amount: "+200.000", type: "in" },
        { title: "Bayar Listrik", date: "08 Apr 2026", amount: "-125.500", type: "out" },
        { title: "Pulsa Telkomsel", date: "07 Apr 2026", amount: "-25.000", type: "out" },
      ].map((item, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'in' ? 'bg-green-50' : 'bg-red-50'}`}>
              {item.type === 'in' ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{item.title}</p>
              <p className="text-[10px] text-slate-400">{item.date}</p>
            </div>
          </div>
          <p className={`text-xs font-black ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{item.amount}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

const SettingsPage = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-6 py-4"
  >
    <div className="flex flex-col items-center mb-8">
      <div className="w-20 h-20 bg-[#005E6A] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
        <User className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">Agen BNI 46</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: 4688991122</p>
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

    <button className="w-full mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest">
      Keluar Akun
    </button>
  </motion.div>
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

const Layout = ({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (id: string) => void }) => (
  <div className="min-h-screen bg-slate-50 selection:bg-primary/30 selection:text-primary-foreground font-sans pb-24">
    <Header />
    <main className="container mx-auto max-w-lg">
      {children}
    </main>
    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
);

const HomePage = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => (
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
    {activeTab === "aset" && <AsetPage key="aset" />}
    {activeTab === "riwayat" && <RiwayatPage key="riwayat" />}
    {activeTab === "settings" && <SettingsPage key="settings" />}
  </AnimatePresence>
);

export default function App() {
  const [activeTab, setActiveTab] = useState("beranda");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            <HomePage activeTab={activeTab} setActiveTab={setActiveTab} />
          </Layout>
        } />
        <Route path="/qris" element={<QRISPage />} />
      </Routes>
    </BrowserRouter>
  );
}
