import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams, useLocation } from "react-router-dom";
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
  Users,
  Package,
  Gift,
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
  TrendingDown,
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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Share2,
  Camera,
  LogOut,
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

const parseCurrency = (val: string | number | undefined) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  return parseInt(String(val).replace(/[^\d]/g, '')) || 0;
};

const getRelativeTime = (dateStr: string) => {
  const date = parseDate(dateStr);
  if (date.getTime() === 0) return "";
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 30) return `${diffDays} hari lalu`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 bulan lalu";
  if (diffMonths < 12) return `${diffMonths} bulan lalu`;
  
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return "1 tahun lalu";
  return `${diffYears} tahun lalu`;
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

interface RedeemedPoint {
  Tanggal: string;
  Nama: string;
  Poin: number;
  Hadiah: string;
}

const TransactionCard: React.FC<{ t: SalesTransaction, index: number, isAdmin?: boolean }> = ({ t, index, isAdmin }) => {
  const jenisLower = t.Jenis.toLowerCase().trim();
  const service = MAIN_SERVICES.find(s => 
    s.name.toLowerCase().trim() === jenisLower ||
    (jenisLower.includes('qris') && s.name.toLowerCase() === 'qris') ||
    (jenisLower.includes('tarik') && s.name.toLowerCase() === 'tarik') ||
    (jenisLower.includes('kirim') && s.name.toLowerCase() === 'kirim') ||
    (jenisLower.includes('transfer') && s.name.toLowerCase() === 'kirim') ||
    (jenisLower.includes('dana') && s.name.toLowerCase() === 'e-walet') ||
    (jenisLower.includes('ovo') && s.name.toLowerCase() === 'e-walet') ||
    (jenisLower.includes('gopay') && s.name.toLowerCase() === 'e-walet') ||
    (jenisLower.includes('shopeepay') && s.name.toLowerCase() === 'e-walet') ||
    (jenisLower.includes('pulsa') && s.name.toLowerCase() === 'pulsa') ||
    (jenisLower.includes('data') && s.name.toLowerCase() === 'data') ||
    (jenisLower.includes('listrik') && s.name.toLowerCase() === 'listrik') ||
    (jenisLower.includes('belanja') && s.name.toLowerCase() === 'belanja')
  );
  const statusLower = t.Status.toLowerCase();
  const displayName = (!t.Nama || t.Nama === "Unknown" || t.Nama.trim() === "") ? "Pelanggan Umum" : t.Nama;
  let ribbonColor = 'bg-slate-500/5 text-slate-500';
  if (statusLower.includes('selesai') || statusLower.includes('sukses')) ribbonColor = 'bg-green-500/5 text-green-600';
  else if (statusLower.includes('kasbon')) ribbonColor = 'bg-red-500/5 text-red-600';
  else if (statusLower.includes('proses')) ribbonColor = 'bg-yellow-500/5 text-yellow-600';
  else if (statusLower.includes('belum') || statusLower.includes('ambil')) ribbonColor = 'bg-blue-500/5 text-blue-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative"
    >
      <div className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${service?.bgColor || 'bg-slate-50'}`}>
          {service ? service.icon : <ShoppingBag className="w-6 h-6 text-slate-400" />}
        </div>
        
        <div className="flex-1 min-w-0 flex justify-between items-center">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* Row 1: Nama */}
            <p className="text-[11px] font-black text-[#005E6A] uppercase truncate pr-2">{displayName}</p>
            
            {/* Row 2: Jenis & Melalui */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-slate-700 uppercase leading-none">{t.Jenis}</span>
              <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider truncate leading-none">via {t.Melalui}</span>
            </div>

            {/* Row 3: Tanggal & Status */}
            <div className="flex items-center gap-2">
              <p className="text-[7px] font-medium text-slate-400 uppercase tracking-widest">{t.Tanggal}</p>
              <p className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full w-fit ${ribbonColor}`}>
                {t.Status}
              </p>
            </div>
          </div>

          {/* Nominal Pemasukan (Right) */}
          <div className="text-right pl-4 shrink-0">
            <p className="text-[13px] font-black text-[#005E6A]">Rp {t.Pemasukan.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Ribbon at bottom right - Points (Customer) or Profit (Admin) */}
      {isAdmin ? (
        <div className="absolute bottom-0 right-0 w-20 py-1 rounded-tl-xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm text-center bg-[#F15A24]">
          Rp {(t.Pemasukan - (t.HargaModal || 0)).toLocaleString('id-ID')}
        </div>
      ) : (
        Math.floor(t.Pemasukan / 10000) > 0 && (
          <div className="absolute bottom-0 right-0 w-20 py-1 rounded-tl-xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm text-center bg-[#F15A24]">
            +{Math.floor(t.Pemasukan / 10000)} Poin
          </div>
        )
      )}
    </motion.div>
  );
};

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

const REWARDS = [
  { id: 1, name: "Rinso Cair 40gr", points: 300, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRx2y-CntAKktOdPZg-QyxvsR-ycNsoDkPrZENCiL9qP0dmqoHetfzwkRs&s=10" },
  { id: 2, name: "Mama Lemon 105ml", points: 500, image: "https://down-id.img.susercontent.com/file/id-11134207-7r98z-lwzh3qxfs5zv45" },
  { id: 3, name: "Teh Pucuk 350ml", points: 800, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLiDMxxcd9y-jJL_kXpF5ZvYi8TOsAX6VR9znp4NtnMqPjIXjTziv_uHo_&s=10" },
  { id: 4, name: "Pop Mie 75gr", points: 1000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjaKfZSXjGpy3-7kGW6dSuURVxq5Yba6uckE2bEQKr1Q&s=10" },
  { id: 5, name: "Minyak Fitri 400ml", points: 2000, image: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/111/MTA-183073988/brd-43554_fitri-minyak-goreng-fitri-200-ml-400-ml-sembako-krat-bundle_full07-7eeebc13.webp" },
  { id: 6, name: "Pisau Dapur Set", points: 3000, image: "https://img.lazcdn.com/g/p/15533e17722ace64fbf6bcb647833f96.jpg_720x720q80.jpg" },
  { id: 7, name: "Payung Cantik", points: 4000, image: "https://down-id.img.susercontent.com/file/id-11134207-7rase-m0u4n99lgh32d7" },
  { id: 8, name: "Rak 3 Susun", points: 6000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSu_6zKy3xP5mabEFTMpo0hymNUW2VghG7aOoZZo0NJXQ&s=10" },
  { id: 9, name: "Musik Box", points: 8000, image: "https://id-test-11.slatic.net/p/2/paling-laris-music-gogo-speaker-music-box-bluetooth-subwoofer-random-0616-84267845-ae00ae4583208e5b7c75022599c92399.jpg_500x500Q80.jpg" },
  { id: 10, name: "Kipas Angin", points: 10000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHaDqK6c-V8NToV0tSWtbI92HOTT_BDTElNyAuMdJQRY2SJq5TDgwphPx-&s=10" },
];

const calculateActivePoints = (customerName: string, salesTransactions: SalesTransaction[], redeemedPoints: RedeemedPoint[]) => {
  const now = new Date();
  const startDate = new Date(2025, 10, 1); // 1 November 2025
  const userSales = salesTransactions.filter(t => t.Nama.toLowerCase() === customerName.toLowerCase());
  const userRedeemed = redeemedPoints
    .filter(r => r.Nama.toLowerCase() === customerName.toLowerCase())
    .reduce((acc, curr) => acc + curr.Poin, 0);

  let totalEarned = 0;
  let totalExpired = 0;

  userSales.forEach(t => {
    const tDate = parseDate(t.Tanggal);
    if (tDate >= startDate) {
      const points = Math.floor(t.Pemasukan / 10000);
      totalEarned += points;

      const expiryDate = new Date(tDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      if (expiryDate < now) {
        totalExpired += points;
      }
    }
  });

  return Math.max(0, totalEarned - totalExpired - userRedeemed);
};

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
  salesTransactions,
  redeemedPoints
}: { 
  customers: Customer[], 
  loggedInUser: Customer | null, 
  onLogin: (user: Customer) => void, 
  onLogout: () => void,
  setActiveTab: (id: string) => void,
  isLoading: boolean,
  salesTransactions: SalesTransaction[],
  redeemedPoints: RedeemedPoint[]
}) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdminPage) return null;

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100 transition-all duration-300">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex flex-col group cursor-pointer w-fit" onClick={() => setActiveTab("beranda")}>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tighter text-[#005E6A] group-hover:text-[#F15A24] transition-colors">WARUNG</span>
            <span className="text-lg font-black tracking-tighter text-[#F15A24] group-hover:text-[#005E6A] transition-colors">TOMI</span>
          </div>
          <div className="flex justify-between w-full px-0.5 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            {"Digital Solution".split("").map((char, i) => (
              <span key={i} className="text-[6.5px] font-black text-muted-foreground tracking-widest uppercase leading-none">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        </Link>

        {/* BNI 46 Badge */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-[#E6F4F5] px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm border border-[#005E6A]/5 cursor-default"
        >
          <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-wider">Agen BNI</span>
          <span className="text-[10px] font-black text-[#F15A24]">46</span>
        </motion.div>
      </div>
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

const BansosPage = ({ transactions }: { transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const currentMonth = new Date().getMonth();
  const defaultTahap = Math.floor(currentMonth / 3) + 1;
  const [activeTahap, setActiveTahap] = useState(defaultTahap);
  const [searchQuery, setSearchQuery] = useState("");

  const { result: processedData, targetYear } = React.useMemo(() => {
    const stages: Record<number, Map<string, { nama: string, pkh: number, bpnt: number }>> = { 
      1: new Map(), 2: new Map(), 3: new Map(), 4: new Map() 
    };
    
    // Find the latest year that has PKH/BPNT transactions to focus on current program
    let latestYear = 0;
    transactions.forEach(t => {
      const jenis = t.Jenis?.toUpperCase() || "";
      if (jenis.includes("PKH") || jenis.includes("BPNT")) {
        const date = parseDate(t.Tanggal);
        if (date && date.getFullYear() > 1970 && date.getFullYear() > latestYear) {
          latestYear = date.getFullYear();
        }
      }
    });

    // If no transactions found, default to current year
    const year = latestYear || new Date().getFullYear();

    transactions.forEach(t => {
      const status = (t.Status || "").toLowerCase();
      if (status.includes("batal") || status.includes("cancel")) return;

      const jenis = t.Jenis?.toUpperCase() || "";
      if (jenis.includes("PKH") || jenis.includes("BPNT")) {
        const date = parseDate(t.Tanggal);
        if (!date || date.getTime() === 0) return;
        
        // Only process transactions from the target year
        if (date.getFullYear() !== year) return;

        const month = date.getMonth();
        const stage = Math.floor(month / 3) + 1;
        
        if (stage < 1 || stage > 4) return;

        const nameKey = t.Nama.trim().toLowerCase();
        let kpm = stages[stage].get(nameKey);
        if (!kpm) {
          kpm = { nama: t.Nama.trim(), pkh: 0, bpnt: 0 };
          stages[stage].set(nameKey, kpm);
        }
        
        const amount = Number(t.Pemasukan) || 0;
        if (jenis.includes("PKH")) {
          kpm.pkh += amount;
        }
        if (jenis.includes("BPNT")) {
          kpm.bpnt += amount;
        }
      }
    });

    const result: Record<number, { nama: string, pkh: number, bpnt: number }[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (let i = 1; i <= 4; i++) {
      result[i] = Array.from(stages[i].values());
    }
    return { result, targetYear: year };
  }, [transactions]);

  const currentStageData = processedData[activeTahap] || [];
  const filteredData = currentStageData.filter(k => 
    k.nama.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.nama.localeCompare(b.nama));

  const totalDana = currentStageData.reduce((acc, k) => acc + k.pkh + k.bpnt, 0);
  const totalKPM = currentStageData.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-white pb-24"
    >
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Kembali</span>
        </button>
        <button className="flex items-center gap-2 text-slate-600 active:scale-95 transition-transform">
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Bagikan</span>
        </button>
      </div>

      <div className="px-6 pt-6">
        {/* Combined Image & Title Card */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 mb-10 border border-slate-50">
          <div className="aspect-[16/10] overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/d/1GpNZ4yIov99m-EDWMUmfb3m9aISQBEe6" 
              alt="Bansos Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2">Pencairan Bansos {targetYear}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
              Program Keluarga Harapan (PKH) & Bantuan Pangan Non Tunai (BPNT)
            </p>
          </div>
        </div>

        {/* Tahap Tabs */}
        <div className="bg-slate-50 p-1 rounded-xl flex mb-8 border border-slate-100 overflow-x-auto no-scrollbar">
          {[
            { id: 1, label: "Tahap 1", period: "Jan - Mar" },
            { id: 2, label: "Tahap 2", period: "Apr - Jun" },
            { id: 3, label: "Tahap 3", period: "Jul - Sep" },
            { id: 4, label: "Tahap 4", period: "Okt - Des" },
          ].map((tahap) => (
            <button
              key={tahap.id}
              onClick={() => setActiveTahap(tahap.id)}
              className={`flex-1 min-w-[80px] py-2.5 rounded-lg transition-all flex flex-col items-center ${
                activeTahap === tahap.id 
                  ? "bg-[#005E6A] text-white shadow-md shadow-teal-100" 
                  : "text-slate-400"
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest">{tahap.label}</span>
              <span className={`text-[7px] font-bold uppercase tracking-widest opacity-60`}>{tahap.period}</span>
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#005E6A] p-5 rounded-lg text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Dana Tersalurkan</p>
            <p className="text-xs font-black tracking-tight">Rp {totalDana.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-[#F15A24] p-5 rounded-lg text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-white" />
            </div>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Jumlah KPM</p>
            <p className="text-xs font-black tracking-tight">{totalKPM} Orang</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-[#F15A24] transition-colors" />
          <input 
            type="text"
            placeholder="Cari nama KPM di tahap ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-3 text-[9px] font-bold focus:outline-none focus:bg-white focus:border-[#F15A24] focus:ring-2 focus:ring-orange-50 transition-all shadow-inner"
          />
        </div>

        {/* Table */}
        <div className="border border-slate-100 rounded-lg overflow-x-auto shadow-sm no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">No.</th>
                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Nama KPM</th>
                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">PKH</th>
                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">BPNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-[9px] font-bold text-slate-400 whitespace-nowrap">{index + 1}</td>
                  <td className="px-3 py-3 text-[9px] font-black text-black uppercase tracking-tight whitespace-nowrap">{item.nama}</td>
                  <td className="px-3 py-3 text-[9px] font-bold text-green-600 text-center whitespace-nowrap">
                    {item.pkh > 0 ? `Rp ${item.pkh.toLocaleString('id-ID')}` : "-"}
                  </td>
                  <td className="px-3 py-3 text-[9px] font-bold text-orange-600 text-center whitespace-nowrap">
                    {item.bpnt > 0 ? `Rp ${item.bpnt.toLocaleString('id-ID')}` : "-"}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Tidak ada data untuk tahap ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const PromoSection = () => {
  const navigate = useNavigate();
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
            className="w-full h-full cursor-pointer"
            onClick={() => {
              if (currentSlide === 4) navigate("/bansos");
            }}
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
    { id: "settings", label: "Profil", icon: User },
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

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" }}
    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(4px)" }}
    transition={{ 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1] 
    }}
  >
    {children}
  </motion.div>
);

const ProtectedPage = ({ 
  user, 
  children, 
  title,
  customers,
  onLogin,
  setActiveTab
}: { 
  user: Customer | null, 
  children: React.ReactNode,
  title: string,
  customers?: Customer[],
  onLogin?: (user: Customer) => void,
  setActiveTab?: (id: string) => void
}) => {
  const [customerName, setCustomerName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isAdminPopupOpen, setIsAdminPopupOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const navigate = useNavigate();

  const ADMIN_ACCESS_CODE = "160910";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); // Only scroll to top when the component first mounts

  useEffect(() => {
    const trimmedInput = customerName.trim();
    if (trimmedInput.length > 0 && !showPinInput && customers) {
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
    if (!customers || !onLogin || !setActiveTab) return;
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
        setCustomerName("");
        setActiveTab("aset");
      }
    } else {
      setError("Nama tidak ditemukan");
    }
  };

  const handlePinSubmit = () => {
    if (selectedCustomer && selectedCustomer.PIN === pinInput && onLogin && setActiveTab) {
      onLogin(selectedCustomer);
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

  const handleAdminSubmit = () => {
    if (adminCode === ADMIN_ACCESS_CODE) {
      setIsAdminPopupOpen(false);
      setAdminCode("");
      navigate("/admin");
    } else {
      setError("Kode Akses Salah");
    }
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-6 py-12 flex flex-col items-center min-h-[80vh]"
      >
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border-4 border-slate-50 overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/d/1VTlCXt_WlEUiF0s7fVHUM3JtjO3q4cqk" 
            alt="Warung Tomi Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-xl font-black text-[#005E6A] uppercase tracking-tight mb-2">
          Portal <span className="text-[#F15A24]">Pelanggan</span>
        </h2>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">
          Silakan masuk untuk melihat halaman <span className="text-[#F15A24]">{title}</span>
        </p>

        <div className="w-full max-w-[300px] space-y-4">
          {!showPinInput ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="NAMA PELANGGAN"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoginAttempt();
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] focus:outline-none focus:border-[#005E6A]/20 transition-all"
                />
                
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (s.PIN && s.PIN.trim() !== "") {
                              setCustomerName(s.Nama);
                              setSelectedCustomer(s);
                              setShowPinInput(true);
                              setSuggestions([]);
                            } else if (onLogin && setActiveTab) {
                              onLogin(s);
                              setCustomerName("");
                              setActiveTab("aset");
                            }
                          }}
                          className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group"
                        >
                          <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">{s.Nama}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#F15A24] transition-colors" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleLoginAttempt}
                className="w-full bg-[#005E6A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 active:scale-95 transition-transform"
              >
                Lanjutkan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#005E6A] rounded-full flex items-center justify-center text-white font-black text-[10px]">
                    {selectedCustomer?.Nama?.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">{selectedCustomer?.Nama}</span>
                </div>
                <button 
                  onClick={() => {
                    setShowPinInput(false);
                    setPinInput("");
                  }}
                  className="text-[8px] font-black text-[#F15A24] uppercase tracking-widest"
                >
                  Ganti
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  inputMode="numeric"
                  placeholder="MASUKKAN PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePinSubmit();
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] focus:outline-none focus:border-[#005E6A]/20 transition-all"
                />
              </div>

              <button 
                onClick={handlePinSubmit}
                className="w-full bg-[#F15A24] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-transform"
              >
                Masuk Sekarang
              </button>
            </div>
          )}

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Admin Access Link */}
          <div className="pt-8 flex justify-center">
            <button 
              onClick={() => setIsAdminPopupOpen(true)}
              className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] hover:text-slate-400 transition-colors"
            >
              Masuk Akses Admin
            </button>
          </div>
        </div>

        {/* Admin Access Popup */}
        <AnimatePresence>
          {isAdminPopupOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-[#005E6A] uppercase tracking-widest">Akses Admin</h3>
                  <button onClick={() => setIsAdminPopupOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder="KODE AKSES ADMIN"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminSubmit();
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] focus:outline-none focus:border-[#005E6A]/20 transition-all"
                    />
                  </div>

                  <button 
                    onClick={handleAdminSubmit}
                    className="w-full bg-[#F15A24] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                  >
                    Verifikasi Akses
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
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

const LoyaltyPointsPage = ({ user, transactions, redeemedPoints }: { user: Customer | null, transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"RIWAYAT" | "TUKAR">("RIWAYAT");

  if (!user) return null;

  const now = new Date();
  const startDate = new Date(2025, 10, 1);
  const userSales = transactions.filter(t => t.Nama.toLowerCase() === user.Nama.toLowerCase());
  const userRedeemed = redeemedPoints
    .filter(r => r.Nama.toLowerCase() === user.Nama.toLowerCase())
    .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());

  let totalEarned = 0;
  let totalExpired = 0;
  const pointsHistory: { tanggal: string, poin: number, keterangan: string }[] = [];

  userSales.forEach(t => {
    const tDate = parseDate(t.Tanggal);
    if (tDate >= startDate) {
      const points = Math.floor(t.Pemasukan / 10000);
      if (points > 0) {
        totalEarned += points;
        pointsHistory.push({
          tanggal: t.Tanggal,
          poin: points,
          keterangan: t.Jenis
        });

        const expiryDate = new Date(tDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (expiryDate < now) {
          totalExpired += points;
        }
      }
    }
  });

  // Sort points history by date descending
  const sortedPointsHistory = [...pointsHistory].sort((a, b) => 
    parseDate(b.tanggal).getTime() - parseDate(a.tanggal).getTime()
  );

  const totalRedeemed = userRedeemed.reduce((acc, curr) => acc + curr.Poin, 0);
  const activePoints = Math.max(0, totalEarned - totalExpired - totalRedeemed);

  const getExpiryInfo = (tanggal: string) => {
    const tDate = parseDate(tanggal);
    const expiryDate = new Date(tDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isSoon = diffDays <= 30;
    const isExpired = diffDays <= 0;
    
    return {
      date: expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isSoon,
      isExpired,
      color: isSoon ? "bg-red-500" : "bg-yellow-400"
    };
  };

  return (
    <ProtectedPage user={user} title="Poin Loyalitas">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        {/* Main Card */}
        <div className="bg-[#005E6A] rounded-[2rem] p-8 text-white shadow-lg mb-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Poin Aktif</p>
          <h2 className="text-4xl font-black tracking-tighter">{activePoints} <span className="text-sm font-bold uppercase tracking-widest opacity-60">Poin</span></h2>
        </div>

        {/* Small Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
              <Gift className="w-4 h-4 text-[#F15A24]" />
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Poin Ditukar</p>
            <p className="text-sm font-black text-[#F15A24]">{totalRedeemed} Poin</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Poin Hangus</p>
            <p className="text-sm font-black text-red-500">{totalExpired} Poin</p>
          </div>
        </div>

        {/* Redeem Invitation Card */}
        {activePoints >= 300 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => navigate("/tukar-poin")}
            className="bg-gradient-to-r from-[#F15A24] to-[#FF8C00] p-5 rounded-lg text-white mb-8 shadow-lg shadow-orange-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Poin Anda Cukup!</p>
                <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">Tukarkan dengan hadiah menarik</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("RIWAYAT")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "RIWAYAT" ? "bg-white text-[#005E6A] shadow-md" : "text-slate-400"
            }`}
          >
            Riwayat Poin
          </button>
          <button
            onClick={() => setActiveTab("TUKAR")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "TUKAR" ? "bg-white text-[#F15A24] shadow-md" : "text-slate-400"
            }`}
          >
            Riwayat Tukar
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {activeTab === "RIWAYAT" ? (
            sortedPointsHistory.length > 0 ? (
              sortedPointsHistory.map((item, i) => {
                const expiry = getExpiryInfo(item.tanggal);
                if (expiry.isExpired) return null;
                
                return (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#005E6A] fill-[#005E6A]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-tight">Dari transaksi {item.keterangan}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.tanggal}</p>
                      </div>
                    </div>
                    <p className="text-xs font-black text-[#005E6A]">+{item.poin} Poin</p>
                    
                    {/* Expiry Ribbon */}
                    <div className={`absolute bottom-0 right-0 px-3 py-0.5 ${expiry.color} text-white text-[6px] font-black uppercase tracking-widest rounded-tl-lg`}>
                      Exp: {expiry.date}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Belum ada riwayat poin</p>
              </div>
            )
          ) : (
            userRedeemed.length > 0 ? (
              userRedeemed.map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-[#F15A24]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#F15A24] uppercase tracking-tight">{item.Hadiah}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {item.Tanggal.split(',')[0]}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-[#F15A24]">{item.Poin} Poin</p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Belum ada riwayat tukar</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const RedeemRewardsPage = ({ user, transactions, redeemedPoints }: { user: Customer | null, transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  
  if (!user) return null;

  const now = new Date();
  const startDate = new Date(2025, 10, 1);
  const userSales = transactions.filter(t => t.Nama.toLowerCase() === user.Nama.toLowerCase());
  const userRedeemed = redeemedPoints.filter(r => r.Nama.toLowerCase() === user.Nama.toLowerCase());

  let totalEarned = 0;
  let totalExpired = 0;

  userSales.forEach(t => {
    const tDate = parseDate(t.Tanggal);
    if (tDate >= startDate) {
      const points = Math.floor(t.Pemasukan / 10000);
      if (points > 0) {
        totalEarned += points;
        const expiryDate = new Date(tDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (expiryDate < now) {
          totalExpired += points;
        }
      }
    }
  });

  const totalRedeemed = userRedeemed.reduce((acc, curr) => acc + curr.Poin, 0);
  const activePoints = Math.max(0, totalEarned - totalExpired - totalRedeemed);

  return (
    <ProtectedPage user={user} title="Tukar Hadiah">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
        </button>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Poin Aktif Anda</p>
            <p className="text-2xl font-black text-[#005E6A] tracking-tight">{activePoints} Poin</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#005E6A] fill-[#005E6A]" />
          </div>
        </div>

        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Daftar Hadiah Tersedia</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {REWARDS.map((reward) => {
            const isAvailable = activePoints >= reward.points;
            
            return (
              <div 
                key={reward.id}
                className={`bg-white rounded-lg border p-4 flex items-center gap-4 transition-all ${
                  isAvailable ? "border-slate-100 shadow-sm" : "border-slate-50 opacity-60 grayscale"
                }`}
              >
                <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={reward.image} 
                    alt={reward.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-black uppercase tracking-tight mb-1 truncate">{reward.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#F15A24] fill-[#F15A24]" />
                    <p className="text-[10px] font-black text-[#F15A24]">{reward.points.toLocaleString('id-ID')} Poin</p>
                  </div>
                  
                  {!isAvailable && (
                    <div className="mt-2 bg-slate-100 rounded-full h-1.5 w-full overflow-hidden">
                      <div 
                        className="bg-slate-300 h-full rounded-full" 
                        style={{ width: `${(activePoints / reward.points) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  {isAvailable ? (
                    <button className="bg-[#005E6A] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm shadow-teal-100 active:scale-95 transition-transform">
                      Tukar
                    </button>
                  ) : (
                    <div className="bg-slate-50 text-slate-300 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">
                      Kurang {reward.points - activePoints}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
          <Info className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Silakan hubungi admin Warung Tomi untuk melakukan penukaran poin dengan hadiah yang Anda pilih.
          </p>
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const AsetPage = ({ user, transactions, investmentTransactions, redeemedPoints, customers, onLogin, setActiveTab }: { user: Customer | null, transactions: SalesTransaction[], investmentTransactions: InvestmentTransaction[], redeemedPoints: RedeemedPoint[], customers: Customer[], onLogin: (user: Customer) => void, setActiveTab: (id: string) => void }) => {
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

  const customerLevel = calculateCustomerLevel(transactions, user?.Nama || "");
  const activePoints = calculateActivePoints(user?.Nama || "", transactions, redeemedPoints);

  return (
    <ProtectedPage user={user} title="Aset" customers={customers} onLogin={onLogin} setActiveTab={setActiveTab}>
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
        
        <div className="grid grid-cols-2 gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest col-span-2">Rincian Saldo</h3>
          {[
            { 
              name: "Tabungan", 
              balance: formatCurrency(tabunganBalance), 
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
              balance: formatCurrency(hutangBalance), 
              gradient: "from-rose-500 to-red-600",
              icon: CreditCard,
              clickable: true, 
              path: "/detail-hutang" 
            },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.clickable && item.path && navigate(item.path)}
              className={`relative overflow-hidden bg-gradient-to-br ${item.gradient} p-4 rounded-[2rem] flex flex-col justify-between shadow-lg shadow-slate-200/50 min-h-[120px] ${item.clickable ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
              {/* Decorative Circle */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <p className="text-[8px] font-black text-white/70 uppercase tracking-widest leading-none mb-1.5">{item.name}</p>
                <p className="text-[13px] font-black text-white tracking-tight">Rp {item.balance}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const SavingsDetailPage = ({ user, transactions, customers }: { user: Customer | null, transactions: SavingTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const displayUser = customerName && customers 
    ? customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user
    : user;
  
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      label: d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label.split(' ')[0] || "";
  const [activeTab, setActiveTab] = useState<'riwayat' | 'statistik'>('riwayat');

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const filteredTransactions = transactions
    .filter(t => {
      if (t.Nama.toLowerCase() !== displayUser?.Nama?.toLowerCase()) return false;
      const tDate = parseDate(t.Tanggal);
      const tMonthYear = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      return tMonthYear === selectedMonth;
    })
    .reverse();

  const monthlyStats = filteredTransactions.reduce((acc, t) => {
    if (t.Tipe === 'SETOR') acc.setor += t.Nominal;
    else if (t.Tipe === 'TARIK') acc.tarik += t.Nominal;
    return acc;
  }, { setor: 0, tarik: 0 });

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    
    const stats = transactions
      .filter(t => t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase())
      .reduce((acc, t) => {
        const tDate = parseDate(t.Tanggal);
        if (tDate.getMonth() === m && tDate.getFullYear() === y) {
          if (t.Tipe === 'SETOR') acc.setor += t.Nominal;
          else if (t.Tipe === 'TARIK') acc.tarik += t.Nominal;
        }
        return acc;
      }, { setor: 0, tarik: 0 });

    return {
      name: d.toLocaleString('id-ID', { month: 'short' }),
      setor: stats.setor,
      tarik: stats.tarik
    };
  });

  return (
    <ProtectedPage user={displayUser} title="Detail Tabungan">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 pb-24"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'riwayat' ? (
            <motion.div 
              key="balance"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <Wallet className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider mb-1">{displayUser?.Nama}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Saldo Tabungan</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-lg font-bold opacity-80">Rp</span>
                  <h2 className="text-4xl font-black tracking-tight">{displayUser?.Tabungan || "0"}</h2>
                </div>

                {/* Integrated Stats */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">Setor {selectedMonthLabel}</p>
                      <p className="text-xs font-black text-white whitespace-nowrap">Rp {formatCurrency(monthlyStats.setor)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">Tarik {selectedMonthLabel}</p>
                      <p className="text-xs font-black text-white whitespace-nowrap">Rp {formatCurrency(monthlyStats.tarik)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Perbandingan 6 Bulan</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Setor vs Tarik</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Setor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Tarik</span>
                  </div>
                </div>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xl">
                              <p className="text-[10px] font-black text-slate-900 uppercase mb-2">{payload[0].payload.name}</p>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-green-600 flex justify-between gap-4">
                                  <span>Setor:</span>
                                  <span>Rp {formatCurrency(payload[0].value as number)}</span>
                                </p>
                                <p className="text-[9px] font-bold text-red-600 flex justify-between gap-4">
                                  <span>Tarik:</span>
                                  <span>Rp {formatCurrency(payload[1].value as number)}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="setor" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="tarik" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Removed old tabs from here */}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest">
              {activeTab === 'riwayat' ? 'Riwayat Mutasi' : 'Statistik Bulanan'}
            </h3>
            {activeTab === 'riwayat' && (
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 pr-8 text-[10px] font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {activeTab === 'riwayat' ? (
              filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="p-4 flex items-center gap-4">
                      {/* Icon Left */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        t.Tipe === 'SETOR' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {t.Tipe === 'SETOR' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-[11px] font-black text-black uppercase tracking-widest leading-none">{t.Tipe}</p>
                            <p className="text-[9px] font-bold text-slate-400 leading-none">{t.Tanggal}</p>
                          </div>
                          <p className={`text-sm font-black leading-none whitespace-nowrap ${
                            t.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {t.Tipe === 'SETOR' ? '+' : '-'}{formatCurrency(t.Nominal)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Ribbon at bottom right */}
                    <div className="absolute bottom-0 right-0 bg-[#005E6A] px-4 py-1.5 rounded-tl-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-black text-white/50 uppercase tracking-widest">Saldo Akhir</span>
                        <span className="text-[10px] font-black text-white">Rp {formatCurrency(t.SaldoAkhir)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <History className="w-8 h-8" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada mutasi</p>
                  </div>
                </div>
              )
            ) : (
              /* Statistik List - 6 Months */
              [...chartData].reverse().map((data, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black text-black uppercase tracking-widest">{data.name}</p>
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <p className="text-[8px] font-black text-[#005E6A] uppercase tracking-widest">Total Aktivitas</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Setor</p>
                      <p className="text-xs font-black text-green-600">Rp {formatCurrency(data.setor)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Tarik</p>
                      <p className="text-xs font-black text-red-600">Rp {formatCurrency(data.tarik)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom Navbar for Savings Detail */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-8 py-4 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            activeTab === 'riwayat' ? 'text-green-600 scale-110' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-green-50' : 'bg-transparent'}`}>
            <History className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Riwayat</span>
        </button>
        <button 
          onClick={() => setActiveTab('statistik')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            activeTab === 'statistik' ? 'text-green-600 scale-110' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'statistik' ? 'bg-green-50' : 'bg-transparent'}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Statistik</span>
        </button>
      </div>
    </ProtectedPage>
  );
};

const DebtDetailPage = ({ user, transactions, customers }: { user: Customer | null, transactions: DebtTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const displayUser = customerName && customers 
    ? customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user
    : user;
  
  const userTransactions = transactions
    .filter(t => t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase())
    .reverse();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  return (
    <ProtectedPage user={displayUser} title="Detail Hutang">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
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
              <h2 className="text-4xl font-black tracking-tight">{displayUser?.Hutang || "0"}</h2>
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
      </motion.div>
    </ProtectedPage>
  );
};

const InvestasiPage = ({ user, transactions, customers }: { user: Customer | null, transactions: InvestmentTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const displayUser = customerName && customers 
    ? customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user
    : user;
  
  const userTransactions = transactions.filter(t => 
    t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase()
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const totalInvestasi = userTransactions
    .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => acc + curr.Nominal, 0);

  return (
    <ProtectedPage user={displayUser} title="Investasi">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
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
      </motion.div>
    </ProtectedPage>
  );
};

const LainnyaPage = ({ user, transactions, customers }: { user: Customer | null, transactions: SalesTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  
  const decodedName = customerName ? decodeURIComponent(customerName) : "";
  const isGeneral = decodedName.toLowerCase() === "pelanggan umum";
  
  const displayUser = customerName && customers 
    ? (isGeneral ? { Nama: "Pelanggan Umum" } as Customer : (customers.find(c => c.Nama.toLowerCase() === decodedName.toLowerCase()) || user))
    : user;
  
  const userTransactions = transactions.filter(t => {
    const tName = (t.Nama || "").toLowerCase().trim();
    const statusMatch = (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL";
    
    if (isGeneral) {
      const isGeneralName = !tName || tName === "unknown" || tName === "pelanggan umum";
      return isGeneralName && statusMatch;
    }
    
    return tName === displayUser?.Nama?.toLowerCase() && statusMatch;
  });

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
    <ProtectedPage user={displayUser} title="Lainnya">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
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
      </motion.div>
    </ProtectedPage>
  );
};

const AdminReportPage = ({ transactions }: { transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for matching
  const formattedFilterDate = filterDate.split('-').reverse().join('/');

  // Filter transactions for selected date and use spreadsheet order
  const filteredTransactions = [...transactions]
    .filter(t => t.Tanggal.startsWith(formattedFilterDate));

  const totalPemasukan = filteredTransactions.reduce((acc, curr) => acc + curr.Pemasukan, 0);
  const totalModal = filteredTransactions.reduce((acc, curr) => acc + curr.HargaModal, 0);
  const totalKeuntungan = totalPemasukan - totalModal;
  const totalTransaksi = filteredTransactions.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 pb-24"
    >
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
            <h1 className="text-2xl font-black tracking-tight uppercase whitespace-nowrap">Laporan Transaksi</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Data Penjualan Harian</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[100px]">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pemasukan</p>
            <h3 className="text-[12px] font-black text-[#005E6A]">Rp {totalPemasukan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[100px]">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Keuntungan</p>
            <h3 className="text-[12px] font-black text-green-600">Rp {totalKeuntungan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[100px]">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Transaksi</p>
            <h3 className="text-[12px] font-black text-[#F15A24]">{totalTransaksi}</h3>
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
              filteredTransactions.map((t, i) => (
                <TransactionCard key={i} t={t} index={i} isAdmin={true} />
              ))
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
    </motion.div>
  );
};

const AdminDashboard = ({ transactions, user, customers }: { transactions: SalesTransaction[], user: Customer | null, customers: Customer[] }) => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Bulan ini");
  
  const totalTabungan = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  const totalInvestasi = customers.reduce((acc, c) => acc + parseCurrency(c.Investasi), 0);
  const totalHutang = customers.reduce((acc, c) => acc + parseCurrency(c.Hutang), 0);
  
  // Calculate total Lainnya from customers + general transactions
  const totalLainnyaFromCustomers = customers.reduce((acc, c) => acc + parseCurrency(c.Lainnya), 0);
  const totalLainnyaFromGeneral = transactions
    .filter(t => {
      const name = (t.Nama || "").toLowerCase().trim();
      const isGeneral = !name || name === "unknown" || name === "pelanggan umum";
      const s = (t.Status || "").toLowerCase().trim();
      return isGeneral && (s.includes('belum') || s.includes('ambil'));
    })
    .reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);
  
  const totalLainnya = totalLainnyaFromCustomers + totalLainnyaFromGeneral;

  const assetData = [
    { name: 'Tabungan', value: totalTabungan, color: '#10b981', path: '/admin/savings' },
    { name: 'Investasi', value: totalInvestasi, color: '#8b5cf6', path: '/admin/investment' },
    { name: 'Hutang', value: totalHutang, color: '#ef4444', path: '/admin/debt' },
    { name: 'Lainnya', value: totalLainnya, color: '#14b8a6', path: '/admin/others' }
  ].filter(d => d.value > 0);

  const totalAssets = totalTabungan + totalInvestasi + totalLainnya - totalHutang;

  // Filter transactions based on timeFilter
  const filteredSales = transactions.filter(t => {
    const d = parseDate(t.Tanggal);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (timeFilter === "Hari ini") {
      return targetDate.getTime() === today.getTime();
    } else if (timeFilter === "Minggu ini") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return targetDate >= startOfWeek && targetDate <= today;
    } else if (timeFilter === "Bulan ini") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else if (timeFilter === "Tahun ini") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalPemasukan = filteredSales.reduce((acc, curr) => acc + curr.Pemasukan, 0);
  const totalKeuntungan = filteredSales.reduce((acc, curr) => acc + (curr.Pemasukan - (curr.HargaModal || 0)), 0);
  const totalTransaksi = filteredSales.length;

  // Group by date for chart
  const salesByDate = filteredSales.reduce((acc: any, curr) => {
    const dateStr = curr.Tanggal.split(' ')[0];
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr] += curr.Pemasukan;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    total: salesByDate[date]
  })).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 pb-24"
    >
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
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Stats Cards - Now Menu Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => navigate("/admin/customers")}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-[#005E6A] group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Pelanggan</p>
          </button>
          <button 
            onClick={() => navigate("/admin/report")}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#F15A24] group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Stok</p>
          </button>
          <button 
            onClick={() => navigate("/level")}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Hadiah</p>
          </button>
        </div>

        {/* Asset Distribution Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Distribusi Aset</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Total: Rp {totalAssets.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#005E6A]" />
            </div>
          </div>

          <div className="h-[300px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Nominal']}
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
              {assetData.map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 text-left hover:bg-slate-50 p-1.5 rounded-xl transition-colors group"
                >
                  <div className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }} />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#F15A24] transition-colors">{item.name}</span>
                    <span className="text-[10px] font-black text-slate-700">Rp {item.value.toLocaleString('id-ID')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div 
          onClick={() => navigate("/admin/report")}
          className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 cursor-pointer hover:shadow-2xl transition-all group/card"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Grafik Laporan</h3>
              <div className="flex items-center gap-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Penjualan</p>
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-slate-50 border-none text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="Hari ini">Hari ini</option>
                  <option value="Minggu ini">Minggu ini</option>
                  <option value="Bulan ini">Bulan ini</option>
                  <option value="Tahun ini">Tahun ini</option>
                </select>
              </div>
            </div>
            <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center group-hover/card:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-[#F15A24]" />
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F15A24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#F15A24" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
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
                  fill="url(#barGradientDashboard)" 
                  radius={[6, 6, 6, 6]} 
                  barSize={12}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Penjualan</p>
              <p className="text-[11px] font-black text-[#005E6A]">Rp {totalPemasukan.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Keuntungan</p>
              <p className="text-[11px] font-black text-green-600">Rp {totalKeuntungan.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Transaksi</p>
              <p className="text-[11px] font-black text-[#F15A24]">{totalTransaksi} Order</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Transaksi Terakhir</h3>
            <button 
              onClick={() => navigate("/admin/report")}
              className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#F15A24] hover:bg-orange-50 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-4">
            {filteredSales.slice(0, 5).map((t, i) => (
              <TransactionCard key={i} t={t} index={i} isAdmin={true} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminManagementPage = ({ 
  title, 
  subtitle, 
  totalLabel, 
  totalValue, 
  items, 
  icon: Icon,
  colorClass,
  onItemClick
}: { 
  title: string, 
  subtitle: string, 
  totalLabel: string, 
  totalValue: number, 
  items: { name: string, value: number, subtext?: string }[],
  icon: any,
  colorClass: string,
  onItemClick?: (name: string) => void
}) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-white/70 mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">{title}</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{totalLabel}</p>
          <h3 className={`text-2xl font-black ${colorClass}`}>Rp {totalValue.toLocaleString('id-ID')}</h3>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider px-2">Daftar Rincian</h3>
          <div className="grid gap-3">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onItemClick && onItemClick(item.name)}
                className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center ${onItemClick ? 'cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#005E6A] uppercase">{item.name}</p>
                    {item.subtext && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.subtext}</p>}
                  </div>
                </div>
                <p className={`text-[13px] font-black ${colorClass}`}>Rp {item.value.toLocaleString('id-ID')}</p>
              </motion.div>
            ))}
            {items.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminSavingsManagement = ({ customers }: { customers: Customer[] }) => {
  const navigate = useNavigate();
  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  const items = customers
    .filter(c => parseCurrency(c.Tabungan) > 0)
    .map(c => ({ name: c.Nama, value: parseCurrency(c.Tabungan) }))
    .sort((a, b) => b.value - a.value);

  const handleItemClick = (name: string) => {
    navigate(`/admin/detail-tabungan/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Management Tabungan"
      subtitle="Total Tabungan Seluruh Pelanggan"
      totalLabel="Total Tabungan"
      totalValue={total}
      items={items}
      icon={Wallet}
      colorClass="text-[#005E6A]"
      onItemClick={handleItemClick}
    />
  );
};

const AdminInvestmentManagement = ({ customers }: { customers: Customer[] }) => {
  const navigate = useNavigate();
  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Investasi), 0);
  const items = customers
    .filter(c => parseCurrency(c.Investasi) > 0)
    .map(c => ({ name: c.Nama, value: parseCurrency(c.Investasi) }))
    .sort((a, b) => b.value - a.value);

  const handleItemClick = (name: string) => {
    navigate(`/admin/detail-investasi/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Management Investasi"
      subtitle="Total Investasi Seluruh Pelanggan"
      totalLabel="Total Investasi"
      totalValue={total}
      items={items}
      icon={TrendingUp}
      colorClass="text-[#F15A24]"
      onItemClick={handleItemClick}
    />
  );
};

const AdminCustomerManagement = ({ customers, transactions, redeemedPoints }: { customers: Customer[], transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  const now = new Date();
  const startDate = new Date(2025, 10, 1); // 1 November 2025

  const calculatePoints = (customerName: string) => {
    const userSales = transactions.filter(t => t.Nama.toLowerCase() === customerName.toLowerCase());
    const userRedeemed = redeemedPoints
      .filter(r => r.Nama.toLowerCase() === customerName.toLowerCase())
      .reduce((acc, curr) => acc + curr.Poin, 0);

    let totalEarned = 0;
    let totalExpired = 0;

    userSales.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate >= startDate) {
        const points = Math.floor(t.Pemasukan / 10000);
        totalEarned += points;

        // Check if expired (1 year)
        const expiryDate = new Date(tDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (expiryDate < now) {
          totalExpired += points;
        }
      }
    });

    const activePoints = Math.max(0, totalEarned - totalExpired - userRedeemed);
    return { activePoints, totalEarned, totalExpired, userRedeemed };
  };

  const customerList = customers.map(c => {
    const pointsInfo = calculatePoints(c.Nama);
    const levelInfo = calculateCustomerLevel(transactions, c.Nama);
    return {
      ...c,
      activePoints: pointsInfo.activePoints,
      level: levelInfo.name
    };
  }).sort((a, b) => a.Nama.localeCompare(b.Nama));

  const levelCounts = customerList.reduce((acc: any, curr) => {
    const level = curr.level.toLowerCase();
    if (level.includes('bronze')) acc.bronze++;
    else if (level.includes('silver')) acc.silver++;
    else if (level.includes('gold')) acc.gold++;
    else if (level.includes('platinum')) acc.platinum++;
    return acc;
  }, { bronze: 0, silver: 0, gold: 0, platinum: 0 });

  const activeCustomersCount = customers.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-white/70 mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Management Pelanggan</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Daftar Poin dan Level Pelanggan</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pelanggan Aktif</p>
            <h3 className="text-2xl font-black text-[#005E6A]">{activeCustomersCount} <span className="text-sm font-bold text-slate-400">Pelanggan</span></h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Bronze</p>
              <p className="text-sm font-black text-[#005E6A]">{levelCounts.bronze}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-400">Silver</p>
              <p className="text-sm font-black text-slate-500">{levelCounts.silver}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
              <p className="text-[7px] font-black text-orange-400 uppercase tracking-widest mb-1">Gold</p>
              <p className="text-sm font-black text-orange-600">{levelCounts.gold}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
              <p className="text-[7px] font-black text-teal-400 uppercase tracking-widest mb-1">Platinum</p>
              <p className="text-sm font-black text-teal-600">{levelCounts.platinum}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider px-2">Daftar Pelanggan</h3>
          <div className="grid gap-3">
            {customerList.map((c, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#005E6A] uppercase">{c.Nama}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-orange-50 text-[#F15A24] border-none text-[7px] font-black uppercase tracking-widest px-2 py-0.5">
                        {c.level}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-[#005E6A]">{c.activePoints}</p>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Poin Aktif</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminDebtManagement = ({ customers, transactions }: { customers: Customer[], transactions: DebtTransaction[] }) => {
  const navigate = useNavigate();
  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Hutang), 0);
  const items = customers
    .filter(c => parseCurrency(c.Hutang) > 0)
    .map(c => {
      const userTransactions = transactions.filter(t => t.Nama.toLowerCase() === c.Nama.toLowerCase());
      const latestDateStr = userTransactions.length > 0 
        ? userTransactions.sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())[0].Tanggal
        : "-";
      
      return { 
        name: c.Nama, 
        value: parseCurrency(c.Hutang),
        date: parseDate(latestDateStr),
        subtext: latestDateStr !== "-" ? getRelativeTime(latestDateStr) : ""
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleItemClick = (name: string) => {
    navigate(`/admin/detail-hutang/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Management Hutang"
      subtitle="Total Hutang Seluruh Pelanggan"
      totalLabel="Total Hutang"
      totalValue={total}
      items={items}
      icon={Receipt}
      colorClass="text-red-600"
      onItemClick={handleItemClick}
    />
  );
};

const AdminOthersManagement = ({ transactions, customers }: { transactions: SalesTransaction[], customers: Customer[] }) => {
  const navigate = useNavigate();
  const othersFromCustomers = customers
    .filter(c => parseCurrency(c.Lainnya) > 0)
    .map(c => {
      const userLainnyaTransactions = transactions.filter(t => {
        const nameMatch = t.Nama.toLowerCase() === c.Nama.toLowerCase();
        const s = (t.Status || "").toLowerCase().trim();
        return nameMatch && (s.includes('belum') || s.includes('ambil'));
      });
      
      const latestDateStr = userLainnyaTransactions.length > 0
        ? userLainnyaTransactions.sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())[0].Tanggal
        : "-";
      
      return { 
        name: c.Nama, 
        value: parseCurrency(c.Lainnya),
        date: parseDate(latestDateStr),
        subtext: latestDateStr !== "-" ? getRelativeTime(latestDateStr) : ""
      };
    });

  const generalOthers = transactions
    .filter(t => {
      const name = (t.Nama || "").toLowerCase().trim();
      const isGeneral = !name || name === "unknown" || name === "pelanggan umum";
      const s = (t.Status || "").toLowerCase().trim();
      return isGeneral && (s.includes('belum') || s.includes('ambil'));
    })
    .map(t => ({ 
      name: "Pelanggan Umum", 
      value: (t.HargaModal || 0) - (t.Sebagian || 0),
      date: parseDate(t.Tanggal),
      subtext: `${t.Jenis} • ${getRelativeTime(t.Tanggal)}`
    }));

  const items = [...othersFromCustomers, ...generalOthers].sort((a, b) => b.date.getTime() - a.date.getTime());
  const total = items.reduce((acc, item) => acc + item.value, 0);

  const handleItemClick = (name: string) => {
    navigate(`/admin/detail-lainnya/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Management Lainnya"
      subtitle="Transaksi Status Belum Diambil"
      totalLabel="Total Lainnya"
      totalValue={total}
      items={items}
      icon={ShoppingBag}
      colorClass="text-blue-600"
      onItemClick={handleItemClick}
    />
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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-screen bg-slate-50 pb-24 overflow-hidden"
      >
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
      </motion.div>
    </ProtectedPage>
  );
};

const RiwayatPage = ({ user, transactions }: { user: Customer | null, transactions: SalesTransaction[] }) => {
  const [activeTab, setActiveTab] = useState<"trend" | "rincian">("trend");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<{ month: number, year: number }>({ 
    month: now.getMonth(), 
    year: now.getFullYear() 
  });

  React.useEffect(() => {
    if (activeTab === "trend" && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [activeTab]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  // Process data for the chart (last 12 months)
  const chartData = React.useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const last12Months: { month: number, year: number, label: string, total: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      last12Months.push({
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

      const bucket = last12Months.find(m => m.month === tMonth && m.year === tYear);
      if (bucket) {
        bucket.total += t.Pemasukan;
      }
    });

    return last12Months;
  }, [transactions, user]);

  const filteredTransactions = React.useMemo(() => {
    let base = transactions.filter(t => t.Nama.toLowerCase() === user?.Nama?.toLowerCase());
    
    // Always filter by selected month for both tabs if we want consistency, 
    // but user asked for "dropdown yang sama" in Rincian tab too.
    base = base.filter(t => {
      const tDate = parseDate(t.Tanggal);
      return tDate.getMonth() === selectedMonth.month && tDate.getFullYear() === selectedMonth.year;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      base = base.filter(t => 
        t.Jenis.toLowerCase().includes(query) ||
        t.Tanggal.toLowerCase().includes(query) ||
        t.Status.toLowerCase().includes(query)
      );
    }

    return base.sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
  }, [transactions, user, selectedMonth, searchQuery]);

  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: { items: SalesTransaction[], total: number } } = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.Jenis]) {
        groups[t.Jenis] = { items: [], total: 0 };
      }
      groups[t.Jenis].items.push(t);
      groups[t.Jenis].total += t.Pemasukan;
    });
    return groups;
  }, [filteredTransactions]);

  const pieData = React.useMemo(() => {
    return Object.entries(groupedTransactions).map(([name, data]: [string, any]) => {
      // Find matching service for color
      let service = MAIN_SERVICES.find(s => 
        name.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(name.toLowerCase())
      );

      const isEWalletTopup = ["dana", "ovo", "gopay", "shopeepay"].some(wallet => 
        name.toLowerCase().includes(wallet.toLowerCase())
      );

      if (isEWalletTopup) {
        service = MAIN_SERVICES.find(s => s.name === "E-Walet");
      }

      // Map Tailwind color classes to hex for Recharts
      const colorMap: { [key: string]: string } = {
        'text-blue-600': '#2563eb',
        'text-purple-600': '#9333ea',
        'text-orange-600': '#ea580c',
        'text-green-600': '#16a34a',
        'text-pink-600': '#db2777',
        'text-teal-600': '#0d9488',
        'text-yellow-600': '#ca8a04',
        'text-red-600': '#dc2626',
        'text-cyan-600': '#0891b2',
        'text-indigo-600': '#4f46e5',
        'text-rose-600': '#e11d48',
        'text-amber-600': '#d97706',
        'text-emerald-600': '#059669',
      };

      const iconColorClass = service ? (service.icon as any).props.className.split(' ').find((c: string) => c.startsWith('text-')) : 'text-blue-600';
      const color = colorMap[iconColorClass] || '#2563eb';

      return {
        name,
        value: data.total,
        color
      };
    });
  }, [groupedTransactions]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (jenis: string) => {
    setExpandedGroups(prev => 
      prev.includes(jenis) ? prev.filter(g => g !== jenis) : [...prev, jenis]
    );
  };

  const totalSixMonths = (chartData as any[]).reduce((acc, curr) => acc + curr.total, 0);
  const selectedMonthData = (chartData as any[]).find(m => m.month === selectedMonth.month && m.year === selectedMonth.year);
  const totalSelectedMonth = selectedMonthData?.total || 0;
  const selectedMonthLabel = selectedMonthData?.label || "";

  const COLORS = ['#005E6A', '#F15A24', '#22C55E', '#3B82F6', '#A855F7', '#EAB308', '#EC4899'];

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

        {/* Shared Month Selector Dropdown */}
        <div className="mb-6">
          <div className="relative">
            <select
              value={`${selectedMonth.month}-${selectedMonth.year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number);
                setSelectedMonth({ month: m, year: y });
              }}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest text-[#005E6A] appearance-none focus:outline-none focus:border-[#005E6A]/20 transition-all shadow-sm"
            >
              {chartData.map((m, i) => (
                <option key={i} value={`${m.month}-${m.year}`}>
                  {m.label} {m.year}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("trend")}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "trend" ? 'bg-white text-[#005E6A] shadow-sm' : 'text-slate-400'}`}
          >
            Trend
          </button>
          <button 
            onClick={() => setActiveTab("rincian")}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "rincian" ? 'bg-white text-[#005E6A] shadow-sm' : 'text-slate-400'}`}
          >
            Rincian
          </button>
        </div>

        {activeTab === "trend" ? (
          <div className="mb-8">
            {/* 6-Month Trend Chart with Integrated Total */}
            <div className="bg-[#005E6A] rounded-[2.5rem] p-8 shadow-xl border border-[#005E6A]/10 mb-6 relative overflow-hidden">
              <div className="relative z-10 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Transaksi {selectedMonthLabel}</p>
                  <h4 className="text-xl font-black text-white">
                    Rp {formatCurrency(totalSelectedMonth)}
                  </h4>
                </div>
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>

              <div 
                ref={scrollContainerRef}
                className="h-48 w-full relative z-10 overflow-x-auto no-scrollbar scroll-smooth"
              >
                <div className="h-full min-w-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barGradientTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F15A24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#F15A24" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900 }}
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl text-[10px] font-black">
                              <p className="text-white/60 uppercase mb-1">{payload[0].payload.label}</p>
                              <p className="text-[#F15A24] text-sm">Rp {formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[10, 10, 10, 10]} 
                      barSize={18}
                      animationDuration={1500}
                    >
                      {chartData.map((entry, index) => {
                        const isActive = entry.month === selectedMonth.month && entry.year === selectedMonth.year;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isActive ? "#FFFFFF" : "url(#barGradientTrend)"}
                            style={{
                              filter: isActive ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))' : 'none',
                              transition: 'all 0.5s ease'
                            }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

            {/* Transaction List for Trend Tab */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
                Daftar Transaksi {chartData.find(m => m.month === selectedMonth.month && m.year === selectedMonth.year)?.label}
              </h3>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((item, i) => {
                  let service = MAIN_SERVICES.find(s => 
                    item.Jenis.toLowerCase().includes(s.name.toLowerCase()) || 
                    s.name.toLowerCase().includes(item.Jenis.toLowerCase())
                  );

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
                    if (s.includes('selesai') || s.includes('lunas')) return 'bg-green-500/10 text-green-600';
                    if (s.includes('kasbon')) return 'bg-red-500/10 text-red-600';
                    if (s.includes('proses')) return 'bg-yellow-500/10 text-yellow-600';
                    if (s.includes('belum diambil')) return 'bg-blue-500/10 text-blue-600';
                    return 'bg-slate-400/10 text-slate-500';
                  };

                  return (
                    <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass}`}>
                          <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.Jenis}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[8px] text-slate-400 uppercase tracking-widest">{item.Tanggal}</p>
                            <p className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full w-fit ${getStatusColor(item.Status)}`}>
                              {item.Status}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right pr-2">
                        <p className="text-xs font-black text-green-600">Rp {formatCurrency(item.Pemasukan)}</p>
                      </div>
                      {Math.floor(item.Pemasukan / 10000) > 0 && (
                        <div className="absolute bottom-0 right-0 w-20 py-1 rounded-tl-2xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm flex justify-center items-center bg-[#F15A24]">
                          +{Math.floor(item.Pemasukan / 10000)} Poin
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <History className="w-10 h-10 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            {/* Pie Chart Section with Integrated Total */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 mb-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transaksi {selectedMonthLabel}</p>
                  <h4 className="text-xl font-black text-[#005E6A]">
                    Rp {formatCurrency(totalSelectedMonth)}
                  </h4>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <PieChart className="w-5 h-5 text-[#005E6A]" />
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {pieData.map((entry: any, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-50 text-[10px] font-black">
                              <p className="text-slate-400 uppercase mb-1">{payload[0].name}</p>
                              <p className="text-[#005E6A] text-sm">Rp {formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item: any, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-[8px] font-black text-slate-500 uppercase truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable Categorized List */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Kategori Transaksi</h3>
              {Object.entries(groupedTransactions).map(([jenis, data]: [string, any], idx) => {
                // Find matching service for icon and color
                let service = MAIN_SERVICES.find(s => 
                  jenis.toLowerCase().includes(s.name.toLowerCase()) || 
                  s.name.toLowerCase().includes(jenis.toLowerCase())
                );

                const isEWalletTopup = ["dana", "ovo", "gopay", "shopeepay"].some(wallet => 
                  jenis.toLowerCase().includes(wallet.toLowerCase())
                );

                if (isEWalletTopup) {
                  service = MAIN_SERVICES.find(s => s.name === "E-Walet");
                }
                
                const IconComponent = service ? (service.icon as any).type : ShoppingBag;
                const iconColorClass = service ? (service.icon as any).props.className.split(' ').find((c: string) => c.startsWith('text-')) : 'text-blue-600';
                const bgColorClass = service ? service.bgColor : 'bg-blue-50';

                const getStatusColor = (status: string) => {
                  const s = status.toLowerCase();
                  if (s.includes('selesai') || s.includes('lunas')) return 'bg-green-500/10 text-green-600';
                  if (s.includes('kasbon')) return 'bg-red-500/10 text-red-600';
                  if (s.includes('proses')) return 'bg-yellow-500/10 text-yellow-600';
                  if (s.includes('belum diambil')) return 'bg-blue-500/10 text-blue-600';
                  return 'bg-slate-400/10 text-slate-500';
                };

                return (
                  <div key={jenis} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <button 
                      onClick={() => toggleGroup(jenis)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColorClass}`}>
                          <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{jenis}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{data.items.length} Transaksi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xs font-black text-[#005E6A]">Rp {formatCurrency(data.total)}</p>
                        {expandedGroups.includes(jenis) ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedGroups.includes(jenis) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-50 bg-slate-50/30"
                        >
                          <div className="p-2 space-y-2">
                            {data.items.map((item, i) => (
                              <div key={i} className="bg-white/50 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-slate-600">{item.Tanggal}</p>
                                    <p className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${getStatusColor(item.Status)}`}>
                                      {item.Status}
                                    </p>
                                  </div>
                                  {Math.floor(item.Pemasukan / 10000) > 0 && (
                                    <p className="text-[8px] font-black text-[#F15A24] uppercase tracking-widest mt-1">+{Math.floor(item.Pemasukan / 10000)} Poin</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-green-600">Rp {formatCurrency(item.Pemasukan)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </motion.div>
    </ProtectedPage>
  );
};

const ProfilPage = ({ user, transactions, redeemedPoints, onLogout, customers, onLogin, setActiveTab }: { user: Customer | null, transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[], onLogout: () => void, customers: Customer[], onLogin: (user: Customer) => void, setActiveTab: (id: string) => void }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const customerLevel = calculateCustomerLevel(transactions, user?.Nama || "");
  const activePoints = calculateActivePoints(user?.Nama || "", transactions, redeemedPoints);

  return (
    <ProtectedPage user={user} title="Profil" customers={customers} onLogin={onLogin} setActiveTab={setActiveTab}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4"
      >
        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 mb-4 relative group">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.Nama || 'default'}&backgroundColor=F15A24&fontFamily=Arial&fontWeight=700`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-[#005E6A] uppercase tracking-tight">Halo, {user?.Nama}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Selamat datang kembali di portal Anda</p>
        </div>

      {/* Level & Points Header */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate("/level")}
            className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center gap-1 group hover:border-orange-100 transition-colors cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-[#F15A24] fill-[#F15A24]" />
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Level Pelanggan</p>
            <p className="text-[10px] font-black text-[#F15A24] uppercase tracking-tight">{customerLevel.name}</p>
          </div>
          <div 
            onClick={() => navigate("/poin")}
            className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center gap-1 group hover:border-teal-100 transition-colors cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-[#005E6A] fill-[#005E6A]" />
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Poin Loyalitas</p>
            <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-tight">{activePoints} Poin</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm mb-6">
        {[
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

      {/* Logout Button */}
      <button 
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Keluar Akun</span>
      </button>

      {/* Logout Confirmation Popup */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-2">Konfirmasi Keluar</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun {user?.Nama}?
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={onLogout}
                  className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-transform"
                >
                  Ya, Keluar
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </ProtectedPage>
  );
};

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
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
}: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (id: string) => void,
}) => (
  <div className="min-h-screen bg-slate-50 selection:bg-primary/30 selection:text-primary-foreground font-sans pb-24">
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
  onLogin,
  redeemedPoints
}: { 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  loggedInUser: Customer | null,
  onLogout: () => void,
  salesTransactions: SalesTransaction[],
  investmentTransactions: InvestmentTransaction[],
  customers: Customer[],
  onLogin: (user: Customer) => void,
  redeemedPoints: RedeemedPoint[]
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <PromoSection />
          <MainServices />
        </motion.div>
      )}
      {activeTab === "aset" && (
        <motion.div
          key="aset"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AsetPage user={loggedInUser} transactions={salesTransactions} investmentTransactions={investmentTransactions} redeemedPoints={redeemedPoints} customers={customers} onLogin={onLogin} setActiveTab={setActiveTab} />
        </motion.div>
      )}
      {activeTab === "riwayat" && (
        <ProtectedPage user={loggedInUser} title="Riwayat" customers={customers} onLogin={onLogin} setActiveTab={setActiveTab}>
          <RiwayatPage user={loggedInUser} transactions={salesTransactions} />
        </ProtectedPage>
      )}
      {activeTab === "settings" && (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <ProfilPage user={loggedInUser} transactions={salesTransactions} redeemedPoints={redeemedPoints} onLogout={onLogout} customers={customers} onLogin={onLogin} setActiveTab={setActiveTab} />
        </motion.div>
      )}
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
  const [redeemedPoints, setRedeemedPoints] = useState<RedeemedPoint[]>([]);
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

  const isFetching = useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("warung_tomi_user");
    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }

    const fetchData = async (showLoading = true) => {
      if (isFetching.current) return;
      isFetching.current = true;
      if (showLoading) setIsLoading(true);
      try {
        const customerUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS89JF6HJLZL4wD5YRvaEqqY2nF_VvKmzfKHzrP19PYZnGFudVzpzD94WWC0ueb35rJFCEs7OtEX083/pub?gid=0&single=true&output=csv";
        const savingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwjRmZLCREHIEg4LlJwM_AT7WDpG808cxzY5C5IvKIsK920oQbiSPSSegEvyTD330DvVH0kswepwIE/pub?gid=1607784622&single=true&output=csv";
        const investasiUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBQ5kUdqwv5bBsJcaiponYzqU_JxO0g7qQb6DQ1ujJ9bzTkY5GlI5XQQXL9BVr22gdmM7V7eEIDMH9/pub?gid=799157484&single=true&output=csv";
        const hutangUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQstrKWGJQeYcF3s_GNBSzB4q-PhQ7R4s4Gc-xy5F428uRbVjdf8c4bboL7JfIX5j1a0n-_FJGvPk7Q/pub?gid=2112924939&single=true&output=csv";
        const salesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCGVNALfAsaaLVyQx0halDo9U3Gk_QFEEEY96Zai9cTD4nfW5dQR8IWYig1-Cks01F08PjVVv-KDsW/pub?gid=526494903&single=true&output=csv";
        const redeemedPointsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTkme-_goN5R1iYP1oL_He5XOk1jWsnOBiCftzxwKCCQ7q9HO0pyjNBrsjYTOlzrAo_AQcpYmq6owPl/pub?gid=1420871988&single=true&output=csv";
        
        // Use a more aggressive cache buster
        const cacheBuster = `&cb=${new Date().getTime()}`;
        
        const [customerRes, savingsRes, investasiRes, hutangRes, salesRes, redeemedRes] = await Promise.all([
          fetch(customerUrl + cacheBuster),
          fetch(savingsUrl + cacheBuster),
          fetch(investasiUrl + cacheBuster),
          fetch(hutangUrl + cacheBuster),
          fetch(salesUrl + cacheBuster),
          fetch(redeemedPointsUrl + cacheBuster)
        ]);

        const customerCsv = customerRes.ok ? await customerRes.text() : "";
        const savingsCsv = savingsRes.ok ? await savingsRes.text() : "";
        const investasiCsv = investasiRes.ok ? await investasiRes.text() : "";
        const hutangCsv = hutangRes.ok ? await hutangRes.text() : "";
        const salesCsv = salesRes.ok ? await salesRes.text() : "";
        const redeemedCsv = redeemedRes.ok ? await redeemedRes.text() : "";

        const parseCsv = (csv: string): Promise<any[]> => new Promise((resolve) => {
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: () => resolve([])
          });
        });

        const [savingsData, investasiData, hutangData, salesData, redeemedData] = await Promise.all([
          parseCsv(savingsCsv),
          parseCsv(investasiCsv),
          parseCsv(hutangCsv),
          parseCsv(salesCsv),
          parseCsv(redeemedCsv)
        ]);

        const processedRedeemedPoints: RedeemedPoint[] = redeemedData.map(r => {
          const rNamaKey = Object.keys(r).find(k => k.toLowerCase().trim().includes('nama'));
          const rTanggalKey = Object.keys(r).find(k => k.toLowerCase().trim().includes('tanggal'));
          const rPoinKey = Object.keys(r).find(k => k.toLowerCase().trim().includes('poin'));
          const rHadiahKey = Object.keys(r).find(k => k.toLowerCase().trim().includes('hadiah'));

          return {
            Tanggal: rTanggalKey ? String(r[rTanggalKey]).trim() : "-",
            Nama: rNamaKey ? String(r[rNamaKey]).trim() : "Unknown",
            Poin: rPoinKey ? parseCurrency(r[rPoinKey]) : 0,
            Hadiah: rHadiahKey ? String(r[rHadiahKey]).trim() : "Penukaran Hadiah"
          };
        });

        setRedeemedPoints(processedRedeemedPoints);

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
                const allInvestmentTransactions: InvestmentTransaction[] = [];
                
                // Process all sales transactions first to maintain spreadsheet order
                const allSalesTransactions: SalesTransaction[] = salesData.map(s => {
                  const sNamaKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('nama'));
                  const jenisKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('jenis'));
                  const tanggalKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                  const pemasukanKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('harga jual') || k.toLowerCase().trim().includes('pemasukan') || k.toLowerCase().trim().includes('jumlah') || k.toLowerCase().trim().includes('nominal'));
                  const statusKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('status'));
                  const melaluiKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('melalui'));
                  const modalKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('harga modal') || k.toLowerCase().trim().includes('modal'));
                  const sebagianKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('sebagian'));

                  const nominal = parseCurrency(pemasukanKey ? s[pemasukanKey] : 0);
                  const modal = parseCurrency(modalKey ? s[modalKey] : 0);
                  const sebagian = parseCurrency(sebagianKey ? s[sebagianKey] : 0);

                  return {
                    Tanggal: tanggalKey ? String(s[tanggalKey]).trim() : "-",
                    Nama: sNamaKey ? String(s[sNamaKey]).trim() : "Unknown",
                    Jenis: jenisKey ? String(s[jenisKey]).trim() : "Belanja",
                    Pemasukan: Math.abs(Math.round(nominal)),
                    Status: statusKey ? String(s[statusKey]).trim() : "Selesai",
                    Melalui: melaluiKey ? String(s[melaluiKey]).trim() : "-",
                    HargaModal: Math.abs(Math.round(modal)),
                    Sebagian: Math.abs(Math.round(sebagian))
                  };
                });

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
                    const userSalesTransactions = allSalesTransactions.filter(t => t.Nama.toLowerCase() === name.toLowerCase());

                    // Calculate Lainnya (Belum Diambil)
                    const userLainnya = userSalesTransactions
                      .filter(t => {
                        const s = (t.Status || "").toLowerCase().trim();
                        return s.includes('belum') || s.includes('ambil');
                      })
                      .reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);

                    return {
                      ...c,
                      Nama: name,
                      PIN: pinKey ? String(c[pinKey]).trim() : "",
                      Saldo: saldoKey ? String(c[saldoKey]).trim() : "0",
                      ID: idKey ? String(c[idKey]).trim() : "",
                      Tabungan: runningBalance.toLocaleString('id-ID'),
                      Investasi: totalInvestasi.toLocaleString('id-ID'),
                      Hutang: runningHutang.toLocaleString('id-ID'),
                      Lainnya: userLainnya.toLocaleString('id-ID')
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
            isFetching.current = false;
          },
          error: (error) => {
            console.error("PapaParse error:", error);
            setIsLoading(false);
            isFetching.current = false;
          }
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
        isFetching.current = false;
      }
    };
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000); // Poll every 10 seconds
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
      <ScrollToTop />
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
      
      <Header 
        customers={customers} 
        loggedInUser={loggedInUser} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        setActiveTab={setActiveTab}
        isLoading={isLoading}
        salesTransactions={salesTransactions}
        redeemedPoints={redeemedPoints}
      />

      <Routes>
        <Route path="/" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
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
              redeemedPoints={redeemedPoints}
            />
          </Layout>
        } />
        <Route path="/:customerName" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
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
              redeemedPoints={redeemedPoints}
            />
          </Layout>
        } />
        <Route path="/:customerName/:subPage" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
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
              redeemedPoints={redeemedPoints}
            />
          </Layout>
        } />
        <Route path="/detail-tabungan" element={
          <SavingsDetailPage user={loggedInUser} transactions={savingsTransactions} />
        } />
        <Route path="/admin/detail-tabungan/:customerName" element={
          <SavingsDetailPage user={loggedInUser} transactions={savingsTransactions} customers={customers} />
        } />
        <Route path="/detail-hutang" element={
          <DebtDetailPage user={loggedInUser} transactions={debtTransactions} />
        } />
        <Route path="/admin/detail-hutang/:customerName" element={
          <DebtDetailPage user={loggedInUser} transactions={debtTransactions} customers={customers} />
        } />
        <Route path="/detail-lainnya" element={
          <LainnyaPage user={loggedInUser} transactions={salesTransactions} />
        } />
        <Route path="/admin/detail-lainnya/:customerName" element={
          <LainnyaPage user={loggedInUser} transactions={salesTransactions} customers={customers} />
        } />
        <Route path="/detail-investasi" element={
          <InvestasiPage user={loggedInUser} transactions={investmentTransactions} />
        } />
        <Route path="/admin/detail-investasi/:customerName" element={
          <InvestasiPage user={loggedInUser} transactions={investmentTransactions} customers={customers} />
        } />
        <Route path="/poin" element={
          <LoyaltyPointsPage user={loggedInUser} transactions={salesTransactions} redeemedPoints={redeemedPoints} />
        } />
        <Route path="/tukar-poin" element={
          <RedeemRewardsPage user={loggedInUser} transactions={salesTransactions} redeemedPoints={redeemedPoints} />
        } />
        <Route path="/qris" element={<QRISPage />} />
        <Route path="/level" element={<LevelPage user={loggedInUser} transactions={salesTransactions} />} />
        <Route path="/bansos" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          >
            <BansosPage transactions={salesTransactions} />
          </Layout>
        } />
        <Route path="/admin" element={<AdminDashboard transactions={salesTransactions} user={loggedInUser} customers={customers} />} />
        <Route path="/admin/report" element={<AdminReportPage transactions={salesTransactions} />} />
        <Route path="/admin/customers" element={<AdminCustomerManagement customers={customers} transactions={salesTransactions} redeemedPoints={redeemedPoints} />} />
        <Route path="/admin/savings" element={<AdminSavingsManagement customers={customers} />} />
        <Route path="/admin/investment" element={<AdminInvestmentManagement customers={customers} />} />
        <Route path="/admin/debt" element={<AdminDebtManagement customers={customers} transactions={debtTransactions} />} />
        <Route path="/admin/others" element={<AdminOthersManagement transactions={salesTransactions} customers={customers} />} />
      </Routes>
    </BrowserRouter>
  );
}
