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
  Copy,
  LayoutGrid,
  Save,
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
  HelpCircle,
  Calendar,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  UserPlus,
  FileSpreadsheet,
  MessageCircle,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Html5QrcodeScanner } from "html5-qrcode";

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

const qrisUrl = "https://lh3.googleusercontent.com/d/1P7Itn82Za-1G1a_4wpEa5BmarzCPvtn_";

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

interface StockItem {
  id: string;
  Nama: string;
  Kategori: string;
  Stok: number;
  Satuan: string;
  MinStok: number;
  HargaModal: number;
  HargaJual: number;
  UpdateTerakhir: string;
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
  { id: 2, name: "QRIS", icon: <QrCode className="w-6 h-6 text-purple-600" />, bgColor: "bg-[#F3E8FF]" },
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
];

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
          <Link to="/" className="flex items-center gap-3 group cursor-pointer w-fit" onClick={() => setActiveTab("beranda")}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
                alt="Warung Tomi Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black tracking-tighter text-[#005E6A] group-hover:text-[#F15A24] transition-colors">WARUNG</span>
                <span className="text-lg font-black tracking-tighter text-[#F15A24] group-hover:text-[#005E6A] transition-colors">TOMI</span>
              </div>
              <div className="flex justify-between w-full px-0.5 mt-[-2px] opacity-60 group-hover:opacity-100 transition-opacity">
                {"Digital Solution".split("").map((char, i) => (
                  <span key={i} className="text-[6.5px] font-black text-muted-foreground tracking-widest uppercase leading-none">
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </div>
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
  const filteredData = currentStageData.filter(k => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const words = k.nama.toLowerCase().split(/\s+/);
    return words.some(word => word.startsWith(query)) || k.nama.toLowerCase().startsWith(query);
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  const totalDana = currentStageData.reduce((acc, k) => acc + k.pkh + k.bpnt, 0);
  const totalKPM = currentStageData.length;

  const trendData = React.useMemo(() => {
    return [1, 2, 3, 4].map(id => ({
      stage: `Tahap ${id}`,
      count: processedData[id]?.length || 0,
      period: id === 1 ? "Jan-Mar" : id === 2 ? "Apr-Jun" : id === 3 ? "Jul-Sep" : "Okt-Des"
    }));
  }, [processedData]);

  const [showPKHInfo, setShowPKHInfo] = useState(false);

  const foundKPM = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query.length < 3) return null;
    return currentStageData.find(k => {
      const words = k.nama.toLowerCase().split(/\s+/);
      return words.some(word => word.startsWith(query)) || k.nama.toLowerCase().startsWith(query);
    });
  }, [searchQuery, currentStageData]);

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

        {/* Tren KPM Chart */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Tren Penerima (KPM)</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Statistik Per Tahap {targetYear}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#F15A24]" />
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F15A24" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#F15A24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#64748B' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-xl border border-slate-100 text-[8px] font-black">
                          <p className="text-[#F15A24]">{payload[0].value} ORANG</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#F15A24" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#005E6A] p-1 rounded-xl flex mb-6 border border-slate-100 overflow-x-auto no-scrollbar">
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
                  ? "bg-white text-[#005E6A] shadow-sm" 
                  : "text-white/60 hover:text-white"
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

        {/* Search Widget "Cek Nama Anda" */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-orange-100 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
            <Search className="w-20 h-20 text-[#F15A24]" />
          </div>
          <h3 className="text-[10px] font-black text-[#F15A24] uppercase tracking-widest mb-4">Cek Nama Anda</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text"
              placeholder="Masukan nama lengkap Anda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-tight focus:outline-none focus:border-[#F15A24]/20 transition-all shadow-inner"
            />
          </div>

          <AnimatePresence>
            {foundKPM && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-green-600 uppercase">Terdaftar Penerima</p>
                    <p className="text-[11px] font-black text-[#005E6A] uppercase">{foundKPM.nama}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Total Bantuan</p>
                  <p className="text-[11px] font-black text-green-600">Rp {(foundKPM.pkh + foundKPM.bpnt).toLocaleString('id-ID')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm no-scrollbar bg-white mb-8">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-3 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">No.</th>
                <th className="px-3 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Nama KPM</th>
                <th className="px-3 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    PKH
                    <button onClick={() => setShowPKHInfo(true)}>
                      <HelpCircle className="w-2.5 h-2.5 text-[#005E6A]" />
                    </button>
                  </div>
                </th>
                <th className="px-3 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">BPNT</th>
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

        {/* Bantuan Button */}
        <a 
          href={`https://wa.me/6281313433367?text=Halo%20Admin%20Warung%20Tomi,%20saya%20ingin%20menanyakan%20status%20bansos%20atas%20nama%20...`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg shadow-green-100 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Lapor Kendala Bansos</span>
        </a>
      </div>

      {/* PKH Info Modal */}
      <AnimatePresence>
        {showPKHInfo && (
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
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6 text-[#005E6A]" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-4">Informasi Dana PKH</h3>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6">
                Nominal PKH berbeda untuk setiap KPM karena bergantung pada komponen keluarga:
              </p>
              <ul className="space-y-2 mb-8">
                {["Anak Sekolah (SD, SMP, SMA)", "Balita / Ibu Hamil", "Lansia / Disabilitas"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[9px] font-black text-slate-400 bg-slate-50 p-2 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {item.toUpperCase()}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setShowPKHInfo(false)}
                className="w-full bg-[#005E6A] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 transition-transform active:scale-95"
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              if (currentSlide === 2) navigate("/poin");
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
                if (service.name === "Investasi") navigate("/investasi");
                else if (service.name === "Tabungan") navigate("/tabungan");
                else if (service.name === "Poin Loyalitas") navigate("/poin");
                else if (service.name === "QRIS") navigate("/qris");
                else if (service.name === "Tarik Tunai") navigate("/tariktunai");
                else if (service.id === 1) navigate("/admin");
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

      {/* Contact & Location Section - Redesigned for Simplicity & Elegance */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-[#005E6A] uppercase tracking-tight">Kunjungi Kami</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Layanan Offline Warung Tomi</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
            <MapPin className="w-5 h-5 text-[#005E6A]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4F5] flex items-center justify-center shrink-0 border border-[#005E6A]/10">
              <MapPin className="w-4 h-4 text-[#005E6A]" />
            </div>
            <div>
              <p className="text-[8px] font-black text-[#005E6A] uppercase tracking-widest mb-1 grayscale opacity-50">Lokasi Toko</p>
              <p className="text-[11px] text-slate-700 font-bold leading-relaxed max-w-[200px]">
                Dusun Manis, RT009/RW005, Desa Wilanagara, Kec. Luragung, Kuningan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] flex items-center justify-center shrink-0 border border-[#F15A24]/10">
              <Phone className="w-4 h-4 text-[#F15A24]" />
            </div>
            <div>
              <p className="text-[8px] font-black text-[#F15A24] uppercase tracking-widest mb-1 grayscale opacity-50">WhatsApp Center</p>
              <p className="text-[11px] text-slate-700 font-black">087774138090</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 grayscale opacity-50">Jam Operasional</p>
              <p className="text-[11px] text-slate-700 font-black">Setiap Hari: 06:00 - 22:00 WIB</p>
            </div>
          </div>
        </div>

        <button 
          className="w-full mt-8 bg-[#005E6A] text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-[#005E6A]/10 flex items-center justify-center gap-2 transition-all active:scale-95 group"
          onClick={() => window.open('https://maps.app.goo.gl/bnUitCFdP5sgqiw49', '_blank')}
        >
          <MapPin className="w-4 h-4 group-hover:animate-bounce" />
          <span>Lihat di Peta</span>
          <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity ml-1" />
        </button>
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
  setActiveTab,
  allowGuest = false
}: { 
  user: Customer | null, 
  children: React.ReactNode,
  title: string,
  customers?: Customer[],
  onLogin?: (user: Customer) => void,
  setActiveTab?: (id: string) => void,
  allowGuest?: boolean
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

  if (!user && !allowGuest) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-6 py-12 flex flex-col items-center min-h-[80vh]"
      >
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border-4 border-slate-50 overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
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

const LoyaltyPointsPage = ({ user, customers, transactions, redeemedPoints }: { user: Customer | null, customers: Customer[], transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab ] = useState<"HADIAH" | "CARA">("HADIAH");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  const activePoints = useMemo(() => {
    if (!user) return 0;
    return calculateActivePoints(user.Nama, transactions, redeemedPoints);
  }, [user, transactions, redeemedPoints]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const filtered = customers.filter(c => 
        c.Nama.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <ProtectedPage user={user} title="Poin Loyalitas" customers={customers} allowGuest={true}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 pb-24"
      >
        <div className="mb-8">
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
            <div className="w-full aspect-[16/9] overflow-hidden relative group">
              <img 
                src="https://lh3.googleusercontent.com/d/1BK2wG7qAlYgTJyX3yLk4BdGi-IEjkbpc"
                alt="Loyalty Header"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
            </div>
            <div className="p-8 flex flex-col items-center">
              <h2 className="text-2xl font-black text-[#005E6A] leading-tight text-center uppercase tracking-tighter">Poin Loyalitas</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 text-center uppercase tracking-widest leading-relaxed max-w-[240px]">Kumpulkan poin dari setiap transaksi Anda di Warung Tomi</p>
            </div>
          </div>
        </div>

        {/* Session Sensitive Header */}
        <div className="mb-8">
          {user ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => navigate(`/poin/${encodeURIComponent(user.Nama)}`)}
              className="bg-gradient-to-br from-[#005E6A] to-[#00899B] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-120 transition-transform duration-700" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Poin Aktif Anda</p>
                  <h3 className="text-2xl font-black tracking-tight">{activePoints} Poin</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Klik untuk detail riwayat</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-visible">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cek Poin Pelanggan</p>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="MASUKKAN NAMA ANDA..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-xs font-black text-[#005E6A] focus:outline-none focus:border-[#005E6A]/20 transition-all uppercase placeholder:text-slate-300"
                  />
                  
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100]"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => navigate(`/poin/${encodeURIComponent(s.Nama)}`)}
                            className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center text-[10px] font-black text-[#005E6A]">
                                {s.Nama.charAt(0)}
                              </div>
                              <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">{s.Nama}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-[#F15A24] group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-8">
          <button
            onClick={() => setActiveTab("HADIAH")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "HADIAH" ? "bg-white text-[#005E6A] shadow-md" : "text-slate-400"
            }`}
          >
            Daftar Hadiah
          </button>
          <button
            onClick={() => setActiveTab("CARA")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "CARA" ? "bg-white text-[#F15A24] shadow-md" : "text-slate-400"
            }`}
          >
            Cara Dapat Poin
          </button>
        </div>

        {activeTab === "HADIAH" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {REWARDS.map((reward) => (
                <div key={reward.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm flex flex-col group active:scale-[0.98] transition-transform">
                  <div className="relative h-32 bg-slate-50 overflow-hidden">
                    <img 
                      src={reward.image} 
                      alt={reward.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[8px] font-black text-amber-600">{reward.points}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-4 flex-1 flex items-center justify-center">
                      <p className="text-[9px] font-black text-slate-900 uppercase leading-tight text-center line-clamp-3">{reward.name}</p>
                    </div>
                    <div>
                      {user ? (
                        activePoints >= reward.points ? (
                          <button 
                            onClick={() => navigate("/tukar-poin")}
                            className="w-full py-2 bg-amber-50 text-amber-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
                          >
                            Tukarkan
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="w-full py-2 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest cursor-not-allowed opacity-60"
                          >
                            Poin Kurang
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase mb-2">Belanja Berhadiah Poin</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-4">
                Dapatkan 1 Poin untuk setiap kelipatan transaksi sebesar <span className="text-[#F15A24]">Rp 10.000</span>. Semakin banyak belanja, semakin banyak poin yang terkumpul!
              </p>
              
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Contoh Perolehan:</p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Tarik Tunai Rp 100.000</span>
                  <span className="text-[9px] font-black text-green-600">+10 Poin</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Beli Pulsa Rp 12.000</span>
                  <span className="text-[9px] font-black text-green-600">+1 Poin</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Token Listrik Rp 50.000</span>
                  <span className="text-[9px] font-black text-green-600">+5 Poin</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase mb-2">Bonus Level Pelanggan</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-4">
                Naikkan level Anda untuk mendapatkan keuntungan lebih banyak:
              </p>
              <div className="space-y-3">
                {LEVELS.map((level, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-[1.5rem]">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-xl">
                      {level.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 uppercase mb-1">{level.name}</p>
                      <ul className="space-y-1">
                        {level.benefits.map((b, j) => (
                          <li key={j} className="text-[7px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 leading-relaxed">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ProtectedPage>
  );
};

const LoyaltyPointsDetailPage = ({ user, transactions, redeemedPoints, customers }: { user: Customer | null, transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [activeTab, setActiveTab] = useState<"RIWAYAT" | "TUKAR">("RIWAYAT");

  const displayUser = useMemo(() => {
    if (customerName && customers) {
      return customers.find(c => c.Nama.toLowerCase() === decodeURIComponent(customerName).toLowerCase()) || user;
    }
    return user;
  }, [customerName, customers, user]);

  if (!displayUser) return null;

  const now = new Date();
  const startDate = new Date(2025, 10, 1);
  const userSales = transactions.filter(t => t.Nama.toLowerCase() === displayUser.Nama.toLowerCase());
  const userRedeemed = redeemedPoints
    .filter(r => r.Nama.toLowerCase() === displayUser.Nama.toLowerCase())
    .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
  const totalEarned = useMemo(() => {
    let earned = 0;
    userSales.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate >= startDate) {
        earned += Math.floor(t.Pemasukan / 10000);
      }
    });
    return earned;
  }, [userSales]);

  const totalExpired = useMemo(() => {
    let expired = 0;
    userSales.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate >= startDate) {
        const points = Math.floor(t.Pemasukan / 10000);
        const expiryDate = new Date(tDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (expiryDate < now) {
          expired += points;
        }
      }
    });
    return expired;
  }, [userSales, now]);

  const pointsHistory = useMemo(() => {
    const history: { tanggal: string, poin: number, keterangan: string }[] = [];
    userSales.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate >= startDate) {
        const points = Math.floor(t.Pemasukan / 10000);
        if (points > 0) {
          history.push({
            tanggal: t.Tanggal,
            poin: points,
            keterangan: t.Jenis
          });
        }
      }
    });
    return history.sort((a, b) => parseDate(b.tanggal).getTime() - parseDate(a.tanggal).getTime());
  }, [userSales]);

  const totalRedeemed = userRedeemed.reduce((acc, curr) => acc + curr.Poin, 0);
  const activePoints = Math.max(0, totalEarned - totalExpired - totalRedeemed);

  const getExpiryInfo = (dateStr: string) => {
    const d = parseDate(dateStr);
    const exp = new Date(d);
    exp.setFullYear(exp.getFullYear() + 1);
    const isExpired = exp < now;
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let color = "bg-green-500";
    if (diffDays < 30) color = "bg-orange-500";
    if (diffDays < 7) color = "bg-red-500";
    if (isExpired) color = "bg-slate-400";

    return {
      date: exp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isExpired,
      color
    };
  };

  return (
    <ProtectedPage user={displayUser} title="Detail Poin" allowGuest={true}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4"
      >
        {/* Main Card */}
        <div className="bg-[#005E6A] rounded-[2.5rem] p-8 pb-6 text-white shadow-lg mb-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Poin Aktif</p>
          <h2 className="text-4xl font-black tracking-tighter mb-8">{activePoints} <span className="text-sm font-bold uppercase tracking-widest opacity-60">Poin</span></h2>
          
          {/* Internal Stats */}
          <div className="pt-6 border-t border-white/10 flex items-center">
            <div className="flex-1 text-center">
              <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Poin Ditukar</p>
              <p className="text-sm font-black">{totalRedeemed} Poin</p>
            </div>
            
            <div className="w-px h-8 bg-white/10 mx-2" />
            
            <div className="flex-1 text-center">
              <p className="text-[7px] font-black uppercase tracking-widest text-white/50 mb-1">Poin Hangus</p>
              <p className="text-sm font-black">{totalExpired} Poin</p>
            </div>
          </div>
        </div>

        {/* Small Cards Removed - Moved Inside Above */}

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
            pointsHistory.length > 0 ? (
              pointsHistory.map((item, i) => {
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
  const [showPopup, setShowPopup] = useState(false);
  
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
                    <button 
                      onClick={() => setShowPopup(true)}
                      className="bg-[#005E6A] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm shadow-teal-100 active:scale-95 transition-transform"
                    >
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
      </motion.div>

      {/* Info Popup */}
      <AnimatePresence>
        {showPopup && (
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
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-3">Cara Penukaran</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8">
                Silakan hubungi admin Warung Tomi untuk melakukan penukaran poin dengan hadiah yang Anda pilih.
              </p>
              <button 
                onClick={() => setShowPopup(false)}
                className="w-full bg-[#005E6A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 active:scale-95 transition-transform"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedPage>
  );
};

const AsetPage = ({ user, transactions, investmentTransactions, redeemedPoints, customers, onLogin, setActiveTab }: { user: Customer | null, transactions: SalesTransaction[], investmentTransactions: InvestmentTransaction[], redeemedPoints: RedeemedPoint[], customers: Customer[], onLogin: (user: Customer) => void, setActiveTab: (id: string) => void }) => {
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(() => localStorage.getItem('aset_show_balance') !== 'false');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [targetGoal, setTargetGoal] = useState(() => {
    const saved = localStorage.getItem(`target_goal_${user?.Nama}`);
    return saved ? parseInt(saved) : 10000000;
  });
  const [tempGoal, setTempGoal] = useState(targetGoal.toString());

  const toggleBalance = () => {
    setShowBalances(prev => {
      const next = !prev;
      localStorage.setItem('aset_show_balance', String(next));
      return next;
    });
  };

  const handleSaveGoal = () => {
    const val = parseInt(tempGoal.replace(/\D/g, ""));
    if (!isNaN(val) && val > 0) {
      setTargetGoal(val);
      localStorage.setItem(`target_goal_${user?.Nama}`, val.toString());
      setIsEditingGoal(false);
    }
  };

  const mask = (val: string | number) => showBalances ? val : "••••••";


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
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider">Total Aset</h2>
            <button 
              onClick={toggleBalance}
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
            >
              {showBalances ? <History className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-[#005E6A]" />}
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-bold text-slate-400">Rp</span>
            <span className="text-3xl font-black text-[#005E6A]">{mask(formatCurrency(totalAset))}</span>
          </div>
          
          <AssetPieChart data={assetData} />
        </div>

        {/* Target Impian Section */}
        <div className="bg-[#005E6A] rounded-[2rem] p-6 shadow-xl mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Target Impian</h3>
            </div>
            <button 
              onClick={() => {
                setTempGoal(targetGoal.toLocaleString('id-ID'));
                setIsEditingGoal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Goal: {targetGoal >= 1000000 ? `${(targetGoal / 1000000).toFixed(0)}jt` : formatCurrency(targetGoal)}
              </span>
              <Settings className="w-3 h-3 text-white/60" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Progres Tabungan</p>
              <p className="text-xs font-black text-white">{Math.min(Math.round((tabunganBalance / targetGoal) * 100), 100)}%</p>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((tabunganBalance / targetGoal) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-orange-400 to-yellow-300 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
              />
            </div>
            <p className="text-[8px] font-bold text-white/50 uppercase tracking-tight">Kumpulkan aset untuk mencapai kebebasan finansial</p>
          </div>
        </div>

        {/* Goal Edit Modal */}
        <AnimatePresence>
          {isEditingGoal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingGoal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-[#F15A24]" />
                    </div>
                    <div>
                      <h3 className="text-[#005E6A] font-black text-sm uppercase tracking-widest">Set Target Goal</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Tentukan nominal impian Anda</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-[#005E6A]">Rp</span>
                      <input 
                        type="text"
                        value={tempGoal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setTempGoal(val ? parseInt(val).toLocaleString('id-ID') : "");
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-[#005E6A] focus:outline-none focus:border-[#F15A24] transition-all"
                        placeholder="Contoh: 10.000.000"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[5000000, 10000000, 25000000, 50000000].map(val => (
                        <button
                          key={val}
                          onClick={() => setTempGoal(val.toLocaleString('id-ID'))}
                          className="py-2.5 rounded-xl border border-slate-100 text-[10px] font-black text-[#005E6A] hover:bg-slate-50 transition-colors uppercase tracking-widest"
                        >
                          {(val / 1000000).toFixed(0)} Juta
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditingGoal(false)}
                      className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleSaveGoal}
                      className="flex-1 bg-[#F15A24] hover:bg-[#d94e1f] text-white font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg shadow-[#F15A24]/20"
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
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
                <p className="text-[13px] font-black text-white tracking-tight">Rp {mask(item.balance)}</p>
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
  const [typeFilter, setTypeFilter] = useState<'SEMUA' | 'SETOR' | 'TARIK'>('SEMUA');
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
      const matchesMonth = tMonthYear === selectedMonth;
      const matchesType = typeFilter === 'SEMUA' || t.Tipe.toUpperCase() === typeFilter;
      return matchesMonth && matchesType;
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
                    <h3 className="text-2xl font-black tracking-tight drop-shadow-sm truncate max-w-[200px] mb-0.5">{displayUser?.Nama}</h3>
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
          <div className="px-2">
            <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">
              {activeTab === 'riwayat' ? 'Riwayat Mutasi' : 'Statistik Bulanan'}
            </h3>
            
            {activeTab === 'riwayat' && (
              <div className="flex flex-col gap-4">
                {/* Quick Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(['SEMUA', 'SETOR', 'TARIK'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTypeFilter(f)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                        typeFilter === f 
                          ? 'bg-[#005E6A] text-white shadow-md shadow-teal-100' 
                          : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-400">Menampilkan {filteredTransactions.length} transaksi</p>
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
                </div>
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
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-[#005E6A] uppercase tracking-widest leading-none">{t.Berita || t.Tipe}</p>
                            <p className="text-[9px] font-bold text-slate-400 leading-none">{t.Tanggal}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black leading-none mb-1 ${
                              t.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {t.Tipe === 'SETOR' ? '+' : '-'}{formatCurrency(t.Nominal)}
                            </p>
                          </div>
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
                    <div className="absolute bottom-0 right-0 bg-orange-500 px-3 py-1 rounded-tl-2xl rounded-br-2xl border-t border-l border-orange-400/30 flex items-center justify-center min-w-[95px]">
                       <span className="text-[6px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">Sisa Rp {formatCurrency(t.SaldoAkhir)}</span>
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
                  {diprosesTransactions.length} Transaksi
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
                  {belumDiambilTransactions.length} Transaksi
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for matching
  const formattedFilterDate = filterDate.split('-').reverse().join('/');

  // Filter transactions for selected date and search query
  const filteredTransactions = [...transactions]
    .filter(t => {
      const matchDate = t.Tanggal.startsWith(formattedFilterDate);
      if (!matchDate) return false;
      
      if (!searchQuery.trim()) return true;
      
      const q = searchQuery.toLowerCase();
      const matchName = (t.Nama || "").toLowerCase().includes(q);
      const matchJenis = (t.Jenis || "").toLowerCase().includes(q);
      const matchMelalui = (t.Melalui || "").toLowerCase().includes(q);
      const matchStatus = (t.Status || "").toLowerCase().includes(q);
      
      return matchName || matchJenis || matchMelalui || matchStatus;
    });

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
        {/* Stats Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Pemasukan</p>
            <h3 className="text-4xl font-black text-[#005E6A] tracking-tighter">Rp {totalPemasukan.toLocaleString('id-ID')}</h3>
          </div>
          
          <div className="grid grid-cols-2 border-t border-slate-50 pt-8 mt-2">
            <div className="text-center border-r border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Total Transaksi</p>
              <h4 className="text-xl font-black text-[#F15A24] tracking-tight">{totalTransaksi}</h4>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Total Keuntungan</p>
              <h4 className="text-xl font-black text-green-600 tracking-tight">Rp {totalKeuntungan.toLocaleString('id-ID')}</h4>
            </div>
          </div>
        </div>

        {/* Unified Filter Card */}
        <div className="bg-white px-2 py-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 min-h-[56px]">
          {/* Search Section */}
          <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 pr-3 border-r border-slate-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 w-full min-w-0 bg-transparent border-none text-[10px] font-black text-[#005E6A] focus:outline-none placeholder:text-slate-300 placeholder:font-bold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1 px-2 hover:bg-slate-50 rounded-lg transition-colors group shrink-0"
              >
                <X className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </button>
            )}
          </div>

          {/* Date Section */}
          <div className="flex items-center gap-2 px-3 shrink-0">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black text-[#005E6A] focus:outline-none appearance-none cursor-pointer p-0 w-24"
            />
          </div>
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

const AdminDashboard = ({ transactions, user, customers, investmentTransactions }: { transactions: SalesTransaction[], user: Customer | null, customers: Customer[], investmentTransactions: InvestmentTransaction[] }) => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Bulan ini");

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const totalTabungan = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  const totalInvestasi = investmentTransactions
    .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => {
      const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
      return acc + estimate.total;
    }, 0);
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
      return acc + ((t.HargaModal || 0) - (t.Sebagian || 0));
    }, 0);
  
  const totalLainnya = totalLainnyaFromCustomers + totalLainnyaFromGeneral;

  const totalAssets = totalTabungan + totalInvestasi + totalLainnya - totalHutang;
  const grossAssets = totalTabungan + totalInvestasi + totalLainnya;

  const assetData = [
    { name: 'Tabungan', value: totalTabungan, color: '#22c55e', path: '/admin/savings' },
    { name: 'Investasi', value: totalInvestasi, color: '#8b5cf6', path: '/admin/investment' },
    { name: 'Hutang', value: totalHutang, color: '#f43f5e', path: '/admin/debt' },
    { name: 'Lainnya', value: totalLainnya, color: '#3b82f6', path: '/admin/others' }
  ].filter(d => d.value > 0).map(d => ({
    ...d,
    percentage: grossAssets > 0 ? (d.value / grossAssets) * 100 : 0
  }));

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
  
  // 1. Calculate Growth (MTD: Month-to-Date comparison)
  const growth = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthRevenue = transactions.filter(t => {
      const d = parseDate(t.Tanggal);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && d.getDate() <= todayDay;
    }).reduce((acc, curr) => acc + curr.Pemasukan, 0);

    const lastMonthRevenue = transactions.filter(t => {
      const d = parseDate(t.Tanggal);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear && d.getDate() <= todayDay;
    }).reduce((acc, curr) => acc + curr.Pemasukan, 0);

    if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0;
    return Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  }, [transactions]);

  // 2. Calculate Top Products
  const topProducts = useMemo(() => {
    const counts: Record<string, { count: number, revenue: number }> = {};
    filteredSales.forEach(t => {
      const key = t.Jenis || "Lainnya";
      if (!counts[key]) counts[key] = { count: 0, revenue: 0 };
      counts[key].count += 1;
      counts[key].revenue += t.Pemasukan;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredSales]);

  // 3. Mock Stock Alerts (since stock isn't built yet)
  const lowStockAlerts = [
    { name: "Minyak Goreng 2L", stok: 2 },
    { name: "Gas Elpiji 3kg", stok: 1 }
  ];

  // Group by date for chart (Sales and Profit)
  const statsByDate = filteredSales.reduce((acc: any, curr) => {
    const dateStr = curr.Tanggal.split(' ')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { sales: 0, profit: 0 };
    }
    acc[dateStr].sales += curr.Pemasukan;
    acc[dateStr].profit += (curr.Pemasukan - (curr.HargaModal || 0));
    return acc;
  }, {});

  const chartData = Object.keys(statsByDate).map(date => ({
    date,
    total: statsByDate[date].sales,
    profit: statsByDate[date].profit
  })).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  // Calculate statistics for the chartData
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const maxSales = [...chartData].sort((a, b) => b.total - a.total)[0];
    const minSales = [...chartData].sort((a, b) => a.total - b.total)[0];
    const maxProfit = [...chartData].sort((a, b) => b.profit - a.profit)[0];
    const minProfit = [...chartData].sort((a, b) => a.profit - b.profit)[0];
    
    const avgSales = chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length;
    const avgProfit = chartData.reduce((acc, curr) => acc + curr.profit, 0) / chartData.length;
    
    return { maxSales, minSales, maxProfit, minProfit, avgSales, avgProfit };
  }, [chartData]);

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
            onClick={() => navigate("/admin/stock")}
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
              <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Bruto: Rp {grossAssets.toLocaleString('id-ID')}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Neto: Rp {totalAssets.toLocaleString('id-ID')}</p>
                  {grossAssets > 0 && (
                    <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${
                      (totalHutang / grossAssets) > 0.3 ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-[#005E6A]'
                    }`}>
                      Rasio Hutang: {Math.round((totalHutang / grossAssets) * 100)}%
                    </div>
                  )}
                </div>
              </div>
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
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#F15A24] transition-colors">{item.name}</span>
                      <span className="text-[8px] font-black text-slate-300">({Math.round(item.percentage)}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-700">Rp {item.value.toLocaleString('id-ID')}</span>
                    </div>
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
              <div className="flex flex-col gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F15A24]" />
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Penjualan</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Keuntungan</p>
                  </div>
                </div>
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-slate-50 border-none text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors w-fit mt-1"
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

          {/* Growth Indicator - NEW */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${growth >= 0 ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"}`}>
              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-[10px] font-black">{Math.abs(growth)}%</span>
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              {growth >= 0 ? "Pertumbuhan Omzet" : "Penurunan Omzet"} bln ini
            </p>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F15A24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#F15A24" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="profitGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
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
                    borderRadius: '1.2rem', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                  formatter={(value: number, name: string) => [
                    `Rp ${value.toLocaleString('id-ID')}`, 
                    name === 'total' ? 'Penjualan' : 'Keuntungan'
                  ]}
                />
                <Bar 
                  dataKey="total" 
                  name="total"
                  fill="url(#barGradientDashboard)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={10}
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="profit" 
                  name="profit"
                  fill="url(#profitGradientDashboard)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={10}
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

            {/* Detailed Stats Analysis */}
            {stats && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005E6A]" />
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Snapshot Performa</p>
                    </div>
                    <h4 className="text-[11px] font-black text-[#005E6A] uppercase tracking-wider pl-3.5">Ikhtisar Periode</h4>
                  </div>
                  <div className="bg-teal-50 px-3 py-2 rounded-xl border border-teal-100/50 text-right">
                    <p className="text-[7px] font-black text-teal-600/60 uppercase tracking-widest mb-0.5">Avg. Penjualan</p>
                    <p className="text-[11px] font-black text-[#005E6A]">Rp {Math.round(stats.avgSales).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Penjualan Segment */}
                  <div className="relative pl-4 border-l-2 border-teal-500/10">
                    <div className="absolute top-0 left-[-2px] w-[2px] h-3 bg-teal-500 rounded-full" />
                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-[0.15em] mb-3">Metrik Penjualan</p>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[12px] font-black text-[#005E6A] leading-none tracking-tight">Rp {stats.maxSales.total.toLocaleString('id-ID')}</p>
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                          <TrendingUp className="w-2.5 h-2.5 text-teal-600" />
                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Terbesar • {stats.maxSales.date}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-400 leading-none">Rp {stats.minSales.total.toLocaleString('id-ID')}</p>
                        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Terendah</p>
                      </div>
                    </div>
                  </div>

                  {/* Keuntungan Segment */}
                  <div className="relative pl-4 border-l-2 border-green-500/10">
                    <div className="absolute top-0 left-[-2px] w-[2px] h-3 bg-green-500 rounded-full" />
                    <p className="text-[8px] font-black text-green-600 uppercase tracking-[0.15em] mb-3">Metrik Keuntungan</p>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[12px] font-black text-green-600 leading-none tracking-tight">Rp {stats.maxProfit.profit.toLocaleString('id-ID')}</p>
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                          <TrendingUp className="w-2.5 h-2.5 text-green-600" />
                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Terbesar • {stats.maxProfit.date}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-400 leading-none">Rp {stats.minProfit.profit.toLocaleString('id-ID')}</p>
                        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Terendah</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Summary Bar */}
                  <div className="mt-8 bg-slate-900 rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                    <div className="relative z-10">
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Rata-rata Laba</p>
                      <p className="text-[12px] font-black text-green-400 italic">Rp {Math.round(stats.avgProfit).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="relative z-10 text-right">
                       <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Efisiensi</p>
                       <p className="text-[9px] font-black text-white uppercase tracking-widest">
                         {Math.round((stats.avgProfit / stats.avgSales) * 100)}% Margin
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Health & Top Products - NEW */}
        <div className="grid grid-cols-1 gap-6">
          {/* Top Selling Products Card */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Produk Terlaris</h3>
              <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-[#005E6A]">
                      #{i+1}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{p.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.count} Transaksi</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-[#F15A24]">Rp {p.revenue.toLocaleString('id-ID')}</p>
                </div>
              )) : (
                <p className="text-center text-[9px] text-slate-400 font-bold uppercase py-4">Belum ada data transaksi</p>
              )}
            </div>
          </div>

          {/* Health Alerts Card */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Peringatan Bisnis</h3>
              <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Debt Alert */}
              {totalHutang > 0 && (
                <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <History className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[7px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">Piutang Pelanggan</p>
                    <p className="text-[12px] font-black text-slate-800">Rp {totalHutang.toLocaleString('id-ID')}</p>
                  </div>
                  <button 
                    onClick={() => navigate("/admin/debt")}
                    className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full shadow-sm"
                  >
                    Tagih
                  </button>
                </div>
              )}

              {/* Mock Stock Alerts */}
              {lowStockAlerts.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-2xl border border-amber-100/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Package className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-tight">{item.name}</p>
                      <p className="text-[7px] font-bold text-amber-600 uppercase tracking-widest">Stok menipis: {item.stok}</p>
                    </div>
                  </div>
                  <button className="text-[7px] font-black text-teal-600 uppercase tracking-widest">Stok +</button>
                </div>
              ))}
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
  listTitle,
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
  extraContent,
  rightHeaderContent
}: { 
  listTitle?: string,
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
    badge?: { label: string, colorClass: string, iconColorClass?: string, customIconColor?: string },
    statusBadge?: { label: string, color: string }
  }[],
  icon: any,
  colorClass: string,
  onItemClick?: (name: string) => void,
  stats?: { label: string, value: number, count: number, color: string }[],
  showLegend?: boolean,
  showBadges?: boolean,
  extraContent?: React.ReactNode,
  rightHeaderContent?: React.ReactNode
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
          <div className="flex items-center justify-between gap-4 px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider whitespace-nowrap">{listTitle || "Daftar Rincian"}</h3>
            {rightHeaderContent}
          </div>
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
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color ? '' : (item.badge?.iconColorClass ? item.badge.iconColorClass : 'bg-slate-200 text-slate-400')}`}
                        style={item.color ? { backgroundColor: `${item.color}35`, color: item.color } : (item.badge?.customIconColor ? { backgroundColor: `${item.badge.customIconColor}35`, color: item.badge.customIconColor } : {})}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="mb-2">
                          <p className="text-[11px] font-black text-[#005E6A] uppercase leading-none">{item.name}</p>
                        </div>
                        {item.statusBadge ? (
                          <div className="flex mb-1">
                            <span className={`text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white shadow-sm`} style={{ backgroundColor: item.statusBadge.color }}>
                              {item.statusBadge.label}
                            </span>
                          </div>
                        ) : null}
                        {item.subtext && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.subtext}</p>}
                      </div>
                    </div>
                    
                    <p className={`text-[13px] font-black ${colorClass} leading-none`}>Rp {item.value.toLocaleString('id-ID')}</p>
                    
                    {item.badge && showBadges && (
                      <div 
                        className={`absolute bottom-0 right-0 ${item.badge.colorClass.includes('bg-[') ? '' : item.badge.colorClass.replace(/text-[\w-]+/, 'text-white')} w-[150px] py-1.5 rounded-tl-3xl shadow-sm text-center px-4`}
                        style={item.badge.colorClass.includes('bg-[') ? { backgroundColor: item.badge.customIconColor } : {}}
                      >
                        <p className="text-[6px] font-black uppercase tracking-wider text-white truncate">
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

const TransactionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  type, 
  customers, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  type: 'SETOR' | 'TARIK',
  customers: Customer[],
  onSave: (customer: Customer, amount: number, note: string) => void
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return [];
    return customers.filter(c => {
      const matchesSearch = c.Nama.toLowerCase().includes(search.toLowerCase());
      const hasBalance = parseCurrency(c.Tabungan) > 0;
      return matchesSearch && (type === 'SETOR' ? true : hasBalance);
    }).slice(0, 5);
  }, [search, customers, type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    if (val === "") {
      setAmount("");
      return;
    }
    setAmount(parseInt(val).toLocaleString('id-ID'));
  };

  const handleSave = async () => {
    if (selected && amount) {
      setIsSaving(true);
      try {
        const nominal = parseInt(amount.replace(/\./g, ''));
        // Send to Spreadsheet if URL is configured
        const scriptUrl = (import.meta as any).env.VITE_SAVINGS_SCRIPT_URL;
        
        if (scriptUrl) {
          // Send Data to Google Sheets
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
              Nama: selected.Nama,
              Tanggal: new Date().toLocaleDateString('id-ID'),
              Tipe: type,
              Nominal: nominal,
              Keterangan: note || "-"
            })
          });
        }

        onSave(selected, nominal, note);
        // Reset
        setSearch("");
        setSelected(null);
        setAmount("");
        setNote("");
        onClose();
      } catch (err) {
        console.error("Error saving to sheet:", err);
        // We still save locally even if sheet fails
        onSave(selected, parseInt(amount.replace(/\./g, '')), note);
        onClose();
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className={`p-6 ${type === 'SETOR' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tighter">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Nasabah</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-300" />
              </div>
              <input 
                type="text"
                placeholder="Cari nama..."
                value={selected ? selected.Nama : search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelected(null);
                }}
                disabled={!!selected}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-[#005E6A] focus:outline-none focus:ring-2 focus:ring-[#005E6A]/10 transition-all"
              />
              {selected && (
                <button 
                  onClick={() => {setSelected(null); setSearch("");}}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Auto-suggestions */}
            {!selected && search.length > 0 && (
              <div className="absolute z-10 w-full left-0 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden mt-1 max-h-[200px] overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelected(c);
                        setSearch("");
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group"
                    >
                      <div>
                        <p className="text-xs font-black text-[#005E6A] uppercase group-hover:text-[#F15A24] transition-colors">{c.Nama}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Member Warung Tomi</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-[#005E6A]">Rp {parseCurrency(c.Tabungan).toLocaleString('id-ID')}</p>
                         <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Saldo</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Nasabah tidak ditemukan</p>
                  </div>
                )}
              </div>
            )}
            
            {selected && (
              <div className="px-1 flex justify-between items-center bg-teal-50/50 p-3 rounded-xl border border-teal-100/50">
                <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest leading-none">Saldo Saat Ini</p>
                <p className="text-xs font-black text-[#005E6A]">Rp {parseCurrency(selected.Tabungan).toLocaleString('id-ID')}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nominal</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="text-sm font-black text-slate-300">Rp</span>
              </div>
              <input 
                type="text"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-[#005E6A] focus:outline-none focus:ring-2 focus:ring-[#005E6A]/10 transition-all placeholder:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Keterangan (Opsional)</label>
            <input 
              type="text"
              placeholder="Berita acara..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold text-[#005E6A] focus:outline-none focus:ring-2 focus:ring-[#005E6A]/10 transition-all placeholder:text-slate-200"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 bg-slate-50 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={!selected || !amount || isSaving}
              className={`flex-1 ${type === 'SETOR' ? 'bg-green-600' : 'bg-red-600'} text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2`}
            >
              {isSaving && <RefreshCw className="w-3 h-3 animate-spin" />}
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AdminSavingsManagement = ({ customers, transactions, setTransactions }: { customers: Customer[], transactions: SavingTransaction[], setTransactions: React.Dispatch<React.SetStateAction<SavingTransaction[]>> }) => {
  const navigate = useNavigate();
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [showTarikModal, setShowTarikModal] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const handleSaveTransaction = (customer: Customer, amount: number, note: string, type: 'SETOR' | 'TARIK') => {
    const newTransaction: SavingTransaction = {
      Tanggal: new Date().toLocaleDateString('id-ID'),
      Nama: customer.Nama,
      Tipe: type,
      Nominal: amount,
      SaldoAkhir: type === 'SETOR' 
        ? parseCurrency(customer.Tabungan) + amount 
        : parseCurrency(customer.Tabungan) - amount,
      Berita: note
    };

    setTransactions(prev => [newTransaction, ...prev]);
    // Optional: show a success indicator
  };

  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  
  // 1. Calculate Monthly Cash Flow (MTD)
  const cashFlow = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyTxs = transactions.filter(t => {
      const d = parseDate(t.Tanggal);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const totalSetor = monthlyTxs.filter(t => t.Tipe === "SETOR").reduce((acc, curr) => acc + curr.Nominal, 0);
    const totalTarik = monthlyTxs.filter(t => t.Tipe === "TARIK").reduce((acc, curr) => acc + curr.Nominal, 0);
    
    return { setor: totalSetor, tarik: totalTarik };
  }, [transactions]);

  // 2. Calculate Active Member Rate (last 30 days)
  const activeRate = useMemo(() => {
    if (customers.length === 0) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const activeCustomerNames = new Set(
      transactions
        .filter(t => parseDate(t.Tanggal) >= thirtyDaysAgo)
        .map(t => t.Nama.toLowerCase())
    );

    return Math.round((activeCustomerNames.size / customers.length) * 100);
  }, [transactions, customers]);

  // 3. Global Recent Transactions
  const recentGlobalTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())
      .slice(0, 5);
  }, [transactions]);

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

      return { 
        name: c.Nama, 
        value: val,
        color
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

  const extraContent = (
    <div className="w-full space-y-4">
      {/* Cash Flow Summary */}
      <div className="flex items-center justify-between w-full px-4 border-t border-slate-50 pt-4 mt-2">
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Setoran Bulan Ini</p>
          <p className="text-xs font-black text-green-600">+ Rp {cashFlow.setor.toLocaleString('id-ID')}</p>
        </div>
        <div className="w-[1px] h-8 bg-slate-100 flex-shrink-0 mx-2" />
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Tarikan Bulan Ini</p>
          <p className="text-xs font-black text-red-600">- Rp {cashFlow.tarik.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Active Rate Indicator */}
      <div className="px-4 pb-2">
        <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Keaktifan Menabung</span>
          </div>
          <span className="text-[10px] font-black text-[#005E6A]">{activeRate}% Aktif (30hr)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <button 
          onClick={() => setShowSetorModal(true)}
          className="bg-green-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors group"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest">Setor</span>
        </button>
        <button 
          onClick={() => setShowTarikModal(true)}
          className="bg-red-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors group"
        >
          <MinusCircle className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest">Tarik</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminManagementPage 
        listTitle="Daftar Tabungan"
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
        showBadges={false}
        extraContent={extraContent}
      />

      <TransactionModal 
        isOpen={showSetorModal} 
        onClose={() => setShowSetorModal(false)}
        title="Setor Tabungan"
        type="SETOR"
        customers={customers}
        onSave={(c, amt, n) => handleSaveTransaction(c, amt, n, 'SETOR')}
      />

      <TransactionModal 
        isOpen={showTarikModal} 
        onClose={() => setShowTarikModal(false)}
        title="Tarik Tabungan"
        type="TARIK"
        customers={customers}
        onSave={(c, amt, n) => handleSaveTransaction(c, amt, n, 'TARIK')}
      />

      {/* NEW: Global Recent Transactions */}
      <div className="px-6 pb-12 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Aktivitas Terakhir</h3>
          <History className="w-4 h-4 text-slate-400" />
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {recentGlobalTransactions.map((t, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.Tipe === 'SETOR' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {t.Tipe === 'SETOR' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#005E6A] uppercase tracking-tight truncate max-w-[120px]">{t.Nama}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.Tanggal}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${t.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.Tipe === 'SETOR' ? '+' : '-'}{t.Nominal.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">{t.Berita || t.Tipe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminInvestmentManagement = ({ customers, investmentTransactions }: { customers: Customer[], investmentTransactions: InvestmentTransaction[] }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const calculateTotalVal = (customerName: string) => {
    const userInvestments = investmentTransactions.filter(t => 
      t.Nama.toLowerCase() === customerName.toLowerCase() &&
      t.Status.toLowerCase() !== "sukses dicairkan"
    );
    return userInvestments.reduce((acc, curr) => {
      const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
      return acc + estimate.total;
    }, 0);
  };

  const customerVals = customers.map(c => ({
    name: c.Nama,
    value: calculateTotalVal(c.Nama)
  })).filter(item => item.value > 0);

  const total = customerVals.reduce((acc, item) => acc + item.value, 0);
  
  const CHART_COLORS = [
    "#FF00ED", "#00F0FF", "#FFE600", "#00FF00", "#FF5C00", 
    "#7000FF", "#00FF94", "#FF005C", "#0075FF", "#FFA800"
  ];

  const items = customerVals
    .sort((a, b) => b.value - a.value)
    .map((item, idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length];

      return { 
        name: item.name, 
        value: item.value,
        color,
        badge: {
          label: `Investasi: Rp ${item.value.toLocaleString('id-ID')}`,
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

const AdminCustomerDetailPage = ({ 
  customers, 
  salesTransactions, 
  savingsTransactions, 
  investmentTransactions, 
  debtTransactions, 
  redeemedPoints 
}: { 
  customers: Customer[], 
  salesTransactions: SalesTransaction[], 
  savingsTransactions: SavingTransaction[],
  investmentTransactions: InvestmentTransaction[],
  debtTransactions: DebtTransaction[],
  redeemedPoints: RedeemedPoint[] 
}) => {
  const { customerName } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const customer = customers.find(c => c.Nama.toLowerCase() === customerName?.toLowerCase());
  
  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
           <User className="w-16 h-16 text-slate-100 mx-auto mb-4" />
           <h2 className="text-xl font-black text-[#005E6A] uppercase tracking-tighter">Pelanggan<br/>Tidak Ditemukan</h2>
           <p className="text-xs font-bold text-slate-400 mt-2 mb-8 uppercase tracking-widest leading-relaxed">Data yang Anda cari tidak tersedia atau telah dihapus.</p>
           <Button onClick={() => navigate("/admin/customers")} className="w-full bg-[#005E6A] hover:bg-[#004e58] text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-teal-100">Kembali</Button>
        </div>
      </div>
    );
  }

  const activePoints = calculateActivePoints(customer.Nama, salesTransactions, redeemedPoints);
  const levelInfo = calculateCustomerLevel(salesTransactions, customer.Nama);
  
  const userSales = salesTransactions
    .filter(t => t.Nama.toLowerCase() === customer.Nama.toLowerCase())
    .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
    
  const userSavings = savingsTransactions.filter(t => t.Nama.toLowerCase() === customer.Nama.toLowerCase());
  const currentSavings = userSavings.length > 0 ? userSavings[userSavings.length - 1].SaldoAkhir : parseCurrency(customer.Tabungan);
  
  const userDebts = debtTransactions.filter(t => t.Nama.toLowerCase() === customer.Nama.toLowerCase());
  const currentDebt = parseCurrency(customer.Hutang);
  
  const userInvestments = investmentTransactions.filter(t => t.Nama.toLowerCase() === customer.Nama.toLowerCase());
  const totalInvestment = userInvestments.filter(t => t.Status !== "Selesai").reduce((acc, curr) => acc + curr.Nominal, 0);

  const currentOthers = salesTransactions
    .filter(t => t.Nama.toLowerCase() === customer.Nama.toLowerCase() && (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL")
    .reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);

  const levelColorMap: Record<string, string> = {
    Bronze: "text-orange-600",
    Silver: "text-slate-500",
    Gold: "text-yellow-600",
    Platinum: "text-indigo-600",
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <button onClick={() => navigate("/admin/customers")} className="flex items-center gap-2 text-white/70 mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Manajemen Pelanggan</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center shadow-lg transform rotate-3">
               <User className="w-8 h-8 text-[#005E6A]" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{customer.Nama}</h1>
              <div className="flex items-center gap-2">
                 <Badge className="bg-[#F15A24] text-white border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                   PIN: {customer.PIN || "-"}
                 </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-center divide-x divide-slate-50">
           <div className="flex-1 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Poin Aktif</p>
              <h3 className="text-2xl font-black text-[#F15A24] tabular-nums leading-none">{activePoints}</h3>
           </div>
           <div className="flex-1 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Level Member</p>
              <h3 className={`text-xs font-black uppercase tracking-tighter ${levelColorMap[levelInfo.name] || 'text-slate-600'}`}>
                {levelInfo.name}
              </h3>
           </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#005E6A] uppercase tracking-widest px-2">Data Keuangan & Aset</h3>
          <div className="grid gap-3">
             <div 
               onClick={() => navigate(`/tabungan/${encodeURIComponent(customer.Nama)}`)}
               className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[1.25rem] bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      <PiggyBank className="w-6 h-6 text-teal-600" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo Tabungan</p>
                      <p className="text-lg font-black text-[#005E6A] tabular-nums leading-none">Rp {currentSavings.toLocaleString('id-ID')}</p>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
             </div>

             <div 
               onClick={() => navigate(`/investasi/${encodeURIComponent(customer.Nama)}`)}
               className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[1.25rem] bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Investasi Aktif</p>
                      <p className="text-lg font-black text-[#F15A24] tabular-nums leading-none">Rp {totalInvestment.toLocaleString('id-ID')}</p>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
             </div>

             <div 
               onClick={() => navigate(`/hutang/${encodeURIComponent(customer.Nama)}`)}
               className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[1.25rem] bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <Receipt className="w-6 h-6 text-red-600" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Hutang</p>
                      <p className="text-lg font-black text-red-600 tabular-nums leading-none">Rp {currentDebt.toLocaleString('id-ID')}</p>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
             </div>

             <div 
               onClick={() => navigate(`/lainnya/${encodeURIComponent(customer.Nama)}`)}
               className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Layers className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lainnya (Belum Ambil)</p>
                      <p className="text-lg font-black text-indigo-600 tabular-nums leading-none">Rp {currentOthers.toLocaleString('id-ID')}</p>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-black text-[#005E6A] uppercase tracking-widest">Riwayat Belanja</h3>
             <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
               {userSales.length} Transaksi
             </Badge>
           </div>
           
           <div className="space-y-3">
             {userSales.map((t, i) => (
                <TransactionCard key={i} t={t} index={i} isAdmin={true} />
             ))}
             {userSales.length === 0 && (
               <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                 <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3 opacity-20" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada riwayat transaksi</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminStockManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stock, setStock] = useState<StockItem[]>([
    { id: '1', Nama: 'Beras Premium 5kg', Kategori: 'Sembako', Stok: 24, Satuan: 'Karung', MinStok: 5, HargaModal: 65000, HargaJual: 72000, UpdateTerakhir: '22/04/2026' },
    { id: '2', Nama: 'Minyak Goreng 2L', Kategori: 'Sembako', Stok: 12, Satuan: 'Pouch', MinStok: 10, HargaModal: 32000, HargaJual: 35000, UpdateTerakhir: '22/04/2026' },
    { id: '3', Nama: 'Gula Pasir 1kg', Kategori: 'Sembako', Stok: 50, Satuan: 'Bks', MinStok: 15, HargaModal: 14500, HargaJual: 16000, UpdateTerakhir: '22/04/2026' },
    { id: '4', Nama: 'Telur Ayam', Kategori: 'Sembako', Stok: 8, Satuan: 'kg', MinStok: 5, HargaModal: 26000, HargaJual: 28000, UpdateTerakhir: '22/04/2026' },
    { id: '5', Nama: 'Gas Elpiji 3kg', Kategori: 'LPG', Stok: 3, Satuan: 'Tabung', MinStok: 5, HargaModal: 18000, HargaJual: 22000, UpdateTerakhir: '22/04/2026' },
    { id: '6', Nama: 'Indomie Goreng', Kategori: 'Sembako', Stok: 120, Satuan: 'Bks', MinStok: 40, HargaModal: 2800, HargaJual: 3500, UpdateTerakhir: '22/04/2026' },
    { id: '7', Nama: 'Sabun Cuci Piring', Kategori: 'Peralatan', Stok: 15, Satuan: 'Pouch', MinStok: 10, HargaModal: 12000, HargaJual: 14000, UpdateTerakhir: '22/04/2026' },
  ]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const categories = ["Semua", ...Array.from(new Set(stock.map(item => item.Kategori)))];

  const filteredItems = stock.filter(item => {
    const matchesSearch = item.Nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "Semua" || item.Kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = stock.filter(item => item.Stok <= item.MinStok);
  const totalValue = stock.reduce((acc, item) => acc + (item.Stok * item.HargaModal), 0);

  const stats = [
    { label: "Total Barang", value: stock.length, icon: Package, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Stok Menipis", value: lowStockItems.length, icon: AlertTriangle, color: "text-orange-500", bgColor: "bg-orange-50" },
    { label: "Aset Stok", value: `Rp ${totalValue.toLocaleString('id-ID')}`, icon: DollarSign, color: "text-green-500", bgColor: "bg-green-50" },
  ];

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
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">Manajemen Stok</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Kelola Stok Barang Fisik & Sembako</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Restructured Stats Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aset Stok</p>
            <h2 className="text-3xl font-black text-[#005E6A]">Rp {totalValue.toLocaleString('id-ID')}</h2>
          </div>
          
          <div className="flex items-center border-t border-slate-50">
            <div className="flex-1 p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Barang</p>
              <div className="flex items-center justify-center gap-2 text-[#005E6A]">
                <Package className="w-3.5 h-3.5" />
                <span className="text-sm font-black">{stock.length}</span>
              </div>
            </div>
            <div className="w-[1px] h-12 bg-slate-50" />
            <div className="flex-1 p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Menipis</p>
              <div className="flex items-center justify-center gap-2 text-orange-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-sm font-black">{lowStockItems.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E6A] transition-colors" />
            <input 
              type="text"
              placeholder="Cari Barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-[13px] font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5 focus:border-[#005E6A] transition-all w-full shadow-sm placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  categoryFilter === cat 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Daftar Barang</h3>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#005E6A] p-2 rounded-lg text-white shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-3">
            {filteredItems.map((item, i) => {
              const isLow = item.Stok <= item.MinStok;
              const stockPercent = Math.min((item.Stok / (item.MinStok * 3)) * 100, 100);
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-[#005E6A]/20 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-orange-50 text-orange-500' : 'bg-teal-50 text-[#005E6A]'}`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-[#005E6A] uppercase tracking-tight">{item.Nama}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.Kategori} • {item.Satuan}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-black text-[#F15A24]">Rp {item.HargaJual.toLocaleString('id-ID')}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Modal: Rp {item.HargaModal.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black tabular-nums ${isLow ? 'text-orange-500' : 'text-[#005E6A]'}`}>
                          {item.Stok} {item.Satuan}
                        </span>
                        {isLow && (
                          <Badge className="bg-orange-500 text-white border-none text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="w-2 h-2" />
                            Stok Menipis
                          </Badge>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Target: {item.MinStok * 2}+</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stockPercent}%` }}
                        className={`h-full rounded-full ${isLow ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-[#005E6A]'}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Update: {item.UpdateTerakhir}</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-1.5 border border-slate-100 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
                         <MinusCircle className="w-3.5 h-3.5" />
                       </button>
                       <button className="p-1.5 border border-slate-100 rounded-lg text-[#005E6A] hover:bg-slate-50 transition-colors">
                         <PlusCircle className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barang tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#005E6A] p-6 text-white shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Tambah Produk</h3>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Input Data Barang Baru</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
                {/* Scanner Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Barcode</label>
                    <button 
                      onClick={() => setIsScanning(!isScanning)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        isScanning ? "bg-red-500 text-white" : "bg-[#005E6A] text-white"
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      {isScanning ? "Stop Scan" : "Scan Barcode"}
                    </button>
                  </div>
                  
                  {isScanning && (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#005E6A]/20">
                      <BarcodeScannerComponent 
                        onResult={(decodedText) => {
                          const idInput = document.getElementById('new-product-id') as HTMLInputElement;
                          if (idInput) idInput.value = decodedText;
                          setIsScanning(false);
                        }} 
                      />
                    </div>
                  )}

                  <input 
                    id="new-product-id"
                    type="text" 
                    placeholder="Masukkan atau Scan ID Barang"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</label>
                    <input 
                      id="new-product-name"
                      type="text" 
                      placeholder="Contoh: Indomie Goreng"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                    <select 
                      id="new-product-category"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5 appearance-none"
                    >
                      <option value="Sembako">Sembako</option>
                      <option value="Mie instan">Mie instan</option>
                      <option value="Kopi">Kopi</option>
                      <option value="Makanan ringan">Makanan ringan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Sabun">Sabun</option>
                      <option value="Mainan">Mainan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual</label>
                    <input 
                      id="new-product-price"
                      type="number" 
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">modal</label>
                    <input 
                      id="new-product-cost"
                      type="number" 
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok</label>
                    <input 
                      id="new-product-stock"
                      type="number" 
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                <button 
                  onClick={async () => {
                    const id = (document.getElementById('new-product-id') as HTMLInputElement).value;
                    const name = (document.getElementById('new-product-name') as HTMLInputElement).value;
                    const category = (document.getElementById('new-product-category') as HTMLSelectElement).value;
                    const price = (document.getElementById('new-product-price') as HTMLInputElement).value;
                    const cost = (document.getElementById('new-product-cost') as HTMLInputElement).value;
                    const stockVal = (document.getElementById('new-product-stock') as HTMLInputElement).value;

                    if (!id || !name || !price || !cost || !stockVal) {
                      alert("Mohon isi semua data!");
                      return;
                    }

                    setIsSaving(true);
                    try {
                      const scriptUrl = (import.meta as any).env.VITE_ADD_PRODUCT_SCRIPT_URL;
                      if (scriptUrl) {
                        await fetch(scriptUrl, {
                          method: 'POST',
                          mode: 'no-cors',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            id,
                            nama: name,
                            kategori: category,
                            harga: parseInt(price),
                            modal: parseInt(cost),
                            stok: parseInt(stockVal),
                            timestamp: new Date().toISOString()
                          })
                        });
                      }

                      // Update local state too
                      const newItem: StockItem = {
                        id,
                        Nama: name,
                        Kategori: category,
                        Stok: parseInt(stockVal),
                        Satuan: 'Unit',
                        MinStok: 5,
                        HargaModal: parseInt(cost),
                        HargaJual: parseInt(price),
                        UpdateTerakhir: new Date().toLocaleDateString('id-ID')
                      };
                      setStock(prev => [newItem, ...prev]);
                      setIsAddModalOpen(false);
                      setIsScanning(false);
                      // Reset values
                      (document.getElementById('new-product-id') as HTMLInputElement).value = '';
                      (document.getElementById('new-product-name') as HTMLInputElement).value = '';
                      (document.getElementById('new-product-price') as HTMLInputElement).value = '';
                      (document.getElementById('new-product-cost') as HTMLInputElement).value = '';
                      (document.getElementById('new-product-stock') as HTMLInputElement).value = '';
                    } catch (error) {
                      console.error("Error saving product:", error);
                      alert("Gagal menyimpan data ke Spreadsheet. Pastikan URL Script benar.");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full bg-[#005E6A] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-[#005E6A]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BarcodeScannerComponent = ({ onResult }: { onResult: (text: string) => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // 0 means only barcode/qr
    }, false);

    scanner.render((decodedText) => {
      onResult(decodedText);
      scanner.clear();
    }, (error) => {
      // console.log(error);
    });

    return () => {
      scanner.clear().catch(e => console.log("Scanner clear error", e));
    };
  }, [onResult]);

  return <div id="reader" className="w-full" />;
};

const AdminCustomerManagement = ({ customers, transactions, redeemedPoints }: { customers: Customer[], transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("Semua");

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

  const allCustomers = customers.map(c => {
    const pointsInfo = calculatePoints(c.Nama);
    const levelInfo = calculateCustomerLevel(transactions, c.Nama);
    return {
      ...c,
      activePoints: pointsInfo.activePoints,
      level: levelInfo.name
    };
  });

  const customerList = allCustomers
    .filter(c => {
      const matchesSearch = c.Nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = levelFilter === "Semua" || c.level === levelFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.Nama.localeCompare(b.Nama));

  const levelCounts = allCustomers.reduce((acc: any, curr) => {
    const level = curr.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 });

  const activeCustomersCount = customers.length;

  const levelColorMap: Record<string, { bg: string, text: string, chart: string, iconBg: string, iconColor: string }> = {
    Bronze: { bg: "bg-orange-50", text: "text-orange-600", chart: "#f97316", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
    Silver: { bg: "bg-slate-100", text: "text-slate-600", chart: "#94a3b8", iconBg: "bg-slate-100", iconColor: "text-slate-500" },
    Gold: { bg: "bg-yellow-50", text: "text-yellow-600", chart: "#f59e0b", iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
    Platinum: { bg: "bg-indigo-50", text: "text-indigo-600", chart: "#4f46e5", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  };

  const chartData = Object.entries(levelCounts)
    .filter(([_, count]) => (count as number) > 0)
    .map(([level, count]) => ({
      name: level,
      value: count as number,
      color: levelColorMap[level]?.chart || "#cbd5e1"
    }));

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
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight whitespace-nowrap">Manajemen Pelanggan</h1>
          </div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Daftar Poin dan Level Pelanggan</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
          <div className="flex justify-between items-center px-2 mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Pelanggan</p>
              <h3 className="text-sm font-black text-[#005E6A]">{activeCustomersCount} Orang</h3>
            </div>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
                          <p className="text-xs font-black text-[#005E6A]">{data.value} Pelanggan</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-y-3 mt-4 px-4 pb-2">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-black text-[#005E6A]">
                  <span className="text-xs">{item.value}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Pelanggan</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pencarian Nama */}
        <div className="relative group px-2">
          <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E6A] transition-colors" />
          <input 
            type="text"
            placeholder="Cari Nama Pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 rounded-3xl pl-12 pr-6 py-4 text-[13px] font-bold text-[#005E6A] focus:outline-none focus:ring-4 focus:ring-[#005E6A]/5 focus:border-[#005E6A] transition-all w-full shadow-sm placeholder:text-slate-300"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 px-2">
            <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider whitespace-nowrap">Daftar Pelanggan</h3>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mr-2 pr-2">
              {["Semua", "Bronze", "Silver", "Gold", "Platinum"].map(label => (
                <button
                  key={label}
                  onClick={() => setLevelFilter(label)}
                  className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    levelFilter === label 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-3">
            {customerList.length > 0 ? (
              customerList.map((c, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-[#005E6A]/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/customers/${encodeURIComponent(c.Nama)}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${levelColorMap[c.level]?.iconBg || 'bg-slate-50'} ${levelColorMap[c.level]?.iconColor || 'text-slate-400'} transition-all`}>
                      <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-[#005E6A] uppercase tracking-tight">{c.Nama}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 font-black">
                        <span className="text-[10px] text-[#F15A24] tabular-nums">{c.activePoints}</span>
                        <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold">Poin Aktif</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${levelColorMap[c.level]?.bg || "bg-slate-50"} ${levelColorMap[c.level]?.text || "text-slate-600"} border-none text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full`}>
                      {c.level}
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


const AdminDebtManagement = ({ customers, transactions }: { customers: Customer[], transactions: DebtTransaction[] }) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("Semua");

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const total = customers.reduce((acc, c) => acc + parseCurrency(c.Hutang), 0);
  
  // 1. Calculate Monthly Debt Flow (MTD)
  const debtFlow = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyTxs = transactions.filter(t => {
      const d = parseDate(t.Tanggal);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const totalKasbon = monthlyTxs.filter(t => t.Tipe === "TAMBAH").reduce((acc, curr) => acc + curr.Jumlah, 0);
    const totalBayar = monthlyTxs.filter(t => t.Tipe === "BAYAR").reduce((acc, curr) => acc + curr.Jumlah, 0);
    
    return { kasbon: totalKasbon, bayar: totalBayar };
  }, [transactions]);

  // 2. Global Recent Debt Activity
  const recentGlobalDebts = useMemo(() => {
    return [...transactions]
      .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())
      .slice(0, 5);
  }, [transactions]);

  const CHART_COLORS = ["#22c55e", "#eab308", "#ef4444"];
  const stats = [
    { label: "Lancar", value: 0, count: 0, color: "#22c55e" },
    { label: "Diragukan", value: 0, count: 0, color: "#FFE600" },
    { label: "Macet", value: 0, count: 0, color: "#FF005C" }
  ];

  const allItems = customers
    .filter(c => parseCurrency(c.Hutang) > 0)
    .map(c => {
      const userTransactions = transactions.filter(t => t.Nama.toLowerCase() === c.Nama.toLowerCase());
      const collectResult = calculateUserCollectability(userTransactions);
      const debtVal = parseCurrency(c.Hutang);
      
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

      const tierColor = collectResult.label === "Lancar" ? "#22c55e" : collectResult.label === "Diragukan" ? "#FFE600" : "#FF005C";
      
      return { 
        name: c.Nama, 
        value: debtVal,
        color: tierColor,
        statusLabel: collectResult.label,
        statusBadge: {
          label: collectResult.label,
          color: tierColor
        },
        sortOrder: collectResult.sortOrder,
        latestDate: userTransactions.length > 0 
          ? [...userTransactions].sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime())[0].Tanggal
          : "-"
      };
    });

  const filteredItems = allItems
    .filter(item => statusFilter === "Semua" || item.statusLabel === statusFilter)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return parseDate(b.latestDate).getTime() - parseDate(a.latestDate).getTime();
    });

  const handleItemClick = (name: string) => {
    navigate(`/hutang/${encodeURIComponent(name)}`);
  };

  const extraContent = (
    <div className="w-full space-y-4">
      {/* Debt Flow Summary */}
      <div className="flex items-center justify-between w-full px-4 border-t border-slate-50 pt-4 mt-2">
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Kasbon Bulan Ini</p>
          <p className="text-xs font-black text-red-600">+ Rp {debtFlow.kasbon.toLocaleString('id-ID')}</p>
        </div>
        <div className="w-[1px] h-8 bg-slate-100 flex-shrink-0 mx-2" />
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1 whitespace-nowrap">Bayar Bulan Ini</p>
          <p className="text-xs font-black text-green-600">- Rp {debtFlow.bayar.toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );

  const filterContent = (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mr-2 pr-2">
      {["Semua", "Lancar", "Diragukan", "Macet"].map(label => (
        <button
          key={label}
          onClick={() => setStatusFilter(label)}
          className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            statusFilter === label 
              ? "bg-slate-900 text-white shadow-lg" 
              : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminManagementPage 
        listTitle="Daftar Hutang"
        title="Manajemen Hutang"
        subtitle="Total Hutang Seluruh Pelanggan"
        totalLabel="Total Hutang"
        totalValue={total}
        items={filteredItems}
        icon={Receipt}
        colorClass="text-[#F15A24]"
        onItemClick={handleItemClick}
        stats={stats.filter(s => s.count > 0)}
        showBadges={false}
        extraContent={extraContent}
        rightHeaderContent={filterContent}
      />

      {/* Global Recent Activity */}
      <div className="px-6 pb-12 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Aktivitas Terakhir</h3>
          <History className="w-4 h-4 text-slate-400" />
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {recentGlobalDebts.length > 0 ? recentGlobalDebts.map((t, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.Tipe === 'TAMBAH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {t.Tipe === 'TAMBAH' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#005E6A] uppercase tracking-tight truncate max-w-[120px]">{t.Nama}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.Tanggal}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${t.Tipe === 'TAMBAH' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.Tipe === 'TAMBAH' ? '+' : '-'}{t.Jumlah.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">{t.Tipe === 'TAMBAH' ? 'Kasbon' : 'Pelunasan'}</p>
                </div>
              </div>
            )) : (
              <p className="p-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada aktivitas</p>
            )}
          </div>
        </div>
      </div>
    </div>
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
        const val = userTx.reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);
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
      const val = prosesGeneral.reduce((acc, t) => acc + ((t.HargaModal || 0) - (t.Sebagian || 0)), 0);
      if (val > 0) prosesCustomersList.push({ name: "Pelanggan Umum", value: val });
    }

    const sortedBelum = [...belumCustomersList].sort((a,b) => b.value - a.value);
    const sortedProses = [...prosesCustomersList].sort((a,b) => b.value - a.value);

    const totalValue = sortedBelum.reduce((acc, i) => acc + i.value, 0) + sortedProses.reduce((acc, i) => acc + i.value, 0);
    const belumTotalValue = sortedBelum.reduce((acc, i) => acc + i.value, 0);
    const prosesTotalValue = sortedProses.reduce((acc, i) => acc + i.value, 0);

    const CHART_COLORS = ["#FF00ED", "#00F0FF", "#FFE600", "#00FF00", "#FF5C00", "#7000FF", "#00FF94", "#FF005C", "#0075FF", "#FFA800"];
    
    // Calculate colors first for synchronization
    const totalsByName: Record<string, number> = {};
    [...sortedBelum, ...sortedProses].forEach(i => {
      totalsByName[i.name] = (totalsByName[i.name] || 0) + i.value;
    });
    const sortedChartList = Object.entries(totalsByName).sort((a,b) => b[1] - a[1]);
    const colorMap: Record<string, string> = {};
    sortedChartList.slice(0, 10).forEach(([name, val], idx) => {
      colorMap[name] = CHART_COLORS[idx % CHART_COLORS.length];
    });

    const finalItems: any[] = [];
    if (sortedBelum.length > 0) {
      finalItems.push({ name: 'Belum Diambil', value: 0, isHeader: true });
      sortedBelum.forEach(item => {
        const itemColor = colorMap[item.name] || "#CBD5E1";
        finalItems.push({
          ...item,
          color: itemColor,
          badge: {
            label: `Rp ${item.value.toLocaleString('id-ID')}`,
            colorClass: `bg-[#0d9488]/5 text-[#0d9488]`,
            customIconColor: itemColor
          }
        });
      });
    }
    if (sortedProses.length > 0) {
      finalItems.push({ name: 'Diproses', value: 0, isHeader: true });
      sortedProses.forEach(item => {
        const itemColor = colorMap[item.name] || "#CBD5E1";
        finalItems.push({
          ...item,
          color: itemColor,
          badge: {
            label: `Rp ${item.value.toLocaleString('id-ID')}`,
            colorClass: `bg-[#ea580c]/5 text-[#ea580c]`,
            customIconColor: itemColor
          }
        });
      });
    }

    const stats = sortedChartList.slice(0, 10).map(([name, val], idx) => ({
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

  // Process data for the chart (from first transaction to now)
  const chartData = React.useMemo(() => {
    const allUserTransactions = transactions.filter(t => 
      t.Nama.toLowerCase() === user?.Nama?.toLowerCase()
    );

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Find earliest transaction
    let earliestDate = new Date(currentYear, currentMonth, 1);
    allUserTransactions.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate.getTime() > 0 && tDate < earliestDate) {
        earliestDate = new Date(tDate.getFullYear(), tDate.getMonth(), 1);
      }
    });

    // Generate list of months from earliest to now
    const labels: { month: number, year: number, label: string, total: number }[] = [];
    let iterateDate = new Date(earliestDate);
    
    while (iterateDate <= new Date(currentYear, currentMonth, 1)) {
      labels.push({
        month: iterateDate.getMonth(),
        year: iterateDate.getFullYear(),
        label: iterateDate.toLocaleString('id-ID', { month: 'short' }),
        total: 0
      });
      iterateDate.setMonth(iterateDate.getMonth() + 1);
    }

    // Ensure at least 6 months if range is too small for better chart visual
    if (labels.length < 6) {
      const extraNeeded = 6 - labels.length;
      const firstLabel = labels[0];
      for (let i = 1; i <= extraNeeded; i++) {
        const d = new Date(firstLabel.year, firstLabel.month - i, 1);
        labels.unshift({
          month: d.getMonth(),
          year: d.getFullYear(),
          label: d.toLocaleString('id-ID', { month: 'short' }),
          total: 0
        });
      }
    }
    
    allUserTransactions.forEach(t => {
      const tDate = parseDate(t.Tanggal);
      if (tDate.getTime() === 0) return;

      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      const bucket = labels.find(m => m.month === tMonth && m.year === tYear);
      if (bucket) {
        bucket.total += t.Pemasukan;
      }
    });

    return labels;
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

  const totalSixMonths = (chartData as any[]).reduce((acc, curr) => acc + curr.total, 0);
  const selectedMonthData = (chartData as any[]).find(m => m.month === selectedMonth.month && m.year === selectedMonth.year);
  const totalSelectedMonth = selectedMonthData?.total || 0;
  const selectedMonthLabel = selectedMonthData?.label || "";

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
        color,
        percentage: totalSelectedMonth > 0 ? (data.total / totalSelectedMonth) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);
  }, [groupedTransactions]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (jenis: string) => {
    setExpandedGroups(prev => 
      prev.includes(jenis) ? prev.filter(g => g !== jenis) : [...prev, jenis]
    );
  };

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
              {[...chartData].reverse().map((m, i) => (
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
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Belanja {selectedMonthLabel}</p>
                  <h4 className="text-xl font-black text-[#005E6A]">
                    Rp {formatCurrency(totalSelectedMonth)}
                  </h4>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <PieChart className="w-5 h-5 text-[#005E6A]" />
                </div>
              </div>

              {pieData.length > 0 && (
                <div className="mb-4 bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-[#F15A24]" />
                    <p className="text-[9px] font-black text-[#F15A24] uppercase tracking-wider">
                      Terpopuler: {pieData[0].name} ({Math.round(pieData[0].percentage)}%)
                    </p>
                  </div>
                </div>
              )}
              
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 px-2">
                {pieData.sort((a,b) => b.value - a.value).map((item: any, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <p className="text-[8px] font-black text-slate-500 uppercase truncate">{item.name}</p>
                    </div>
                    <p className="text-[8px] font-black text-slate-400">{Math.round(item.percentage)}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable Categorized List */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Kategori Transaksi</h3>
              {Object.entries(groupedTransactions)
                .sort(([, a], [, b]) => (b as any).total - (a as any).total)
                .map(([jenis, data]: [string, any], idx) => {
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
  const [showQR, setShowQR] = useState(false);
  const [showLevelBenefits, setShowLevelBenefits] = useState(false);
  
  const customerLevel = calculateCustomerLevel(transactions, user?.Nama || "");
  const activePoints = calculateActivePoints(user?.Nama || "", transactions, redeemedPoints);

  return (
    <ProtectedPage user={user} title="Profil" customers={customers} onLogin={onLogin} setActiveTab={setActiveTab}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4"
      >
      {/* Unified Profile Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[9px] font-black text-[#005E6A] uppercase tracking-[0.2em]">Profil</p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-500/10" />
            <span className="text-[8px] font-black text-blue-500 uppercase">Terverifikasi</span>
          </div>
        </div>
        
        <div className="p-8">
          {/* Profile Header Section */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 mb-4 relative group flex items-center justify-center">
              <User className="w-12 h-12 text-slate-400" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <button 
              onClick={() => setShowQR(true)}
              className="absolute top-0 right-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#005E6A] shadow-sm border border-slate-100 active:scale-90 transition-transform"
            >
              <QrCode className="w-5 h-5" />
            </button>

            <h1 className="text-2xl font-black text-[#005E6A] uppercase tracking-tight">{user?.Nama}</h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: WT-{Math.abs(user?.Nama?.length || 0)}-{user?.Nama?.substring(0,2).toUpperCase()}</p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
              <div 
                onClick={() => navigate(`/poin/${encodeURIComponent(user?.Nama || '')}`)}
                className="flex flex-col items-center gap-1 group transition-colors cursor-pointer active:scale-95 px-2"
              >
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Loyalitas</p>
                <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-tight">{activePoints} Poin</p>
              </div>
              <div 
                onClick={() => setShowLevelBenefits(true)}
                className="flex flex-col items-center gap-1 group transition-colors cursor-pointer active:scale-95 px-2"
              >
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-[#F15A24] fill-[#F15A24]" />
                </div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Level</p>
                <p className="text-[10px] font-black text-[#F15A24] uppercase tracking-tight">{customerLevel.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm mb-6">
        {[
          { icon: ShieldCheck, label: "Keamanan", color: "text-green-500", action: () => {} },
          { icon: Bell, label: "Notifikasi", color: "text-orange-500", action: () => {} },
          { icon: Globe, label: "Bahasa", color: "text-purple-500", action: () => {} },
          { icon: HelpCircle, label: "Bantuan", color: "text-[#005E6A]", action: () => navigate("/bantuan") },
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={item.action}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
          >
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
        {showQR && (
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
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-16 h-16 bg-[#005E6A]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-8 h-8 text-[#005E6A]" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-1">ID Digital Pelanggan</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Pindai di kasir Warung Tomi</p>
              
              <div className="bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-inner mb-6 flex items-center justify-center">
                <div className="w-48 h-48 bg-slate-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WARUNGTOMI-${user?.Nama}`}
                    alt="Customer QR Code"
                    className="w-40 h-40 object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <img src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" alt="Logo" className="w-6 h-6 object-contain" />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[11px] font-black text-[#005E6A] tracking-tighter uppercase">{user?.Nama}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">WT-{Math.abs(user?.Nama?.length || 0)}-{user?.Nama?.substring(0,2).toUpperCase()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Benefits Modal */}
      <AnimatePresence>
        {showLevelBenefits && (
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
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col relative"
            >
              <button 
                onClick={() => setShowLevelBenefits(false)}
                className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
              <div className={`w-16 h-16 bg-gradient-to-br ${customerLevel.color} rounded-2xl flex items-center justify-center mb-6`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-1">Keuntungan Level {customerLevel.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Nikmati benefit eksklusif Anda</p>
              
              <div className="space-y-4 mb-8">
                {customerLevel.benefits?.map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Belanja 3 Bulan</p>
                <p className="text-sm font-black text-[#F15A24]">Rp {customerLevel.total.toLocaleString('id-ID')}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

const HelpPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Apa itu Kartu Loyalitas Warung Tomi?",
      a: "Kartu Loyalitas digital ini adalah program eksklusif dari Warung Tomi untuk memberikan apresiasi kepada pelanggan setia kami. Dengan kartu ini, Anda dapat mengumpulkan poin dari setiap transaksi dan menikmat berbagai keuntungan eksklusif sesuai level keanggotaan Anda."
    },
    {
      q: "Bagaimana cara mendapatkan poin?",
      a: "Poin didapatkan secara otomatis setiap kali Anda melakukan pembelian barang atau layanan di Warung Tomi. Pastikan data transaksi Anda sudah dicatat oleh admin kami. Besaran poin biasanya dihitung berdasarkan total nominal belanja Anda."
    },
    {
      q: "Bagaimana cara menukarkan poin?",
      a: "Anda dapat menukarkan poin di halaman 'Poin Loyalitas'. Pilih hadiah yang Anda inginkan (seperti minyak goreng, deterjen, atau sembako lainnya), pastikan poin Anda cukup, lalu klik 'Tukarkan'. Setelah itu, sampaikan ke admin di toko untuk pengambilan barang."
    },
    {
      q: "Apa itu Level Pelanggan?",
      a: "Level Pelanggan ditentukan oleh total nilai belanja Anda selama 30 hari terakhir. Ada beberapa level: Bronze, Silver, Gold, Platinum, dan Diamond. Semakin tinggi level Anda, semakin besar gengsi dan potensi keuntungan yang bisa Anda dapatkan di masa mendatang."
    },
    {
      q: "Layanan apa saja yang tersedia selain sembako?",
      a: "Warung Tomi menyediakan berbagai layanan digital lengkap seperti: Top Up Pulsa & Data, Pembayaran Token Listrik, Pembayaran Tagihan (BPJS, PDAM, dll), hingga layanan Top Up Game dan E-Wallet (Dana/OVO/Gopay)."
    },
    {
      q: "Apakah keamanan data saya terjamin?",
      a: "Sangat terjamin. Anda memerlukan PIN rahasia untuk masuk ke profil pribadi Anda. Pastikan PIN Anda tidak diberitahukan kepada orang lain. Data riwayat belanja Anda hanya dapat dilihat oleh Anda dan sistem internal kami."
    },
    {
      q: "Bagaimana jika saya menemui kendala di aplikasi?",
      a: "Anda dapat langsung menghubungi layanan pelanggan kami melalui tombol WhatsApp di halaman utama, atau datang langsung ke lokasi Warung Tomi di Dusun Manis, Desa Wilanagara untuk bantuan teknis secara langsung."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white pb-24"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>
        <div>
          <h1 className="text-xl font-black text-[#005E6A] uppercase tracking-tight">Pusat Bantuan</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Pertanyaan & Jawaban</p>
        </div>
      </div>

      <div className="p-6">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari solusi atau pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] focus:outline-none focus:border-[#005E6A]/20 transition-all"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-3xl border transition-all duration-300 ${isExpanded ? 'border-[#005E6A]/20 shadow-xl shadow-[#005E6A]/5' : 'border-slate-100 shadow-sm'}`}
              >
                <button 
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full p-6 flex items-start gap-4 text-left"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-[#005E6A] text-white' : 'bg-slate-50 text-[#005E6A]'}`}>
                    <span className="text-[10px] font-black">Q</span>
                  </div>
                  <div className="flex-1 pr-4">
                    <h3 className={`text-[11px] font-black leading-relaxed uppercase tracking-tight transition-colors ${isExpanded ? 'text-[#005E6A]' : 'text-slate-800'}`}>
                      {faq.q}
                    </h3>
                  </div>
                  <div className={`mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className={`w-4 h-4 ${isExpanded ? 'text-[#005E6A]' : 'text-slate-300'}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-teal-600">A</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          }) : (
            <div className="py-20 text-center">
              <HelpCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Maaf, pertanyaan tidak ditemukan</p>
            </div>
          )}
        </div>

        {/* Contact Support Footer */}
        <div className="mt-12 bg-[#005E6A] rounded-[2rem] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <h3 className="text-white font-black text-sm uppercase tracking-tight mb-2 relative z-10">Punya Pertanyaan Lain?</h3>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6 relative z-10">Tim kami siap membantu Anda secara langsung</p>
          <button 
            onClick={() => window.open('https://wa.me/6287774138090', '_blank')}
            className="bg-white text-[#005E6A] px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            Hubungi WhatsApp
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const QRISPage = () => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      window.open(qrisUrl, '_blank');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full -ml-24 -mb-24 blur-2xl" />
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2 mt-4">
            <QrCode className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Qris</h1>
          </div>
          <p className="text-[8px] font-bold text-teal-100/60 uppercase tracking-[0.2em]">Scan QR Untuk Transaksi Cepat</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        <div className="bg-white p-4 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col items-center">
          <div 
            className="w-full aspect-square bg-white rounded-[3rem] overflow-hidden flex items-center justify-center cursor-pointer group mt-4 mb-2"
            onClick={() => setIsFullScreen(true)}
          >
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={qrisUrl} 
                alt="QRIS Warung Tomi" 
                className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="text-center mt-6 mb-2 flex flex-col items-center">
            <h2 className="text-lg font-black text-[#005E6A] uppercase tracking-tight">WARUNG TOMI</h2>
          </div>

          <button 
            className="w-full bg-[#F15A24] text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-100 active:scale-95 transition-transform"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Download Kode QR</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-4 h-4 text-[#005E6A]" />
            <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Cara Menggunakan Qris</h3>
          </div>
          
          <div className="space-y-4">
            {[
              "Buka aplikasi e-wallet atau mobile banking Anda.",
              "Pilih menu 'Scan' atau 'Bayar'.",
              "Arahkan kamera ke kode QR di atas.",
              "Pastikan nama merchant adalah WARUNG TOMI.",
              "Masukkan nominal pembayaran yang sesuai.",
              "Konfirmasi pembayaran dan masukkan PIN Anda.",
              "Transaksi selesai! Simpan bukti pembayaran Anda."
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-black text-[#005E6A]">{i + 1}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{step}</p>
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
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={qrisUrl}
              alt="QRIS Full Screen"
              className="max-w-full max-h-[80vh] object-contain rounded-3xl bg-white p-4"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TarikTunaiPage = () => {
  const navigate = useNavigate();
  const [activeTransferTab, setActiveTransferTab] = useState<'bank' | 'ewallet'>('bank');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [calcAmount, setCalcAmount] = useState<string>("");
  const [showFeeTable, setShowFeeTable] = useState(false);
  
  const calculateFee = (amount: number) => {
    if (amount <= 0) return 0;
    if (amount < 100000) return 3000;
    if (amount <= 999999) return 5000;
    if (amount <= 1999999) return 10000;
    if (amount <= 2999999) return 15000;
    if (amount <= 3999999) return 20000;
    if (amount <= 4999999) return 25000;
    return Math.round(amount * 0.005);
  };

  const amountNum = parseInt(calcAmount.replace(/\D/g, "")) || 0;
  const adminFee = calculateFee(amountNum);
  const totalReceived = Math.max(0, amountNum - adminFee);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const bankAccounts = [
    { 
      bank: "BNI", 
      number: "0910073587", 
      name: "Tomi Eka Saputra", 
      color: "bg-white", 
      textColor: "text-orange-600",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPUlQraqG44DouUxZ7p34WInziOLr71_ALsQ9VnOhW0w-43H8vxP5XlK4&s=10"
    },
    { 
      bank: "BCA", 
      number: "2991060351", 
      name: "Tomi Eka Saputra", 
      color: "bg-white", 
      textColor: "text-blue-600",
      logo: "https://minang.geoparkrun.com/wp-content/uploads/2022/11/bca-logo.png"
    },
    { 
      bank: "MANDIRI", 
      number: "1340025750471", 
      name: "Tomi Eka Saputra", 
      color: "bg-white", 
      textColor: "text-yellow-600",
      logo: "https://iconlogovector.com/uploads/images/2023/04/lg-920c179a18fea792a882b0596ac14e8b58.jpg"
    },
    { 
      bank: "BRI", 
      number: "428001042098534", 
      name: "Sri Ayu Rupnia", 
      color: "bg-white", 
      textColor: "text-blue-700",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0-vtFtJyluPYFuCRB0W_6h4PAO3Im9GtOPFGEb4YPbUviN-dhaHrTk-0&s=10"
    },
  ];

  const ewalletAccounts = [
    { 
      provider: "DANA", 
      logo: "https://iconlogovector.com/uploads/images/2024/11/lg-673fa21a3ad2c-DANA.webp",
      accounts: [
        { number: "087774138090", name: "TOMI EKA SAPUTRA" },
        { number: "085946633008", name: "SRI AYU RUPNIA" }
      ]
    },
    { 
      provider: "GOPAY", 
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDMY-KG47ruPkCOvYBb7dw3MUkUVb74tZtuM17iGSStuxn728ZSXxXhWcv&s=10",
      accounts: [
        { number: "087774138090", name: "TOMI EKA SAPUTRA" },
        { number: "085946633008", name: "SRI AYU RUPNIA" }
      ]
    },
    { 
      provider: "OVO", 
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuUZVdeiUB_55qfLVb7doFVTPt7kKWYdNFcQc881ZJztGnrWunQ16oXhg&s=10",
      accounts: [
        { number: "087774138090", name: "TOMI EKA SAPUTRA" }
      ]
    },
    { 
      provider: "SHOPEEPAY", 
      logo: "https://storage.googleapis.com/flip-prod-mktg-strapi/media-library/45_0_cakapinterview_20d564f12f/45_0_cakapinterview_20d564f12f.jpg",
      accounts: [
        { number: "087774138090", name: "TOMI EKA SAPUTRA" }
      ]
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full -ml-24 -mb-24 blur-2xl" />
        
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2 mt-4">Tarik Tunai</h1>
          <p className="text-[8px] font-bold text-teal-100/60 uppercase tracking-[0.2em]">Pilihan Cara Pencairan Saldo Anda</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-8">
        {/* Status & Directions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-[#005E6A] uppercase">Uang Tunai</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Tersedia di Kasir</p>
          </div>
          <a 
            href="https://maps.app.goo.gl/bnUitCFdP5sgqiw49" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center active:scale-95 transition-transform"
          >
            <MapPin className="w-4 h-4 text-[#F15A24] mb-1" />
            <span className="text-[9px] font-black text-[#005E6A] uppercase leading-tight">Petunjuk Arah</span>
          </a>
        </div>

        {/* Option 2: Transfer Bank / E-Wallet dengan Tab */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-[#005E6A] uppercase tracking-widest flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#F15A24]" />
              Kalkulator Biaya
            </h2>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Calculator className="w-24 h-24 text-[#005E6A]" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Masukan Nominal Tarik</p>
              <div className="relative mb-6">
                 <span className="absolute left-0 bottom-3 text-2xl font-black text-[#005E6A]">Rp</span>
                 <input 
                   type="text"
                   inputMode="numeric"
                   value={calcAmount}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\D/g, "");
                     setCalcAmount(val ? parseInt(val).toLocaleString('id-ID') : "");
                   }}
                   placeholder="0"
                   className="w-full bg-transparent border-b-2 border-slate-100 pb-2 pl-10 text-3xl font-black text-[#005E6A] focus:outline-none focus:border-[#F15A24] transition-colors placeholder:text-slate-100"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Potongan Admin</p>
                  <p className="text-xs font-black text-rose-500">-{formatIDR(adminFee)}</p>
                </div>
                <div className="bg-[#005E6A] p-4 rounded-2xl text-white">
                  <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Diterima Tunai</p>
                  <p className="text-xs font-black whitespace-nowrap">{formatIDR(totalReceived)}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowFeeTable(!showFeeTable)}
                className="w-full py-3 rounded-xl border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest active:bg-slate-50 transition-colors"
              >
                {showFeeTable ? "Tutup Tabel Biaya" : "Lihat Rincian Biaya Admin"}
              </button>

              <AnimatePresence>
                {showFeeTable && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 space-y-2">
                       {[
                         { range: "< 100.000", fee: "3.000" },
                         { range: "101.000 - 999.999", fee: "5.000" },
                         { range: "1.000.000 - 1.999.999", fee: "10.000" },
                         { range: "2.000.000 - 2.999.999", fee: "15.000" },
                         { range: "3.000.000 - 3.999.999", fee: "20.000" },
                         { range: "4.000.000 - 4.999.999", fee: "25.000" },
                         { range: "> 5.000.000", fee: "0,5% Dari Nominal" },
                       ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                           <span className="text-[9px] font-bold text-slate-500 uppercase">{item.range}</span>
                           <span className="text-[10px] font-black text-[#005E6A]">Rp {item.fee}</span>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Option 1: EDC */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-[#005E6A] uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#005E6A] text-white flex items-center justify-center text-[10px]">1</span>
              Kartu ATM (Mesin EDC)
            </h2>
          </div>
          
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="relative aspect-[16/10] bg-slate-100">
              <img 
                src="https://www.bni.co.id/portals/1/BNI/ebanking/Images/edc-bni.jpg" 
                alt="BNI EDC Machine" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                 <Badge className="bg-orange-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
                   Terima Semua Kartu
                 </Badge>
                 <div className="bg-[#005E6A] text-white rounded-lg p-3 py-2 flex flex-col items-center shadow-lg border border-white/10">
                    <p className="text-[7px] font-black uppercase tracking-tighter opacity-60">Admin EDC</p>
                    <p className="text-[10px] font-black">Rp 3.000*</p>
                 </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-black text-slate-600 leading-relaxed uppercase tracking-wider text-center mb-6">
                Gesek atau masukkan kartu ATM/Debet Anda ke mesin <span className="text-[#005E6A]">EDC BNI</span> di lokasi warung.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-none border border-slate-100">
                  <p className="text-[9px] font-black text-[#005E6A] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Cek Saldo</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">BNI/PKH</span>
                      <span className="text-[9px] font-black text-green-600">GRATIS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">BANK LAIN</span>
                      <span className="text-[9px] font-black text-[#005E6A]">Rp 4.000</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-none border border-slate-100">
                  <p className="text-[9px] font-black text-[#005E6A] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Tarik Tunai</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">BNI/PKH</span>
                      <span className="text-[9px] font-black text-[#005E6A]">Rp 3.000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">BANK LAIN</span>
                      <span className="text-[9px] font-black text-[#005E6A]">Rp 9.500</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-rose-50 p-4 rounded-none border border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider leading-relaxed text-left italic">
                  * Biaya di atas adalah biaya layanan EDC yang dipotong langsung dari saldo ATM oleh Bank, belum termasuk biaya administrasi warung.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all">
                 <span className="text-[10px] font-black italic">VISA</span>
                 <span className="text-[10px] font-black italic">MASTERCARD</span>
                 <span className="text-[10px] font-black italic">GPN</span>
                 <span className="text-[10px] font-black italic">JCB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Option 2: Bank / E-Wallet dengan Tab */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-[#005E6A] uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#005E6A] text-white flex items-center justify-center text-[10px]">2</span>
              Bank / E-Wallet
            </h2>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
              {activeTransferTab === 'bank' 
                ? "Kirim ke salah satu rekening di bawah ini, lalu tunjukkan bukti kirimnya."
                : "Kirim ke nomor E-Wallet di bawah ini, lalu tunjukkan bukti kirimnya."}
            </p>

            <div className="flex p-1 bg-slate-50 rounded-2xl mb-6">
              <button 
                onClick={() => setActiveTransferTab('bank')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTransferTab === 'bank' ? 'bg-white text-[#005E6A] shadow-sm' : 'text-slate-400'}`}
              >
                Bank
              </button>
              <button 
                onClick={() => setActiveTransferTab('ewallet')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTransferTab === 'ewallet' ? 'bg-white text-[#005E6A] shadow-sm' : 'text-slate-400'}`}
              >
                E-Wallet
              </button>
            </div>
            
            <div className="space-y-3">
              {activeTransferTab === 'bank' ? (
                bankAccounts.map((account, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-full border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                        <img 
                          src={account.logo} 
                          alt={account.bank} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#005E6A] tracking-wider tabular-nums leading-none mb-1">
                          {account.number}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{account.name}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(account.number);
                          alert(`Nomor ${account.bank} berhasil disalin!`);
                        }}
                        className="p-2 text-slate-300 hover:text-[#005E6A] transition-all active:scale-75"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                ewalletAccounts.map((wallet, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      {/* Logo Area */}
                      <div className="w-10 h-10 rounded-full border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2 mt-1">
                        <img 
                          src={wallet.logo} 
                          alt={wallet.provider} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Numbers Area */}
                      <div className="flex-1 space-y-4 pt-1">
                        {wallet.accounts.map((acc, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between group/item border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-[#005E6A] tracking-wider tabular-nums leading-none mb-1">
                                {acc.number}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-slate-100" />
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{acc.name}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(acc.number);
                                alert(`Nomor ${wallet.provider} ${acc.name} berhasil disalin!`);
                              }}
                              className="p-2 text-slate-300 hover:text-[#005E6A] transition-all active:scale-75"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Option 3: QRIS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-[#005E6A] uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#005E6A] text-white flex items-center justify-center text-[10px]">3</span>
              QRIS (E-Wallet)
            </h2>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
             <div 
               className="w-48 h-48 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center mx-auto mb-6 border border-indigo-100 overflow-hidden p-3 cursor-pointer group hover:scale-105 transition-transform"
               onClick={() => setIsFullScreen(true)}
             >
               <img 
                 src={qrisUrl} 
                 alt="QRIS Warung Tomi" 
                 className="w-full h-full object-contain rounded-2xl"
                 referrerPolicy="no-referrer"
               />
             </div>
             <p className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest mb-2 leading-none">Scan Kode QR</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed px-4">
               Cairkan saldo E-Wallet (ShopeePay, Dana, OVO, dll) meskipun belum berstatus premium.
             </p>
             
             <button 
               onClick={() => navigate("/qris")}
               className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               Cara Gunakan QRIS
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={qrisUrl}
              alt="QRIS Full Screen"
              className="max-w-full max-h-[80vh] object-contain rounded-3xl bg-white p-4 shadow-2xl"
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

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 2000); // Shortened from 3200ms
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-[200] bg-white flex items-center justify-center overflow-hidden"
    >
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.1
            }
          }
        }}
        className="relative flex items-center gap-4"
      >
        {/* Animated Logo Container */}
        <motion.div
          variants={{
            hidden: { scale: 0.8, opacity: 0, rotate: -5 },
            show: { 
              scale: 1, 
              opacity: 1, 
              rotate: 0,
              transition: { 
                type: "spring",
                damping: 20,
                stiffness: 120, // More responsive spring
                mass: 1
              } 
            }
          }}
          className="w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#005E6A]/10 border-2 border-slate-50 relative z-20 bg-white shrink-0"
        >
          <img 
            src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Animated Text Block */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 overflow-hidden h-10">
            <motion.div
              variants={{
                hidden: { x: -40, opacity: 0 },
                show: { 
                  x: 0, 
                  opacity: 1,
                  transition: { 
                    duration: 0.6, // Faster movement
                    ease: [0.16, 1, 0.3, 1] 
                  } 
                }
              }}
              className="flex items-center gap-1"
            >
              <span className="text-4xl font-black tracking-tighter text-[#005E6A]">WARUNG</span>
              <span className="text-4xl font-black tracking-tighter text-[#F15A24]">TOMI</span>
            </motion.div>
          </div>
          
          <div className="overflow-hidden h-4 mt-1">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { 
                  opacity: 0.5, 
                  y: 0,
                  transition: { 
                    duration: 0.5,
                    ease: "easeOut" 
                  } 
                }
              }}
              className="flex justify-between w-full px-1"
            >
              {"Digital Solution".split("").map((char, i) => (
                <span key={i} className="text-[10px] font-black text-[#005E6A] tracking-[0.25em] uppercase leading-none">
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Decorative background element for added "smoothness" */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 3, // Faster pulse
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -inset-20 bg-[#005E6A]/5 rounded-full blur-[100px] -z-10"
        />
      </motion.div>
    </motion.div>
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
            src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
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
  const [dataError, setDataError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
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
  }, []);

  const fetchData = async (showLoading = true) => {
    if (isFetching.current && !showLoading) return;
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    isFetching.current = true;
    if (showLoading) {
      setIsLoading(true);
      setDataError(null);
    }

      try {
        const urls = [
          { name: "Pelanggan", url: (import.meta as any).env.VITE_CSV_PELANGGAN || "https://docs.google.com/spreadsheets/d/e/2PACX-1vS89JF6HJLZL4wD5YRvaEqqY2nF_VvKmzfKHzrP19PYZnGFudVzpzD94WWC0ueb35rJFCEs7OtEX083/pub?gid=0&single=true&output=csv" },
          { name: "Tabungan", url: (import.meta as any).env.VITE_CSV_TABUNGAN || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwjRmZLCREHIEg4LlJwM_AT7WDpG808cxzY5C5IvKIsK920oQbiSPSSegEvyTD330DvVH0kswepwIE/pub?gid=1607784622&single=true&output=csv" },
          { name: "Investasi", url: (import.meta as any).env.VITE_CSV_INVESTASI || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBQ5kUdqwv5bBsJcaiponYzqU_JxO0g7qQb6DQ1ujJ9bzTkY5GlI5XQQXL9BVr22gdmM7V7eEIDMH9/pub?gid=799157484&single=true&output=csv" },
          { name: "Hutang", url: (import.meta as any).env.VITE_CSV_HUTANG || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQstrKWGJQeYcF3s_GNBSzB4q-PhQ7R4s4Gc-xy5F428uRbVjdf8c4bboL7JfIX5j1a0n-_FJGvPk7Q/pub?gid=2112924939&single=true&output=csv" },
          { name: "Penjualan", url: (import.meta as any).env.VITE_CSV_PENJUALAN || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCGVNALfAsaaLVyQx0halDo9U3Gk_QFEEEY96Zai9cTD4nfW5dQR8IWYig1-Cks01F08PjVVv-KDsW/pub?gid=526494903&single=true&output=csv" },
          { name: "Poin", url: (import.meta as any).env.VITE_CSV_POIN || "https://docs.google.com/spreadsheets/d/e/2PACX-1vTkme-_goN5R1iYP1oL_He5XOk1jWsnOBiCftzxwKCCQ7q9HO0pyjNBrsjYTOlzrAo_AQcpYmq6owPl/pub?gid=1420871988&single=true&output=csv" }
        ];
        
        // Fetch individually to better pinpoint failures
        const fetchWithRetry = async (label: string, url: string, signal: AbortSignal) => {
          try {
            const cacheBuster = (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
            const res = await fetch(url + cacheBuster, { 
              signal,
              cache: 'no-store'
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.text();
          } catch (e: any) {
            if (e.name === 'AbortError') throw e;
            
            console.error(`Failed to fetch ${label}:`, e);
            // Retry once without cache buster if it's a network error
            try {
              const res = await fetch(url, { signal, cache: 'no-store' });
              if (!res.ok) throw new Error(`Status ${res.status}`);
              return await res.text();
            } catch (retryError: any) {
              if (retryError.name === 'AbortError') throw retryError;
              throw new Error(`Gagal memuat data ${label}: ${retryError.message}`);
            }
          }
        };

        const csvs = await Promise.all(urls.map(u => fetchWithRetry(u.name, u.url, controller.signal)));
        
        if (controller.signal.aborted) return;

        const parseCsv = (csv: string): Promise<any[]> => new Promise(resolve => {
          Papa.parse(csv, { header: true, skipEmptyLines: true, complete: results => resolve(results.data), error: () => resolve([]) });
        });
        
        const [cData, sData, iData, hData, salesData, rData] = await Promise.all(csvs.map(parseCsv));
        
        if (controller.signal.aborted) return;

        // Process Redeemed Points
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

        if (cData.length > 0) {
          const firstRow = cData[0];
          const namaKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'nama');
          const pinKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'pin');
          const saldoKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'saldo');
          const idKey = Object.keys(firstRow).find(key => key.toLowerCase().trim() === 'id');

          if (namaKey) {
            const allSavingsTransactions: SavingTransaction[] = [];
            const allDebtTransactions: DebtTransaction[] = [];
            const allInvestmentTransactions: InvestmentTransaction[] = [];
            
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

            const validCustomers = cData
              .filter((c: any) => c && c[namaKey])
              .map((c: any) => {
                const name = String(c[namaKey]).trim();
                const userTransactions = sData.filter(s => {
                  const sNamaKey = Object.keys(s).find(k => k.toLowerCase().trim().includes('nama'));
                  return sNamaKey && String(s[sNamaKey]).trim().toLowerCase() === name.toLowerCase();
                });

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

                    if (tipe === 'SETOR') runningBalance += nominal;
                    else if (tipe === 'TARIK') runningBalance -= nominal;

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
                  const nisbahKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('nisbah'));
                  const keteranganKey = Object.keys(i).find(k => k.toLowerCase().trim().includes('keterangan'));
                  
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
                
                let totalInvestasiValue = iTransactions
                  .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
                  .reduce((acc, curr) => {
                    const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
                    return acc + estimate.total;
                  }, 0);

                const userHutangData = hData.filter(h => {
                  const hNamaKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('nama'));
                  return hNamaKey && String(h[hNamaKey]).trim().toLowerCase() === name.toLowerCase();
                });

                const chronologicalHutang = [...userHutangData].reverse();
                let runningHutang = 0;
                const dTransactions: DebtTransaction[] = [];

                chronologicalHutang.forEach(h => {
                  const tipeKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('tipe') || k.toLowerCase().trim().includes('type'));
                  const nominalKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('nominal') || k.toLowerCase().trim().includes('jumlah'));
                  const tanggalKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('tanggal') || k.toLowerCase().trim().includes('date'));
                  const keteranganKey = Object.keys(h).find(k => k.toLowerCase().trim().includes('keterangan'));

                  if (tipeKey && nominalKey) {
                    const tipe = String(h[tipeKey]).trim().toUpperCase();
                    const nominalStr = String(h[nominalKey]).replace(/[^\d]/g, '');
                    const nominal = parseInt(nominalStr) || 0;
                    const tanggal = tanggalKey ? String(h[tanggalKey]).trim() : "-";
                    const keterangan = keteranganKey ? String(h[keteranganKey]).trim() : "-";

                    if (tipe === 'TAMBAH') runningHutang += nominal;
                    else if (tipe === 'BAYAR') runningHutang -= nominal;

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

                const userSalesTransactions = allSalesTransactions.filter(t => t.Nama.toLowerCase() === name.toLowerCase());
                const userLainnya = userSalesTransactions
                  .filter(t => {
                    const s = (t.Status || "").toLowerCase().trim();
                    return s.includes('belum') || s.includes('ambil') || s.includes('proses');
                  })
                  .reduce((acc, t) => {
                    const s = (t.Status || "").toUpperCase().trim();
                    if (s === "DIPROSES") return acc + (t.Pemasukan || 0);
                    return acc + ((t.HargaModal || 0) - (t.Sebagian || 0));
                  }, 0);

                return {
                  ...c,
                  Nama: name,
                  PIN: pinKey ? String(c[pinKey]).trim() : "",
                  Saldo: saldoKey ? String(c[saldoKey]).trim() : "0",
                  ID: idKey ? String(c[idKey]).trim() : "",
                  Tabungan: runningBalance.toLocaleString('id-ID'),
                  Investasi: totalInvestasiValue.toLocaleString('id-ID'),
                  Hutang: runningHutang.toLocaleString('id-ID'),
                  Lainnya: userLainnya.toLocaleString('id-ID')
                };
              });

            setRedeemedPoints(processedRedeemedPoints);
            setCustomers(validCustomers);
            setSavingsTransactions(allSavingsTransactions);
            setDebtTransactions(allDebtTransactions);
            setSalesTransactions(allSalesTransactions);
            setInvestmentTransactions(allInvestmentTransactions);
            
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
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Fetch Data Error:", error);
          setDataError(error.message || "Gagal menghubungkan ke server data");
        }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        isFetching.current = false;
      }
    }
  };

  useEffect(() => {
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
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {isLoading && <LoadingPopup />}
            </AnimatePresence>
            <AnimatePresence>
              {dataError && (
                <div className="fixed top-20 left-6 right-6 z-[110]">
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 shadow-xl"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none mb-1">Gangguan Koneksi</p>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-tight leading-tight">{dataError}</p>
                    </div>
                    <button 
                      onClick={() => fetchData(true)}
                      className="bg-red-500 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              )}
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
          <LoyaltyPointsPage user={loggedInUser} customers={customers} transactions={salesTransactions} redeemedPoints={redeemedPoints} />
        } />
        <Route path="/poin/:customerName" element={
          <LoyaltyPointsDetailPage user={loggedInUser} transactions={salesTransactions} redeemedPoints={redeemedPoints} customers={customers} />
        } />
        <Route path="/tukar-poin" element={
          <RedeemRewardsPage user={loggedInUser} transactions={salesTransactions} redeemedPoints={redeemedPoints} />
        } />
        <Route path="/qris" element={<QRISPage />} />
        <Route path="/tariktunai" element={<TarikTunaiPage />} />
        <Route path="/bantuan" element={<HelpPage />} />
        <Route path="/level" element={<LevelPage user={loggedInUser} transactions={salesTransactions} />} />
        <Route path="/bansos" element={
          <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          >
            <BansosPage transactions={salesTransactions} />
          </Layout>
        } />
        <Route path="/admin" element={<AdminDashboard transactions={salesTransactions} user={loggedInUser} customers={customers} investmentTransactions={investmentTransactions} />} />
        <Route path="/admin/report" element={<AdminReportPage transactions={salesTransactions} />} />
        <Route path="/admin/customers" element={<AdminCustomerManagement customers={customers} transactions={salesTransactions} redeemedPoints={redeemedPoints} />} />
        <Route path="/admin/customers/:customerName" element={
          <AdminCustomerDetailPage 
            customers={customers} 
            salesTransactions={salesTransactions} 
            savingsTransactions={savingsTransactions}
            investmentTransactions={investmentTransactions}
            debtTransactions={debtTransactions}
            redeemedPoints={redeemedPoints}
          />
        } />
        <Route path="/admin/savings" element={<AdminSavingsManagement customers={customers} transactions={savingsTransactions} setTransactions={setSavingsTransactions} />} />
        <Route path="/admin/investment" element={<AdminInvestmentManagement customers={customers} investmentTransactions={investmentTransactions} />} />
        <Route path="/admin/debt" element={<AdminDebtManagement customers={customers} transactions={debtTransactions} />} />
        <Route path="/admin/others" element={<AdminOthersManagement transactions={salesTransactions} customers={customers} />} />
        <Route path="/admin/stock" element={<AdminStockManagement />} />
      </Routes>
          </motion.div>
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
}
