import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams, useLocation, useSearchParams } from "react-router-dom";
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
  ChevronDown,
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
  CheckCircle2,
  Timer,
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
  ChevronUp,
  Share2,
  Camera,
  LogOut,
  PiggyBank,
  Trophy,
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

const formatCurrency = (val: number) => {
  return val.toLocaleString('id-ID');
};

const parseDateForProgress = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return new Date();
  return parseDate(dateStr);
};

const calculateProgress = (startDateStr: string, endDateStr: string) => {
  try {
    const start = parseDateForProgress(startDateStr).getTime();
    const end = parseDateForProgress(endDateStr).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    
    if (total <= 0) return 0;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  } catch (e) {
    return 0;
  }
};

const calculateEstimatedReturn = (nominal: number, nisbah: string | undefined, startDateStr?: string, endDateStr?: string) => {
  // Default to 10% p.a. if nisbah is missing or explicitly requested
  const defaultNisbah = nisbah || "10%";
  
  // Calculate duration in years
  let durationInYears = 1; // Default
  if (startDateStr && endDateStr) {
    const start = parseDateForProgress(startDateStr);
    const end = parseDateForProgress(endDateStr);
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Use month-based calculation for "cleaner" financial results as requested by user
      const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const dayDiff = end.getDate() - start.getDate();
      const totalMonths = monthDiff + (dayDiff / 30);
      durationInYears = totalMonths / 12;
    }
  }

  // Check for percentage
  const percentMatch = defaultNisbah.match(/(\d+)%/);
  if (percentMatch) {
    const percentPerYear = parseInt(percentMatch[1]);
    // Apply duration weighting (assume all % are per year if unspecified or if it's the default)
    const profit = Math.round(nominal * (percentPerYear / 100) * durationInYears);
    return { 
      profit, 
      total: nominal + profit, 
      percent: Math.round(percentPerYear * durationInYears * 10) / 10,
      rateYearly: percentPerYear
    };
  }
  
  // Check for fixed amount
  const amountMatch = defaultNisbah.match(/Rp\s*([\d.]+)/);
  if (amountMatch) {
    const profit = parseInt(amountMatch[1].replace(/\./g, ''));
    const percent = Math.round((profit / nominal) * 100);
    return { profit, total: nominal + profit, percent, rateYearly: percent / durationInYears };
  }

  return { profit: 0, total: nominal, percent: 0, rateYearly: 0 };
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
  Berita?: string;
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
  Keterangan?: string;
  Nisbah?: string;
}

// --- Data ---

const MAIN_SERVICES = [
  { id: 3, name: "Tarik Tunai", icon: <CreditCard className="w-6 h-6 text-orange-600" />, bgColor: "bg-[#FFF7ED]" },
  { id: 4, name: "Transfer", icon: <Send className="w-6 h-6 text-blue-600" />, bgColor: "bg-[#EEF2FF]" },
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
  { id: 15, name: "Tabungan", icon: <PiggyBank className="w-6 h-6 text-[#005E6A]" />, bgColor: "bg-[#E6F4F5]" },
  { id: 16, name: "Investasi", icon: <TrendingUp className="w-6 h-6 text-[#F15A24]" />, bgColor: "bg-[#FFF7ED]" },
  { id: 17, name: "Poin Loyalitas", icon: <Star className="w-6 h-6 text-amber-500" />, bgColor: "bg-amber-50" },
  { id: 2, name: "QRIS", icon: <QrCode className="w-6 h-6 text-purple-600" />, bgColor: "bg-[#F3E8FF]" },
];

// --- Constants ---

const LEVELS = [
  { 
    name: "Bronze", 
    min: 0, 
    max: 999999, 
    color: "from-orange-400 to-orange-600", 
    icon: <Trophy className="w-6 h-6 text-white" />,
    benefits: ["Dapat 1 Poin (Tiap kelipatan Rp10.000)"]
  },
  { 
    name: "Silver", 
    min: 1000000, 
    max: 9999999, 
    color: "from-slate-300 to-slate-500", 
    icon: <Trophy className="w-6 h-6 text-white" />,
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
    icon: <Trophy className="w-6 h-6 text-white" />,
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
    icon: <Trophy className="w-6 h-6 text-white" />,
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

const calculateUserCollectability = (userTransactions: DebtTransaction[]) => {
  const chronological = [...userTransactions].sort((a, b) => parseDate(a.Tanggal).getTime() - parseDate(b.Tanggal).getTime());
  const periods: { durationDays: number }[] = [];
  let currentGroup: DebtTransaction[] = [];
  let isPeriodActive = false;
  
  chronological.forEach(t => {
    if (!isPeriodActive && t.SaldoAkhir > 0) isPeriodActive = true;
    if (isPeriodActive) currentGroup.push(t);
    if (isPeriodActive && t.SaldoAkhir === 0) {
      const start = parseDate(currentGroup[0].Tanggal);
      const end = parseDate(t.Tanggal);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      periods.push({ durationDays: diffDays });
      currentGroup = [];
      isPeriodActive = false;
    }
  });
  
  if (currentGroup.length > 0) {
    const start = parseDate(currentGroup[0].Tanggal);
    const diffDays = Math.ceil(Math.abs(new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    periods.push({ durationDays: diffDays });
  }
  
  const avgDuration = periods.length > 0 ? Math.round(periods.reduce((acc, p) => acc + p.durationDays, 0) / periods.length) : 0;
  
  if (periods.length === 0) {
    return { label: "-", color: "text-white", avgDuration: 0, badgeColor: "bg-slate-50 text-slate-400", sortOrder: 3 };
  }
  
  if (avgDuration <= 30) {
    return { label: "Lancar", color: "text-green-300", avgDuration, badgeColor: "bg-teal-50 text-teal-600", sortOrder: 0 };
  }
  if (avgDuration <= 90) {
    return { label: "Diragukan", color: "text-yellow-300", avgDuration, badgeColor: "bg-yellow-50 text-yellow-600", sortOrder: 1 };
  }
  return { label: "Macet", color: "text-red-300", avgDuration, badgeColor: "bg-red-50 text-red-600", sortOrder: 2 };
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
  const [isAgenInfoOpen, setIsAgenInfoOpen] = useState(false);

  if (isAdminPage) return null;

  return (
    <>
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
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAgenInfoOpen(true)}
            className="bg-[#E6F4F5] px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm border border-[#005E6A]/5 cursor-pointer"
          >
            <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-wider">Agen BNI</span>
            <span className="text-[10px] font-black text-[#F15A24]">46</span>
          </motion.div>
        </div>
      </header>

      {/* Agen BNI 46 Info Popup */}
      <AnimatePresence>
        {isAgenInfoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAgenInfoOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Header Design */}
              <div className="bg-[#005E6A] p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#F15A24]/20 rounded-full -ml-12 -mb-12 blur-xl" />
                
                <div className="relative z-10">
                  <div className="bg-white w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform -rotate-6">
                    <span className="text-xl font-black text-[#005E6A]">BNI</span>
                    <span className="text-xl font-black text-[#F15A24]">46</span>
                  </div>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight">Agen BNI 46</h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Mitra Resmi Perbankan</p>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[#005E6A] font-black text-xs uppercase tracking-widest mb-2">Apa itu Agen BNI 46?</h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">
                      Agen BNI 46 adalah mitra BNI (perorangan atau badan hukum) yang telah bekerjasama dengan BNI untuk menyediakan layanan perbankan kepada masyarakat.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#F15A24] p-2 rounded-lg shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-1">Warung Tomi</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed font-bold">
                          Telah menjadi mitra resmi Agen BNI 46 sejak tahun <span className="text-[#F15A24]">2021</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[#005E6A] font-black text-xs uppercase tracking-widest mb-2">Titik Kumpul KPM</h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">
                      Kami bangga menjadi titik kumpul resmi bagi para Keluarga Penerima Manfaat (KPM) untuk melakukan pencairan bantuan sosial <span className="font-bold text-slate-900">PKH</span> dan <span className="font-bold text-slate-900">BPNT</span> secara aman dan nyaman.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setIsAgenInfoOpen(false)}
                  className="w-full mt-8 bg-[#F15A24] hover:bg-[#d94e1f] text-white font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg shadow-[#F15A24]/20"
                >
                  Tutup Informasi
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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
      {/* Top Header Removed */}

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
            <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2">Pencairan Bansos</h1>
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
    <section className="px-6 py-1 space-y-6">
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-black uppercase tracking-wider">Layanan</h2>
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

      {/* Contact & Location Card */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200 border border-slate-100">
        <div className="bg-[#005E6A] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-tight">Kontak & Lokasi</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Kunjungi Kami</p>
              </div>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-[8px] font-black text-[#005E6A]">BNI</span>
              <span className="text-[8px] font-black text-[#F15A24]">46</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#E6F4F5] rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#005E6A]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-wider mb-1">Alamat Resmi</p>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                Dusun Manis, RT009/RW005, Desa Wilanagara, Kec. Luragung, Kab. Kuningan
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#FFF0E6] rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-[#F15A24]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#F15A24] uppercase tracking-wider mb-1">WhatsApp Center</p>
              <p className="text-[11px] text-slate-600 font-bold">087774138090</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Jam Operasional</p>
              <p className="text-[11px] text-slate-600 font-bold">Setiap Hari: 06:00 - 22:00 WIB</p>
            </div>
          </div>

          <Button 
            className="w-full mt-2 bg-[#F15A24] hover:bg-[#d94e1f] text-white font-black uppercase tracking-widest py-7 rounded-2xl shadow-lg shadow-[#F15A24]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            onClick={() => window.open('https://maps.app.goo.gl/bnUitCFdP5sgqiw49', '_blank')}
          >
            <MapPin className="w-4 h-4" />
            Buka Google Maps
          </Button>
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
      localStorage.setItem("admin_session", "true");
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
              onClick={() => {
                if (localStorage.getItem("admin_session") === "true") {
                  navigate("/admin");
                } else {
                  setIsAdminPopupOpen(true);
                }
              }}
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
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Poin Aktif</p>
          <h2 className="text-4xl font-black tracking-tighter">{activePoints} <span className="text-sm font-bold uppercase tracking-widest opacity-60">Poin</span></h2>
        </div>

        {/* Small Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
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
                <Star className="w-6 h-6 text-white fill-amber-400" />
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
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
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
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
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
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
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
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
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
  
  const investasiBalance = userInvestments.reduce((acc, curr) => {
    const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
    return acc + estimate.total;
  }, 0);
  
  // Calculate Lainnya balance from "BELUM DIAMBIL" & "DIPROSES" transactions
  const lainnyaTransactions = transactions.filter(t => {
    const tName = t.Nama.toLowerCase();
    const uName = user?.Nama?.toLowerCase();
    const s = (t.Status || "").toUpperCase().trim();
    return tName === uName && (s === "BELUM DIAMBIL" || s === "DIPROSES");
  });
  
  const lainnyaBalance = lainnyaTransactions.reduce((acc, curr) => {
    const s = (curr.Status || "").toUpperCase().trim();
    if (s === "DIPROSES") {
      return acc + (curr.Pemasukan || 0);
    }
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
              path: "/tabungan" 
            },
            { 
              name: "Investasi", 
              balance: formatCurrency(investasiBalance), 
              gradient: "from-indigo-500 to-violet-600",
              icon: TrendingUp,
              clickable: true, 
              path: "/investasi" 
            },
            { 
              name: "Lainnya", 
              balance: formatCurrency(lainnyaBalance), 
              gradient: "from-teal-500 to-cyan-600",
              icon: Layers,
              clickable: true, 
              path: "/lainnya" 
            },
            { 
              name: "Hutang", 
              balance: formatCurrency(hutangBalance), 
              gradient: "from-rose-500 to-red-600",
              icon: CreditCard,
              clickable: true, 
              path: "/hutang" 
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
  
  const userTransactions = useMemo(() => 
    transactions.filter(t => t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase()),
    [transactions, displayUser]
  );

  const allMonths = useMemo(() => {
    if (userTransactions.length === 0) {
      const now = new Date();
      return [{
        label: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        value: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        month: now.getMonth(),
        year: now.getFullYear()
      }];
    }

    const earliestTransaction = userTransactions.reduce((earliest, t) => {
      const tDate = parseDate(t.Tanggal);
      return tDate < earliest ? tDate : earliest;
    }, new Date());

    const startMonth = earliestTransaction.getMonth();
    const startYear = earliestTransaction.getFullYear();
    const now = new Date();
    
    const result = [];
    let tempDate = new Date(startYear, startMonth, 1);
    while (tempDate <= now) {
      result.push({
        label: tempDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        value: `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`,
        month: tempDate.getMonth(),
        year: tempDate.getFullYear()
      });
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    return result;
  }, [userTransactions]);

  const months = useMemo(() => [...allMonths].reverse(), [allMonths]);

  const [searchParams] = useSearchParams();
  const initialMonth = searchParams.get('month');
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || allMonths[allMonths.length - 1]?.value || "");
  
  useEffect(() => {
    if (initialMonth) {
      setSelectedMonth(initialMonth);
    } else if (allMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(allMonths[allMonths.length - 1].value);
    }
  }, [allMonths, initialMonth]);

  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label.split(' ')[0] || "";
  const [activeTab, setActiveTab] = useState<'riwayat' | 'statistik'>('riwayat');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToRight = () => {
      if (chartScrollRef.current && activeTab === 'statistik') {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
      }
    };

    // Scroll immediately
    scrollToRight();
    
    // Also scroll after a short delay to ensure chart has rendered
    const timer = setTimeout(scrollToRight, 100);
    return () => clearTimeout(timer);
  }, [activeTab, allMonths.length]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const filteredTransactions = userTransactions
    .filter(t => {
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

  const chartData = useMemo(() => allMonths.map(mInfo => {
    const m = mInfo.month;
    const y = mInfo.year;
    
    const stats = userTransactions
      .reduce((acc, t) => {
        const tDate = parseDate(t.Tanggal);
        if (tDate.getMonth() === m && tDate.getFullYear() === y) {
          if (t.Tipe === 'SETOR') acc.setor += t.Nominal;
          else if (t.Tipe === 'TARIK') acc.tarik += t.Nominal;
        }
        return acc;
      }, { setor: 0, tarik: 0 });

    return {
      name: new Date(y, m).toLocaleString('id-ID', { month: 'short' }).replace('.', ''),
      month: m,
      year: y,
      setor: stats.setor,
      tarik: stats.tarik
    };
  }), [allMonths, userTransactions]);

  return (
    <>
      <ProtectedPage user={displayUser} title="Detail Tabungan">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="px-6 py-4 pb-20"
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
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Grafik Perbandingan</h4>
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
              <div className="h-[180px] w-full overflow-x-auto scrollbar-hide" ref={chartScrollRef}>
                <div style={{ minWidth: `${Math.max(100, chartData.length * 60)}px`, height: '100%' }}>
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
                            <p className="text-[11px] font-black text-[#005E6A] uppercase tracking-widest leading-none">{t.Berita || t.Tipe}</p>
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
                    <div className="absolute bottom-0 right-0 bg-[#F15A24] w-40 py-0.5 rounded-tl-2xl rounded-br-2xl shadow-sm flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[5px] font-black text-white/50 uppercase tracking-widest">Saldo Akhir</span>
                        <span className="text-[9px] font-black text-white">Rp {formatCurrency(t.SaldoAkhir)}</span>
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
              [...chartData].reverse().map((data, i) => {
                const isExpanded = expandedMonth === `${data.year}-${data.month}`;
                const monthTransactions = transactions.filter(t => {
                  if (t.Nama.toLowerCase() !== displayUser?.Nama?.toLowerCase()) return false;
                  const tDate = parseDate(t.Tanggal);
                  return tDate.getMonth() === data.month && tDate.getFullYear() === data.year;
                }).reverse();

                return (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setExpandedMonth(isExpanded ? null : `${data.year}-${data.month}`)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                      {/* Month Icon */}
                      <div className="w-12 h-12 rounded-full bg-[#005E6A] flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
                        <span className="text-[10px] font-black text-[#F15A24] uppercase">{data.name}</span>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex-1 grid grid-cols-2 gap-4 text-left">
                        <div className="space-y-1">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Setor</p>
                          <p className="text-xs font-black text-green-600">Rp {formatCurrency(data.setor)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Tarik</p>
                          <p className="text-xs font-black text-red-600">Rp {formatCurrency(data.tarik)}</p>
                        </div>
                      </div>

                      <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-2">
                            {monthTransactions.length > 0 ? (
                              monthTransactions.map((mt, j) => (
                                <div key={j} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">{mt.Tipe}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{mt.Tanggal}</p>
                                  </div>
                                  <p className={`text-xs font-black ${mt.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'}`}>
                                    {mt.Tipe === 'SETOR' ? '+' : '-'}{formatCurrency(mt.Nominal)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-4">Tidak ada riwayat</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </ProtectedPage>

      {/* Bottom Navbar for Savings Detail */}
      {displayUser && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === 'riwayat' ? 'text-green-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-green-50' : 'bg-transparent'}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Riwayat</span>
          </button>
          <button 
            onClick={() => setActiveTab('statistik')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === 'statistik' ? 'text-green-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'statistik' ? 'bg-green-50' : 'bg-transparent'}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Statistik</span>
          </button>
        </div>
      )}
    </>
  );
};

const DebtDetailPage = ({ user, transactions, customers }: { user: Customer | null, transactions: DebtTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [activeTab, setActiveTab] = useState<'riwayat' | 'statistik'>('riwayat');
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<string>('all');

  const displayUser = customerName && customers 
    ? customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user
    : user;
  
  const userTransactions = useMemo(() => {
    return transactions
      .filter(t => t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase())
      .reverse();
  }, [transactions, displayUser]);

  // Calculate Debt Periods
  const debtPeriods = useMemo(() => {
    const periods: {
      id: number;
      status: 'Lunas' | 'Berjalan';
      transactions: DebtTransaction[];
      startDate: string;
      endDate: string;
      totalBorrowed: number;
      durationDays: number;
    }[] = [];
    
    let currentGroup: DebtTransaction[] = [];
    let isPeriodActive = false;
    
    // chronological order
    const chronological = [...userTransactions].reverse();
    
    chronological.forEach(t => {
      if (!isPeriodActive && t.SaldoAkhir > 0) {
        isPeriodActive = true;
      }
      
      if (isPeriodActive) {
        currentGroup.push(t);
      }
      
      if (isPeriodActive && t.SaldoAkhir === 0) {
        const start = parseDate(currentGroup[0].Tanggal);
        const end = parseDate(t.Tanggal);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        periods.push({
          id: periods.length + 1,
          status: 'Lunas',
          transactions: [...currentGroup].reverse(),
          startDate: currentGroup[0].Tanggal,
          endDate: t.Tanggal,
          totalBorrowed: currentGroup.filter(item => item.Tipe === 'TAMBAH').reduce((s, item) => s + item.Jumlah, 0),
          durationDays: diffDays
        });
        currentGroup = [];
        isPeriodActive = false;
      }
    });
    
    if (currentGroup.length > 0) {
      const start = parseDate(currentGroup[0].Tanggal);
      const end = new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      periods.push({
        id: periods.length + 1,
        status: 'Berjalan',
        transactions: [...currentGroup].reverse(),
        startDate: currentGroup[0].Tanggal,
        endDate: "Berjalan",
        totalBorrowed: currentGroup.filter(item => item.Tipe === 'TAMBAH').reduce((s, item) => s + item.Jumlah, 0),
        durationDays: diffDays
      });
    }
    
    return periods.reverse(); 
  }, [userTransactions]);

  // Set default period to 'Berjalan' on mount
  useEffect(() => {
    const walkingIdx = debtPeriods.findIndex(p => p.status === 'Berjalan');
    if (walkingIdx !== -1) {
      setSelectedPeriodIndex(String(walkingIdx));
    } else if (debtPeriods.length > 0) {
      setSelectedPeriodIndex('0');
    }
  }, [debtPeriods]);

  const filteredTransactions = useMemo(() => {
    if (selectedPeriodIndex === 'all') return userTransactions;
    const idx = parseInt(selectedPeriodIndex);
    if (!isNaN(idx) && debtPeriods[idx]) {
      return debtPeriods[idx].transactions;
    }
    return userTransactions;
  }, [selectedPeriodIndex, userTransactions, debtPeriods]);

  const avgDuration = useMemo(() => {
    if (debtPeriods.length === 0) return 0;
    const totalDays = debtPeriods.reduce((acc, p) => acc + p.durationDays, 0);
    return Math.round(totalDays / debtPeriods.length);
  }, [debtPeriods]);

  const collectability = useMemo(() => {
    return calculateUserCollectability(userTransactions);
  }, [userTransactions]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  return (
    <>
    <ProtectedPage user={displayUser} title="Detail Hutang">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 pb-24"
      >
        {/* Main Card / Chart */}
        <AnimatePresence mode="wait">
          {activeTab === 'riwayat' ? (
            <motion.div 
              key="debt-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-red-600 to-rose-700 rounded-[2.5rem] text-white shadow-2xl mb-8 relative overflow-hidden transition-all duration-500 hover:shadow-red-500/20"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl opacity-30" />
              
              <div className="relative z-10 p-8">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight drop-shadow-sm truncate max-w-[200px]">{displayUser?.Nama}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Total Hutang Saat Ini</p>
                  </div>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.2rem] flex items-center justify-center border border-white/20 shadow-xl rotate-12 -mr-1 -mt-1 group-hover:rotate-0 transition-transform duration-500 shrink-0">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold opacity-40">Rp</span>
                    <h2 className="text-5xl font-black tracking-tighter tabular-nums leading-none drop-shadow-md">
                      {displayUser?.Hutang || "0"}
                    </h2>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center">
                  <div className="flex-1 text-center">
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Rata-rata Pelunasan</p>
                    <p className="text-sm font-black tracking-tight">{avgDuration} <span className="text-[10px] font-bold opacity-50 uppercase">Hari</span></p>
                  </div>
                  
                  <div className="w-px h-8 bg-white/10 mx-2" />
                  
                  <div className="flex-1 text-center">
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Kolektabilitas</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${collectability.label === 'Lancar' ? 'bg-green-400' : collectability.label === 'Diragukan' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
                      <p className={`text-sm font-black tracking-tight uppercase ${collectability.color}`}>{collectability.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="debt-chart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 shadow-xl mb-8 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tren Hutang</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Historis Kasbon Per Periode</p>
                </div>
                <div className="p-2 bg-red-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...debtPeriods].reverse().map(p => ({
                    period: `P${p.id}`,
                    total: p.totalBorrowed
                  }))}>
                    <defs>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-white/10">
                              <p className="text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">{payload[0].payload.period}</p>
                              <p className="text-xs font-black">Rp {formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorDebt)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-600" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Kasbon</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">
              {activeTab === 'riwayat' ? 'Riwayat Hutang' : 'Statistik Periode'}
            </h3>
            
            {activeTab === 'riwayat' ? (
              <div className="relative">
                <select 
                  value={selectedPeriodIndex}
                  onChange={(e) => setSelectedPeriodIndex(e.target.value)}
                  className="appearance-none bg-red-50/50 border border-red-100 rounded-lg pl-3 pr-8 py-1 text-[9px] font-black text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500/20 uppercase tracking-widest"
                >
                  <option value="all">Semua Riwayat</option>
                  {debtPeriods.map((p, i) => (
                    <option key={i} value={String(i)}>
                      Periode {p.id} ({p.status})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                   <ChevronDown className="w-2.5 h-2.5 text-red-400" />
                </div>
              </div>
            ) : (
              <Badge className="bg-red-50 text-red-600 border-none text-[8px] font-black uppercase tracking-widest">
                {debtPeriods.length} Periode
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {activeTab === 'riwayat' ? (
              filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        t.Tipe === 'TAMBAH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {t.Tipe === 'TAMBAH' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            {t.Tipe === 'TAMBAH' ? 'KASBON' : 'BAYAR'}
                          </p>
                          {t.Keterangan && t.Keterangan !== "-" && (
                             <span className="bg-slate-100 text-slate-500 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-slate-200/50 italic">
                               {t.Keterangan}
                             </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{t.Tanggal}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${
                        t.Tipe === 'TAMBAH' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {t.Tipe === 'TAMBAH' ? '+' : '-'}{formatCurrency(t.Jumlah)}
                      </p>
                    </div>

                    {/* Final Balance Micro-Ribbon Refined */}
                    <div className="absolute bottom-0 right-0 bg-slate-50/80 px-2.5 py-1 rounded-tl-2xl rounded-br-2xl border-t border-l border-slate-100 flex items-center justify-center min-w-[80px]">
                       <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.1em] whitespace-nowrap">Sisa Rp {formatCurrency(t.SaldoAkhir)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <History className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada riwayat hutang</p>
                  </div>
                </div>
              )
            ) : (
              /* Statistics View (Periods) */
              debtPeriods.length > 0 ? (
                debtPeriods.map((period, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <button 
                      onClick={() => setExpandedPeriod(expandedPeriod === i ? null : i)}
                      className="w-full p-5 text-left flex items-start gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        period.status === 'Lunas' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {period.status === 'Lunas' ? <CheckCircle2 className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                            period.status === 'Lunas' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Periode {period.id} ({period.status})
                          </p>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${expandedPeriod === i ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Kasbon</p>
                            <p className="text-sm font-black text-slate-900">Rp {formatCurrency(period.totalBorrowed)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lama Kasbon</p>
                            <p className="text-sm font-black text-slate-900">{period.durationDays} Hari</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                           <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                             {period.startDate} — {period.endDate}
                           </p>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedPeriod === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-2 bg-slate-50/30"
                        >
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Detail Mutasi Periode Ini</p>
                           {period.transactions.map((mt, j) => (
                              <div key={j} className="flex items-center justify-between py-2 border-b border-white last:border-0">
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-black text-slate-700 uppercase">{mt.Tipe === 'TAMBAH' ? 'KASBON' : 'BAYAR'}</p>
                                  <p className="text-[7px] font-bold text-slate-400">{mt.Tanggal}</p>
                                </div>
                                <p className={`text-[10px] font-black ${mt.Tipe === 'TAMBAH' ? 'text-red-600' : 'text-green-600'}`}>
                                  {mt.Tipe === 'TAMBAH' ? '+' : '-'}{formatCurrency(mt.Jumlah)}
                                </p>
                              </div>
                           ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
                  <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.2em]">Belum ada periode tuntas</p>
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>
    </ProtectedPage>

    {/* Bottom Navbar for Debt Detail */}
    {displayUser && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'riwayat' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-red-50' : 'bg-transparent'}`}>
            <History className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Riwayat</span>
        </button>
        <button 
          onClick={() => setActiveTab('statistik')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'statistik' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'statistik' ? 'bg-red-50' : 'bg-transparent'}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Statistik</span>
        </button>
      </div>
    )}
    </>
  );
};

const InvestasiPage = ({ user, transactions, customers }: { user: Customer | null, transactions: InvestmentTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const displayUser = customerName && customers 
    ? customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user
    : user;
  
  const userTransactions = transactions.filter(t => 
    t.Nama.toLowerCase() === displayUser?.Nama?.toLowerCase()
  );

  const sortedTransactions = [...userTransactions].sort((a, b) => {
    // Status "Aktif" first
    const statusA = a.Status.toLowerCase();
    const statusB = b.Status.toLowerCase();
    const isA_Aktif = statusA.includes("aktif") || statusA.includes("active");
    const isB_Aktif = statusB.includes("aktif") || statusB.includes("active");

    if (isA_Aktif && !isB_Aktif) return -1;
    if (!isA_Aktif && isB_Aktif) return 1;

    // Then by nearest maturity date
    const dateA = parseDateForProgress(a.JatuhTempo).getTime();
    const dateB = parseDateForProgress(b.JatuhTempo).getTime();
    return dateA - dateB;
  });

  const totalInvestasi = userTransactions
    .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => {
      const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
      return acc + estimate.total;
    }, 0);

  const activeCount = userTransactions.filter(t => {
    const s = t.Status.toLowerCase();
    return s.includes("aktif") || s.includes("active");
  }).length;

  const completedCount = userTransactions.length - activeCount;

  return (
    <ProtectedPage user={displayUser} title="Investasi">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 bg-slate-50 min-h-screen"
      >
        <div className="bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl opacity-30" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">{displayUser?.Nama}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Estimasi Portofolio</p>
              </div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-2xl rotate-12 -mr-2 -mt-2 group hover:rotate-0 transition-transform duration-500">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold opacity-40">Rp</span>
                  <h2 className="text-5xl font-black tracking-tighter tabular-nums leading-none drop-shadow-md">
                    {formatCurrency(totalInvestasi)}
                  </h2>
                </div>
              </div>
            </div>

            {/* Stats Summary Section */}
            <div className="mt-10 pt-6 border-t border-white/10 flex items-center">
              <div className="flex-1 text-center">
                <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Investasi Aktif</p>
                <p className="text-sm font-black tracking-tight">{activeCount} <span className="text-[10px] font-bold opacity-50 uppercase">Kontrak</span></p>
              </div>
              
              <div className="w-px h-8 bg-white/10 mx-2" />
              
              <div className="flex-1 text-center">
                <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Investasi Selesai</p>
                <p className="text-sm font-black tracking-tight">{completedCount} <span className="text-[10px] font-bold opacity-50 uppercase">Kontrak</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 pb-12">
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((t, i) => {
              const estimate = calculateEstimatedReturn(t.Nominal, t.Nisbah, t.Tanggal, t.JatuhTempo);
              const progress = calculateProgress(t.Tanggal, t.JatuhTempo);
              const invYear = parseDateForProgress(t.Tanggal).getFullYear();
              const invMonth = parseDateForProgress(t.Tanggal).getMonth() + 1;
              const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
              const refId = `INV-${String(i + 1).padStart(3, '0')}/WT/${romanMonths[invMonth - 1]}/${invYear}`;
              const isExpanded = expandedIndex === i;
              const statusLower = t.Status.toLowerCase();
              const isA_Aktif = statusLower.includes("aktif") || statusLower.includes("active");

              return (
                <div key={i} className="px-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="bg-white rounded-[2.5rem] text-slate-900 shadow-xl relative overflow-hidden cursor-pointer transition-all border border-slate-100"
                  >
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full -ml-16 -mb-16 blur-2xl opacity-50" />

                    <div className="p-7 space-y-8 relative z-10">
                      {/* Top Summary Row */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[8px] sm:text-[10px] font-black tracking-[0.1em] text-slate-400 uppercase truncate flex-1">{refId}</span>
                        {isA_Aktif ? (
                          <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[8px] sm:text-[9px] font-black py-1 px-3 rounded-full hover:bg-green-500/20 transition-colors uppercase tracking-widest whitespace-nowrap">
                            {t.Status.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 text-[8px] sm:text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest whitespace-nowrap">
                            SELESAI
                          </Badge>
                        )}
                      </div>
                      
                      {/* Estimate Section */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            {isA_Aktif ? "Estimasi Pengembalian Total" : "Sudah Dicairkan Ke Tabungan"}
                          </p>
                          <h4 className="text-4xl font-black tracking-tight tabular-nums text-[#6D28D9] font-black">Rp {formatCurrency(estimate.total)}</h4>
                          
                          {isA_Aktif && (
                            <div className="space-y-3 pt-2">
                              {t.Keterangan && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.Keterangan}</p>
                              )}
                              
                              {/* Progress Bar moved here */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[8px] font-black uppercase tracking-widest text-[#6D28D9]">Progress <span className="text-slate-400 ml-1">({progress}% Berjalan)</span></h5>
                                </div>
                                <div className="relative pt-0.5">
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 1.2, ease: "easeOut" }}
                                      className="h-full bg-[#6D28D9] rounded-full"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between opacity-60">
                                   <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Akad</span>
                                     <span className="text-[8px] font-black text-slate-900">{t.Tanggal}</span>
                                   </div>
                                   <div className="flex flex-col text-right">
                                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tempo</span>
                                     <span className="text-[8px] font-black text-slate-900">{t.JatuhTempo}</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                            <p className="text-[9px] font-bold text-slate-500">
                              {isA_Aktif 
                                ? (<>+Rp {formatCurrency(estimate.profit)} <span className="text-[#6D28D9] font-black">(Est. {estimate.rateYearly}% pertahun)</span></>)
                                : `Pada Tanggal ${t.JatuhTempo}`
                              }
                            </p>
                          </div>

                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className="cursor-pointer"
                          >
                            <ChevronDown className="w-5 h-5 text-[#6D28D9]" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Expansion Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-8">
                              {/* Integrated Progress Section - REMOVED from here as it is now below nominal */}

                              {/* Sharpened Detail Cards (Slightly off-white for depth) */}
                              <div className="space-y-3 pt-2">
                                <div className="bg-slate-50 rounded-xl p-5 shadow-sm flex items-center gap-4 border border-slate-100">
                                  <div className="flex-1 space-y-3">
                                    <h6 className="text-[11px] font-black text-[#6D28D9] uppercase tracking-widest">Pokok & Keuntungan</h6>
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <span className="text-[10px] font-bold text-slate-400">Nilai Pokok</span>
                                        <span className="text-[10px] font-black text-slate-800 tracking-tight text-lg">Rp {formatCurrency(t.Nominal)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">Bagi Hasil ({estimate.rateYearly}% pertahun)</span>
                                        <span className="text-[10px] font-black text-green-600">Rp {formatCurrency(estimate.profit)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-5 shadow-sm flex items-center gap-4 border border-slate-100">
                                  <div className="flex-1 space-y-3">
                                    <h6 className="text-[11px] font-black text-[#6D28D9] uppercase tracking-widest">Waktu Kontrak</h6>
                                    <div className="grid grid-cols-1 gap-2 text-slate-600">
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <span className="text-[10px] font-bold text-slate-400">Jangka Waktu</span>
                                        <span className="text-[10px] font-black tracking-tight">{t.Tenor}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">Masa Berakhir</span>
                                        <span className="text-[10px] font-black tracking-tight">{t.JatuhTempo}</span>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                                {!isA_Aktif && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const targetDate = parseDate(t.JatuhTempo);
                                        const monthVal = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                                        navigate(`/tabungan?month=${monthVal}`);
                                      }}
                                      className="w-full bg-[#6D28D9] text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-[#5b21b6] transition-all flex items-center justify-center mt-4 active:scale-[0.98]"
                                    >
                                      Cek Riwayat Tabungan
                                    </button>
                                )}

                                {!isA_Aktif && t.Keterangan && (
                                   <div className="px-5 py-4 bg-slate-100/50 border border-slate-200 rounded-xl">
                                      <p className="text-[10px] font-medium italic text-slate-500 leading-relaxed text-center">{t.Keterangan}</p>
                                    </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              );
            })


          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 border-dashed shadow-inner bg-slate-50/20">
              <div className="flex flex-col items-center gap-4 opacity-30">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-10 h-10 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Portofolio Kosong</p>
                  <p className="text-[10px] font-bold text-slate-400">Belum ada kontrak investasi aktif untuk saat ini</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const LainnyaPage = ({ user, transactions, customers }: { user: Customer | null, transactions: SalesTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const decodedName = customerName ? decodeURIComponent(customerName) : "";
  const isGeneral = decodedName.toLowerCase() === "pelanggan umum";
  
  const displayUser = customerName && customers 
    ? (isGeneral ? { Nama: "Pelanggan Umum" } as Customer : (customers.find(c => c.Nama.toLowerCase() === decodedName.toLowerCase()) || user))
    : user;
  
  const userTransactions = transactions.filter(t => {
    const tName = (t.Nama || "").toLowerCase().trim();
    const s = (t.Status || "").toUpperCase().trim();
    const statusMatch = s === "BELUM DIAMBIL" || s === "DIPROSES";
    
    if (isGeneral) {
      const isGeneralName = !tName || tName === "unknown" || tName === "pelanggan umum";
      return isGeneralName && statusMatch;
    }
    
    return tName === displayUser?.Nama?.toLowerCase() && statusMatch;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const diprosesTransactions = userTransactions.filter(t => (t.Status || "").toUpperCase().trim() === "DIPROSES");
  const belumDiambilTransactions = userTransactions.filter(t => (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL");

  const totalDiproses = diprosesTransactions.reduce((acc, curr) => acc + (curr.Pemasukan || 0), 0);
  const totalBelumDiambil = belumDiambilTransactions.reduce((acc, curr) => {
    const net = curr.HargaModal - curr.Sebagian;
    return acc + (net > 0 ? net : 0);
  }, 0);

  const totalLainnya = totalDiproses + totalBelumDiambil;

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
        <div className="bg-[#005E6A] rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-10 -left-10 opacity-10 rotate-12">
            <Layers className="w-48 h-48" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Pelanggan</p>
              <h3 className="text-xl font-black tracking-tight uppercase">{displayUser?.Nama}</h3>
            </div>
            
            <div className="mt-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F15A24] mb-2">Total Lainnya</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold opacity-40">Rp</span>
                <h2 className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                  {formatCurrency(totalLainnya)}
                </h2>
              </div>
              <div className="flex items-center mt-3 border-t border-white/10 pt-4">
                <div className="flex-1 text-center">
                  <p className="text-[7px] font-bold uppercase opacity-50 tracking-[0.2em] mb-1">Belum Diambil</p>
                  <p className="text-[11px] font-black tracking-tight">Rp {formatCurrency(totalBelumDiambil)}</p>
                </div>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <div className="flex-1 text-center">
                  <p className="text-[7px] font-bold uppercase opacity-50 tracking-[0.2em] mb-1">Diproses</p>
                  <p className="text-[11px] font-black tracking-tight">Rp {formatCurrency(totalDiproses)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pb-24">
          {diprosesTransactions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Daftar Diproses</h3>
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-full">
                  {diprosesTransactions.length} Item
                </span>
              </div>
              <div className="space-y-3">
                {diprosesTransactions.map((t, i) => (
                  <motion.div
                    key={`diproses-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedId(expandedId === `proses-${i}` ? null : `proses-${i}`)}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-[#005E6A] uppercase tracking-tight">{t.Jenis}</p>
                            <span className="bg-orange-100 text-orange-600 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-orange-200/50">
                              DIPROSES
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{getWaktuLabel(t.Tanggal)} • {t.Tanggal}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Nilai</p>
                            <p className="text-md font-black text-orange-600 leading-none">Rp {formatCurrency(t.Pemasukan)}</p>
                          </div>
                          <div className="opacity-20 group-hover:opacity-40 transition-opacity">
                            {expandedId === `proses-${i}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === `proses-${i}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-stretch gap-6 pt-4 border-t border-slate-50">
                              <div className="flex-1">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keterangan</p>
                                <p className="text-xs font-black text-slate-700 uppercase">{t.Melalui}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {belumDiambilTransactions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">Daftar Belum Diambil</h3>
                <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded-full">
                  {belumDiambilTransactions.length} Item
                </span>
              </div>
              <div className="space-y-3">
                {belumDiambilTransactions.map((t, i) => (
                  <motion.div
                    key={`belum-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedId(expandedId === `belum-${i}` ? null : `belum-${i}`)}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-[#005E6A] uppercase tracking-tight">{t.Jenis}</p>
                            <span className="bg-slate-100 text-slate-500 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-slate-200/50">
                              {t.Melalui}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{getWaktuLabel(t.Tanggal)} • {t.Tanggal}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[7px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Sisa</p>
                            <p className="text-md font-black text-teal-600 leading-none">Rp {formatCurrency(t.HargaModal - t.Sebagian)}</p>
                          </div>
                          <div className="opacity-20 group-hover:opacity-40 transition-opacity">
                            {expandedId === `belum-${i}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === `belum-${i}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-stretch gap-6 pt-4 border-t border-slate-50">
                              <div className="flex-1">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nominal Transaksi</p>
                                <p className="text-xs font-black text-slate-700">Rp {formatCurrency(t.Pemasukan)}</p>
                              </div>
                              <div className="w-px bg-slate-100 self-stretch" />
                              <div className="flex-1">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Biaya & Potongan</p>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-red-500">Admin: Rp {formatCurrency(t.Pemasukan - t.HargaModal)}</p>
                                  {t.Sebagian > 0 && (
                                    <p className="text-[9px] font-bold text-orange-500">Diambil: Rp {formatCurrency(t.Sebagian)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {userTransactions.length === 0 && (
            <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100">
              <div className="flex flex-col items-center gap-4 opacity-30">
                <History className="w-12 h-12 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400">Tidak ada riwayat transaksi aktif</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const AdminReportPage = ({ transactions }: { transactions: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

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

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

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
      return isGeneral && (s.includes('belum') || s.includes('ambil') || s.includes('proses'));
    })
    .reduce((acc, t) => {
      const s = (t.Status || "").toUpperCase().trim();
      if (s === "DIPROSES") {
        return acc + (t.Pemasukan || 0);
      }
      return acc + ((t.HargaModal || 0) - (t.Sebagian || 0));
    }, 0);
  
  const totalLainnya = totalLainnyaFromCustomers + totalLainnyaFromGeneral;

  const assetData = [
    { name: 'Tabungan', value: totalTabungan, color: '#00FF00', path: '/admin/savings' },
    { name: 'Investasi', value: totalInvestasi, color: '#7000FF', path: '/admin/investment' },
    { name: 'Hutang', value: totalHutang, color: '#FF005C', path: '/admin/debt' },
    { name: 'Lainnya', value: totalLainnya, color: '#0075FF', path: '/admin/others' }
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

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_session");
    navigate("/");
  };

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
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/70 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Beranda</span>
            </button>
            <button 
              onClick={handleAdminLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 px-4 py-2 rounded-xl border border-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-100" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-100">Keluar Admin</span>
            </button>
          </div>
          
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
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5" />
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
  onItemClick,
  stats,
  showLegend = true,
  showBadges = true,
  extraContent
}: { 
  title: string, 
  subtitle: string, 
  totalLabel: string, 
  totalValue: number, 
  items: { 
    name: string, 
    value: number, 
    subtext?: string, 
    isHeader?: boolean,
    color?: string,
    badge?: { label: string, colorClass: string, iconColorClass?: string, customIconColor?: string } 
  }[],
  icon: any,
  colorClass: string,
  onItemClick?: (name: string) => void,
  stats?: { label: string, value: number, count: number, color: string }[],
  showLegend?: boolean,
  showBadges?: boolean,
  extraContent?: React.ReactNode
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
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">{title}</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
          {stats ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start px-2 mt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{totalLabel}</p>
                  <h3 className="text-sm font-black text-[#005E6A]">Rp {totalValue.toLocaleString('id-ID')}</h3>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Orang</p>
                  <h3 className="text-sm font-black text-[#F15A24]">{items.filter(i => !i.isHeader).length} Orang</h3>
                </div>
              </div>

              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-50">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{data.label}</p>
                              <p className="text-xs font-black text-[#005E6A]">Rp {data.value.toLocaleString('id-ID')}</p>
                              <p className="text-[7px] font-bold text-slate-500">{data.count} Orang</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {extraContent && (
                <div className="flex justify-center -mt-2 pb-2">
                  {extraContent}
                </div>
              )}

              {showLegend && (
                <div className="flex flex-col gap-3 border-t border-slate-50 pt-5 pr-4">
                  {stats.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-[#005E6A]"><span className="text-[7px] text-slate-400 font-bold mr-1">{s.count}</span> {s.count > 0 ? (s.label.includes("Pelanggan") || s.label.includes("Orang") ? "" : "Orang") : "Orang"}</p>
                        <p className="text-[10px] font-black text-[#005E6A] min-w-[80px] text-right">Rp {s.value.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{totalLabel}</p>
              <h3 className={`text-2xl font-black ${colorClass}`}>Rp {totalValue.toLocaleString('id-ID')}</h3>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider px-2">Daftar Rincian</h3>
          <div className="grid gap-3">
            {items.map((item, i) => (
              <React.Fragment key={i}>
                {item.isHeader ? (
                  <div className="mt-6 mb-2 px-2">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="flex-shrink-0">{item.name}</span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </h4>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onItemClick && onItemClick(item.name)}
                    className={`bg-white px-4 py-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden ${onItemClick ? 'cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color ? '' : (item.badge?.iconColorClass ? item.badge.iconColorClass : 'bg-slate-50 text-slate-400 opacity-20')}`}
                        style={item.color ? { backgroundColor: `${item.color}15`, color: item.color } : (item.badge?.customIconColor ? { backgroundColor: `${item.badge.customIconColor}15`, color: item.badge.customIconColor } : {})}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[#005E6A] uppercase leading-none">{item.name}</p>
                        {item.subtext && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">{item.subtext}</p>}
                      </div>
                    </div>
                    
                    <p className={`text-[13px] font-black ${colorClass} leading-none`}>Rp {item.value.toLocaleString('id-ID')}</p>
                    
                    {item.badge && showBadges && (
                      <div 
                        className={`absolute bottom-0 right-0 ${item.badge.colorClass.includes('bg-[') ? '' : item.badge.colorClass.replace(/text-[\w-]+/, 'text-white')} w-[140px] py-1 rounded-tl-xl shadow-sm text-center px-2`}
                        style={item.badge.colorClass.includes('bg-[') ? { backgroundColor: item.badge.customIconColor } : {}}
                      >
                        <p className="text-[5.5px] font-black uppercase tracking-wider text-white">
                          {item.badge.label}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </React.Fragment>
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

const AdminSavingsManagement = ({ customers, transactions }: { customers: Customer[], transactions: SavingTransaction[] }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  
  const CHART_COLORS = [
    "#FF00ED", "#00F0FF", "#FFE600", "#00FF00", "#FF5C00", 
    "#7000FF", "#00FF94", "#FF005C", "#0075FF", "#FFA800"
  ];

  const items = customers
    .filter(c => parseCurrency(c.Tabungan) > 0)
    .sort((a, b) => parseCurrency(b.Tabungan) - parseCurrency(a.Tabungan))
    .map((c, idx) => {
      const val = parseCurrency(c.Tabungan);
      const color = CHART_COLORS[idx % CHART_COLORS.length];

      // Find latest transaction for this customer
      const userTransactions = transactions
        .filter(t => t.Nama.toLowerCase() === c.Nama.toLowerCase())
        .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
      
      const latestTx = userTransactions[0];
      let badgeLabel = `Simpanan: Rp ${val.toLocaleString('id-ID')}`;
      let ribbonColor = color;
      let isDefaultBadge = true;
      
      if (latestTx) {
        const timeStr = getRelativeTime(latestTx.Tanggal);
        const actionStr = latestTx.Tipe.toLowerCase();
        badgeLabel = `${timeStr} ${actionStr} Rp ${latestTx.Nominal.toLocaleString('id-ID')}`;
        ribbonColor = actionStr === 'setor' ? "#22c55e" : "#ef4444";
        isDefaultBadge = false;
      }

      return { 
        name: c.Nama, 
        value: val,
        color,
        badge: {
          label: badgeLabel,
          colorClass: isDefaultBadge ? "bg-slate-100 text-slate-600" : `bg-[${ribbonColor}] text-white`,
          iconColorClass: `bg-opacity-10`,
          customIconColor: isDefaultBadge ? color : ribbonColor
        }
      };
    });

  const stats = items.map(item => ({
    label: item.name,
    value: item.value,
    count: 1,
    color: item.color
  }));

  const handleItemClick = (name: string) => {
    navigate(`/tabungan/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Manajemen Tabungan"
      subtitle="Total Tabungan Seluruh Pelanggan"
      totalLabel="Total Tabungan"
      totalValue={total}
      items={items}
      icon={Wallet}
      colorClass="text-[#F15A24]"
      onItemClick={handleItemClick}
      stats={stats}
      showLegend={false}
      showBadges={true}
    />
  );
};

const AdminInvestmentManagement = ({ customers }: { customers: Customer[] }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Investasi), 0);
  
  const CHART_COLORS = [
    "#FF00ED", "#00F0FF", "#FFE600", "#00FF00", "#FF5C00", 
    "#7000FF", "#00FF94", "#FF005C", "#0075FF", "#FFA800"
  ];

  const items = customers
    .filter(c => parseCurrency(c.Investasi) > 0)
    .sort((a, b) => parseCurrency(b.Investasi) - parseCurrency(a.Investasi))
    .map((c, idx) => {
      const val = parseCurrency(c.Investasi);
      const color = CHART_COLORS[idx % CHART_COLORS.length];

      return { 
        name: c.Nama, 
        value: val,
        color,
        badge: {
          label: `Investasi: Rp ${val.toLocaleString('id-ID')}`,
          colorClass: `bg-slate-100 text-slate-600`,
          iconColorClass: `bg-opacity-10`,
          customIconColor: color
        }
      };
    });

  const stats = items.map(item => ({
    label: item.name,
    value: item.value,
    count: 1,
    color: item.color || "#ccc"
  }));

  const handleItemClick = (name: string) => {
    navigate(`/investasi/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Manajemen Investasi"
      subtitle="Total Investasi Seluruh Pelanggan"
      totalLabel="Total Investasi"
      totalValue={total}
      items={items}
      icon={TrendingUp}
      colorClass="text-[#F15A24]"
      onItemClick={handleItemClick}
      stats={stats}
      showLegend={false}
      showBadges={false}
    />
  );
};

const AdminCustomerManagement = ({ customers, transactions, redeemedPoints }: { customers: Customer[], transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

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
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">Manajemen Pelanggan</h1>
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

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Hutang), 0);
  const CHART_COLORS = ["#22c55e", "#eab308", "#ef4444"]; // Updated to leaf green
  const stats = [
    { label: "Lancar", value: 0, count: 0, color: "#22c55e" }, // Leaf Green
    { label: "Diragukan", value: 0, count: 0, color: "#FFE600" }, // Neon Yellow
    { label: "Macet", value: 0, count: 0, color: "#FF005C" } // Neon Pink/Red
  ];

  const items = customers
    .filter(c => parseCurrency(c.Hutang) > 0)
    .map(c => {
      const userTransactions = transactions.filter(t => t.Nama.toLowerCase() === c.Nama.toLowerCase());
      const collectResult = calculateUserCollectability(userTransactions);
      
      const debtVal = parseCurrency(c.Hutang);
      
      // Update stats
      if (collectResult.label === "Lancar") {
        stats[0].value += debtVal;
        stats[0].count += 1;
      } else if (collectResult.label === "Diragukan") {
        stats[1].value += debtVal;
        stats[1].count += 1;
      } else if (collectResult.label === "Macet") {
        stats[2].value += debtVal;
        stats[2].count += 1;
      }

      const latestDateStr = userTransactions.length > 0 
        ? userTransactions.sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())[0].Tanggal
        : "-";
      
      const tierColor = collectResult.label === "Lancar" ? "#22c55e" : collectResult.label === "Diragukan" ? "#FFE600" : "#FF005C";
      
      return { 
        name: c.Nama, 
        value: debtVal,
        date: parseDate(latestDateStr),
        subtext: latestDateStr !== "-" ? getRelativeTime(latestDateStr) : "",
        badge: { 
          label: `Kolektabilitas ${collectResult.label}`, 
          colorClass: `bg-[${tierColor}] text-white`,
          iconColorClass: `bg-opacity-10`,
          customIconColor: tierColor
        },
        sortOrder: collectResult.sortOrder
      };
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.date.getTime() - a.date.getTime();
    });

  const handleItemClick = (name: string) => {
    navigate(`/hutang/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Manajemen Hutang"
      subtitle="Total Hutang Seluruh Pelanggan"
      totalLabel="Total Hutang"
      totalValue={total}
      items={items}
      icon={Receipt}
      colorClass="text-[#F15A24]"
      onItemClick={handleItemClick}
      stats={stats.filter(s => s.count > 0)}
      showBadges={true}
    />
  );
};

const AdminOthersManagement = ({ transactions, customers }: { transactions: SalesTransaction[], customers: Customer[] }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const { items, total, chartStats, summaryContent } = useMemo(() => {
    // 1. Calculate Belum Diambil List
    const belumCustomersList = customers
      .filter(c => transactions.some(t => {
        const nameMatch = t.Nama?.toLowerCase() === c.Nama.toLowerCase();
        const statusMatch = (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL";
        return nameMatch && statusMatch;
      }))
      .map(c => {
        const userTx = transactions.filter(t => t.Nama?.toLowerCase() === c.Nama.toLowerCase() && (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL");
        const val = userTx.reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);
        return { name: c.Nama, value: val };
      })
      .filter(item => item.value > 0);

    const belumGeneral = transactions
      .filter(t => {
        const name = (t.Nama || "").toLowerCase().trim();
        const isGeneral = !name || name === "unknown" || name === "pelanggan umum";
        return isGeneral && (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL";
      });
    
    if (belumGeneral.length > 0) {
      const val = belumGeneral.reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);
      if (val > 0) belumCustomersList.push({ name: "Pelanggan Umum", value: val });
    }

    // 2. Calculate Diproses List
    const prosesCustomersList = customers
      .filter(c => transactions.some(t => {
        const nameMatch = t.Nama?.toLowerCase() === c.Nama.toLowerCase();
        const statusMatch = (t.Status || "").toUpperCase().trim() === "DIPROSES";
        return nameMatch && statusMatch;
      }))
      .map(c => {
        const userTx = transactions.filter(t => t.Nama?.toLowerCase() === c.Nama.toLowerCase() && (t.Status || "").toUpperCase().trim() === "DIPROSES");
        const val = userTx.reduce((acc, t) => acc + (t.Pemasukan || 0), 0);
        return { name: c.Nama, value: val };
      })
      .filter(item => item.value > 0);

    const prosesGeneral = transactions
      .filter(t => {
        const name = (t.Nama || "").toLowerCase().trim();
        const isGeneral = !name || name === "unknown" || name === "pelanggan umum";
        return isGeneral && (t.Status || "").toUpperCase().trim() === "DIPROSES";
      });

    if (prosesGeneral.length > 0) {
      const val = prosesGeneral.reduce((acc, t) => acc + (t.Pemasukan || 0), 0);
      if (val > 0) prosesCustomersList.push({ name: "Pelanggan Umum", value: val });
    }

    const sortedBelum = [...belumCustomersList].sort((a,b) => b.value - a.value);
    const sortedProses = [...prosesCustomersList].sort((a,b) => b.value - a.value);

    const finalItems: any[] = [];
    if (sortedBelum.length > 0) {
      finalItems.push({ name: 'Belum Diambil', value: 0, isHeader: true });
      sortedBelum.forEach(item => {
        finalItems.push({
          ...item,
          color: "#0d9488",
          badge: {
            label: `Rp ${item.value.toLocaleString('id-ID')}`,
            colorClass: "bg-teal-50 text-teal-600",
            customIconColor: "#0d9488"
          }
        });
      });
    }
    if (sortedProses.length > 0) {
      finalItems.push({ name: 'Diproses', value: 0, isHeader: true });
      sortedProses.forEach(item => {
        finalItems.push({
          ...item,
          color: "#ea580c",
          badge: {
            label: `Rp ${item.value.toLocaleString('id-ID')}`,
            colorClass: "bg-orange-50 text-orange-600",
            customIconColor: "#ea580c"
          }
        });
      });
    }

    const totalValue = sortedBelum.reduce((acc, i) => acc + i.value, 0) + sortedProses.reduce((acc, i) => acc + i.value, 0);
    const belumTotalValue = sortedBelum.reduce((acc, i) => acc + i.value, 0);
    const prosesTotalValue = sortedProses.reduce((acc, i) => acc + i.value, 0);

    const CHART_COLORS = ["#FF00ED", "#00F0FF", "#FFE600", "#00FF00", "#FF5C00", "#7000FF", "#00FF94", "#FF005C", "#0075FF", "#FFA800"];
    const totalsByName: Record<string, number> = {};
    [...sortedBelum, ...sortedProses].forEach(i => {
      totalsByName[i.name] = (totalsByName[i.name] || 0) + i.value;
    });
    const sortedChart = Object.entries(totalsByName).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const stats = sortedChart.map(([name, val], idx) => ({
      label: name,
      value: val,
      count: 1,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    const summaryContent = (
      <div className="flex items-center justify-between w-full px-4 border-t border-slate-50 pt-4 mt-2">
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Belum Diambil</p>
          <p className="text-[12px] font-black text-teal-600 leading-none">Rp {belumTotalValue.toLocaleString('id-ID')}</p>
        </div>
        <div className="w-[1px] h-8 bg-slate-100 flex-shrink-0" />
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Diproses</p>
          <p className="text-[12px] font-black text-orange-600 leading-none">Rp {prosesTotalValue.toLocaleString('id-ID')}</p>
        </div>
      </div>
    );

    return { items: finalItems, total: totalValue, chartStats: stats, summaryContent };
  }, [transactions, customers]);

  const handleItemClick = (name: string) => {
    navigate(`/lainnya/${encodeURIComponent(name)}`);
  };

  return (
    <AdminManagementPage 
      title="Manajemen Lainnya"
      subtitle="Belum Diambil & Diproses"
      totalLabel="Estimasi Nilai Total"
      totalValue={total}
      items={items}
      icon={ShoppingBag}
      colorClass="text-[#005E6A]"
      onItemClick={handleItemClick}
      stats={chartStats}
      showLegend={false}
      showBadges={false}
      extraContent={summaryContent}
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
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
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
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 mb-4 relative group flex items-center justify-center">
            <User className="w-12 h-12 text-slate-400" />
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
              <Trophy className="w-4 h-4 text-[#F15A24] fill-[#F15A24]" />
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Level Pelanggan</p>
            <p className="text-[10px] font-black text-[#F15A24] uppercase tracking-tight">{customerLevel.name}</p>
          </div>
          <div 
            onClick={() => navigate("/poin")}
            className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center gap-1 group hover:border-teal-100 transition-colors cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
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
  const { subPage, customerName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (customerName && customers.length > 0 && !loggedInUser) {
      const user = customers.find(c => c.Nama.toLowerCase() === customerName.toLowerCase());
      if (user) {
        onLogin(user);
        
        if (subPage === 'tabungan') {
          navigate('/tabungan', { replace: true });
        } else if (subPage === 'hutang') {
          navigate('/hutang', { replace: true });
        } else if (subPage === 'lainnya') {
          navigate('/lainnya', { replace: true });
        } else if (subPage === 'investasi') {
          navigate('/investasi', { replace: true });
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("warung_tomi_user");
    if (savedUser) setLoggedInUser(JSON.parse(savedUser));

    const fetchData = async (showLoading = true) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isFetching.current = true;
      if (showLoading) setIsLoading(true);
      try {
        const urls = [
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vS89JF6HJLZL4wD5YRvaEqqY2nF_VvKmzfKHzrP19PYZnGFudVzpzD94WWC0ueb35rJFCEs7OtEX083/pub?gid=0&single=true&output=csv",
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwjRmZLCREHIEg4LlJwM_AT7WDpG808cxzY5C5IvKIsK920oQbiSPSSegEvyTD330DvVH0kswepwIE/pub?gid=1607784622&single=true&output=csv",
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBQ5kUdqwv5bBsJcaiponYzqU_JxO0g7qQb6DQ1ujJ9bzTkY5GlI5XQQXL9BVr22gdmM7V7eEIDMH9/pub?gid=799157484&single=true&output=csv",
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQstrKWGJQeYcF3s_GNBSzB4q-PhQ7R4s4Gc-xy5F428uRbVjdf8c4bboL7JfIX5j1a0n-_FJGvPk7Q/pub?gid=2112924939&single=true&output=csv",
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCGVNALfAsaaLVyQx0halDo9U3Gk_QFEEEY96Zai9cTD4nfW5dQR8IWYig1-Cks01F08PjVVv-KDsW/pub?gid=526494903&single=true&output=csv",
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTkme-_goN5R1iYP1oL_He5XOk1jWsnOBiCftzxwKCCQ7q9HO0pyjNBrsjYTOlzrAo_AQcpYmq6owPl/pub?gid=1420871988&single=true&output=csv"
        ];
        const cacheBuster = `&t=${Date.now()}`;
        const responses = await Promise.all(urls.map(url => fetch(url + cacheBuster, { signal: controller.signal })));
        const csvs = await Promise.all(responses.map(res => res.text()));
        if (controller.signal.aborted) return;

        const parseCsv = (csv: string): Promise<any[]> => new Promise(resolve => {
          Papa.parse(csv, { header: true, skipEmptyLines: true, complete: results => resolve(results.data), error: () => resolve([]) });
        });
        const [cData, sData, iData, hData, salesData, rData] = await Promise.all(csvs.map(parseCsv));
        if (controller.signal.aborted) return;

        const processedRedeemedPoints: RedeemedPoint[] = rData.map(r => {
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

        Papa.parse(csvs[0], {
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
                    const userTransactions = sData.filter(s => {
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
                      const beritaKey = Object.keys(t).find(k => k.toLowerCase().trim().includes('berita') || k.toLowerCase().trim().includes('ket') || k.toLowerCase().trim().includes('memo'));
                      
                      if (tipeKey && nominalKey) {
                        const tipe = String(t[tipeKey]).trim().toUpperCase();
                        const nominalStr = String(t[nominalKey]).replace(/[^\d]/g, '');
                        const nominal = parseInt(nominalStr) || 0;
                        const tanggal = tanggalKey ? String(t[tanggalKey]).trim() : "-";
                        const berita = beritaKey ? String(t[beritaKey]).trim() : "";

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
                          SaldoAkhir: runningBalance,
                          Berita: berita
                        });
                      }
                    });

                    allSavingsTransactions.push(...transactions);

                    // Calculate Investasi
                    const userInvestasi = iData.filter(i => {
                      const iNamaKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('nama'));
                      return iNamaKey && String(i[iNamaKey]).trim().toLowerCase() === name.toLowerCase();
                    });
                    
                    const iTransactions: InvestmentTransaction[] = userInvestasi.map(i => {
                      const tanggalKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                      const nominalKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('diterima') || k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('jumlah'));
                      const tenorKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('tenor'));
                      const jatuhTempoKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('jatuh tempo'));
                      const statusKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('status'));
                      const keteranganKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('keterangan') || k.toLowerCase().trim().includes('catatan'));
                      const nisbahKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('nisbah') || k.toLowerCase().trim().includes('bunga') || k.toLowerCase().trim().includes('profit'));
                      
                      const nominalStr = nominalKey ? String(i[nominalKey]).replace(/[^\d]/g, '') : "0";
                      const nominal = parseInt(nominalStr) || 0;
                      
                      return {
                        Tanggal: tanggalKey ? String(i[tanggalKey]).trim() : "-",
                        Nama: name,
                        Nominal: nominal,
                        Tenor: tenorKey ? String(i[tenorKey]).trim() : "-",
                        JatuhTempo: jatuhTempoKey ? String(i[jatuhTempoKey]).trim() : "-",
                        Status: statusKey ? String(i[statusKey]).trim() : "Aktif",
                        Keterangan: keteranganKey ? String(i[keteranganKey]).trim() : undefined,
                        Nisbah: nisbahKey ? String(i[nisbahKey]).trim() : undefined
                      };
                    });
                    
                    allInvestmentTransactions.push(...iTransactions);
                    
                    let totalInvestasi = iTransactions
                      .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
                      .reduce((acc, curr) => acc + curr.Nominal, 0);

                    // Calculate Hutang
                    const userHutangData = hData.filter(h => {
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

                    // Calculate Lainnya (Belum Diambil & Diproses)
                    const userLainnya = userSalesTransactions
                      .filter(t => {
                        const s = (t.Status || "").toLowerCase().trim();
                        return s.includes('belum') || s.includes('ambil') || s.includes('proses');
                      })
                      .reduce((acc, t) => {
                        const s = (t.Status || "").toUpperCase().trim();
                        if (s === "DIPROSES") {
                          return acc + (t.Pemasukan || 0);
                        }
                        return acc + ((t.HargaModal || 0) - (t.Sebagian || 0));
                      }, 0);

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
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error fetching data:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          isFetching.current = false;
          setIsLoading(false);
        }
      }
    };
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000); // Poll every 10 seconds
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
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
        <Route path="/:subPage/:customerName" element={
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
        <Route path="/tabungan" element={
          <SavingsDetailPage user={loggedInUser} transactions={savingsTransactions} />
        } />
        <Route path="/tabungan/:customerName" element={
          <SavingsDetailPage user={loggedInUser} transactions={savingsTransactions} customers={customers} />
        } />
        <Route path="/hutang" element={
          <DebtDetailPage user={loggedInUser} transactions={debtTransactions} />
        } />
        <Route path="/hutang/:customerName" element={
          <DebtDetailPage user={loggedInUser} transactions={debtTransactions} customers={customers} />
        } />
        <Route path="/lainnya" element={
          <LainnyaPage user={loggedInUser} transactions={salesTransactions} />
        } />
        <Route path="/lainnya/:customerName" element={
          <LainnyaPage user={loggedInUser} transactions={salesTransactions} customers={customers} />
        } />
        <Route path="/investasi" element={
          <InvestasiPage user={loggedInUser} transactions={investmentTransactions} />
        } />
        <Route path="/investasi/:customerName" element={
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
        <Route path="/admin/savings" element={<AdminSavingsManagement customers={customers} transactions={savingsTransactions} />} />
        <Route path="/admin/investment" element={<AdminInvestmentManagement customers={customers} />} />
        <Route path="/admin/debt" element={<AdminDebtManagement customers={customers} transactions={debtTransactions} />} />
        <Route path="/admin/others" element={<AdminOthersManagement transactions={salesTransactions} customers={customers} />} />
      </Routes>
    </BrowserRouter>
  );
}
