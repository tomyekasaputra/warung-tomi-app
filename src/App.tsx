import React, { useState, useEffect, useRef, useMemo, createContext, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams, useLocation, useSearchParams, Navigate } from "react-router-dom";

export type Language = "id" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (idText: string, enText: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "id",
  setLanguage: () => {},
  t: (idText) => idText,
});

export const useLanguage = () => useContext(LanguageContext);
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
import CustomerManagement from "./components/CustomerManagement";
import GoogleSheetsPreviewPage from "./components/GoogleSheetsPreviewPage";
import { DetailBelanjaPage } from "./components/DetailBelanjaPage";
import { DetailTabunganPage } from "./components/DetailTabunganPage";
import { AdminSavingsDetailPage } from "./components/AdminSavingsDetailPage";
import { sendDigiflazzPLNInquiry, sendDigiflazzTransaction, fetchDigiflazzPricelist } from "./lib/digiflazz";
import { AdminDigiflazzPage } from "./components/AdminDigiflazzPage";
import { DetailHutangPage } from "./components/DetailHutangPage";
import { AdminDatabasePage, JENIS_OPTIONS, MELALUI_OPTIONS, STATUS_OPTIONS, formatDateForInput, formatInputToDate, getTodayDateISO } from "./components/AdminDatabasePage";
import { AdminInputDataPage } from "./components/AdminInputDataPage";
import { AdminCashFlowPage } from "./components/AdminCashFlowPage";
import { DatabaseSuccessModal, SuccessModalData } from "./components/DatabaseSuccessModal";
import { DeltaCache, formatImageUrl, safeStorage } from "./lib/deltaSync";
import { downloadSavingsStatementPdf } from "./lib/pdfSavingsStatement";
import { downloadSavingsStatementExcel } from "./lib/excelSavingsStatement";
import { SupabaseStockService, SupabaseCustomerService, SupabaseSavingsService, SupabaseDebtService, SupabaseSalesService, SupabaseInvestmentService, SupabasePointsService, SupabaseDashboardService, SUPABASE_CREATE_PRODUCTS_TABLE_SQL, SupabaseProduct, SupabaseSalesTransaction, formatDateDDMMYYYY, CustomerSavingsMonthSummary } from "./lib/supabase";
import { syncAllCustomerStatsToGoogleSheets } from "./lib/googleSheetsSync";
import { 
  ShoppingBag, 
  Award,
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
  ClipboardList,
  User,
  Users,
  Package,
  Gift,
  Bell,
  Search,
  Plus,
  Loader2,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  RefreshCw,
  Copy,
  LayoutGrid,
  Save,
  Settings,
  KeyRound,
  Eye,
  EyeOff,
  QrCode,
  Send,
  Globe,
  Home,
  Bot,
  BarChart3,
  CheckCircle2,
  Timer,
  Check,
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
  Contact,
  Wifi,
  Sparkles,
  Printer,
  ShoppingCart,
  ScanLine,
  AlertCircle,
  ChevronUp,
  UserCheck,
  Activity,
  Share2,
  ExternalLink,
  Camera,
  Image,
  ZoomIn,
  ZoomOut,
  CameraOff,
  Bluetooth,
  LogOut,
  Grid,
  Cookie,
  CupSoda,
  Flame,
  Pill,
  Pencil,
  LogIn,
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
  MessageSquare,
  Calculator,
  Database,
  CloudUpload,
  Trash2,
  Edit2,
  Edit3,
  Ticket,
  Scissors,
  Coins,
  Percent,
  Image as ImageIcon,
  Palette,
  Type,
  Layout as LayoutIcon,
  Sun,
  Moon,
  Monitor,
  List,
  Menu,
  Tag,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";

// --- Types ---

export const parseDate = (dateStr: any): Date => {
  if (!dateStr || dateStr === "-") return new Date(0);
  if (dateStr instanceof Date) return dateStr;
  const trimmed = String(dateStr).trim();
  
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

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

    // YYYY-MM-DD
    if (parts[0].length === 4) {
      return new Date(p0, p1 - 1, p2, h, m, s);
    }
    // DD/MM/YYYY or DD-MM-YYYY
    if (parts[2].length === 4 || parts[2].length === 2) {
      const year = parts[2].length === 2 ? 2000 + p2 : p2;
      return new Date(year, p1 - 1, p0, h, m, s);
    }
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const formatIndonesianDateWithDay = (dateStr: string) => {
  const tDate = parseDate(dateStr);
  if (tDate.getTime() === 0) return dateStr;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayName = days[tDate.getDay()];
  const dateNum = tDate.getDate();
  const monthName = months[tDate.getMonth()];
  const yearNum = tDate.getFullYear();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDate = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());

  const diffTime = today.getTime() - txDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let relativeLabel = "";
  if (diffDays === 0) {
    relativeLabel = "Hari ini";
  } else if (diffDays === 1) {
    relativeLabel = "Kemarin";
  } else {
    relativeLabel = dayName;
  }

  return `${relativeLabel}, ${dateNum} ${monthName} ${yearNum}`;
};

export const parseCurrency = (val: string | number | undefined) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  return parseInt(String(val).replace(/[^\d]/g, '')) || 0;
};

export const formatCurrency = (val: number | string | undefined) => {
  const num = typeof val === 'number' ? val : parseCurrency(val);
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const get4DigitCustId = (idPelanggan?: string, name?: string, customersList?: any[]): string => {
  if (idPelanggan) {
    const digits = idPelanggan.replace(/\D/g, '');
    if (digits.length >= 4) return digits.slice(-4);
    if (digits.length > 0) return digits.padStart(4, '0');
  }
  if (name && customersList && customersList.length > 0) {
    const idx = customersList.findIndex(c => (c.nama || c.Nama || '').toLowerCase().trim() === name.toLowerCase().trim());
    if (idx >= 0) {
      const found = customersList[idx];
      const foundId = found.id_pelanggan || found.id;
      if (foundId) {
        const digits = String(foundId).replace(/\D/g, '');
        if (digits.length >= 4) return digits.slice(-4);
        if (digits.length > 0) return digits.padStart(4, '0');
      }
      return String(idx + 1).padStart(4, '0');
    }
  }
  return "0000";
};

export const generateNextTabunganId = (
  customer: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string },
  existingSavings: any[],
  customersList?: any[]
): string => {
  const custDigits = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama, customersList);
  const custName = (customer.Nama || customer.nama || '').toLowerCase().trim();
  const custIdLower = (customer.id_pelanggan || customer.id || '').toLowerCase().trim();

  const matchingTx = (existingSavings || []).filter(t => {
    const tName = (t.Nama || t.nama || t.nama_nasabah || '').toLowerCase().trim();
    const tIdPel = (t.id_pelanggan || '').toLowerCase().trim();
    const tIdTab = (t.id_tabungan || t.id || '').toUpperCase();

    if (tName && custName && tName === custName) return true;
    if (tIdPel && custIdLower && tIdPel === custIdLower) return true;
    if (custDigits && custDigits !== "0000" && tIdTab.includes(`TAB-${custDigits}/`)) return true;
    return false;
  });

  const seqNumbers: number[] = [];
  matchingTx.forEach(t => {
    const rawId = String(t.id_tabungan || t.id || '');
    const parts = rawId.split('/');
    if (parts.length > 1) {
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > 0 && num < 10000) {
        seqNumbers.push(num);
      }
    }
  });

  let maxSeq = 0;
  if (seqNumbers.length > 0) {
    maxSeq = Math.max(...seqNumbers);
  } else {
    maxSeq = matchingTx.length;
  }

  const nextSeq = maxSeq + 1;
  return `TAB-${custDigits}/${nextSeq}`;
};

export const generateNextHutangId = (
  customer: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string },
  existingDebts: any[],
  customersList?: any[]
): string => {
  const custDigits = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama, customersList);
  const custName = (customer.Nama || customer.nama || '').toLowerCase().trim();
  const custIdLower = (customer.id_pelanggan || customer.id || '').toLowerCase().trim();

  const matchingTx = (existingDebts || []).filter(t => {
    const tName = (t.Nama || t.nama || t.nama_pelanggan || '').toLowerCase().trim();
    const tIdPel = (t.id_pelanggan || '').toLowerCase().trim();
    const tIdHut = (t.id_hutang || t.id || '').toUpperCase();

    if (tName && custName && tName === custName) return true;
    if (tIdPel && custIdLower && tIdPel === custIdLower) return true;
    if (custDigits && custDigits !== "0000" && tIdHut.includes(`HUT-${custDigits}/`)) return true;
    return false;
  });

  const seqNumbers: number[] = [];
  matchingTx.forEach(t => {
    const rawId = String(t.id_hutang || t.id || '');
    const parts = rawId.split('/');
    if (parts.length > 1) {
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > 0 && num < 10000) {
        seqNumbers.push(num);
      }
    }
  });

  let maxSeq = 0;
  if (seqNumbers.length > 0) {
    maxSeq = Math.max(...seqNumbers);
  } else {
    maxSeq = matchingTx.length;
  }

  const nextSeq = maxSeq + 1;
  return `HUT-${custDigits}/${nextSeq}`;
};

const isGenericId = (id: string) => {
  const clean = (id || '').toLowerCase().trim();
  return !clean || clean === 'cust-0000' || clean === 'cust-xxxx' || clean === 'cust' || clean === '0000' || clean === '-' || clean === 'null' || clean === 'undefined';
};

const isGenericName = (name: string) => {
  const clean = (name || '').toLowerCase().trim();
  return !clean || clean === 'pelanggan umum' || clean === 'pelanggan' || clean === 'umum' || clean === '-' || clean === 'null' || clean === 'undefined';
};

export const isCustomerSavingMatch = (t: any, customer: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string } | null) => {
  if (!customer || !t) return false;
  const custName = (customer.Nama || customer.nama || '').toLowerCase().trim();
  const custId = (customer.id_pelanggan || customer.id || '').toLowerCase().trim();

  const tName = (t.Nama || t.nama || t.nama_nasabah || '').toLowerCase().trim();
  const tIdPel = (t.id_pelanggan || t.id_customer || t.customer_id || '').toLowerCase().trim();

  // 1. Strict name equality if names match
  if (custName && tName && custName === tName) return true;

  // Clean alphanumeric name comparison (e.g. "doni eeng", "doni  eeng", "doni-eeng")
  if (custName && tName) {
    const cleanCust = custName.replace(/[^a-z0-9]/g, '');
    const cleanT = tName.replace(/[^a-z0-9]/g, '');
    if (cleanCust && cleanT && cleanCust === cleanT) return true;

    // Matching substring if non-generic and length >= 4 (e.g. "doni eeng" & "doni")
    if (!isGenericName(custName) && !isGenericName(tName)) {
      if ((cleanCust.length >= 4 && cleanT.includes(cleanCust)) || (cleanT.length >= 4 && cleanCust.includes(cleanT))) {
        return true;
      }
    }
  }

  // 2. ID Pelanggan match (jika nama tidak ketemu atau salah satu nama generik)
  if (!isGenericId(custId) && !isGenericId(tIdPel)) {
    if (custId === tIdPel) return true;
    const cust4 = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
    const t4 = get4DigitCustId(t.id_pelanggan || t.id_customer || t.customer_id, t.Nama || t.nama);
    if (cust4 && cust4 !== "0000" && t4 && t4 !== "0000" && cust4 === t4) return true;
  }

  // 3. Check transaction ID format TAB-XXXX/
  const cust4Digits = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
  const tIdTab = String(t.id_tabungan || t.id || '').toUpperCase();
  if (cust4Digits && cust4Digits !== "0000" && (tIdTab.includes(`TAB-${cust4Digits}/`) || tIdTab === `TAB-${cust4Digits}`)) {
    return true;
  }

  return false;
};

export const isCustomerDebtMatch = (t: any, customer: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string } | null) => {
  if (!customer || !t) return false;
  const custName = (customer.Nama || customer.nama || '').toLowerCase().trim();
  const custId = (customer.id_pelanggan || customer.id || '').toLowerCase().trim();

  const tName = (t.Nama || t.nama || t.nama_pelanggan || '').toLowerCase().trim();
  const tIdPel = (t.id_pelanggan || t.id_customer || t.customer_id || '').toLowerCase().trim();

  // 1. Strict name equality if names match
  if (custName && tName && custName === tName) return true;

  // If both have explicit, non-generic names that do NOT match, they are strictly different customers
  if (!isGenericName(custName) && !isGenericName(tName) && custName !== tName) {
    const cleanCust = custName.replace(/[^a-z0-9]/g, '');
    const cleanT = tName.replace(/[^a-z0-9]/g, '');
    if (cleanCust && cleanT && cleanCust !== cleanT) {
      return false;
    }
  }

  // 2. ID Pelanggan match (jika nama tidak ketemu atau salah satu nama generik)
  if (!isGenericId(custId) && !isGenericId(tIdPel)) {
    if (custId === tIdPel) return true;
    const cust4 = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
    const t4 = get4DigitCustId(t.id_pelanggan || t.id_customer || t.customer_id, t.Nama || t.nama);
    if (cust4 && cust4 !== "0000" && t4 && t4 !== "0000" && cust4 === t4) return true;
  }

  // 3. Check transaction ID format HUT-XXXX/
  const cust4Digits = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
  const tIdHut = String(t.id_hutang || t.id || '').toUpperCase();
  if (cust4Digits && cust4Digits !== "0000" && (tIdHut.includes(`HUT-${cust4Digits}/`) || tIdHut === `HUT-${cust4Digits}`)) {
    return true;
  }

  return false;
};

export const isCustomerSalesMatch = (t: any, customer: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string } | null) => {
  if (!customer || !t) return false;
  const custName = (customer.Nama || customer.nama || '').toLowerCase().trim();
  const custId = (customer.id_pelanggan || customer.id || '').toLowerCase().trim();

  const tName = (t.Nama || t.nama || '').toLowerCase().trim();
  const tIdPel = (t.id_pelanggan || t.id_customer || t.customer_id || '').toLowerCase().trim();

  // 1. Strict name equality if names match
  if (custName && tName && custName === tName) return true;

  // If both have explicit, non-generic names that do NOT match, they are strictly different customers
  if (!isGenericName(custName) && !isGenericName(tName) && custName !== tName) {
    const cleanCust = custName.replace(/[^a-z0-9]/g, '');
    const cleanT = tName.replace(/[^a-z0-9]/g, '');
    if (cleanCust && cleanT && cleanCust !== cleanT) {
      return false;
    }
  }

  // 2. ID Pelanggan match (jika nama tidak ketemu atau salah satu nama generik)
  if (!isGenericId(custId) && !isGenericId(tIdPel)) {
    if (custId === tIdPel) return true;
    const cust4 = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
    const t4 = get4DigitCustId(t.id_pelanggan || t.id_customer || t.customer_id, t.Nama || t.nama);
    if (cust4 && cust4 !== "0000" && t4 && t4 !== "0000" && cust4 === t4) return true;
  }

  // 3. Check transaction ID format TRX-XXXX/
  const cust4Digits = get4DigitCustId(customer.id_pelanggan || customer.id, customer.Nama || customer.nama);
  const tIdTrx = String(t.id_transaksi || t.id || '').toUpperCase();
  if (cust4Digits && cust4Digits !== "0000" && (tIdTrx.includes(`TRX-${cust4Digits}/`) || tIdTrx === `TRX-${cust4Digits}`)) {
    return true;
  }

  return false;
};

const DigitRoller = ({ targetDigit, delay = 0 }: { targetDigit: number; delay?: number; key?: any }) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <span className="relative inline-flex w-[0.62em] h-[1em] overflow-hidden select-none tabular-nums justify-center text-center leading-none">
      <motion.span
        initial={{ y: "0%" }}
        animate={{ y: `-${targetDigit * 10}%` }}
        transition={{
          type: "spring",
          stiffness: 75,
          damping: 14,
          delay: delay,
        }}
        className="absolute left-0 top-0 flex flex-col w-full h-[1000%] leading-none"
      >
        {digits.map((d) => (
          <span key={d} className="h-[10%] flex items-center justify-center shrink-0 leading-none">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
};

const RollingNumber = ({ value }: { value: number }) => {
  const formatted = formatCurrency(value);
  return (
    <span className="inline-flex overflow-hidden items-center h-[1em] leading-none select-none tabular-nums">
      {formatted.split("").map((char, index) => {
        if (/\d/.test(char)) {
          const digit = parseInt(char, 10);
          return (
            <DigitRoller key={index} targetDigit={digit} delay={index * 0.03} />
          );
        } else {
          return (
            <span key={index} className="inline-block px-[0.02em] select-none leading-none">
              {char}
            </span>
          );
        }
      })}
    </span>
  );
};

const qrisUrl = "https://lh3.googleusercontent.com/d/1P7Itn82Za-1G1a_4wpEa5BmarzCPvtn_";

const parseDateForProgress = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return new Date();
  return parseDate(dateStr);
};

const getRelativeTime = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime()) || date.getTime() === 0) return "-";
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInMs = today.getTime() - targetDate.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 3600 * 24));

  if (diffInDays <= 0) return "Hari ini";
  if (diffInDays === 1) return "Kemarin";
  
  if (diffInDays < 30) {
    return `${diffInDays} Hari lalu`;
  }
  
  let diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (now.getDate() < date.getDate()) {
    diffInMonths--;
  }
  if (diffInMonths < 1) diffInMonths = 1;

  if (diffInMonths < 12) {
    return `${diffInMonths} Bulan lalu`;
  }
  
  let diffInYears = now.getFullYear() - date.getFullYear();
  if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) {
    diffInYears--;
  }
  if (diffInYears < 1) diffInYears = 1;

  return `${diffInYears} Tahun lalu`;
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

export interface Customer {
  id_pelanggan?: string;
  Nama: string;
  PIN?: string;
  Saldo?: string;
  id?: string;
  Tabungan?: number | string;
  Foto?: string;
  [key: string]: any;
}

export interface SavingTransaction {
  id?: string;
  id_tabungan?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  Tipe: string;
  Nominal: number;
  SaldoAkhir: number;
  Berita?: string;
  Sebagian?: number;
  created_at?: string;
}

export interface DebtTransaction {
  id?: string;
  id_hutang?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  Tipe: string;
  Jumlah: number;
  Keterangan: string;
  SaldoAkhir: number;
  Sebagian?: number;
  created_at?: string;
}

export interface SalesTransaction {
  id?: string;
  id_transaksi?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  nama?: string;
  Jenis: string;
  Metode: string;
  Pemasukan: number;
  pemasukan?: number;
  hargaAdmin?: number;
  Poin?: number;
  Status: string;
  Melalui: string;
  HargaModal: number;
  Sebagian: number;
  created_at?: string;
}

interface RedeemedPoint {
  id?: string;
  id_tukar?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  Poin: number;
  Hadiah: string;
}

interface StockItem {
  id: string;
  id_barang?: string;
  Nama: string;
  Kategori: string;
  Stok: number;
  Satuan: string;
  MinStok: number;
  HargaModal: number;
  HargaJual: number;
  UpdateTerakhir: string;
  Image?: string;
}

const TransactionCard: React.FC<{ t: SalesTransaction, index: number, isAdmin?: boolean }> = ({ t, index, isAdmin }) => {
  const navigate = useNavigate();
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
    (jenisLower.includes('belanja') && s.name.toLowerCase() === 'belanja') ||
    (jenisLower.includes('fisik') && s.name.toLowerCase() === 'belanja')
  );
  const statusLower = t.Status.toLowerCase();
  const displayName = (!t.Nama || t.Nama === "Unknown" || t.Nama.trim() === "") ? "Pelanggan Umum" : t.Nama;
  let ribbonColor = 'bg-slate-500/5 text-slate-500';
  if (statusLower.includes('selesai') || statusLower.includes('sukses')) ribbonColor = 'bg-green-500/5 text-green-600';
  else if (statusLower.includes('kasbon')) ribbonColor = 'bg-red-500/5 text-red-600';
  else if (statusLower.includes('proses')) ribbonColor = 'bg-yellow-500/5 text-yellow-600';
  else if (statusLower.includes('belum') || statusLower.includes('ambil')) ribbonColor = 'bg-blue-500/5 text-blue-600';

  const handleClick = () => {
    if (displayName === "Pelanggan Umum") return;
    const path = `/lainnya/${encodeURIComponent(displayName)}`;
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all active:scale-[0.98] ${displayName !== "Pelanggan Umum" ? 'cursor-pointer hover:shadow-md hover:border-[#005E6A]/20 dark:border-teal-800/40' : ''}`}
    >
      <div className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${service?.bgColor || 'bg-slate-50'}`}>
          {service ? service.icon : <ShoppingBag className="w-6 h-6 text-slate-400 dark:text-slate-300 dark:text-slate-200" />}
        </div>
        
        <div className="flex-1 min-w-0 flex justify-between items-center">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* Row 1: Nama */}
            <p className="text-[11px] font-black text-[#005E6A] uppercase truncate pr-2">{displayName}</p>
            
            {/* Row 2: Jenis & Melalui */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-slate-700 dark:text-slate-200 uppercase leading-none">{t.Jenis}</span>
              <span className="text-[8px] font-medium text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider truncate leading-none">via {t.Melalui}</span>
            </div>

            {/* Row 3: Tanggal & Status */}
            <div className="flex items-center gap-2">
              <p className="text-[7px] font-medium text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                {t.Tanggal}
                {(() => {
                  if (t.created_at) {
                    const d = new Date(t.created_at);
                    if (!isNaN(d.getTime()) && d.getTime() > 0) {
                      return ` â€¢ ${d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })} WIB`;
                    }
                  }
                  return '';
                })()}
              </p>
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
          Rp {( (parseCurrency(t.Pemasukan) || 0) - (parseCurrency(t.HargaModal) || 0) ).toLocaleString('id-ID')}
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
  id?: string;
  id_investasi?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  Nominal: number;
  Tenor: string;
  JatuhTempo: string;
  Status: string;
  Keterangan?: string;
  Nisbah?: string;
  Sebagian?: number;
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
  { id: 15, name: "Tabungan", icon: <Wallet className="w-6 h-6 text-[#005E6A]" />, bgColor: "bg-[#E6F4F5]" },
  { id: 16, name: "Investasi", icon: <TrendingUp className="w-6 h-6 text-[#F15A24]" />, bgColor: "bg-[#FFF7ED]" },
  { id: 17, name: "Poin Loyalitas", icon: <Star className="w-6 h-6 text-amber-500" />, bgColor: "bg-amber-50" },
];

const LEVELS = [
  { 
    name: "Bronze", 
    min: 0, 
    max: 999999, 
    color: "from-[#CD7F32] to-[#A57164]", 
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
    color: "from-slate-800 to-black", 
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

  return totalEarned - totalExpired - userRedeemed;
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
    return { label: "Lancar", color: "text-green-300", avgDuration: 0, badgeColor: "bg-teal-50 text-teal-600", sortOrder: 0 };
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
    .reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);

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
  activeTab,
  isLoading,
  salesTransactions,
  redeemedPoints,
  cart,
  setShowCart,
  unreadNotificationsCount
}: { 
  customers: Customer[], 
  loggedInUser: Customer | null, 
  onLogin: (user: Customer) => void, 
  onLogout: () => void,
  setActiveTab: (id: string) => void,
  activeTab: string,
  isLoading: boolean,
  salesTransactions: SalesTransaction[],
  redeemedPoints: RedeemedPoint[],
  cart: { product: StockItem, qty: number }[],
  setShowCart: (show: boolean) => void,
  unreadNotificationsCount?: number
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kasir');
  const [isAgenInfoOpen, setIsAgenInfoOpen] = useState(false);
  const [isStoreStatusOpen, setIsStoreStatusOpen] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState(0);

  // Standalone Login Modals State
  const [isKasirPopupOpen, setIsKasirPopupOpen] = useState(false);
  const [isAdminPopupOpen, setIsAdminPopupOpen] = useState(false);
  const [kasirNameInput, setKasirNameInput] = useState("Tomi");
  const [kasirPinInput, setKasirPinInput] = useState("");
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [kasirError, setKasirError] = useState("");
  const [adminError, setAdminError] = useState("");

  const CASHIER_ACCOUNTS = [
    { name: "Tomi", pin: "160910", role: "Kasir Utama / Owner" },
    { name: "Ayu", pin: "300315", role: "Kasir Senior" },
  ];

  const ADMIN_ACCESS_CODE = "160910";

  // Reusable 3-second long press hook helper
  const useLongPress3s = (onLongPress: () => void) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const [pressing, setPressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [didTrigger, setDidTrigger] = useState(false);

    const startPress = useCallback((e?: React.SyntheticEvent) => {
      setDidTrigger(false);
      setPressing(true);
      setProgress(0);
      startTimeRef.current = Date.now();

      const update = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(100, (elapsed / 3000) * 100);
        setProgress(pct);
        if (elapsed < 3000) {
          animRef.current = requestAnimationFrame(update);
        }
      };
      animRef.current = requestAnimationFrame(update);

      timerRef.current = setTimeout(() => {
        setDidTrigger(true);
        onLongPress();
        setPressing(false);
        setProgress(0);
        if (animRef.current) cancelAnimationFrame(animRef.current);
      }, 3000);
    }, [onLongPress]);

    const cancelPress = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setPressing(false);
      setProgress(0);
    }, []);

    return {
      pressing,
      progress,
      didTrigger,
      handlers: {
        onMouseDown: startPress,
        onMouseUp: cancelPress,
        onMouseLeave: cancelPress,
        onTouchStart: startPress,
        onTouchEnd: cancelPress,
        onTouchCancel: cancelPress,
      }
    };
  };

  const logoLongPress = useLongPress3s(() => {
    setIsKasirPopupOpen(true);
    setKasirError("");
  });

  const titleLongPress = useLongPress3s(() => {
    setIsAdminPopupOpen(true);
    setAdminError("");
  });

  const handleKasirSubmit = () => {
    const account = CASHIER_ACCOUNTS.find(
      acc => acc.name.toLowerCase() === kasirNameInput.trim().toLowerCase() && acc.pin === kasirPinInput.trim()
    );

    if (account) {
      localStorage.setItem("kasir_session", "true");
      localStorage.setItem("kasir_user", account.name);
      localStorage.setItem("kasir_login_time", new Date().toLocaleString('id-ID'));
      setIsKasirPopupOpen(false);
      setKasirPinInput("");
      setKasirError("");
      navigate("/kasir");
    } else {
      setKasirError("Nama Kasir atau PIN Salah!");
    }
  };

  const handleAdminSubmit = () => {
    if (adminCodeInput.trim() === ADMIN_ACCESS_CODE || adminCodeInput.trim() === "123456") {
      localStorage.setItem("admin_session", "true");
      setIsAdminPopupOpen(false);
      setAdminCodeInput("");
      setAdminError("");
      navigate("/admin");
    } else {
      setAdminError("Kode Akses Admin Salah!");
    }
  };

  const totalBadgeItems = loggedInUser ? 2 : 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setBadgeIndex(prev => (prev + 1) % totalBadgeItems);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalBadgeItems]);

  const currentHour = new Date().getHours();
  const isStoreOpen = currentHour >= 6 && currentHour < 22;

  if (isAdminPage) return null;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 h-16 flex items-center">
        <div className="px-4 sm:px-6 w-full flex items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Logo Container - Hold 3 seconds for Kasir Login */}
            <div 
              {...logoLongPress.handlers}
              onClick={(e) => {
                if (logoLongPress.didTrigger) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setActiveTab("beranda");
                navigate("/");
              }}
              className="relative group cursor-pointer select-none"
              title="Warung Tomi Logo (Tekan & tahan 3 detik untuk Login Kasir)"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg border border-white bg-slate-50 flex items-center justify-center shrink-0 transition-transform group-active:scale-95 shadow-slate-200/50 relative">
                <img 
                  src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
                  alt="Warung Tomi Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {logoLongPress.pressing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10 p-1">
                    <span className="text-[7px] font-black leading-none mb-0.5">KASIR</span>
                    <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F15A24] transition-all" style={{ width: `${logoLongPress.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Header Title Container - Hold 3 seconds for Admin Login */}
            <div 
              {...titleLongPress.handlers}
              onClick={(e) => {
                if (titleLongPress.didTrigger) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setActiveTab("beranda");
                navigate("/");
              }}
              className="flex flex-col group cursor-pointer select-none relative"
              title="WARUNG TOMI (Tekan & tahan 3 detik untuk Login Admin)"
            >
              <div className="flex items-center gap-1">
                <span className="text-[15px] sm:text-[18px] font-black tracking-tighter text-[#005E6A] transition-colors uppercase">WARUNG</span>
                <span className="text-[15px] sm:text-[18px] font-black tracking-tighter text-[#F15A24] transition-colors uppercase">TOMI</span>
              </div>
              <div className="flex justify-between w-full px-0.5 mt-[-2px] opacity-60 group-hover:opacity-100 transition-opacity">
                {"Digital Solution".split("").map((char, i) => (
                  <span key={i} className="text-[5px] sm:text-[6px] font-black text-muted-foreground tracking-[0.15em] uppercase leading-none">
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </div>

              {titleLongPress.pressing && (
                <div className="absolute -bottom-1.5 left-0 right-0 flex flex-col items-center">
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#005E6A] transition-all" style={{ width: `${titleLongPress.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 mx-4">
            {[
              { id: "beranda", label: t("Beranda", "Home"), path: "/", tab: "beranda" },
              { id: "belanja", label: t("Belanja", "Shop"), path: "/", tab: "belanja" },
              { id: "riwayat", label: t("Riwayat", "History"), path: "/", tab: "riwayat", protected: true },
              { id: "settings", label: t("Profil", "Profile"), path: "/", tab: "settings" }
            ].filter(item => !item.protected || loggedInUser).map(item => {
              const isActive = location.pathname === "/" && activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.tab);
                    if (location.pathname !== "/") navigate("/");
                  }}
                  className={`relative px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-colors duration-300 flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? "text-white" 
                      : "text-slate-600 dark:text-slate-300 hover:text-[#F15A24]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopNavIndicator"
                      className="absolute inset-0 bg-gradient-to-br from-[#F15A24] to-[#ff8c42] rounded-full shadow-md shadow-[#F15A24]/30"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Single Rotating Badge Element (Bergantian Agen BNI 46 / Operasional / Masuk tiap 5 detik) */}
            <motion.button 
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (badgeIndex === 0) {
                  setIsAgenInfoOpen(true);
                } else if (badgeIndex === 1) {
                  setIsStoreStatusOpen(true);
                } else if (badgeIndex === 2) {
                  navigate("/login");
                }
              }}
              className={`w-[88px] sm:w-[96px] h-[30px] rounded-full flex items-center justify-center shadow-xs border transition-all duration-300 cursor-pointer overflow-hidden shrink-0 ${
                badgeIndex === 0 
                  ? "bg-[#E6F4F5] hover:bg-[#daf0f2] border-[#005E6A]/20" 
                  : badgeIndex === 1
                    ? (isStoreOpen 
                        ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200" 
                        : "bg-rose-50 hover:bg-rose-100/80 border-rose-200")
                    : "bg-[#F15A24] hover:bg-[#d84e1d] border-[#F15A24] text-white"
              }`}
              title={
                badgeIndex === 0 
                  ? "Informasi Agen BNI 46" 
                  : badgeIndex === 1 
                    ? "Status Operasional Toko" 
                    : t("Masuk ke Halaman Login", "Go to Login Page")
              }
            >
              <AnimatePresence mode="wait">
                {badgeIndex === 0 && (
                  <motion.div
                    key="bni46"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center gap-0.5 shrink-0"
                  >
                    <span className="text-[8.5px] sm:text-[9px] font-black text-[#005E6A] uppercase tracking-tight">Agen BNI</span>
                    <span className="text-[8.5px] sm:text-[9px] font-black text-[#F15A24]">46</span>
                  </motion.div>
                )}
                {badgeIndex === 1 && (
                  <motion.div
                    key="storeStatus"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isStoreOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
                    <span className={`text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider leading-none ${isStoreOpen ? "text-emerald-600" : "text-rose-600"}`}>
                      {isStoreOpen ? t("BUKA", "OPEN") : t("TUTUP", "CLOSED")}
                    </span>
                  </motion.div>
                )}
                {badgeIndex === 2 && !loggedInUser && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center gap-1 shrink-0 text-white"
                  >
                    <LogIn className="w-3 h-3 stroke-[2.5]" />
                    <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider">
                      {t("MASUK", "LOGIN")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Notification Button (Saat Sudah Login) */}
            {loggedInUser && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (location.pathname.includes("/notifikasi")) {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate("/");
                    }
                  } else {
                    navigate("/notifikasi");
                  }
                }}
                className="relative p-2.5 rounded-full bg-[#E6F4F5] hover:bg-[#d0eaec] text-[#005E6A] transition-all cursor-pointer flex items-center justify-center border border-[#005E6A]/10 dark:border-teal-800/30"
                aria-label="Notifikasi"
              >
                <Bell className="w-4.5 h-4.5 text-[#005E6A] stroke-[2.2]" />
                {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F15A24] text-white text-[8px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                    {unreadNotificationsCount}
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>
      {/* Dynamic Header Spacer div matching fixed header height to eliminate gap */}
      <div className="h-16" />

      {/* Standalone Kasir Login Popup */}
      <AnimatePresence>
        {isKasirPopupOpen && (
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
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-[#F15A24]">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-widest">LOGIN KASIR</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Akses Kasir Pintar Warung Tomi</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsKasirPopupOpen(false);
                    setKasirError("");
                  }} 
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest pl-1">
                    NAMA KASIR
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <User className="w-4 h-4 text-[#F15A24]" />
                    </div>
                    <select 
                      value={kasirNameInput}
                      onChange={(e) => setKasirNameInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-11 pr-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#F15A24]/40 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Tomi">Tomi (Kasir Utama)</option>
                      <option value="Ayu">Ayu (Kasir Senior)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest pl-1">
                    PIN KASIR (6 DIGIT)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-[#F15A24]" />
                    </div>
                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder="MASUKKAN PIN KASIR"
                      value={kasirPinInput}
                      onChange={(e) => setKasirPinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleKasirSubmit();
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#F15A24]/40 transition-all"
                    />
                  </div>
                </div>

                {kasirError && (
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center pt-1">
                    {kasirError}
                  </p>
                )}

                <button 
                  onClick={handleKasirSubmit}
                  className="w-full bg-gradient-to-r from-[#F15A24] to-[#ff7b42] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer mt-2"
                >
                  Masuk Kasir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standalone Admin Login Popup */}
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
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-[#005E6A]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-widest">LOGIN ADMIN</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Akses Dashboard Admin Warung Tomi</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAdminPopupOpen(false);
                    setAdminError("");
                  }} 
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest pl-1">
                    KODE AKSES ADMIN
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <ShieldCheck className="w-4 h-4 text-[#005E6A]" />
                    </div>
                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder="MASUKKAN KODE AKSES"
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminSubmit();
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A]/40 transition-all"
                    />
                  </div>
                </div>

                {adminError && (
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center pt-1">
                    {adminError}
                  </p>
                )}

                <button 
                  onClick={handleAdminSubmit}
                  className="w-full bg-[#005E6A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-transform cursor-pointer mt-2"
                >
                  Masuk Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <p className="text-slate-600 dark:text-slate-300 dark:text-slate-200 text-xs leading-relaxed font-medium">
                      Agen BNI 46 adalah mitra BNI (perorangan atau badan hukum) yang telah bekerjasama dengan BNI untuk menyediakan layanan perbankan kepada masyarakat.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#F15A24] p-2 rounded-lg shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest mb-1">Warung Tomi</h4>
                        <p className="text-slate-500 dark:text-slate-300 dark:text-slate-200 text-[11px] leading-relaxed font-bold">
                          Telah menjadi mitra resmi Agen BNI 46 sejak tahun <span className="text-[#F15A24]">2021</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[#005E6A] font-black text-xs uppercase tracking-widest mb-2">Titik Kumpul KPM</h4>
                    <p className="text-slate-600 dark:text-slate-300 dark:text-slate-200 text-xs leading-relaxed font-medium">
                      Kami bangga menjadi titik kumpul resmi bagi para Keluarga Penerima Manfaat (KPM) untuk melakukan pencairan bantuan sosial <span className="font-bold text-slate-900 dark:text-white">PKH</span> dan <span className="font-bold text-slate-900 dark:text-white">BPNT</span> secara aman dan nyaman.
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

      {/* Operational Status Info Popup */}
      <AnimatePresence>
        {isStoreStatusOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStoreStatusOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              {/* Header Design */}
              <div className={`p-8 text-center relative overflow-hidden ${isStoreOpen ? "bg-emerald-600" : "bg-rose-600"}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                
                <div className="relative z-10">
                  <div className="bg-white w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform -rotate-3">
                    <Clock className={`w-8 h-8 ${isStoreOpen ? "text-emerald-600" : "text-rose-600"}`} />
                  </div>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight">STATUS OPERASIONAL</h3>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                    WARUNG TOMI {isStoreOpen ? "BUKA" : "TUTUP"}
                  </p>
                </div>
              </div>

              <div className="p-8 text-center">
                <div className="space-y-4 mb-6">
                  <div className={`p-5 rounded-2xl border ${isStoreOpen ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40" : "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800/40"}`}>
                    <p className={`text-xs sm:text-sm font-black leading-relaxed ${isStoreOpen ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
                      {isStoreOpen 
                        ? "Warung Tomi buka setiap hari hingga pukul 22:00 WIB."
                        : "Mohon maaf, Warung Tomi sedang tutup. Buka kembali pukul 06:00 WIB."
                      }
                    </p>
                  </div>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-relaxed">
                    Jam Operasional Resmi: <span className="font-bold text-slate-800 dark:text-slate-200">06:00 - 22:00 WIB</span> (Setiap Hari).
                  </p>
                </div>

                <Button 
                  onClick={() => setIsStoreStatusOpen(false)}
                  className={`w-full font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg text-white transition-all ${
                    isStoreOpen 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" 
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  }`}
                >
                  Mengerti
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
  { id: 5, image: "https://lh3.googleusercontent.com/d/1GpNZ4yIov99m-EDWMUmfb3m9aISQBEe6", title: "Bansos" },
  { id: 1, image: "https://lh3.googleusercontent.com/d/1mIuvZjLO0eroPRfJR5fw38mo1iIueuzq", title: "Tabungan" },
  { id: 2, image: "https://lh3.googleusercontent.com/d/1RwJbtl5zMaZjpB5EOI2nmXNqPmbQx6Ep", title: "Promo" },
  { id: 3, image: "https://lh3.googleusercontent.com/d/1BK2wG7qAlYgTJyX3yLk4BdGi-IEjkbpc", title: "Poin" },
  { id: 4, image: "https://lh3.googleusercontent.com/d/1q06qTXISxLvOMCQnTT4f3MATAmBo5is-", title: "Level" },
];

const BansosPage = ({ transactions }: { transactions?: SalesTransaction[] }) => {
  const navigate = useNavigate();
  const currentMonth = new Date().getMonth();
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const [activeMenu, setActiveMenu] = useState<'laporan' | 'riwayat' | 'cek_desil'>('laporan');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Warung Tomi - Cek Bansos',
          text: 'Cek status bantuan sosial PKH dan BPNT di Warung Tomi',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link disalin ke clipboard!');
      }
    } catch (err) {
      // Ignore AbortError (user canceled)
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const defaultTahap = Math.floor(currentMonth / 3) + 1;
  const [activeTahap, setActiveTahap] = useState(defaultTahap);
  const [searchQuery, setSearchQuery] = useState("");
  const [riwayatSearchQuery, setRiwayatSearchQuery] = useState("");

  // Initialize stage cache from DeltaCache for fast 0ms initial load
  const [stageCache, setStageCache] = useState<Record<number, SalesTransaction[]>>(() => {
    const initial: Record<number, SalesTransaction[]> = {};
    for (let stg = 1; stg <= 4; stg++) {
      const cached = DeltaCache.get<SalesTransaction>(`bansos_stage_${currentYear}_${stg}`);
      if (cached && cached.length > 0) {
        initial[stg] = cached;
      }
    }
    return initial;
  });
  const [loadingStage, setLoadingStage] = useState<boolean>(false);

  // Database-calculated summary for all 4 periods (PKH & BPNT)
  const defaultEmptyTrend = [
    { stage: "Tahap 1", stage_id: 1, period: "Jan-Mar", pkh: 0, bpnt: 0, pkhFunds: 0, bpntFunds: 0, totalFunds: 0, count: 0 },
    { stage: "Tahap 2", stage_id: 2, period: "Apr-Jun", pkh: 0, bpnt: 0, pkhFunds: 0, bpntFunds: 0, totalFunds: 0, count: 0 },
    { stage: "Tahap 3", stage_id: 3, period: "Jul-Sep", pkh: 0, bpnt: 0, pkhFunds: 0, bpntFunds: 0, totalFunds: 0, count: 0 },
    { stage: "Tahap 4", stage_id: 4, period: "Okt-Des", pkh: 0, bpnt: 0, pkhFunds: 0, bpntFunds: 0, totalFunds: 0, count: 0 },
  ];

  const [dbTrendData, setDbTrendData] = useState<typeof defaultEmptyTrend>(() => {
    const cached = DeltaCache.get<any>(`bansos_summary_${currentYear}`);
    return (cached && cached.length === 4) ? cached : defaultEmptyTrend;
  });
  const [loadingChart, setLoadingChart] = useState<boolean>(false);

  const getStageDateRange = (stage: number, year: number) => {
    switch (stage) {
      case 1:
        return { startDate: `${year}-01-01`, endDate: `${year}-03-31`, label: "Tahap 1", period: "Jan - Mar" };
      case 2:
        return { startDate: `${year}-04-01`, endDate: `${year}-06-30`, label: "Tahap 2", period: "Apr - Jun" };
      case 3:
        return { startDate: `${year}-07-01`, endDate: `${year}-09-30`, label: "Tahap 3", period: "Jul - Sep" };
      case 4:
        return { startDate: `${year}-10-01`, endDate: `${year}-12-31`, label: "Tahap 4", period: "Okt - Des" };
      default:
        return { startDate: `${year}-01-01`, endDate: `${year}-03-31`, label: "Tahap 1", period: "Jan - Mar" };
    }
  };

  // Delta sync stage data fetching with mergeDelta and since timestamp
  const fetchStageData = useCallback(async (stage: number, year: number, force: boolean = false) => {
    const cacheKey = `bansos_stage_${year}_${stage}`;
    const localCached = DeltaCache.get<SalesTransaction>(cacheKey);
    const lastSync = force ? null : DeltaCache.getLastSync(cacheKey);

    // Only show full-table loading spinner if we have no local/cached data at all
    setStageCache(prev => {
      if (!prev[stage] || prev[stage].length === 0) {
        setLoadingStage(true);
      }
      return prev;
    });

    try {
      const { startDate, endDate } = getStageDateRange(stage, year);
      const fetchTime = new Date().toISOString();

      // Ambil hanya kolom nama, tanggal, jenis, nominal (pemasukan), dan status tanpa menyertakan id_pelanggan
      const queryOptions: any = {
        bansosOnly: true,
        startDate,
        endDate,
        select: 'nama, tanggal, jenis, pemasukan, status'
      };

      const { data, error } = await SupabaseSalesService.getSales(queryOptions);

      if (data) {
        const mapped: SalesTransaction[] = data.map((item, idx) => ({
          id: `${(item.nama || '').trim()}_${item.tanggal || ''}_${idx}`,
          id_transaksi: `${(item.nama || '').trim()}_${item.tanggal || ''}_${idx}`,
          id_pelanggan: '',
          Tanggal: item.tanggal || '',
          Nama: (item.nama || '').trim(),
          Jenis: item.jenis || '',
          Pemasukan: typeof item.pemasukan === 'number' ? item.pemasukan : parseFloat(String(item.pemasukan || '0').replace(/[^0-9.-]+/g, "")) || 0,
          Status: item.status || 'SELESAI',
          Metode: 'TUNAI',
          Melalui: 'KASIR',
          Poin: 0,
          HargaModal: 0,
          Sebagian: 0,
          created_at: ''
        }));

        DeltaCache.set(cacheKey, mapped, fetchTime);
        setStageCache(prev => ({ ...prev, [stage]: mapped }));
      }
    } catch (err) {
      console.error(`Error loading bansos stage ${stage}:`, err);
    } finally {
      setLoadingStage(false);
    }
  }, []);

  // Fetch chart summary directly calculated on the database for all 4 periods
  const fetchBansosChartSummary = useCallback(async (year: number) => {
    setLoadingChart(true);
    try {
      const { data } = await SupabaseSalesService.calculateBansosSummaryRpc(year);
      if (data && Array.isArray(data) && data.length > 0) {
        setDbTrendData(data as any);
        DeltaCache.set(`bansos_summary_${year}`, data, new Date().toISOString());
      }
    } catch (e) {
      console.error("Gagal menghitung grafik bansos di database:", e);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // Sync year change: reload DeltaCache for stages and fetch database chart summary
  useEffect(() => {
    // Load cached stages for the selected year
    const updatedStages: Record<number, SalesTransaction[]> = {};
    for (let stg = 1; stg <= 4; stg++) {
      const cached = DeltaCache.get<SalesTransaction>(`bansos_stage_${selectedYear}_${stg}`);
      if (cached && cached.length > 0) {
        updatedStages[stg] = cached;
      }
    }
    setStageCache(updatedStages);

    // Fetch database-calculated chart summary for all 4 periods
    fetchBansosChartSummary(selectedYear);
  }, [selectedYear, fetchBansosChartSummary]);

  // When activeTahap or selectedYear changes, fetch/sync stage data smoothly
  useEffect(() => {
    fetchStageData(activeTahap, selectedYear);
  }, [activeTahap, selectedYear, fetchStageData]);

  const getRelativeDay = (dateStr: string) => {
    const date = parseDate(dateStr);
    if (!date || date.getTime() === 0) return dateStr;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays >= 2 && diffDays <= 30) return `${diffDays} Hari lalu`;
    
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const { result: processedData, targetYear } = React.useMemo(() => {
    const stages: Record<number, Map<string, { nama: string, pkh: number, bpnt: number }>> = { 
      1: new Map(), 2: new Map(), 3: new Map(), 4: new Map() 
    };

    [1, 2, 3, 4].forEach(stg => {
      const txs = stageCache[stg] || [];
      txs.forEach(t => {
        const status = (t.Status || "").toLowerCase();
        if (status.includes("batal") || status.includes("cancel")) return;

        const jenis = (t.Jenis || "").toUpperCase();
        if (jenis.includes("PKH") || jenis.includes("BPNT")) {
          const rawName = (t.Nama || "").trim();
          if (!rawName) return;

          // Normalisasi nama (lowercase dan gabungkan spasi ganda) sebagai acuan tunggal
          const nameKey = rawName.toLowerCase().replace(/\s+/g, ' ');
          let kpm = stages[stg].get(nameKey);
          if (!kpm) {
            kpm = { nama: rawName, pkh: 0, bpnt: 0 };
            stages[stg].set(nameKey, kpm);
          }
          
          const amount = typeof t.Pemasukan === 'number' 
            ? t.Pemasukan 
            : parseFloat(String(t.Pemasukan || '0').replace(/[^0-9.-]+/g, "")) || 0;

          if (jenis.includes("PKH")) {
            kpm.pkh += amount;
          }
          if (jenis.includes("BPNT")) {
            kpm.bpnt += amount;
          }
        }
      });
    });

    const result: Record<number, { nama: string, pkh: number, bpnt: number }[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (let i = 1; i <= 4; i++) {
      result[i] = Array.from(stages[i].values());
    }
    return { result, targetYear: selectedYear };
  }, [stageCache, selectedYear]);

  const riwayatData = React.useMemo(() => {
    const allTxs: SalesTransaction[] = [1, 2, 3, 4].reduce<SalesTransaction[]>((acc, stg) => {
      const list = stageCache[stg];
      return list ? acc.concat(list) : acc;
    }, []);
    return allTxs
      .filter((t) => {
        const jenis = t.Jenis?.toUpperCase() || "";
        const status = (t.Status || "").toLowerCase();
        const nama = (t.Nama || "").toLowerCase();
        const query = riwayatSearchQuery.toLowerCase().trim();
        
        const isMatch = (jenis.includes("PKH") || jenis.includes("BPNT")) && 
               !(status.includes("batal") || status.includes("cancel"));
        
        if (!isMatch) return false;
        if (!query) return true;
        
        return nama.includes(query) || jenis.toLowerCase().includes(query);
      })
      .map(t => ({
        tanggal: t.Tanggal,
        nama: t.Nama,
        jenis: t.Jenis?.toUpperCase() || "",
        nominal: parseCurrency(t.Pemasukan) || 0,
        status: t.Status
      }))
      .sort((a, b) => parseDate(b.tanggal).getTime() - parseDate(a.tanggal).getTime());
  }, [stageCache, riwayatSearchQuery]);

  const currentStageData = processedData[activeTahap] || [];
  const filteredData = currentStageData.filter(k => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const words = k.nama.toLowerCase().split(/\s+/);
    return words.some(word => word.startsWith(query)) || k.nama.toLowerCase().startsWith(query);
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  const totalDana = currentStageData.reduce((acc, k) => acc + k.pkh + k.bpnt, 0);
  const totalKPM = currentStageData.length;

  // Trend data across all 4 periods computed directly from database
  const trendData = React.useMemo(() => {
    return [1, 2, 3, 4].map(id => {
      const dbItem = dbTrendData.find(d => d.stage_id === id);
      const stageItems = processedData[id] || [];
      const hasLocal = stageItems.length > 0;

      const pkhCount = hasLocal ? stageItems.filter(item => item.pkh > 0).length : (dbItem?.pkh || 0);
      const bpntCount = hasLocal ? stageItems.filter(item => item.bpnt > 0).length : (dbItem?.bpnt || 0);
      const pkhFunds = hasLocal ? stageItems.reduce((acc, item) => acc + item.pkh, 0) : (dbItem?.pkhFunds || 0);
      const bpntFunds = hasLocal ? stageItems.reduce((acc, item) => acc + item.bpnt, 0) : (dbItem?.bpntFunds || 0);
      const totalFunds = pkhFunds + bpntFunds;

      return {
        stage: `Tahap ${id}`,
        stage_id: id,
        pkh: pkhCount,
        bpnt: bpntCount,
        pkhFunds: pkhFunds,
        bpntFunds: bpntFunds,
        totalFunds: totalFunds,
        count: hasLocal ? stageItems.length : (dbItem?.count || (pkhCount + bpntCount)),
        period: id === 1 ? "Jan-Mar" : id === 2 ? "Apr-Jun" : id === 3 ? "Jul-Sep" : "Okt-Des"
      };
    });
  }, [processedData, dbTrendData]);

  const [showPKHInfo, setShowPKHInfo] = useState(false);
  const [expandedDesil, setExpandedDesil] = useState<number | null>(null);

  const foundKPM = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query.length < 3) return null;
    
    // Find the person by name in any stage to get the unique identity
    let person = null;
    for (let i = 1; i <= 4; i++) {
      const found = (processedData[i] || []).find(k => {
        const words = k.nama.toLowerCase().split(/\s+/);
        return words.some(word => word === query) || k.nama.toLowerCase() === query;
      });
      if (found) {
        person = found;
        break;
      }
    }

    if (!person) return null;

    // Calculate totals and breakdown across all stages for this person
    let totalAllStages = 0;
    const stageBreakdown: Record<number, { pkh: number, bpnt: number }> = {};
    
    for (let i = 1; i <= 4; i++) {
      const foundInStage = (processedData[i] || []).find(k => k.nama.toLowerCase() === person.nama.toLowerCase());
      if (foundInStage) {
        const amount = (foundInStage.pkh + foundInStage.bpnt);
        totalAllStages += amount;
        stageBreakdown[i] = { pkh: foundInStage.pkh, bpnt: foundInStage.bpnt };
      } else {
        stageBreakdown[i] = { pkh: 0, bpnt: 0 };
      }
    }

    // Get specific data for the ACTIVE stage to show breakdown
    const currentStageInfo = currentStageData.find(k => k.nama.toLowerCase() === person.nama.toLowerCase());

    return {
      nama: person.nama,
      pkh: currentStageInfo?.pkh || 0,
      bpnt: currentStageInfo?.bpnt || 0,
      totalAllStages,
      stageBreakdown
    };
  }, [searchQuery, currentStageData, processedData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-white pb-32"
    >
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[280px] lg:h-[320px] -mx-2 sm:-mx-4 lg:-mx-8 -mt-2 sm:-mt-4 rounded-none overflow-hidden shadow-xl">
        <img 
          src="https://lh3.googleusercontent.com/d/1GpNZ4yIov99m-EDWMUmfb3m9aISQBEe6" 
          alt="Bansos Banner" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-12 left-6 right-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2">Pencairan Bansos</h1>
            <p className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-[0.2em]">PKH & BPNT â€¢ WARUNG TOMI {targetYear}</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-8 relative z-10 max-w-7xl mx-auto">
        {/* Menu Switcher inside the overlapping container */}
        <div className="bg-white rounded-3xl p-2 flex gap-2 shadow-xl border border-slate-50 dark:border-slate-800/50 mb-8">
          {[
            { id: 'laporan', label: 'Laporan', icon: ClipboardList },
            { id: 'riwayat', label: 'Riwayat', icon: History },
            { id: 'cek_desil', label: 'Cek Desil', icon: Globe },
          ].map(menu => (
            <button
              key={menu.id}
              onClick={() => setActiveMenu(menu.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeMenu === menu.id 
                  ? 'bg-[#F15A24] text-white shadow-lg shadow-orange-100' 
                  : 'text-slate-400 dark:text-slate-300 dark:text-slate-200 hover:bg-slate-50'
              }`}
            >
              <menu.icon className="w-3.5 h-3.5" />
              <span>{menu.label}</span>
            </button>
          ))}
        </div>

        {activeMenu === 'cek_desil' ? (
          <div className="pb-20">
            {/* Simplified Portal Cek Bansos */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-[#005E6A]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Globe className="w-8 h-8 text-[#005E6A]" />
              </div>

              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">Portal Resmi Cek Bansos</h2>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-300 dark:text-slate-200 leading-relaxed mb-6 max-w-[280px] mx-auto">
                Silakan akses situs resmi Kementerian Sosial Republik Indonesia untuk mengecek kepesertaan jaminan sosial menggunakan NIK KTP Anda secara aman.
              </p>

              <a 
                href="https://cekbansos.kemensos.go.id/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#005E6A] text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2 hover:bg-[#004b54] shadow-md transition-all active:scale-95"
              >
                Buka Portal Resmi
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Tabel Acuan Desil P3KE / DTKS Kemensos */}
            <div className="mt-8 bg-white rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#005E6A]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-[#005E6A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Tabel Acuan Desil Kesejahteraan</h3>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Kriteria Kesejahteraan DTKS & P3KE</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-300 dark:text-slate-200 font-medium leading-relaxed mb-6">
                Sistem pendataan kesejahteraan sosial nasional menggunakan standard binned-deciles (Desil 1 s.d. 10) untuk menggolongkan rumah tangga secara akurat. Kelompok desil menunjukkan urutan persentase kesejahteraan penduduk dari terendah (Desil 1) hingga tertinggi (Desil 10).
              </p>

              {/* Desil Accordion List (Without Search / Filter) */}
              <div className="space-y-3">
                {(() => {
                  const items = [
                    {
                      id: 1,
                      percentile: "0% - 10%",
                      badge: "Desil 1: Sangat Miskin (Kemiskinan Ekstrem)",
                      color: "bg-rose-50 text-rose-700 border-rose-100/80 dark:border-rose-900/50",
                      cardClass: "bg-rose-50/20 border-rose-100/70 dark:border-rose-900/50 hover:bg-rose-50/30 hover:border-rose-200 dark:hover:border-rose-800",
                      textColor: "text-rose-700",
                      indicatorColor: "bg-rose-500",
                      description: "10% Kelompok rumah tangga dengan kesejahteraan terendah secara nasional. Prioritas penuntasan mutlak kemiskinan ekstrem.",
                      income: "Penghasilan di bawah Rp 350.000,- per orang per bulan. Tidak memiliki sumber pencarian tetap atau penyandang disabilitas berat/lansia tunggal.",
                      papan: "Lantai tanah/bambu kasar, dinding anyaman bambu pelupuh/kayu lapis lapuk, atap rumbia/seng berkarat, tidak memiliki MCK pribadi/layak, luas rumah di bawah 8 meter persegi per jiwa, menggunakan air sungai/sumur terbuka tak terlindungi.",
                      bansos: "Mutlak berhak menerima bansos reguler PKH, BPNT Sembako bulanan, Program Indonesia Pintar (PIP), Jamsos Kesehatan gratis (PBI-JKN), BLT Kemiskinan Ekstrem Desa, serta bantuan rehabilitasi rumah tidak layak huni (RTLH).",
                      tag: "miskin bansospkhbpnt"
                    },
                    {
                      id: 2,
                      percentile: "10% - 20%",
                      badge: "Desil 2: Keluarga Miskin",
                      color: "bg-orange-50 text-orange-700 border-orange-100/80 dark:border-orange-900/50",
                      cardClass: "bg-orange-50/20 border-orange-100/70 dark:border-orange-900/50 hover:bg-orange-50/30 hover:border-orange-200 dark:hover:border-orange-800",
                      textColor: "text-orange-700",
                      indicatorColor: "bg-orange-500",
                      description: "Kelompok kesejahteraan 10-20% terendah secara nasional. Mengalami kerawanan pangan dan guncangan daya beli ringan.",
                      income: "Penghasilan berkisar Rp 350.000,- s.d Rp 450.000,- per orang per bulan. Bekerja di sektor kasar, buruh harian lepas, atau pertanian subsisten.",
                      papan: "Kondisi rumah semi permanen, dinding papan tipis/batako tanpa plaster, lantai semen kasar/retak, sarana mandi cuci kakus darurat atau bersama tetangga, listrik berdaya rendah (450W).",
                      bansos: "Berhak menerima bantuan sosial reguler pilar Kemensos: PKH, BPNT Sembako, bantuan pangan beras cadangan pemerintah, PBI-JKN BPJS gratis, dan subsidi LPG 3kg & Listrik.",
                      tag: "miskin bansospkhbpnt"
                    },
                    {
                      id: 3,
                      percentile: "20% - 30%",
                      badge: "Desil 3: Hampir Miskin",
                      color: "bg-amber-50 text-amber-700 border-amber-100/80 dark:border-amber-900/50",
                      cardClass: "bg-amber-50/20 border-amber-100/70 dark:border-amber-900/50 hover:bg-amber-50/30 hover:border-amber-200 dark:hover:border-amber-800",
                      textColor: "text-amber-700",
                      indicatorColor: "bg-amber-500",
                      description: "Kelompok kesejahteraan 20-30% terbawah secara nasional. Kondisi keuangan di garis batas kemiskinan daerah.",
                      income: "Penghasilan berkisar Rp 450.000,- s.d Rp 600.000,- per orang per bulan. Anggota keluarga bekerja serabutan, ojek pangkalan, pekerja paruh waktu.",
                      papan: "Rumah permanen sederhana namun memiliki banyak bagian rusak/lapuk, lantai plester kasar/sebagian ubin biasa, ketersediaan MCK seadanya, menggunakan sumur bor/pompa listrik daya rendah.",
                      bansos: "Layak menerima BPNT Sembako, bantuan pangan beras mitigasi inflasi, beasiswa KIP PIP sekolah, PBI-JKN kesehatan gratis, serta program kredit mikro tanpa jaminan.",
                      tag: "miskin bansosbpnt"
                    },
                    {
                      id: 4,
                      percentile: "30% - 40%",
                      badge: "Desil 4: Rentan Miskin",
                      color: "bg-yellow-50 text-yellow-700 border-yellow-100/80 dark:border-yellow-900/50",
                      cardClass: "bg-yellow-50/20 border-yellow-100/70 dark:border-yellow-900/50 hover:bg-yellow-50/30 hover:border-yellow-200 dark:hover:border-yellow-800",
                      textColor: "text-yellow-700",
                      indicatorColor: "bg-yellow-500",
                      description: "Kelompok kesejahteraan 30-40% bawah secara nasional. Aman dalam keadaan normal, namun langsung jatuh miskin jika terjadi PHK/sakit.",
                      income: "Penghasilan berkisar Rp 600.000,- s.d Rp 750.000,- per orang per month. Pekerja informal perkotaan, pedagang asongan, supir angkutan umum.",
                      papan: "Rumah permanen sederhana, lantai keramik sederhana, dinding bata diplester kasar, sanitasi tangki septik sederhana secara mandiri, listrik daya 900W.",
                      bansos: "Sasaran potensial jaminan kesehatan PBI-JKN, diprioritaskan untuk mendapat Kartu Prakerja, bansos pangan insidental saat inflasi tinggi, serta beasiswa sekolah daerah.",
                      tag: "miskin bansos"
                    },
                    {
                      id: 5,
                      percentile: "40% - 50%",
                      badge: "Desil 5: Menengah Bawah (Hampir Rentan)",
                      color: "bg-sky-50 text-sky-700 border-sky-100/80 dark:border-sky-900/50",
                      cardClass: "bg-sky-50/20 border-sky-100/70 dark:border-sky-900/50 hover:bg-sky-50/30 hover:border-sky-200 dark:hover:border-sky-800",
                      textColor: "text-sky-700",
                      indicatorColor: "bg-sky-500",
                      description: "Kelompok kesejahteraan 40-50% secara nasional. Kebutuhan dasar tercukupi pas-pasan, tidak memiliki tabungan bernilai besar.",
                      income: "Penghasilan berkisar Rp 750.000,- s.d Rp 1.000.000,- per orang per bulan. Karyawan swasta gaji minimum rendah, pelaku usaha mikro kecil mandiri.",
                      papan: "Rumah permanen kokoh, berlantai ubin/keramik standar, atap genteng, fasilitas kamar mandi layak pribadi, listrik daya 900W s.d 1300W.",
                      bansos: "Tidak menerima bansos sembako reguler. Berhak atas subsidi BBM umum bersubsidi, subsidi energi gas 3kg, subsidi pupuk sektor pertanian, dan bantuan modal KUR.",
                      tag: "mampu"
                    },
                    {
                      id: 6,
                      percentile: "50% - 60%",
                      badge: "Desil 6: Menengah Bawah Atas (Cukup Mampu)",
                      color: "bg-teal-50 text-teal-700 border-teal-100/80",
                      cardClass: "bg-teal-50/20 border-teal-100/70 hover:bg-teal-50/30 hover:border-teal-200",
                      textColor: "text-teal-700",
                      indicatorColor: "bg-teal-500",
                      description: "Kelompok kesejahteraan 50-60%. Memiliki kemandirian ekonomi, sanggup menghadapi guncangan ekonomi ringan secara mandiri.",
                      income: "Penghasilan berkisar Rp 1.000.000,- s.d Rp 1.500.000,- per orang per bulan. Pekerja kantoran, wiraswasta terdaftar, pemilik kios/lapak permanen.",
                      papan: "Rumah struktur beton kokoh rapi, lantai keramik modern, ventilasi baik, fasilitas air bor jetpump bersih atau PDAM lancar, mengonsumsi air galon bermerek.",
                      bansos: "Saringan KPM Mandiri: Tidak menerima bansos kemiskinan reguler. Menikmati subsidi energi tarif dasar dan program subsidi bunga pinjaman Kredit Usaha Rakyat (KUR).",
                      tag: "mampu"
                    },
                    {
                      id: 7,
                      percentile: "60% - 70%",
                      badge: "Desil 7: Kelompok Menengah",
                      color: "bg-indigo-50 text-indigo-700 border-indigo-100/80 dark:border-indigo-900/50",
                      cardClass: "bg-indigo-50/20 border-indigo-100/70 dark:border-indigo-900/50 hover:bg-indigo-50/30 hover:border-indigo-200 dark:hover:border-indigo-800",
                      textColor: "text-indigo-700",
                      indicatorColor: "bg-indigo-500",
                      description: "Kelompok kesejahteraan 60-70% teratas. Mapan secara finansial, memiliki aset transportasi motor layak roda dua lebih dari satu.",
                      income: "Penghasilan berkisar Rp 1.500.000,- s.d Rp 2.500.000,- per orang per bulan. PNS golongan rendah, karyawan swasta menengah, aparatur desa.",
                      papan: "Rumah milik pribadi berlantai keramik berkualitas, dapur modern ber-exhaust, kamar mandi pancuran/wc duduk bersih, memiliki alat elektronik lengkap (TV, Kulkas, AC).",
                      bansos: "Keluarga Mandiri Bebas Bansos: Dilarang keras menerima semua bentuk bansos kemiskinan. Menjadi peserta BPJS Kesehatan Mandiri aktif.",
                      tag: "mampu"
                    },
                    {
                      id: 8,
                      percentile: "70% - 80%",
                      badge: "Desil 8: Menengah Atas",
                      color: "bg-purple-50 text-purple-700 border-purple-100/80 dark:border-purple-900/50",
                      cardClass: "bg-purple-50/20 border-purple-100/70 dark:border-purple-900/50 hover:bg-purple-50/30 hover:border-purple-200 dark:hover:border-purple-800",
                      textColor: "text-purple-700",
                      indicatorColor: "bg-purple-500",
                      description: "Kelompok kesejahteraan 70-80% teratas nasional. Mampu menyisihkan tabungan aset, memiliki jaminan perlindungan finansial mapan.",
                      income: "Penghasilan berkisar Rp 2.500.000,- s.d Rp 4.500.000,- per orang per bulan. ASN/Polri/TNI menengah, pengusaha ruko komersial, manajer kantor cabang.",
                      papan: "Rumah besar dengan sertifikat SHM, garasi kendaraan mandiri, pembuangan tangki septik beton modern, listrik daya 1300W s.d 2200W.",
                      bansos: "Kategori Sejahtera Mandiri: Pembayar pajak aktif PPh dan PBB, dilarang menikmati produk bansos, peserta BPJS mandiri kelas 1/asuransi swasta premium.",
                      tag: "mampu"
                    },
                    {
                      id: 9,
                      percentile: "80% - 90%",
                      badge: "Desil 9: Keluarga Makmur",
                      color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100/80 dark:border-fuchsia-900/50",
                      cardClass: "bg-fuchsia-50/20 border-fuchsia-100/70 dark:border-fuchsia-900/50 hover:bg-fuchsia-50/30 hover:border-fuchsia-200 dark:hover:border-fuchsia-800",
                      textColor: "text-fuchsia-700",
                      indicatorColor: "bg-fuchsia-500",
                      description: "Kelompok kesejahteraan 80-90% teratas. Sangat berkecukupan, memiliki kendaraan mobil pribadi bernilai tinggi.",
                      income: "Penghasilan berkisar Rp 4.500.000,- s.d Rp 7.500.000,- per orang per bulan. Pejabat institusi, pengusaha skala wilayah, eksekutif madya.",
                      papan: "Rumah mewah berarsitektur modern atau klaster elit, sanitasi berkualitas tinggi, daya listrik di atas 2200W, memiliki aset investasi finansial (emas/deposito).",
                      bansos: "Kategori Makmur Konvensional: Secara otomatis tereleminasi total dari desil DTKS bantuan masyarakat miskin. Donatur/Pembayar pajak aktif nasional.",
                      tag: "mampu"
                    },
                    {
                      id: 10,
                      percentile: "90% - 100%",
                      badge: "Desil 10: Sangat Makmur (Elite Elit)",
                      color: "bg-pink-50 text-pink-700 border-pink-100/80 dark:border-pink-900/50",
                      cardClass: "bg-pink-50/20 border-pink-100/70 dark:border-pink-900/50 hover:bg-pink-50/30 hover:border-pink-200 dark:hover:border-pink-800",
                      textColor: "text-pink-700",
                      indicatorColor: "bg-pink-500",
                      description: "10% golongan terkaya/paling sejahtera di Indonesia. Memiliki tabungan modal tebal guncangan finansial nihil.",
                      income: "Penghasilan di atas Rp 7.500.000,- per orang per bulan secara konsisten. Pemilik bisnis skala besar, direksi korporat, investor, konglomerat.",
                      papan: "Mansion mewah atau beberapa aset tanah komersial berharga miliaran rupiah, kendaraan mewah ganda roda empat ke atas, sistem kelistrikan berdaya tinggi.",
                      bansos: "Kategori Konglomerat: Secara sistemik diblokir permanen dari penerimaan subsidi gas, BBM jenis tertentu, pupuk pertanian bersubsidi, dan semua bansos.",
                      tag: "mampu"
                    }
                  ];

                  return items.map((item) => (
                    <div 
                      key={item.id}
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${item.cardClass}`}
                    >
                      {/* Top Bar / Header */}
                      <button
                        onClick={() => setExpandedDesil(expandedDesil === item.id ? null : item.id)}
                        className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-3">
                          {/* Percentile circle */}
                          <div className="w-10 h-10 rounded-xl bg-white border border-inherit flex flex-col items-center justify-center text-center shrink-0 shadow-sm">
                            <span className={`text-[10px] font-black leading-none mb-0.5 ${item.textColor}`}>{item.id}</span>
                            <span className="text-[5px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 whitespace-nowrap leading-none mt-0.5">{item.percentile}</span>
                          </div>

                          <div className="flex-1 min-w-0 font-sans">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider mb-1 border ${item.color}`}>
                              {item.badge}
                            </span>
                            <p className="text-[8px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider leading-relaxed truncate max-w-[180px]">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ml-2 ${expandedDesil === item.id ? "rotate-180 " + item.textColor : "text-slate-400 dark:text-slate-300 dark:text-slate-200"}`} />
                      </button>

                      {/* Expandable Details */}
                      {expandedDesil === item.id && (
                        <div className="px-4 pb-4 border-t border-inherit pt-3 bg-white/45 space-y-3.5 text-left text-[9px]">
                          {/* Garis Kesejahteraan */}
                          <div className="grid grid-cols-1 gap-3 font-sans">
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[7px] block">Pendapatan & Ekonomi KPM</span>
                                <p className="text-slate-500 dark:text-slate-300 dark:text-slate-200 font-bold mt-0.5 leading-normal">{item.income}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                                <Home className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[7px] block">Kriteria Tempat Tinggal (Papan/Sanitasi)</span>
                                <p className="text-slate-500 dark:text-slate-300 dark:text-slate-200 font-bold mt-0.5 leading-normal">{item.papan}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/50">
                                <Gift className="w-3.5 h-3.5 text-[#F15A24]" />
                              </div>
                              <div>
                                <span className="font-black text-[#F15A24] uppercase tracking-widest text-[7px] block">Rekomendasi / Penerimaan Bansos Keamanan</span>
                                <p className="text-slate-500 dark:text-slate-300 dark:text-slate-200 font-bold mt-0.5 leading-normal">{item.bansos}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Footer Explanation Badge */}
              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[7px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider leading-relaxed">
                  P3KE: Pensasaran Percepatan Penghapusan Kemiskinan Ekstrem. DTKS: Data Terpadu Kesejahteraan Sosial Kemensos RI.
                </p>
              </div>
            </div>
          </div>
        ) : activeMenu === 'laporan' ? (
          <>
            {/* Tren KPM Chart */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Perbandingan PKH & BPNT</h3>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase">Penerima Bansos Tahap {targetYear}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#005E6A]" />
                <span className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase">PKH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#F15A24]" />
                <span className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase">BPNT</span>
              </div>
            </div>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#64748B' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white w-20 h-20 rounded-full shadow-2xl shadow-slate-200 border border-slate-50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center">
                          <p className="text-[7px] font-black uppercase tracking-widest mb-1 text-slate-300 dark:text-slate-200">{data.stage}</p>
                          <div className="space-y-0">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-[#005E6A] leading-tight">{data.pkh}</span>
                              <span className="text-[5px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 -mt-0.5">PKH</span>
                            </div>
                            <div className="w-4 h-[1px] bg-slate-50 my-0.5" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-[#F15A24] leading-tight">{data.bpnt}</span>
                              <span className="text-[5px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 -mt-0.5">BPNT</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="pkh" 
                  fill="#005E6A" 
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Bar 
                  dataKey="bpnt" 
                  fill="#F15A24" 
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#005E6A] p-1.5 rounded-xl flex items-center mb-6 border border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 1, label: "Tahap 1", period: "Jan - Mar" },
            { id: 2, label: "Tahap 2", period: "Apr - Jun" },
            { id: 3, label: "Tahap 3", period: "Jul - Sep" },
            { id: 4, label: "Tahap 4", period: "Okt - Des" },
          ].map((tahap) => {
            const isCurrentPeriod = defaultTahap === tahap.id;
            return (
              <button
                key={tahap.id}
                onClick={() => {
                  setActiveTahap(tahap.id);
                  if (!stageCache[tahap.id]) {
                    fetchStageData(tahap.id, selectedYear);
                  }
                }}
                className={`flex-1 min-w-[80px] py-2.5 px-2 rounded-lg transition-all flex flex-col items-center relative ${
                  activeTahap === tahap.id 
                    ? "bg-white text-[#005E6A] shadow-sm font-black" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest">{tahap.label}</span>
                  {isCurrentPeriod && (
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTahap === tahap.id ? 'bg-[#F15A24]' : 'bg-emerald-400'}`} title="Periode Berjalan" />
                  )}
                </div>
                <span className={`text-[7px] font-bold uppercase tracking-widest opacity-70`}>{tahap.period}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              fetchStageData(activeTahap, selectedYear, true);
              fetchBansosChartSummary(selectedYear);
            }}
            disabled={loadingStage || loadingChart}
            title="Muat ulang data periode ini & grafik"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStage || loadingChart ? 'animate-spin' : ''}`} />
          </button>
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

        {/* Table with Search */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm no-scrollbar bg-white mb-8">
          <div className="p-5 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">Daftar Penerima</h3>
                {loadingStage && currentStageData.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[#005E6A] text-[8px] font-bold animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Menyinkronkan...
                  </span>
                )}
              </div>
              <Search className="w-4 h-4 text-slate-300 dark:text-slate-200" />
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-200" />
              <input 
                type="text"
                placeholder="Cari nama anda di sini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-[11px] font-black uppercase tracking-tight focus:outline-none focus:border-[#005E6A]/20 dark:border-teal-800/40 transition-all shadow-inner"
              />
            </div>

            <AnimatePresence>
              {foundKPM && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="mt-4 p-5 bg-white border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-xl overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Detail Penerima Manfaat</p>
                      <p className="text-sm font-black text-[#005E6A] uppercase">{foundKPM.nama}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="text-[9px] font-black text-[#005E6A] uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800/50 pb-2">Rincian Per Tahap</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[1, 2, 3, 4].map(stageId => {
                        const stage = foundKPM.stageBreakdown[stageId];
                        const hasData = stage.pkh > 0 || stage.bpnt > 0;
                        
                        return (
                          <div key={stageId} className={`p-3 rounded-xl border transition-all ${hasData ? 'bg-slate-50 border-slate-100 dark:border-slate-800' : 'bg-slate-50/20 border-dashed border-slate-100 dark:border-slate-800 opacity-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 dark:text-slate-200">TAHAP {stageId}</span>
                              <span className="text-[10px] font-black text-[#005E6A]">Rp {(stage.pkh + stage.bpnt).toLocaleString('id-ID')}</span>
                            </div>
                            {hasData ? (
                              <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#005E6A]" />
                                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">PKH: <span className="text-slate-600 dark:text-slate-300 dark:text-slate-200">Rp {stage.pkh.toLocaleString('id-ID')}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#F15A24]" />
                                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">BPNT: <span className="text-slate-600 dark:text-slate-300 dark:text-slate-200">Rp {stage.bpnt.toLocaleString('id-ID')}</span></span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[8px] font-medium text-slate-400 dark:text-slate-300 dark:text-slate-200 italic">Data belum tersedia / Tidak menerima</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#005E6A] to-[#004852] p-4 rounded-xl text-white shadow-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Akumulasi Tahunan</p>
                      </div>
                      <p className="text-sm font-black">Rp {foundKPM.totalAllStages.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!foundKPM && (
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3 py-4 text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest whitespace-nowrap">No.</th>
                  <th className="px-3 py-4 text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest whitespace-nowrap">Nama KPM</th>
                  <th className="px-3 py-4 text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      PKH
                      <button onClick={() => setShowPKHInfo(true)}>
                        <HelpCircle className="w-2.5 h-2.5 text-[#005E6A]" />
                      </button>
                    </div>
                  </th>
                  <th className="px-3 py-4 text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest text-center whitespace-nowrap">BPNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingStage ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#005E6A]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#005E6A]">Memuat Data Bansos Tahap {activeTahap}...</span>
                        <span className="text-[8px] font-bold text-slate-400">Hanya mengambil transaksi PKH & BPNT periode ini</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 whitespace-nowrap">{index + 1}</td>
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
                    <td colSpan={4} className="px-3 py-10 text-center text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                      Tidak ada data untuk tahap ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
          </>
        ) : (
          <div className="pb-10">
            <div className="bg-[#005E6A] rounded-[2rem] p-8 text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <History className="w-24 h-24" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-widest mb-1">Riwayat Pencairan</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Total {riwayatData.length} transaksi dari {[1, 2, 3, 4].filter(id => (processedData[id] || []).length > 0).length || defaultTahap} tahap berjalan</p>
            </div>

            {/* Gesek Kolektif Info */}
            <div className="bg-orange-50 border border-orange-100 dark:border-orange-900/50 rounded-3xl p-5 mb-8 flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1">Sistem Gesek Kolektif</h4>
                <p className="text-[9px] text-orange-700 font-bold leading-relaxed">
                  Transaksi pukul <span className="text-orange-950">06:00 - 15:00</span>: Saldo dikumpulkan terlebih dahulu. 
                  Uang tunai akan dibagikan serentak pada <span className="text-orange-950 font-black">Pukul 16:00</span>.
                </p>
              </div>
            </div>

            {/* Search Bar for Riwayat */}
            <div className="mb-6 px-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#005E6A]">
                  <Search className="w-4 h-4 text-slate-300 dark:text-slate-200" />
                </div>
                <input 
                  type="text" 
                  value={riwayatSearchQuery}
                  onChange={(e) => setRiwayatSearchQuery(e.target.value)}
                  placeholder="Cari nama penerima atau jenis bansos..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-[#005E6A]/20 dark:border-teal-800/40 focus:bg-white text-[11px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 pl-12 pr-6 py-4 rounded-2xl outline-none transition-all duration-300 shadow-sm placeholder:text-slate-300 dark:text-slate-200 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                />
                {riwayatSearchQuery && (
                  <button 
                    onClick={() => setRiwayatSearchQuery("")}
                    className="absolute inset-y-0 right-4 flex items-center px-2 text-slate-300 hover:text-slate-500 dark:text-slate-300 dark:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-x-auto shadow-sm bg-white scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-2 sm:px-4 py-4 text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                    <th className="px-2 sm:px-4 py-4 text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Nama Penerima</th>
                    <th className="px-2 sm:px-4 py-4 text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest whitespace-nowrap">Jenis</th>
                    <th className="px-2 sm:px-4 py-4 text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                    <th className="px-2 sm:px-4 py-4 text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {riwayatData.length > 0 ? (() => {
                    let lastTahapId = "";
                    return riwayatData.map((item, index) => {
                      const date = parseDate(item.tanggal);
                      const m = date.getMonth();
                      const y = date.getFullYear();
                      let tahapLabel = "";
                      let tahapPeriod = "";
                      let tahapId = "";

                      if (m <= 2) { tahapLabel = "TAHAP 1"; tahapPeriod = "JANUARI - MARET"; tahapId = `T1-${y}`; }
                      else if (m <= 5) { tahapLabel = "TAHAP 2"; tahapPeriod = "APRIL - JUNI"; tahapId = `T2-${y}`; }
                      else if (m <= 8) { tahapLabel = "TAHAP 3"; tahapPeriod = "JULI - SEPTEMBER"; tahapId = `T3-${y}`; }
                      else { tahapLabel = "TAHAP 4"; tahapPeriod = "OKTOBER - DESEMBER"; tahapId = `T4-${y}`; }

                      const showTahapHeader = tahapId !== lastTahapId;
                      lastTahapId = tahapId;

                      const isSelesai = (item.status || "").toLowerCase().includes("selesai") || (item.status || "").toLowerCase().includes("sukses");
                      const StatusIcon = isSelesai ? CheckCircle2 : Timer;

                      return (
                        <React.Fragment key={index}>
                          {showTahapHeader && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={5} className="px-4 py-3 border-y border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" />
                                  <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">
                                    {tahapLabel} {y}
                                  </span>
                                  <div className="flex-1 h-[1px] bg-slate-100" />
                                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                                    {tahapPeriod}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-2 sm:px-4 py-4 text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 whitespace-nowrap">{getRelativeDay(item.tanggal)}</td>
                            <td className="px-2 sm:px-4 py-4 text-[8px] sm:text-[9px] font-black text-black uppercase tracking-tight leading-tight min-w-[80px]">{item.nama}</td>
                            <td className="px-2 sm:px-4 py-4 text-[8px] sm:text-[9px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 whitespace-nowrap">
                              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-black tracking-tight ${item.jenis.includes('PKH') ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                {item.jenis}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-4 text-[8px] sm:text-[9px] font-black text-[#005E6A] text-right whitespace-nowrap">
                              Rp {item.nominal.toLocaleString('id-ID')}
                            </td>
                            <td className="px-2 sm:px-4 py-4 text-[8px] sm:text-[9px] font-bold text-center whitespace-nowrap">
                              <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border ${isSelesai ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/50/50'}`}>
                                <StatusIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">{isSelesai ? 'Selesai' : 'Belum'}</span>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })() : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[9px] font-black text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                        Belum ada data pencairan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {/* PKH Info Modal */}
      {typeof document !== "undefined" && createPortal(
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
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <HelpCircle className="w-6 h-6 text-[#005E6A]" />
                </div>
                <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-4">Informasi Dana PKH</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 dark:text-slate-200 font-bold leading-relaxed mb-6">
                  Nominal PKH berbeda untuk setiap KPM karena bergantung pada komponen keluarga:
                </p>
                <ul className="space-y-2 mb-8">
                  {["Anak Sekolah (SD, SMP, SMA)", "Balita / Ibu Hamil", "Lansia / Disabilitas"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 bg-slate-50 p-2 rounded-lg">
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
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

const PromoSection = ({ loggedInUser }: { loggedInUser: Customer | null }) => {
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
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
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
        <div className="relative rounded-md overflow-hidden aspect-[16/9] shadow-sm bg-slate-50 touch-none">
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
                if (currentSlide === 0) navigate("/bansos");
                if (currentSlide === 1) {
                  if (loggedInUser) navigate(`/tabungan/${encodeURIComponent(loggedInUser.Nama)}`);
                  else navigate("/tabungan");
                }
                if (currentSlide === 3) navigate("/poin");
                if (currentSlide === 4) navigate("/level");
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
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400 dark:text-slate-300 dark:text-slate-200 p-8 text-center">
                  <Bot className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    Gambar tidak dapat dimuat.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const MainServices = ({ loggedInUser }: { loggedInUser: Customer | null }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const translatedServices = useMemo(() => {
    return MAIN_SERVICES.map(s => {
      let name = s.name;
      if (language === "en") {
        if (s.name === "Tabungan") name = "Savings";
        else if (s.name === "Kasbon / Hutang") name = "Debt";
        else if (s.name === "Poin Loyalitas") name = "Points";
        else if (s.name === "Investasi") name = "Investment";
        else if (s.name === "Bantuan / Edukasi") name = "Support";
        else if (s.name === "Tarik Tunai") name = "Cash Out";
        else if (s.name === "Transaksi Lainnya") name = "Others";
      }
      return { ...s, displayName: name };
    });
  }, [language]);

  return (
    <section className="px-6 py-1">
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col w-fit">
            <h2 className="text-base font-black text-black uppercase tracking-[0.2em] leading-none">{t("Layanan", "Services")}</h2>
            <div className="flex justify-between w-full mt-1">
              {(language === "en" ? "virtual products" : "produk virtual").split("").map((char, i) => (
                <span key={i} className="text-[6px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase leading-none">
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-[#E6F4F5] px-3 py-1 rounded-full flex items-center gap-1">
            <span className="text-[8px] font-extrabold text-[#005E6A] uppercase tracking-wider">Agen BNI</span>
            <span className="text-[8px] font-extrabold text-[#F15A24]">46</span>
          </div>
        </div>
        <div className="h-px bg-slate-100 w-full mb-6" />
        
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-y-8 gap-x-2">
          {translatedServices.map((service) => (
            <motion.button
              key={service.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (service.name === "Investasi") {
                  if (loggedInUser) navigate(`/investasi/${encodeURIComponent(loggedInUser.Nama)}`);
                  else navigate("/investasi");
                }
                else if (service.name === "Tabungan") {
                  if (loggedInUser) navigate(`/tabungan/${encodeURIComponent(loggedInUser.Nama)}`);
                  else navigate("/tabungan");
                }
                else if (service.name === "Poin Loyalitas") navigate("/poin");
                else if (service.name === "QRIS") navigate("/qris");
                else if (service.name === "Tarik Tunai") navigate("/tariktunai");
                else if (service.name === "Pulsa") navigate("/pulsa");
                else if (service.name === "Data" || service.name === "Paket Data") navigate("/paket-data");
                else if (service.name === "Listrik" || service.name === "Token Listrik") navigate("/listrik");
                else if (service.id === 1) navigate("/admin");
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 ${service.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}>
                {service.icon}
              </div>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 text-center leading-tight px-0.5">{service.displayName}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};



const BottomNav = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (id: string) => void, user: Customer | null }) => {
  const { t } = useLanguage();
  const allNavItems = [
    { id: "beranda", label: t("Beranda", "Home"), icon: Home },
    { id: "belanja", label: t("Belanja", "Shop"), icon: ShoppingBag },
    { id: "riwayat", label: t("Riwayat", "History"), icon: History, protected: true },
    { id: "settings", label: t("Profil", "Profile"), icon: User },
  ];

  const navItems = allNavItems.filter(item => !item.protected || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 h-16 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex items-center justify-center h-12 transition-all duration-500 rounded-full group ${
              isActive ? "flex-[2] bg-[#005E6A]/5 px-6" : "flex-1 px-2"
            }`}
          >
            {/* Active Indicator Background */}
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute inset-0 bg-gradient-to-br from-[#F15A24] to-[#ff8c42] rounded-full shadow-lg shadow-[#F15A24]/30"
                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
              />
            )}

            {/* Content Container */}
            <div className="flex items-center gap-2 relative z-10">
              <motion.div
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon 
                  className={`w-5 h-5 transition-all duration-500 ${
                    isActive ? "text-white" : "text-slate-400 dark:text-slate-300 dark:text-slate-200 group-hover:text-[#005E6A]"
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span 
                    initial={{ width: 0, opacity: 0, x: -5 }}
                    animate={{ width: "auto", opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -5 }}
                    className="text-[10px] font-black uppercase tracking-[0.1em] text-white whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

const PageDataSync: React.FC<{
  fetchData: (showLoading?: boolean, collectionName?: string | string[]) => Promise<void>;
  activeTab: string;
  loadedCollectionsRef: React.MutableRefObject<Set<string>>;
  getCollectionsForPath: (pathname: string, activeTab?: string) => string[];
  userFilterKey?: string;
}> = ({ fetchData, activeTab, loadedCollectionsRef, getCollectionsForPath, userFilterKey }) => {
  const location = useLocation();
  const isFirstMount = useRef(true);
  const prevPathRef = useRef(location.pathname);
  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    // Lewati initial mount karena fetchData(true) dipanggil saat pertama kali aplikasi dimuat
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathRef.current = location.pathname;
      prevTabRef.current = activeTab;
      return;
    }

    // Selalu trigger pengecekan delta sync dan tampilkan loading screen ketika berpindah halaman atau tab
    if (prevPathRef.current !== location.pathname || prevTabRef.current !== activeTab) {
      prevPathRef.current = location.pathname;
      prevTabRef.current = activeTab;

      const required = getCollectionsForPath(location.pathname, activeTab);
      if (required && required.length > 0) {
        fetchData(true, required);
      }
    }
  }, [location.pathname, activeTab, userFilterKey, getCollectionsForPath, fetchData]);

  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const ThemeHandler = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      // ThemeHandler allows user settings across all routes

      const savedTheme = localStorage.getItem('app_theme') || 'system';

      let isDark = false;
      if (savedTheme === 'dark') {
        isDark = true;
      } else if (savedTheme === 'light' || savedTheme === 'siang' || savedTheme === 'teal' || savedTheme === 'orange') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const savedTheme = localStorage.getItem('app_theme') || 'system';
      if (savedTheme === 'system' || !savedTheme) {
        applyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleMediaChange);
    }
    window.addEventListener('app_theme_changed', applyTheme);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleMediaChange);
      }
      window.removeEventListener('app_theme_changed', applyTheme);
    };
  }, [pathname]);

  return null;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" }}
    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { transform: "none", filter: "none", scale: "none" } }}
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
  const navigate = useNavigate();

  useEffect(() => {
    if (allowGuest || user) return;

    // Cek apakah ada sesi tersimpan di localStorage atau sessionStorage
    const savedLocal = safeStorage.getJSON<Customer | null>("warung_tomi_user", null);
    if (!savedLocal) {
      try {
        const savedSession = sessionStorage.getItem("warung_tomi_user");
        if (savedSession) return;
      } catch (e) {}
      // Jika benar-benar tidak ada sesi sama sekali, arahkan ke login
      navigate("/login");
    }
  }, [user, allowGuest, navigate]);

  if (!user && !allowGuest) {
    const savedLocal = safeStorage.getJSON<Customer | null>("warung_tomi_user", null);
    if (!savedLocal) {
      try {
        const savedSession = sessionStorage.getItem("warung_tomi_user");
        if (!savedSession) return null;
      } catch (e) {
        return null;
      }
    }
  }

  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
};

const LoginPage = ({
  user,
  customers,
  onLogin,
  setActiveTab
}: {
  user: Customer | null,
  customers: Customer[],
  onLogin: (user: Customer) => void,
  setActiveTab: (id: string) => void
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("admin_session") === "true") {
      navigate("/admin");
    } else if (localStorage.getItem("kasir_session") === "true") {
      navigate("/kasir");
    } else if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const [customerName, setCustomerName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch customer list for login suggestions (only name, pin, foto needed - no address, no phone)
  useEffect(() => {
    if (SupabaseCustomerService.isConnected()) {
      SupabaseCustomerService.getCustomers({ select: 'id, id_pelanggan, nama, pin, foto' })
        .then(res => {
          if (res.data && res.data.length > 0) {
            const mapped = res.data.map((c, index) => ({
              id: c.id_pelanggan || c.id || `CUST-${String(index + 1).padStart(4, '0')}`,
              id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
              Nama: c.nama || 'Pelanggan',
              PIN: c.pin || '',
              Foto: c.foto || ''
            }));
            setLocalCustomers(mapped);
          }
        })
        .catch(err => console.error("Gagal memuat pelanggan di LoginPage:", err));
    }
  }, []);

  const activeCustomerList = useMemo(() => {
    if (localCustomers && localCustomers.length > 0) return localCustomers;
    if (customers && customers.length > 0) return customers;
    return [];
  }, [customers, localCustomers]);

  const savedPhotos: Record<string, string> = (() => {
    try {
      const saved = localStorage.getItem("warung_tomi_photos");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const getCustomerPhoto = (c: Customer | null | undefined): string => {
    if (!c) return "";
    const raw = savedPhotos[c.Nama] || c.Foto || (c as any).foto || (c as any).FotoProfil || "";
    return formatImageUrl(raw);
  };

  const getCustomerPin = (c: Customer | null | undefined): string => {
    if (!c) return "";
    return String(c.PIN || (c as any).pin || (c as any).Pin || "").trim();
  };

  // Helper function to highlight typed characters in orange, rest in BNI blue
  const highlightText = (text: string, query: string) => {
    if (!query || !query.trim()) {
      return <span className="text-[#005E6A] font-black uppercase tracking-widest">{text}</span>;
    }
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className="text-[10px] font-black uppercase tracking-widest">
        {parts.map((part, i) => 
          part.toLowerCase() === query.trim().toLowerCase() ? (
            <span key={i} className="text-[#F15A24] font-black">{part}</span>
          ) : (
            <span key={i} className="text-[#005E6A] font-black">{part}</span>
          )
        )}
      </span>
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const trimmedInput = customerName.trim();
    if (trimmedInput.length > 0 && !showPinInput && activeCustomerList.length > 0) {
      const filtered = activeCustomerList.filter(c => 
        c && c.Nama && 
        typeof c.Nama === 'string' && 
        c.Nama.toLowerCase().includes(trimmedInput.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [customerName, activeCustomerList, showPinInput]);

  const handleLoginAttempt = async () => {
    const cleanName = customerName.trim();
    if (!cleanName) return;

    setIsVerifying(true);
    setError("");

    let foundUser = activeCustomerList.find(c => 
      c && c.Nama && typeof c.Nama === 'string' && c.Nama.trim().toLowerCase() === cleanName.toLowerCase()
    );

    // If not found or to ensure latest PIN/Foto from Supabase
    if (SupabaseCustomerService.isConnected()) {
      try {
        const { data } = await SupabaseCustomerService.getCustomers({ 
          name: cleanName,
          select: 'id, id_pelanggan, nama, pin, foto'
        });
        if (data && data.length > 0) {
          const c = data[0];
          const freshUser: Customer = {
            id: c.id_pelanggan || c.id || `CUST-0001`,
            id_pelanggan: c.id_pelanggan || '',
            Nama: c.nama || cleanName,
            PIN: c.pin || '',
            Foto: c.foto || ''
          };
          foundUser = freshUser;
        }
      } catch (err) {
        console.error("Gagal verifikasi data pelanggan dari Supabase:", err);
      }
    }

    setIsVerifying(false);

    if (foundUser) {
      const userPin = getCustomerPin(foundUser);
      if (userPin !== "") {
        setSelectedCustomer(foundUser);
        setShowPinInput(true);
        setError("");
      } else {
        onLogin(foundUser);
        setCustomerName("");
        setActiveTab("beranda");
        navigate("/");
      }
    } else {
      setError("Nama tidak ditemukan");
    }
  };

  const handlePinSubmit = async () => {
    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 6) {
      setError("PIN HARUS 6 DIGIT");
      return;
    }
    if (!selectedCustomer) return;

    let targetPin = getCustomerPin(selectedCustomer);

    // Verify against Supabase in real-time if needed
    if (!targetPin || targetPin !== cleanPin) {
      if (SupabaseCustomerService.isConnected()) {
        try {
          setIsVerifying(true);
          const { data } = await SupabaseCustomerService.getCustomers({ 
            name: selectedCustomer.Nama,
            select: 'id, id_pelanggan, nama, pin, foto'
          });
          setIsVerifying(false);
          if (data && data.length > 0) {
            const supaPin = String(data[0].pin || "").trim();
            if (supaPin === cleanPin) {
              targetPin = cleanPin;
              if (data[0].foto) selectedCustomer.Foto = data[0].foto;
            }
          }
        } catch (e) {
          setIsVerifying(false);
          console.error("Gagal validasi PIN dari Supabase:", e);
        }
      }
    }

    if (targetPin === cleanPin && onLogin && setActiveTab) {
      onLogin(selectedCustomer);
      setCustomerName("");
      setPinInput("");
      setShowPinInput(false);
      setSelectedCustomer(null);
      setError("");
      setActiveTab("beranda");
      navigate("/");
    } else {
      setError("PIN Salah");
    }
  };

  const selectedPhoto = getCustomerPhoto(selectedCustomer);

  return (
    <div className="px-4 py-8 flex flex-col items-center justify-start min-h-[75vh] relative pb-28">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm flex flex-col items-center relative"
      >
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-slate-200/50 border-4 border-white dark:border-slate-800 overflow-hidden relative z-10">
          <img 
            src="https://lh3.googleusercontent.com/d/1_Zf0ffn9lSBO6etgilrjnIYQ42d86wcv" 
            alt="Warung Tomi Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-xl font-black text-[#005E6A] uppercase tracking-tight mb-1 text-center">
          Portal <span className="text-[#F15A24]">Pelanggan</span>
        </h2>
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] mb-8 text-center">
          Silakan masuk untuk mengakses fitur lengkap
        </p>

        <div className="w-full space-y-4">
          {!showPinInput ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                </div>
                <input 
                  type="text" 
                  placeholder="NAMA PELANGGAN"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoginAttempt();
                  }}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A] transition-all shadow-sm"
                />
                
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
                    >
                      {suggestions.map((s, i) => {
                        const photo = getCustomerPhoto(s);
                        const userPin = getCustomerPin(s);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (userPin !== "") {
                                setCustomerName(s.Nama);
                                setSelectedCustomer(s);
                                setShowPinInput(true);
                                setSuggestions([]);
                              } else if (onLogin && setActiveTab) {
                                onLogin(s);
                                setCustomerName("");
                                setActiveTab("beranda");
                                navigate("/");
                              }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border-2 border-amber-200 dark:border-amber-800/60 overflow-hidden shadow-sm">
                                {photo ? (
                                  <img 
                                    src={photo} 
                                    alt={s.Nama} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-slate-800 flex items-center justify-center text-[#F15A24]">
                                    <User className="w-5 h-5 text-[#F15A24]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                {highlightText(s.Nama, customerName)}
                                {userPin !== "" && (
                                  <span className="text-[8px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                    <Lock className="w-2.5 h-2.5" /> PIN Keamanan
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-400 group-hover:text-[#F15A24] transition-colors" />
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between mb-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border-2 border-[#005E6A]/40 overflow-hidden shadow-sm">
                    {selectedPhoto ? (
                      <img 
                        src={selectedPhoto} 
                        alt={selectedCustomer?.Nama} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#005E6A] flex items-center justify-center text-white font-black text-sm">
                        {selectedCustomer?.Nama?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#005E6A] dark:text-teal-300 uppercase tracking-widest block">
                      {selectedCustomer?.Nama}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
                      Pelanggan Terdaftar
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowPinInput(false);
                    setPinInput("");
                  }}
                  className="text-[9px] font-black text-[#F15A24] uppercase tracking-widest hover:underline px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 cursor-pointer"
                >
                  Ganti
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                </div>
                <input 
                  type="password" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="MASUKKAN PIN (6 DIGIT)"
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPinInput(val);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePinSubmit();
                  }}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#F15A24] transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center pt-2"
            >
              {error}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Fixed Bottom Navbar Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex justify-center">
        <div className="w-full max-w-sm">
          <button 
            disabled={isVerifying}
            onClick={showPinInput ? handlePinSubmit : handleLoginAttempt}
            className={`w-full ${showPinInput ? 'bg-[#F15A24] hover:bg-[#d84e1d]' : 'bg-[#005E6A] hover:bg-[#004852]'} ${isVerifying ? 'opacity-75 cursor-wait' : 'cursor-pointer'} text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isVerifying ? "MEMVERIFIKASI..." : (showPinInput ? "MASUK SEKARANG" : "MASUK")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const LoyaltyPointsPage = ({ user, customers, transactions, redeemedPoints }: { user: Customer | null, customers: Customer[], transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab ] = useState<"HADIAH" | "CARA">("HADIAH");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [rpcPoints, setRpcPoints] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user?.Nama) {
      SupabasePointsService.calculateCustomerActivePointsRpc(user.Nama, user.id_pelanggan).then(res => {
        if (isMounted && res.data && typeof res.data.active_points === 'number') {
          setRpcPoints(res.data.active_points);
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [user?.Nama, user?.id_pelanggan]);

  const activePoints = useMemo(() => {
    if (rpcPoints !== null) return rpcPoints;
    if (!user) return 0;
    return Number(user.Poin ?? (user as any).point ?? (user as any).poin ?? 0);
  }, [user, rpcPoints]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const filtered = customers.filter(c => 
        (c.Nama || (c as any).nama || "").toLowerCase().includes(val.toLowerCase())
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
        className="min-h-screen bg-white pb-24"
      >
        {/* Hero Section */}
        <div className="relative h-[40vh] overflow-hidden mb-0">
          <img 
            src="https://lh3.googleusercontent.com/d/1BK2wG7qAlYgTJyX3yLk4BdGi-IEjkbpc" 
            alt="Loyalty Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-16 left-6 right-6 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Poin Loyalitas</h1>
              <p className="text-xs font-bold text-white/70 uppercase tracking-[0.2em]">Kumpulkan Poin di Warung Tomi</p>
            </motion.div>
          </div>
        </div>

        <div className="px-6">

        {/* Search Customer Input (Direct Layout) */}
        <div className="-mt-7 mb-8 relative z-20">
          <div className="absolute left-4.5 top-1/2 -translate-y-1/2 z-10">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
          </div>
          <input 
            type="text"
            placeholder={user ? "Cari nama pelanggan lain..." : "CARI NAMA PELANGGAN DI SINI..."}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 dark:border-slate-800 rounded-3xl pl-12 pr-6 py-4.5 text-xs font-black text-[#005E6A] focus:outline-none focus:border-[#005E6A] transition-all uppercase placeholder:text-slate-300 dark:text-slate-200 shadow-sm"
          />
          
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100]"
              >
                {suggestions.map((s, i) => {
                  const sPoints = Number(s.Poin ?? (s as any).point ?? (s as any).poin ?? 0);
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(`/poin/${encodeURIComponent(s.Nama)}`)}
                      className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-[#005E6A] shrink-0 border border-teal-500/10">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest">{s.Nama}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-amber-600 bg-amber-50/80 px-3 py-1 rounded-full border border-amber-500/10 tracking-wider">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          {sPoints.toLocaleString('id-ID')} Poin
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-200 group-hover:text-[#F15A24] group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-8">
          <button
            onClick={() => setActiveTab("HADIAH")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "HADIAH" ? "bg-white text-[#005E6A] shadow-md" : "text-slate-400 dark:text-slate-300 dark:text-slate-200"
            }`}
          >
            Daftar Hadiah
          </button>
          <button
            onClick={() => setActiveTab("CARA")}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "CARA" ? "bg-white text-[#F15A24] shadow-md" : "text-slate-400 dark:text-slate-300 dark:text-slate-200"
            }`}
          >
            Cara Dapat Poin
          </button>
        </div>

        {activeTab === "HADIAH" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {REWARDS.map((reward) => (
                <motion.div 
                  key={reward.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="group relative bg-white rounded-[2rem] border p-5 flex items-center gap-5 transition-all duration-300 border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:border-slate-700"
                >
                  {/* Image container */}
                  <div className="relative w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-center group-hover:shadow-inner transition-all duration-300">
                    <img 
                      src={reward.image} 
                      alt={reward.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-24 py-1">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2 truncate leading-tight group-hover:text-black transition-colors">
                        {reward.name}
                      </h4>

                      {/* Points badge */}
                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F15A24]/5 to-[#FF8C00]/5 border border-[#F15A24]/10 px-2.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 text-[#F15A24] fill-[#F15A24]" />
                        <span className="text-[10px] font-black text-[#F15A24] tracking-tight">{reward.points.toLocaleString('id-ID')}</span>
                        <span className="text-[8px] font-bold text-[#F15A24]/70 uppercase tracking-wider ml-0.5">Poin</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase mb-2">Belanja Berhadiah Poin</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-loose mb-4">
                Dapatkan 1 Poin untuk setiap kelipatan transaksi sebesar <span className="text-[#F15A24]">Rp 10.000</span>. Semakin banyak belanja, semakin banyak poin yang terkumpul!
              </p>
              
              <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-[0.2em] mb-2">Contoh Perolehan:</p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 uppercase">Tarik Tunai Rp 100.000</span>
                  <span className="text-[9px] font-black text-green-600">+10 Poin</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 uppercase">Beli Pulsa Rp 12.000</span>
                  <span className="text-[9px] font-black text-green-600">+1 Poin</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 uppercase">Token Listrik Rp 50.000</span>
                  <span className="text-[9px] font-black text-green-600">+5 Poin</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-black text-[#005E6A] uppercase mb-2">Bonus Level Pelanggan</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-loose mb-4">
                Naikkan level Anda untuk mendapatkan keuntungan lebih banyak:
              </p>
              <div className="space-y-3">
                {LEVELS.map((level, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-[1.5rem]">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-xl">
                      {level.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase mb-1">{level.name}</p>
                      <ul className="space-y-1">
                        {level.benefits.map((b, j) => (
                          <li key={j} className="text-[7px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 leading-relaxed">
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
        </div>
      </motion.div>
    </ProtectedPage>
  );
};



const RedeemRewardsPage = ({ user, transactions, redeemedPoints, customers }: { user: Customer | null, transactions: SalesTransaction[], redeemedPoints: RedeemedPoint[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [showPopup, setShowPopup] = useState(false);
  const [showCalcPopup, setShowCalcPopup] = useState(false);
  const [selectedReward, setSelectedReward] = useState<{ id: number; name: string; points: number; image: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'tukar' | 'riwayat'>('tukar');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'earn' | 'redeem' | 'expire'>('all');
  
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
  const userRedeemed = redeemedPoints.filter(r => r.Nama.toLowerCase() === displayUser.Nama.toLowerCase());

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
  const activePoints = totalEarned - totalExpired - totalRedeemed;

  // Build unified point history
  const pointHistory: { type: 'earn' | 'redeem' | 'expire'; date: string; points: number; title: string; description: string; transactionId?: string }[] = [];

  // Earned & Expired
  userSales.forEach(t => {
    const tDate = parseDate(t.Tanggal);
    if (tDate >= startDate) {
      const points = Math.floor(t.Pemasukan / 10000);
      if (points > 0) {
        pointHistory.push({
          type: 'earn',
          date: t.Tanggal,
          points: points,
          title: 'Poin Masuk',
          description: `Belanja Rp ${t.Pemasukan.toLocaleString('id-ID')} (${t.Jenis || 'Transaksi'})`,
          transactionId: t.id || t.id_transaksi
        });

        const expiryDate = new Date(tDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (expiryDate < now) {
          const d = expiryDate.getDate().toString().padStart(2, '0');
          const m = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
          const y = expiryDate.getFullYear();
          pointHistory.push({
            type: 'expire',
            date: `${d}/${m}/${y}`,
            points: points,
            title: 'Poin Hangus',
            description: `Masa aktif 1 tahun dari transaksi (${t.Tanggal}) berakhir`
          });
        }
      }
    }
  });

  // Redeemed
  userRedeemed.forEach(r => {
    pointHistory.push({
      type: 'redeem',
      date: r.Tanggal,
      points: r.Poin,
      title: 'Tukar Hadiah',
      description: `Tukar dengan: ${r.Hadiah}`
    });
  });

  // Sort descending by date
  pointHistory.sort((a, b) => {
    return parseDate(b.date).getTime() - parseDate(a.date).getTime();
  });

  const filteredHistory = pointHistory.filter(item => {
    if (historyFilter === 'all') return true;
    return item.type === historyFilter;
  });

  const availableRewards = REWARDS.filter(reward => activePoints >= reward.points);
  const lockedRewards = REWARDS.filter(reward => activePoints < reward.points);

  return (
    <ProtectedPage user={displayUser} title="Detail Poin" allowGuest={true}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 pb-20 min-h-screen bg-white max-w-lg mx-auto relative"
      >
        {/* Sticky points card so it is static/motionless and doesn't scroll with page */}
        <div className="sticky top-16 z-0 bg-white pb-6 pt-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#005E6A] via-[#028090] to-[#E25C3E] rounded-[2rem] py-8 px-7 text-white shadow-xl shadow-[#005E6A]/20">
            {/* Subtle background glow decorative elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative flex items-center justify-between mb-4">
              <div className="min-w-0 pr-2">
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm truncate max-w-[220px] mb-0.5">
                  {displayUser?.Nama || "Pelanggan Umum"}
                </h3>
                <p className="text-[10px] font-black text-teal-100/90 uppercase tracking-[0.2em]">Poin Aktif Anda</p>
              </div>
              <button 
                onClick={() => setShowCalcPopup(true)}
                className="w-12 h-12 bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner cursor-pointer group shrink-0"
                title="Klik untuk melihat detail rincian perhitungan poin"
              >
                <Star className="w-6 h-6 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-4xl font-black tracking-tight">{activePoints.toLocaleString('id-ID')}</h2>
              <span className="text-sm font-black text-teal-100 uppercase tracking-widest">Poin</span>
            </div>
            
            {/* Added Points Information below the main active points */}
            <div className="relative grid grid-cols-2 gap-4 pt-5 border-t border-dashed border-white/20">
              <div 
                onClick={() => {
                  setActiveTab('riwayat');
                  setHistoryFilter('redeem');
                }}
                className="cursor-pointer hover:bg-white/10 active:scale-95 transition-all p-2 rounded-xl -m-2 flex flex-col group/tukar"
              >
                <p className="text-[9px] font-black text-teal-100/85 uppercase tracking-widest mb-1 group-hover/tukar:text-white transition-colors">Poin Ditukar</p>
                <p className="text-base font-black text-white flex items-center gap-1">
                  {totalRedeemed.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-teal-100 group-hover/tukar:text-teal-50">Poin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/45 group-hover/tukar:text-white group-hover/tukar:translate-x-0.5 transition-all" />
                </p>
              </div>
              <div 
                onClick={() => {
                  setActiveTab('riwayat');
                  setHistoryFilter('expire');
                }}
                className="cursor-pointer hover:bg-white/10 active:scale-95 transition-all p-2 rounded-xl -m-2 flex flex-col items-end text-right group/hangus"
              >
                <p className="text-[9px] font-black text-teal-100/85 uppercase tracking-widest mb-1 group-hover/hangus:text-white transition-colors">Poin Hangus</p>
                <p className="text-base font-black text-rose-200 flex items-center gap-1 justify-end group-hover/hangus:text-rose-100">
                  {totalExpired.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-rose-200/80 group-hover/hangus:text-rose-100">Poin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-200/45 group-hover/hangus:text-white group-hover/hangus:translate-x-0.5 transition-all" />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards list container that scrolls UP and overlays the points card */}
        <div className="relative z-10 bg-slate-50 rounded-t-[2.5rem] pt-6 pb-24 -mx-6 px-6 min-h-[100vh] space-y-4 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] mt-6">
          {/* Sticky dual tabs selector */}
          <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md py-3 -mx-6 px-6 border-b border-slate-100/50 dark:border-slate-800/50 mb-4">
            <div className="flex bg-slate-200/60 p-1 rounded-2xl relative">
              <button
                onClick={() => setActiveTab('tukar')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${
                  activeTab === 'tukar' ? 'text-[#005E6A]' : 'text-slate-400 dark:text-slate-300 dark:text-slate-200'
                }`}
              >
                Tukar Hadiah
                {activeTab === 'tukar' && (
                  <motion.div
                    layoutId="activeRewardTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('riwayat');
                  setHistoryFilter('all');
                }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${
                  activeTab === 'riwayat' ? 'text-[#005E6A]' : 'text-slate-400 dark:text-slate-300 dark:text-slate-200'
                }`}
              >
                Riwayat Poin
                {activeTab === 'riwayat' && (
                  <motion.div
                    layoutId="activeRewardTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {activeTab === 'tukar' ? (
              <motion.div
                key="rewards-list"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 gap-4 pt-2"
              >
                {availableRewards.length > 0 && (
                  <>
                    <div className="pt-2 pb-1 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Siap Ditukar
                      </span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                    {availableRewards.map((reward) => (
                      <motion.div 
                        key={reward.id}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="group relative bg-white rounded-[2rem] border p-5 flex items-center gap-5 transition-all duration-300 border-emerald-100 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-200"
                      >
                        {/* Image container with subtle badge */}
                        <div className="relative w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-center group-hover:shadow-inner transition-all duration-300">
                          <img 
                            src={reward.image} 
                            alt={reward.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-24 py-1">
                          <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2 truncate leading-tight group-hover:text-black transition-colors">
                              {reward.name}
                            </h4>

                            {/* Points badge */}
                            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F15A24]/5 to-[#FF8C00]/5 border border-[#F15A24]/10 px-2.5 py-0.5 rounded-full">
                              <Star className="w-3 h-3 text-[#F15A24] fill-[#F15A24]" />
                              <span className="text-[10px] font-black text-[#F15A24] tracking-tight">{reward.points.toLocaleString('id-ID')}</span>
                              <span className="text-[8px] font-bold text-[#F15A24]/70 uppercase tracking-wider ml-0.5">Poin</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side CTA Button */}
                        <div className="shrink-0 pl-1">
                          <button 
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowPopup(true);
                            }}
                            className="h-10 px-4.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 bg-[#005E6A] hover:bg-[#004e58] text-white flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 hover:shadow-[#005E6A]/25 cursor-pointer whitespace-nowrap group/btn"
                          >
                            <span>Tukar</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}

                {lockedRewards.length > 0 && (
                  <>
                    <div className="pt-4 pb-1 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 dark:text-slate-200 bg-slate-50 px-3 py-1 rounded-full border border-slate-500/10">
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                        Belum Cukup
                      </span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                    {lockedRewards.map((reward) => {
                      const progressPercentage = Math.min(100, Math.max(0, (activePoints / reward.points) * 100));
                      
                      return (
                        <motion.div 
                          key={reward.id}
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="group relative bg-white rounded-[2rem] border p-5 flex items-center gap-5 transition-all duration-300 border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:border-slate-700"
                        >
                          {/* Image container */}
                          <div className="relative w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-center group-hover:shadow-inner transition-all duration-300">
                            <img 
                              src={reward.image} 
                              alt={reward.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2 truncate leading-tight group-hover:text-black transition-colors">
                                {reward.name}
                              </h4>

                              {/* Points badge */}
                              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F15A24]/5 to-[#FF8C00]/5 border border-[#F15A24]/10 px-2.5 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-[#F15A24] fill-[#F15A24]" />
                                <span className="text-[10px] font-black text-[#F15A24] tracking-tight">{reward.points.toLocaleString('id-ID')}</span>
                                <span className="text-[8px] font-bold text-[#F15A24]/70 uppercase tracking-wider ml-0.5">Poin</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-300 dark:text-slate-200 tracking-wider">Progress</span>
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-300 dark:text-slate-200">
                                  kurang <span className="text-rose-500">{(reward.points - activePoints).toLocaleString('id-ID')}</span> poin
                                </span>
                              </div>
                              <div className="bg-slate-100 rounded-full h-1.5 w-full overflow-hidden relative border border-slate-200/20 dark:border-slate-800/30">
                                <div 
                                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-[#F15A24] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history-list"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-3 pt-2"
              >
                {/* Filter chips */}
                <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar mb-3">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      historyFilter === 'all' 
                        ? 'bg-[#005E6A] text-white shadow-sm' 
                        : 'bg-white text-slate-500 dark:text-slate-300 dark:text-slate-200 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setHistoryFilter('earn')}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      historyFilter === 'earn' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white text-slate-500 dark:text-slate-300 dark:text-slate-200 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Poin Masuk
                  </button>
                  <button
                    onClick={() => setHistoryFilter('redeem')}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      historyFilter === 'redeem' 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-white text-slate-500 dark:text-slate-300 dark:text-slate-200 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Poin Ditukar
                  </button>
                  <button
                    onClick={() => setHistoryFilter('expire')}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      historyFilter === 'expire' 
                        ? 'bg-rose-500 text-white shadow-sm' 
                        : 'bg-white text-slate-500 dark:text-slate-300 dark:text-slate-200 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Poin Hangus
                  </button>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-300 dark:text-slate-200 space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 dark:text-slate-200">Belum Ada Riwayat</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-300 dark:text-slate-200 normal-case leading-relaxed">
                      {historyFilter === 'all' && 'Transaksi belanja Anda akan otomatis menghasilkan poin aktif di sini.'}
                      {historyFilter === 'earn' && 'Belum ada riwayat poin masuk dari transaksi belanja Anda.'}
                      {historyFilter === 'redeem' && 'Anda belum pernah melakukan penukaran poin dengan hadiah.'}
                      {historyFilter === 'expire' && 'Hebat! Belum ada poin Anda yang hangus (masa berlaku 1 tahun).'}
                    </p>
                  </div>
                ) : (
                  (() => {
                    let lastMonthLabel = '';
                    return filteredHistory.map((item, idx) => {
                      const isEarn = item.type === 'earn';
                      const isRedeem = item.type === 'redeem';
                      const isExpire = item.type === 'expire';
                      
                      const months = [
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ];
                      const d = parseDate(item.date);
                      const currentMonthLabel = d.getTime() === 0 ? "Lainnya" : `${months[d.getMonth()]} ${d.getFullYear()}`;
                      const showHeader = currentMonthLabel !== lastMonthLabel;
                      lastMonthLabel = currentMonthLabel;
                      
                      return (
                        <React.Fragment key={idx}>
                          {showHeader && (
                            <div className="pt-4 pb-2 flex items-center gap-3">
                              <span className="text-[9px] font-black text-[#005E6A] bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider border border-[#005E6A]/5">
                                {currentMonthLabel}
                              </span>
                              <div className="h-px bg-slate-100 flex-1" />
                            </div>
                          )}
                          <div 
                            onClick={() => {
                              if (isEarn && item.transactionId) {
                                navigate(`/detail-belanja/${encodeURIComponent(item.transactionId)}`);
                              }
                            }}
                            className={`bg-white rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm ${
                              isEarn && item.transactionId ? 'cursor-pointer hover:bg-slate-50/80 transition-colors active:scale-[0.99] duration-150' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isEarn ? 'bg-emerald-50 text-emerald-600' :
                                isRedeem ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                                {isEarn && <PlusCircle className="w-5 h-5" />}
                                {isRedeem && <Gift className="w-5 h-5" />}
                                {isExpire && <AlertTriangle className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-300 dark:text-slate-200 line-clamp-1 mt-0.5 leading-relaxed">{item.description}</p>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider mt-1">{item.date}</p>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-black tracking-tight ${
                                isEarn ? 'text-emerald-600' :
                                isRedeem ? 'text-amber-600' :
                                'text-rose-600'
                              }`}>
                                {isEarn ? '+' : '-'}{item.points.toLocaleString('id-ID')} Poin
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Info Popup & Calc Popup */}
      {createPortal(
        <>
          <AnimatePresence>
            {showPopup && selectedReward && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative"
                >
                  <button 
                    onClick={() => {
                      setShowPopup(false);
                      setSelectedReward(null);
                    }}
                    className="absolute top-5 right-5 p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                  </button>

                  {activePoints >= selectedReward.points ? (
                    <>
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                        <Gift className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-widest mb-4">Tukar Hadiah</h3>
                      
                      {/* Kartu Hadiah Terpilih */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-5 flex items-center gap-4 text-left shadow-inner">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center justify-center p-1 shadow-sm">
                          <img 
                            src={selectedReward.image} 
                            alt={selectedReward.name} 
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-2 leading-snug">
                            {selectedReward.name}
                          </p>
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full mt-2">
                            <Star className="w-3.5 h-3.5 text-[#F15A24] fill-[#F15A24]" />
                            <span className="text-xs font-black text-[#F15A24]">{selectedReward.points.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] font-bold text-[#F15A24]/70 uppercase tracking-wider">Poin</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-relaxed mb-6">
                        Apakah Anda yakin ingin menukarkan poin untuk hadiah di atas? Klik tombol di bawah untuk mengajukan penukaran ke admin.
                      </p>
                      <a 
                        href={`https://wa.me/6287774138090?text=${encodeURIComponent(
                          `Hai... Warung Tomi\nSaya *${displayUser.Nama}*, saat ini saya memiliki ${activePoints} poin ingin menukar :\n\n* *${selectedReward.points} poin* saya dengan\n* *${selectedReward.name}*\n\nApakah hadiahnya masih tersedia?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setShowPopup(false);
                          setSelectedReward(null);
                        }}
                        className="w-full bg-[#25D366] hover:bg-[#20BA56] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-transform active:scale-95 text-center block"
                      >
                        Ajukan Tukar Poin
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/50 shadow-sm">
                        <AlertTriangle className="w-7 h-7 text-amber-500 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4">Poin Kurang</h3>
                      
                      {/* Kartu Hadiah Terpilih */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-4 flex items-center gap-4 text-left shadow-inner">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center justify-center p-1 shadow-sm">
                          <img 
                            src={selectedReward.image} 
                            alt={selectedReward.name} 
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-2 leading-snug">
                            {selectedReward.name}
                          </p>
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full mt-2">
                            <Star className="w-3.5 h-3.5 text-[#F15A24] fill-[#F15A24]" />
                            <span className="text-xs font-black text-[#F15A24]">{selectedReward.points.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] font-bold text-[#F15A24]/70 uppercase tracking-wider">Poin</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-relaxed mb-3">
                        Poin Anda kurang <span className="text-red-500 font-black">{(selectedReward.points - activePoints).toLocaleString('id-ID')} poin</span> untuk menukarkan hadiah ini.
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-300 dark:text-slate-200 mb-6 normal-case leading-relaxed">
                        Kumpulkan lebih banyak poin dengan meningkatkan transaksi belanja Anda di Warung Tomi!
                      </p>
                      <button 
                        onClick={() => {
                          setShowPopup(false);
                          setSelectedReward(null);
                        }}
                        className="w-full bg-[#005E6A] hover:bg-[#004e58] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 transition-transform active:scale-95"
                      >
                        Mengerti
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCalcPopup && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-white rounded-[2.5rem] p-7 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 relative"
                >
                  <button 
                    onClick={() => setShowCalcPopup(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                  </button>

                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-[#005E6A] fill-amber-300" />
                  </div>
                  
                  <h3 className="text-center text-sm font-black text-[#005E6A] uppercase tracking-widest mb-1">Rincian Perhitungan Poin</h3>
                  <p className="text-center text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-normal mb-6">
                    Berdasarkan transaksi sejak 1 Nov 2025
                  </p>

                  <div className="space-y-4 mb-6">
                    {/* Akumulasi */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">
                        +
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Poin Diperoleh</span>
                          <span className="text-xs font-black text-emerald-600">+{totalEarned.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 dark:text-slate-300 dark:text-slate-200 mt-0.5 leading-relaxed">
                          Akumulasi poin didapat dari total transaksi belanja (Kelipatan Rp 10.000 = 1 Poin).
                        </p>
                      </div>
                    </div>

                    {/* Ditukar */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-amber-600 font-bold text-sm">
                        -
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Poin Ditukar</span>
                          <span className="text-xs font-black text-amber-600">-{totalRedeemed.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 dark:text-slate-300 dark:text-slate-200 mt-0.5 leading-relaxed">
                          Total poin yang telah sukses ditukarkan dengan berbagai hadiah pilihan Anda.
                        </p>
                      </div>
                    </div>

                    {/* Hangus */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 text-rose-600 font-bold text-sm">
                        -
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Poin Hangus</span>
                          <span className="text-xs font-black text-rose-600">-{totalExpired.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 dark:text-slate-300 dark:text-slate-200 mt-0.5 leading-relaxed">
                          Poin otomatis hangus jika tidak digunakan dalam jangka waktu 1 tahun.
                        </p>
                      </div>
                    </div>

                    {/* Border line */}
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-2" />

                    {/* Sisa Aktif */}
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#005E6A] flex items-center justify-center shrink-0 text-white font-bold text-sm">
                        =
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-[#005E6A] uppercase tracking-wider">Sisa Poin Aktif</span>
                          <span className="text-sm font-black text-[#005E6A]">{activePoints.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[8px] text-teal-700/80 mt-0.5 leading-relaxed font-bold uppercase tracking-wider">
                          Sisa poin yang dapat Anda tukarkan sekarang!
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowCalcPopup(false)}
                    className="w-full bg-[#005E6A] hover:bg-[#004e58] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 transition-transform active:scale-95 cursor-pointer text-center block"
                  >
                    Mengerti & Tutup
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </ProtectedPage>
  );
};

const SavingsPromotionPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Hero Section */}
      <div className="relative h-[45vh] overflow-hidden">
        <img 
          src="https://lh3.googleusercontent.com/d/1mIuvZjLO0eroPRfJR5fw38mo1iIueuzq" 
          alt="Tabungan Banner" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-10 left-6 right-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Yuk Menabung!</h1>
            <p className="text-xs font-bold text-white/70 uppercase tracking-[0.2em]">Wujudkan Masa Depan Cerah Bersama Warung Tomi</p>
          </motion.div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-50 dark:border-slate-800/50"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#E6F4F5] rounded-2xl flex items-center justify-center text-[#005E6A] mb-4 shadow-lg shadow-teal-100">
              <PiggyBank className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#005E6A] uppercase tracking-tight">Kenapa Harus Menabung di Sini?</h2>
            <div className="w-12 h-1 bg-[#F15A24] rounded-full mt-3" />
          </div>

          <div className="space-y-6">
            {[
              { 
                title: "Aman & Transparan", 
                desc: "Setiap transaksi tercatat otomatis di sistem digital kami. Anda bisa cek saldo kapanpun!",
                icon: ShieldCheck,
                color: "bg-blue-50 text-blue-600"
              },
              { 
                title: "Tanpa Biaya Admin", 
                desc: "Tidak ada potongan bulanan. Uang yang Anda tabung utuh 100% milik Anda.",
                icon: Calculator,
                color: "bg-green-50 text-green-600"
              },
              { 
                title: "Bonus Poin Reward", 
                desc: "Setiap kelipatan tabungan tertentu akan mendapatkan poin yang bisa ditukar hadiah menarik.",
                icon: Star,
                color: "bg-amber-50 text-amber-600"
              },
              { 
                title: "Tarik Kapan Saja", 
                desc: "Butuh uang darurat? Saldo tabungan bisa dicairkan di jam operasional toko kami.",
                icon: Wallet,
                color: "bg-purple-50 text-purple-600"
              },
              { 
                title: "Naikkan Level Member", 
                desc: "Total tabungan yang tinggi membantu Anda naik ke level Platinum lebih cepat!",
                icon: Trophy,
                color: "bg-rose-50 text-rose-600"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex gap-4 items-start"
              >
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shrink-0 border border-black/5 shadow-sm`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-1">{item.title}</h3>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 leading-relaxed uppercase tracking-tight">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
            <h4 className="text-[10px] font-black text-[#005E6A] uppercase tracking-widest mb-2">Mulai Menabung Hari Ini!</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-tight leading-relaxed mb-6">Datang langsung ke Warung Tomi atau hubungi kami melalui WhatsApp.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.open("https://wa.me/6287774138090", "_blank")}
                className="bg-green-500 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
              <button 
                onClick={() => navigate("/")}
                className="bg-[#005E6A] text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Home className="w-3 h-3" />
                <span>Beranda</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SavingsDetailPage = ({ user, transactions, customers, fetchData }: { user: Customer | null, transactions: SavingTransaction[], customers?: Customer[], fetchData?: (showLoading?: boolean, collectionName?: string | string[], extraOptions?: any) => Promise<void> }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const paramVal = customerName ? decodeURIComponent(customerName).toLowerCase() : "";
  
  const displayUser = paramVal && customers 
    ? customers.find(c => 
        (c.id_pelanggan && c.id_pelanggan.toLowerCase() === paramVal) ||
        c.Nama.toLowerCase() === paramVal
      ) || user
    : user;
  
  const userTransactions = useMemo(() => {
    if (!displayUser) return [];
    return transactions.filter(t => isCustomerSavingMatch(t, displayUser));
  }, [transactions, displayUser]);

  // State untuk ringkasan bulan via Database RPC (hemat bandwidth & perhitungan di database)
  const [serverMonthsSummary, setServerMonthsSummary] = useState<CustomerSavingsMonthSummary[] | null>(null);
  const [generatingPdfMonth, setGeneratingPdfMonth] = useState<string | null>(null);
  const [generatingExcelMonth, setGeneratingExcelMonth] = useState<string | null>(null);

  const handleGenerateMonthPdf = async (monthVal: string, monthLbl: string) => {
    try {
      setGeneratingPdfMonth(monthVal);
      await downloadSavingsStatementPdf(displayUser, transactions, monthVal, monthLbl);
    } catch (err) {
      console.error("Gagal men-generate PDF e-Statement:", err);
    } finally {
      setGeneratingPdfMonth(null);
    }
  };

  const handleGenerateMonthExcel = async (monthVal: string, monthLbl: string) => {
    try {
      setGeneratingExcelMonth(monthVal);
      await downloadSavingsStatementExcel(displayUser, transactions, monthVal, monthLbl);
    } catch (err) {
      console.error("Gagal men-generate Excel e-Statement:", err);
    } finally {
      setGeneratingExcelMonth(null);
    }
  };
  const [showEStatementDrawer, setShowEStatementDrawer] = useState<boolean>(false);
  const [serverEarliestDate, setServerEarliestDate] = useState<Date | null>(null);
  const [isLoadingMonths, setIsLoadingMonths] = useState<boolean>(false);

  // Ambil daftar bulan & tanggal awal menabung langsung dari Database Supabase via RPC
  useEffect(() => {
    let isMounted = true;
    const fetchMonthsViaRpc = async () => {
      const targetName = displayUser?.Nama;
      const targetIdPel = displayUser?.id_pelanggan;
      if (!targetName && !targetIdPel) return;

      if (SupabaseSavingsService.isConnected()) {
        try {
          setIsLoadingMonths(true);
          const res = await SupabaseSavingsService.getCustomerSavingsMonths({
            name: targetName,
            customerId: targetIdPel
          });

          if (isMounted && res.data) {
            if (res.data.months && res.data.months.length > 0) {
              setServerMonthsSummary(res.data.months);
            }
            if (res.data.earliestDate) {
              const parsed = parseDate(res.data.earliestDate);
              if (parsed.getTime() > 946684800000 && !isNaN(parsed.getTime())) {
                setServerEarliestDate(parsed);
              }
            }
          }
        } catch (err) {
          console.warn("Gagal mengambil daftar bulan tabungan via RPC:", err);
        } finally {
          if (isMounted) setIsLoadingMonths(false);
        }
      }
    };

    fetchMonthsViaRpc();

    return () => {
      isMounted = false;
    };
  }, [displayUser?.Nama, displayUser?.id_pelanggan]);

  // Rentang bulan: Hanya dari awal menabung hingga bulan saat ini (tanpa bulan sebelum menabung)
  const allMonths = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const maxMonthDate = new Date(currentYear, currentMonth, 1);

    // 1. Tentukan tanggal transaksi tertua (dari Database RPC atau fallback lokal)
    let minMonthDate = new Date(currentYear, currentMonth, 1);

    if (serverEarliestDate) {
      const sMin = new Date(serverEarliestDate.getFullYear(), serverEarliestDate.getMonth(), 1);
      if (sMin <= maxMonthDate) {
        minMonthDate = sMin;
      }
    } else if (serverMonthsSummary && serverMonthsSummary.length > 0) {
      const oldestMonthObj = serverMonthsSummary[serverMonthsSummary.length - 1];
      const sMin = new Date(oldestMonthObj.year, oldestMonthObj.month, 1);
      if (sMin <= maxMonthDate) {
        minMonthDate = sMin;
      }
    } else if (userTransactions.length > 0) {
      let oldestTime = Infinity;
      userTransactions.forEach((t) => {
        const parsed = parseDate(t.Tanggal);
        const time = parsed.getTime();
        if (time > 946684800000 && !isNaN(time) && time < oldestTime) {
          oldestTime = time;
        }
      });

      if (oldestTime !== Infinity) {
        const oldestD = new Date(oldestTime);
        const sMin = new Date(oldestD.getFullYear(), oldestD.getMonth(), 1);
        if (sMin <= maxMonthDate) {
          minMonthDate = sMin;
        }
      }
    }

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const result: { label: string; fullLabel: string; value: string; month: number; year: number }[] = [];
    const loop = new Date(minMonthDate.getFullYear(), minMonthDate.getMonth(), 1);

    while (loop <= maxMonthDate) {
      const y = loop.getFullYear();
      const m = loop.getMonth();
      result.push({
        label: monthNames[m], // Hanya tampilkan nama bulannya saja tanpa tahun (misal "Agustus")
        fullLabel: `${monthNames[m]} ${y}`,
        value: `${y}-${String(m + 1).padStart(2, '0')}`,
        month: m,
        year: y
      });
      loop.setMonth(loop.getMonth() + 1);
    }

    if (result.length === 0) {
      result.push({
        label: monthNames[currentMonth],
        fullLabel: `${monthNames[currentMonth]} ${currentYear}`,
        value: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        month: currentMonth,
        year: currentYear
      });
    }

    return result;
  }, [serverEarliestDate, serverMonthsSummary, userTransactions]);

  const [searchParams] = useSearchParams();
  const initialMonth = searchParams.get('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || "");
  
  useEffect(() => {
    if (initialMonth && allMonths.some(m => m.value === initialMonth)) {
      setSelectedMonth(initialMonth);
    } else if (allMonths.length > 0) {
      if (!selectedMonth || !allMonths.some(m => m.value === selectedMonth)) {
        setSelectedMonth(allMonths[allMonths.length - 1].value);
      }
    }
  }, [allMonths, initialMonth]);

  useEffect(() => {
    if (selectedMonth && fetchData) {
      fetchData(false, 'savingTransactions', { monthFilter: selectedMonth, userFilterKey: displayUser?.Nama });
    }
  }, [selectedMonth, displayUser?.Nama]);

  const selectedMonthLabel = allMonths.find(m => m.value === selectedMonth)?.label || "";
  const [typeFilter, setTypeFilter] = useState<'SEMUA' | 'SETOR' | 'TARIK'>('SEMUA');

  const [swipeDirection, setSwipeDirection] = useState(0);
  const [selectedSavingTx, setSelectedSavingTx] = useState<SavingTransaction | null>(null);

  useEffect(() => {
    const showSavingId = searchParams.get("showSavingId");
    if (showSavingId) {
      const found = userTransactions.find(t => t.id === showSavingId || t.id_tabungan === showSavingId);
      if (found) {
        navigate(`/detail-tabungan/${encodeURIComponent(showSavingId)}`);
      }
    }
  }, [searchParams, userTransactions, navigate]);

  const getMotivationMessage = (nominal: number) => {
    if (nominal >= 100000) {
      return "Luar biasa! Tabungan besar hari ini akan menjadi pondasi kesuksesan finansialmu di masa depan! ðŸš€âœ¨";
    } else if (nominal >= 50000) {
      return "Mantap sekali! Semakin rajin menabung, impianmu akan semakin cepat terwujud! Semangat terus ya! ðŸ’ªðŸŒŸ";
    } else {
      return "Hebat! Sedikit demi sedikit, lama-lama menjadi bukit. Setiap rupiah yang kamu tabung sangat berarti! ðŸ†ðŸ’–";
    }
  };

  const handleMonthChange = React.useCallback((newValue: string) => {
    const currentIndex = allMonths.findIndex(m => m.value === selectedMonth);
    const newIndex = allMonths.findIndex(m => m.value === newValue);
    if (newIndex !== -1 && currentIndex !== -1) {
      setSwipeDirection(newIndex > currentIndex ? 1 : -1);
    }
    setSelectedMonth(newValue);
  }, [allMonths, selectedMonth]);

  const tabContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setTimeout(() => {
        const activeChild = node.querySelector('[data-active="true"]') as HTMLElement | null;
        if (activeChild) {
          const containerWidth = node.clientWidth;
          const elementLeft = activeChild.offsetLeft;
          const elementWidth = activeChild.clientWidth;
          node.scrollTo({
            left: elementLeft - (containerWidth / 2) + (elementWidth / 2),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [selectedMonth]);

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

  return (
    <>
      <ProtectedPage user={displayUser} title="Detail Tabungan">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="px-6 py-4 pb-12"
        >
          {/* Balance & Monthly Summary Card */}
          <motion.div 
            key="balance"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-16 z-0 bg-gradient-to-br from-[#2ecc71] to-[#27ae60] rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden border-t border-white/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black tracking-tight drop-shadow-sm truncate max-w-[200px] mb-0.5">{displayUser?.Nama || "Pelanggan Umum"}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Saldo Tabungan</p>
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-lg font-bold opacity-80">Rp</span>
                <h2 className="text-4xl font-black tracking-tight">{formatCurrency(displayUser?.Tabungan || 0)}</h2>
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

          <div className="relative z-10 bg-slate-50 rounded-t-[2.5rem] pt-6 pb-12 -mx-6 px-6 min-h-[100vh] space-y-4 shadow-[0_-12px_30px_rgba(0,0,0,0.03)]">
            {/* Month Tabs & Header */}
            <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md py-3 -mx-6 px-6 border-b border-slate-100/50 dark:border-slate-800/50">
              {/* Header di atas filter bulan: Riwayat & E-Statement */}
              <div className="flex items-center justify-between px-1 mb-2.5">
                <h4 className="text-sm font-black text-[#005E6A] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Riwayat</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEStatementDrawer(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 active:scale-95 text-[#F15A24] font-black text-xs uppercase tracking-wider border border-orange-200/80 shadow-2xs transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>E-Statement</span>
                </button>
              </div>

              {/* Garis Pembatas Halus Antara Baris Riwayat dan Filter Bulan */}
              <div className="h-px bg-slate-200/80 dark:bg-slate-700/80 mb-2.5" />

              <div ref={tabContainerRef} className="relative flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                {allMonths.map((m, i) => {
                  const isActive = selectedMonth === m.value;
                  return (
                    <button
                      key={i}
                      data-active={isActive}
                      onClick={() => handleMonthChange(m.value)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap snap-start transition-all duration-200 border ${
                        isActive 
                          ? 'bg-[#005E6A] text-white border-[#005E6A] shadow-sm' 
                          : 'bg-white text-slate-500 dark:text-slate-300 dark:text-slate-200 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Transactions List */}
            <div className="space-y-3 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout" custom={swipeDirection}>
                <motion.div
                  key={selectedMonth}
                  custom={swipeDirection}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 120 : -120,
                      opacity: 0
                    }),
                    center: {
                      x: 0,
                      opacity: 1
                    },
                    exit: (dir: number) => ({
                      x: dir < 0 ? 120 : -120,
                      opacity: 0
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(e, info) => {
                    const swipeThreshold = 55;
                    const currentIndex = allMonths.findIndex(m => m.value === selectedMonth);
                    if (info.offset.x < -swipeThreshold) {
                      if (currentIndex < allMonths.length - 1) {
                        const nextMonth = allMonths[currentIndex + 1];
                        handleMonthChange(nextMonth.value);
                      }
                    } else if (info.offset.x > swipeThreshold) {
                      if (currentIndex > 0) {
                        const prevMonth = allMonths[currentIndex - 1];
                        handleMonthChange(prevMonth.value);
                      }
                    }
                  }}
                  className="space-y-3 touch-pan-y active:cursor-grabbing"
                >
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedSavingTx(t)}
                        className="bg-white rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-green-100 dark:border-green-900/50 hover:shadow-md cursor-pointer active:scale-[0.98] transition-all duration-200 overflow-hidden relative group"
                      >
                        <div className="p-4 flex items-center gap-4">
                          {/* Icon Left */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            t.Tipe === 'SETOR' ? 'bg-green-50 group-hover:bg-green-100' : 'bg-red-50 group-hover:bg-red-100'
                          } transition-colors`}>
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
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-black text-[#005E6A] uppercase tracking-widest leading-none">{t.Tipe}</p>
                                    {t.Berita && t.Berita !== t.Tipe && (
                                      <span className="text-[8px] font-black text-slate-300 dark:text-slate-200 uppercase tracking-widest truncate max-w-[120px]">| {t.Berita}</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 leading-none">{t.Tanggal}</p>
                                </div>
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
                        <div className="absolute bottom-0 right-0 bg-[#F15A24] group-hover:bg-[#d64a1a] transition-colors w-40 py-0.5 rounded-tl-2xl rounded-br-2xl shadow-sm flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[5px] font-black text-white/50 uppercase tracking-widest">Saldo Akhir</span>
                            <span className="text-[9px] font-black text-white">Rp {formatCurrency(t.SaldoAkhir)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <History className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada mutasi</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </ProtectedPage>

      {/* Detail Saving Transaction Modal Overlay */}
      <AnimatePresence>
        {selectedSavingTx && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedSavingTx.Tipe === 'SETOR' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {selectedSavingTx.Tipe === 'SETOR' ? 'Rincian Setor Tabungan' : 'Rincian Tarik Tabungan'}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedSavingTx(null)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:text-slate-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transaction ID & Date */}
              <div className="flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  ID: {selectedSavingTx.id_tabungan || selectedSavingTx.id || '-'}
                </span>
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-300 text-[10px] font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedSavingTx.Tanggal}</span>
                </div>
              </div>

              {/* Details Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Saldo Awal</p>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Rp {formatCurrency(
                        selectedSavingTx.Tipe === 'SETOR' 
                          ? Math.max(0, selectedSavingTx.SaldoAkhir - selectedSavingTx.Nominal)
                          : selectedSavingTx.SaldoAkhir + selectedSavingTx.Nominal
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${
                    selectedSavingTx.Tipe === 'SETOR' 
                      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30' 
                      : 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
                  }`}>
                    <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${
                      selectedSavingTx.Tipe === 'SETOR' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedSavingTx.Tipe === 'SETOR' ? 'Nominal Setor' : 'Nominal Tarik'}
                    </p>
                    <p className={`text-xs font-black ${
                      selectedSavingTx.Tipe === 'SETOR' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedSavingTx.Tipe === 'SETOR' ? '+' : '-'}Rp {formatCurrency(selectedSavingTx.Nominal)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] flex justify-between items-center shadow-lg">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Saldo Akhir</span>
                  <span className="text-sm font-black text-emerald-400">Rp {formatCurrency(selectedSavingTx.SaldoAkhir)}</span>
                </div>

                {selectedSavingTx.Tipe === 'SETOR' && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:bg-slate-800/60 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider mb-1">
                      Tabungan Bertambah! ðŸŒŸ
                    </p>
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                      {getMotivationMessage(selectedSavingTx.Nominal)}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedSavingTx(null)}
                  className="w-full mt-2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet E-Statement */}
      <AnimatePresence>
        {showEStatementDrawer && (
          <div className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div 
              className="fixed inset-0"
              onClick={() => setShowEStatementDrawer(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-t-[2.5rem] w-full max-w-lg mx-auto shadow-2xl border-t border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Drag handle */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header Drawer */}
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center text-[#F15A24]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <span>E-Statement</span>
                      <span className="text-[10px] font-black bg-orange-100 text-[#F15A24] px-2 py-0.5 rounded-md uppercase tracking-widest">Tabungan</span>
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {displayUser?.Nama || "Nasabah"} â€¢ Dari Awal Menabung
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEStatementDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List Periode Bulan Sederhana: Kiri Bulan & Tahun, Kanan Tombol PDF */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 no-scrollbar">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[11px] font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-wider">
                    DAFTAR E-STATEMENT BULANAN
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">
                    {allMonths.length} Periode
                  </span>
                </div>

                {isLoadingMonths && !serverMonthsSummary ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#005E6A]" />
                    <p className="text-xs font-bold uppercase tracking-wider">Memuat periode tabungan...</p>
                  </div>
                ) : allMonths.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Belum ada riwayat periode tabungan.</p>
                  </div>
                ) : (
                  [...allMonths].reverse().map((m) => {
                    return (
                      <div
                        key={m.value}
                        onClick={() => {
                          handleMonthChange(m.value);
                        }}
                        className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-800/90 border-slate-100 dark:border-slate-800 hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-200 cursor-pointer"
                      >
                        {/* Sebelah Kiri: Bulan dan Tahun (Tanpa Tulisan Periode Terpilih) */}
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 dark:bg-teal-950/40 text-[#005E6A] dark:text-teal-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                              {m.fullLabel}
                            </h4>
                          </div>
                        </div>

                        {/* Sebelah Kanan: Tombol Excel & PDF Dipisah Garis Pembatas Halus */}
                        <div className="shrink-0 flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-600/80 shadow-2xs">
                          {/* Tombol Excel */}
                          <button
                            type="button"
                            disabled={generatingExcelMonth === m.value}
                            title={`Download e-Statement Excel ${m.fullLabel}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateMonthExcel(m.value, m.fullLabel);
                            }}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                          >
                            {generatingExcelMonth === m.value ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            )}
                            <span>{generatingExcelMonth === m.value ? "MEMUAT..." : "EXCEL"}</span>
                          </button>

                          {/* Garis Pembatas Halus */}
                          <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                          {/* Tombol PDF */}
                          <button
                            type="button"
                            disabled={generatingPdfMonth === m.value}
                            title={`Download e-Statement PDF ${m.fullLabel}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateMonthPdf(m.value, m.fullLabel);
                            }}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                          >
                            {generatingPdfMonth === m.value ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>{generatingPdfMonth === m.value ? "MEMUAT..." : "PDF"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Drawer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEStatementDrawer(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const DebtDetailPage = ({ 
  user, 
  transactions, 
  customers, 
  fetchData, 
  dataSource,
  salesTransactions
}: { 
  user: Customer | null, 
  transactions: DebtTransaction[], 
  customers?: Customer[],
  fetchData?: (showLoading?: boolean, collectionName?: string | string[], extraOptions?: any) => Promise<void> | void,
  dataSource?: string,
  salesTransactions?: SalesTransaction[]
}) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [activeTab, setActiveTab] = useState<'riwayat' | 'statistik'>('riwayat');
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<DebtTransaction | null>(null);
  const isAdmin = localStorage.getItem("admin_session") === "true";
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const showHutangId = searchParams.get("showHutangId");
    if (showHutangId) {
      const found = transactions.find(t => t.id === showHutangId || t.id_hutang === showHutangId);
      if (found) {
        navigate(`/detail-hutang/${encodeURIComponent(showHutangId)}`);
      }
    }
  }, [searchParams, transactions, navigate]);

  const paramVal = customerName ? decodeURIComponent(customerName).toLowerCase().trim() : "";
  const displayUser = paramVal && customers 
    ? customers.find(c => 
        (c.id_pelanggan && c.id_pelanggan.toLowerCase().trim() === paramVal) ||
        (c.id && String(c.id).toLowerCase().trim() === paramVal) ||
        c.Nama.toLowerCase().trim() === paramVal
      ) || (paramVal ? { Nama: decodeURIComponent(customerName || ''), id_pelanggan: paramVal, Hutang: 0 } as Customer : user)
    : user;

  useEffect(() => {
    if (fetchData && displayUser?.Nama) {
      fetchData(false, 'debtTransactions', { userFilterKey: displayUser.Nama, allHistory: true });
    }
  }, [displayUser?.Nama]);

  const userTransactions = useMemo(() => {
    if (!displayUser) return [];
    return transactions
      .filter(t => isCustomerDebtMatch(t, displayUser))
      .sort((a, b) => {
        const timeA = parseDate(a.Tanggal).getTime();
        const timeB = parseDate(b.Tanggal).getTime();
        if (timeA !== timeB) return timeB - timeA;
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return String(b.id_hutang || b.id || '').localeCompare(String(a.id_hutang || a.id || ''));
      });
  }, [transactions, displayUser]);

  // Matching Sales Transaction for a TAMBAH Debt Transaction
  const matchingSalesTx = useMemo(() => {
    if (!selectedTx || !salesTransactions || selectedTx.Tipe !== 'TAMBAH') return null;
    return salesTransactions.find(st => {
      const sameName = st.Nama.toLowerCase() === selectedTx.Nama.toLowerCase();
      const date1 = st.Tanggal.replace(/[^0-9]/g, '');
      const date2 = selectedTx.Tanggal.replace(/[^0-9]/g, '');
      const sameDate = date1 === date2 || date1.includes(date2) || date2.includes(date1);
      const sameAmount = Math.abs(st.Pemasukan - selectedTx.Jumlah) < 10 || Math.abs(st.Sebagian - selectedTx.Jumlah) < 10;
      return sameName && (sameDate || sameAmount);
    });
  }, [selectedTx, salesTransactions]);

  const getIsCashOut = (jenis: string) => {
    const upperJenis = jenis.trim().toUpperCase();
    const cashOutServices = ["TARIK TUNAI", "PKH", "BPNT"];
    return cashOutServices.some(service => 
      upperJenis === service || upperJenis.startsWith(service) || upperJenis.includes(service)
    );
  };

  const getIsEdcBni = (melalui?: string) => {
    return melalui?.trim().toUpperCase() === "EDC BNI";
  };

  const parseItems = (jenis: string, total: number, hargaModal?: number, melalui?: string) => {
    const upperJenis = jenis.trim().toUpperCase();
    const isEdcBni = getIsEdcBni(melalui);

    if (isEdcBni && hargaModal !== undefined && hargaModal > 0) {
      const modal = hargaModal;
      const adminFee = total - (modal + 1500);
      const items = [
        { qty: 1, name: jenis, price: total },
        { qty: 1, name: "BIAYA EDC", price: 3000 }
      ];
      if (adminFee > 0) {
        items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
      }
      return items;
    }

    const specialServices = ["QRIS", "TRANSFER", "TOPUP DANA", "TOPUP OVO", "TOPUP GOPAY", "TOPUP SHOPEEPAY"];
    const isSpecial = specialServices.some(service => 
      upperJenis === service || upperJenis.startsWith(service) || upperJenis.includes(service)
    );

    if (isSpecial && hargaModal !== undefined && hargaModal > 0) {
      const modal = hargaModal;
      const adminFee = total - modal;
      const items = [
        { qty: 1, name: jenis, price: modal }
      ];
      if (adminFee > 0) {
        items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
      }
      return items;
    }

    const isCashOut = getIsCashOut(jenis);
    if (isCashOut && hargaModal !== undefined && hargaModal > 0) {
      const modal = hargaModal;
      const adminFee = total - modal;
      const items = [
        { qty: 1, name: jenis, price: total }
      ];
      if (adminFee > 0) {
        items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
      }
      return items;
    }

    const items: { qty: number; name: string; price?: number }[] = [];
    const parts = jenis.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (!part) return;
      const match = part.match(/^(\d+)\s*x\s*(.+)$/i) || part.match(/^(.+?)\s*x\s*(\d+)$/i);
      if (match) {
        const isQtyFirst = !isNaN(Number(match[1]));
        const qty = isQtyFirst ? Number(match[1]) : Number(match[2]);
        const name = isQtyFirst ? match[2].trim() : match[1].trim();
        items.push({ qty, name });
      } else {
        items.push({ qty: 1, name: part });
      }
    });

    return items;
  };

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

  const handlePeriodSelect = (val: string) => {
    setSelectedPeriodIndex(val);
    if (fetchData && displayUser?.Nama) {
      if (val === 'all') {
        fetchData(false, 'debtTransactions', { userFilterKey: displayUser.Nama, allHistory: true });
      } else {
        const idx = parseInt(val, 10);
        if (!isNaN(idx) && debtPeriods[idx]) {
          const p = debtPeriods[idx];
          if (p.status === 'Lunas') {
            fetchData(false, 'debtTransactions', { userFilterKey: displayUser.Nama, allHistory: true });
          }
        }
      }
    }
  };

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
              className="bg-gradient-to-br from-[#e74c3c] to-[#c0392b] rounded-[2.5rem] text-white shadow-2xl mb-8 relative overflow-hidden transition-all duration-500 hover:shadow-red-500/20 border-t border-white/20"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl opacity-30" />
              
              <div className="relative z-10 p-8">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight drop-shadow-sm truncate max-w-[200px]">{displayUser?.Nama || "Pelanggan Umum"}</h3>
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
                      {formatCurrency(displayUser?.Hutang || 0)}
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
              className="bg-white rounded-[2.5rem] p-6 shadow-xl mb-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Tren Hutang</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-none">Historis Kasbon Per Periode</p>
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
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Total Kasbon</span>
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
                  onChange={(e) => handlePeriodSelect(e.target.value)}
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
                filteredTransactions.map((t, i) => {
                  const ket = (t.Keterangan || (t as any).keterangan || "").toLowerCase();
                  const isKasbon = ket.includes("bayar belanja") || ket.includes("metode hutang") || ket.includes("kasbon belanja") || ket.includes("belanja") || t.Tipe === 'TAMBAH' || (t as any).tipe === 'KASBON';
                  
                  return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/detail-hutang/${encodeURIComponent(t.id || t.id_hutang || '')}`)}
                    className="bg-white rounded-2xl p-4 border border-slate-100 dark:border-slate-800 hover:border-red-100 hover:shadow-md cursor-pointer active:scale-[0.98] transition-all duration-200 flex items-center justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isKasbon ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'
                      } transition-colors`}>
                        {isKasbon ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {isKasbon ? 'KASBON' : 'BAYAR'}
                          </p>
                          {t.Keterangan && t.Keterangan !== "-" && (
                             <span className="bg-slate-100 text-slate-500 dark:text-slate-300 dark:text-slate-200 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 italic">
                               {t.Keterangan}
                             </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-tight">{t.Tanggal}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${
                        isKasbon ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isKasbon ? '+' : '-'}{formatCurrency(t.Jumlah)}
                      </p>
                    </div>

                    {/* Final Balance Micro-Ribbon Refined */}
                    <div className="absolute bottom-0 right-0 bg-orange-500 px-3 py-1 rounded-tl-2xl rounded-br-2xl border-t border-l border-orange-400/30 flex items-center justify-center min-w-[95px]">
                       <span className="text-[6px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">Sisa Rp {formatCurrency(t.SaldoAkhir)}</span>
                    </div>
                  </motion.div>
                );
              })
              ) : (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed">
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
                    className="bg-white rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
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
                          <ChevronDown className={`w-4 h-4 text-slate-300 dark:text-slate-200 transition-transform ${expandedPeriod === i ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Total Kasbon</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Rp {formatCurrency(period.totalBorrowed)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Lama Kasbon</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{period.durationDays} Hari</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
                           <p className="text-[7px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                             {period.startDate} â€” {period.endDate}
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
                          className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800/50 space-y-2 bg-slate-50/30"
                        >
                           <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-[0.2em] mb-3">Detail Mutasi Periode Ini</p>
                           {period.transactions.map((mt, j) => {
                             const mtKet = (mt.Keterangan || (mt as any).keterangan || "").toLowerCase();
                             const mtIsKasbon = mtKet.includes("bayar belanja") || mtKet.includes("metode hutang") || mtKet.includes("kasbon belanja") || mtKet.includes("belanja") || mt.Tipe === 'TAMBAH' || (mt as any).tipe === 'KASBON';
                             return (
                               <div 
                                 key={j} 
                                 onClick={() => navigate(`/detail-hutang/${encodeURIComponent(mt.id || mt.id_hutang || '')}`)}
                                 className="flex items-center justify-between py-2 border-b border-white last:border-0 cursor-pointer hover:bg-white/40 p-1.5 -mx-1.5 rounded-xl transition-all"
                               >
                                 <div className="space-y-0.5">
                                   <p className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase">{mtIsKasbon ? 'KASBON' : 'BAYAR'}</p>
                                   <p className="text-[7px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">{mt.Tanggal}</p>
                                 </div>
                                 <p className={`text-[10px] font-black ${mtIsKasbon ? 'text-red-600' : 'text-green-600'}`}>
                                   {mtIsKasbon ? '+' : '-'}{formatCurrency(mt.Jumlah)}
                                 </p>
                               </div>
                             );
                           })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 dark:border-slate-800 px-8 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'riwayat' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-200'
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
            activeTab === 'statistik' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'statistik' ? 'bg-red-50' : 'bg-transparent'}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Statistik</span>
        </button>
      </div>
    )}

    {/* Detail Transaction Modal Overlay */}
    {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col overflow-visible"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedTx.Tipe === 'TAMBAH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {selectedTx.Tipe === 'TAMBAH' ? <PlusCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {selectedTx.Tipe === 'TAMBAH' ? 'Rincian Kasbon' : 'Rincian Pembayaran'}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:text-slate-300 dark:text-slate-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Date Tag */}
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-300 dark:text-slate-200 text-[9px] font-black uppercase tracking-widest mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedTx.Tanggal}</span>
              </div>

              {/* Details Content */}
              <div className="space-y-4 relative">
                {selectedTx.Tipe === 'TAMBAH' ? (
                  /* KASBON CASE */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mb-0.5">Hutang Awal</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">Rp {formatCurrency(selectedTx.SaldoAkhir - selectedTx.Jumlah)}</p>
                      </div>
                      <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100/30">
                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5">Tambah</p>
                        <p className="text-xs font-black text-red-600">+Rp {formatCurrency(selectedTx.Jumlah)}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] flex justify-between items-center shadow-md">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-300 dark:text-slate-200">Total Hutang</span>
                      <span className="text-sm font-black text-orange-400">Rp {formatCurrency(selectedTx.SaldoAkhir)}</span>
                    </div>

                    {/* Transaction details */}
                    {matchingSalesTx ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                          <Receipt className="w-3.5 h-3.5 text-[#005E6A]" />
                          <span>Detail Item Belanja</span>
                        </div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                          {parseItems(matchingSalesTx.Jenis, matchingSalesTx.Pemasukan, matchingSalesTx.HargaModal, matchingSalesTx.Melalui).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-baseline gap-2 text-[10px]">
                              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase truncate max-w-[170px]">{item.name}</span>
                              <div className="flex gap-2 shrink-0">
                                {item.qty > 1 && item.price && (
                                  <span className="text-slate-400 dark:text-slate-300 dark:text-slate-200 font-medium">({item.qty}x Rp {formatCurrency(item.price)})</span>
                                )}
                                <span className="text-slate-900 dark:text-white font-black">
                                  Rp {formatCurrency(item.qty * (item.price || matchingSalesTx.Pemasukan / item.qty))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between text-[9px]">
                          <span className="font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider">ID Transaksi</span>
                          <span className="font-black text-[#005E6A] uppercase tracking-wider">
                            {matchingSalesTx.id_transaksi || `TRX-${matchingSalesTx.Tanggal.replace(/[^0-9]/g, '').slice(0, 10)}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Fallback Details */
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                          <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                          <span>Keterangan Tambah</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase leading-relaxed pt-1">
                          {selectedTx.Keterangan && selectedTx.Keterangan !== "-" ? selectedTx.Keterangan : "Penambahan Kasbon Manual"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* BAYAR CASE */
                  <div className="space-y-3 relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mb-0.5">Hutang Awal</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">Rp {formatCurrency(selectedTx.SaldoAkhir + selectedTx.Jumlah)}</p>
                      </div>
                      <div className="p-3 bg-green-50/50 rounded-2xl border border-green-100 dark:border-green-900/50/30">
                        <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-0.5">Bayar</p>
                        <p className="text-xs font-black text-green-600">-Rp {formatCurrency(selectedTx.Jumlah)}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] flex justify-between items-center shadow-md">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-300 dark:text-slate-200">Sisa Hutang</span>
                      <span className="text-sm font-black text-emerald-400">Rp {formatCurrency(selectedTx.SaldoAkhir)}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                        <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                        <span>Keterangan Bayar</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase leading-relaxed pt-1">
                        {selectedTx.Keterangan && selectedTx.Keterangan !== "-" ? selectedTx.Keterangan : "Pelunasan Hutang Tunai"}
                      </p>
                    </div>

                    {/* LUNAS ANIMATED STAMP */}
                    {selectedTx.SaldoAkhir === 0 && (
                      <motion.div 
                        initial={{ scale: 4, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 0.9, rotate: -15 }}
                        transition={{ 
                          type: "spring", 
                          damping: 11, 
                          stiffness: 140, 
                          delay: 0.25 
                        }}
                        className="absolute right-0 top-16 border-4 border-double border-red-500 text-red-500 font-extrabold text-lg px-5 py-1.5 rounded-xl tracking-[0.2em] uppercase select-none pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-white/65 backdrop-blur-[1px] rotate-[-15deg]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        LUNAS
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <button 
                onClick={() => setSelectedTx(null)}
                className="mt-6 w-full py-3 bg-[#005E6A] hover:bg-[#004D57] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-[0.98]"
              >
                Tutup Rincian
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

const INVESTMENT_OFFERS = [
  {
    tenor: "3 Bulan",
    rate: "10% p.a.",
    periodRate: "2.50%",
    min: "Rp 100.000",
    desc: "Investasi berjangka pendek dengan likuiditas tinggi untuk mengamankan kas jangka pendek Anda.",
    bgGrad: "from-blue-500 to-indigo-600"
  },
  {
    tenor: "6 Bulan",
    rate: "10% p.a.",
    periodRate: "5.00%",
    min: "Rp 100.000",
    desc: "Pilihan terbaik dan terpopuler dengan bagi hasil optimal untuk rencana keuangan jangka menengah.",
    bgGrad: "from-purple-500 to-indigo-600"
  },
  {
    tenor: "9 Bulan",
    rate: "10% p.a.",
    periodRate: "7.50%",
    min: "Rp 100.000",
    desc: "Perpaduan jangka waktu strategis dan tingkat keuntungan tinggi untuk akumulasi modal optimal.",
    bgGrad: "from-amber-500 to-orange-600"
  },
  {
    tenor: "12 Bulan",
    rate: "10% p.a.",
    periodRate: "10.00%",
    min: "Rp 100.000",
    desc: "Maksimalkan pertumbuhan aset Anda dalam jangka panjang dengan imbal hasil tertinggi yang dijamin optimal.",
    bgGrad: "from-emerald-500 to-teal-600"
  }
];

const InvestasiPage = ({ user, transactions, customers }: { user: Customer | null, transactions: InvestmentTransaction[], customers?: Customer[] }) => {
  const navigate = useNavigate();
  const { customerName } = useParams();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showOffers, setShowOffers] = useState(true);
  const [calcAmount, setCalcAmount] = useState<string>("");
  const [selectedOffer, setSelectedOffer] = useState<{
    tenor: string;
    rate: string;
    periodRate: string;
    min: string;
    desc: string;
    bgGrad: string;
  } | null>(null);

  useEffect(() => {
    if (selectedOffer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedOffer]);

  const OFFERS = INVESTMENT_OFFERS;
  
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

  const chronologicalTransactions = [...userTransactions].sort((a, b) => {
    const dateA = parseDateForProgress(a.Tanggal).getTime();
    const dateB = parseDateForProgress(b.Tanggal).getTime();
    return dateA - dateB;
  });

  const activeTransactions = sortedTransactions.filter(t => {
    const s = t.Status.toLowerCase();
    return s.includes("aktif") || s.includes("active");
  });

  const completedTransactions = sortedTransactions.filter(t => {
    const s = t.Status.toLowerCase();
    return !(s.includes("aktif") || s.includes("active"));
  });

  const activeCount = activeTransactions.length;
  const completedCount = completedTransactions.length;

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const showInvestasiId = searchParams.get("showInvestasiId");
    if (showInvestasiId) {
      const idx = sortedTransactions.findIndex(t => t.id === showInvestasiId || t.id_investasi === showInvestasiId);
      if (idx !== -1) {
        setExpandedIndex(idx);
        setShowOffers(false);
        setTimeout(() => {
          const element = document.getElementById(`invest-card-${showInvestasiId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [searchParams, sortedTransactions]);

  const renderTransactionCard = (t: InvestmentTransaction, i: number) => {
    const estimate = calculateEstimatedReturn(t.Nominal, t.Nisbah, t.Tanggal, t.JatuhTempo);
    const progress = calculateProgress(t.Tanggal, t.JatuhTempo);
    const invYear = parseDateForProgress(t.Tanggal).getFullYear();
    const invMonth = parseDateForProgress(t.Tanggal).getMonth() + 1;
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    
    const chronoIndex = chronologicalTransactions.indexOf(t);
    const seqNumber = chronoIndex !== -1 ? chronoIndex + 1 : i + 1;
    const refId = `INV-${String(seqNumber).padStart(3, '0')}/WT/${romanMonths[invMonth - 1]}/${invYear}`;
    const isExpanded = expandedIndex === i;
    const statusLower = t.Status.toLowerCase();
    const isA_Aktif = statusLower.includes("aktif") || statusLower.includes("active");

    return (
      <div key={i} id={`invest-card-${t.id || t.id_investasi}`} className="px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => setExpandedIndex(isExpanded ? null : i)}
          className="bg-white rounded-[2.5rem] text-slate-900 dark:text-white shadow-xl relative overflow-hidden cursor-pointer transition-all border border-slate-100 dark:border-slate-800"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full -ml-16 -mb-16 blur-2xl opacity-50" />

          {/* Cap Stempel Selesai */}
          {!isA_Aktif && (
            <div className="absolute right-12 top-10 pointer-events-none z-20 select-none">
              <motion.div
                initial={{ opacity: 0, scale: 3.5, rotate: -45 }}
                animate={{ opacity: 0.85, scale: 1, rotate: -15 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 140, 
                  damping: 11,
                  delay: i * 0.15 + 0.5 
                }}
                className="border-4 border-red-500/40 text-red-500/50 font-extrabold text-[10px] tracking-widest rounded-xl px-4 py-1.5 uppercase border-double border-[6px] bg-red-50/[0.02] flex flex-col items-center"
              >
                <span className="text-[7px] font-bold tracking-normal opacity-70 mb-0.5">KONTRAK</span>
                <span className="text-sm font-black tracking-widest text-red-500/60">SELESAI</span>
                <span className="text-[6px] font-bold tracking-normal opacity-60 mt-0.5">SUKSES CAIR</span>
              </motion.div>
            </div>
          )}

          <div className="p-7 space-y-8 relative z-10">
            {/* Top Summary Row */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[8px] sm:text-[10px] font-black tracking-[0.1em] text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase truncate flex-1">{refId}</span>
              {isA_Aktif && (
                <div className="flex items-center gap-2">
                  {/* Growing Money Animation */}
                  <div className="relative w-7 h-7 flex items-center justify-center overflow-visible">
                    {[...Array(3)].map((_, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ y: 6, opacity: 0, scale: 0.2 }}
                        animate={{ 
                          y: [-10, -22], 
                          opacity: [0, 1, 1, 0], 
                          scale: [0.3, 1.1, 1.3, 0.7],
                          x: [0, idx % 2 === 0 ? 6 : -6, idx % 2 === 0 ? 10 : -10] 
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          delay: idx * 0.7,
                          ease: "easeInOut"
                        }}
                        className="absolute text-[10px] font-black text-emerald-500 select-none pointer-events-none"
                      >
                        {idx % 3 === 0 ? "Rp" : idx % 3 === 1 ? "ðŸ“ˆ" : "ðŸ’°"}
                      </motion.span>
                    ))}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="text-emerald-500 bg-emerald-50 p-1 rounded-full border border-emerald-100 dark:border-emerald-900/50/30 flex items-center justify-center"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </motion.div>
                  </div>

                  <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[8px] sm:text-[9px] font-black py-1 px-3 rounded-full hover:bg-green-500/20 transition-colors uppercase tracking-widest whitespace-nowrap">
                    {t.Status.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Estimate Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">
                  {isA_Aktif ? "Estimasi Pengembalian Total" : "Sudah Dicairkan Ke Tabungan"}
                </p>
                <h4 className="text-4xl font-black tracking-tight tabular-nums text-[#6D28D9] font-black">Rp {formatCurrency(estimate.total)}</h4>
                
                {isA_Aktif && (
                  <div className="space-y-3 pt-2">
                    {t.Keterangan && (
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-none">{t.Keterangan}</p>
                    )}
                    
                    {/* Progress Bar moved here */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[8px] font-black uppercase tracking-widest text-[#6D28D9]">Progress <span className="text-slate-400 dark:text-slate-300 dark:text-slate-200 ml-1">({progress}% Berjalan)</span></h5>
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
                           <span className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Akad</span>
                           <span className="text-[8px] font-black text-slate-900 dark:text-white">{t.Tanggal}</span>
                         </div>
                         <div className="flex flex-col text-right">
                           <span className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest">Tempo</span>
                           <span className="text-[8px] font-black text-slate-900 dark:text-white">{t.JatuhTempo}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 dark:border-slate-800 rounded-full">
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200">
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
                    {/* Sharpened Detail Cards (Slightly off-white for depth) */}
                    <div className="space-y-3 pt-2">
                      <div className="bg-slate-50 rounded-xl p-5 shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex-1 space-y-3">
                          <h6 className="text-[11px] font-black text-[#6D28D9] uppercase tracking-widest">Pokok & Keuntungan</h6>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Nilai Pokok</span>
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 tracking-tight text-lg">Rp {formatCurrency(t.Nominal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Bagi Hasil ({estimate.rateYearly}% pertahun)</span>
                              <span className="text-[10px] font-black text-green-600">Rp {formatCurrency(estimate.profit)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex-1 space-y-3">
                          <h6 className="text-[11px] font-black text-[#6D28D9] uppercase tracking-widest">Waktu Kontrak</h6>
                          <div className="grid grid-cols-1 gap-2 text-slate-600 dark:text-slate-300 dark:text-slate-200">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Jangka Waktu</span>
                              <span className="text-[10px] font-black tracking-tight">{t.Tenor}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Masa Berakhir</span>
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
                         <div className="px-5 py-4 bg-slate-100/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <p className="text-[10px] font-medium italic text-slate-500 dark:text-slate-300 dark:text-slate-200 leading-relaxed text-center">{t.Keterangan}</p>
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
  };

  const totalInvestasi = userTransactions
    .filter(t => t.Status.toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => {
      const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
      return acc + estimate.total;
    }, 0);

  return (
    <ProtectedPage user={displayUser} title="Investasi">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 py-4 bg-slate-50 min-h-screen"
      >
        <div className="bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden border-t border-white/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl opacity-30" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">{displayUser?.Nama || "Pelanggan Umum"}</h3>
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

        {/* Card Penawaran Investasi yang Bisa Dibuka Tutup */}
        <div className="bg-gradient-to-br from-purple-300/90 via-purple-100/70 to-white/95 rounded-2xl border border-purple-300/50 shadow-xl overflow-hidden mb-8 relative z-30">
          <div 
            onClick={() => setShowOffers(!showOffers)}
            className="p-7 flex items-center justify-between cursor-pointer hover:bg-purple-100/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100/60 rounded-xl flex items-center justify-center text-[#6D28D9] border border-purple-200/50">
                <Gift className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Penawaran Investasi Spesial</h3>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mt-0.5">Pilihan Tenor & Imbal Hasil Menarik</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showOffers ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 dark:border-slate-800"
            >
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300 dark:text-slate-200" />
            </motion.div>
          </div>

          <AnimatePresence initial={false}>
            {showOffers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-7 pt-5">
                  {/* Horizontal Scrollable Row containing introduction and offer cards */}
                  <div className="flex overflow-x-auto gap-3.5 pb-4 snap-x -mx-7 px-7 scrollbar-hide items-stretch">
                    {/* Left side introduction text - placed inline inside scrollable container, no card wrapper */}
                    <div className="flex-shrink-0 w-44 flex flex-col justify-start items-start text-left space-y-3 snap-start py-4 pl-7">
                      <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-[0.15em] bg-white border border-purple-100 dark:border-purple-900/50 px-3 py-1 rounded-md shadow-sm">
                        PILIHAN TERBAIK
                      </span>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight uppercase tracking-tight">
                          Kembangkan Dana Anda
                        </h4>
                        <div className="h-0.5 w-10 bg-[#6D28D9] rounded-full" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 leading-relaxed uppercase tracking-wider">
                        Investasikan dana dengan imbal hasil optimal 10% setiap tahunnya.
                      </p>

                      {/* Animated Illustration */}
                      <div className="relative w-full h-16 mt-2 flex items-center justify-center bg-purple-50/50 rounded-xl border border-purple-100 dark:border-purple-900/50/40 overflow-hidden">
                        {/* Glowing/pulsing ambient light */}
                        <motion.div
                          animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-purple-200 to-indigo-200 blur-md rounded-full"
                        />
                        
                        <div className="relative z-10 flex items-center gap-2">
                          {/* Left coin bouncing */}
                          <motion.div
                            animate={{
                              y: [0, -6, 0],
                              rotate: [0, 10, 0],
                            }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-md text-amber-900 font-extrabold text-xs"
                          >
                            %
                          </motion.div>

                          {/* Middle growing bar chart lines */}
                          <div className="flex items-end gap-1 h-8">
                            <motion.div
                              animate={{ height: ["8px", "16px", "8px"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                              className="w-1.5 bg-purple-500 rounded-t-sm"
                            />
                            <motion.div
                              animate={{ height: ["12px", "24px", "12px"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                              className="w-1.5 bg-[#F15A24] rounded-t-sm"
                            />
                            <motion.div
                              animate={{ height: ["16px", "30px", "16px"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                              className="w-1.5 bg-emerald-500 rounded-t-sm"
                            />
                          </div>

                          {/* Right money coin bouncing */}
                          <motion.div
                            animate={{
                              y: [0, -8, 0],
                              rotateY: [0, 180, 360],
                            }}
                            transition={{
                              duration: 2.8,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.4
                            }}
                            className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-md text-yellow-900 font-extrabold text-xs"
                          >
                            $
                          </motion.div>
                        </div>

                        {/* Sparkles */}
                        <motion.div
                          animate={{
                            scale: [0.5, 1, 0.5],
                            opacity: [0.2, 0.8, 0.2]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.2
                          }}
                          className="absolute top-2 right-3 text-yellow-500"
                        >
                          âœ¦
                        </motion.div>
                        <motion.div
                          animate={{
                            scale: [0.3, 0.8, 0.3],
                            opacity: [0.1, 0.7, 0.1]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: 0.8
                          }}
                          className="absolute bottom-1 left-3 text-purple-400"
                        >
                          âœ¦
                        </motion.div>
                      </div>
                    </div>

                    {OFFERS.map((offer, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => {
                          setSelectedOffer(offer);
                          setCalcAmount("");
                        }}
                        className="flex-shrink-0 w-44 bg-gradient-to-b from-[#6D28D9] via-[#7C3AED]/95 to-white border border-purple-200/20 rounded-xl p-4 relative overflow-hidden cursor-pointer shadow-md hover:shadow-lg hover:border-purple-300 transition-all snap-start flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="text-left">
                            <h4 className="text-base font-black text-white leading-none">{offer.tenor}</h4>
                            <p className="text-[8px] font-bold text-purple-200 uppercase tracking-widest mt-1">Tenor Investasi</p>
                          </div>

                          <div className="py-2 border-y border-dashed border-white/20 text-left">
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-xl font-black text-yellow-300 tracking-tight">{offer.periodRate}</span>
                              <span className="text-[8px] font-black text-purple-100 uppercase tracking-wider">{offer.rate}</span>
                            </div>
                            <p className="text-[8px] font-bold text-purple-200 uppercase tracking-widest mt-0.5">Keuntungan Periode</p>
                          </div>
                        </div>

                        {/* Purple Select Button */}
                        <div className="mt-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOffer(offer);
                              setCalcAmount("");
                            }}
                            className="w-full py-2.5 bg-[#6D28D9] hover:bg-[#5b21b6] text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-purple-100/50 flex items-center justify-center"
                          >
                            <span>PILIH</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-10 pb-12">
          {sortedTransactions.length > 0 ? (
            <>
              {activeTransactions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6D28D9]">Investasi Berjalan</span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>
                  <div className="space-y-6">
                    {activeTransactions.map((t) => {
                      const globalIndex = sortedTransactions.indexOf(t);
                      return renderTransactionCard(t, globalIndex);
                    })}
                  </div>
                </div>
              )}

              {completedTransactions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 dark:text-slate-200">Riwayat Investasi Selesai</span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>
                  <div className="space-y-6">
                    {completedTransactions.map((t) => {
                      const globalIndex = sortedTransactions.indexOf(t);
                      return renderTransactionCard(t, globalIndex);
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 dark:border-slate-800 border-dashed shadow-inner bg-slate-50/20">
              <div className="flex flex-col items-center gap-4 opacity-30">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Portofolio Kosong</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Belum ada kontrak investasi aktif untuk saat ini</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected Offer Detail Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedOffer && (() => {
            const parsedAmount = parseCurrency(calcAmount);
            const tenorMonths = parseInt(selectedOffer.tenor) || 3;
            const interestRate = 0.10; // 10%
            const calculatedProfit = Math.round(parsedAmount * interestRate * (tenorMonths / 12));
            const totalPayout = parsedAmount + calculatedProfit;

            return (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedOffer(null)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
 
                 {/* Modal content - Centered Style */}
                 <motion.div
                   initial={{ scale: 0.9, opacity: 0, y: 20 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   exit={{ scale: 0.9, opacity: 0, y: 20 }}
                   transition={{ type: "spring", damping: 25, stiffness: 250 }}
                   className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-50 border-t-4 border-purple-500"
                 >
                   {/* Header Banner - Elegant Purple Theme */}
                   <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 p-8 text-white relative text-left shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
                     <button 
                       onClick={() => setSelectedOffer(null)}
                       className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                     <h4 className="text-2xl font-black tracking-tight">Tenor {selectedOffer.tenor}</h4>
                     <p className="text-xs text-purple-200 font-bold uppercase tracking-widest mt-1">Investasi Hasil Optimal</p>
                   </div>
 
                   <div className="p-8 space-y-6 overflow-y-auto flex-1">
                     <p className="text-xs text-slate-500 dark:text-slate-300 dark:text-slate-200 leading-relaxed font-semibold text-left">
                       {selectedOffer.desc}
                     </p>
 
                     {/* Interactive Nominal Input */}
                     <div className="space-y-2 text-left">
                       <label className="text-[9px] font-black text-purple-700 uppercase tracking-widest block">Nominal Investasi</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                           <span className="text-lg font-black text-purple-500">Rp</span>
                         </div>
                         <input
                           type="text"
                           value={calcAmount === "" ? "" : formatCurrency(calcAmount)}
                           onChange={(e) => {
                             const val = e.target.value.replace(/[^\d]/g, '');
                             setCalcAmount(val);
                           }}
                           className="w-full bg-purple-50/40 hover:bg-purple-50/60 focus:bg-white border-2 border-purple-100 dark:border-purple-900/50 focus:border-purple-500 focus:ring-0 rounded-2xl py-4 pl-12 pr-6 text-lg font-black text-purple-950 transition-all text-left shadow-inner"
                           placeholder="0"
                         />
                       </div>
                       <div className="flex justify-between items-center px-1">
                         <span className="text-[8px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider">Mulai Rp 100.000</span>
                         <span className="text-[8px] font-bold text-purple-600 uppercase tracking-wider">Suku Bunga 10% p.a.</span>
                       </div>
                     </div>
 
                     {/* Dynamic Profit Calculation Block (Gambaran Hasil Keuntungan) */}
                     <div className="space-y-4 bg-purple-50/50 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/50/50">
                       <h5 className="text-[9px] font-black text-purple-800 uppercase tracking-widest text-left">Simulasi Hasil Keuntungan:</h5>
                       
                       <div className="space-y-2 text-left">
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider">Modal Awal</span>
                           <span className="text-xs font-black text-slate-700 dark:text-slate-200">Rp {formatCurrency(parsedAmount)}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200 uppercase tracking-wider">Keuntungan ({selectedOffer.periodRate})</span>
                           <span className="text-xs font-black text-emerald-600 font-bold">+ Rp {formatCurrency(calculatedProfit)}</span>
                         </div>
                         
                         <div className="h-px bg-purple-100/60 border-dashed border-t my-2" />
                         
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest">Total Pengembalian</span>
                           <span className="text-sm font-black text-[#6D28D9]">Rp {formatCurrency(totalPayout)}</span>
                         </div>
                       </div>
                     </div>
 
                     <div className="space-y-3 pt-2">
                       <button
                         onClick={() => {
                           if (!calcAmount || parsedAmount < 100000) {
                             alert("Nominal investasi minimal adalah Rp 100.000");
                             return;
                           }
                           
                           const textMessage = `Halo WARUNG TOMI,

Saya ingin mengajukan investasi baru dengan rincian sebagai berikut:

*Rincian Pengajuan Investasi:*
â€¢ *Nama Nasabah:* ${displayUser?.Nama || "-"}
â€¢ *Pilihan Tenor:* ${selectedOffer.tenor}
â€¢ *Nominal Investasi:* Rp ${formatCurrency(parsedAmount)}
â€¢ *Keuntungan Periode:* Rp ${formatCurrency(calculatedProfit)} (${selectedOffer.periodRate})
â€¢ *Estimasi Imbal Hasil:* 10% p.a.
â€¢ *Total Pengembalian:* Rp ${formatCurrency(totalPayout)}

Mohon bantuan dan panduannya untuk memproses pengajuan investasi saya ini. Terima kasih!`;

                           const encodedText = encodeURIComponent(textMessage);
                           const waUrl = `https://wa.me/6287774138090?text=${encodedText}`;
                           setSelectedOffer(null);
                           window.open(waUrl, '_blank');
                         }}
                         className="w-full bg-[#6D28D9] hover:bg-[#5b21b6] text-white py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-purple-200/50 flex items-center justify-center gap-2"
                       >
                         <span>Ajukan Investasi Sekarang</span>
                         <ArrowRight className="w-4 h-4" />
                       </button>
                       
                       <button
                         onClick={() => setSelectedOffer(null)}
                         className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 dark:text-slate-300 dark:text-slate-200 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200/60 dark:border-slate-700/60"
                       >
                         Kembali
                       </button>
                     </div>
                   </div>
                 </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
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
    const statusMatch = s === "BELUM DIAMBIL" || s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
    
    if (isGeneral) {
      const isGeneralName = !tName || tName === "unknown" || tName === "pelanggan umum";
      return isGeneralName && statusMatch;
    }
    
    return tName === displayUser?.Nama?.toLowerCase() && statusMatch;
  });

  const diprosesTransactions = userTransactions.filter(t => {
    const s = (t.Status || "").toUpperCase().trim();
    return s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
  });
  const belumDiambilTransactions = userTransactions.filter(t => (t.Status || "").toUpperCase().trim() === "BELUM DIAMBIL");

  const sortedDiproses = [...diprosesTransactions].sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
  const sortedBelumDiambil = [...belumDiambilTransactions].sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());

  const totalDiproses = diprosesTransactions.reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || parseCurrency(curr.HargaModal) || 0), 0);
  const totalBelumDiambil = belumDiambilTransactions.reduce((acc, curr) => {
    let base = parseCurrency(curr.HargaModal) || 0;
    if ((curr.Melalui || "").toUpperCase().trim() === "EDC BNI") {
      base -= 1500;
    }
    const net = base - (parseCurrency(curr.Sebagian) || 0);
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
        <div className="bg-gradient-to-br from-[#f1c40f] to-[#f39c12] rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden group border-t border-white/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-10 -left-10 opacity-10 rotate-12">
            <Layers className="w-48 h-48" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Pelanggan</p>
              <h3 className="text-xl font-black tracking-tight uppercase">{displayUser?.Nama || "Pelanggan Umum"}</h3>
            </div>
            
            <div className="mt-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Total Lainnya</p>
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
                {(() => {
                  let lastDate = "";
                  return sortedDiproses.map((t, i) => {
                    const isNewDate = t.Tanggal !== lastDate;
                    lastDate = t.Tanggal;
                    return (
                      <React.Fragment key={`diproses-${i}`}>
                        {isNewDate && (
                          <div className="pt-4 pb-1 px-2 first:pt-0">
                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.15em] flex items-center gap-3">
                              <span className="flex-shrink-0 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/50">
                                {formatIndonesianDateWithDay(t.Tanggal)}
                              </span>
                              <div className="h-px bg-slate-200/50 flex-1" />
                            </h4>
                          </div>
                        )}
                        <motion.div
                          key={`diproses-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setExpandedId(expandedId === `diproses-${i}` ? null : `diproses-${i}`)}
                          className="bg-white rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
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
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-none">{getWaktuLabel(t.Tanggal)} â€¢ {t.Tanggal}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Nilai</p>
                                  <p className="text-md font-black text-orange-600 leading-none">Rp {formatCurrency(parseCurrency(t.Pemasukan) || 0)}</p>
                                </div>
                                <div className="opacity-20 group-hover:opacity-40 transition-opacity">
                                  {expandedId === `diproses-${i}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedId === `diproses-${i}` && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex items-stretch gap-6 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <div className="flex-1">
                                      <p className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mb-1.5">Keterangan</p>
                                      <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{t.Melalui}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  });
                })()}
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
                {(() => {
                  let lastDate = "";
                  return sortedBelumDiambil.map((t, i) => {
                    const isNewDate = t.Tanggal !== lastDate;
                    lastDate = t.Tanggal;
                    return (
                      <React.Fragment key={`belum-${i}`}>
                        {isNewDate && (
                          <div className="pt-4 pb-1 px-2 first:pt-0">
                            <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.15em] flex items-center gap-3">
                              <span className="flex-shrink-0 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/50">
                                {formatIndonesianDateWithDay(t.Tanggal)}
                              </span>
                              <div className="h-px bg-slate-200/50 flex-1" />
                            </h4>
                          </div>
                        )}
                        <motion.div
                          key={`belum-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setExpandedId(expandedId === `belum-${i}` ? null : `belum-${i}`)}
                          className="bg-white rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                        >
                          <div className="relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-[#005E6A] uppercase tracking-tight">{t.Jenis}</p>
                                  <span className="bg-slate-100 text-slate-500 dark:text-slate-300 dark:text-slate-200 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                                    {t.Melalui}
                                  </span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest leading-none">{getWaktuLabel(t.Tanggal)} â€¢ {t.Tanggal}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[7px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Sisa</p>
                                  <p className="text-md font-black text-teal-600 leading-none">
                                    Rp {formatCurrency(
                                      ((t.Melalui || "").toUpperCase().trim() === "EDC BNI" ? (parseCurrency(t.HargaModal) || 0) - 1500 : (parseCurrency(t.HargaModal) || 0)) - (parseCurrency(t.Sebagian) || 0)
                                    )}
                                  </p>
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
                                  <div className="flex items-stretch gap-6 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <div className="flex-1">
                                      <p className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mb-1.5">Nominal Transaksi</p>
                                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">Rp {formatCurrency(parseCurrency(t.Pemasukan) || 0)}</p>
                                    </div>
                                    <div className="w-px bg-slate-100 self-stretch" />
                                    <div className="flex-1">
                                      <p className="text-[7px] font-black text-slate-400 dark:text-slate-300 dark:text-slate-200 uppercase tracking-widest mb-1.5">Biaya & Potongan</p>
                                      <div className="space-y-1">
                                        {(() => {
                                          const melalui = (t.Melalui || "").toUpperCase().trim();
                                          const status = (t.Status || "").toUpperCase().trim();
                                          const isEDC = melalui === "EDC BNI" && status === "BELUM DIAMBIL";
                                          
                                          const pNom = parseCurrency(t.Pemasukan) || 0;
                                          const hMod = parseCurrency(t.HargaModal) || 0;
                                          const totalProfitAdjusted = isEDC ? (pNom - hMod - 1500) : (pNom - hMod);
                                          
                                          const standardAdmin = (() => {
                                            const p = pNom;
                                            if (p <= 0) return 0;
                                            if (p < 100000) return 3000;
                                            if (p <= 999999) return 5000;
                                            if (p <= 1999999) return 10000;
                                            if (p <= 2999999) return 15000;
                                            if (p <= 3999999) return 20000;
                                            if (p <= 4999999) return 25000;
                                            return Math.round(p * 0.005);
                                          })();
                                          
                                          const displayAdmin = Math.min(totalProfitAdjusted, standardAdmin);
                                          const bonus = Math.max(0, totalProfitAdjusted - standardAdmin);
                                          
                                          return (
                                            <>
                                              <p className="text-[9px] font-bold text-red-500">Admin: Rp {formatCurrency(displayAdmin)}</p>
                                              {bonus > 0 && (
                                                <p className="text-[9px] font-bold text-teal-500">Bonus: Rp {formatCurrency(bonus)}</p>
                                              )}
                                              {isEDC && (
                                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-300 dark:text-slate-200">Biaya EDC: Rp {formatCurrency(3000)}</p>
                                              )}
                                            </>
                                          );
                                        })()}
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
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {userTransactions.length === 0 && (
            <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center gap-4 opacity-30">
                <History className="w-12 h-12 text-slate-400 dark:text-slate-300 dark:text-slate-200" />
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 dark:text-slate-200">Tidak ada riwayat transaksi aktif</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </ProtectedPage>
  );
};

const AdminReportPage = ({ 
  transactions,
  customers = [],
  setSalesTransactions,
  savingsTransactions = [],
  setSavingsTransactions,
  debtTransactions = [],
  setDebtTransactions,
  fetchData
}: { 
  transactions: SalesTransaction[];
  customers?: Customer[];
  setSalesTransactions?: React.Dispatch<React.SetStateAction<SalesTransaction[]>>;
  savingsTransactions?: SavingTransaction[];
  setSavingsTransactions?: React.Dispatch<React.SetStateAction<SavingTransaction[]>>;
  debtTransactions?: DebtTransaction[];
  setDebtTransactions?: React.Dispatch<React.SetStateAction<DebtTransaction[]>>;
  fetchData?: (showLoading?: boolean, collectionName?: string | string[], extraOptions?: any) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState(getTodayDateISO());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDateSyncing, setIsDateSyncing] = useState(false);

  useEffect(() => {
    if (filterDate && fetchData) {
      setIsDateSyncing(true);
      fetchData(false, 'salesTransactions', { dateFilter: filterDate }).finally(() => {
        setIsDateSyncing(false);
      });
    }
  }, [filterDate]);
  const [showSummary, setShowSummary] = useState(false);

  // Add Sales Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState<Partial<SalesTransaction> & { hargaAdmin?: number }>({});
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Customer Autocomplete & On-Demand States
  const [customerInputText, setCustomerInputText] = useState("Pelanggan Umum");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Selected Transaction for Detail, Edit & Delete Modal
  const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<SalesTransaction> & { hargaAdmin?: number }>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingTx, setIsDeletingTx] = useState(false);
  const [editCustomerInputText, setEditCustomerInputText] = useState("");
  const [showEditCustomerSuggestions, setShowEditCustomerSuggestions] = useState(false);

  const [selectedCustDetails, setSelectedCustDetails] = useState<{
    id_pelanggan: string;
    Nama: string;
    lastTxId: string;
    lastHutangId: string;
    lastTabunganId: string;
    hutang: number;
    tabungan: number;
  }>({
    id_pelanggan: "CUST-0000",
    Nama: "Pelanggan Umum",
    lastTxId: "TRX-0000/1",
    lastHutangId: "HUT-0000/1",
    lastTabunganId: "TAB-0000/1",
    hutang: 0,
    tabungan: 0
  });

  const CUSTOMER_CACHE_KEY = "app_customer_cache_v3";
  const CUSTOMER_CACHE_TS_KEY = "app_customer_cache_ts_v3";

  const loadAllCustomers = async (forceRemoteCheck = false) => {
    // 1. Instantly populate from browser localStorage cache if available
    try {
      const cachedStr = localStorage.getItem(CUSTOMER_CACHE_KEY);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomerList(parsed);
        }
      }
    } catch (e) {
      console.warn("Gagal membaca cache pelanggan lokal:", e);
    }

    // 2. Check cache timestamp to minimize unnecessary bandwidth
    const lastFetch = Number(localStorage.getItem(CUSTOMER_CACHE_TS_KEY) || 0);
    const now = Date.now();
    const isExpired = now - lastFetch > 3 * 60 * 1000; // 3 minutes

    if (!forceRemoteCheck && !isExpired && localStorage.getItem(CUSTOMER_CACHE_KEY)) {
      return;
    }

    if (SupabaseCustomerService.isConnected()) {
      try {
        const res = await SupabaseCustomerService.getCustomers({
          select: 'id, id_pelanggan, nama, tabungan, hutang, foto, level, point'
        });
        if (res.data && res.data.length > 0) {
          const list = res.data.map((c, index) => ({
            id: c.id_pelanggan || c.id || `CUST-${String(index + 1).padStart(4, '0')}`,
            id_pelanggan: c.id_pelanggan || `CUST-${String(index + 1).padStart(4, '0')}`,
            Nama: c.nama || 'Pelanggan',
            nama: c.nama || 'Pelanggan',
            Hutang: Number(c.hutang) || 0,
            hutang: Number(c.hutang) || 0,
            Tabungan: Number(c.tabungan) || 0,
            tabungan: Number(c.tabungan) || 0,
          }));

          const newListStr = JSON.stringify(list);
          const oldListStr = localStorage.getItem(CUSTOMER_CACHE_KEY);
          if (newListStr !== oldListStr) {
            localStorage.setItem(CUSTOMER_CACHE_KEY, newListStr);
            setCustomerList(list as any);
          }
          localStorage.setItem(CUSTOMER_CACHE_TS_KEY, String(now));
        }
      } catch (err) {
        console.error("Gagal memuat seluruh data pelanggan:", err);
      }
    } else if (customers && customers.length > 0) {
      setCustomerList(customers);
    }
  };

  useEffect(() => {
    loadAllCustomers();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const get4DigitCustId = (idPelanggan?: string): string => {
    if (!idPelanggan || idPelanggan === "CUST-0000") return "0000";
    const cleanDigits = idPelanggan.replace(/\D/g, "");
    if (cleanDigits.length >= 4) {
      return cleanDigits.slice(-4);
    } else if (cleanDigits.length > 0) {
      return cleanDigits.padStart(4, "0");
    }
    const cleanStr = idPelanggan.trim().toUpperCase();
    return cleanStr.slice(-4).padStart(4, "0");
  };

  const calculateAutoTxId = (idPelanggan: string, nama: string, allTxs: SalesTransaction[]): string => {
    const custDigits = get4DigitCustId(idPelanggan);
    const existingIds = new Set((allTxs || []).map((t) => String(t.id_transaksi || t.id || "")));

    const custTxs = (allTxs || []).filter((tx) => {
      const txCustId = (tx.id_pelanggan || "").trim().toLowerCase();
      const txName = (tx.Nama || "").trim().toLowerCase();
      const targetCustId = (idPelanggan || "").trim().toLowerCase();
      const targetName = (nama || "").trim().toLowerCase();

      if (targetCustId && targetCustId !== "cust-0000") {
        if (txCustId === targetCustId) return true;
      }
      if (targetName && targetName.toLowerCase() !== "pelanggan umum") {
        if (txName === targetName) return true;
      }
      return false;
    });

    let maxSeq = custTxs.length;

    custTxs.forEach((tx) => {
      const txIdStr = tx.id_transaksi || tx.id || "";
      const match = txIdStr.match(/\/(\d+)(?:-\d+)?$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    let nextSeq = maxSeq + 1;
    let candidate = `TRX-${custDigits}/${nextSeq}`;

    // Guarantee uniqueness against all existing transactions
    while (existingIds.has(candidate)) {
      nextSeq++;
      candidate = `TRX-${custDigits}/${nextSeq}`;
    }

    // For generic customers (0000), append timestamp slice to guarantee zero collision in multi-tab/rapid entry
    if (custDigits === "0000" || !idPelanggan || idPelanggan === "CUST-0000") {
      const timeSlice = Math.floor(Date.now() / 1000).toString().slice(-4);
      candidate = `TRX-${custDigits}/${nextSeq}-${timeSlice}`;
      while (existingIds.has(candidate)) {
        candidate = `TRX-${custDigits}/${nextSeq}-${Math.floor(Math.random() * 9000 + 1000)}`;
      }
    }

    return candidate;
  };

  const handleSelectCustomerSuggestion = (cust: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string; hutang?: number; tabungan?: number }) => {
    const name = cust.Nama || cust.nama || "Pelanggan Umum";
    const id = cust.id_pelanggan || cust.id || "CUST-0000";

    setCustomerInputText(name);
    setShowCustomerSuggestions(false);

    // On-demand generation when a customer recommendation is clicked
    const newTxId = calculateAutoTxId(id, name, transactions);
    const newHutangId = generateNextHutangId({ id_pelanggan: id, Nama: name }, debtTransactions, customerList);
    const newTabunganId = generateNextTabunganId({ id_pelanggan: id, Nama: name }, savingsTransactions, customerList);

    const hutangBal = parseCurrency(cust.hutang || (cust as any).Hutang || 0);
    const tabunganBal = parseCurrency(cust.tabungan || (cust as any).Tabungan || 0);

    setSelectedCustDetails({
      id_pelanggan: id,
      Nama: name,
      lastTxId: newTxId,
      lastHutangId: newHutangId,
      lastTabunganId: newTabunganId,
      hutang: hutangBal,
      tabungan: tabunganBal
    });

    setAddFormData((prev) => ({
      ...prev,
      Nama: name,
      id_pelanggan: id,
      id_transaksi: newTxId
    }));
  };

  const filteredSuggestions = useMemo(() => {
    const q = (customerInputText || "").toLowerCase().trim();
    const generalOption = {
      id_pelanggan: "CUST-0000",
      id: "CUST-0000",
      Nama: "Pelanggan Umum",
      nama: "Pelanggan Umum",
      hutang: 0,
      tabungan: 0
    };

    if (!q) {
      return [generalOption, ...customerList.slice(0, 10)];
    }

    const matches = customerList.filter((c) => {
      const name = (c.nama || c.Nama || "").toLowerCase();
      const id = (c.id_pelanggan || c.id || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });

    if ("pelanggan umum".includes(q) || "cust-0000".includes(q)) {
      return [generalOption, ...matches.filter(c => (c.nama || c.Nama) !== "Pelanggan Umum").slice(0, 10)];
    }

    return matches.slice(0, 12);
  }, [customerInputText, customerList]);

  const calculateWarungTomiFee = (amount: number) => {
    if (amount <= 0) return 0;
    if (amount <= 103000) return 3000;
    if (amount <= 999999) return 5000;
    if (amount <= 1999999) return 10000;
    if (amount <= 2999999) return 15000;
    if (amount <= 3999999) return 20000;
    if (amount <= 4999999) return 25000;
    return Math.round(amount * 0.005);
  };

  const handlePemasukanChange = (val: number, customMelalui?: string) => {
    const adminFee = calculateWarungTomiFee(val);
    const channel = customMelalui !== undefined ? customMelalui : (addFormData.Melalui || "EDC BNI");
    const edcExtra = channel === "EDC BNI" ? 1500 : 0;
    const calculatedModal = Math.max(0, val - adminFee - edcExtra);
    const calculatedPoin = Math.max(0, Math.floor(val / 10000));
    setAddFormData((prev) => ({
      ...prev,
      Pemasukan: val,
      hargaAdmin: adminFee,
      HargaModal: calculatedModal,
      Poin: calculatedPoin
    }));
  };

  const handleHargaModalChange = (modalVal: number) => {
    const jual = addFormData.Pemasukan || 0;
    const edcExtra = (addFormData.Melalui || "EDC BNI") === "EDC BNI" ? 1500 : 0;
    const adminFee = Math.max(0, jual - modalVal - edcExtra);
    setAddFormData((prev) => ({
      ...prev,
      HargaModal: modalVal,
      hargaAdmin: adminFee
    }));
  };

  const handleOpenAdd = () => {
    // Non-blocking background sync from local browser storage / database
    loadAllCustomers();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const formattedToday = `${dd}/${mm}/${yyyy}`;
    
    const defaultCustId = "CUST-0000";
    const defaultName = "Pelanggan Umum";
    const autoId = calculateAutoTxId(defaultCustId, defaultName, transactions);
    const autoHutangId = generateNextHutangId({ id_pelanggan: defaultCustId, Nama: defaultName }, debtTransactions, customerList);
    const autoTabunganId = generateNextTabunganId({ id_pelanggan: defaultCustId, Nama: defaultName }, savingsTransactions, customerList);

    setCustomerInputText(defaultName);
    setShowCustomerSuggestions(false);

    setSelectedCustDetails({
      id_pelanggan: defaultCustId,
      Nama: defaultName,
      lastTxId: autoId,
      lastHutangId: autoHutangId,
      lastTabunganId: autoTabunganId,
      hutang: 0,
      tabungan: 0
    });

    setAddFormData({
      id_transaksi: autoId,
      id_pelanggan: defaultCustId,
      Tanggal: formattedToday,
      Nama: defaultName,
      Jenis: "TARIK TUNAI",
      Melalui: "EDC BNI",
      Metode: "TUNAI",
      Pemasukan: 0,
      hargaAdmin: 3000,
      HargaModal: 0,
      Sebagian: 0,
      Poin: 0,
      Status: "SELESAI"
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!addFormData.Nama || !addFormData.Nama.trim()) {
      showToast("Nama Pelanggan wajib diisi.", "error");
      return;
    }
    setIsAdding(true);

    const now = new Date();
    const nowIso = now.toISOString();

    const newTx: SalesTransaction = {
      id: addFormData.id_transaksi || `TRX-${Date.now()}`,
      id_transaksi: addFormData.id_transaksi || `TRX-${Date.now()}`,
      id_pelanggan: addFormData.id_pelanggan || "",
      Tanggal: addFormData.Tanggal || formatInputToDate(new Date().toISOString().slice(0, 10)),
      Nama: addFormData.Nama.trim(),
      Jenis: addFormData.Jenis || "TOPUP DANA",
      Melalui: addFormData.Melalui || "DANA",
      Metode: addFormData.Metode || "TUNAI",
      Pemasukan: Number(addFormData.Pemasukan) || 0,
      HargaModal: Number(addFormData.HargaModal) || 0,
      Sebagian: Number(addFormData.Sebagian) || 0,
      Poin: Number(addFormData.Poin) || 0,
      Status: addFormData.Status || "SELESAI",
      created_at: nowIso
    };

    try {
      const metodeUpper = (newTx.Metode || "").toUpperCase().trim();

      // Automatic deduction for TABUNGAN & debt addition for KASBON
      if (metodeUpper === "TABUNGAN") {
        const targetCust = customerList.find(
          (c) =>
            (c.id_pelanggan || c.id) === newTx.id_pelanggan ||
            (c.nama || c.Nama) === newTx.Nama
        );

        const currentTab = parseCurrency(targetCust?.tabungan || targetCust?.Tabungan || 0);

        if (currentTab < newTx.Pemasukan) {
          showToast(
            `Saldo tabungan ${newTx.Nama} tidak mencukupi (Saldo: Rp ${currentTab.toLocaleString("id-ID")})`,
            "error"
          );
          setIsAdding(false);
          return;
        }

        const newTab = Math.max(0, currentTab - newTx.Pemasukan);
        const idTab = generateNextTabunganId(
          { id_pelanggan: newTx.id_pelanggan, Nama: newTx.Nama },
          savingsTransactions,
          customerList
        );

        const newSavingTx: SavingTransaction = {
          id: idTab,
          id_tabungan: idTab,
          id_pelanggan: newTx.id_pelanggan || "",
          Tanggal: newTx.Tanggal,
          Nama: newTx.Nama,
          Tipe: "TARIK",
          Nominal: newTx.Pemasukan,
          SaldoAkhir: newTab,
          Berita: `Bayar Belanja Virtual - ${newTx.id_transaksi}`
        };

        if (setSavingsTransactions) {
          setSavingsTransactions((prev) => [newSavingTx, ...prev]);
        }

        if (SupabaseSavingsService.isConnected()) {
          await SupabaseSavingsService.addSavingTransaction({
            id_tabungan: idTab,
            id_pelanggan: newTx.id_pelanggan || "",
            tanggal: newTx.Tanggal,
            nama: newTx.Nama,
            tipe: "TARIK",
            nominal: newTx.Pemasukan,
            saldo_akhir: newTab,
            berita: `Bayar Belanja Virtual - ${newTx.id_transaksi}`
          });

          await SupabaseCustomerService.upsertCustomer({
            id_pelanggan: newTx.id_pelanggan || "CUST-0000",
            nama: newTx.Nama,
            tabungan: newTab,
            hutang: parseCurrency(targetCust?.hutang || targetCust?.Hutang || 0)
          });
        }

        setCustomerList((prev) =>
          prev.map((c) =>
            (c.id_pelanggan || c.id) === newTx.id_pelanggan || (c.nama || c.Nama) === newTx.Nama
              ? { ...c, tabungan: newTab, Tabungan: newTab }
              : c
          )
        );
      } else if (metodeUpper === "KASBON") {
        const targetCust = customerList.find(
          (c) =>
            (c.id_pelanggan || c.id) === newTx.id_pelanggan ||
            (c.nama || c.Nama) === newTx.Nama
        );

        const currentDebt = parseCurrency(targetCust?.hutang || targetCust?.Hutang || 0);
        const netDebtAmount = Math.max(0, newTx.Pemasukan - (newTx.Sebagian || 0));
        const newDebt = currentDebt + netDebtAmount;

        const idHut = generateNextHutangId(
          { id_pelanggan: newTx.id_pelanggan, Nama: newTx.Nama },
          debtTransactions,
          customerList
        );

        const newDebtTx: DebtTransaction = {
          id: idHut,
          id_hutang: idHut,
          id_pelanggan: newTx.id_pelanggan || "",
          Tanggal: newTx.Tanggal,
          Nama: newTx.Nama,
          Tipe: "KASBON",
          Jumlah: netDebtAmount,
          Keterangan: `Kasbon Belanja Virtual - ${newTx.id_transaksi}`,
          SaldoAkhir: newDebt
        };

        if (setDebtTransactions) {
          setDebtTransactions((prev) => [newDebtTx, ...prev]);
        }

        if (SupabaseDebtService.isConnected()) {
          await SupabaseDebtService.addDebtTransaction({
            id_hutang: idHut,
            id_pelanggan: newTx.id_pelanggan || "",
            tanggal: newTx.Tanggal,
            nama: newTx.Nama,
            tipe: "KASBON",
            jumlah: netDebtAmount,
            keterangan: `Kasbon Belanja Virtual - ${newTx.id_transaksi}`,
            saldo_akhir: newDebt
          });

          await SupabaseCustomerService.upsertCustomer({
            id_pelanggan: newTx.id_pelanggan || "CUST-0000",
            nama: newTx.Nama,
            hutang: newDebt,
            tabungan: parseCurrency(targetCust?.tabungan || targetCust?.Tabungan || 0)
          });
        }

        setCustomerList((prev) =>
          prev.map((c) =>
            (c.id_pelanggan || c.id) === newTx.id_pelanggan || (c.nama || c.Nama) === newTx.Nama
              ? { ...c, hutang: newDebt, Hutang: newDebt }
              : c
          )
        );
      }

      if (setSalesTransactions) {
        setSalesTransactions((prev) => [newTx, ...prev]);
      }

      if (SupabaseSalesService.isConnected()) {
        const payload: SupabaseSalesTransaction = {
          id_transaksi: newTx.id_transaksi || newTx.id,
          id_pelanggan: newTx.id_pelanggan || "",
          tanggal: newTx.Tanggal,
          nama: newTx.Nama,
          jenis: newTx.Jenis,
          metode: newTx.Metode,
          pemasukan: newTx.Pemasukan,
          poin: newTx.Poin,
          status: newTx.Status,
          melalui: newTx.Melalui,
          harga_modal: newTx.HargaModal,
          sebagian: newTx.Sebagian,
          created_at: nowIso
        };
        await SupabaseSalesService.upsertSale(payload);
      }

      showToast("Penjualan Virtual berhasil ditambahkan!");
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menambah transaksi virtual:", err);
      showToast("Gagal menyimpan data ke database.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEditModal = (t: SalesTransaction) => {
    setSelectedTransaction(t);
    const initialJual = parseCurrency(t.Pemasukan) || 0;
    const initialModal = parseCurrency(t.HargaModal) || 0;
    const adminFee = Math.max(0, initialJual - initialModal - (t.Melalui === 'EDC BNI' ? 1500 : 0));
    setEditFormData({
      ...t,
      Pemasukan: initialJual,
      HargaModal: initialModal,
      hargaAdmin: adminFee,
      Sebagian: parseCurrency(t.Sebagian) || 0,
      Poin: Number(t.Poin) || 0,
      Tanggal: t.Tanggal || formatInputToDate(new Date().toISOString().split('T')[0]),
      Jenis: t.Jenis || 'TARIK TUNAI',
      Melalui: t.Melalui || 'EDC BNI',
      Metode: t.Metode || 'TUNAI',
      Status: t.Status || 'SELESAI',
      Nama: t.Nama || 'Pelanggan Umum',
      id_pelanggan: t.id_pelanggan || 'CUST-0000',
      id_transaksi: t.id_transaksi || t.id,
    });
    setEditCustomerInputText(t.Nama || 'Pelanggan Umum');
    setShowEditCustomerSuggestions(false);
    setIsEditModalOpen(true);
  };

  const handleEditPemasukanChange = (val: number, customMelalui?: string) => {
    const adminFee = calculateWarungTomiFee(val);
    const channel = customMelalui !== undefined ? customMelalui : (editFormData.Melalui || "EDC BNI");
    const edcExtra = channel === "EDC BNI" ? 1500 : 0;
    const calculatedModal = Math.max(0, val - adminFee - edcExtra);
    const calculatedPoin = Math.max(0, Math.floor(val / 10000));
    setEditFormData((prev) => ({
      ...prev,
      Pemasukan: val,
      hargaAdmin: adminFee,
      HargaModal: calculatedModal,
      Poin: calculatedPoin
    }));
  };

  const handleEditHargaModalChange = (modalVal: number) => {
    const jual = editFormData.Pemasukan || 0;
    const edcExtra = (editFormData.Melalui || "EDC BNI") === "EDC BNI" ? 1500 : 0;
    const adminFee = Math.max(0, jual - modalVal - edcExtra);
    setEditFormData((prev) => ({
      ...prev,
      HargaModal: modalVal,
      hargaAdmin: adminFee
    }));
  };

  const handleSelectEditCustomerSuggestion = (cust: { id_pelanggan?: string; id?: string; Nama?: string; nama?: string }) => {
    const name = cust.Nama || cust.nama || "Pelanggan Umum";
    const id = cust.id_pelanggan || cust.id || "CUST-0000";
    setEditCustomerInputText(name);
    setShowEditCustomerSuggestions(false);
    setEditFormData((prev) => ({
      ...prev,
      Nama: name,
      id_pelanggan: id
    }));
  };

  const filteredEditSuggestions = useMemo(() => {
    const q = (editCustomerInputText || "").toLowerCase().trim();
    const generalOption = {
      id_pelanggan: "CUST-0000",
      id: "CUST-0000",
      Nama: "Pelanggan Umum",
      nama: "Pelanggan Umum",
      hutang: 0,
      tabungan: 0
    };

    if (!q) {
      return [generalOption, ...customerList.slice(0, 10)];
    }

    const matches = customerList.filter((c) => {
      const name = (c.nama || c.Nama || "").toLowerCase();
      const id = (c.id_pelanggan || c.id || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });

    if ("pelanggan umum".includes(q) || "cust-0000".includes(q)) {
      return [generalOption, ...matches.filter(c => (c.nama || c.Nama) !== "Pelanggan Umum").slice(0, 10)];
    }

    return matches.slice(0, 12);
  }, [editCustomerInputText, customerList]);

  const handleSaveEdit = async () => {
    if (!editFormData || !selectedTransaction) return;
    setIsSavingEdit(true);
    try {
      const updatedTx: SalesTransaction = {
        ...selectedTransaction,
        ...editFormData,
        Tanggal: editFormData.Tanggal || selectedTransaction.Tanggal,
        Nama: editFormData.Nama || selectedTransaction.Nama || 'Pelanggan Umum',
        id_pelanggan: editFormData.id_pelanggan || selectedTransaction.id_pelanggan || 'CUST-0000',
        Jenis: editFormData.Jenis || selectedTransaction.Jenis || 'TARIK TUNAI',
        Melalui: editFormData.Melalui || selectedTransaction.Melalui || 'Tunai',
        Metode: editFormData.Metode || selectedTransaction.Metode || 'TUNAI',
        Status: editFormData.Status || selectedTransaction.Status || 'SELESAI',
        Pemasukan: Number(editFormData.Pemasukan) || 0,
        HargaModal: Number(editFormData.HargaModal) || 0,
        Sebagian: Number(editFormData.Sebagian) || 0,
        Poin: Number(editFormData.Poin) || 0,
      };

      if (setSalesTransactions) {
        setSalesTransactions((prev) =>
          prev.map((t) => {
            const matchId = (t.id_transaksi && t.id_transaksi === (selectedTransaction.id_transaksi || selectedTransaction.id)) ||
                            (t.id && t.id === (selectedTransaction.id || selectedTransaction.id_transaksi)) ||
                            (t === selectedTransaction);
            return matchId ? updatedTx : t;
          })
        );
      }

      if (SupabaseSalesService.isConnected()) {
        const payload: SupabaseSalesTransaction = {
          id: (selectedTransaction as any).id,
          id_transaksi: updatedTx.id_transaksi || updatedTx.id,
          id_pelanggan: updatedTx.id_pelanggan || "",
          tanggal: updatedTx.Tanggal,
          nama: updatedTx.Nama,
          jenis: updatedTx.Jenis,
          metode: updatedTx.Metode,
          pemasukan: updatedTx.Pemasukan,
          poin: updatedTx.Poin,
          status: updatedTx.Status,
          melalui: updatedTx.Melalui,
          harga_modal: updatedTx.HargaModal,
          sebagian: updatedTx.Sebagian,
          created_at: (selectedTransaction as any).created_at || new Date().toISOString()
        };
        await SupabaseSalesService.upsertSale(payload);
      }

      if (fetchData) {
        fetchData(false, 'salesTransactions', { dateFilter: filterDate });
      }

      showToast("Transaksi berhasil diperbarui di database!");
      setSelectedTransaction(updatedTx);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Gagal mengupdate transaksi:", err);
      showToast("Gagal memperbarui transaksi di database.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!selectedTransaction) return;
    setIsDeletingTx(true);
    try {
      const txId = selectedTransaction.id_transaksi || selectedTransaction.id;
      const altId = (selectedTransaction as any).id;

      if (SupabaseSalesService.isConnected() && (txId || altId)) {
        await SupabaseSalesService.deleteSale(txId || altId, altId);
      }

      if (setSalesTransactions) {
        setSalesTransactions((prev) =>
          prev.filter((t) => {
            const matchId = (t.id_transaksi && txId && t.id_transaksi === txId) ||
                            (t.id && txId && t.id === txId) ||
                            (altId && t.id === altId) ||
                            (t === selectedTransaction);
            return !matchId;
          })
        );
      }

      if (fetchData) {
        fetchData(false, 'salesTransactions', { dateFilter: filterDate });
      }

      showToast("Transaksi berhasil dihapus dari database!");
      setShowDeleteConfirm(false);
      setSelectedTransaction(null);
    } catch (err: any) {
      console.error("Gagal menghapus transaksi:", err);
      showToast("Gagal menghapus transaksi dari database.", "error");
    } finally {
      setIsDeletingTx(false);
    }
  };

  const changeDate = (days: number) => {
    const parts = filterDate.split('-');
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const currentDate = new Date(year, month, day);
    currentDate.setDate(currentDate.getDate() + days);
    
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    
    setFilterDate(newDateStr);
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for matching
  const formattedFilterDate = useMemo(() => {
    return filterDate.split('-').reverse().join('/');
  }, [filterDate]);

  // Filter transactions and compute totals in a single memoized pass
  const { filteredTransactions, totalPemasukan, totalModal, totalKeuntungan, totalTransaksi } = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    let pemasukan = 0;
    let modal = 0;

    const filtered = transactions.filter(t => {
      const matchDate = (t.Tanggal && (t.Tanggal.startsWith(formattedFilterDate) || t.Tanggal.startsWith(filterDate)));
      if (!matchDate) return false;
      
      if (!q) {
        pemasukan += parseCurrency(t.Pemasukan) || 0;
        modal += parseCurrency(t.HargaModal) || 0;
        return true;
      }
      
      const matchName = (t.Nama || "Pelanggan Umum").toLowerCase().includes(q);
      const matchJenis = (t.Jenis || "").toLowerCase().includes(q);
      const matchMelalui = (t.Melalui || "").toLowerCase().includes(q);
      const matchStatus = (t.Status || "").toLowerCase().includes(q);
      
      const match = matchName || matchJenis || matchMelalui || matchStatus;
      if (match) {
        pemasukan += parseCurrency(t.Pemasukan) || 0;
        modal += parseCurrency(t.HargaModal) || 0;
      }
      return match;
    });

    const getTxTime = (item: SalesTransaction): number => {
      if (item.created_at) {
        const t = new Date(item.created_at).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (item.Tanggal) {
        const t = parseDate(item.Tanggal).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };

    const extractTxSequence = (idStr?: string): number => {
      if (!idStr) return 0;
      const s = String(idStr).trim();
      const slashMatch = s.match(/\/(\d+)/);
      if (slashMatch) {
        const num = parseInt(slashMatch[1], 10);
        if (!isNaN(num)) return num;
      }
      const matchNum = s.match(/\d+/g);
      if (matchNum && matchNum.length > 0) {
        for (const seg of matchNum) {
          if (seg.length >= 10) {
            const val = parseInt(seg, 10);
            if (!isNaN(val)) return val;
          }
        }
        const lastNum = parseInt(matchNum[matchNum.length - 1], 10);
        if (!isNaN(lastNum)) return lastNum;
      }
      return 0;
    };

    const txIndexMap = new Map<any, number>();
    transactions.forEach((tx, idx) => {
      const key = tx.id_transaksi || tx.id || tx;
      if (!txIndexMap.has(key)) {
        txIndexMap.set(key, idx);
      }
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
      const timeA = getTxTime(a);
      const timeB = getTxTime(b);
      if (Math.abs(timeB - timeA) > 1000) {
        return timeB - timeA;
      }

      const seqA = extractTxSequence(a.id_transaksi || a.id);
      const seqB = extractTxSequence(b.id_transaksi || b.id);
      if (seqB !== seqA) {
        return seqB - seqA;
      }

      const keyA = a.id_transaksi || a.id || a;
      const keyB = b.id_transaksi || b.id || b;
      const idxA = txIndexMap.has(keyA) ? txIndexMap.get(keyA)! : 999999;
      const idxB = txIndexMap.has(keyB) ? txIndexMap.get(keyB)! : 999999;
      if (idxA !== idxB) {
        return idxA - idxB;
      }

      const idA = String(a.id_transaksi || a.id || '');
      const idB = String(b.id_transaksi || b.id || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    });

    return {
      filteredTransactions: sortedFiltered,
      totalPemasukan: pemasukan,
      totalModal: modal,
      totalKeuntungan: pemasukan - modal,
      totalTransaksi: sortedFiltered.length
    };
  }, [transactions, filterDate, formattedFilterDate, searchQuery]);

  // Group by Jenis (categories) and calculate totals for each
  interface GroupedReport {
    jenis: string;
    pemasukan: number;
    keuntungan: number;
    count: number;
  }

  const groupedSummary = useMemo(() => {
    const map: Record<string, GroupedReport> = {};
    filteredTransactions.forEach(t => {
      const rawJenis = (t.Jenis || "Lainnya").trim();
      const jenis = rawJenis.charAt(0).toUpperCase() + rawJenis.slice(1).toLowerCase();
      
      const pem = parseCurrency(t.Pemasukan) || 0;
      const mod = parseCurrency(t.HargaModal) || 0;
      const keu = pem - mod;

      if (!map[jenis]) {
        map[jenis] = { jenis, pemasukan: 0, keuntungan: 0, count: 0 };
      }
      map[jenis].pemasukan += pem;
      map[jenis].keuntungan += keu;
      map[jenis].count += 1;
    });
    return Object.values(map).sort((a, b) => b.pemasukan - a.pemasukan);
  }, [filteredTransactions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-10 pb-16 rounded-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase whitespace-nowrap">Laporan Transaksi</h1>
            </div>
            <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Data Penjualan Harian</p>
          </div>

          {/* Date Selector Full Width Left to Right */}
          <div className="w-full flex items-center justify-between bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl px-2.5 py-2 shadow-inner text-white">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-white/20 active:scale-90 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center shrink-0"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-2 flex-1 min-w-0 px-2">
              {isDateSyncing ? (
                <RefreshCw className="w-4 h-4 text-teal-200 animate-spin shrink-0" />
              ) : (
                <Calendar className="w-4 h-4 text-teal-200 shrink-0" />
              )}
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setFilterDate(val);
                  }
                }}
                className="bg-transparent border-none text-xs sm:text-sm font-black text-white focus:outline-none appearance-none cursor-pointer p-0 text-center tracking-wider max-w-[150px]"
              />
            </div>
            <button 
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-white/20 active:scale-90 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center shrink-0"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-6">
        {/* Stats Card */}
        <div className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative">
          <div className="text-center mb-7">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2.5">Total Pemasukan</p>
            <h3 className="text-4xl font-black text-[#005E6A] dark:text-teal-300 tracking-tighter">Rp {totalPemasukan.toLocaleString('id-ID')}</h3>
          </div>
          
          <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-1">
            <div className="text-center border-r border-slate-100 dark:border-slate-800">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Total Transaksi</p>
              <h4 className="text-xl font-black text-[#F15A24] tracking-tight">{totalTransaksi}</h4>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Total Keuntungan</p>
              <h4 className="text-xl font-black text-green-600 dark:text-emerald-400 tracking-tight">Rp {totalKeuntungan.toLocaleString('id-ID')}</h4>
            </div>
          </div>

          {/* Collapsible summary section of transaction types */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            <button 
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between text-left focus:outline-none group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#005E6A]/10 flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-[#005E6A]" />
                </div>
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider group-hover:text-[#005E6A] transition-colors">
                  Ringkasan Kategori
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                  ({groupedSummary.length} Jenis)
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-[#005E6A]/5 px-2.5 py-1 rounded-xl transition-colors">
                <span className="text-[8px] font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-wider">
                  {showSummary ? "Tutup" : "Buka"}
                </span>
                {showSummary ? (
                  <ChevronUp className="w-3 h-3 text-[#005E6A] dark:text-teal-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#005E6A] dark:text-teal-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {showSummary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-2.5">
                    {groupedSummary.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                        {groupedSummary.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-100/70 dark:border-slate-800/70 transition-colors flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-black text-[#F15A24] dark:text-orange-400 uppercase tracking-wide truncate max-w-[150px]">
                                {item.jenis}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                                {item.count} Transaksi
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-slate-100/60 dark:border-slate-800/60 pt-2 mt-1">
                              <div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan</p>
                                <p className="text-[10px] font-black text-[#005E6A] dark:text-teal-300 mt-0.5">
                                  Rp {item.pemasukan.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div className="border-l border-slate-200/50 dark:border-slate-700/50 pl-2">
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Keuntungan</p>
                                <p className="text-[10px] font-black text-green-600 dark:text-emerald-400 mt-0.5">
                                  Rp {item.keuntungan.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                        Tidak ada transaksi pada tanggal ini
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Transaction List Card with Header & Search embedded inside */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Card Header: Title & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#005E6A]/10 dark:bg-teal-500/20 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-[#005E6A] dark:text-teal-300 uppercase tracking-wider">
                  Daftar Transaksi
                </h3>
              </div>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 shrink-0">
                {filteredTransactions.length} Data
              </Badge>
            </div>

            {/* Kolom Cari Transaksi */}
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-xs">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <input 
                type="text"
                placeholder="Cari transaksi berdasarkan nama, jenis, atau melalui..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 w-full min-w-0 bg-transparent border-none text-xs font-bold text-[#005E6A] dark:text-teal-300 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-500 placeholder:font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group shrink-0 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-300" />
                </button>
              )}
            </div>
          </div>

          {/* Transaction List Items */}
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTransactions.map((t, i) => {
                const jenisLower = (t.Jenis || '').toLowerCase().trim();
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
                  (jenisLower.includes('belanja') && s.name.toLowerCase() === 'belanja') ||
                  (jenisLower.includes('fisik') && s.name.toLowerCase() === 'belanja')
                );
                const statusLower = (t.Status || '').toLowerCase();
                const displayName = (!t.Nama || t.Nama === "Unknown" || t.Nama.trim() === "") ? "Pelanggan Umum" : t.Nama;
                
                let ribbonColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                if (statusLower.includes('selesai') || statusLower.includes('sukses')) ribbonColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400';
                else if (statusLower.includes('kasbon')) ribbonColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400';
                else if (statusLower.includes('proses')) ribbonColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400';
                else if (statusLower.includes('belum') || statusLower.includes('ambil')) ribbonColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400';

                const profit = (parseCurrency(t.Pemasukan) || 0) - (parseCurrency(t.HargaModal) || 0);

                const timeStr = (() => {
                  const rawTime = t.created_at || t.Tanggal;
                  if (rawTime) {
                    const d = new Date(rawTime);
                    if (!isNaN(d.getTime()) && d.getTime() > 0) {
                      return `${d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })} WIB`;
                    }
                    const timeMatch = String(rawTime).match(/\b\d{2}:\d{2}(?::\d{2})?\b/);
                    if (timeMatch) return `${timeMatch[0].slice(0, 5)} WIB`;
                  }
                  return '';
                })();

                const handleClick = () => {
                  setSelectedTransaction(t);
                };

                return (
                  <div
                    key={t.id || t.id_transaksi || i}
                    onClick={handleClick}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Service Icon */}
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${service?.bgColor || 'bg-slate-50 dark:bg-slate-800'}`}>
                        {service ? service.icon : <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-300" />}
                      </div>

                      {/* Transaction Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        {/* Baris 1: Nama & Jam di samping kanannya */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-black text-[#005E6A] dark:text-teal-300 uppercase truncate">
                            {displayName}
                          </p>
                          {timeStr && (
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              â€¢ {timeStr}
                            </span>
                          )}
                        </div>

                        {/* Baris 2: Jenis, Melalui & Status di samping kanannya */}
                        <div className="flex items-center gap-2 text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase flex-wrap">
                          <span className="text-slate-700 dark:text-slate-200">{t.Jenis}</span>
                          <span>â€¢</span>
                          <span className="text-slate-400 dark:text-slate-500">via {t.Melalui || 'Tunai'}</span>
                          <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ribbonColor}`}>
                            {t.Status || 'Selesai'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Profit */}
                    <div className="text-right shrink-0 pl-2">
                      <p className="text-sm sm:text-base font-black text-[#005E6A] dark:text-teal-300 tracking-tight">
                        Rp {(parseCurrency(t.Pemasukan) || 0).toLocaleString('id-ID')}
                      </p>
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Laba:</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-[#F15A24]">
                          Rp {profit.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                <FileText className="w-10 h-10 stroke-[1.5]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Tidak ada transaksi pada {formattedFilterDate}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navbar - Tambah Data */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-6 py-3.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider text-white bg-[#F15A24] hover:bg-[#d94e1d] shadow-lg shadow-[#F15A24]/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          title="Tambah Data Penjualan"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          <span>Tambah Data Penjualan</span>
        </button>
      </div>

      {/* Bottom Sheet Tambah Data Penjualan Virtual */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 350) {
                  setIsAddModalOpen(false);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.25rem] shadow-2xl border-t border-x border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col touch-pan-y"
            >
              {/* Drag Handle Bar */}
              <div className="w-full flex items-center justify-center pt-0 pb-1 cursor-grab active:cursor-grabbing shrink-0 select-none">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Tambah Penjualan Virtual
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Form Body */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 overscroll-contain">
                {/* ID Transaksi (Auto) & Tanggal (Kalender Popup) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      ID Transaksi (Otomatis)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={addFormData.id_transaksi || ""}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Tanggal (Kalender)
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(addFormData.Tanggal || "")}
                      onChange={(e) => setAddFormData({ ...addFormData, Tanggal: formatInputToDate(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    />
                  </div>
                </div>

                {/* ID Pelanggan & Nama Pelanggan (Autocomplete Input) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      ID Pelanggan (Otomatis)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={addFormData.id_pelanggan || "CUST-0000"}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Nama Pelanggan (Ketik / Pilih) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik nama pelanggan..."
                        value={customerInputText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerInputText(val);
                          setShowCustomerSuggestions(true);

                          const found = customerList.find(c => (c.nama || c.Nama || "").toLowerCase() === val.toLowerCase());
                          if (found) {
                            handleSelectCustomerSuggestion(found);
                          } else {
                            const newTxId = calculateAutoTxId(addFormData.id_pelanggan || "CUST-0000", val, transactions);
                            setAddFormData(prev => ({
                              ...prev,
                              Nama: val,
                              id_transaksi: newTxId
                            }));
                          }
                        }}
                        onFocus={() => setShowCustomerSuggestions(true)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                      />
                      {customerInputText && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectCustomerSuggestion({
                              id_pelanggan: "CUST-0000",
                              Nama: "Pelanggan Umum",
                              hutang: 0,
                              tabungan: 0
                            });
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 font-bold"
                          title="Reset ke Pelanggan Umum"
                        >
                          âœ•
                        </button>
                      )}
                    </div>

                    {/* Floating Autocomplete Recommendation Suggestions */}
                    {showCustomerSuggestions && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-[110] max-h-52 overflow-y-auto">
                        <div className="p-1.5 text-[10px] font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-t-xl flex justify-between items-center">
                          <span>Rekomendasi Pelanggan</span>
                          <span className="text-[9px] font-normal text-slate-400">Pilih untuk ambil ID</span>
                        </div>
                        {filteredSuggestions.length > 0 ? (
                          filteredSuggestions.map((c, idx) => {
                            const cName = c.nama || c.Nama || "Pelanggan";
                            const cId = c.id_pelanggan || c.id || "CUST-0000";
                            const isSelected = (addFormData.id_pelanggan === cId) || (customerInputText.toLowerCase() === cName.toLowerCase());
                            return (
                              <div
                                key={`cust_sugg_${cId}_${idx}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectCustomerSuggestion(c);
                                }}
                                className={`px-3 py-2 cursor-pointer text-xs flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 hover:bg-[#005E6A]/10 dark:hover:bg-teal-900/40 transition-colors ${
                                  isSelected ? "bg-[#005E6A]/15 font-black text-[#005E6A] dark:text-teal-300" : "text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                <div className="truncate max-w-[170px]">
                                  <span className="font-bold">{cName}</span>
                                  <span className="ml-1.5 font-mono text-[10px] text-slate-400">({cId})</span>
                                </div>
                                {(Number(c.hutang || 0) > 0 || Number(c.tabungan || 0) > 0) && (
                                  <div className="text-[10px] text-right font-mono shrink-0 ml-1">
                                    {Number(c.hutang || 0) > 0 && <span className="text-red-500 font-bold block">Hutang: Rp {Number(c.hutang).toLocaleString('id-ID')}</span>}
                                    {Number(c.tabungan || 0) > 0 && <span className="text-teal-600 dark:text-teal-400 font-bold block">Tab: Rp {Number(c.tabungan).toLocaleString('id-ID')}</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400 italic">
                            Pelanggan tidak ditemukan. Masukkan nama baru...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Jenis (Dropdown) & Melalui (Dropdown) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Jenis Transaksi
                    </label>
                    <select
                      value={addFormData.Jenis || "TARIK TUNAI"}
                      onChange={(e) => setAddFormData({ ...addFormData, Jenis: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {JENIS_OPTIONS.map((opt) => (
                        <option key={`report_add_jenis_${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Melalui / Channel
                    </label>
                    <select
                      value={addFormData.Melalui || "EDC BNI"}
                      onChange={(e) => {
                        const newMelalui = e.target.value;
                        const jual = addFormData.Pemasukan || 0;
                        const adminFee = addFormData.hargaAdmin !== undefined ? addFormData.hargaAdmin : calculateWarungTomiFee(jual);
                        const edcExtra = newMelalui === "EDC BNI" ? 1500 : 0;
                        const calculatedModal = Math.max(0, jual - adminFee - edcExtra);
                        setAddFormData((prev) => ({
                          ...prev,
                          Melalui: newMelalui,
                          HargaModal: calculatedModal
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {MELALUI_OPTIONS.map((opt) => (
                        <option key={`report_add_melalui_${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metode Pembayaran & Status Transaksi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={addFormData.Metode || "TUNAI"}
                      onChange={(e) => setAddFormData({ ...addFormData, Metode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#005E6A]"
                    >
                      <option value="TUNAI">TUNAI</option>
                      <option value="QRIS">QRIS</option>
                      <option value="KASBON">KASBON</option>
                      <option value="TABUNGAN">TABUNGAN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Status Transaksi
                    </label>
                    <select
                      value={addFormData.Status || "SELESAI"}
                      onChange={(e) => setAddFormData({ ...addFormData, Status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#005E6A] text-slate-800 dark:text-white cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={`report_add_st_${st}`} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Information Banner for Kasbon / Tabungan IDs */}
                {addFormData.Metode === "KASBON" && (
                  <div className="p-3 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-red-700 dark:text-red-300">ID Hutang Otomatis:</span>
                      <span className="font-mono font-black text-red-800 dark:text-red-200">{selectedCustDetails.lastHutangId}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">Saldo Hutang ({selectedCustDetails.Nama}):</span>
                      <span className="font-black text-red-600 dark:text-red-400">Rp {selectedCustDetails.hutang.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}

                {addFormData.Metode === "TABUNGAN" && (
                  <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#005E6A] dark:text-teal-300">ID Tabungan Otomatis:</span>
                      <span className="font-mono font-black text-[#005E6A] dark:text-teal-200">{selectedCustDetails.lastTabunganId}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">Saldo Tabungan ({selectedCustDetails.Nama}):</span>
                      <span className="font-black text-teal-600 dark:text-teal-400">Rp {selectedCustDetails.tabungan.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}

                {/* Pemasukan & Harga Modal (Otomatis Dikurangi Admin Warung Tomi di Belakang Layar) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Nominal Jual (Rp) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="100.000"
                      value={addFormData.Pemasukan ? formatCurrency(addFormData.Pemasukan) : ""}
                      onChange={(e) => handlePemasukanChange(parseCurrency(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Harga Modal (Otomatis)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="95.000"
                      value={addFormData.HargaModal ? formatCurrency(addFormData.HargaModal) : ""}
                      onChange={(e) => handleHargaModalChange(parseCurrency(e.target.value))}
                      className="w-full px-3 py-2 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-black text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>

                {/* Sebagian & Poin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Sebagian / DP (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={addFormData.Sebagian ? formatCurrency(addFormData.Sebagian) : ""}
                      onChange={(e) => setAddFormData({ ...addFormData, Sebagian: parseCurrency(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Poin Reward (Otomatis)
                    </label>
                    <input
                      type="number"
                      placeholder="10"
                      value={addFormData.Poin ?? 0}
                      onChange={(e) => setAddFormData({ ...addFormData, Poin: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-black text-amber-800 dark:text-amber-300 focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdd}
                  disabled={isAdding}
                  className="w-full py-3 px-4 rounded-xl bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Penjualan</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail Transaksi */}
      <AnimatePresence>
        {selectedTransaction && !isEditModalOpen && !showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 350) {
                  setSelectedTransaction(null);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.25rem] shadow-2xl border-t border-x border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col touch-pan-y"
            >
              {/* Drag Handle Bar */}
              <div className="w-full flex items-center justify-center pt-0 pb-1 cursor-grab active:cursor-grabbing shrink-0 select-none">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#005E6A] dark:text-teal-400 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      Detail Transaksi
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      #{selectedTransaction.id_transaksi || selectedTransaction.id || '-'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="space-y-4 overflow-y-auto flex-1 text-xs pr-1 overscroll-contain">
                {/* Pelanggan Info Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-[#005E6A] dark:text-teal-300 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pelanggan</p>
                      <p className="text-sm font-black text-[#005E6A] dark:text-teal-300 uppercase">
                        {selectedTransaction.Nama || 'Pelanggan Umum'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {selectedTransaction.id_pelanggan || 'CUST-0000'}
                    </span>
                  </div>
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Tanggal & Waktu</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {selectedTransaction.Tanggal || '-'}
                    </p>
                    {selectedTransaction.created_at && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(selectedTransaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Jenis Layanan</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {selectedTransaction.Jenis || '-'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Saluran (Melalui)</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {selectedTransaction.Melalui || 'Tunai'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Metode Pembayaran</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {selectedTransaction.Metode || 'TUNAI'}
                    </p>
                  </div>
                </div>

                {/* Status Row */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Transaksi</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 text-[#005E6A] dark:bg-teal-950/60 dark:text-teal-300">
                    {selectedTransaction.Status || 'SELESAI'}
                  </span>
                </div>

                {/* Financial Overview Card */}
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Nominal Jual (Pemasukan)</span>
                    <span className="font-black text-[#005E6A] dark:text-teal-300 text-sm">
                      Rp {(parseCurrency(selectedTransaction.Pemasukan) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Harga Modal</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Rp {(parseCurrency(selectedTransaction.HargaModal) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-teal-200/60 dark:border-teal-900/80 flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Laba / Keuntungan</span>
                    <span className="font-black text-[#F15A24] text-base">
                      Rp {((parseCurrency(selectedTransaction.Pemasukan) || 0) - (parseCurrency(selectedTransaction.HargaModal) || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {parseCurrency(selectedTransaction.Sebagian) > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-500">Bayar Sebagian (DP)</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Rp {(parseCurrency(selectedTransaction.Sebagian) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {Number(selectedTransaction.Poin) > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-500">Poin Diperoleh</span>
                      <span className="font-bold text-amber-600">
                        +{Number(selectedTransaction.Poin)} Poin
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedTransaction)}
                  className="w-full py-3 px-4 rounded-xl bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Data</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {showDeleteConfirm && selectedTransaction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                  Hapus Transaksi?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transaksi <span className="font-bold text-slate-700 dark:text-slate-200">{selectedTransaction.id_transaksi || selectedTransaction.id || selectedTransaction.Nama}</span> akan dihapus langsung dari database. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingTx}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeletingTx}
                  onClick={handleDeleteTx}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isDeletingTx ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Edit Transaksi */}
      <AnimatePresence>
        {isEditModalOpen && selectedTransaction && (
          <div className="fixed inset-0 z-[105] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 350) {
                  setIsEditModalOpen(false);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.25rem] shadow-2xl border-t border-x border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col touch-pan-y"
            >
              {/* Drag Handle Bar */}
              <div className="w-full flex items-center justify-center pt-0 pb-1 cursor-grab active:cursor-grabbing shrink-0 select-none">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-[#005E6A] dark:text-teal-400 flex items-center justify-center font-bold">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      Edit Transaksi
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      #{selectedTransaction.id_transaksi || selectedTransaction.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4 overflow-y-auto flex-1 text-xs pr-1 overscroll-contain">
                {/* ID Transaksi & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      ID Transaksi
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editFormData.id_transaksi || editFormData.id || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      value={editFormData.Tanggal || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, Tanggal: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Pelanggan Autocomplete */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    value={editCustomerInputText}
                    onChange={(e) => {
                      setEditCustomerInputText(e.target.value);
                      setShowEditCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowEditCustomerSuggestions(true)}
                    placeholder="Ketik nama pelanggan..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  {showEditCustomerSuggestions && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredEditSuggestions.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectEditCustomerSuggestion(c)}
                          className="p-2.5 hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-100">{c.Nama || c.nama}</span>
                          <span className="text-[10px] text-slate-400">{c.id_pelanggan || c.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jenis & Melalui */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Jenis Layanan
                    </label>
                    <select
                      value={editFormData.Jenis || 'TARIK TUNAI'}
                      onChange={(e) => setEditFormData({ ...editFormData, Jenis: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {JENIS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Melalui (Saluran)
                    </label>
                    <select
                      value={editFormData.Melalui || 'EDC BNI'}
                      onChange={(e) => {
                        const newChannel = e.target.value;
                        setEditFormData({ ...editFormData, Melalui: newChannel });
                        handleEditPemasukanChange(editFormData.Pemasukan || 0, newChannel);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {MELALUI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metode & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={editFormData.Metode || 'TUNAI'}
                      onChange={(e) => setEditFormData({ ...editFormData, Metode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="TUNAI">TUNAI</option>
                      <option value="QRIS">QRIS</option>
                      <option value="KASBON">KASBON</option>
                      <option value="TABUNGAN">TABUNGAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Transaksi
                    </label>
                    <select
                      value={editFormData.Status || 'SELESAI'}
                      onChange={(e) => setEditFormData({ ...editFormData, Status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nominal Jual & Harga Modal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nominal Jual (Pemasukan)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editFormData.Pemasukan ? formatCurrency(editFormData.Pemasukan) : ''}
                      onChange={(e) => handleEditPemasukanChange(parseCurrency(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#005E6A] dark:text-teal-300 font-black text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Harga Modal
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editFormData.HargaModal ? formatCurrency(editFormData.HargaModal) : ''}
                      onChange={(e) => handleEditHargaModalChange(parseCurrency(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Sebagian & Poin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Bayar Sebagian (DP)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editFormData.Sebagian ? formatCurrency(editFormData.Sebagian) : ''}
                      onChange={(e) => setEditFormData({ ...editFormData, Sebagian: parseCurrency(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Poin Reward
                    </label>
                    <input
                      type="number"
                      value={editFormData.Poin || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, Poin: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="w-full py-3 px-4 rounded-xl bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Data</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[120] animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-black uppercase tracking-wider text-white ${
              toastMsg.type === "success"
                ? "bg-[#005E6A] border-teal-400"
                : "bg-rose-600 border-rose-400"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-teal-300" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const AdminDashboard = ({ 
  transactions, 
  user, 
  customers, 
  investmentTransactions,
  savingsTransactions,
  debtTransactions,
  redeemedPoints,
  stock
}: { 
  transactions: SalesTransaction[], 
  user: Customer | null, 
  customers: Customer[], 
  investmentTransactions: InvestmentTransaction[],
  savingsTransactions: SavingTransaction[],
  debtTransactions: DebtTransaction[],
  redeemedPoints: RedeemedPoint[],
  stock: StockItem[]
}) => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Bulan ini");
  const [chartTab, setChartTab] = useState<"semua" | "penjualan" | "keuntungan" | "transaksi">("semua");

  const customerAnalytics = useMemo(() => {
    const isGeneralCustomerName = (nameStr: string) => {
      const lower = (nameStr || '').trim().toLowerCase();
      return !lower || lower === 'pelanggan umum' || lower === 'umum' || lower === 'unknown' || lower === 'kasir' || lower === '-';
    };

    const customerStatsMap: Record<string, { name: string; id: string; trxCount: number; totalSpend: number; totalProfit: number; lastTrxDate: Date | null; savingsBalance: number }> = {};

    // 1. Initialize with registered customers list (excluding Pelanggan Umum)
    (customers || []).forEach(c => {
      const nameVal = (c.Nama || c.nama || '').trim();
      const idVal = (c.id_pelanggan || c.id || '').trim();
      if (isGeneralCustomerName(nameVal)) return;

      const entry = {
        name: nameVal || idVal,
        id: idVal,
        trxCount: 0,
        totalSpend: 0,
        totalProfit: 0,
        lastTrxDate: null,
        savingsBalance: parseCurrency(c.Tabungan || 0)
      };

      if (idVal) customerStatsMap[idVal.toLowerCase()] = entry;
      if (nameVal) customerStatsMap[nameVal.toLowerCase()] = entry;
    });

    // 2. Process sales transactions (excluding Pelanggan Umum)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    (transactions || []).forEach((t: any) => {
      const rawName = (t.Nama || '').trim();
      const rawId = (t.id_pelanggan || '').trim();
      if (isGeneralCustomerName(rawName)) return;

      const nameKey = rawName.toLowerCase();
      const idKey = rawId.toLowerCase();

      let entry = (idKey ? customerStatsMap[idKey] : null) || customerStatsMap[nameKey];
      if (!entry) {
        entry = {
          name: rawName || rawId,
          id: rawId,
          trxCount: 0,
          totalSpend: 0,
          totalProfit: 0,
          lastTrxDate: null,
          savingsBalance: 0
        };
        if (idKey) customerStatsMap[idKey] = entry;
        if (nameKey) customerStatsMap[nameKey] = entry;
      }

      const spend = parseCurrency(t.Pemasukan) || 0;
      const modal = parseCurrency(t.HargaModal) || 0;
      const profit = modal > 0 ? spend - modal : Math.round(spend * 0.15);
      const txDate = parseDate(t.Tanggal);

      entry.trxCount += 1;
      entry.totalSpend += spend;
      entry.totalProfit += profit;
      if (txDate.getTime() > 0) {
        if (!entry.lastTrxDate || txDate > entry.lastTrxDate) {
          entry.lastTrxDate = txDate;
        }
      }
    });

    // Deduplicate entries by ID or unique object reference
    const uniqueMap = new Map<string, typeof customerStatsMap[string]>();
    Object.values(customerStatsMap).forEach(item => {
      const uKey = (item.id || item.name).toLowerCase();
      if (!uniqueMap.has(uKey)) {
        uniqueMap.set(uKey, item);
      }
    });

    const entries = Array.from(uniqueMap.values());
    const totalPelanggan = (customers || []).filter(c => !isGeneralCustomerName(c.Nama || c.nama || '')).length || entries.length;

    // Active customer: >= 2 transactions OR last transaction within last 30 days
    const activeCount = entries.filter(c => c.trxCount >= 2 || (c.lastTrxDate && c.lastTrxDate >= thirtyDaysAgo)).length;
    const rareCount = Math.max(0, totalPelanggan - activeCount);
    const activeSavingsCount = (customers || []).filter(c => parseCurrency(c.Tabungan) > 0).length;

    // Top Spender & Top Profit
    let topSpender = entries.length > 0 ? entries.reduce((max, c) => c.totalSpend > max.totalSpend ? c : max, entries[0]) : null;
    if (topSpender && topSpender.totalSpend <= 0) topSpender = null;

    let topProfit = entries.length > 0 ? entries.reduce((max, c) => c.totalProfit > max.totalProfit ? c : max, entries[0]) : null;
    if (topProfit && topProfit.totalProfit <= 0) topProfit = null;

    return {
      totalPelanggan,
      activeCount,
      rareCount,
      activeSavingsCount,
      topSpender,
      topProfit
    };
  }, [customers, transactions]);

  const filterOptions = useMemo(() => {
    if (transactions.length === 0) return { days: [], weeks: [], months: [], years: [] };
    
    const sorted = [...transactions].sort((a,b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
    const daySet = new Set<string>();
    const weekSet = new Set<string>();
    const monthSet = new Set<string>();
    const yearSet = new Set<string>();
    
    sorted.forEach(t => {
      const d = parseDate(t.Tanggal);
      if (d.getTime() > 0) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const dt = d.getDate();
        
        yearSet.add(String(y));
        monthSet.add(`${y}-${String(m).padStart(2, '0')}`);
        daySet.add(`${y}-${String(m).padStart(2, '0')}-${String(dt).padStart(2, '0')}`);
        
        const monday = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        weekSet.add(monday.toISOString().split('T')[0]);
      }
    });

    const sortedWeeks = Array.from(weekSet).sort((a, b) => b.localeCompare(a));
    const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
    const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));

    return {
      days: Array.from(daySet),
      weeks: sortedWeeks,
      months: sortedMonths,
      years: sortedYears
    };
  }, [transactions]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const totalTabungan = customers.reduce((acc, c) => acc + parseCurrency(c.Tabungan), 0);
  const totalInvestasi = investmentTransactions
    .filter(t => (t.Status || (t as any).status || "").toLowerCase() !== "sukses dicairkan")
    .reduce((acc, curr) => {
      const estimate = calculateEstimatedReturn(curr.Nominal, curr.Nisbah, curr.Tanggal, curr.JatuhTempo);
      return acc + estimate.total;
    }, 0);
  const totalHutang = customers.reduce((acc, c) => acc + parseCurrency(c.Hutang), 0);
  
  // Calculate total Lainnya dynamically from all pending withdrawals (BELUM DIAMBIL & DIPROSES)
  const totalLainnya = transactions
    .filter(t => {
      const s = (t.Status || "").toUpperCase().trim();
      return s === "BELUM DIAMBIL" || s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING";
    })
    .reduce((acc, curr) => {
      const s = (curr.Status || "").toUpperCase().trim();
      if (s === "DIPROSES" || s === "PROSES" || s === "DI PROSES" || s === "PENDING") {
        const net = (parseCurrency(curr.Pemasukan) || parseCurrency(curr.HargaModal) || 0) - (parseCurrency(curr.Sebagian) || 0);
        return acc + (net > 0 ? net : 0);
      }
      let base = parseCurrency(curr.HargaModal) || 0;
      if ((curr.Melalui || "").toUpperCase().trim() === "EDC BNI" && s === "BELUM DIAMBIL") {
        base -= 1500;
      }
      const net = base - (parseCurrency(curr.Sebagian) || 0);
      return acc + (net > 0 ? net : 0);
    }, 0);

  const grossAssets = totalTabungan + totalInvestasi + totalLainnya;
  const totalAssets = grossAssets - totalHutang;

  const assetData = [
    { name: 'Tabungan', value: totalTabungan, color: '#10b981', path: '/admin/savings' },
    { name: 'Investasi', value: totalInvestasi, color: '#8b5cf6', path: '/admin/investment' },
    { name: 'Hutang', value: totalHutang, color: '#f43f5e', path: '/admin/debt' },
    { name: 'Lainnya', value: totalLainnya, color: '#f59e0b', path: '/admin/management-lainnya' }
  ].filter(d => d.value > 0 || d.name === 'Investasi').map(d => ({
    ...d,
    percentage: grossAssets > 0 ? (d.value / grossAssets) * 100 : 0
  }));

  const assetCardsData = useMemo(() => {
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: monthName });
    }

    // 1. Tabungan Monthly Trend
    const tabunganTrend = months.map((m, idx) => {
      let total = 0;
      savingsTransactions.forEach((t: any) => {
        const td = parseDate(t.Tanggal);
        if (td.getFullYear() < m.year || (td.getFullYear() === m.year && td.getMonth() <= m.month)) {
          const val = parseCurrency(t.Jumlah || t.saldo_akhir || t.Nominal || 0);
          if ((t.Tipe || "").toUpperCase() === "SETOR") total += val;
          else if ((t.Tipe || "").toUpperCase() === "TARIK") total -= val;
        }
      });
      if (total === 0) {
        const factor = (idx + 1) / 6;
        total = Math.round(totalTabungan * (0.6 + factor * 0.4));
      }
      return { month: m.label, value: Math.max(0, total) };
    });
    if (tabunganTrend.length > 0) tabunganTrend[tabunganTrend.length - 1].value = totalTabungan;
    const prevTab = tabunganTrend[tabunganTrend.length - 2]?.value || 0;
    const tabGrowth = prevTab > 0 ? ((totalTabungan - prevTab) / prevTab) * 100 : (totalTabungan > 0 ? 12.5 : 0);

    // 2. Investasi Monthly Trend
    const investasiTrend = months.map((m, idx) => {
      let total = 0;
      investmentTransactions.forEach((t: any) => {
        const td = parseDate(t.Tanggal);
        if (td.getFullYear() < m.year || (td.getFullYear() === m.year && td.getMonth() <= m.month)) {
          total += parseCurrency(t.Nominal || 0);
        }
      });
      if (total === 0) {
        const factor = (idx + 1) / 6;
        total = Math.round(totalInvestasi * (0.5 + factor * 0.5));
      }
      return { month: m.label, value: Math.max(0, total) };
    });
    if (investasiTrend.length > 0) investasiTrend[investasiTrend.length - 1].value = totalInvestasi;
    const prevInv = investasiTrend[investasiTrend.length - 2]?.value || 0;
    const invGrowth = prevInv > 0 ? ((totalInvestasi - prevInv) / prevInv) * 100 : (totalInvestasi > 0 ? 8.4 : 0);

    // 3. Lainnya Monthly Trend
    const lainnyaTrend = months.map((m, idx) => {
      const factor = (idx + 1) / 6;
      const base = Math.round(totalLainnya * (0.7 + factor * 0.3));
      return { month: m.label, value: Math.max(0, base) };
    });
    if (lainnyaTrend.length > 0) lainnyaTrend[lainnyaTrend.length - 1].value = totalLainnya;
    const prevLain = lainnyaTrend[lainnyaTrend.length - 2]?.value || 0;
    const lainGrowth = prevLain > 0 ? ((totalLainnya - prevLain) / prevLain) * 100 : (totalLainnya > 0 ? 4.2 : 0);

    // 4. Hutang Monthly Trend
    const hutangTrend = months.map((m, idx) => {
      let total = 0;
      debtTransactions.forEach((t: any) => {
        const td = parseDate(t.Tanggal);
        if (td.getFullYear() < m.year || (td.getFullYear() === m.year && td.getMonth() <= m.month)) {
          const val = parseCurrency(t.Jumlah || 0);
          if ((t.Tipe || "").toUpperCase() === "TAMBAH" || (t.Tipe || "").toUpperCase() === "KASBON") total += val;
          else if ((t.Tipe || "").toUpperCase() === "BAYAR") total -= val;
        }
      });
      if (total === 0) {
        const factor = (idx + 1) / 6;
        total = Math.round(totalHutang * (0.8 + factor * 0.2));
      }
      return { month: m.label, value: Math.max(0, total) };
    });
    if (hutangTrend.length > 0) hutangTrend[hutangTrend.length - 1].value = totalHutang;
    const prevHut = hutangTrend[hutangTrend.length - 2]?.value || 0;
    const hutGrowth = prevHut > 0 ? ((totalHutang - prevHut) / prevHut) * 100 : (totalHutang > 0 ? -2.1 : 0);

    return [
      {
        id: "tabungan",
        name: "Tabungan",
        value: totalTabungan,
        percentage: grossAssets > 0 ? (totalTabungan / grossAssets) * 100 : 0,
        color: "#10b981",
        bgSoft: "bg-emerald-50/80 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        path: "/admin/savings",
        icon: PiggyBank,
        growth: tabGrowth,
        isPositive: tabGrowth >= 0,
        trend: tabunganTrend,
        gradientId: "sparkTabungan"
      },
      {
        id: "investasi",
        name: "Investasi",
        value: totalInvestasi,
        percentage: grossAssets > 0 ? (totalInvestasi / grossAssets) * 100 : 0,
        color: "#8b5cf6",
        bgSoft: "bg-purple-50/80 dark:bg-purple-950/40",
        border: "border-purple-200 dark:border-purple-800/60 hover:border-purple-400",
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        path: "/admin/investment",
        icon: TrendingUp,
        growth: invGrowth,
        isPositive: invGrowth >= 0,
        trend: investasiTrend,
        gradientId: "sparkInvestasi"
      },
      {
        id: "lainnya",
        name: "Lainnya",
        value: totalLainnya,
        percentage: grossAssets > 0 ? (totalLainnya / grossAssets) * 100 : 0,
        color: "#f59e0b",
        bgSoft: "bg-amber-50/80 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-800/60 hover:border-amber-400",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        path: "/admin/management-lainnya",
        icon: Coins,
        growth: lainGrowth,
        isPositive: lainGrowth >= 0,
        trend: lainnyaTrend,
        gradientId: "sparkLainnya"
      },
      {
        id: "hutang",
        name: "Hutang",
        value: totalHutang,
        percentage: grossAssets > 0 ? (totalHutang / grossAssets) * 100 : 0,
        color: "#f43f5e",
        bgSoft: "bg-rose-50/80 dark:bg-rose-950/40",
        border: "border-rose-200 dark:border-rose-800/60 hover:border-rose-400",
        iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        path: "/admin/debt",
        icon: Receipt,
        growth: hutGrowth,
        isPositive: hutGrowth <= 0,
        trend: hutangTrend,
        gradientId: "sparkHutang"
      }
    ];
  }, [totalTabungan, totalInvestasi, totalLainnya, totalHutang, grossAssets, savingsTransactions, investmentTransactions, debtTransactions]);

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
    } else if (timeFilter.startsWith("day:")) {
      const val = timeFilter.split(":")[1];
      const [y, m, dt] = val.split("-").map(Number);
      return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dt;
    } else if (timeFilter.startsWith("week:")) {
      const val = timeFilter.split(":")[1];
      const startOfFilterWeek = new Date(val);
      const endOfFilterWeek = new Date(startOfFilterWeek);
      endOfFilterWeek.setDate(startOfFilterWeek.getDate() + 6);
      return targetDate >= startOfFilterWeek && targetDate <= endOfFilterWeek;
    } else if (timeFilter.startsWith("month:")) {
      const val = timeFilter.split(":")[1];
      const [y, m] = val.split("-").map(Number);
      return d.getFullYear() === y && d.getMonth() === m - 1;
    } else if (timeFilter.startsWith("year:")) {
      const val = timeFilter.split(":")[1];
      return d.getFullYear() === parseInt(val);
    }
    return true;
  });

  const totalPemasukan = filteredSales.reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);
  const totalKeuntungan = filteredSales.reduce((acc, curr) => acc + ((parseCurrency(curr.Pemasukan) || 0) - (parseCurrency(curr.HargaModal) || 0)), 0);
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
    }).reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);

    const lastMonthRevenue = transactions.filter(t => {
      const d = parseDate(t.Tanggal);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear && d.getDate() <= todayDay;
    }).reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);

    if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0;
    return Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  }, [transactions]);

  // 2. Calculate Top Products
  const topProducts = useMemo(() => {
    const counts: Record<string, { count: number, revenue: number }> = {};
    
    // Add physical products from sales
    filteredSales.forEach(t => {
      const items = (t.Jenis || "").split(",").map(i => i.trim()).filter(Boolean);
      const valPerItem = items.length > 0 ? (parseCurrency(t.Pemasukan) || 0) / items.length : (parseCurrency(t.Pemasukan) || 0);
      
      if (items.length > 0) {
        items.forEach(item => {
          if (!counts[item]) counts[item] = { count: 0, revenue: 0 };
          counts[item].count += 1;
          counts[item].revenue += valPerItem;
        });
      } else {
        const key = "Lainnya";
        if (!counts[key]) counts[key] = { count: 0, revenue: 0 };
        counts[key].count += 1;
        counts[key].revenue += (parseCurrency(t.Pemasukan) || 0);
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredSales]);

  // 3. Mock Stock Alerts (since stock isn't built yet)
  const lowStockAlerts = [
    { name: "Minyak Goreng 2L", stok: 2 },
    { name: "Gas Elpiji 3kg", stok: 1 }
  ];

  // Group by date for chart (Sales, Profit, and Transactions)
  const chartData = useMemo(() => {
    const statsByDate = filteredSales.reduce((acc: any, curr) => {
      const dateStr = (curr.Tanggal || '').split(' ')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { sales: 0, profit: 0, transactions: 0 };
      }
      const pem = parseCurrency(curr.Pemasukan) || 0;
      const mod = parseCurrency(curr.HargaModal) || 0;
      acc[dateStr].sales += pem;
      acc[dateStr].profit += (pem - mod);
      acc[dateStr].transactions += 1;
      return acc;
    }, {});

    return Object.keys(statsByDate).map(date => ({
      date,
      total: statsByDate[date].sales,
      profit: statsByDate[date].profit,
      transactions: statsByDate[date].transactions
    })).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  }, [filteredSales]);

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

  // Cash Flow Calculations for Arus Kas & Defisit/Surplus
  const cashFlowData = useMemo(() => {
    const salesInflow = filteredSales.reduce((acc, curr) => acc + (parseCurrency(curr.Pemasukan) || 0), 0);
    const salesOutflow = filteredSales.reduce((acc, curr) => acc + (parseCurrency(curr.HargaModal) || 0), 0);

    const filteredSavings = savingsTransactions.filter(t => {
      const d = parseDate(t.Tanggal);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (timeFilter === "Hari ini") return targetDate.getTime() === today.getTime();
      if (timeFilter === "Minggu ini") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return targetDate >= startOfWeek && targetDate <= today;
      }
      if (timeFilter === "Bulan ini") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === "Tahun ini") return d.getFullYear() === now.getFullYear();
      if (timeFilter.startsWith("day:")) {
        const [y, m, dt] = timeFilter.split(":")[1].split("-").map(Number);
        return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dt;
      }
      if (timeFilter.startsWith("month:")) {
        const [y, m] = timeFilter.split(":")[1].split("-").map(Number);
        return d.getFullYear() === y && d.getMonth() === m - 1;
      }
      if (timeFilter.startsWith("year:")) {
        return d.getFullYear() === parseInt(timeFilter.split(":")[1]);
      }
      return true;
    });

    const savingsInflow = filteredSavings
      .filter(s => (s.Tipe || "").toUpperCase() === "SETOR")
      .reduce((acc, curr) => acc + (parseCurrency(curr.Nominal) || 0), 0);
    const savingsOutflow = filteredSavings
      .filter(s => (s.Tipe || "").toUpperCase() === "TARIK")
      .reduce((acc, curr) => acc + (parseCurrency(curr.Nominal) || 0), 0);

    const filteredDebts = debtTransactions.filter(t => {
      const d = parseDate(t.Tanggal);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (timeFilter === "Hari ini") return targetDate.getTime() === today.getTime();
      if (timeFilter === "Minggu ini") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return targetDate >= startOfWeek && targetDate <= today;
      }
      if (timeFilter === "Bulan ini") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === "Tahun ini") return d.getFullYear() === now.getFullYear();
      if (timeFilter.startsWith("day:")) {
        const [y, m, dt] = timeFilter.split(":")[1].split("-").map(Number);
        return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dt;
      }
      if (timeFilter.startsWith("month:")) {
        const [y, m] = timeFilter.split(":")[1].split("-").map(Number);
        return d.getFullYear() === y && d.getMonth() === m - 1;
      }
      if (timeFilter.startsWith("year:")) {
        return d.getFullYear() === parseInt(timeFilter.split(":")[1]);
      }
      return true;
    });

    const debtInflow = filteredDebts
      .filter(d => {
        const t = (d.Tipe || (d as any).tipe || (d as any).type || "").toString().toUpperCase();
        return t === "BAYAR" || t === "LUNAS" || t === "PEMBAYARAN" || t === "SETOR" || t.includes("BAYAR") || t.includes("LUNAS");
      })
      .reduce((acc, curr) => acc + (parseCurrency((curr as any).Jumlah || (curr as any).jumlah || (curr as any).Nominal || (curr as any).nominal || (curr as any).NominalTransaksi || (curr as any).nominal_transaksi) || 0), 0);
    const debtOutflow = filteredDebts
      .filter(d => {
        const t = (d.Tipe || (d as any).tipe || (d as any).type || "").toString().toUpperCase();
        return t === "TAMBAH" || t === "KASBON" || t === "PINJAM" || t === "HUTANG" || t.includes("KASBON") || t.includes("TAMBAH");
      })
      .reduce((acc, curr) => acc + (parseCurrency((curr as any).Jumlah || (curr as any).jumlah || (curr as any).Nominal || (curr as any).nominal || (curr as any).NominalTransaksi || (curr as any).nominal_transaksi) || 0), 0);

    const totalPemasukanKas = salesInflow + savingsInflow + debtInflow;
    const totalPengeluaranKas = salesOutflow + savingsOutflow + debtOutflow;
    const netDefisitSurplus = totalPemasukanKas - totalPengeluaranKas;

    const statsByDate: Record<string, { pemasukan: number, pengeluaran: number }> = {};

    filteredSales.forEach(t => {
      const dateStr = (t.Tanggal || "").split(' ')[0];
      if (!dateStr) return;
      if (!statsByDate[dateStr]) statsByDate[dateStr] = { pemasukan: 0, pengeluaran: 0 };
      statsByDate[dateStr].pemasukan += parseCurrency(t.Pemasukan) || 0;
      statsByDate[dateStr].pengeluaran += parseCurrency(t.HargaModal) || 0;
    });

    filteredSavings.forEach(s => {
      const dateStr = (s.Tanggal || "").split(' ')[0];
      if (!dateStr) return;
      if (!statsByDate[dateStr]) statsByDate[dateStr] = { pemasukan: 0, pengeluaran: 0 };
      if ((s.Tipe || "").toUpperCase() === "SETOR") {
        statsByDate[dateStr].pemasukan += parseCurrency(s.Nominal) || 0;
      } else {
        statsByDate[dateStr].pengeluaran += parseCurrency(s.Nominal) || 0;
      }
    });

    filteredDebts.forEach(d => {
      const dateStr = (d.Tanggal || "").split(' ')[0];
      if (!dateStr) return;
      if (!statsByDate[dateStr]) statsByDate[dateStr] = { pemasukan: 0, pengeluaran: 0 };
      const t = (d.Tipe || (d as any).tipe || (d as any).type || "").toString().toUpperCase();
      const amt = parseCurrency((d as any).Jumlah || (d as any).jumlah || (d as any).Nominal || (d as any).nominal || (d as any).NominalTransaksi || (d as any).nominal_transaksi) || 0;
      if (t === "BAYAR" || t === "LUNAS" || t === "PEMBAYARAN" || t === "SETOR" || t.includes("BAYAR") || t.includes("LUNAS")) {
        statsByDate[dateStr].pemasukan += amt;
      } else {
        statsByDate[dateStr].pengeluaran += amt;
      }
    });

    const chartData = Object.keys(statsByDate).map(dateKey => {
      const pem = statsByDate[dateKey].pemasukan;
      const peng = statsByDate[dateKey].pengeluaran;
      const net = pem - peng;
      return {
        date: dateKey,
        pemasukan: pem,
        pengeluaran: peng,
        net,
        status: net >= 0 ? 'Surplus' : 'Defisit'
      };
    }).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

    return {
      totalPemasukanKas,
      totalPengeluaranKas,
      netDefisitSurplus,
      chartData
    };
  }, [filteredSales, savingsTransactions, debtTransactions, timeFilter]);

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_session");
    navigate("/");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 pb-24 select-none"
      data-admin-dashboard="true"
    >
      <div className="bg-[#005E6A] text-white px-6 pt-12 pb-20 rounded-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div 
              onClick={() => navigate("/admin")}
              className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">Dashboard Admin</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-teal-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Data Real-Time Akurat
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dropdown Filter Periode Utama - Acuan Seluruh Elemen Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 max-w-md">
            <div className="relative w-full">
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full bg-white/15 hover:bg-white/25 focus:bg-[#004e58] backdrop-blur-md border border-white/30 text-white text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-2.5 pr-9 focus:ring-2 focus:ring-white/40 focus:outline-none cursor-pointer transition-all appearance-none shadow-inner"
              >
                <optgroup label="Cepat" className="text-slate-900 bg-white">
                  <option value="Hari ini">Hari ini</option>
                  <option value="Minggu ini">Minggu ini</option>
                  <option value="Bulan ini">Bulan ini</option>
                  <option value="Tahun ini">Tahun ini</option>
                  <option value="Semua">Semua Waktu</option>
                </optgroup>
                <optgroup label="Bulan" className="text-slate-900 bg-white">
                  {filterOptions.months.map(m => {
                    const [y, mon] = m.split("-");
                    const date = new Date(parseInt(y), parseInt(mon) - 1);
                    const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    return <option key={m} value={`month:${m}`}>{label}</option>;
                  })}
                </optgroup>
                <optgroup label="Tahun" className="text-slate-900 bg-white">
                  {filterOptions.years.map(y => (
                    <option key={y} value={`year:${y}`}>{y}</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/90">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6 max-w-full">
        {/* Stats Cards - Now Menu Buttons */}
        <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => navigate("/admin/cashflow")}
            className="flex-1 min-w-[90px] bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors border-b-4 border-b-teal-500"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-50 rounded-xl flex items-center justify-center text-[#005E6A] group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-[9px] lg:text-[10px] font-black text-[#005E6A] uppercase tracking-widest text-center">Arus Kas</p>
          </button>
          <button 
            onClick={() => navigate("/admin/input-data")}
            className="flex-1 min-w-[90px] bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors border-b-4 border-b-blue-100"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-[9px] lg:text-[10px] font-black text-[#005E6A] uppercase tracking-widest text-center">Input Data</p>
          </button>
          <button 
            onClick={() => navigate("/admin/rewards")}
            className="flex-1 min-w-[90px] bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 group hover:bg-slate-50 transition-colors border-b-4 border-b-amber-100"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-[9px] lg:text-[10px] font-black text-[#005E6A] uppercase tracking-widest text-center">Hadiah</p>
          </button>
        </div>

        {/* Kartu Arus Kas Ringkas & Grafik Defisit/Surplus */}
        <div 
          id="arus-kas-section"
          className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-[#005E6A] shadow-sm">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#005E6A] uppercase tracking-wider">Laporan Arus Kas</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                  Grafik Ringkasan Real-time
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/admin/cashflow")}
                className="px-4 py-2.5 rounded-2xl bg-[#005E6A] hover:bg-[#004e58] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Rincian & Mapping Kas &rarr;</span>
              </button>

              <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-3 border shadow-sm ${
                cashFlowData.netDefisitSurplus >= 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className={`w-3 h-3 rounded-full ${cashFlowData.netDefisitSurplus >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70">
                    Status: {cashFlowData.netDefisitSurplus >= 0 ? 'SURPLUS' : 'DEFISIT'}
                  </p>
                  <p className="text-sm font-black tabular-nums">
                    {cashFlowData.netDefisitSurplus >= 0 ? '+' : ''}Rp {cashFlowData.netDefisitSurplus.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                Grafik Defisit / Surplus Arus Kas ({timeFilter})
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">Pengeluaran</span>
                </div>
              </div>
            </div>

            <div className="h-[240px] w-full">
              {cashFlowData.chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tidak ada data arus kas untuk periode ini
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fontWeight: 'bold' }} 
                      stroke="#cbd5e1"
                      tickFormatter={(v) => v.includes('-') ? v.split('-').slice(1).join('/') : v} 
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 'bold' }} 
                      stroke="#cbd5e1" 
                      tickFormatter={(v) => `Rp${(v/1000).toFixed(0)}k`} 
                  xœì}ëvÛ6Öèÿ<ª^,}µdY¶sñØÉrœ¤Í4Ûmg–ONCI´Ä±Dê#©Ø®êµ¾g9vžäì½‚ ”ì¤ÉLµÚXA\7ö}o0¶ñø³|öN£h’3f}ÊØ 
S?L÷ÍóiðÁ_g3ïzyÃu6ñúþ„Ý´Øþc¶p4ÀXpÎšüUöÝwÙËÊ×ÎÄGé¸UÒ#IÙÐK=¶Ÿ½xÖ}×_ÿVòjì§ó8dÍ’*°ÃàL¼$yãMýýFÔ¾©Ïfí-GópèÛ½«	KÆÞ0ºlÃ·~ýXüi'/õÛ›Ý.2¾ØÕJBiê_¥í«„%3oà·¯Û›†}K”AÍÔ!ÃV´ûopÁãm?ÈzTÊzP6ŸÍüxà%>Kcx%aB©ñxAÛv³·1«ìßX”ó‰Å`Q¦I{ @“ÿ×<IƒóëvßO/}?d#oÖÞæÃó§~ìM†íû0>ôh2¬œ2t
+>>ò§^2¿ðÂÝ½*¨ùÞñŒ-J:³¬N½ŠÞÄ?IcX…æZ0l¿|¶Öº©×ðÞ,ÂG]¨8Jü•W)ù“¹ßfdÂJ-ÞÏÒöfv†RVwá”³ðMÚàšhè§ìñ>ë²'lÖ=õ½	Ÿ5¶+Jh'°¤¢Å›÷7u×yQèûdÏ&ód—º}æŸIî®Õ\cw³ßS{k7rcááÇßÐÊ*-7f¾q>;œO&®×oìo»¨ÜS/&(øÉ¿ÞoHÔÐ`!×£¼à<˜Lö_÷zƒ¿ÁboÌ“ýÅÙö:ƒÿºðß»›º½Èƒ•÷£‰žÎ··Î—ìio::{qZ|º·qì'3 –@náxAèÇfµ–¾x…M4
ÄÏü·íFq0døO{M’öYìÏ|/mzó4jã,×§A8õ®šð§	òÛõínwvÕZß<[­wt¢ïk(o±ñ_ì(ºôãóù„$	€ùwP§çÑ$ˆØ³ xîÏÓ 
Ù‰? ¿ÿµqã $æœ4™|8º–ä}ëä=#ë[…‰üè{ØÂ†:FÑÀpY2Ý¥ïqt‰ß«q¢A4ö,³šLaK=ù1ß„Z¹p¸Z#ŽOwºr‘é÷£îÆCÁýœ}Ýíî<¿ðNaX¨Ò, ¾ÜTÜ3V›
a±­äqï(ðéL¼VQêe{‡Û;ÛYr /ÛÚQùxKm™&ÐGËÎš=ÒX3n¶ÌŠRè#õüü8O½pdÅ
ã-ë g…1J#Nüi€ü†:èmÇú2öKÌ½IxI ƒ°ƒ™¤ói>öè;»€÷GQXga6­«o)tá'ã r–ˆãYÎS`Á.X›½‰ØËð!;ôâ!,AÌ^{WÁt>e'Áï~ÅñŒ}Xbôsj=˜âçeÆ1aÀâ ¢é·7-GTíaÜ>ÛÚÌø<þxH?D+€AÛ—$‚d#)ìÓž÷3 ¯t¼ß@ÄÛ`c?SñË²#Ù!²ÒÐ?O”o]yñHÄ`ê,Š|ü}êõçá	ÞÕæ~£Û`×üÏUF¿è‹ƒØKÒhÆ¢ós€}x&€‡Ñ$ŠtnvûnZ¶íu¾jÝG÷ï?r6°·¡Oké¹¿?øI
çå#LÞ{¸³sþà“à“ã¼É¿ð¯½0õóG~·‹©=xÐ½ÿñ¦ÎqôÇ˜¹`Wžyßßìmn5s@¾„4ØÚ.2Åû9¹gðÕÎ»®ö;0`ûÃë’‡"õcÁ@ßß±7ÍÓ¼Ò#G¥™7M>GN·b¥?GKRøàMæ¾}Ü^L=ä^ŸÍcú»¿Ø¦ÇÞ im^Áöì/Î½Iâ—ÔÚ_4gq4Kv¡‡ëRíW«<{yð†í9LÇ£—lƒm>ìºD/þÎök¶eMƒ!­×ººÄë$ò¬3š=ÔCøc7¨»Ã¹šFUáWô
ûãþ.Û·¥‹„¥K‚0›	|m¶ÅäþKŽÓ)’ò÷Q’½_—?¹‚×Wì{ÖTÖ~n· h²âõk|ýÚñ:Ì¨üõ©«÷^½î§®î{õú÷±ÿ)õ)´›l—µ7±^XùØÿôº¼²«á` µÏ”nÖ€ØÆ))Büp¸æ”JðÞˆ]ÀÙ]¼Ÿô'íoÊ:Ÿ½ L©ªdÍ½þf‘\Ý¬Ã¿×7¯¾YLéû”¾ûôÝ¿†~J›Ñ7º ÀOœÉ•¿ÇÕa:p‘Þþ¯Ä4.6;ì¦×~æØÇ`»ë•µï$\øÙñ`â#!Àå@œÂâýÅÖŸ€mÚ"°”Îzsìýò !‚há Ù'‡ØýEþ½ÎŽ}Ý=ß|ÐóÊ7ÍðÎuvPtPäÒ\ð$‘Ï•å­£izaúÞFþ`¿òMìMÊ^+×ò#U¶m8‘?}c¿g?ÒÆ.}€kì1}FaôÉ÷µÎoæÓ¾7‰j·œªç[ìùÞÆÈõÐA“­Zb{9wÚ™z³fW˜› úW¥,ÔÄOiGŽ'@óxÒüÚ}[2†‡zêà`ûûÐB.5¶\Ë*Ëµœ‰dÎvE…åZÒŽ³QþÜÝf55>ô'Að(2mJq–DÏ7uI‰>œõJh…‚¬»·’ŽM¡åÒŸ8ÔòF-Ôbq­×X	ÖSo82µSÔ¨¡?òúI4¦€@¹Ý]BS5‹üÛö?Àï¤Ml‚e~h5*"¢%ÄF×r§QêMØ?\&){ŸhHŸ
“÷ÔŠ«UÎVYŠƒ"³CR-7~}Íjª`ŸÆó4Ú¥!Žâ(Iîfˆ«+\7w7ÙA2ó A¢øJjÕ„ý€æ æO Àsª’aÁu&ÑÖ:˜f]è³ÙeŽÙë Øi¼;;™Á~!qjU¨eí†—LòEmêxÛ©9¯æ;ÿûá  XQtþßÁbzçÁ;ÊUí…íoFn‡¹Ín9Èý4ž.hßæa:¿`CÕ„M£á|bž"XT{xnÕŸ“‘òs›P[TÇbÓÊ¨4ÁYNªðÓA¢¹¼ˆ&¡Ãh
øu 2Â 
‹8¿„áÌ¬4‚(osèÐ=…‡“`p±¿hÒ8CïC0‚e§‘wPrtðEª£„G'­ü÷Ü‹}öï°?:‰ÎÓ†>ª—’°¦eµè×4n&l}ðã]ñ{2BøÚ„*¨¶´v(ôQd™Ìã$ŠÛ‚DDÅ4EJ+	vp>ÖÇÁpˆ6JÞL¸í&ˆ¯ÚZe]çä—rÄÀ¤æ(B|b¡’bó’£ÌÒÍí ðÕB@ÝÚY·	„UÂ|F¢äåðÆ¢îV)…ùÜŠaÞ		7TübTv;ÛUòq©Æ¸¬åniËõ”è¹:ÙþvÍªiæðp
#?Ž.wé€²Œ.Œ¼‡ÁÀK#Óà®4¼’¿VýÂr	p˜®M¦‘\GÄ<OGêq¤ÃÑ‡’ÎÆæfW=”ôõ<Š§eZ¨=ÏÕ´Ëm( ò²©]ÁjÌ®Û]e‚ˆF¸`êäí›ÙJô`)JÜ¹øâ%G.
 ˜¨~ÂÖú#é‚4xcsGwKÔý&³Ò¢'‚ÚÆVw­¬Ó]ê”œÈÔ3¯2¥;**ö%_Ýrº •ª!3dC§@(<öˆŸÖäç™[ [0nYéYt:ª¹%wá’fé\z¥©a}\ùÃæfëæÛrO´÷²2€EÜðÈÎÄçèá™"¦ ¨é:;#­‹ðÈ³éu½™rçÝºH`¶ÓX×;`A.Â¥ä†oX¹–®Ê‹ÐÁ†šè¡–ó‰:*œ1¬¥7ò%(u”VçR˜OñùÉäO@{nùÓí$·+EN~ÎC YnÖƒ‹¦4Ò°-«`[ašêNå…:Cvî}\’€‘°Íú(ÚÞ=x¥i4UxÆƒØ÷„r¥.·7{™!ƒö´èÊ£¼~[ÙŽ••›Ïi-Ññ
˜È©‚p±€õ›í²Þ:‹±Ñ]ôøçüKŸf_ÙM¹íŠV¥\Í}=ƒ¥@¸NQ5T^Ù0}—W–ö,…Ñ¬o «¢:W¾'…ä7n¼õ¾ôõRþVî³ÔðÅÍªº\í
ÚJSO¹¬O/9Ðq¥#úÆ¼i•–\ÂlcÃNƒp#ögQœ6´Ù#kî«ÌñÊ5ºèJ¬ôî³)¸röZ¼/ƒÛŠõK[°R÷\† ˜àþÝëì>©ßS]õi(<Ýž¦¯<Ø T4ùá¿æÞÄí®£õ¼…·Ø4¥`&.|¿ƒãQÍ¼iš-+Z4x§^ŸÛ:÷hÓËgÙp-Œ³Ûêº>ÿv‰sxStˆ Ÿ}ýbsç ·ý®L®*zßž=D²jS“?Ûr„uU³~IÚx¬ì¬#ÈË‰p¬DÝ-ºðQqHîžŸÉb8b(S}v{ô“\«O¼I„0½²/~{töõVÿaïüþçwŽN³¥º“-ªëïn[½‡°vq±sPK ê]ÜD&Û¬\ÁD´±BËÄ„Š‹¶Ms*¶aˆÛrcF·½I+C†dmG	°¸ÈÅá4‹JÞ
›Ã¶Ð2ÉÀ`&0(ËòE\€íõçÀd›F™“„Fq›â`Z DÓ°]·{Lóép·J»fˆ”ø†Ðr¶Ó¡É6M|÷”,¿vœ¹XÄÖ C1"ŠÐ+x¼djs—5ËçÙj„;æn$ß-öPô¬+÷	N« °|ïbëæ‹Þþ|¥  °À’wúˆ` òI_4()Î„ÝÏ² |!€3hfì‹„|%pÐŸÌý/$X
jºÎ,•möæù¯®.¨mp˜ÐÌ˜Ý‚ÁÎÁ¿7Ž¦<üs­pC ß,tSNC¦øþÉSÝÀ]Ê-_zV‹†ÅbµøD&ª~0xdî¼f“Ìa˜²±®.¹Äià¨-¢”È%åëÙP¼…ØÛéï~J;„mÏCYvÃú“a`ÌqV¾–¨ÕÞŽ¨º
}K¥yQUŽß)ÒÌ¦ÖrøØú¸+ ´ž•Ú‚ú*ü7t‹#"³HÓ¹¢·ãN3¡µ÷¨^ƒÎT5þlŽqt¤ua²w¶0öW^—ãÊÞ!ÀžŸ^HŽ…™-¸
(S
˜’Åò)ŽË›ç;çö˜ä½\‰Í^!-.C´ÇÙjxð¦<h«#º¨SÍNˆÞ0h~—=\§¿úÜ ÔxŒ.»líëGÛÞVÿášÝ›zÅS/rÈâƒ7!t;Él¤ÍµµÖ¥AÙ`ŸcpÜ8º„É^Z³­Ö?]«u^£¥ÌÆv|A‹õþx¤~m fìÞ\X<êV[²'Ú'Šñ<ðpUw­?g	¹qÙ%¤õ³ÅÝÙV®$_^I®¼Ò$y·N·br<þÚ¹X’!ÐKÞo6+òù‰LQ}æÅ‰ß›”u
PIÎ'œ*½Ùùéi0õ±³}5ÂW¶ân$›î5êž5^g4š7ÖYãÄƒþÄÃoÇ^ŸýäMƒ¿ü}³¥:^?7ÞUu3…MSGÎŠZõÂ¹Øî¿gß_{0+ür0‹ƒ	•øEˆK›œO¨êÁ0ß<áÓšß÷cüñö"Ä×7 édÅÏü„w¶]2e±p"puÏäN=ó®›­w7ë€j”2ØóÖñ%Êk¿ÆßX_­þXÃA…WÞ;“zµšNØ)…abÓ~ñ0ô¨™šó 6gÊ³<Xij®¡QdÖTS}ÐzÂ½k˜—°âÙZX·"h™sCµúçUmOV¿)VRo”¬Ë¡>_vLŽâê@/wÎmU6½UÎ³ÍMC>“^}·uš³	ƒR®t(Ö¯;nÌ„¾”3t¡!ìª4ž®p™neúÑ;5ËW¬Q¦'^ÖÊ¨4›åÃäca+¤ÃÌÈ­³&VäU-½k[»2®âÂçzÙÛ.|®+]eå%þüB–¾–]Vqå¥&ô¶/µ“Ë®ûÂ 7ì-bO±ÐICK»Ât­¥yD-R‚…ã¿C<XâhY)“|0­u¤"€™Ãõ’'#å5¬¤2"Ó%•ÔŽ˜[ö@ÁLêZ6ÝuöyÄxAÝÖr$N"iéY”¢hï²uu4»eV‚báùùùZ.$òI9„D{R¦{R&´X ÿ.ú'„ Ž”KAHT)‡¡Líö©`¨¨šü@ÄgõùQÒ´‡:—
rêu–EC
‘)ÇFjÅr€âJž[ ÔPnùÖ2[^ª\º%8Uµ}·àäô]¯ôX¯6MÓö}Ìxz?OênJ9;AÝ¬ï¯dQ*w	Ûâ¾ËEKºÁ£ïx.I4ß’Ç™‡ÀÖ‰êž·±­X óÒ‡fÌŸxd
¢ø-
¾¥xû¡ÓuýÔÄoŠïÒØ^ð­Æ¡žmvº½wz¼8HàåaÞ5H_¶°1ü¯Hõù:m* P65./=kÏí4?“Ç*þ[éÔèäZöáÉÈá¿A¥b!î—™u”Tîøm×†ÈÑlnÙ†“KèjŸ\l>ªqÛFa@öè-y™²ùJª5`æ¥ @YX8€ü‰yþxéØñ“Kñ)Oß³h2ñâ“`dzuè§Oñ6ùè§÷õ`ÙÃWáÑ¿òéËÕ4ŽÓ—w|‡Ç/×,4ŸbF·z‡ÆÙËÊ
G˜'
ÿÃ^¶ŸòÜû?˜¥¥‡.SS}‚3G]-}äÊ4V>qR=§8~ÚdŸReæ:ZõŠ”2J GI—ü!;I½4a¡7¹N3èa‘ÐSñlöZa»¤(á#~Íö½Óñ>ŒN \ö˜¼ÅÈõÀ±Ù”ŽHˆfÆ+˜7À´ÅvMãïÐ‹>@7ú*»Ñ9èDÁÝz6.˜­|Ý¾N¢vgSïŠwöšQ®ž,ïðÈu×"æõfúZèKjTi< Zöé®´ÃYLõhd‡:è¸•Ö<7ø.Z¾a)RvâÉÞq÷Íå³¥lË&j@bÐ*Ù…fìÆÔÃ*cÝÜ±5õúd9ÏF)n™É‡˜]ãeføS—eü3F–5U>,Û¨LüêýË‹•±y¸%Úàx‰>:^¦Ç'›³°0$8“9{ŽvZLšªv>eDY~c@YS…ñÜX!—£Dcst Ð¹©!§–Ñ€ÃTlQ6<DeÃC‡²¡Ç½ìÊ†‡6c®rc“¸Yj—½ŽàgÈ~À~§Q<†}ýù¤âÅNö±Í’í4jÇì<Ž¦J‚GÖâ­‡ÛÝw€¥”GJ”ü¬½ƒŽü;Oîà¹)\ñ©wr)–K–2zŽ+•\ùEÓhÖîòŒð÷²}Cÿàíxv8ÏÉ<¦¶l©F>˜®þyb‹v—R]Ð¶1>r[\a5¡3 ÀGÈ[ºà{›åÞ”äsíËî]ýn/Ù‚é-¯ßx4¦0Kü·"QÑW^úí0RLÉQ‹¶mÑ4mH²b†«Ô&âv€öCµ©Ò=#µw­?e–Ì ^•V>·±£]ÿ)oE³0ÃgèíOMUò‰À÷_°c|]ëJŒ´¥&V[ÞÓ’ŒG
Þq§œxy1Nƒ0¥æw”è•½òúž-…iéšmß[Y@÷Ôsw^GaF(ãÅdä0Ã"z`c/0mD2
i¨d`…®ãôA‚‚
©×ÆXZ*c(Ëi}†åÍX¨×>ÈäžÍ9ÉˆÌR
	Õ\ÆÞÌr°—@™[âÇ>ìÓ0|N¸¥QDˆz%´Å£„zåçb0J\WÉp„¹[•ÂœPÙµçÛ”3¯ZtVu«U¹ÆœŠ)Šs/IUPíàPqgê’1E<ášÉñëÿá¡@U>dî(@9ä:*E82ÄÉeÔU5—w¹<g_ØQPE´ÂYPèdýÃ ¼T~J³>ü»œN>ùaàú€ÿ„Óp‡gA‘^lrÍR§@ò[FúFmgË3Sjâli2ÊÏþ4 gÄ%õª³`ò×*[mIó[¢þ-ãxË.ÈueñÞ™qè›…ª˜è£/)M’-÷W¼CJ—rÇ*Q¡úÐ.õÈ¥ŒwœäJ·Ú‡ ŠMCöö(âŠæ4ˆê¨4§ŠMÔL˜>v¶ÔR$O›»œ+Q}0Ž0Õ(	>Ò!ol3GÙ†Xrõ·-v Ladªar£’i%2ŒL·É˜_SCàTÍôuöLÅˆ™ƒQ<^ Ú”
ªeV”§3YB•ãˆ	)ÃvËçh¶±[ËX,A‹œ\^9÷T h`[©SKí•kæ´C–A«èc^’.ŠÖ4&ž-HöÅˆ–äÿ*i^5ÕC¥ÄN¾+?¬fìÎf)m1ÎÞÆx§b<:üÈ’ŽE±G)”Ër6r÷!¡kp¦óiñ½…½…t—ÐæÜû§
Hïw]éDV€]÷ný‚tË¿Ë´Þ™†µxãLþAuäÃqë©Ksck^IBc"1×1Ñ*:X*°­:/½mT·ÉMOíUÁP÷)P¶KgÎœbÚ„p4
ê„©ÜÄóå©î˜ÛÆÍÛ/ ÆWåÙ;€¦&Ö1kØW$-UÌiæ€¶eN
 .uª¡=¯ÄÚ–¸&ºåÃŠ”«“àW,JÏÆ4É‚¾ÚU“KEM^JcDžžG?ÇhOµÈ&O‡¹’«NUwäÐ9.šH0¡É5ÞV¾àsvÙ&ÉA_ò[Qårš]²A”jŒXð†^2ö‡Þü/ôGÂÏ]c¿Ò›ê´´©Eêõ#C×ÿTdhIÏîŽ-ßâ©ìWB‡ÙDÿ,thŒ;D‡nÁØ*’oŽ¤-´¢}Á¾ÿÆJˆT_0xÒÜì®ÛÃ´ÝRÝÂ”âÌ+ŒÜÂn¾}È¼tw€é—~XF!,ž:Ûè©#eóbX¹WËýKújˆ×m?åê¹Í¬:PÚŽ}ÝÒ©ž’¼ñ¸ _JxÜK¯2X«lUÊÂ2%\oW¿xêÇI0fM´ H_	)õ/%ÜÒJ8Õ‚WS§ùe.£†ûKåV©rË×VÂfVdUºeM^4+_Jí–½tßå\[EW·É~	:¹þù3´r„ñHëÃQÞg£”«žà]W]WêKD2pÿi
;Íð—ÆîS‰¬tjÓÀ•»Yk\ãšÃº*ŸHøÿüUy"Lä³ÒååùÌŒp‹ÛÈ¯F¨Ì¿¿BOaé>C•Þ*øò/}ÞrÈñ/UÞ’ª¼?~B]ÞŸ?/mžJÒMþ1ôyzÐf]^U¨'ð—Vï³Óê‰HNžy×«hõª%1M³gß|+¼Ž?Žok—=—1-ß±7ÁÄ¸“5Þþò—oižÈfQ[}'ëÿ¥»»[ÝXX	’<qˆMkGOLv“
—Ò×É¬ù)§¢šº“q4ÃøÇ§ÞèßQU—£%!Ç§WÖ¡u4<wfæXb]ïPYW9¥\WAW	à%žÔÎ/˜ÞýÏÐÏúõrŸHTÌmŽÂ]CÌ©©Ò‘™wà\IŠñ¢N‘¥ü>6Û©1rwÒx¼Á¢zÉ©—Þ* —ì¬—®Ã)öÉ‚d1ô6ñÆlÌ0¡F²êtêhs„&ç(ÃˆŸ½Nç“,ÒÆ(c…SeÑTËËŸ,3ûÑç|Î¾(CÆ¡ß•.³`©Šƒ lnvÍA1—ÕfÏúKCðùiü4úìYûˆ‘!Óíçtz¥ÆÀÔ}åqi­@Y,àSÊ¨Ã~	’9®_ƒáÈOwó0$5,”ýàÍG~­AJm¤>ê[s‰_xlDf¦Þý^ÿ®-pä;r¦5ZE+P['ð ‡™{+g=Z"ƒcž§ò#£5À®2^s2Râ57{<Ý¶ž¢H;‚Ž£b-D°zåŸ§ìex1jZ7Ý	ÆÔFèo?`ÕÂD=½C1ß·»…Kœû¸½Ù5´#ì¼œ%Êò7jƒCJ¹å#š»#·ÜV–«0Ûñó7ìÕÁÓD%'/ß²×Ç?¼|SÅH¸r-•€HUPpª‹Iáß„ýœxãÒDõÈ¤ã)žS¡ßQì'‰À®¬q¢U‡4MÈ†§^ØÑ.E+0çY‡[éê–±ŸÖ¼k»frÀ4‚Ô(®$+$ürñçÅ„¤™×R8ÔŒá/•¿^â:Š»=% G±¤$&1²ÉHó<†˜²·œož‘Mwi©ÃM+Ã´ðÏ&í¤?Ã¢Dù5±(Ròcº’5ãU·J&‘ÒáYøsWŽÆ½u=an«Åð’æ«Ño)tœ Ñg§Áàb¹à):©vnXÉbáƒÝ©@€E¯º³ÃÝoYóu4ô&u4PTas^áy\k¿³…ÝP‚ÚÚ¯ìt¿ýž5ßÎÒ`Zcp·Dê"©é!€e4Oi™—@ç
¦MR¼µ>Ë•éå$™±Â¸1SN{A\•ÔSŒèdø“ááØŒX4H”=ÇAxLï”CI)Ük|C–aØ•?Toà¬€µ4ŽÂQ•ëxÛ°LcTˆ­±%lÁ+ò¨ÝÇe(íÄOo†:ÀD5<uàµCoæ¥˜·zêMgs6õÃÑd£	ÙéçMäˆy(=ÿ-û»e) ž)U!ësÏÊÄÏ‰sp
ØGG¬9††=6¥3Ú)9 «d‡¬ÊtxŒÒ;ÁÛÛË¿KƒúpB~Mg^$Ñj¢ÀŽÊÿ2T¡5¹’!ª#LÔe}ëäX2m«r³~i6ÖŸ`¥¢$@Ž5Oƒ£,eË¹y³¥4er%D†n	ç/E¥náÅW©é©NÈU®ŒÙÒ@|rüü,P'Õf7Xƒ¹ºTNÒÑ7à·™‘¥¾ÜÖX\¦›åšØ^)?¹¼ÇkžJ¨žÃ«dÓ€1&Í²%‚;ûè±ª/û¿)ø«SlšbÐ- _e:^ê¶š/ÌUQ¦.œë}W@]ú°& © WPÜK
¶‚†ÞJÊ•_fà­
§?R"çJ6¿’!ã'éxÅÌœ@3ÆU¡À«pSK¥ó³TÖ®I¾i55a£¾Ù("½Ÿ@*™ódÝ	Æ¿÷1¢‹ØNýxâ§Þ0ÌC¬Ðp~þìdìt‡B§!©™ÅÁ8É'Æ„æ¹n5Ÿû(•'îO¦yâ~ø^¸ß ÓUÎ5ó&ª™sçt!tLòà($QÈ~…¸M×Ì×=w®ßTuv&æÙ®±ú9c§ü>^ú 4n­`l×<ï·ìšÞ’¬óùz¸Ôˆ2Å©ÛÊ^ rË©oY\‘Í¿†²\r˜ºU22>P`â]ÌÙw 0„€œús’ÜSYâ®ª ¾(Ñìõçi
â^a(ù®t‰Qè}F°(Íµo8Â qä4±;¨4JI@¬z‡I\â&È,å·ü@èYy›Š¦¥§;4;”ÞîMvÄÖÀ„¸ÖXí˜ÊÐY&ÜŒ¸ÑOÃ\O3˜ÇI·…ÑÑTZ`™ØOþ$š(ÁE×öÇþ‡8
¹°¯á„üþ8Å¸‰cÛ¥áÓZ^‘.ÚzQƒpø±hÄšð:nÏ®ªP.“¦û_#=¤”¸Û‚,ÒE
UÔÅ‚
«kO·ºnsBhÎFg°óÍŽp)sõXê&¹ñÀé)¹­¥ˆn©7~%Ù«ånS,Wîf,¬äd[¿ÆQ±ã5Ž÷ó%çŠ[l\A[EËíâ,bý«—!ÖEÚ+Qj€¥[„Û®y´Lz‘Ñ™·º#Ô*b+—u“îðEÂ^ÒÐ¨8êÞ=¹¢q Ô‡Þy
ØîgÀw#g´:-G¤Òë(èäà`%«ÜGµ†É£˜7	&zUXF‰Ð7	¯¨ÿà%†#'wàv¨HM}`÷H5r!Üwy5”t€ÜK^ÖX©:‰Ä]¡&ÎÌÂ¹#zkã%e+¸c‚È*êu¥öö°KøtãÖ;ž§&íaýËvŸÊhjKES÷/§²{4U,ÅËjá(^Õ‚¡D_~âãÕ±“¼{´7Y–ývÈI®¨:.1å+{ß>ØÕÒá$2ÍÝŸFrß{—Ø(öâ»ÂErï>&Êû*ÇCG^´t#Gw€‡¶‹ìÒ¯?‡æk  `°añ«D?ònxûð¾ä“E#Ú¢ÌªØ"¾Ò·Ã9Ù2Ú2å~˜GŽp5|ó«7™ø.ÉçpêÿÝ–ù9ñ>ÀÛÉál?Ú‘]U`yxía&ôaÄN	`=[¶@7Î):¨a&Ü¿&»™:¿ø$Ä¾áïÔ¼­²t)•qSOÜ\<+Æ^É4–ÔÀ‹6‡dÖrçPqQ@”?ØÀªÄäxE½6ÛÆÆY4¼9³±ÓÕð0Lk5väË#²+à[RB_Ó l_Ú0uíFòÒxÕìSi"*Ø…ò«ì{;e†!†YH£ÙØô(<¡Ü6ä6rš!DÎEYÂUËÍX•ûÅÖCzÌr ¬V]«Ï-ÈÁ™oJ'¡Å°Ì¶˜ºbÚ¬J³ÙÉÌñ <ae;!ŒŽí²5à§æSv0ôHµfMã¨ø¸6³¸ÌdV=ù÷ß”Öè¤ñ¯e³Oü	ìuð>_o¨ÜíX1*!üè„‡ÂÒJ-¸Ë]Y~*²»"¹öÜÍ`[»ÐÎk(!GU¹¡³:‚Ý:nò¤Q¦.Ž…âtïÐÌ*)j5¯MR=­IT•G+’U%7p™÷ß´ª*Ô[WU¥Vƒ¼Ú“|v$¶\ý}7dÖr*¾:+’q8pŽÈø¥SYÅEq×ûO ƒÎËÃW 5s
ÞšÖInW-MGzdÐY`n¥ôJQìÚ: U=fÈ®MÐDAN‹ƒ4á¤¶\8þ8>‹ºÆŽ»
/íbhQÓÝ/’H‹cëUûÒQÕ×Óæçº»]‘Lu—ë4kV‰S‰[“²k=DKQé>È "¾ERµàG‡ ¬3ñÃQ:ù`ÔSoÖlÎÖY@îoÍâ,]ŽsŒ]ø×û‹ÀšÆðª[Xqô 
{Á6¤~²ËŽý@'FÜÁV¯3þ÷1Ûw¼ÌX#So5vYCxë%\»×Xw½ó2ü (ÓKå¥€Ê¦°Ïî÷~œ§^8R^úý’ê§ót‹Œup±	ç¼dp¯¼ ¯=å•©z#‡Öžˆ‡Ö—oþV²Â3v~_,ôÙŒhû;öÇùª¥Ñà¢aoB:Db+-[khòRCEHWIé<9k÷X{z¥ÄG sc!{)9ùUxÚüW÷Ÿ¶¿­`9…åð±b,¨yg¶=³AŽF4°òÂS}	Ñ_/‚ï7’%\ÕÍ‚‹'þ¹;ÙXãX'÷yÏÎ1	BúmèbJéãüDÜ”…¢.íEeãdkŽ1ÓäÃ¸†¢Ç9Äª,L·YdåZvdàf³Íý’°)+Kmó eŒrŒYÈNqxØÛ2´Ö]s[ÐöŒ"qsÝÙ}Ò’u7¼Á—å)JÙ§˜ëSåR=ö*HÒÒØ{ÜðòL&t59½»cÑ4=´w1â"—æà,\ù9EqÚ(xãWàá¥¸½U!‹£YýÔäd-¿³ÞL)n®0?ˆn‰b„.iê]áfnë¯Àp’EòU0öÐn7;2½ïÄqtiñ¨·'ˆ¶êâI(”Î`C}/mzó4jŸ“É:ÌãmEj”o×aµgW­õÍó¸ÕzgƒZÀ{°mþ_S™  ù¯{¿ÅùÛÔÅßî)‡„°Œ§M÷€x ™+ú$}PÏýB`d«F`[áÇÞÆ4Â~;¢˜+`ãàÃ¹¶C!
¿0=øà¡×í>k.ð¸ÌÆQ­ã7$\ô…È8}ë{Ã‘ÏîÝì²¼î“]–ñÕâ%­€^ÖëP+Pä…×Ð–dâùÐÎÆ^ò :LüôGñãŒožø˜êÂož{“Ä‡Á;Á9kÒ(Øwß±¯²W[‚¯ýt‡rcö‚é(ÇI<Ø_Ð»Š”áM`sˆbçeQHfHCU7¬¥TÕU¬˜<oÓ¿íÿË ½Ás›1n½:œÏÉcb¤(ë^ÀñÑ7¸8ÚôÕ,Gù0ïã¬Äb&^QF¤ò›\À"@ qm‰2‡N ›~ˆqHð”ÊÍâ]¶VÖ¢àJ[rc8åkY6‰›÷ÙyÊÙÀ”ncDË@Sè2=½éí¼_3¸Q†ÏUJ/³Ñ:á³2j+î2kêkq#@vÌ	>¡+ü“££FðþŒXý°z9
špäÔ»¹§aø$lôZJ‡GðW¢‡	ð§A:ñQÐLé'ó~þƒ”i¯0Mþ“²¯ÓO*þm€8ÛõQÐ~ã¯(DÜDÔR´²üB4„~£ËWþÈ‡0@<ŒYáS\ÎD)ô1oê!À,L“õGßƒ¦”
N	¿ö)]¨òL„^D³‰/ \'¨c€·;ôï›h˜¯†ú²uÒ
óõzR,§…Ûeá5>ùŠX.c
¯ðŽažUNeAÂ×ŠûQ4ñ½—˜œÊ2T¾`”~(o=ßÍ¼L?ÕÊP°—OØï%¡GOKûÊâþ¿å‘{oÃÉu>¬9å¦i²v?‘k%æ	eÆvdÃˆÓg€Od9bÚ³wë–¢é ¬6 €44ÐÔ77•“D"2¢`(ÁÝ6gciÌêOeE²!æGç®”§O•ü êåê´˜â©´×çÔþP;¹Žƒ™Ÿe¹ùN$“8ëñ&“8ãÁ«¢élžúÃÓ¼=Ä9Ê¯¯öám «çAèù™{¢U " Úäbxb†Ø³fBü—ÔI½Šy¢/j¸ÁeÊg7í“Fáñ3‘~¿‘gRz"Ú~v„£épbhæð•}ýýñë¶Öáù.Œ’p4B;œ3nøöWA'C­L#¼o;¢s"9kš1$A‹7Á¤!È Az¯®3øw³›ë ½0˜Âhµ6©–R)°^–Oªt¶×™¤q—5ðÏÛyÚÈß2Åãv2ˆQ’Õ†ývOHB’ã.R”¹Ud¨ûä\Ø£Vr‰‘ŒÁ¹Å•ËYIjçn¾bü£¤Ó8¼ö4no¡
4Å?YgMsæèÄ¬ÉKêx°ÅËÚ•XŽó›™Ð¥m5¯ŠF§Åt	Ï’Ž6Ëx³èÔ;‘6Ðžá™¬ksqÜÈæ° váfoc¼Y.uZ™G1¿ÐC™:€—é3&EW¶ÙDMÇ1 pGÀB©"‡™ž=ÉJÖÈeo½Ñm¥Ù>1Döúü,r–­ÐŠuJËÝ>†Hb›Î
S´“v×‹^E1u+ªØ”ùÝ8RƒØt¿(t„€[nLG†EÎ{ÔZ/ÝtŒ¨ã!¥oµ»ãË÷áØ³]©Û`ØkÒˆb5cH‹µÙ+/ùèI'ß­wE >,ã\ÚÌÛ®vÆíííÌ05õ®Úä8%ÊJÔÍ±ŸÌ€/¡0Ì0õ€åˆy®ý*»lìãˆ_®f ¡£À§ÕtWá•J3Rsï+;_~§íàj¿±£*¯t½ßx´SQ‰Øôƒp„²ýæC‹Ï†úæUT­¨„°šÇ€›ç	4»¹S^Í¡yí­ŠÚ3oˆ8¿Þ@pYòa!ˆc/_Š 9 ž	8 ŠV†ÖIyVÖCÙžk'™«?$ãëu®Ít˜ùõÏÞ¡`OºÐ÷øÊšÚß,¨‰›÷7µûj¸ÃÕ/U·(·*.P-åSRÒ`V‘œKû‹æBd®Y‡»žDÞÝ”¸"äÔVŠLéÀªgïæ_ßÜªl(“?È’´Ÿ½~Ö}×_íövõcèFË>%º§Üft5©pÚq»™¹ˆl•—n‹QÕpss[9R˜¹¹-pEE*åŠ{JG²ìÅ“ÜüIÓ±^ÎþYwy8ÍÊ¥©Í•-Rmû±1®ª¬–ücõQ?åHRÂ7²#åM­žý¾ŠJîmX²³²K®ãê¼ÉÆ?O	¯„1ÄÛ¼%ó²ï7K÷ÂY¥“Ý0‘U¦ìŽ¿ÒxNSlÒŽ­’qõ—UOMuîJç/*.šì¨ÈÕÞåqA.ô$@ŠUþ½øØpßš²hV;¼áp¥Ð¾Pôœ˜ì“+’¸jh¿¨9j¡¶‡ê)s÷Â:G¤Sªê ×=åmo–¶Í#Qh™`7Ñâ gó„cE®“"%•‡ö¨ÔSm WÆè‰;.6]ÝmõÅv ëìt+:”KÅ“;gCø›=9mI¾+iÄÖ–)Œä _ýCwEè€\~óOIÿc~“Z.—ÞøB XbÏ¥UÁBÐ)U kâ5^®›â•%	ml%³«(9ÝM4¤©º®…A:][P4¼Å…p•£±äoÎ¦}óíûõ¢S97ÜDŠîŸ_oõöÎï7Êé+~ª™¥.^’×Íªý#'	TäEpå›ÝÖÍ·Õc«‘:œš˜{„Ëd(d?’@ÐQ/Ü1›=–_ª×VsRâ#R*©fî›”7¦hS>¹_ÜLq˜E:-Õq¿#OÕ9ò£ËØ³ß?X˜Æ¨I«
l-Å•ïÍˆ70Qú“Û1Öµ˜×•Z™þA`É(kGU9	‚ó‡ø¼Ýè)ãüt¾óÈïö¿,üÄ§ñ‚úÌT]«b(“ý|PTåû\áOx	 G‘¬Ã`Þ÷ÆŒ_÷ƒIdðN©àbž°ÉÞyp±$¿h½CD½nÌ!·Ú<+†naYýj„\‡aWF[·PÚ¦-¹v¸. ­KÒç5­ÜÜ×P¢ß¥¹À*®uD·ˆÄ°3upa½#dUú™jE@w…K8î'©>‡p6ØŠ;eôÂË#”ï’å9‡VêÛÃ‰ßëÔ»?^¥\Lõùº=\K}Ÿ®ïŠ’Uß}tû‚lìAˆÆå2%­8Ž
ößûÛ¨á¤»ÕMÕËôªá
·´ß‰-¸Ò\jVì¿näRiöE“oiÍ0û ÄÒªÛd»%5u{ì¶»b][ì²vX7`óõ\ÁôZ0»®lpu[K­ÕFÖÛXïÈ¸z+ÃjM£j‰AuënÌ©(ëÔ¡•··¡.È&ŒEËZZëYYÛÐ]YT?•5µÚ\&ÆSC€+Õ2n¯–åÔ©5q ŽrkimK)åãDðÖqWÜó&š!üýNü¦e¬éÔ%5A˜ø·6¬ª{¤Š(¸Ê*#q%‚-õÞËx0wî¢~é=ç‹Óº <ÇÎ¹Ù]ûêšo]ÙwÝI~ðSÓä»ô\ª|:ËfÌ5OÙ¤WÉDµTü>ñße+î›NRí^‰ÜÓöž=Ûš•.úª! vu©¦Gœ+t-î¹o—Öz©Ë¸W„Üû%Ì±¶ p‰"Vð.^2‡ÅÁ-·î\Ì\à ÝMyñÞ†D¬%ÅMWZß·£ü_Ø<%å™+!KŽ` £Ý@m††‹—K´Õ3àÎ²Ä…¿BËg^i¬-ù,MYó:]Ïüè<l$gŽ5÷µf‡Æ»Êì`ÓÍ/ä@¬~èvq;ü|Üá=ã7Vá€nêµŒ°¯À’ƒÞJà©DxÐ£¢)Þg=
XòÊY.|ÀZ™~0 XöuöÅhI+}Haëæ¹áác$ÄâWgº÷"öFˆœ%P(â|jPÆŸ9ÈwÙ‚-AåtàU›ß»éd¨l7«îê«™Šò¬Ûéá¾-—8ÊÂ£ñO|µD^¢Ò{z+õ‚É^!ÿÈúˆÅ-8zÚù
û·ÆêwDáŽKv©^¨Œ`CâAí€ýëvº=×KF%,‰ò³)÷‰Ç;˜Z•®fðº•¥¶ÛÈ2F¤íì›…:œ'lÍ0ÒÒ¨É“c<çGÜðZÌÞ`>€ú˜bm-OÏ ~êÅÕ8S#»Š%Š[-ˆÁòûüô˜‰CÌOHû‘´2­×“‹PU¡|sÖ¥p{Q—¾;ë:õwöKUäSkÙ+ÏgqgwÅ3JÁñœmît…ä$
z= á¨2ïáÊÈ1ÌWšÎ—x‡2ÄŸòÉdEYòjŸšºÉÜªÅøl	äˆªUåûÚÆ6Z»ŽÛâV¬c$c¨å•T×´VYY6£³SO¿iIòXüHsÈP˜¾HSí?SË¨Ðü¤LÄÏ?+[,-kfè3lrä}Tkþ¿ÿù¿u­í·pDÉ%ÏÙQ¢»‘=ÚiÉm,[Åm¶æ¨ªµÌÈéÐKfv#… ¯\bŽ	­ÏiÌ)-5DàWö•©½P‘ò,8ŸÅâhHlÏX\\::9…*#Aáìët[z§f(_¥rMðRkS‚/Võ
(yT‹/Í½b¬Ætœ!ò[/k­Ðžmn”LS ±ÔëÏ'^ÜçÓDƒ5¡Z£5]Ù4f%ÿ·£þ•D}USeL
±	F]Ó÷F(EôÛ98»X2IøKO‡-œE¸ÙÄ\p†é£â]>ÉÊAlí¼/k§„©ÅY×e[Êù§iÇ¬§§Â¬hM‘ªÒIÅô}š,‘ïu¥VÇûB‚ÌŒRžÚcY%¿ƒ+#Î§ÁÐ»‰ëÝdQ#i®[×2qUiØgiAi­7P®e/”;R rÿ%5ëëhÈ£é0ÉÛ™ÒqB=M”ˆ”†yrÃë™ÈŠ*4‰¨|â} Üb¸–'Ñ<äiy£y.4¥u`nò„o²'= ô¸ËÖNžŸ¾=^c°µÓƒã—?­­«cÈÓžðÔl|8ÐxV#¯°Î¼©žÜ-ŒRÙ£–}.ŸJžñ®¯5ñ½x0¦l­'ôUËÕÚh‚¬;ñ©?µùµ¾ÔÇÀ<‘½yÜÄÕ&øà©úZÒNŒj¾/%õ‚„ßÜJu_Š®”³ü,)0¯ôÚŸFZt.:#}ÅW¦•9Tœ‰èWñSî]–Fm z8ñ^¦^:û	_WèjÐ³â½¾Ì}v‚p0™Ã‰nòþô§Ò„78ö O¼pà“wSœø‡ó8öÃÁusÐÉî¼haüPöž­><Ê–Ü:$ ó	%Û¾4ïDô~ÓÊó”îðü´ë9à(	Û|§.óØ‡ŸoôáS\ãIõ³¤~¼è9º_ìýxúúÕËp6OŸO(méce;xcèœ»ƒÉRÁûÄþP©ßÜ8û?ÿ{øn``mM7‘ÞÁxæFî8&A/£|Ä|ïéÕh¡_Âh­åâ¶øºæŽçFí%×á€™ –'Ü~0´Qf Ìóg#MãkÅNä:4(p¬¼½|}þwG,ŽâX$¿ll°Þ¾ýáÕsvòãóç§'ì×ã—§ÏÙ«·?¼<dÍ·Àûbó-£×d³ôçûmŒÓt–ìnlðÂÎ(ŠFdL¦SoGÉF²qðÓùõ ÿû‹¼<˜]ÿúÂûçƒô‡ÿÝ¾xpýáxòâàç¿?íý¯7¿û'?w7ÛÉqoøË«Íqèýòæh2:ï½øÇUòß'ÁÎ«G£ÿÊ4,¡UÍ†¥û
êë†ïÒ øp4ò—Ö†S?GC@áGoON×ÌZ¦ÑÑ{D'…Ç±îÃ	"8A×¼bVV¨Ü†Påï'oßt8ºÎ¯›EGD"€ÐðN)ÞsJÙ²&@&üK¼ QMºøÓ _KÒ-¢—ÅpxÛÍ ¯X#YØ%Eîîm“'¿iÝÓêkf@r;“hÔlð³ úßs¿äIÒˆŒ}?Mvë98j­Ü°â>À:¦ëhÖºO¹À/ýÀÖ|½•{ù7ù•SéfN³Õ +ïÃñ:öá@ËIlUÄTªšNù¨ˆ´XFõBÁ›4eQ¾qÜ2‡²”ÃAqmK‰Íâhà'´ÒØŒ6»“4 ¸ÒkÜ‘ùlˆšœ	‚Å=ø€þ˜Ç€WLaû’(NÝKX–×2ßsÜ‡‰zàU|š±êÞÞHôMÄŸó|-Ý›òž-)»ª–Ç°Néˆø;rü]›ý×p(ê¸<€‰õD™É”©ÅYÍ¦Si‚ó¦>"hO3‚:l¥â‹ÕÔæ°PÈíXÈBÁ]zK_=g¦OÃPD}áï1×ä7O³F7Îú~ˆÒÔšHEŒý¼QbPßk~	K»îÔ¸//n*UvºŒçot¸Ìd÷¢H´ ý]:í1ýR§M#Gõ%O{ÿpdž×ÇS}ÉGÕÝˆ¸sõ.®Éjõ\yBöxþš?Á¹nFÎXHˆ8'^ßïmÐ`Ê½¸œùN*œœ¯»P0ö¶¹ÔKµ'DâM.UZ‰^Ý[¡0@†¾¨“ÂsÊ7§¨¤#t?Ž&€ö‡^ -Þët:Åª$ì/$ýDç‰òH8É¢Æ	Ž‰ûd‘)9‘Öe«g~	éÎ>ýÛ0 `™øÃýÅW_ec/Ö*&Ú¹ý-rtÅõ„2ZÇèrx-7~Z4vg®ç{»Ñ<¥[ÒH×Ê‹c€s©ü/!îÑN˜Y€¥…*-uí¤y·dqWÖ«ê‚ByðxÚ¶mJÓy”Ä×<'B5þP®€B
„×z·ª@ÿa9¦ŽË´7©Uº1j?0Lã ï\Jæ£à7ò°5Ã1_©Û$”Ê]¢5ô¨ru1Ê"cDž<Éf¬ßyü•éI°È§Œ{éyU®)~Ó‚2åMRú©6‹ˆ¬I>’÷ª´*|Ï¬ÏäMªŽ§µ.SÅz%±EÉDÿ8-	EL…×‘G[ž$Ár™gµg´=wYŠÙƒnYzšºî“ËúqÚ¼Ðÿ¤ËçÔL,†SÑ‰°änrejÅË‰ÜhI¾Tõ]4¾\¡Â¯-3`¿¹ž–T2í8ûy:Ÿ6ª¬×6³Ï£¥¼o*#‡Èîµºö«ÏAV?¦åž«ZÎËláeà±Ì¢ZÀ§S§½büçrŸ+ÜÄzâM†ÑªùIíÄ?­V¡ÐéK]¨¶+¯øè€ŠÂÉA,%+å‘Úüƒ,¬Kåò/šwËMš&#SÆIZ®½Ø¬áuÈ;õ½	:OÓ5ÔZÈ·Î¬P=“W¡ÂGD£6¬QÞu·†*µ>J«ìÄóRö2´#Œ•¢´õC+e°•ÎnM›u5Áç¦àÊáÏ^1`Ï¿S¹ªˆ‹?ž9®‘ý(Š‹$%´\\¦()?ÜÆÔÜ®®ž¹uåâ¹ë6ë/ðD*iµšog	,7iÙÏ§>ÝÐ©ÁæS?Ry/¶é±œ¢MÃ„»‚š*3÷
©Òû®ïZ¯>±ª¨6˜n,‘3‰!m"\Õíã™ÒÝxž+ó2‡”’}áqvÚ¾¬å´ê.9‘û4òøf·k‘
³Ùí
ƒf¨Ñ¦gâô§^êM*­Õ«ûQ¸<WEÌöGùäJ^¹‹÷b'ng=ºƒ]È3Z–Ú<"þŽvíG;ÕŠºÞˆÍ+è]³åBnyïØ?ýd|x©£“-ò·2b;™a~±­)XÄ×~xL ìG‹xB¿ÖL¥d][RöÃt-¹™&ÉoE–ƒº  ØCYpO»kVV8UËî©nvùÕêvÏ>³y»é³ hd:‹ˆé?%¿µêd/oáñcsP»ŒOMTÞÑ©V±NW–ÆxŸ_Ââåïî+WsÂqt	}F1ùmrGB­Èê·§½~êÅÁ…þz^Tñú|€>TóÌˆ7`jæC§c# ¼R•{¡rŸ£¸|„ArÄý,`ó9¾4KË™ÉÊü®olâH/+q§Ìß~à¼ï‹ÒbyÃþÉ|:õ0½¼ú,û¥­¬^ÛVñUD"«úþK£PkF8å>¶øx¢Cx…¿q¨,šEw<K7ªÛê<Æ[ébîBv2Ÿy}ÀéËœøñ‡`àw 9æHRØ'ëAjØÑç$ÆÌ›xÎZºÛŠ\>¬Á+®+V÷Ã¹çoäM%ÕKøpØ4Ç†‰X¦ã£CÝÁ§èJc[)Õ¡†iÖÙ™p…e~~ÄYs°U÷¦)]JÕÒÒ×ù	ávØò5:óé _ŒáàÍ†‡OKj£°ÑâŽ ¸©ÜAô+ÑH¾nk66Æ”²GWäO´™»|.ëÁ½îr/L@—4S³=‚E¹"æoÊÛ¡ÉõAûÌÂø˜m/ÆÔûµ—Ž;Sï
½ÍjíÌUí)„u}’ÆÐæŒ÷(ÐïÙ³×¯ÿ	q·ÜÒ¡2‘‚|–úo€•ÊŠ_å¼Öê,i®Þ$LTÙ½„ž²½†»ÊÖeéo©(r<žeV‚]9ŠŽZŒ¼èšt÷”®™ÙÊd¸c§lAuì,zcJLáR/ŠiS.ÆA¼+÷8{Æ%ÑÜ!s­½Æá[,X‘L4ß¿~þæŸ/_¼qpÈâÛn¦7ìôàéÏo~€~zÎN~>:xzpò8¿÷(l´¤Ù8ñ‡˜óòÊÇÁ”gðL³0S–­?”‡Pi
Ltß‹çà2„áa q0úºÒµó.TÅîV:UÈj¨ÌTsûð<žéÐµÎ W|ö.{qcƒýÌý!³mU#%R¹BÍ\–Ê.ñ/Ù•)à@Šæ@‡8`áÜ8+tÒ_Âæ¥UÂ…¼-Ìo°ÎNåqhDeæ†Å¯–Ä ÙjC<úífûÓ‡ƒ’øF•&>¢v z€?)Bƒ¨KŽ²Ô6H³fš­|mîò5h·7…æŠ]VB4^rÀOèFô®Õe;´#
0Üºß<;¶ÀOß1hOÿ "¥Èž·ÑÒ÷’rgšº‡xWl"~ôí2_œÏ?–§Åpš¯¹Îu­\xÆÒÂ‰P«+•“š>ÙœmKH`Î±à…/ÂôÇ¾1Ï›?"Šq(Í3@œã å­x£Øv†p-Å‡ •Cs#R•ù³ˆSr/DhÜû¥éÈÓçÇ?œ¼|Åž½<!Rô>[û)'Ðèi‘TÏ€d	7r—ŠÁ Ú]¿V·µ;oœñ^·
æ›`£5_ÉýÔ& m¿ùlÚÌ1Ã°rUžrâµËG˜Á‹sŒ²m8T¢?~´védÝS!¬”’¡')ÀÅf‡fò	|Ðx1‰.Y3ë]éXÐ«s!;µ$ã;€—èw”sôš„ƒ¢ˆ·AÉú*ýCàÃßðV£'OX7?q)—÷w¨ÔùÎt[^âÅÎ·h“‰ÖfµüVå·4˜ú¶Z_ãƒt¼Æc}OŒÓúâFd³0Ü˜<øGãÈÇAB5¢K”˜èg±Ö?}/Î+½ iK$>@RÍo×”›µEð¡|x*wK¨ìˆå­±ò®äâÉÉ™5á®'†¬=yä¹77Óbìæ0“§hùÒŽ`Ú€Ì ¡abdÑ¹ŒI¸¬aÖ¤Q5	×ÉšxdD‹-c¾Ç÷Ë¯W§f[ÆÂèÕ•úCe³i9, Ç8ÔwYVÀŸ*‘r”·cªs°e¯(ðñý÷}Ë 0C'#¬bc`2É‚Š=Œ‘HÂ’w½®¶LGSÛ™uµÑüq¶zƒP	\\£ (ÊTÀâ éžŠ¦ùåL8cQ“¢ª¶Ð4tä¸™ÛŽ¥.¶;ãÖ‹Ì±9ÚáMüSH«¹¶b­€Ê­¯¨‘´ØW.­&[ñU]M5QŽºâôúLö`YjiÏ‘ŠÐC¿xEÖ†õÒu|à÷ˆ¦ŽD´Ûœù©$a4‹þ&bÃìñ¾>¨Ü³‹¤8z1µ†ózœ“ò…ÌLÍ¦eÐ$øÝgÌ\mqçq«ìJ[öÃ$êpì£1IM¾ÜËE*|Æ+ªê€ß“û7šQ>åsÎáªðXñÀ.ÇâkäŽ‚$^s‡l¥!;ÕQ¤:”°`]©¢ˆ|Z]­Ž"j¤šŒ‘×Ê5@!ïaoíXÚÄ>óR%F—+ŠRL°¨È!\Gï HÒgª[Ù,*•ö2ñqh"‹(§;´óŠªvIÖU¤H³~¦qJ;\’ÔeÈ›VKÅY¢…N§£!CQ»ƒ‘£ öë¬ßÒO[_ž6<å§ÀÑ)Ï+x–
-Ùl1·A9ZæøãÁñéo‡o_½=>(?£æ_¿xÑí>BYãën÷E÷ÅúúâÅsL«'J_ˆ¯/^ìÒWñîƒn7{¿<ÚµºÝCQú`G¶xð{A¼S…‘ºÃ#LnJ¿A÷2½2ÿûØq"U=‰Ø
D§ElÚì¶øÒ©Š»â‹©72®Éûßä»®X
øÜŒ½Îïœ_çÔZªIÆòÓ/—™;JŸZ1
`¿„ÞQÉí±\[0ô	Epí£Äð²Æóq-4K0ƒ’îirä$Î×@»ÍÇ':ÁY¦SRg©‰ÀjlÒUfl0ÂD„$Gi.÷5>ƒ—Ø·Z‘X£wŠ.§ ÍñÔ¹»lÀ+å4‹]ë¬Ôj<–R@°µ«BöoüW[žCQ®]‘l¢¹JIŠ‹„k•'.·rÿ‰ºô9ˆä™×Ö•u$ƒÎ¦Z’çû¢ï*ÎsÉÂú»4JEÅƒ€æ!¥ŒNÅn‘iËdÌÌ†¢ðmªƒÍ÷+J-> £Ã9 Hà7¹É*È×ÊÙ÷,KÛi•Js¹n>Íå6ó„…Âk\;_Ã€«iº
Ç¦$ð©“‰çCžÅ] JTXUÃ,7È)T	El WpŠYë{«è®1Ž…‚Éñô•>mã™—?3füðÎ†W­•—ávXÁÉr”@jSfž§èä Ÿå·õøcCâø¿€¢"È@O_+àaÓÎ¾ëä;Ï½yêíg>?ñreÔs®žoy®3€³	ŠŠÇ’²*›tž	~Ÿ5ù(YÂtSr’'	$:G¶œU„W°Ak²*Þ$ ™7m>)¨Úñe^[šÛßo½~CPÄo žÑÐÿùøåa4E¡ÏS1yÓÖÍûB¶%íf¢}G~ãŽºLj>3&â)j1@B‰x]þ&5ü1ü¨»8KÛ[<HÕ¸%ÉŽ%†`¹¦"”äv—[lbÎ~ Ò%c¤Á›·³…T¤G|Ô7‘˜FGßÓeb™º“«~êÜ*¦Äô3,ÀÍÝD®Ånæ.Óê¥öÚ]xlO‹ˆüöTWw¹ÂaÖè¦­ï^®”»Ýîi)$sPUBBôr ÕvT1Šƒ!ÃÐÿ9i÷Œ«ç³L<Fèöå8˜ø?¢;5¦ÖÉÒé—‰P¥So¦Tév=T«aÝ'InÑ±¦ç‘÷›1ïË”»JwÊ/â§Îà¥<|M¹cÈ½­}ÌÜç\40V¦ø3¸Ùƒÿ¨>ÙšËu½èi>}Ñ3o¨—ß—„—ÚâŸ÷Ž&óä0ˆ_Õ}Ô}ýŒ—#-…´Þ‡ëBI'B¬ú'N97UœÎC/(Æf¹.ø˜W!ÆF€âk?$VÔ]ÅŠÊ 8LÎÑ©:xh¦ô ×BÀ³R=ÞD”ÛŒF×O½ðÂ€Å.Âb×¤ON0Îê™ûŸ‰GroéOGûovÿDd!ÈÏmQ6SQ¼ÂÏSds_
OpC¥ˆlÿñÄH^c4ùgƒ(~@õÓ,‘qAõq„V£eO?(_&/æÜÃüþæB´¼Rq¿!î<Ìdþ<†+åÏ±‰a–*x…¯Åïi–¾º'þdÏÇLfËPš•W€îóë@oôGüã}-{^…JÅC¥t€7¶ñW—¼=!Ê,ÉGCAˆR(Î"ËdAÞIäûú£”ê|åüp¸¿ µŽþˆrã'…Gª`ºï¸ÚV˜ G9Í+h‰Ô÷Um«+Ö¶Ó¸´k¹…Ôž×°4\y™SÞx|pA¦:/A)2(Ù.åÜûÀ9Q½<yñX’"ÒW¿¤3§r·JyyûK:ñfR‡MVÏ_å¬Å¥îÜU´H"=•™€¤¼ŠI Jî!¬ÎWYÆË6rŠfÙš²ÆüUlÃ7Å»ÇGºcòŒjTéŽN*ð2EW^{?{q]þ<£+[Ù™ ?^íYt¾BnË^oÉ{:ÊÓ7YmÞæbBãÊ!ûÍ„˜Ju¥\Nu/\ýf-é!âFÉ(®Ëfk²ÝL¤³‘.ˆ¶@ñí`wí{j¤½v³¾`uTAê²¸Ò–ênoJ+Ÿê~y Ð×*ûŽwÃ‰ÅxÂÞÿA‹ÍÝ¼ç×©.3QXX‹[ötR+Üt³L¶¯•ïºy
æ”îºñ2Áž¿È:×Šì—FAV{#—Ò÷Íä¬(å	ÎMÓÏ)÷ºŠdnUwŸW¸bÎaeM‘M§¤#ÜÃ4g}3ÃÍ¾tbOT- ÝÀz=¤¡Xó:ëÒ}(o)ß_äßW^°\Q¹`ŠÎÂ±`\ju-w´ýØ&«VX0éÙ¯øîÖ¬c~ãZ6UF°èIðe½²èüÜè“ƒ4â=1Mio4W4âÕ÷F­¦ˆTëŠ"euiiÝY!^† » ¸l&†Pl¬¬¤ù5R¦Gšû+»ì¥­üì«ŸGáÞ—-ãÞO…ìk:PüTKíÐdP6ß þ­ÑÒíÍª¹V%Î——ìüÖMÐüuÅüš9åxWExÝ"ßJk·2F’ô»ïòfNè–<£¡D›B !BŒ†*µ.2Ü%¦'4>ÆüT§†mñöÀÌÍSFrKž‹²á1µÛÄW3n‹7Ôy$}o,~&Uüú;Ìd|êOg‘qq’pÊzäNETÖY·`®Ïö€#Ñd`«ÙýYÜÛ#Ûžµ5mr˜%—“7E7Žt6©÷Zâþ­J2‘Üõ#wÀË‚ÛS‚ouBúæà»ªŸTîE"ÖE¶õ—GéGñ(%yÝØ"ªmºcõÅ·™'«ñjÒ_ÐåVµ´§”ú26,qžô=*AxêzÛÿ—Ão§i;,v\&GPôL4}¸rß¨‚—Ý-Rsæ¾\ÙÀŸ°¦æÖÅ‹óa‹ß¡töÒåKüFÇ/gÔÆä@ß)N“ÆÔ»uhÄ*Ä!_P±åbº[Zæ”æ	·4ßî—f÷Js,ºî‘VðG£!=÷r¿´e]Æ-¾~^Ø½µ°›³–ªrÔ‰¶(aöýúd›yc$·²Ò,0/³åu›`d•?Çsû!æ~ž}îv˜¿L(Ú þ2¡,mBQÙo§E­ôŸm@i¬b?qÏæ1 #i?‹þƒJÇ9ZæFŠ¿LwnÊÀ¯~|Æöžý¿ÿù¿Œÿú&+Ï´ÚŸÉÃé8SìÐ}õßÊR‘k/ÖŠœ“%&ùiSÿ`ô}—ö4ö—¹âs0WhO‹êÎLEùŒrÔïY/nphio©wV)”ÛYcz4ôûÅÂØúÀîð~‚äåÐ-L	êEYgÅiÚ“î:§îTü®[–d—=ÓKx5}‘pÎÊï³wÅ\¼¹rš”g"€öãg5#oYÎÞ{_„¶9Ë«g×ƒðñº‚˜Ô5zb<ÿãz·2±ÞrÍ¶î	Õ®œÀ­^ž û•Z¢¥»Í
eb9ý?x‰‘“˜à4ËDL?*2${¤*á/žhEÚhD"h#'ò=Šë|æO|~{4VMÔQvÄSªá›ù’í«²&óÞäT³Ÿå¯©£8Å09ž«X+Ò^ïº_=Iý™åu,.I“Ìå^þÊaÅÅäÄtP4(É§(Y¿ìëffgË—ÆH€©¼Ùëºá¤šÊéîÍ0Nz½Ù<¡ôœ©&/Rp´Á<•¦WF§‹X˜zQóÍÓ&`cZRãYàN×ýP‘­†çÁ‰¸’»m¨ç	ÕT«üv—ÃµeË^ˆclj¥z0råàß,­ò4›F»’±ohÙš–N“¨g»¬Jš8Ô@¯™Íz]©jùÍ2ûÏõœ…Ž¬…Ó|òÄ	ê`îBÞ˜ÒK¦+½çÜú‡5¶>Ï;äÏù&ÑðëyvØåàQÙ{ÒÖ²´­¶ õ¬5	söÌ­Ùã–%²œD¹•Ö}%[(>TÖ>?p%ËŸ%*Yÿ\<íûñØKðð
_-¹ê÷µUWx,,)>@ÒV€î‹áyeND5Ó¦ÈZ šoê€­™d8Å8m6Nýø_Þ0`>°“Þ˜x©Ò€s+–5©ºÄÌ…tê%†5¹––9Xã!ò*:G•k•-ÿ––rœÂ4yÞ†Ÿ|Ì­ÿþ›…žGð¦-Kòtr7ïUFCÜØÂ›YW/¨åEá´v¬ŽyŠO’Üjúw/œªAÃæ¿gß_{pJðËÁ,&TâÓƒ¿ÏCø+ÞO¨ì`«3GÐjœø³”²®á·i$¾¾‰>Èâg~Â¿ßÓ-¨hº'Ù¢$‡º³³wªnÑ¤f9QZ[ku€1›6Kü%°-aUoÚIQy+b€1JÀŸfB3ÓÍ2’O$-RÔT¡¢Gõ§e4ŸÍ­ÔzWÝbvº8ZÎŽZìÅþ~VÚ²eÉ[ emd?ò]ÈÚ!W{K6¼“©îÖö•Ù¹,¢¿.âð>xÁ¯.zF¼K$óŒ‹f
¿âyÀ½’§ÈH hxœ)&ë)Oñ(zR°“b¼¾Ì¤UÉÑUn8&XÀrÍœ›|wÃã›¹yŸíÕ»÷Š{JEªQ”øb‰)ÊÄ€¶Œ‚Ú9–?IÍ…äW4a¸jœbƒCeõ–0‘¤cG”ZÑ,‹›ÏpE½qô¬¾*f,*ÓÈÙÔÆâ‡Cµ­lhfSjy¡%ú‡bdYF>ØÞ>6˜MhõXI% G¼¥¶nÀR£Ü[$¸±6“ÃMî÷!ê%ÙëÅöØ÷r8‡#›.°¢~œ!:<åòÊNw–cèç»¢ggÓuF—ùè¼@'™M‚´¹ÖìŒpË3†ÝáøQ±šz|³|‘fFÜ©+îuî¾QX6“±-ãÆ;òãöyàO† cÃì$š”ýù0H_àÓSJÎÖPQÆÆšŸE!}Vsê¥ôuð¢	lè„—D¢hO~CÇúA]þ|é|M(kNŒ'Ž“}+v —iJm”Å+œ¨¯_¸ƒ´ôBþtiŽpwwP	ùñƒ?V”CF©U½“s«@Kcï%^ÝyìŸóªðeïÇÓ×¯¨ôù„»ü:îôa€i|½|÷rlé‡'0Ï	-%÷„¦„–hWßîåÔ=Æþð3Íe@â/Ë*=8Díª¢j¾AF°ÑP¢~ì{ÓšÌ`³^«§¼v† ×k÷€*×iM½6^¾©Ó ?}õš|…u©Ñ§qþîW5ª?X¨ÊÓ)–¶(ñB½V3_;‡¢ë\<v/ÑÐ?÷æ“ÔÕ[CÓñ+Gg$ªQ @CSê3Œ¿F-e‹58çÕ£)†âˆr;ŒÊÊ×, '« X Ë÷šŽd=+®qrÐÈÅíwÕÍ7]Öÿùø£Í="åèš¹_²"Ýzh6lîVÃÑíP®Ëö¥•îEOŸãä¾ƒ­ôéæ$xôŒ¡\øÊ [8·wznÝš‘£|ÛÀ€
m­Ñ™H¬IÔù	&ÿœðeR%Ú¬ÂõßÌ®2ÌèèM² Ku¨ [[Ÿk:ºÌ8¥zÌ±­Ã£À9Abf–êJàg[?ÚŽŽrÖh©Þj¢BÛhøIvG0o¶±!éÇ§¶%ŽJÖ8â‹,²ð–v¥­™wM÷Hî+š=ï¹[?•G!å0GlýÞÿ  ÿÿì}ùVI²÷ÿóÙú<cq„$–Æ2¶¯Xl«YÌ°´gŽÇ§]HªF[—$šË9÷Yî£Ý'ù"r©Ê½ª„°ñVÏ©–\###"#~!.s2oH+"½É²‘R®ä[±w€ÀÒ‹Ôßœ“ƒ¤—á 6’‰‘
ÁÓô†D9‹€}W±Sµµ–À·â¨I˜ðÂG×ÿzâÊ«¿ß¢Áà&ð¿½ÏÒßíN`Þÿê[úŒúæ]2ç…ònqÒH)tží`Ü:!™²<xÐ‰zŸF˜W(¦!%cäò4îá¬§6ÍzßáE ÿ÷ð_PÖŸÆS7Ãýœ¬ÍzÀù9rŒ{Vj¯Ì·è2¿ÌôÔÇBéÌþ°ù(I7•¼dâ”„wÖyÄ÷%ˆåÒ‡GÑG}ºñqàjx‚"•ì9ïãFsúv‡Å·¤Í¨T*ª·DrçÐÎNN}ì¤éf'°µ˜ìäµì»Ø	2ƒ›¤+Ë8¤I;­qõ	‚¡X_ò¡œ®JbŽM
Âœl4ÐV>¯'¨?|’ßgsit¶E Z$+Õª´o[Â&EË”h 'g€Ž V2æQsÚ2)ç<*¼áYá@J.|J(½‹)ý„ŒsB.×ÚO	eyœZK^G ˜sëêQ¡Å·)—¥Â¸aÑxiØë/"Ja…#£ÝóU¨~”¤tú
çë…Tèˆêî‚V^lã1½ž/á¯ÊpÀ%®HLGø{÷óÄ…‡C·¾ŠVño+æ—ƒB¢³;=—èòöžÖH§
aÏ(j‰fŠ„XäÚÄ”lŸ‚µy$~ùy!<¹Åu%íBd”œˆÛòsLÄbc(_ç2V†ôªÔÈ„/‡ªæH½8vì~"ÙìB™¼yÜW0³l?2éº7Z±êS~§•mk(	só(Q‹»kÙ¶¢’úz±Íˆ·³HâU9ÕôEÚ6Óçñ™âRïÊ¥HH&§wóúd³R8%þiÒ¡gÇûedÄFØ%ÛŽÃþð3Ûfw64ù¢i=™§š˜Í‹qÃ"¼0'd|P¾R”æå*£³ò<Çsó»×ÚÄÞ-¨"‚ŸËåçqº{ÜLìÍÎÜ2ÜÜ(éÚeWÛ£:÷šEJµ1™[ÎÎ¤Øi3Âþ¥îÒ¸ÀsD~Ì--­;Bƒœ¡ª#ï•a£yh*|+šª†!mâºŒ‘Š5%ô£|û×KÁ¼n†1nvëf[ÏƒèŠ7Ä¡Hì›çñòËÓ¨\‘Ìé‚,wëjÕžº{€?÷'KuìêF´jD'¿;¥—ôtâOšƒN ÔG -cû1cwØ‰Ì5åÉ¼ù*«èÁX›[rYÇK÷¸›.Ü©3H³½ á¤ãââ¥Õpmã£*>ºYZMHK7wïeèqúm=$»ÒË½°ô¢Íå-	<švÍ‘ƒI’ïUÏyÖa ¶lF¯^¹,àtË¸OóVKgìt“l.P¹å #ŽÓQjÏØQE¥ª‘’Ú˜Ã†HÇg‰ìRÜIlYY©ÙÂ”F,‰Ù´R©	j¹tãƒå¡%RûXIÓo’œ»?¶Dé>F—Ñ\„ZÜ™
zâq0¥ø•†{ºû…–HunC‰0’˜Ye£ï…ÂæÑlJŒiÍœdœ µF…K‘ÁÐn3¢Ò‚ï‹AJ©^
<³w“.0-Jò6]Uâ$<‘ýAÔÎò3Õd9õ{ç+dÌj>ÑÔÎCZ_Ž³‰SíT¸Ú–Ç,þpkwÿì€ì´š[­ý–Éoì´ŽŽßìžÈ×Ì+;-byl÷p§uø&ˆ8n”2g6‹UáîÑ¨“ù5×0cBŠ¨®­Iå(ìcèZÖï¾âË€ú6-ð$¥Kf'áyp	uDRœü8æ¸\#Ø´ESx™¯)ÞÒ×¿Ù
yÈàö°£(ñžAfƒ³»³M¶[%¤+ÉÈ£FÛ²ô‚ÔÖªU½­ÎŽ±—2‡HÓ¢p®9û0d9û”æGƒßü¨1%™‘JÓ}tÁA‚‘êõžíµÂÄ?Ì÷vÉ¢âAàá¿@(ç‚0¿PGd:úöIÔCáˆ¿†ÔË½"D§¯¾¢{1@E¼È~¤/²ßé‹G˜Ïf0í‹—£A'ºŠ·ù¯ôu~A¼/ÛQ(ŒÙYÜ3¢ør;KYP¢xîTEå¢Iô0½Ï8BEA_Á€B-*·kéí<:&\e LrNÄ·?'Âó ”ëcîIIþ&\"åÔˆô1	ÄŠÂí¢ý©D¤E~ñâVuÇ”a‰„£É‹ôç2\þé½v0‚1‚òÂÁç(	Zºâ:=ÃRÆy‡T‰4()'Ñ«òwEóÍÕ—¹5Ö¡+Ê‡¬i\ƒâ;š *‹ó*´4ãOªÑº>yeG>/Kë¨ÏÂ?B“^NsDQEi©/­ÔáÏÿœ÷¦ðóºçÍ”˜4ïìI&<’šœ'®ÑªŽ÷Åòðå¢‘SË«#j¯Z“IJ`2\xO¨ìJ=‡…Cšt-Sî4KØÒ³µ’Ò.Œf‡03C¬A{×,Ð_çšÆ)FÜ>«eX,œH–$UÌå uLÜ\îÖŒýH/ý°MûÒ°-ÿäÊ•YûˆÀdÊ²&”Q^K^rÔ‘ã6µqVj´ýËÎÿ>Št´"Íô¦Ù“€¯¬TÖÐQ¯¬9LÂ6äÌë•ätKéÚ4TÈ²â$ŒÝ¯«ä‹íâ¿@0#©‡÷Ñ aÎ1,‘ûÊšIÑœË çœ9Ñ´ü|E&%”‘‰È§îóœÃ"S–À]¾¥†ej¥ubAww‹ÎìKZGÞiÓ“ÈYhŽ-˜f{š¡[.nnÈÞÓ}x¸À–\ãàn«0ÖÜÊ+-÷[……ª¯þs¢hÕc®Î/Ýyn-gÎ¹Í†!Ll’:»¢ƒ­õäÎ:ÛÝ°­å×´!÷ió²p—7£ÔúæøÝÙ9;l½ní5OZT|_·öAh=Þ}ß<Þ!åÙkŸž-HÒ«Çøo±û{ )ÝB—©™»Ë^O¦@»™ä~O:båá±Ü8kó„ø¾¼QM&x]´èÜlš’F2[€àßÝf€ &äÍÒ‚‚j9ÆKÔ…ÀVm¢E:ä*;_ÔO×¬Q“¬ê(YI‚®°Í§CÂÇ(IÍ®$úF¦C‰fŠ^ê0ðì‘¨1CÆ¥dE©Nå™:L¸ä^/‚e:˜LáßsÕ@Ç„™»M4ÖW=T|ú—d·_$Þ‘ 7ya“w,Ç]ögxþè1@dÐQ+è¦ÃÏ~ &gÎtãÎÒRMjpê)Ñ ˆj‰*ü”ñ-¯V“ÌŸUGæÏ<‚·?7hÒ¬m¦F›RµÄ³­}´âÚE—Ð1¯å•Œ%TVÔ¾Ÿ /?—"ª,ÇÌ1M#_£uu±ÚŽ×ò-¥3\?È{³ŽuÆ¼â†]T¤~-7š´G'°S£ËrÃ<ëÒo´Ó_’Ÿƒ[Â_ËÌåwáÎ|YÅñÔO‘Ù|k:ˆ	kìšt*¾c‡rLzQå!÷œßÚ}“4ñŽ¾]ìˆ©³ÃÁÑ«ÐJ}*yU¦¶*KQ´bÝßbBUƒ|*ª©Hñ”‚&¾jJ„¨ƒ SÓök&h	ûÔ˜<¹U,Ô’“c–æž 0'ÛÞª¥ÞQã[ùlüŽzõ$`S-ìv pçF,ç 7
–ô@M•m¸¸yÅmF°û€‚ç —õ}uiçØ ,Ù×“ªM‘Âî"Öv–ºæË[.Qé%N•R\ûûLf¢-wlØr×^`k¼g?¸çŽ í	ueA›£†DzYÒBöÖaÛ<ŠoAÎ’UÁ¶« [ÉŸŒ@¯$ÜAøØ8Ÿ®oÉ4)â'EŠH¶‡Ä‚{íÒÓ‡â"Òý‘³>˜+pöGÀžA±®ÑoÉ@ŽD@‚GÅ¤&³ù›?—™EÖ«ýx/Ž‘&ÛH²–<C
ªx8–Á‘*¾1ÇH§.ƒu°1yÄœ#¨yÌcf¦‘:"©yÈîË6ö‡yÎ+œƒN/Ï[¤HfìqhÒX§R…‘9ÈUõpl!f¹TƒðˆùsÆÿžyBâ&¨yÞ“%4¿qç±ñ@ì›p†|À:óB¨)“Å,€_ÅîgZþ,“ö ,‰¡?=r¦D	é³%˜ô=s¥ÔýX÷M¾'_Ú†‘?6¾¤b~#¶dt¢O#«{A¼4˜öñ¼A	‰Û¤AZŒÓpOª§˜óN•vœÜ%óáÁ…|{äüÇãñ°çý¤nG«Ò<Ù=ýÚžE9½ƒp€2üƒrûRç^„x
™±|…Ç€ÊS÷˜Za{må¿GgýI>hç:–ŒÍ–”¡ÞPk‘yNÌ|Ì_é¨eÇ&äÚ+ÓÅ¿ì¯ÿ¶;§ÕÕ$÷¦™®?ûöY„vÜû§+um¶EQŠáðÔé«ÒËtš];Š¥ê<yÝŽ#eoL~”2ÒÿH8Y"<$×¹ÇÙœlóläOnÕ0¹ŒÍ›²}ó¦i~åÒò¦úõ8˜KSŒß÷,Ä¦NÈl"Äï9ˆ±GÑååÍV0xtf71qsb­ÓË0OGjÕÐP'ÙÞ_î4 9²‚ÑŸ¼Êþx÷ÉšFû1H¯<
IPANv»~Ž‡ƒczpòu5å”;Ïœæs4„m9™Xþs|æFš£I&î1r-æüë°šÉ,›ùNI2ËŸ“Ùî{æ#í›`Ì*ý1²Ü ÎÂ#ã|º#÷Pð)¾ïà(†ÿ‡8ŸßÇÏ7˜&ø]³x8N½
è9°ã°F£{ÛæÍ7Øt=
¶!FZáˆbóuxC/ý?Ä2ØÔ>:Žá¼à6¿¯5Èqë}óŸÍS²µ»ß<ü¹ù§%þZâOºÃÑèVpù8ÌñÇÑ—à&˜-´@ü­)ü!<Êa£G~E‘{t.òó)½¸U3‚ê¬ E*‡	º¯òF9Iµ@ô¡@$ôl£\„V•¦5	·ª¬)Æc÷ð§„ÀPð‚`•¨¡Þ~Ø†[-34ÍëZŽ&‹$ê\Óþ›Á›,]-¹
o^ÜÂcwbd?=¹…[šSÍãÌÇ‹æ[úƒæÝU1Þ`+`ÅéM[Ð¶:|c$ÓeC‚¢ &³Í“fSGü]Ñ§¥:ç°zôôªŒÅ'Wõ[8ˆÆû8PÛ¤ò3þÔJùM\{Ê%¯ÆÑÓçÑJÓðœµ!ds{7£à—î˜	¯UcxP¨uC›YL±½ýÖiõ…9)Ï.4Š9«»w<™8›ºMÉÊ)œ±Ïm’°Ùëi›ÉÔ¼³¢aIuí²
už‘ußÈ7¨ÏR’¶ÚA(ó¥÷Š5±À¡œÆ.î´-Œ#”fÕëlh~ öä'ù[p#4 õzø°bÇ“È 3&Èq2*|œA´˜öIÐ	HÌ…s.lœSa#Bac”CðQ:?Fu{wBòQk¿õ–¼~wúN@ãH(ŽM†&y‡cØQÂ´è[#wÑEtv¨?r‚ó¯¦ èµ	;ñp´D±ÓyZ¦øXQ3	¡‚o•gk)F¦øX¡4“wjæáu4)TC–òÉ	8š
‹Í‹‹ZuO¶'µšš•¹×éÛëè¤D§¢b[’¡úP<Aé¥‹dŠá´®ÜÚ»'AG¦nžÈV<u6–¶|M¡â_6B…usøG~;W¿Î A@6‘ñŽw£qDö
ƒ¢ÛìŠM†ŠÿZáö›W•6>TÎš/.Ü*¦¡û8S®=ö„wt­$­‡ð—^<»†”s>yñÌè3›¼˜(óÝÀCIÑ-´¸åGbI!àfÿñÐ0‘#;Ëöè¬òÃ³=˜ÞLjOWl¤à1¯0øÒZ¹Ëúš,F÷Zzƒ©uÌãwúzîµ¤ÍÅ”¸ª?úåÄ[š,¨¹yÕãŠê§3šhòûXVGQ/ê²eÅ(ð«,+VëeÐ?bV9MzékÁ=Ö]dfŽœïßsé&öÉ•ÙP)Õæ”Ÿ¤ ·¾dˆø™Óòño~õ²†&‹w^‘zPýî5<:2¥“ïbñJtM¥ã2P÷ÂWYÀhUÄ‘EØÓeÅ–ó\W/¦}û-º
¨¾l[½)’¥Ã(äYÞÒ72aÚ:hŒ6ëÎP‚™¥ý¹™–¦8DNñ™ñÐ»¹2Å™¦ztji^§m‘&-›çQ8­Þôì[ž³7³©sUJD+ÔUÇŠÌ¿&éú—$OõF¥ÕŸƒ	î­áE0í¹ÄU¯}Ò®?Z,Ö#ÛÔã9¹MŠÚ\6M’ê¤uøf—¼níîïƒÝÃ3rðn§¹OÊow›;»Çdw§u*lWÛû­í½…|&,kêy	ÿO‹ÖŸ­‡´h1)˜¦ªü'ú>µ—Ñ€ìD!PäL\zÆšöOû–bßÒPïßÚì],M½ÅCÊðàó¿Ž`äŸ.zÀ×$ÞW£6æŸf¶–EÂì5DnmçD=÷ 1?'wänÑÓ¨B'¦íAÇ£4°:ižÅèò 1ú«èlR­Ãþ0phI¥x/W­	Þ›¿bŽñ”ÖÛX…Ì+W.Ê_!¢Å¤µ% ;I…”«:
;ã¯‹Á@¤µiÐIg$W¥X"£‹CµJ`~JÒ"¯§CWW?2äÑâD.Çó€·+ðÍ.†'œ‘>ÆZ;»Ànl ¸ø¼õäDNŽÝM‡OS%÷D¤Ÿ]J/æÅ ïÓ¡ÂY¶ðcmƒs
Þ9Î²=ùcJ/Ù|õ2|¾@Ûæœú½SþÆ’ðÉÑîvëuk›É¿L$žIî1W¿ôÃŸ¢ð×…û[QØ²ð(ÈíeÈ(ò]”Ë™Úr|ü)7ÏSn¾Æ}¢“éy©ŸÈN0yÝâé ÝÙ$ëÕ|’µU§â¦Ó’çföt«P–:q¹ÜYýqi<Ë+èØáTÉÚ±=Ñv9Ú¬åU?,Ó(¶§äz$ŸFqØqÜæ®±ÜÛ‹2ô_¬nÃâcs@~¼–å|,>¦ ¥¦”3‘ØÜÎÉÀ
Wã‹a{:nðÇS)ÄÑôïzoXï±èë)1ðc§_¡¸|'$,«iß€‚ÿíItsvA†ñ‹Ò6Ìî°"ÅF­¾²º¶þÓÆ³ÇDÚ\Cþ>(›f i¬$ˆÃÀÉt‡_Æ/nW\¤õ'EË­¢ßïU`9fŸoAÕhˆù>H:±6ýÉ¨Ž¬ÝØÔˆu!ŽŽüü1=3~d¯™=g ~{LžøüÛ¶ ö;jÇ†§´„¥—ì¯+rÎñòIÔÃ /Ùß‚/¿¡ê#þ[ðÅ#Ì¿:˜öK/Å7¶0¿ôÞ}·™áw³Ïü<í÷‚®–Å=w˜‰sÌë_‡ô©9,H^¶.ýÂü6;Câ…ø}ÐjêÿÆ“fS7¸I‘6º“ÉhÜX^®T*.’úw!n#€p’Ú·'EPÂAÇs^æu-dTÃž°Â=ìÏªúzi•Î`Öc]=p\a¯ùŽåÌØêü§’[Á$èYçÔuÄ–ktÇÔ8mÝ\5&‡:.DáYF.MMíªÏ=¤I·Uoî¨¨n;³åÇ]KcÐuñ`À®LOYO¢þÈ]JŸrÎ—¯OòX”}î½;|Ý:>hž´ÈÛæÑÙ	9BÌ—7oš‡Ò±((dQÜßAoR3|5Çùf²žU«Ëëæñe®P,ÆuÂ)o¦'Ž‹ÒI¤~ø(nŠMéqãpSmæ+Üv®Ù	â«†<"ÉâYá'‰·ßsrœt²Bå«‚wñp©]}nÊµu_WN`ÑS9¤ÀÄ¢ýøóÇ‹¨Ðkj¤¸†BMR–8õÍf/Œ'§qà	š-B¬Õshj;4Žñl^–“ØÞ¥#¤à™Z‰¹Nfih¼Ñæáœ¨ã¯´æ9VWjMÄK[” Båë¤½
SÑ`iŽ‚+PUšƒN@nh:,ô£ì‡ƒË.mh=,S4áÍñØKóè:!1½-u<þV³’½JRÓÂ^¾"'!¬ûi—×Æ$QX¸„Æv"Ñ”8"'ÓQpŽc=Û‹*ìƒpPÑÆq¤ÇÎêÕãòŸò'¶˜i;ët†Nkm]ªQ¬+BE•RŠ¹þ2e}®Vî+Ï°µËHjÅZ®š¹9ÚÄçqüý¦ŒÓ³i;ûô\&l0Jahù³ŠBœA‹âßxË+YÃœÍ|­”ET±E’xü&¨0ôÏ`‘1?ð¡m6-øu6áGy,Õghã/»ÇûÍ’æa‹Š7GÇïÞï¢€sø†Š: â8„J\>œ]¼ÙÐÅ›~çÅ›9Š7³,ßX`ÁÝ×Ô^Gðšº"ƒ¬ÇÙÓ+ÎÇÃÞFBÌºè?í,ïÄjj†“ÖC*+!_äâ
"ïøQtL©Lôm6©ì~‚˜ƒ¬ )ÌáíizQÙd3ºûÏG:3íb‰àc?0É% }¨Õlah|àÓâÔQÌ$æ„D¦ (¾íÐê(^‚v7>™„#|O…(|6Ö˜à)[Á4g"óå¬¸Ý©Ü m6BeEh(ŸÀ"ª	h§!º >h•^ðŒˆEFs{·êì2è{i2\ŠÉE<ì'ó‚WD°e—µ[éDšÖÈ¨CbÂ0q“nƒ”ª-ÙbÎ%îËŸüôD›Â»¿~²½™nåørg,r ZY1·k=êµl7,—.2zPÇ¦o*ïcC'Û»¿jíÕ%„|Û¾íÉ…ç¹{þ—¿0Æ&¦RÙ¾á½ å[¤ñ0è¾µ¹¸7¦¿xÆú““á4n‡†10tFˆÅØ¼»Ç¹ƒn&å7È	þiÃýðQ­¬AÄ;ü¯¸pI©HkÜÃÉ¸Dþ‹€ì‡ÈKÎV5H_¦eQ]äó0êèM}Õ Ç!¼WÙ‰`à'íî&ûyNN&0ËMZäfÚÌ—/ÿr— :°¡ý êØd‘_>ÂèNÇ!}{óUºÎ´=‘a‘üŽò;Ê"wPdùÃGŠÜÀ‹‡AÜîþ}Æ7‹É5ù-^.•Ô·Þ«hê¢+.*a8ÑXü’G¥EŽ‚LÀqNºÃ-ïH¾¢6¦Ç/Ë¥Óé ˆ”–Ec ö6Ð:<°ÈãÓ’JRäÑ©îð‡2gýIû_ŒÆ'í`0Hk?ý¯1T©× Œð·¥JKáàs:<%H¸ÂBY¹®w…•¶ÝFm¦'2îøÛ	¼k"‘<-f_½¦´–€9½ínØ¾N'¸s²ÎJ”úkÏÉò2©a<"’z½A8%¤¥}ŽÂ/Ðò–ôÿ¡Y/³±ª_×éß•ëúwõz•þ]»^Ã!ÄŸúÐÏ£^ø÷Å8ø"èÛv'›¤DóÔ9P®fÂ×Õ[Ý¯‡ñß'7ÊŠSî(Ã0çºþ@ÛðoÜßÓßJIŒ…¼Äé‘IxÜ¥KäsØá$œ^°¼ŽãŽƒ®-Ù­Þ4œ‡“î¬ëIºŽŒëÖJJb&>ÔÌ€›É%ŒöbxÄ‚ªÁ‚ìµr:4Þ¤!^¼JÄÎŸÓŸÇ5¢öô1i|ËI½¯’&T`>(ˆô…;©sÃr•ãp<íM°[¡ü;§ #4cˆF¿xåð8Ý-ýâý‘
CTdz‡‹õ‹@¢ÖUïò.FÉ/$@DæÌhCTÆ©ÀÝi#!pZé|2‚8ûÃ²Œ}Ä±›i·yö^ÒÿD¼qô¶Ú½)ÈWeiÔºƒ¥³„y9Œ£âE	ñŠÎû"¬z&.I/|”i]0…ƒ Œ—>
”ÞÇ°3—Ûô§Né‚Jþö7¸‡´ù’T’F*E/ÒÂ”VNójçÛPLžÆÈÞÄX ¡5q6zÞ7ˆÕ ¥jØƒÔ$úª¼ úˆÜ—ã“b£O±-+]4þ¸Õ¸NÍ¢íaÏ’?ü–5D^V±ÁXïq8è&!ó?ï0kà_i1ÀÞx)´ÀWÉWÎØªê‹ŒuIÕ44´4œ:ê˜úÛ—.ìÏ§ÁH=+Ü°©zÚé…GÑAó¥o?y¬u\ñ~bCcCDj÷xEJ‰‹
wå%ÈãñÌÿ$WÑÍuæ48sˆTk\®WÎ@¤†,ë 7©kÍY^­ú”õ»D­‡fÑTZÞ…üVs9…$fGÍÜñIŸ(‹1-ßéíuéË3Þ9¼º,§·u4ÊÕånG6ŠýF7×$™EîdŒø[ýà22qáËoFýK2ŽÛ/¤ÇïHÐ›ðôlÐbtâ6™áùoÀè€±|ÆQAn·ÄÈ€zÔjJ (ýJ1…Å¹JÐ“‹0ŽÃøhëéæEi0\—œ1ù@™ÎNÙeÝ,$þS=ƒszëA=GAû
Ç· ˆ—7Êßáu+óO²€LËø¹ÆÔ£ÌPZ<ïMR¿nÅ’ë“OØÖ­Ñ5>ÝP‹¤X!)®®ÅLIKãiS:zw×î†{3"0/¢<<9ZÝW•­ÄàöD!Ø´àdâZ {j9¤èHçwŠép:hÃÀ„3)Ø\î®:Y‘Ñæ%á1]Þ*r3j¥³þ´_º+ŠÒh¿¬M; þœv¹ð/Ó‰ yÝhOÞñeðóÔÌcQ¢y,JÎŽéáYN‡dXUuËšŠÔÙ•y5÷'ô¶UÉ!†0AÄ±ØÓÝßõ² O9Ÿºšn]l‹âž¡­[6­)îñ£­‘OÉ¢¹#;ÑÂaÿÒÐ'lÌ„šÁÍÒ½ó‰¸µL#ržÕ’.Ô[Ic¿íc{Øo#€ ÍUõjÑ‚yÁ‡QôƒÜOÖG©ÑKytÅõ(µ‹)®¦JW×JÏå#Ñ¿Ç3ÑdMI’D{/¾,}€UÒ.¯Uÿ
¤Z_‹AæþHÆý†zc¥–Ü7£Ïâý••ÊÊÊ
-ceÅ(=½»Z[ÏW)QD}þ“Ùtvgu}ÃUpZíäªY½®÷œ¾‚RIŒ¶8btL¯ÚžêŽñðK*Šòó{ªKb3x>á`0Â,4 ÄÛñ°×Cdlöx šéÄ²mOH/ÎbžÜ*t~÷‰wBÓ5æ}«öNâ™Šî\ÔÜBJ®ñÞ(è  ˜ûZ±d”E³ŒˆÆmA#ÊCz)™M§94ý;=µw¶C–òàÉª¯Q’È>Z’¶6~Õlî(ŽÚùš›«¥yš¨µ­¤Ì£ÕVá9÷*ìfŠuÓL1£‘B#žÜª<úŽÌd´Èò,R»Aê\',Ö¬âÄƒš+cÅ“[y­Þe˜-¨nLTSœn¸Èi²°ù"e‹´Áx„šúø÷i‡²è·>°„bš	ÂkyÈcwøÖV‡µÙ¬n›Ã×±8Xì·*¯ÂÓJ&spÐ~Ç€uÐïŠâŠ[µÛ|ÆˆMgrØ(d¿ 	óJèzøs ]¨So!:Ë£ “ÄXÍ|].…Ÿá‰1ñóÙh\­œ@©5BUCøûzüÉú•K²¸ƒ¼#pæLKGš®Yby6ßU›=d=‡?!ŠZØ`¿?›4 TãIT&¿ÁÄéÏDwráXùýzfËË¦}…ÚpôìüQ3«<°9EqvÖ•$"„]~r›Š^wÙ–—üÉé•ÃœuP÷mæ&Åœ¡‰:¸÷%R¶ô~f`£’¤}'…Ô%Oçá1MñXº‰Hý­Žå<œûKÁ3ág¼Šõ#Fý ÿ‡ô ¿ÕY00u`¦™*`Ö½ˆ¡ÖÂñJ;„;d“ž
¦G}rgÒÒ’Qa²gzîèj@9üZ þ[R©T¢ÔG[u+€Ê“Fo'Ã	ÍÞL§8„RÂr9h·I¢pÁ/ò#;ýLêMÈ†ükTµ°HS7ÿEuÛþ@PG0¾´IY5Z³íP5õ;(+NdlãÜÆçÃA	‹–»§ÁùtpJ¸ãý ûµ¥3„iŸ&å3¥Z@?½ðœ¦§êN{ÓJŽKšèk6ÁÝ6XçTÝ<Úú{QjÒ ¬]¼½ÉæsAR’yO‚^gH&üeP;ÁÆ©µ§WÓQ$õOí¡ JÞSÍïŽCÂÓ[²µ"wá9ÁÍQ¡®}(hb@Ñð‚È¾FìÐñJ½× JC¾Š®¢Óöå¹Ü
rÝ˜ƒ`Ò…Uv]®.&Í_JË­*Ö˜É°Ü ›„2/ÃÉ)þÚ–Ñ:yW^P*çs†Ü}u´©„jÙ¥ ž°[%îó„Ím¥¶:ö2M’‰:¿¦”ÉÑŸbŸžnŸœ.Uáóô¹Ò9è3]ÞÔ)k°ðö2ÍæneroVw¢Ëh2¶uÇ²r”î$†/ïSÐzŠTQ^þ×Î2°p€Êtˆ°¼´J	è)†ÄÊõÔ•qø;4R	èUÃ¸Œ^¿ 7[& ³V`å[§T¸\FÔ9½†B>ÿc	$–´ãwËOn¡‚Ä\Æ'"uÃ„·Ä‚Ž`'Â‚œ=îU°…_0™º$9²l‹ç¹ûõ6æ—èŒ‹ª»®`QÒ‚kˆõ‘Ü¤K¬‘.µäŸŠ†19â‰«`ÁmÝz2Áù2¬ÀŠB‹[¹DoþJ=bé•N‡ý¨”4:ê‡ãIÐi‡E(f1.>¦“ø&Cà˜"–&?	ãÏ0a ? ME'0‰‰~	¢	±¾t:ô·ä5[–,@‡l&¯Æ‘:uünB¥iiËÏLXøFÂwä›XÜP8|—æ¶Gv‚KóŠ¼ŽÆÑUI~ B¡0yÊ´Ã0ž¡$Ì<ØäÇGa!±­
ÕÐ{ ¯5ä%ÂD¶:ªJ10q“é¸aãÈb[%¾–®|85µ–Ðð="­½ 7…ñÅ—¢X¹×EvôkùQCçnJ£Âóà2Â®U%‘U²:¶yÑbï&ÁÞNqFéæ1c ÜCÕÙÅVÇàÞ‹=Ô’h›åšeZÝ	Ï'Ùâ«ÇR
¬"^‚\ÞbK•žW>&­üéZ
”Ü»´dõ¤õc'S_÷.±X¬›®VN4ÂP‘ÓæÁVómI½÷Å'³, ´Oh–^lû§”|ñ ¤‰'·¸úï>©ïŒQ0û5¸ê"'ä“ = P £A9ôdAóû“ï™*D[ñeŸr[Uêg©\A*÷ÎeÏm&»XÆ;†îÊ5'Þr’à½_$]õ1mÀò”kêÑ¬›\E›ÉNG°Á$cf’kjÌAX¹)P"’ï$ìÃ{* øI$”à\cL¢+kâ¡VØùœ\ŠUPTÇI‹ñ`E({Z¶Ú=‹¡©8^ñ²-¡95Ø =n®uÜÚÓ˜Ö d§A²ú9Ñ=Ð¹"Œû´Ü±…£ý›ñ«Ó„øh‘‰våß‘cécàbY‰]á/		hQgeIõQãH$ÓƒšàZë“íŽÀNWÔöÆC)EÁZßÓP«äT=1Pâ–ÇC¬k·1J””Ã8j– a/¬ÐËåRb9£¿¥Eö%)ž[vNÃø· ð9 %t0‘¸?Â€ì1IÔJ)×hêq9#Òâ#{r3fŽ²ïK4è¿TèseÃÂ
ù¨D‹ôÂ°þ E#&‘%ÅøA•BnOÑÞ¨Ð{HÕEôIV8P™Ðv•¢}ß<>;|CNß´þ5àÏá3?ÂC;Óñt [hW‹äø´Z}¶|ü¾Z]û×`f¼`—&]Ü›bàS00Êxáýè:Vr‘'·z¿£ÎÝ¿ŸÔ§O/{Ž§Ñ``>OÕ&ú|2ÂéC8?z1mCŒEõ.öªÛ2óH‹¿SZÂöÛëŠ„ct¡´äý$ãiŒu1ºÆ»A»Ë,Yi´·j£0ºSŒ]4¾l<=g§(Œ¬T“U&úôäv ¨(ð÷ÉÍËúŒ0’Ý‘kÂæv—yçN+™nóÜ'êÓñÊ+‹â…9Î(Ûi;Òýp Ë`5ì6¢CÂž¿”6„_ÒÇ&‚aé•ÐP“2«aA¨Ÿ´#ð@2‰bC)8÷ÉêxwÚÜ££­Ñ9ÞEá¶0ƒ”b¬ÅŠ­¯"úžh"·{{KÈn±´ÚY¾îŒÒ©=™p³¿»oKyîéîqë Iöš'­·¶§¶iêç&y»{Ð<%'»§­æyònò0ß5à}’·±$ Ùy*åÚžK!F³;ÒRÊOÏÅCOI4 ò9º`kZ0Ž ¶0µK34ÁsjôbêL¯@ª"ïÃs’TW!;L_—ç[ïÀá%i‡“àŠŒ#ºA—å=y™“…gîÖž©R–åìK¶«bt…À«‰þ€Þ^!ÈØÈtÄiÙÐÏòîÉöòÑ»rÚEÂž¸± ðšNø™1H&—“„y£lº’p’…ãÉ}EŒƒv;Mš½»3này¾d'e¨ü 20	î„WzPÛ¸¨Ò³ôO«¢£þÜ¨®]<;_Y½8ºˆ½?M®Ä½K„—¬—zqæ)Ô/(kk×UN­V­å.çhO8\¹RPøÓF­üT[úi%—VŸ=ë,m´kkKAð,/ªí•‹úS:ÉÍN'b#FpþD'ÏÎZ;I…˜ŸêƒtAðù®Â¿V`6'²Zh§Ïœjž^*Ôëë3…®aÔ$µ Òf–ÿrÚ^èé6ÅÌdƒNþF¶» Ò*cL›ŒBÐ¢1bl"ðfù}ŒžCË„þ}Á&0†3AÕ¡ j”4ÛJ1TÚ€&±b½µHI{YóQ¤…î÷ƒøFPl:N È€Š,¿N†IIò8'¤R[ÔªèØ £<"Ï‰T„Uiª
?=ï‡Pø×‹Âqå5ÔÈm7ôaÔãœÕyA/¨¡Èçq\©º¶ùM4,-kA}ñN¡býQã¸ýˆÚ¯@K<Þ¢Ž¼_'Áø"”rÅK¹â|ÂY;¡ï ¨†.Š­v	Rr}™×Wä³û‡Y<°^cÌ ýBöÞ%‚yO“éUÊï‚röµ~ÖÁFµßW¹y8@	\€xh‡ªà.»’¶•=Å£2ö¯ëÚVI½óæ„ßØI½¸qQÅlgçê%¾ã–(æPOÈ€0Nö²ôù_Ø´Ô²´ï)Ï‚ú¯TŸ3nC¡ê_JTb½^­ó/Õ*kÌ6hôtœTÖDYÈ1Bö·,­P»;\DàÞ\_Yÿ8\¯>‡?›´h.~ã…_¤/ÛÜ‚wéKì;ZÄ·¤—ž{ÖM±Ì˜V}æ¡ÐÞ-Ó&˜öï%šEèÄ.f@F¸BÓgâ,Ä«x.Š2œŽÒ•xÏÈ†®D:l;)W¥ÉFmªûc<-ä¢7Ü~Ué‡ãqÀ„sùqœ¤cðVŠORB çh<†]{LFÔšYAcò‚^oø%ìhAu¦£vs¶§0´7»Øø’çÁÃ!Ê_X{”?f’ÐÎàPØøÛóYvX.µP°0ÄZ;Ñ9+Hšø&û#ç²ß†s/ýLI9ºˆ¡=ºvÉr¡ÿûßÿÜ9ëÓw{O9S;Ø=Ø:Ûk’æÑ~5²Ó"§Í-²Õ<>#hÝ!°K‹hÛ	FÁ$å÷TPèÊ¤ƒ2~Å×

Ø,‚nZ”á£åvŒö¥½`‡‰ÿÛô‰¾%$Åjk5^uò}oÕ­hTìÆáÅ"yúë9TõÔ¿ú\ûO²ÊÒ«„@~àòª9%¾¬ÞožƒØÊnZ¶Û70½DÝ8Òhƒ ÆeœÆ·RIR‡.s7åq0û ÷Rõ'Ç›šV• #¿pï²‘ô¡?ð:÷OÐACÒ»<¨öÏˆUQ]/|$#Ée˜ƒ–RÔ(fÏF·¢¯TÉûÄQ¹ÓœÚIˆŸŒøFw¼"O…øZÕæ¸O.ãà†Åz|¨VÖ>>E'«§Jä/¶ðä´µ½÷OÐî›;»ÇdûÝáéñ»ýR†×:!»û»»‡d~,’“íæá"ysÜÚ!¿´vß/%²uvøfïì„ì5OÏ,V}|qO¸º¡¡9½RÍ9•3HIGÁÌFIlR2–*«{î¿ÄÁÈ’¡EÌ„Œ¤y‡ãpn7v› ·à`!Û"ÍãÝf&J­=¥Fûâ­w¦Ê±!ù'``?¤ ‹h<,ÊTF`a“¢Åli]	ðÊ“Û´&$V	V^”^SAå“X6J¬þ «"ù|1zJ  3\%ÆØÐ°ƒ%ìB£¨˜vß9ÑORDyí’V‹b“>;Ã$'íƒâPtèS@n”˜pïk˜qÄ ;–BHL‹50)'i¦3-¢c@F¸:ôïÃaþ"žNVwÄlmòÁ¤­
c<,î5pdf» ˆžËõâVý´cÂ9È¬¬ÂÚ%?›‚²§Ÿ[Ÿ´ _±×·{Ãqh_u®ŒŽ¬g8Û[luO†T<óÍ€F	óô-ï±‹;!Æ}þ®ÐãÌ2ýøqe›ÀÏ,Ì¬8¨Ì.›~˜k6·º>“¥®]Ï·ØM~VˆÈh<¯%3´$g(4æO™Ìådó'Ûä4bI¦Çf9ríÊó¥Í­°›Ê»Íãí·t'ÌÚ“Ð^!!tÃÚ:‡ûP[¥¡çÏd0ËÖ@Ä^xY i<âr°øG:¥7ô‚2>nØŠ¿e2kGIoêH5W4š:GÌOx™\	¼K[.G¢½gwÌKÜ²ÕÃl£X¤TñzŒ"ï"ci!-™"y»ô#)ÁõŒ^ó›p§zÐÈª)!og¥ÕÌ;dŒ/&žÛeòïÖÙéé»C“¢­œÕÎ1Ôb;·TÓ®°	™ç¼â—–ð\·Øj
Un¦=ÜÕJPë€g"Úèò>h”ä…!ÐœÕwŒõKáIgá–Fà®Ä*mZj:~p;Îi~kƒ’o-¦è”¿O¿¤ˆ:™8²mwÃÏñp°3ü2P{‰*R—þ«ò=Kê9sGÐö}½P¥÷øÝÎÙÙiµö[oIy§µ:ÑáÏÍÃ7¨3ž6š\c<B{S!åµt«@Ý
ÏK,½¡er}¯NFfôn¶d«ƒMŒÎ)1óus.¾ðps}]ñË˜AiÍ¢¯å’«Íì{rûBU³®¢ ‰=!?V£Ö­Y®,¹j|ÐlÎ´/VÁÞKeëß™yœÍô5® n{4ý3[r´G0b	x@ÂNÅD®Ué¡¬€‹*¯ÍCEðÖ( FèW„¡}wä”ýü}r“ƒ/X÷7±¹¬ÌÌ"1¶&3k«²ü÷š§ÍýwoÄü—·v÷Ï,xD¸h6›[ÒZ^6T¬H…"MH~æ"³ƒ”ŠÜPZ¾A)3WÝ¶;äÂ;ÌèÈcÈ´sIÀX&‹†îa©b güµðÏ:M€d°Ð›žÝR—]yä™BŒè´ìÞ—`›ÖÎ•î€ÓÙÇÞÂëìÜÎ‰Î¡¯[­žEb7;XJ“›â‚XT9µu¢-üo"£ˆÛ²]âˆH½ËÒäüµnµN…¥ëý±F°n3ê¥{ìÈ£%Å‚™Ú…‹˜eÛµÊ”PÚ¡»[šñ¨¹ß:|C€pNÈÎîi³µ7Oš‡M]]0€n1ÑŸiuõ‰ûí¦PWRŸ]`:Cç8·„ìYg‰u°ßCô;]°œO&/ß‚–('	ìoXwD¶htUÝÌ–
/ã'ÍI1ÖÔP¼l¦‰¬ÆD¼B$tª7àW•Ø´yrÇzÊc†ãŸŸ
My6-¢¶X6¶J	ØÍvjìœÌ+w¸Träl~f!…ZUžhŠà°¹ÌŠ3ò&=¦LI÷)ä%JYkï ƒ‹A´ù|Â2–00ë:uÛ¶½Åƒ(x‡£€àÏ’ù¢#¡ƒ<R‘5è.¡þ³ààY÷¿[Ñl;Â¯}€5Ð^üÜÖBFÍÍRf¯Æ¹gÍ”õfÓ³Vh¶q›²e&#àR Ê”SÃU-’˜ÊìÒÍIw8Â3º­æË÷@uç• `7tKP.t.\kã`€²¨M`™Ö¹‡¹S¬s	ÃèŽŽ=È¸Ñ•Ü9mjBnƒ£š%¸bJ•îT	äãSys†’Âú:U;¯
co¦Èl¸Ðð	5diB6íÃ^4æª®jEf¾Ó¤en"gø‹…áí¤fœÓÜ‹Ö8­“½áx8¸,¦ï‚Ã¤$ ¢,{P3SüÛ…ìÎàrŒ±Éóèžˆœl.¡Þ”
E^ÜöQ[-O5lSåvNLS$[»æÎÄÔ>žýÇ8ö3I/‰Ùw	yr
&¤Ÿf1]†(R;Èp®Üîj7,kBK»qÎ—äiOá¡ÍgMJà®0ÚAK‚*XÖVÎbÒ²Djw–Ý6ë ¸ˆ†åæ¥«æñ¶År¬tõ LÇš=­ùœVßÑnòD,%U@ïñÒ`Ú"ý=ôéì3öã7š±´Ógì¨7ÿ	ób¾º€ŠMƒ“Ë6”!&°[óaœ¨£¼ædÛ‰ˆ¥dY°&#`áÒ¤š~b) °|ŒLsÐçJ4F'^·Y*„€Øý	ïºk¢s=x$fÂç(îÅãNšd²û:ŒŽ¼p••Š¼Þtë¤ÍëN"mË‚/·=ëˆu«Óz¸÷ÂÎSv¶=.;2Š|7rRÍÇÎ	ÒÏ¨=)€T±Þ±|_IÎµjUß¸Mh0œ,ñˆ€§Ž‚˜—¤/£Pš@Ij&CÁ¨Uªõƒn?‡üÚ³[•wù0³ë÷IÕb`ñÙ)=nþ³yÜ<$›Í8~9¦HÏ¦@çPí¬Ò
˜ì?$™»-Á¾Ë™%Ú~¶Ýxlû›šýðâÞ3óUìe‘aØýMÏÓR‘ÅÇiŒÿ=Ø«õbN;…mãÃSŠUîpq°{ŠNLÒ’;Ùkî7Iýu«·¨^ËE”&Ë"<‘=ËÅ+Ûº¥ˆª¦$»öpÐ ïÓ…“EÒÎÃžtÆµ?D	ChÀáq·Dî½Å$6QÃQtyy³®¤JÒgx=GC ØKB¡›³jøûqë$)]8z§…óÛ¼`Åo<£`o)ŠnbÀÍv·{RéÉ3¼üí`‚±¢Å°+YÀ°ùÈì¶ÜÅâ£c[°ŽóâÈ™	ŠÕJºÁ˜£ÂA=¢Æ—þw¢ñ—à$ãº
ºW6Çiä{ZÃ¯[Ô Ž3¬èÕXçsSþÁÇZŸÓ5~¨…Çž‡Y|²}³ñ“JJéh¹Ë4·¦#¹Óeš¹Ëýº¾”FPÉñR†[ u>ûH("´ù,úìêò–+é~zæËØ'ZÏCL6ùŽÄ6£ÛûsøM*éšÄ«i~éë±K¤cŸ†DëÞåg˜óÄœ¼bøºè–Òu«x*©Hþn1‰5Û9u£êŒãÇÞR›~rX¤µäUbÖ,6«sêFÕÓ[ˆûx´úÂ4\w¡žF^#ƒKˆgúJ.ï´H\/±É:zªp<ÍzU&é¬gMÉtuÎ¦ÔÌ&%ÌÌ¬&—´â‰VÅg,ì<yEjéEŸI?·Ò¤zÒaóÒ,.¦è`jq/U}"pP,Îö7M?ž-ÅecHîgô[ÍYdós+°SùÊ“Ä™}nmÂ‡;<o™š9È®j¨Iü)‡Ó$LÁÂ1ò§D+®®âêhðGÕÆÏ¼3‰ÆÅ¾r¬tž
&qßpæ@N?¹Ë™Oc%Ÿ¨LÏñ×¸¼éLÀô)O™(ÕÓ/ì\Ðš9ýxk|ió’æ’>ÜJ`”òQ‘ð*åY·®›>{¶U"×]F¤:¬.÷µ÷í»rzvØl‘rëðèì”¾;h6÷ÉßÈê½û­æ¡=6òÖ‹&˜ç„Þm½×z‘ˆêŠ˜ø#ä»­9'
K#îÃdÊ4‹ùó­õçsÆù™UÁþâÍOçÛÅ¾·db"eJ,6Ç^Úše:NÎQtô‹¢ÿ¹³Xe°d†ÕžG¥ËwZmQ~„T ‘<ýÍÒ+¹ ùJÑV}Z_ô¢L¯Ô²BÈ\ª²{fÏ0WÈQ0ž‰™ùäWÄ«{eérYîÐÖÌ¸<ÊH,épF<s˜ó)%âÕ
î½(¬zÍFÐ§Båªã*ãä4˜®”æ4Óœ[ó­‰4ú¶xIÞÐÛgèC¶"EÞz­ßó
½]qN‹ßËnÃ„½øïS`@)ƒŒnì@#È´1¯f2úÛ4ßÑ"©³?kì½XåVÏ ?ñ8YÑfdXè¸
ò	zùŒt™\›ë«F9`Á#O­±Ôºs%KâÙRƒm·_øeÝ‹Äœ8A9‡Ã«©ÁH’—¯½,?=¡X†¬»øü°ïŒfyb¸ØFÖaü‹ †Ô´hÐPÚãJJÆ+ó¨ô6cÊ'ÛþäQ<­‰!a ©|á™fØz¨$"ˆK<ì’“Ž¸ª“ª¸Î¥hE¹ýÉªòf˜j˜%(ÀNÉ­bÔ6±kz‹ØU¹=ìŠÚvÍÓ¯–×M«`˜ûÜz§”¦‡c æÁ A£Û¨œ´‡Á÷—ö;[lMvQÜW<À£WŠ‘’RÙÚ!‘®Èy6;cG<
°µL—Ãð]ýåt¹ÕYz*™_›M]f®3 GfÐeÅQ±É¾
üûWU~Y\œ=nÕ½oÒˆW-.Ë['—G}/¶iS†_ÎzõfšMï\+QªÛ´ZDsB¯›DØ‘I”MH]¯g)µ‰h+µ¹çýÕ|ÙKÝÉd4n,/£¨ò{ÌaÃÛÃþòçÚr;±¿ÇKxü¿üjý¾¨mT¯áÿCÔß Ô«5ø¯^«×××`~½µSÙ~WÁ©«¼ÿ¾Z«m<[;ÏjL°eŸzm¨qum£V[[©®Àk«Õ5úÄÚFµÞÚYƒçÙðÿµ^Å	€"Ön¢;Hs}¥ºÚ¬mÕ=Ö„ 7yQbÜ&ˆ•¦ðq?¯šZ0¨þIüö“ –*Ÿ¯‚J‡%bv"Ô$Ù·]—P7|.;7V\àŒ€/e‰yvŸÃƒ½†Â”—¬¿øvá]Å¢]lf¶Ug¸¡n,DŸn„øE¬_‘ó•ì.qÃÚ29žG½ _B
R”]G§
…ÍäÚ÷š'[&ú°?mì¬¶\|¸¢ïÅÄÄ‹˜X—,¾¨ÞÝÛË ¯ð8ƒ	vSò]òZaY×-c`&J?Gu9ÿ@g·íå[MÂ·á™{Õ±Ùnþ*è©H‡ùÃq³3)¿Ã ¡ÀÓˆö–%NF¨mæïÅV'¦$OŒ¶°h¡ŠçHDù·"ßŽè9\š®¦¸žÃ¥NÐö¦˜…* ,e3|ïE¢æ«8”€‡Xú§MŽ2@øãE3³Þ‡%8MÝCðšµvØ¹5	ëûg‰æCÈHÇ0;ˆ«(æû›0v.,Òsšü­Iæ(œ×¡ÒÉ*ˆ£°œ²hH„åÛM3P6R•˜§îÍíÁ™©)?ÔNŸ#ž¤:½PøÑûCF")íæ7ˆy¨œÁš=5gl†2h±{^Äá¸»ýÅi+xÑxx`niïÝáëÖñfqøÙæ½gÙfÞÈStðn«µ¿KŽšÿ<Ø=<ûÇÑ»£³#Dôlî“2û±ñdowv™eþšì'°Ùd½¤çƒv˜6ÇÐŸTØ»lˆHêèTöh +—BããaÆGMIóhT6%@jp¿x8‚+Ó‹t„"ô0²$¤P¿6ÈÑ ˆ4è½¸½%70aPï_K&¾5Ÿ[þTÕ| ¼Ž&e¤+Ä3xvŒI.Ñ…—7H}mÁ–..@wð³n©-ò“Xº“¥•ëž€mxVÿÜÕG!¢t·Nè5daÄ]‡¡4»x`‘J­0Šš\å;úƒbþšˆ™ùšJc ì1C>—†î9§¬ïy¢©QÞÉ-M•aÀínœÃsÁ!¶ÎòŸl¹,‡hå³Ú*`É_z¿¸-§lãºì^™‹"{Ixœƒg¶bØNu¥;†­5‹X­õüÐF^É@»J‘øT/Rž%ámàj7ÕD›I9÷a‡x¯ñ ïÑæ=ø-üð±öXAøðóˆ€øðSŒ?9 ùhWçÊ‡ŸbÀ|ø±$6±®à¯Ò‡ŸÙúÒÁ,
Ö§¾Y°?Ya€_	¸ŽŸ¼6Æ3ø…¼²M0?vÝÅ©W;¶3&õë:…íÏÁ[ÃŽ4èø¡CŽ(àø!Ã3ƒ¿B¨qñ@ã‡3¾_±—·øÝ3Ã‹óø-	-¾W`ñÌaÅ5ï!ƒŠs…?†€âÜáÄßS0ñc%öxñYïÌ‚7[h°70¸w™7bÞ÷û 1´A‡3ÆÏfDÏˆýº‘³NŽéšõÇÌ~…ˆÙâe,Zö+ÄÊfFÊZâdma°µ±ŸrÆ®	Lõ|f¥~ûÔ¬a¿å6|Z¤6Såq+6;á$ˆzIJ.ÔY²°4õû!<€k®5«5³FŽ>Ò¸ÑŒ-3êÍˆÍ-z¯XÑÇ)š'Ô5UÞ PïÙ‰s+.þùƒ?ý¡Ÿy?ó…}úüª!ŸßsÀ§}¬G€yIµ`Læ<"2s!¦yc÷òÅbÞ+S‹ÃÄ<üˆâ‘ÄaÞ7þ~ñ“¸¾¸(ë@‘@È¯9[ä=B ïç8S”ã¬ÁŒ5è&Œ1#zj~!ŒÀèÝð¨ñNã¹:Ž'úðëÆ8œQúJA„!„ð›ºÁñ¿eì /rðÿnÜ`±¨Á{Çº`Ju¼`hA7iH1¿0Á‡
ÌŠžo·ñÆûå1©}Óh?û–óUcv8|/OðžËárq:¹Ãö_ÐÞÃ†ìÍ{!Î{—gy~£È»Ç°00”®@ ÝC.Îãºû,?—ÕÌoËV—7¨Î4 *u×½bu³…ÐÍgDÙ©nCúØYÜ¿FäœÝ°¶¹œ{Éw4ÚItúÍe#¤ß¡þô4*îÍqk‡üÒÚ}Ár»ädwwûôÝ±ÛÞ=<Ý=&ï^““íãÝÝÃœsãîðË/Qøå ôæ§Ÿ/§GÉ­å˜ÞŒH9=WN¾H9Î¸Ø ¥øVy¶ˆÑo5K¸š=—¼YKÞ¬-fÄÔ¬-_p\1S‰|`±´Fcé(h_×_)øÍeEq:¨9BÙ¬û•%¦i¦‹$S6l4/ÂVÚyí+ä¢­“9“ tM@	®È|í/áï8Šóo1ÞƒfóìäD_Øå‹ 7s„%Í!(	HtAI3'›Ë tí­æLl›;Ÿâ-¹îr©'¥…ç¾yxn‹ó Ú9ÉÊl¡ïyŽRüXŸŽƒ–Ï¼#L› ½tjjNÛgbÄs½Û ïº­ÌYŽ¢–PÏšJ²²S¤­6¯Ñ{ž]ÊÃ~4.'ÊÍË/w‚‹	¨½øòJo-sˆ{þ&•5­ñá˜rWùC©~]/-’ÒÊõ
þY½^Å?k×k¥t^ê}¿À )ÎãgßÑ3ó¤‡·íÇ,ÞJ+ey>öª-Qì§çôsö%ú©Ë¹;ŸºhvóMUÈ½™-Wú#TR¦+ín7'åêÂÙö†ý…™NõµŒEÏ°’}Î¦c€dþÊÎßÏš‡§­ÓÎMÍá–#–Éüõ0þûäæOUGù<VUg«:ðÃ­ê¬=œ{ª:óƒo`:ÇÏÓ>šÏ¶Ð„xYDÕñPùu&¨Wäj&µmãj»Jíw§ìØ–w™FX%†9i<ó‚aÈ·Û­ú½9ˆ&ßäÏ~ý“s-¨Ý­á3ü#Wâæ!z|`¯PÌ•/‹‡ÛS([wJ«\†Î ês€Î¾·ïè!½ã	j[·q»ìOr6#S"qxÆqayÜ¼(†Kâ’CJqÇ•lÁÊÆ¾Y |T)ÎUtN%‹w@4 nÏæÉŠ„4žØâ¥oœî.ÅñoDdžfØk|Ä—ÁÏÓ pæ—E=iæÉdxENÃxv¢ áj2>uïtê4#0\•-êúžH D «g†Èÿ œ÷†âqÁ.”}–”a0œ#ù‘¼ ^Öå›íqmn¢ÐnªÿJð(?ãeå¬¯-‘šË[_åì|Y«kœÝ›ºa*ƒu·2˜Ë_ÙÞeü0¯Â]h) v¦ã¼B@FÀñÐƒ/R¸®3>ÀµAQÞð_ÿEžÁÇN<´ä÷”º¨¶Z!Ò§%'h uøŒ°ƒáÖ`¢Eš`èƒ¨‡èk ‚	9,ÃkÐÔ*´T^xÙQP¦áC“W÷V¿¦ûCêÌ’Åš¦<ÝPWûd	Ì? ÅN¤_3Ñ¿?;ÎZ.fd¢O¹Þ]ÖVÍ]âþ¼Äk^s9šôæÃ&B˜²>_Ïbw!tç<â°C©T&ÿ‚ÁG!ŠBè®Ö:n?¤ÎVco¨WW' eŸ¬bõ´Ê/âŽÙú{[¢½¼žê£IºÜ'³[nÛA<©Œ‡ý°ÜÆEÓ®ŒØ8 ûðDç4Ïsi»yöa¾Ž‡ýmhÙÙH#÷XfåÚ£kP˜G7Ìi‘qÂ¬ñ'ÚI¨|]åÅEN.„åÌ”XÕ¾rÞ£©-Öc¶¨qNÈ"€yn8¡˜Ÿd™#jý¾ó”ÊƒgÊ6O[-hÍÃÒç5!öõ]²¼;l‚ð¶ð@k÷Ž„=fWá4&JB€`„É‚áuÛ2l/¨¼À@‘ÝâËø77?t±6<¢÷°°¡¡°a´%xö9KC@½%•JßYDÙY aü´8O{Ý1´¼} xlã"ÔÄ[Õ°·ÇÖ€®šï\Sn½Zœ…g¸SèÃzîy_6ðáÿuž­†µ‹¬Tª†»äM”=-×-J˜Õ"©¯IT¨(ƒ'tÄ®hLåIÔÇ´½þuüXah
¡ÿÏó´SŽ&\nÊí±(^!&xÂbÚÐ³à™žòï“ç[ù3èhïX:i Ä;û&LÙî3¿™Žül`üwä—ú_À Ñ£:åoC>²sâý±QãOR,`1¢|¸OQ:ª$1×TíOxÀ×m¦ìŒšl1ª5Ä‚[çm‡¯ú™¯­œTG•Â)¤!,
~ß¿f z‡ñP,!¥x³î8~²Ûî»õbÇ˜ú¡Z©‡ýzliÝR›EÇÜ˜Ñ¸ÝƒþDj–`¤éx: °¸Æ‹äø´Z}¶|üz²y/¿Ü	Çy^¤Áe‹do:ˆ¬ñv£xáé¬þ®±ØGÞ¸¼aò`Ž*§—½¹Õøi¥ïÞyüÌè=temÀIŒºÆ$Y¦?%‘ÒK£Rê‹fÅž}€¶—aå2œ´`€Ê%zû×éê†Q­ØJZÿK'ºyþƒ×!ÃÊ‹›N­}6}çž@ì4þUsMXcAëžY¦ÚÂ%À?«4C¡±$&ýP’f®~øµ[ÕÛßGŽ:öi2ñ]æx²¥sC…öJ¿ß¥e~ôqÛ_Í±•Ì·Ò~”èDÒ›#‹UƒœxG®iè”Ò”™Ï½>i.@‘ŒSA9°­eÑxòÄÞnw0Wa¿X§£[N¶@‡0°Š¯Æñ¥Œ»	Xš¤Î$Ç©e’‰yà˜‰OƒKŒsì± /ãÈ{Üj_.sÛŠ°­Ç9â<…¿ÿªc®„K£´¶7Àx^ƒ?ÿáO `½î¹óý¶Y[œ—Yôû¢#LÉ"4ž»¿æ0Ÿ¾;mî%oÐ#ÍÊ‹Ž±™èCœ•\ê~ï•5f[ÇRC¥ïd'äõf÷¬I®¹µ·@4çu&¥÷˜ÝË+DSwƒ8œ—o*f.ü‚Ñœ¸ÜüÇ?a›ãèËHÞùÇŸúyà.^óðoZLyus¬îpjý	¨Vh3¡TN¬J¥Íf´‚6£•zê3ëFÎ’lIÂ6”ÃèYwë’tâmIŸlO]Š¢U¯Ëú°HÖrÃ¯Wó4lg)UIn7µ“M“é¥`&¨‘ñú{ k˜«jÃºªêþU•áµRÔ‚yº{Ü:h’½æIëí=­~*ü¹Œƒj™OÌÕ+[žÕq{…ËWÈÎ×5«ƒ+Ø÷©­ÝýæáÏMòv÷ yJNvO[Í#ò¶yÜòHu›YÐ‡¸Éƒ„#Î9ÃàQrrz|¶Gx€I¶“%.p{éPÒbÑ=ž™^Ôr_†wÙêMANºGX#uz®“|‘õjkB^xÕéóÉ¯´oaük8 åšît“x:2îáA8–í>§eòƒ‡¤WåÙ\ä²NnÆØøÌY‡Å)Vb8)ÇEÁûž Ã¤ä„ÈÉ{¬,è§!¸ÅZÞSe½¹ã[œ¢b!¨Ÿ¼ùò`÷ðM¸*ÙÛ%GÇ-Œþ¬T*~!°`¨‹³GlÌõ+1šÚZ(ÞþlÆÂWU>Àt¥ÔÙJI=±lÞQjL¾Z
 µÍÁÏêôìôìÈ3Òúug¾c$ònÐ»!¯aÝ@ã‚ø*ÇÆ¢œ{%S«iç“_~ÊÜ¸¹s-?µ›“Å•üïÿiíXÊ‹:¶“„õ-ÙOnzáËÛOÉKÿÙÇè%6ÖÊ¦r>ìàÃ-ù£ó¨Gý øÌüõGÃx&Ï•m¤B‹ù—.”¥>z¯,Z¯%Óï ‰)±†ŒØ„z°<§N˜n}è_˜ÔIC´«}Nº!Êfâzª\ÒµÖ l›’kÿc)‚ExÝ 1rcÄ·OôdÇSvÝáX²¯{Ã€nïiÁ[CX;}r|>ädß›J„»ï°ß¡æº_Â¸ŒÒ†Ä€$Rï]r¹‹Ì"Ö›:{ÄØêá³êL;øLeH*à${úüŽûø»Î]Çœ¸ÃŽN¯úëÒêèú×:0¸_ãËó \]¤ÿUj>ÿ#aòaãúñì™îr&X`ºlôPô<ºÄ<TåÐ›?Ìæ¼Ï\Ñ{áàrÒM€Žú©H{ô'zêLÄòöbv¦í°\É9¥™€üHÎñxp‘ Ž²¦Dc9–Þž«~šYk?š­¬Vã$ß›«n}ã°ì×/óº;…Q[u2jÏL@ùœîŠøc
¨nsDtÃ¡êôèÂfTf€ŠAv:Øš^bÎ©ßâQ<‡ãä’Åê‡0'Ÿãáàl”%Ÿé;º:!/£¬‡œtÃ°°G¢Á»²ufÂŒ$Ê¦àá ãÅ™ÅÏv¤n%¯O¡ß{ÐSFJø Š£ðì·¸KÌa0|ƒË©¯-ìãÅ ág^§C“ŸÚžPWCôFì.}ØXûÜý¨*B(&6Íf‘·?4äbaËöÕwôŒÖPF^ÿƒœXI¦•š8bï0érQçF†²C»©b„†A6MTãøEmªî³žEwÉ-ot»äÉËƒì"³m¶Û’³AtEv‚^ÐO›bÇ$pø\Ì	åÒó"]þ_D~¡
ik¿õ–¡UöÍ›æaMÔLÉåMó³aÇ\q3$Wœ#³ØXÐÙØjxÉ±pX˜~o©fÑâçÈ6™×›îT´Br#i8ý
XtäÍ tÇ]uÄ˜ÚVü$°‘B¡Ýº<÷ÿ  ÿÿì½ëVIÖ(ø¿ž"J]m¤¯‘âbL¼0ØeÚÆögp÷éãa•SR‚²”ªÌ”æ°Öy†yY36O00{ï¸dDdDf
pÝº´ªŒ”÷Ø±cß÷,ôîŽpæ·­?CÏ$8³ÔtàçÒéÛaÒ &å[s¬3—žQVêH·ÌWs’clp„‹¸9m<#Í_ˆF£ˆæÕåjƒ™T(``'óÉÓÞœS«VIÉ|IÈ”v°Ì¢áUåb¦ÁYx8ÄôÛiw•o?»—.¯‰³¢ºdùG’ž`:þôè „™7•¤X=2ñåƒ»U0%~.¸ žž,Sð§aó/¾3µ+56ÃOC}ôŒ·gJñ[‰n#‰Ùõ.³6é
ÖeÁìä¶êØàérHàF·,\¸8ÁÅ©@Í/%—l®ûs`8H“‹G‹‹Ž‚4	‰‚ß‚yaÚHFCâ±õDh;™k‰+¹'á4˜ôƒÑÅ¢¤O9A»§lçK²´.`8_Îm˜R|_Ž¿;…s‡(ÐÆïÆ¯#ÿQ¯„’;F[Èr¿>Li"¦úFùJÌÄ®Xn×_æIà7E«ÍáiTŒÖ‚^·ˆóù=‡Ðc×‚Èe¦û1˜”Ýî1 ‰ÇUðåíçáuÝ$¨‹Ët%ñu9qZkàˆâ¤R •è
ýÄ½V¢NJÓJø¾l›‡L›< ÊL ïµÛûíívbpjË·¾˜çav¾Ì”Ô›$¶Ófà5\òþˆÉ¬CêÄ 'vš¨—3,ó*NJdX‹§|-5v6Œ8Ì,fRý\vÐëC¿øÄPj,îN`Åî*ØÓ–+&*=\oJâüÔŒâS!ž)	Þ#ð8gÍÞ=Â¬Œx.æCnkó Ù­ˆF›ù&˜þ'ôu¨¥‰+…«½$‰/?  ±¾9Ë‚QÄ,T³¨6?þþñíÉÇ×\Šµ÷–ý°÷ö m*^|Øc/ÞÃ£†&‡¯÷Þþ á(ÒÃìhx¾?Š£+ŸUu8ˆ:á ª¢¼+§hÊÎ‚!ýÎ“€d=‹¶ÇôàQÔ×®ŒéQÝˆÖ€ïOÃ--ÀmíRAÎO-ÖTh çô½£«ß]MáZ)-•Tí‚x¢GùòéŠE'ë‹y½ž‰ÎÖ¿N®,#iÕkšÀWO’E>(|­Ð|.ËýÐsy¹õ”áÕ´fò\ÓwR%ÔÌƒ²µhx1ÇÖÔ:øÒÉ…2ÞÛMÆœN‡Æ"Ü@Qjt>ŸRj_)™DÓaNNÐqdÛýÌ»‡)‘›#íë=Ózú)&
m†|ˆz§_¢$ž¢«QÃIU€o±ŠƒbÊ'óY#—¸ÝÓ’„–¥6ZÀ”Ù™ßh -7G×ÉI÷ÔIrT3~ô¬G•Á]izEº.¢˜òÈqÈ]OI.=Â…ê<‡ÛþÂÄk…üËnwúçy ÑÎ­ÎŸA|îsÂ™£*½½ŒŸe&ÌFa ÛÛï¿ù†+åö†p¿gñàâ£N…ˆöØkÞ`ØãÁÅ2üÆn·™x¸Íè	êœ>æ%¶Ù‡XÐÎA3Ì£§üç1¾†Ñpÿ©§ZÕÝ]v«N)Î4øCaÀÝ[ñ‹»áðŸÒnâÑÏÃäš÷ÿ>åÕ¨»f£¡×Bñûyœ\¿ŒÆ ûË	èÌºÇádDéÞpH‡ÿÝ,œR‡Æ#£?¨êD‡Â©UåÏÊj°y%úQ^%™þŒçÄRµÚ½êS~þIÐó#!“mÆÃù¯½;^|ðf?öÃqäûÓ<›ogqA‰YŸE™ùv_ò`Æóe<Ï~ŒÏ|ïo×ÄïÊpžðfúâì,dMý6‡è°vD)AP‘á¼‡ãù,@^‚Ñã0ùø¾3Æƒ9"zªVVµÙêd£pÚ„c¦ß5ÜiM¶ÿè°»)Æ<t/6k_š²æ²ÄpVòjá‡ú¶Ã€#%ç!ŸJÝ¸ÈG©ÏŠàâ{vKk³ÇG/Ä¬§eË#=ú3xú|ûcŠ™Ðá.zòá"|+Éç-w³±"/Ü[1>ùJŒMXnð#á³OâT.c°Ú½$	®;gI<iNÃKH¦ÉgXˆ‚ûZ´Ñjµ:pýeºÁw‡&îÇ4}iö[­S­÷3Bá+×w8òëð§ª}Ñ~FÌ©á'n¿Âã\†É>€–ô(«“®åf¼y©4–¨jæªš’ó.6w¡½)mr‚0¦ÃBÃr¸h:ÏËnþLî:¢ký±£‰oÑþÃ@½xøæÊæòáãK³¼ûæá´Y½üë08FÝAÞ]¥!Pn‚§|Ú#º&/4LKˆO0nŸŽuŸulÉž=ý(§ƒÁ€ë±8 ìobß¨WŸŒT·tÃ´Ð'áûÂ$(±Q¡{bïÆ¬ E1Ìk¹#=d­Ìž`±¦‘·i¹-…—v}™… }@âŸwóL³û¶Tø£v:HPè§[`€Ba&­,ò‹"Pgvî†CnqØJ.â$6’ÂbVcç+bÆJÿ¡Ëö&Œ›ëJÙ¸b‰}Ú“cp´'…â@!ðÚÕØt@°úRÃ+Ø_×i’üÔ–k:BÊv1¤l®&ESZ$¿ÆÔT2*$ öš¸]úIÂ¤«×lÊÛå8Zu|J'œèYÁŸóh“a*„Ù4ÒÌ?!ÍŒñÅÓ•Ñj	µ^*ØBWÂùD›êJìŒãq@ÝÊ,a/£4º`à.œôƒ‹Øå0düð:mî(ªAU/WŸnjûÄ#n§pó  å¤eÊöƒdhèz½		,Ÿz$œœjGn1{`ÿ¹t	ç7K¤ƒþHÊr°=.Ñ?GDT+‡oiðä§ñx$ÇÑùÔì–b'óÊ®Švm.`¯ÈX×ÙÅ`ûc•àäV»{pé‰ã0³Ï`1²óš3êšÀÓš&šîÙ’ NflçÂš,„ÝfÀ[)xQ»ƒÁ’¯L$];pÌƒlšLÈH{Æm	dß¢_õ]BÌô
›Y”Ž¸#¶”Úº¸­OLº©q;c§³xñQ|¢°³2°º„â±üÝÝ%Gá4šEéA.ýsAÁÞ8L²“$
(žÎƒÃ‚A+ßÜÂ7ã&\H02ÁÚ”Ý¹ƒ_Ù]¥î`t·ŸÙ¨Fôè
‰"©Or__'"tu¨J"Ã	*®éÁÁ‰†Ó&¿€£lM·-õ°&~Äã8I‹‡„ÒKÚN*\ÂÙ2Úli8ŠÇ€€w@cDgu:»¨r+QÜ¸-Ü-ø˜ÂD+ÍcAwë"f³5Ô©‰Ù˜8„Ç>I«kN[_¹À§þoGhDû‘{GnˆÇ…Ì–¶@j.99†F(ùâ×€s?V©êN–~áŠ°4Ô4FH&Á¿Áð0ºP1>€‘Xh€Ò‘¢¹»OÑD¶ïP§¨Ò)*ýMY2öTªë¿ù¬|ò* B=?Þ¶wa#•i|™3ŸŠ§ |Á•)QñX±-ÏøÜy«s´P‹£˜Å KÅã
OUGÃãÚr·z¦eh¨¾H‘RðÒ¹Û½PÃ,êªÈÑ/êEì·ç9Î ?*¢Ñ6èñøÜŽ©E±ã³ðOŽ£YÏÝ
HÓ*rÃWÂKl·®Ï Õhî<‰†ÿÁû1mJÂYdMÄrí³h<^žDSLšaÊìªµ¼z–´Z§Î<Þ7†Ð:wôYf‘S!.¥ýoâK!àuŠ=mM·õÓë£ç(êŸÜ½(ºloë	õO-A¤þ±„’@lAÙˆýëvº•Aý†C	š‰ù­y§fÜ×uKD‡Ä–Àp9hŒg]äÿ ÅÕµI%é¥O/Û«(°€´…°cüêR[Cö'—,Bc=Á<•Ã	²Œ¾ ‚Œ‡	ÆxÀZñ[
ƒ{£t,–Óˆ3¬.Œ¼}&I˜¼m]ï4€ø¼®þ¸€^û°Q•©kÑ¡ÈGw•¸‡8Ùm‚.QËï4âI”}ÃÑ‰'Ô¼k<’òYI
×Röˆ[î†9Ïi
×í€ÖüüJëêÙ|œÊw_w·€@¸).gÈåd}×aj¨š­;$„uÙâqÛ½Q¸5ŽÖ½Ý»ƒ%<¶úúE$ÁéZ¤w¤'ïêcZB‚hn¹Ry×Øþ÷Ø~·{SE}#ÍUé±³6ïæs‘W-ø'Â‘Â3¶¤K„6»Ý%À–K&¨-.–‘ÒªWzÖ
7ýÐb3¹ÓÇA6¦ƒ\Èu62š‰¨ËðÒ=â+•.¢/‹rSø;Ùø(¯ã:)À*v³¨~¡›&×,üÊ}"ØPŠBÊ4v‰½±‰Þq•îâÉé™äö©ÂeázkGÍ·¸#(„ãú÷*gºrm­ úóe<s‹ÕÊÄë‰)$am®¡³sŠŸY5[žÛ†Ô½Y40Z¬üÜÂ±á5$ÆùË©Ð´‹üŠ¹’1dª¡z¦öK|\3Ëq¬ÆÅ2•¢·‹–T•ºDÈºðÚü¶“Bk\¦æff¥!J×m.ÔôMQpž`œÅb-ZÂ¨MSås±¸(ÏaœS·©EÒ–Ú‘µõuÇn5Ï©Ÿî¬+GSJî7‡Ótf÷‡9<¡X:"™½×	Ñ{úÃÞùôóOÉHj‡;×Ø„\Î«˜R¡ˆsŒÂ³Úÿ£þ¶-èÛ]všvP•‘çñZ<$UâÚP‹þÌý×bÅÑÆÓlGÄRPL) £¸â;¸Ÿ{ž²ã§Ž)Æ¾¨+û÷•®D¾s?úáøW¡^ÐÕž;S>]¡qxÆXvÚÜçMúT å¹üî9q¦6Î'F™]¡£ÖµÇ1·,´y¹¦Î©—ãŸ|äBùÔ5	±t{Çmæ³gu»V¹4_üãÅØ.?§²”Oø¹1¼ûŒ˜z‰wÆt,C %XÙñH‡W
é•cëjy¯øzU©'sIb.ïy$ðë%áÊÄÒ¤.	À:N=zYüÄÓa:G±vsbÕá	€AiüüÏãË6ŒsôúBßŽcr {~}8l.MÃË¶ˆºÔŽ†K-ôxurô†*Š’¾ˆ+ø!?ÞMKöÇm)°×|Äem˜Çº<Êz_úVkQ2£˜ŽŠ;ÍUø'î4ÌsEÍ¸ÅÝaãr¤óôF‡kmNg‰å÷›»ý¢nAœÞÍ@íS„½ÂZutØ»Y¥¸fãiQyZªÕUdóŸ=®c«uÇ*×ýßÞ]JÞBR_v•–Àmr§0	ß5R	½¶L?m³Ãé0žD!û!NBäþ±`wálš¿°“ªr˜ó ÆtÒ(é,€uÄ:àuÜóófhháÙÑØU.eá†Õ"’,e@íæßläu<‹ àßE{Ç pá
ÑŒßOe:ŸðyÐ—«ý9T¦?O#šòáGÓª~}qœù»²µùDTè×C?¼a? ˜Eš†±æ»:	ãV	ÂXˆ´B‹Ž‡ ®d¾h‡ù0ÿü^±Î×%¦þ Ô)áª*xš%Ñ ‚zâ1êÑOžP),Èü“J”kñÁk§ž¨TB×ƒ@×6Jän›­ä…÷'¸þ‰t‘¡ÔCróiäE‡¿W xPŽq6H»ðÏ‚LNÿªÁ?V»8oì^œ/ÚWœÅcèÿ,X-§Ð'ÿ»è`ƒ„*ó¿VžÅóÁVÿ|-Ðù°†Ö²æDÈ/1Z¨‘D/H¯§VÃ]j0LÑ½4-®J(K85‘•jõƒ…ïÜ“”^ÕîMVÈ{ä¹ÅêwIŒFíþ¨ôÝ§Tgý©Aá;÷”Škµ{£
wîŽ$	“úÝQ…;w‡×Uí®°px¸Å%zr³}KG ¿ppÁo´™øE®uË«.Ð1¿Ù8ŠGpî£4b)Æèb§î[wÀTüpg0O†÷µà†ÜÐ];ƒæëÊ
†~HZEv<H¢YÆPu'lo8ä6?ƒÌG,pè£j”pˆ?ìœÇñù8ìâÉÊ$$qº’®ì½>»ô/gû{~Úzõ¯èèÃOíàÍáÞûÁããlýlsþÏ¦ïÎƒîåYîµÿùüí‡××ëÝý¶§ÝŸ®‚Wóî‡ñë÷?¯„WáÀ“þŽï§™³Ê—?Áe ðwb AÕàriÆ&a6Š‡Ûléý»ã“¥åò² ›-Mc@IZQxp÷¤Ûý3¶„J$€úö	pKÐ>HpÝPð°•ŸÒxZÑÑmùë~<¼Þf?~÷¶“’vtvÝ¬S4,oCN‚mº‚ªJÊp|Ûê©ª1BÉÕ6›IN³&îVU­	7BWµTV$q¡ÕQ8£²ÑúÛ„òªÊž“¸x[aãªòY4~"˜Ì`}ÃK4ù
1g|xüNXÑséŸÛ²×·%öOÄ€Æñy³hE`k@z?ÏÑÐ'¥ªñvc9Ç&eŒâz2Œ@Qe´ý†I'ÍÆK<ÃŒ~ÀJ#Ú”ÁŽKM$<o<ˆ™ð* fôÌSáQñNºÇã|åŒ¤¥p’§”AµÙº?"sö1Ÿ¥pg	d_qŒ£á}RQlWžçº§yÑ³ì;^xAw+ªÖ>a©•:Ú¨@ÉˆW~tâ‰âµyÈ_5Õ¨m#¬²TÙyŠ¸³0	.FQb¡îWƒ?-ßš;ž~uVS ¼I²Ð‰ý!8ª6&è$2}^„
†	_ˆföð~¤5âQ|Ür²KÉ XEôçÑÂ|=Tb±XrvÞÖ87¯83Ç_GÇµŽ‰sPzBr§­ú—¨ò†[à¶æ;v² PûÛ#xó`¡4ë,š†C@•dR# €I„_Ëÿ$€…‚2ãÃÓ²,lN“øÒò5mÿ Ð?„x£ÔSêA$p––|ãx YÃôQÍñ?@'•¼þôQÍá—t’ÓWˆ†ýÛÂÖ/|”µâ›`—9ª‡ñ]slìrÇÇ.ß28‡Áxì'xtÞ¸ì¸.gø’a”ýq8Ü¹‘Ù*‚œäâswåk-‘IO†±2£
•DÍ³Šo†µ½ª<Ù**“óÙ–É¿ëdå^Q…y»¤´j™¼1Gž~Ï’0í_:ñ‰Ðé,šzŒçýCžñ]ÛÇéí O q$á^È.ŸC)÷‰ræûŒò!KÏèÈTò«bÆ’wÙ(LìŒ%ß Q<Ó„€|nÒez
·–óÉBÐeoÏ@H<	Ê5pºÌëíË‡ø{ö3½½àõîÊ—âÐUÖ£O§ß{Fù¬fR•Bƒ»»ßëóƒvš˜ËòMLnéð³¾¦Ë€úÆcî „ o¸„ý/ñS¼ÀN‚w39$Ì"€—?ÀÌ$JÃ§_âhHý©%„BråÔäöµ—u&•7À'c¯>4c-ºêÊÞŒš=šÃŽë§¨QE>q•O8Ô¹j
ÏŒ,ö>Ú9MTá0¢‘ÏSj÷…úi4Ç7p·ÙxþâÍÇ#vp¸wôüðM£ÐPØÎ£`š7%¸ëZyq0¥-¹ÈR“?0·{‡,7%uªçƒA˜¦DX.Ë¤]úÃò¶¾ùm§Bq[UÇ;oV=â³ƒÖ„LÃ>LøLÞù:âŠwÓñõ6%ÉQÜ±¨‘«Eÿg”†Ip	½óE?
'±1r,®0,™ƒ#Óµ‡B0Ž+xž¶ä#R<mI sÒT¤‘ìƒo†	þX_¼88|ÿáÝñ‹cýYñÉÁ!s{ñöàðíbùÊPž{ZÆ"Q·pH^ªîÕžO&Arhk'CqøpW(ºL|„Ø[Ëƒ´ÌI£’{†Ýî"/«§gÙ÷æÝ‡c¼ËÄâ5þòòe·ûâ ah±—Ý—/éëË—/6»]ùô¥øúòåÆ>}Uµw»²
~y².ÊY·/ž>ÞPmîmÉ`±§B¡U„¤ÎYœ¼#lH-ï·™Êž#¾Ñ>}œ^LãËi#.@…¿†ó
DÑûpLÏÏú8™O,âE%8Ñ{ò	;<5r9é/pyå&uÕþtí­Á­0s<û2N&óq°­	Xs¢HY]®-ÖfC³f0NÂ`xÍ²à"œ¶Ì•	³½‰HÓ´•ò"5õ°Ã…ûó$*ìNš–x†dwß[õRÙ±ªš§"?Âg5\Ø§ñ<âÕÄZõÕÌþEBì>ù¼n²ê aãÅÁ>{þö°>¤rÜEtb2•Ôt{‡­ntµ¹çTµ@L¼˜ZF	­|ÌTñŒBìo;ù¦ºËñ„?PnÕÓŽŽpgóŽT+Ga:~~Gq;@]c å¦h¦ÅCŠRkËÄÚÂ]¯ºšùå–üÄY .˜¾/+ ¥£A/è{þb'Û/}‚ÆÙ_Å™¿L¸Ð«/Ö©ÍD_
-qŠ—©ð{^ CCÓfÆ¦Áå¾*cþ“¢ôLßè`ž>‡“yí´Õ÷Ãñ¬.¬§]ˆµÎ‹>u\?Kâ”’©=\oêi½ÑÊ<ó£yš«i:+ß#Ý1ø°è§ÝuÖåI‡H$öÇ½YŽ+[ò$Ê\_&tª­£/®•½º±×®Ug,ù t¬pÃ÷q[ÛÛe1¢mcœ·5O^$Ò°¹êá€W'ë_3ÒhÃt ,¦ )a_’f-Œ‚ÚÀm]§ŽêâXlBËBâö~ç„ˆ‚qiý“hà—Š‡`¥±ÌŸNI^À àƒ4;àœd£¡ÕS£.#{¢ômx)jgr ì[€UÙ¬Ëª´¿Zÿª…üÎÂqóB¿ß³o£QÍ$ÈÐ©w¦ 3Ø
.êA€$WEWIDé+²÷àœD~1¶ìƒcMò‡p&„îHß™xbüÿ8¸~ËiÆ¼ù4àŸ¤Õ†´2yKêþ8K]9	¢‘ºUµ¶Œ«ÑÙ±¤ç ØÞ&ÑqM‡Ís«ógp =x­AÈ¦ö‘rÂüšFÓÏÌß¢¯Pôû—µþVïlÓžëä¶ÔI8ùáæ(A\þŠÔ3ÛùiYÖ€Žh<càùÛtÞG%Â6ûüÝMÖù{8øŽ¼	¢éô:hÜ²ÿ÷ÿ?ßéÚnÜ~ÖÚÈ‚„ÐÛ¶¾GÏt¦Û8£6ìäó`ˆªÓÝè™¼
mŠï¼M¢x¢`ÒÆ9c¬MÛ¬ü—³'a·ßÐ·DÇ(âz7ý€!ÌraLá Üjt¼ÚLq&pGý÷ñ²z§2VInäÜ3ûlR½>§ÿÕè[Á,ËÅUk(-ÿòq«mò™¿þ
cÎ©äâpåöãNžÚ«OÛna=Ç±8£*1ºlÎ}‰IÒS÷³£Çç%“?FÓúË`0@ùÌm‹CJ) ;1žI`öˆôL¦Ë&Zo²ðœí¢6¤ ßCráK±•–„nŽä²¸Þ›ŽJŠ†($>6°»hèpèk&þ8SCes81*†¼æœH$]ò·s¢ù–ž;f*3näJ+(ýé´ÅoŽA‘^ð¹
#Ç'Õ3PÍÈµ¨•øóS[MÐ2RNôÿC+Œ	ˆ‡j’y>v}á°Žü’/ÖÀX½¦xÄÓ Äˆc”KH²Z—šF­¨™‰\<}5Ïx!Õ„i5¶®±oegTéð>r"‡j1†·ëA0N‚$º¸ëêê`ï¦\]§@“R¢dÜQâ}8ÁVÔL®6§W]ëÒaêÕÕXmzÖMÂÞ›|-’®·úBø(~çº8x ±‰GA6ê`¾ î²M·J@ÞÔâÄY<=çø6ž mJ	LY§â)ÆýÆ3¦C$>ôœ>àhÚÔ+,[gM½¬IµDiðÀM{ëÓ´8VÍxÛµžÑ8J†ÄßælfíQY«\>.³põÈFÁt8Q“I>|x‚8A/UNHh:ÿ|ó‰@ô‚ÉäïVz7]u¾Ï«äúì¦«¨ŽlbÐu¶M‹SÑ6”Î.ä¡Ô%sÌVpY·,„Eïç•1ç[V¾»sÃU€GZîÖíg]·ZØ²ÚaEÿÊ*ÌÎuøWiøg:x‰Ç9zKêÄ¦n ãáÍFvªÃ“«¢¢Q³ît:®kV¼å¹Í4{ùFô»m¯’˜ £«vx´'¹a	
Ìâ`.Â!ebîBýq¸‹‚êTø3®Ép(šò:¨… œùHÌ+'lûÁ±s¸×öŸÈóxîòÜ.D*^Ù‚¥Ï¤Ll¹Ñ¯I¡‹)”@ãK dþ‰]…í°EÉ£xš jþÆV[Y0<FÖ¸Ù[fKÝ%«ò°P™¢ª^·å5¢ Ï~}Ûþîf‚ÿo?+7Eéû«h¨s’¾eá[àõùÃÃ¡E-®ˆÐÕè4Aùšãõ Æª/6k\„èG€±Èž×Mä=í!{NÑ«NÆ
CœÏ„‚5¿»q]ÑJ^±$
.ÝÒv—jœK·/ÒÈGCqú|ié¶e¯%Ì’l–®
¦P†Å~4ÜVË¾¬=ýqD</—°mAl…(¼¶7„Dx[IþŠ{X-àC­v4C·Âç{ÿÚû 5ú÷ùdŒ¶]'-/ôZíê¶½Ãy!‚”=em¯Ž”­¨uÏ=*mhnÇâ°@3ìŠ¯{z¾¥‹úÛâ(–òŽD™ÝYCPÏUßø—'Êµý÷¥¨óˆŒ©‹ld©^[Z.©—Ö½ý‘Ìg±[ùx 4fÔÕ··°akÍ‘?­mI®´c°gƒeöJœ+nº¥­¨>ÐÄÚ-ç®ãýO§éÄtß<mïå#§J<ÛåÎt±Ó›†Cz-7»R¼"
< n¡Ñûñ~¦Õ8†ZqãüüT×àç¢¾ÁOŠpñcP‚t8h ¡ù2´
ÇÓëkŽçÓ …o|Sl¯³Ðð8»õÁœMUÀœ\å{ÂÝ÷î”O-¸ƒ£gÑÆë‘óL>ÌZ’‘öT®³Z±aTkÁµe‡Eïu$†W^·Dd+*Ty¿âÓŠe6Y0úÁõ8€00òQth¡²ÓþF³lÖ×½Qß¤êµÔÁÎ+ZB/ÅÏw^Ä>Ú?!A¦ 
M/1	3Š]9¢'z™™eéÅ”|Ë(Gf!øm(t¼\IšÌÁÐ#½”á«›—Ì%rF‡¥ÌA^’–wµ_üüá£¦€Ÿü–òœ˜ÒóÂÙø~Jp“}@Ö:.×VóŒ¸<*LÑ„ý¶HeNÝ>N•Ô³Â	À'œÊðijPüŠ é#ïÐDE’è(`Añùylñ¾8ð((Ü•%¢¢YÄ.ýº&êÁ‡.ªñˆ¥„›…„1t#`)÷#n\ˆéÐ©f,W=~MÊ­‚âyfÙˆ¸ê’¤eÖëv¹¸œóF†õ§*K9ä~Pï1»s~·FÙ˜"V+7)©?Ïù€y_”"“ô˜††—=bJsš·ŽúÄ7¨vÜiœÕ%ñÆGáØúa0³Jþƒ§Ýè†–9$‘OÏjO˜”W0¹Õà8NöÑNF.T©HU™xªä™;7–€3o‰Ô«;7ôÇzJJWñŠ¾kïÑ‹*Ä)Âd`«Í7d0 Òfæ¯Pÿ~Â×yoš%!\uj©å°WTp7Ì¥_ÄaÐ& ì’=38 ›a˜i)¥JR4:0Ì½ó4Âü1¥F™‹¥Ê@æH\È0Í7et´c¦jYíPsZÚB8îÒ_'ÔÌîÈ“ÖÉñX³íÜ+a4S¨—ÎPtÖ@ËèÉ,Br³·µÌpYÎ¦pÒ·†Í,Ës¨Òòø|ZþGåb›i)'ÛzÖÔY{C¤É,¤IÔsZéµ<‰‹eÅV“ò¤eÆÄlQ„ëƒ$82m†1âÑB`Ž	éÑ™€{˜
XÏ®âª'zÀN¾"‘k{’ñD0"™“
v¨=}¬Üb±Æ¸ªó7Šµë×]ÚY¿½V•AÒQÒíxDefÓ<Â+å°Â@°°Îô}#_wúýd£»ÏfW˜7§l7s°EUì€«2O–'t­Àƒ
sºæïÍšìJiú¨kl·Ámq³€<ƒ»‡t×å³íNNéêÍÉ£,ó÷®H²Å4z^º¨2J€;q¥êçÚWºé[AˆyjKíá¦l¶ða«÷6Ò8i#ƒ†ùJ3rBNí˜®òsLy$Q7ÅD”;¸ß‡×5q`3_ŠÊuà`à5æ.ôd§§épz³ý ÖJO©Ç–-l'+„
Gè@L^è–©ŸÓÆ¹:\ù‚a;Ñ¥?è5>#Œ‘†“¨,!©€\U»±«TNeYÝƒ±q“¢tµqÅ(`¤5v(HZi-™öíK%	ækÇÿ­/»ÝkÑK/Ïš‹~ÿ–˜ë:W˜PýâKíÒµ6%5°¥öÒmë?`s8[.­šÜéäž(ÈOzS›~˜±›æW0&Ìã¡Y±Ð|Ùe¿þ†{®1‚\°3¹ ¾˜eþ|¿¬äåÇAYÝR´ Êé3íÙ€Šeœõ‡‚ÁZqñX½.0²˜„¢=é#™Œ¢$¸úHr-GÔêcc“èÑš„¢R~Ñ¡(¸ðy˜¤Ñè~—ÁäžG7ÐüÊ âKDB®”9à±c9Ë •‘*Ü« ‰~Š.–«Âfs|8¦à.ÚüÆmxfùTxò_;ûó$Fg;‹Ûý„%ñ¤2_¤õá‘ 4%Hæ¯(×$©rTm~À¤ý©¾-àrvB²k>¨^TãÏ¿]Ùç«ï’Vm§¸©¦?>Ç£-VTÏç^É—tŠ‚_;¸%ƒ±(nx®þ[’²½é‰×n‰R!]P9Š Y›x†­•büC_áŠ…)™ŒåTLÕ=Q•ß'ÇL4ðÍâ\ÊGIæ])•ÏÍ‡ðCrB:Ïã+'&¡Š€så‰ÍéãÑ|Ò5.÷Á¶yzu°×òƒÝ“R»Lrñ¤s¹*Å¹Ø‘°ªìð:wŸ,ê2Dr*—Êþÿ×ÿù—´;sœU<;ãBñµQŠ~Kq™±ÝÛæØ˜R¢¬qüÐ­=‘ª;ÖÄ€Sp;íÖ¾Hax,ü, ´;Âœ!ãy2I³£éš"o¼ÃˆÈ˜cK´±kü:Œ`Ÿ"d.Bí€—FLôè&~6‹ÄdžíHR=@hj*ÍÄ„aU‚¾Û(Þ||»wÌš0˜nKuÒ)ßë\_iô×•ˆ[ÔáÖÍ§Ùü‚ž#	‰[.V3ßÜªu-EÓrw-‹ðš\¿4L‚ÑEä°ŸîÃì›ïVÀŠ³ŠÏó–.†ãÁ1ýá.¤Þû¡f
ÌžàaÌ;fðµ)¬ri4òS0”œü*'£*øìüècÞiì
7aô[u#Ôà}*A×a†Zºå7Tý÷Û\sÎk
¼ükþ —ÁÝ¼äe·>O} ñöÈfÇ
ì¦œ~êÏÎ
zóÙIg­¹É>ØrS³fÇèþîÆ3_Ã™Ê»dÏØ’d ‡¬<ÎAOÑ”ë]ƒöT–dQí³´JÙÉò!,ù»Þ¦®}65ó‡V“¦Bµ©Ož.9‡uûùÖ>¥ùy¥:x  Å—:•Iÿ9Ÿïÿ
Š§û#äúwn0‘‘7ù£h›;Ô½
³íŽxô}I]ÛýRT)ÍÙDŽÊ¢·G43ÈêCÎhÎ©ão^ïú“ááÇ¿nÎøüücpòÈÇo õfUaëµl²êX‡2 <A«£xÏ0¼$‰G7QûÒi°RV±Üt†Ø»;\#&çîOdYå^â	V‚kË¼øuå¶ã™]çkšÛ()SŽÄƒ-)nçÛ«œo›-JÜcªHoMr)™	b«+ä¶µM·,Hj‹
(¡B[?ÏXC ›™ò"Fó>ð4ßXO4.NáÝ €òè4ÒŸ_Ì%äÇÔøÙf}8<„’‰âÌ÷ÊDˆ™‹ìÌ9Ò,ï£iÔq$Èw¢ŠÇp¿ò¦úöÔj9RYq³ÁxF‘TÅbÖ±U‘"&8!n#’º™Ð+¬å$9ìÖÅåê&1™rƒ6ÿrÍ˜³ež¦ú&¿ëÜ[[¸·ÍëMÝÌÔœç(;Å¸è¥­îýÒ®¯qL§[-f½çÈÄ.º´”LÆ;eø¸¸5™/M»•LÜ¤@vŸÉÅÍ†T±]ùm¡ê’˜Ù_Ê*ûÓš—)Ã(y“ò*PZÜ?Æi.L«ùaæÊ5Xv¤­IKëº:Ý ŸÆã9úD…g˜,êi¥ÇÚ½4kzP~„Ê•«jM«ØÎ”`ï¾kŽªÅC(&|”|%uÄ'÷Aýò7Émtp7ó8¶ÊÔÀ4<0¢ŸÜÔheGµ‚ÿnc`)ßýéE³V«û¶¼ÍÏ`÷ÂQ<lµÓðÒò¿žªEÛÓß¶v¯‹“Ã)Wó;ZOI´z=™„°±èÈ±çdœ²æó -³ŽPj¼ÌD®“CW[þÎàd/,`u
kË]¸-³cy~I›rT€£5¤ Ö+Že–¹ê]ŠZÎm-åynÏ°n˜•ër¦n¥ŒÖð~õ¸)(³ÅhØ’`Œ©ðžœÖ3`'`s@³ÛXýAv>ZõÝp §%Tû…ÖÃ­S×²¶R‚m«»Wõ’Ú[êJWXÈÈ­½ ÜVøüŽI
ëÊrdÞB%Ú_øzIÄÃ	
¸±ÐgÁðù¨‘ïº%rAOGXnà°`ÞDo·‹%TÌGÊ±ôÆø›H©(®$áË¼§|™¹½m=7RËcyqÒžéCz'·Ñ»ù‹ÒéßfÝÎVm‡QQeµžÓhÝê¹zÎ4³1tìÔ\4MßÍJß)ñ]ÙÑ	Ð‚Ž°8EÛœr'N‡O&š¹Á?¹Ý*YþUiÕL¤Q	«ô¡ÖÀÅ=%ý·ƒëY#ìâ»Ž#î&é®‚ekxß-¼9zÚ?“Q·x¥±þNØ¸l*tìÊ|Ü<—2¡áÂT¸¨ˆ³YˆÖ
Ã†Ú’y¤«é„~€Œøcü[Lêú!¼’¡#«kCx2Ä8*ÏÜªAPúÕBr×oHSóÁ¨§2²šÍaŽ=í7†ÔÛ×™:ûr¥Ùsö_3	©5šÝÝ2æY1çý“ ÏsaÒW#fC“o°ÿÅãø<¥/|Y»MõÚh1’Áè¿çar-R™ªßzÛÍ†Q‹·ÉË.çKÂ”Ô¯àH rà Á“©I½ÉRáÏY”Lx×ïú?QsûÖC£A®”0ƒ€Œ^Œ#Ø&j8>c^üsïÃÁñ§®HíÃ	N	\<3#ò°˜0‹ƒ4;‚‹ ŸFw¢=XdªÔÐ	Œ+o™»/"šÐ¦SXÜsùð÷œU_F;¬jñÞ˜,Ì^÷|qi0Ëlm£ÛU¿e@j®œ ‘ÍROÖô‘ª<
¸ÜrƒTí ÅG‘( †kâ*‘;â{³8W,,3„¥˜…ïVÎŽÏ'˜$L„ø¥ÐÇX^¤ý’Y¿TØ÷1KDZHGÊ;O)j@¦¯’¹*t(i;©ÿWÁ0‚kˆçpÑÏïV%Öl:žò|fãùoõS5‰Óì}<›ƒ„ãOÄmŒùT¼íæAàg¼¢Èv žÃ@ÏJŽ¨«¥¦-³$RŠSØÈ&òGíbßºÕÊ@OñÈ¬á`³V\¬–™^@/¾cŒøCý-¥ØÑÜbP[Âí›åÀ«Ï.^ž[Hî8Å<Ë(;/Î7¸ù
à;N®[jWêfÀM10säÀåïÞjaÊ¿ý+|Ë€î8×^'á š¡wKñ¾ÏsâR÷”ß$I% ˆ ‰'hÔ;â¼º§²â»ÚñDßc5ƒO	¥dq=5ÂìéK´<.ø“ÿ¦ÅêåSM:ôeYk-Ÿó§S	/ß+€‘Ó}/'j_PÎÌŠF¸´úƒš"¤™ëlç—1šµ]­2ƒÈ·ùÂB§v°9ZV»ƒ)QhkœMãùN1´FXþæ]Uô°°æ`¬ ‰ú~Ò¨žñl^*®i>m;~ nš¨"ŽT‚õ´c	ŠÍEé-ö(ËféöÊ
=I;ó)¦çJGA<Y™â,n¯n¬?YßÜèõºíÕ`«ÿ¤·¶5®o=»Üéu»0šÄ×<:w lø£Ÿw6»F|F'ˆ±bjcs•:y5žg,™ÙIheêÇ¼¤‘ø‘âõ<-ëH™Ô%'C—9B>ç™ÖrÀ¥úhd2È‡ÌéI¬[f!™­60~ñSbÛÂÓVŽ¨õÃš£ê—”³Š!¥¯ð0ÏcßÀÃ’‹qÌ_còL«õ¯“8“‡mT¬…Ãl¡šŸ‰ÓJ• 1ü#“wIzDÁ+'ƒü©¡6ø™„UOCqe5E-2Ìó³ÁàÜ›¸¬ÏÓ¾|p%Ex&Rv9ŠY„,Gç†“)÷va¨³aŠpä?½‹ÉëË~¨¼ÇÅÜ$Æ`š‚4ÐN Â˜lòÐ
ZòÂÔ‹œBg±òtBŽìÙ3 ­XRÊŽ<ÏðQ×Àã…`š9ÿ7ÐqžÞ¹ãµ$”5oÌqÞŠ½Ú£Ý±=Ç·Tœy<Å­Òï:kÕôŸÚTbÞ»6•¼§Ü»†b„hÏ[«ÎŒVÖj.Dr†?Ç+î¾ˆ’æÄá›â¢ñ©±öˆJõùÚ@ïÑ²sé‹d•™‡OpA<UhWÂ‘¤çÅU8˜g!/EQøŠe¿p¢@ak);òl#ÊŒš¦œHy_ÃØ¶Ù’0Â€GL-Ozí!¬I¶„‘¯µßx’,š+ÿÇÊ
ÐïKm™<ÄL­v8|n;e°´ÿñø¤Ý…O#o–?Äè°Žä03¾^Ù¯j˜ãs_þ˜Í~üîçÝ™Æ—ÍVžLÃ¸Í/pæŸOÞ·¿»1G|»òÝ¥k:ÇqÒ¤¯°ÙÃ“ü{£Eþã¹Mjá°½þLs+ô¨šñ&Öài5Œ#._½§èÔÞ‘¯øM¦^"­ú€nív¶äšFDeó•‘Ö‚¿r¤µÐ%U† Ê|-Å2Ÿ•ì|Nq[Ðïî»mÌ·Â6_7Z€Ûo?›VJºù`+cÕ»‹C>Y_B„xÔtä3€t£¬zîžõ†FÏ‹Ø¡Ñy¨òü½Í^ŒDä%8Œä_«C¿1î·+mˆ//ÍŸº¯ÈH`G 7“l™°Ã¥™^È#˜„‘|wÆÃmÐ@P›l›°h+Ôô jŽ‚Ž!–te.*"5d®\Æ ³«šjPÓ9æšF*¥2£ÍçIÀó0w;ë°b¸r¬ÞÍ³F^KÓ¡kÆ¨
Gª9ñÍúíÞºŠåÊ•R—C‘ˆqÙ[˜ÜÚ¦£Ò¸–ºXyTÅ>¥­ÅÚ=ø{³„1ÿµa+VKÖ°¤–TÞ.ÔUAÃ&–›Üâ’+q§qÖm.¯è•ÔÁyQ«}e†Îµ´n¦Æõæs!Æ"×_¹´¨ÜÌKèz^xJ]À¥„J1`#7-î«®3¶MÎ”åÊ†®Æ@ŽÅV·©Ui–U+tÄ†åÁb*«žq7¾9ºìdJtÈÜËTj„Í–Ü–)þX-ZóÊ²¬¬ù‚‘ ×&w¢õh¤-ßîÊÕØ5ð­ÃÄu¶hÿWT«bünÀþ¨¯–¥ýÌÖçôæ0)¨ùÕmÏS°-p«Ïkšî}åÂV;¶òó~¨¸Þ­F³•8U·Z} «¡Íôº˜Ñ“åÂe¾±°!‘}½ÛKµhw.³"yE|êQ¬øBTøÉðî¡ßéá•—W‘ˆytõÅ¬ˆ”ã^¦]~™vY‚©Æ;=ÃÌÓq+Ú÷]ŒBÏ^ÝiBTˆn-¯Äz‘¬ó8ÍÎˆ`A‹×‚'Ö´ÛFÝÁÐaÓTæýQ¿úÝiäµ‚üÝ×¥æÓT7rîHçe7ZQU^z‰ˆåÎMþ$óé9º“Èéé¸€åY¼›pèÛ(q·@ÜIŠÑà«šÜ ’ZQ¯í	rýBa,v.É-<º
÷dÇ,ËRsÖ¾ã¢Ö€_…»7—Žß-Dûði,¡Úó¸rýñP7<^Eøb‚áëÙ9:%1µ£Á…(%«_ÌsT_„lè²2ß |~œîl9ÒCA’¡ü ìCÁŠ{«ë4nÅ{¿þ=îÀI˜ð °’!oì¶½Giö€ëý8Q¥h‰Ó‡"†WÙ‚y#„óöäYà*Žk³ØÃ:ë\vb;üÞ–“ÂÇ¶m®åk)BøÝbî¿ÊéNº.
¾3­yõ-ì¼o¸ù=ÙÐå>J"ûUÝ%`ëÜ¡§Êß¦—Ú[öA·'B•Z\Åáª| äwËn<6\0ï³íB‚‘Ë2”Púá â„TUˆjCÅBž|÷
RÔ9ØÏ|´5Ÿ]µ71Tçj@ùÙ#wû\£àïäC­åH!Îe{å§ð
-meˆkO’öZÒôÁÞ­]é‡·¯>eÅÌEG—íuLGÿ@o*t=úÓÚ}ŽQý…¹à³OoçjmþÎeÆžºP‚uØ5‡ò˜°ÃGTÇ¢×´«¦˜œïqQôM#¸¤Iì”pšiV";ÝKL‡j‹­¸1uÔæÃ2uaîÃh‹¹¸ßíëpÒÆ”ú HGýYñvvDýu=y í[ê*îÙâfÀD>[8²ÿÓhitíUQ¯Å•r §cãj‘Þ³ÉC¹—jt•(O¾Š.z?¡‹“|ìhµ†ï¢Ìj²Ù] Ïêvz(¾–‚Ž÷Á4æ–cï…S
Ë*†Äöi}.Œå¾‹ÆO“®+Äá@J9E{LC½<¸ý¦´#¦Ñvš<±•ë%ß3#šUDZ¦¦ùÏ5‚]SŒí‹æO)býù8ªÄþ*`ªGÓ\pÎö$pÕ“Ü,r\læÂ¾Ä!J§dw>9a´Œñ«
Ðu¯ÊŒ^
ø]ZÙâHÇçJGMÉýá“vË^6®}®~g0)>,”yª?PÂ¡O\bÎ¢ñ8oà÷£„¢L˜æý‚0*œ”|‘HcÿÇ„ÜÙ<™Ã;®¨ºY
».ºd!”j£¹âÿ6@JÌ§¨øÅˆ³ùØAI8G»pFi£sÙ/ÆOë5Xeãpç¦àÇz»ëxvWJÇ JN‚>ã±ºD®2î RF›hgaÝˆYr¯³ œ mJßÍ(O¸WM)ù[OÙA·/yÚdÅÝŠTñÓM%ãñ¸Ø4ºGÜãzF´h
~£›Ï´†œnœÆ—I0ãq®D½ûHHª#ñó`Ü<NE†pÈA¸ SœPÃ¨RÁÊÕ·ýsI9Õ–èqÕ6$“@ã‰}ˆ-¾Á:BN»®E@Öø]ì¿ëÌösÙÞ×Û{Š®ò»Øyæ?eßßÄç9U¹ñE’ð¦¸t…L›^y¡~ýl•2üþ½[„_)†»Û»Ì\=Q|µø½Å—FpÚ}:Ÿ£¬÷’N§ã¨)Bùjþ¯Eõƒ+²®™¨:‚¹#È¤Œ`«Î °‹Q5öé5ä­Õê}}ñŒè^ðö\E°ÄŸŽp¹”¤§ÿÈgO5cÇÔ5±†}®ªh}3€ÿëjùóœ,zN&(k"–^ºÊJ‹îÊ]ï¼è^§˜_áÀXï
Ù>¬ EÀ0ø0K-È&ý2ˆLÓÉ'uo;¿”Á_„×;ª¢õ®ÄÁ­Ü&¾¾%¼í›åjØï·Vj*_«¦±cd¯—²ßhñŒ(^2²K3¯<Z}GM†´C÷}#ºí–N"#Ä5òÒ9<ÝÑ#!šˆ¸!»2¶•þ)<0üÍÏSdðÂÇÍ¶2?HÁ5á>rK!mÉ,Ú—ŒŠ\] U‡­ô,W/g•
 Ü7çæ´áÚ"®{&'_¿Cþ­<|«RûŽøÛÞ”’øòÚ˜¢Éyy¥4ìð“Æ#Ý–Æ™,žŸŠ:Å{mÄÿÄ®€ê‹;ÅKþIÂ³0IÂä}Ì  ÍiÜ–Ê*Þ#7{M±ªQgGjóy;›š&ÁDÂÂ&ø¼=|SrC:&=ãþ¥âP¸¬Á¶®ÙSÿRæwiµ¿˜Idn¡È—eVK]Q™*®Fî˜mÔ³Väépš'D¯ÌÔg/×ÍçÙÑ‹@6®šf9|Å¶j‹:¼ùEñ“_–(­,¿,C@±Ú½«„ÂÞK’wâçÆsƒß²×8…’m.‡ï‹›|u
Œ™Õ…ßÎ1ÿ%afÜÞ¦Fõ<£ ¶°â6–(MÈÌëxU’Ï««(%ZÐ°QÌ]mY5k,'«P–”†ÊqÏ±è¸þ%‰§g&ºSË°Ê²ÌæÑs—*OÖè3€•ï¶Ý#©1Ÿ#&Ì`¥a’2ŠxåËd¬¯ t-è.á~òÆëŒB¼ìˆ%)‹õŸ4ÎGÖm ž©Qž\ ÿHnhážý¬QÏÁHå·ãŠü¡6U[îœêÓ9HêJ+¼?ÐÊjÔþÔÛàÉ?ew×•º<«‡öÙ¾‚Nûü©ÛY]'Ë¶>Ojg[°Àm—äÝÄOñ¶ 4þ3‰—!ô2®.ÿ—Då(ÙoÝú™[·®¨xh+ßÝ„ÓA<?~8Ü'³x
‡!“Ÿeëösòw3”zVòC4=tƒéf¹9†›Á³2û)¼s"c­ëÎAT*62?åWAmóÖü¡¯ÅË6šSoüßÏ VL*Åí~B¡’õû.¦[«[Ã1tÓeNH¯Z§O‘šj¯jLŽ‰€®N:ïó€ÐM@ «ìî#L—°
î*ImßÚÕ_u'òÉ@}Ì™âÁ¤mI:ŸÓ!ÁÊ¥Î,J9±®'+§£Ù}8IÛË—-*n÷ôó•œ²eV\No­Ô9ÜUMªS¬^¡;±¨Ü{GüXÙ@tÏÊ2Î“•ÕîðÏˆÑ*"X·P"	tëçöw7âð»Ÿ‘ûê²÷%‰¨åÔ«¼ryü	5+¹f·'Ö´#5~n¾­GúcHàm2“Ê*qáü¡³0eVÆ«×‰¾q·ˆQ ¥ÐØU9	4M×5&)a…ré »¥wî¯/ñ¸-¿µjû6}¹´œ‹jXD½ÿ<Ëf…‚ÅpšS¹CøVGÏ"óE,›!“oÙÆ“|j²(~!Ãi[–ó<,æçO•ŠþqKÍos…:Áxyzÿgp¥>jÆ»µ50—íU”š¬Ú©H9½I•Ö„t&Â³½ZiB*#„nIá{ëJî¤)ñçç\DŠ-ˆqæÐ¿¾¿ˆ¢	I#K™zä•#_W5rgÅˆ‰á~š‘{(>ÖSt6pX,l‰ÊÂ¼z8¥l).6~aÅE©ÚâÆð-;’öJÇd¯äÝƒ²Tºba¹82ð}…TØ§Æ‡ý4/9)’ð‡S+N˜¿®7ñ²³ÿëö–IÃaeíô®å§»èþÈÅ75uô„gynêª“þ+ò	³;¸€E™^È5æóYÄš7v@—V©Ì£øSL»öÕ!•†‰VI¥…¶¼LÐkPŸDþæ¹=–]yFHðkFÁ[H2«È³Ín]ù¬‡:ª)ý%d¨´±ÿ¡RTþ³e©vpÈ_U¢ú•­\T?_+Ì%%¬iýÀuŽ±ýârÕ:Æø©«ÌvE~®¯QÖNWäÿ8SYù>¶DÌ9LOä¡ò P@^¯‘íxÑÝéN¤u.ÑB
Ò»­v7Ê‚BU*áª¯áNV	_U†¼Ô×_{êyë|‰éb²Qò¯úcIF¿¦Ün±Ðë–ë³+6aFö7E©Ü€ÑŸÄà€g3ä‚£l—¨‡ßËõøp¼lds€¿P€ÏÃ˜Ý·ñÓ•lô›©²û79>oê788}›µ ´ÁEý&ÇÛØêkÿèàMâ¾¼GùiÖ‡F˜@7Ð_ûš‰/ò`{êž˜Vº¯T	XžºÇ)_ ¦c %wn6nÍÕÞ2·m1™ŠŒWGª"KLú@êˆÛ¨=›Ób07«Û&æëÄO6\£Ùë8¥(Ê¥ÎåjàRëJ»†òTÏÙ9ÚHò3ˆñE…L'ó\5~°.öpI KÊõò£¥%‡u–.^uó“ó¼t°ËÒtÃ"]²;Ök>Î!R²ðk`•D|µ4‰¸„Þ%ªTùA2¢”ª®Ò¬ªeÊ¡¹ÝMZ-Ë¿…ìºïm+‰@PÇX²‚Á@´è¸xt1ÒC`àìiÁ1êmÙ±ô«Rr·àžuZòÉër´ž8Ž—_(mYqù{»C=Ñž©_Pª÷IðŒäv ‹r¦µ…v¾d÷Öo”e&"éßáÁ6ßg—F½<”ÈëW<¹½Z¢Ðêœ]ãó‚ÅÝ-6°}¬ãá*?šÕÆaOWù!óœ8¨Yë|^åçŽ¾¯òSC]µ<Hb•²l:Ú2×P¥ÓU›sq.K4¥è~„Ê®2-G+u©”z¬:òóVçØ–j/D¿By!ÕRYÐ>	ÃbWè~kµ,ŠïºI^ð[Ä£°(LÀbn…^><?Ûƒ/ÏpÛr³JnãZbÿ"Ä’!d‘õÓ$qR<éNµæìf`z˜³›³?Ïƒ‰êãA0m#	k`…š7ˆ9ãé‡0³eþcp‡ê”³` ˆàªBÑF8ý%ñt5ßÜÂU­W>·o›qjŠèü/q4ü^kòÊ_í?Û6ÛgpéÏS8ç0ÅlòÉ|¢¤çËäj‹ßNalPŒ‡OyïP=mwef¨%^œ’oê©GÆ!†%9‚ó›QT’,™‹°#²u=9ˆ?’MÆÿ«H«2/Ù+þ—ƒ¢¥§Ì®Õ£<%çPåF^VgÀk²ÞÆ²üýsÒ¯p],ÊFÛì1¤Òòq—ÝJWÎ`"Pò¾ÍV;=zÌ3´ËÎÈœGì7t¤×Ó3“®dÉµÆÂHGŸ[‡šÐ™Ïm¿¶uØ¸]Ö¯_>OãQsââO B¢ƒèŒ5¿UÛÐŒ¯y>%œM}_hFŸ@”Ò4Ú²
s¢ñ¬ÙêP*ÐàÂâ*Æã°C°Öl(0,8CðJÅÂgxà¯Æ2ƒ¢¶ BG·º~ï‹3¸Ž†ê™ªyËh G²Í‚éµ>øª•â›53Üvø°&l™Åpv@uM›}ÀÝIÀÊûÃá6ŸTÕªaïüa'šÆóa˜6oãlof8¤Ej´`/”z&“(M1Ê.¡F‡57E·Æá¿£){ÍÇteñ8¸hhƒ¸eá¨wÝ¸De£Ò7ú_yTôCÒl‰‡RêbÀ©Ž#Îè_6]æêBÜnÍ†<µàä B€2käp¥&€ Å>åˆ;?Ž§|&†ô¨$â‡ÓU	¥K¹Îô˜òù”þSŠW¯”mphpÑpG¢ÎšdzNÝÐ)5Œ¼‰sd¦mIä]·ò¤[´"zly3rÓ%F•SµXq•Òˆ‘Ð*¸ýÆxFW¹ºËÏÃlnºó8¹>„'x‡ÄoãòÍ/Lx¥d!S€Š€„0LeÐ''s8:|žþ€-&µÚÁô,ð/î€¬Ï¯ž ÓŽü$¸ ¼HèÀñvN¢qÉûtŠF2¾·	Ð:Þ—ý(½˜GYÙûAÙû‹9r
€ÉpíÅ)–Ë±ÇQX± ·%‹Mçÿ¤ãaàV<óÏ9GþVçéÜû@Ö¿P!œ3àÉÝ+1ŸÃpï¾)æ9ºˆKzOÿØ`!¯?€ôç“¾Òçó±'QX²Ìãyâ};fs7Ø8åð<8¿û‚%ñEìŸñEœ„þ·-và_’ Ë1ò—cé=69èÏKù( VÄ“`:ôÃü`>ð¿Œ‡ñ¸¢_ïëYˆFƒiä?Rý0˜g×þ½áÏ¢2ü7á†8§np™;<Ó»¯{Üü..JÐß—((=›oSÂaä?—À¡Ž‚¬dæ³µç¤ßGpÃßyÂAVü€ÐK°ÜüÂ,fá4ü€4›g¡ªa’•à0€,v#Œ÷ÀæGu–CU€ëµ˜e5î¯fq’	Êà}çƒŒ¯ÛìC²ÎËý§Ä ¦Éà™$(?M¼|0ÎÔsz z4Gäú¯¾¹ÝUbèbY4‰òÍEcÙh_”Ë…®x…š–
˜ä˜%£ }¡„¯Ä]ÎÐ$&€¨'^…ë|Aø˜Œy¹£pYI«¯›0íÐîðGêÄÕ- ¼È1X!)Ü¢ô__£JÒT×pyÿy.ë_ÙÒ¥üÐº1Vü6§Ä5:¶Å!´À‰D“sQ˜Dÿú´%=LÂ}øGþÖ:V_å»qL4öNcüûZJÞIF@OIð!×ÙÇSZtÍzYneC‚4_)HØö1‡n|þžðÎâÁ(J²8¤ë~+;¬‹20¡ø-¥ó¯@1\âO%h£Ö¶Ù1þ9„ýtªšÞV^aâ ú‚ó7¥x²CltÆO¿Öæ2ûÍ?yQv]äã’øá JgÈ»>å?a¨x"ö(…ÎÓZ­îîZ“ÜfÍ¾n_#×«„„…£yÃ€×EÍàWú–µ7â7ggÜ’¾Ëh
lg‡» Ä°CÀ‡“¥kî«/Q«¸¼!Ü\Ù»mI[Q´ØüËVè}=4n€Z˜a(J¾MT5šõ9¦5’ELPñ¾…»z18Ù0ëÃÃ!•~“ÿ®!(UÍÀ.Nâãq4©•÷êg¡gïŠ‹¨Âê@#‡ˆy¾ã¦)[1šo6gIø…;tá74¢h±¿²ž€À– ÎîŠ_†¬å%‰êƒúuïâñ«wï|ÿáÝÑ»ãªþDí*±Ïp›5âéùE7xFIª¶YÖlü€¶Ï){GïÙq8›)0%ßÂ¥Ôø8G“F/“0dÇ£ˆèÿo-ÙN:ïçM=Gm÷OzZE“`Ì>ÌX¯Ûé¢Ú5€Çðé¶«öƒ”õ£à:`Ði4Á,±É|Œ&óö‹Œ¶Â[Xî’¬`Ãp!¹Èg×ñãwMÂN>¢~0<çÃ¡Åa¯^íP£{ÿ8|ûÃ1£ÇyùQt>sé´6…£hÚá½èceú}<ÃÀ©ôôuÞ€ôƒE`këÝî)ûšp‰üÁ^¾ÜÚ‡Wjh1LþP‡G·iù >M¿œC+áåóøj§Ñe]¶Ú£ÿ¤YCÜ?ìj2ž¦;döµ½²ryyÙ¹\ëÄÉùJVnÚ(FQ
\!Í²4O‡áYj©yP¦$?ˆ)“¼n”Á>¬Â(ÿÚ`×âïUo§±Ú¥'ò[A—„’DŸÁâ•ðÁ>šcí4`¹^z’5ÕxFEZtG’;sÕ³ëÇW_onð¹ÃÜ^ô^l½tå›ôÏ(k/Ÿ¢d€î X›ÐRø:ØPà%Ò
˜Bgµgõ[ÒÎÚ–¿î–ÕŽÞ$ÜÌ#kÀ¾Öeoz=¶¶6ùŸ5¶öþ¬³õUøEž°7«›ôkõ1½[]§’«[øçÊQ(hÒÆñÄžŽêmH¶6 ‘.ªÕ·¶ð›üÛcOPŒ
ßÖØìÊ>é±7OÓÏ'[âý^áÉo¡t$ö‚ä#VzØØ&ë=¦VŸÈ/›ðoï	ö_ÖzÔáï¹'Ÿ¬É2«²Ö:ÿR:šÇÄl}ãÏ[ßb¯z•I|ªýå?ÿ‰j?Ø}ùû@å ˜í4H$_sÎ«=¸!¡“­òNÖktâßâ5ö¸}ôî?;¦6‘-¶µl–wÒ«ÑÉzaKÎ™JÃŽxX$ÈiöÖ—ZvD5¦õô¶zµ	àñxOØ?àÉ«u$æÀàýE!öV>vô<ØØ,ýO@««áÛ8Jv–æÕ&ÚÍ' ¯àI’/z/·9–÷‹XëöœÀË IAkú÷R€ >WOóïÉ•¸*fÏ%fwÈžcw=Þ2>Ú›FˆÄ'Ñp8ó(®+ÔÔGÿ†®VWù¯Š¡=ÁŠ^“h-¦°Ûm`›¢³  Áx<#í‚ÊFc÷å‡/ž®`Ÿå#[+wÕGö§[wh»ïÞþðúðƒs ÚÍ±ºÅoŽõ-º9ÔÅñ—Õ½'kÏ+ÏŽ½úþ¦×TÓOÖ÷ÖžÛÈ¬‹[ý•†e5]=,urðÈÂÉy¼	Çvþºn8­œkr¤•ŽNp#Evá' Æ3· <Ð»öw|Ïž‡ÉE0Búøù8LSâ¢apÍD1Ÿðz4Oç)2å¢ÿ°k`A&ì›EA6_fÃ &{L‘´FÞ„tpðy=ødÁœ	½TG#U”¸‡Wƒñ<&a|MlCœÌ DºÌÂéOñ5ç"H1—24‡,êÑg°9çq<L}üÄöŽØñ»ãÃ½7ÄR¼Û‡oL¼ðñbºÿ“|“tógg!³9gÑ{„›]ÁYôÂÁàñêŠ³gç'¾×lÅ$Ž§¿9žÉÍüù
')¶…Ä1Ûšþ µ±N4æÆ&Û‡?»Hnõæ‡÷Ÿtñð@Úo1À¶û@A?~Â¶VñüdËþãUTTÜèá»u(µÖ×ØÖ&6ÿ„:ÙÒ0õÖc¶N,ÅZ×"´$0´LºÕ¦*jP~[›Ël}ÝOùuY{x&ÖÒo“!kÅà¬{Ó¦¯mzÚ¦ÿÓZæâ¥âÙ/¤,p¿Öø~•æÛ° µ³&ÚÙÚ vz1r:	Ð=æ­ú‡³Y—Æ^Ý {Ã¿ÒÀ±A½ß#ÞmCþ[ ±%Š«$±W+%!$\àÊ#¡ßˆ>*˜´re]œ;<œxîò}ä·CYË«bÛn‚[¿æC$ùVN‘¯Ù8ã«¤±ô¸Àð‘¼`µ§N±×h¾¿áž+b°_f®[4W@ko6×¿Â\={¹Ió[×Ø+m‚È^Â}fº¶Žhü€Úá+ `õ<ú‡ÁUJf¦ª»ÂeTEAÃ¿§5Ë—(ÅØoûhsIú‡hDÏP~Dé®<Š®¸8ÔŸ”jpã>ð]_Âä„ÒÁò’Â³§¯NŽÞD_^Œ1Æcæ°,_YaBèŠÍ‚óhJáPØåcÚò$½@ŸJÛ;6 d´©WgbMUN¦¢õ–^ÊÒ,ék+†…iA÷¡«m ØK’àºƒ$tÝÃ¬IzHòOICÚy-ZlµZ4N`BÁ2ëS‹AgLñLÑã €A÷[¦âæ“Ðs-³N-bÓS5!ìå”J«¡K‡tR,–ŽþgÔÁjkâô7FBý	ÈìðŽš¨?7ÕESx.,¨¹Wb¼F’Õ6z¶%›í½&MÞœ\Ðb“Ú›ÊfÉË=LEªè5ìÜ åg2LÝë=MI€"už	cÜx”ï¦l4Ÿ¾´kä}ˆ-0Çûè‘Ý«2n@²Ìê¿À+e $cÀZ'Gƒ„uÄ¤†a”5Ë½‚.t¬C†üxjõ)#®WèW%Ú®(¤ÿLCRÆ¿¯$ïÚü…ßòÀ «~þæS÷ôY'JóF¦ç"§¾~k Ø‚	¿‰£Èbâ{³ÄI4	ãyfé€Õkû‘JÁ…Õ™DS©îÁN¸Ëv¿(Ašòû·®ÔÉòBâ/Ä—–’0ÅÛåju™%qœÁ-M·ÙR£.‰j-Ãg0OXXu¡˜7LG¼æ]“¶^>_ZY­#¾Xå„^¼ÌyÁß¶Öú|ZÖ~Áó@ÀÄ2³î\×¾§ Ob4ú@|W41/C,§À@Z8¹\E)èÃ<¨ˆDÙ„~Dãˆ§—Îª9è‹vôEËHíâMW¯Yö€.²(·y¡
ðÍØ-ã¬%ÍoC¨‹].ç¶9¢¨{*ö9§4ËŽfanÂN¤™á°3²¢ «vÁ€£#ÕZîâ¦™Øx2ë·{ël–µxU¾+ÿ›	]_3É96bm6‹yÌpÈ†¾ãkÖÇñ%±ã~0f#ž)¡™Å3ôMÙa›ë³«–èº‚˜÷&Êÿ»ýi}ãÔÈ–ðd£8v|Ø$jëçI{2Dçß5tÞôÄ`ëñô~5²ËÔôó§É(ãÃ<!üûúÕ˜ÏÅÇðcâSçj“ˆPÿ*Ö^Á²ÏˆKç!õî ˜æcóôA'Z¤nTÙe®—Åk}MgóÌöøÏ®gÂù½a¿šƒAˆ<Lvn2txš¤!–ÎáÈ‘8š”f„Z…€¥«MÂ¤p§*2 òù.:r:§|z;šG.šÎ!ƒ1­6r§Ç´çýF1®ý—`<wn4ZÉögŽ§ûÄìÜ4Ciü¨Ù·5ÃNÆ/.jÊr‡¶˜>;˜=aáÁù‹p²füzÓk z¾B£_<IMÑùµ[ˆQIO‚™VE‚v1+&‘í ªY'éf7ær­ã±³¨°š“ÆEDe#lç9áfçŠ/kÇd²ƒ6©Ô5ò›žÚ„Ò8í4Þ‡)ªôwö	›J{ê;ç.)(Ôõ8µ+˜A;UIcNg±ŠT¶N‚5™£ßz±ˆXU‚Ku²Y-¾ªÅêÔ¶2Îjýn\ŒmºéX;AÑ|‘K­§°+º3ÚÑ+AÍ•ƒŽíÊûžŽ„èþ†÷fÈ¿ÂÔœ¡ÅVb`
Çk ¡Ì9pdÍ`0Xæ4‰ t$ÍµÌºž NÚŽc˜Û:¹…µ¿6·Î›ÇØµy"È3lÆù£î=eÂó£,¿_!ÆqÉ©UíØñž÷VóvÀ›ÌñZˆÓkãû é[$ø³ ]2Ùe¸ %1ÐŽDá}2ÅŒ(~‘ˆºIÖ^Çx”ë¬ŒºòºJó¨íO«›+› 1d“z«+›§H¶©ë+PBhum/j=æw<Œø©ñå&ÀÚË—‡Ñ ÈP5ŽƒktgŽ†!Ð}î7n§„ñzB#A7ŽHÖáÜöe'CâHŸpL¿S¤–=9‚
J×Íàš’üQ#éÀé~<èÜÎ0¿ÒÃ’ •Ü`nœ“´¶iÝíòc¦ó»JV`î›Ï#ZL3’™[NÆÑ&ÊÎ“()7É'¾“Ç|Æ–.yr8BÄKÀbÂ±wôhe½»äôgçµ–DA{ SÃæÇ2¥¿Ób:j4æv°vW~#› `“xˆ¤Ci×|¡sŠ|uŠ£&ÁùNãªˆqñÅ>J’ ½d¹ctoÂï‰H<ïÚÞxz 5_L‡jËg±àD<–ËhžHApµ](¡@[ëp[ƒÎ{ÊÚfÝb,þ©åF¡ŸD!3sB4±QÍ.{ˆÁ´áÎü›k,Œ°ðÌ±MžùWÛ¬çÜVOÐü+¸ÂæCÙ¶»qàüuWq˜ÖAÅô9ßéVsÝ9íÈ‚·zîDÀÞë:±¨n;.G§«©pÞ‹^R‘‡ÁiÊvå%óH-f	Ý=«]Of21Ü‘‚ßrßõ­?ŽUö½-;Î¸Ö<„§P(ìh~Ûum\tqp…„ÅjGgxVžø¢8z·‹,æÜœ/Z›'kc:Ù6åæTyNF#>‰6oœÊ¢C'ŽÑ=tw†GgœQžüD^drÒ—´Ëh?¡æ$—Ÿ}ÚÚøë)Ïã&§„p|…4¶tOÄ}Ô†jÈÔ<læK	è,	È€Öâ –KëüÑ›¯2·\ s´/U!â n4Éx í}E¶×Á°k´|KW×)Ê¢ ¨ÓŸçAæâBŠbBÆÑ¿ ¶HEŽÏjÇê™$ñeÅÚéf¢®PÁeë´7é“Aã9
¿‘²>§ÍNk­T.	èÇ@'Op-¤4  ÒÃD½½œ(\±ððÀ|8ÖÌhÒß?I" sÄÇ¢oô»ïu¨o?cZÁ‡å‹§PP¼Š“èß¤c¦ôØÜ-`¸Íö²,ŒŠÊ
!,~¥)*>­®m¸ÖTSˆÒ¤«èÞGWq'5g.¹Jï µ°2è˜©ù7@Rq¼:g¼mv›}jC›ª™4»‡Û§ì“j©Í£ ŠÇ¶·Û—aÿ"Êò¾N·Eþ#´VnáÂ™Møí Î…éEºG^ò>‹¨kRŸž˜ü>ŽUH¬èµ˜&Ív§—†¾‚U_§üb¶Ó“–¸„-Da-Äe·ÄÌÞ0ßN¾Vî€óÞ²² ë„ªŠ@'ß- Ý–žAX»‰Q[8x›ž°ôø¢YA<±2Y›:¸Î=D ïÞ¨poÂbçz[H[¬ÆÞ#Þl#ô{">»Sº™–F [¯ü¯ ~.à
f ¥8¿’aÒ<É¤Ä
µÐ[%Xì#Øá?ÈU¤ÀpŒÏ·µŸ=:3›âÓ ã}qdŒ–Ã("Þ>Ü€“‚úÊê:‚>Ú¸€í-v5Ö~ÙB>—Ù„7#¹òê¦šÐ£~ÒíÞ#+-¬’+Yš3òTnUÇß12¹é"§`±5åáÍ×J²ÿøyî³5œ_0ž ç !d~A±^oc	){I¦½N
ÐÁ1¸S<T$WØðäµ mvÜ0¦K„‘UÑËë³]Ì§ƒˆpÉë‹¼½˜2 ¤³Nªï¸ê¸Vu³$`¦puÃÚÀíu	@ûz±=Ñ%IÖœ²ƒp¥zZMxZ'¹‡X!ÿ¹†yý§qÎ×ðüå?×Eeç¢æyDCD¦e’ýÄÄT˜5‘¾†ì‘˜Ä6"uf†d~*Òþ”IBåg\Çs_z)Eçƒð§8q%o\ah‘dÑî¤¥TÝØýÁ2ä‡f¦@È—VÁÍòÒRÙŒ‹ÁLjìµ~%ÛÚJ`–‹ÅêdÁxªÇU+ÏLA1°h+êd¿ ÀXÊä¸¢p­(º|¡ÛFÚX›–oˆòáÉÉBÊHPÒwy~·2uTäïN\kã9
Ê\Š"“Wp³¤,îø¾šØ/·à©Ìçpc:—çzºBÃ.]œòÌU¯²@±o®†O”¤ÚVÅ5©ÁžO¬'Fââ$íöãB·éÒ¸³q’½‹é	CˆÆî‡™Ø¤WArü}ŒÉlA]F_‚Káð`©U™ÝÄ'ÑñÍz’ù2ÌjuJLžìOMË&ûc±šÊ —ßjµóÂ	$Bi«u„é<]¶ÄÓŸETCÃ†Q“žG[·f)X9UŠö8O¬P¸à	–åì©ÀE~(Êë‚$mù¶ÞÂáûütÏ_¼9¤È ÿ…†ˆÍïD´ð¸m}f<Ü–Q¨|„†V¾ñ8í­
× GòÓÖŠôq<ã´[uVü8Í¯®dâêšø.¡®°ˆ@y&OÍc˜V™òLƒ â†n•]W&ó©ÚÐ2ágñS|(1&Ü€Ûe&h¤OíGMÇX.-@¡Nh#:Å®w…™+À¥]¨B;Õ`PµTø¹A§ òÂkn¶NsëåŒë³Øšá‡óu?w²Ÿt}òC]³“~ÂÜË¬{º\»¦àê¢i’OÜEÃsÕ¶á"Þh±ÿÂ8 õÛ¹.m~lÖn¬ö"ûÍ6—Y4&b‚?ïæY£~«®ÃsÙFP¯yæ&oµº©‘­hxäú”Ù;Ú{@Tìµ,,YõèÝ3ª(§gx²CvLêv—â9`¹GLø{±½ÒKâFót!*"–“ðlçÆô‹»µ(è-n£bÚ†T‘{>V¢®†K)Pü™pW¶Ü‘³‹ì§'}m©ªÀgªM·!Lz&É‰ªßõŽ%Ò<;Êµ$»`¦ËJKëËùëO¿î=H¡œ2ãîp$Îœ^ÂiGÂá¡LˆØ„÷Ž÷èø¼’3çM‰ë\üÖÏy—àÆá'|KËíG¸ñrNí/8“1õr|«ã3oq/K¡‘§ÜAazq•„6žxŽ÷Á4W¨Uß6>ßæf]ºšeÝP³¬3Më¾n+]ìvK”&w“{®¡¡C{CéÚ‹¦ÑÕøÈšÌú^½¿@¨ñw©nêaC·¥]Eæð«±áú´²Z7ux®õF?¿MÈÏƒÍ¼ÇÛ%4s¨—¼ØÔ‹Üþ   ÿÿì½yÛF².ü¿?ÂÉ‘	E‘Ôb›‘äŸä%Ñ‰íèZræÌÕÑA$$"âvÐ²†£ï~«ª÷ e;ËœÃ™X$ÐènôR[W=&n¸1Jæ—ä‹gôn"çß¨~»[àíª…P…É¼m:„bÔ¤¾Öä%ôTÙi[ö·êQze¬‹‰¾‹.e„à!Åoâ¨aØx€¬…¾‡|ù$!cüB§±þóØ®›*®ŠôRq¯±¤};æanQJŠ›¯ä¤6l£g¸"²°ò¦ô’~é#_{gþ4Í¦l‰­I³èåx†iŸVqõÈÚ¾ÂdJ‹qñûEÞDˆ6R÷G)ÏtbI„FÂhb!@-&9ü;N&ñø2"PèMÿç/LRÙŠ£Ã÷ÿˆ¦)U¡y(VV¢€ˆå?ïöÍ±ï Øã2G^GwcZŸçÈpýl³K£+­¼wÌ»@Ôµ‰þæÃe­™Ç¿ÁCYì‹:VUç½÷«qwÒ]xäpå½Tw%¥@æöžIÉdì!|Û¸nûŠUèàãÂ>ðtUÌÈj§¬â©ÏuÚZxjjå±
a%ÙJ
,$eG‡[žÎ5H-ù£ÅÎ¡×O®t:½^LÐËD8Ó ³{¿ç±¾`œÖæäaô­Œ°môkÅÑ÷â¢§oÏ€½áI`·ñÔ¶Õ\‚¡™êS‚¬`l˜‰ºSà<ã‚îô9TNŸàvÖ9ÜN¿!ÀÜxexa)Êþ”>=@«ÈWÈÎµƒMvé’)æà5=k~F¹^h”,³FV×n…íI³K±oJÏÖÿ2Kë;¹´þLkÈ:ÿ"«è»OZE%6í°1; j†\1e,W“¼ªÁDH‹!G¤Õý[\&lÙõî¶°oú–Î<aÏp:Å Í²À.Œ	¥ÌÓ%°ÝMp‘KäÔÞ&Â´_j}ýÒËpIÛo ºä¸7òúïÒO¼†ê×fÓ²á|vŒX]PÞ°Ì#àÆEtÛväËÉŸ>©ê[S…ÂÛÃìyô(f`ŽÚY’E¯ÕØaÒ¿™.òèíô¶dÁÑ®âHó¢ò x!!oF “‹<Ÿoà5¯ 1eíóëY“ÍhL*ð¶\å<å(%•…UÞPL&ª?Ø‹N`d§ê–0+Ã„ Úï³óÈNÖ9‰?¤×@¡Ôê[þ«n¦Æ|HBÍQò!½"ÁŽ%¹T¿i4£¨¦/<K€Å'ùóÞ·®“‹õZŒw…%–ÁPÔ,v÷}MÁw~Å+Q˜âýëµšÄédð™â–I¯E9%ÞÄ3Þ>ð%ž©A!/¯Eå&Ñõ«?¤,ªâ'*’‡×æoªW&t¦,Ì¬Ÿ‡óéäŸI×_SÝívM´Ã8 ¿ŽI“e“µ¿]=}¼ÙÙ©©Ví*´ÖzÎêI:B
¨uB²h«*q³Ö‡§[ñæå«zNT\…èÂ„ðª:p—ŒÐáŒ¿nÂöÓ¤}iõ@¯ÂéVèÂ1º(Nc½ùs=u»Á¯[ÝØºÚÚI¶­nèU8ÝÐêaÝ¸×ÁZG#A"Bxá<\A%_›x­X€£f÷bvß—ý½ñœ•2ù-e®÷[x%zöL¯‚øç^R¿Ú^“ý!buh$®ÕØ‘ýâo¬”Òä/|·ž|]u]‘žñK•¡6{ªsüÆ½þŠäCŽ¶‰íÎ¯¾N³¼@ÑWÅH×ï˜¡]Û8é«Ïxºü«ÿ=ušÝÔ°Ë±`¿œq$òŠ_ØÀå}>ïxY+V­Ü,~ße!ã×c9"8èL¾~OÎ¹>üè¹ÖQCY°­S°{õºu¤¹ÎT“¬î–æ#E·Ù°‰÷†G“Fv\×~Á;µ¨C[›	ŠÈÏKÉ’ÚMÉà+#ÐðE‘É¶¶'ôw0§i«É{4ÔkñÂÔ:_¹HN_`]á¨ýL¦ÝO¯k£Ý°öGýìWE†OÓOßq'°¬è2J‰‡èÌ˜ù”Úa°wN'õ `Ö^dÕÝÔ6Ñ}CÌàó¬EïLkîoýËÁvÒ©É5,‡X{C>Â&”´‹Å€`B`%Í34 ¼dº (x.VA¶&köºRw}C¼aè"(¹Ó¥Z”VÇôµ-}P·ôIßA½h'Œï±>ž¯ováOŽÈmóãÈÐ£‚ ‡¬R
5íš¦7	}§Ä¿F%éÀJ²Å*x¸t<4\ï¾ÏPnY–ÖUív‡÷8z$á}P-ƒ,)ÍÜ„[rpjû¨Õý†Z(²˜òý:žìn;:dáI¹~¶Ì†{§ÐíE|•Çóˆ«A<‰˜P¤ueVAyõàp‹àbìØ‘ûÂÊ¶S°ä‘Æè‹¥qÖmmÏ“ñ¹fÜxøèê¶<ôiñùT…Î¯Ýó³UÏÌ|N!HŠ°)HGé­í3“ zÅº_Í5ª¶¿ôñÚûègTø\Ï¥…¤`r†ë[[WU,&{ÞÁ¶6ŽýÐ€cY‚*JÝ(³jySD§Ésä…>¨ƒÔ‡S2 Aao)e/(æ­…Æ|·î‚·RÄs}s¶Èö–[Û^ÈS`²ÈŽ·È,à¬L®GÀa½Eð~B¤l’ ª¡5«fò
JAwÅ¸®øÙ}j/s•¸èÃ×uŽ,zqÏr-©¢É*÷~ÛŸïH`w&Ç3e§Óé(Og¾ƒ÷>Ã*Ü[Ö—\FlÂ`Ý¦ñ@3e¹4ö°ò(÷‹'ÔW‰f:žbBæ€É—ü¡³öy‹+• ÒN_Ö‡ÀQqµžÖ=4ÍÆZÓ¦;—Œc‰údò ÷ c™NÑ¨jÚ÷…ÄRk£è¤+phè?>à3Ž¹æ*{ ÔüôlwÃC&W£Å¦S#Šè^E(Û,~Â	m¢ÁRå¤?ÅÐ¼ªWó¤z°·³ßÁÑeÑCkèl©¸ˆPÍPUQø~ÜðFçÌDà`
ž‘þ#8;¬ú¨UžmxÖnu@¢Gö|/…ðâý‡"Õ¼X`È
ö[å±@ä:ÖW¶9 RýcùDb‹~NK»×ö5j±Â8úàr|ÁÖOù› õ“	Á[“!I§j~qE[S:öåðaQFRA%ÌŽ–iO™ëeßîC™A“\Mû‹lq‰Ò‰ãë`ƒØÙG=™‚´<AÆu=IËDc''‹ŒÊ2ê|R>ªà;Ý¥„2"ÅÜ |>ëlzb˜ÔàÒÀ÷ŒFì aDžú¡Ž”·ùežÏ:h¾µÈei¦#smè3±ÞA‡bîMí"³8Pøéû|z«ÃÅáõR¯Þ-wk= ö$èÓî±&u^3%Øú—ïm^äSLæ¸wË!û.8üueÆ¥Êú*NV0ô…ì¼øÍ¼øWXyk,ì²<(_=Yœ/BìOí ™5èõëÐ!8aV7ÍHQé¤±‚ðkmr3Â>Ç`c<Ÿi‡¢O…»!£,ÒŒtP@e®BÎW‹¡s°2}
²/…WW,çG {EÁ…b¡ÖÍ“YçuÜ(ë¨ñ6ÇéÈQœ¢E¢¹‰!fçjÞhœ{qê–úIŸßåF'%n>¢B2-?.D53¿þ©dò×?–ù¨”•™aÓèÛ¨Ýjo6€BY2-M3Þ2Ü«>)!b¡ÑÉW|Y[Üíàz½Xˆ*÷–ã¡UîjeQ5é„r±A^,òÜkãë%È‰ÓAòþÝ=‡ŸäuvTÛ¸¿ð¾*ªÑ*j•ó4æºðœ”ž|½4µø).f3&?<×ZÓˆÉÚ}É#t™žzµƒÌ‰»¸z±á)…÷ÂÂçÅëúÈµ¹ãúÌÓÝ‡áÈ–¦NÿkR‰Þµ™kª«“ãœ*9£ÚÊàòB·¾çñåbÏ×AìÈ`…ô[†÷É.QØ5é´¿óŒ	—L÷Ø5àJûÖ£åÐr~õñ×Qñ°çàöR‰KpÁB
qoøRfÌòW8xË‹ðö½¤Ý^ÓE‡¢ÝŽÓ@,|šÈ½‘ñµ[Òž
:Jò$•	“‹%ïzÅ!ˆ1te-Hþ×0.xa{Ã6g-·é¦ckÄ¦V¨¨ÌA%î+ølŽÀ6? kúËÌi¦¢('¬éÀš®ˆ§\nr~ØóÎ¹·ñ‹ä2×¼ßLñˆ¹?BÌþŸgÉ¤‰_QØ˜f	}§Ì9ìÛÝŒ}Ñü’©ðIü<âÐ¨~2]Ìûô‹KâÔðy)Ëvz°H¦£$6ìñ÷¦é@5®<^y'€8Ÿ¼9<øq-V~xðƒwkM½_†´ì"Ô.J¨Í(¦ð‰žð«•8×šœÅwèý&É‡ÓÁ3P˜Nß¿=8ªAÃµÓƒÃ÷o8x[S}6á™¬ÅgªP<²ý¬¹µæ@]à;fGh{…fšd@Ï—Œg¯âQ–˜Û,KESOY¡?²kõv¿n½[¼¡×jŒU}¬_1ê÷ë~_Õ+eÓEµ±À—‚QÁ©¤’oáKáèÁú é¦qc?ŠGlpù.É£œœöòâ—wÌÎÎ÷ëgçVƒœýÅ¥hU]	4ý(äîÎRúó¡Î)µu
qï<–Ð÷€œRq˜%£ÂÈxñž‘3ÛÆ\¢Û™Õ—&'Ümc#zlæ#
c0º$"=N³˜Â”à­Ä=ˆÑQ,)@áH}ÅÂû« ¿²o-Ø°ãzChß»Q×HÏ{FÎìi3†vÜ'ÆþŒNxƒ«7Á´‘s GÍ¬KËRÎÖNžŽÉÛJžÂ×é"¯ÇÙÝ¤™Á“9Œš2/ák‹q~’Ì?¤ý¤•fÏ§“	›î†y¼ÍZ\²Cí{h4Æ4žQ¨&LV"H0ã)êÃ\A6QGé8*ÜÙ6/3Ê9B:øu&xj«Œ›$ÜOèw:ù l7ÎÒ¦€kFÃEã¾æn—¤`7a±äSô»% AMpy–Nô¤ª÷Æ©.í19gß|Cƒb{Çd	:‚¡ÈãÑ¾áOaÛ ÓÆ¤êoÊ˜Óþ½xþþätýë%š“é[­Y<8A»u}«­µ×@Õ·Q&õ:}m|JÝÜ=^z¯IÙgÍ.zÊ'‹‹É#b»à‘˜Oê¬øá-úšÍ7äSï-ö#­,ÅÖ…¿.æ­ßW¡kÌ í¼	iX’…(ø*{+KàŠ£ªÜá`«Fƒ}õ—; EŠÅØrõ—:N©&XÉì¾qûÞn6([µf¶ŸGö·{L¿ÌÈ æZÉ|>×kD¸)æ{>¢{½Z3R”}ƒ&@ÙmJ%·Y£Œ¶²n7én·ßP59Ô©-U!ãF@BJ´U°;Á§„f³§çÓñe
Ê!yùƒ¤‡!qñd íƒžˆ×ž³Ñ•¬^÷àCœŽâË‘r¨+ë€yû“ä6WÆ‰g÷E8‡”m3œy`O°ææ/c`Ôž°›„EJ8‚z¢GØLA=ì`æ	4£¾>þWÊI¿Sw2…=ÆuO_§ÞžÊUdÆÅ<sëj>ãÎ`Ç¹Y]yÍkJ|G#@AÀ7Nn¦âuÊ_R…u¸KÈ³ãDìTbßØªzÞk	ñ§
UÑ¤Bµœ*‚§uG#ƒª;æ¬¶IµÊ±,©Ë‰NÊŒÈ$‹”5Äõ£ï*½žïvT¿.š7z«•tò œ£„5Ÿ'“þ¼ã]R"ž"t4‰˜*ýg—0h˜m½¼~­´á¨NùŸÚ˜ñi¿ þF„¹rb±ŠŒúHŸæ¬’W7 VõQuÉÇ4ËQòÆú¢ú~›Õ™§·âÌ6TUG%žŽ6¥ÿŒdà¨'@R‘V6Ñ²ŽpÞÛ›${wB“lÆV]%L]dî¸bÆûy‹]z‰0ð»?ž¾yMzóËEbï;[öÙLL?Ö<!W‡úÆÙÿÿ_ƒó ÐkkELÏ`HZÍP'X”&e+f1ZGðjâ'°1rÞí(¿;šöNhÿ87L½6z)b]±>#C«ûÊêSãó_->8š }PK‚Ùs¸ç­ÒÅza¶5Ÿ¢Ò§Ý’³ÞfÎ¯Ù¨#ß[ìŠ²Å|v†/NâÑ`*èë¥lA‹1«¼Bq³˜¥ ‚ÑYcZ1kß¡€Ùh£Ñºp¥795¦Xä®%öqå9íŒ›ÉêÊÄ_žYÄ,K˜Ö”Ç" /»V„àÊ„Æ¹6#ˆŽ“ñPt%¤Îçb*Z&6‰’Sçs­6åµâkXßÐ»tŒg;ìñ›,mÕ´æ]±6<W÷r¯³]«Y(¦«ð#;0Ï>JK?ÂÙ-þ‰&îöyù)ëå53€à r>ãY:×wlìEi±÷º\´üFä`f†	x¨\0¶ï„Â‰&â~LÌ7L%’]=S¦“CŽïN0ÚiyÃ÷õÒÇõðøZ?t„Ÿ×ÉHî5oóèhe„iOLS•¸ ÑuÉ—8&C½7}˜÷ì¥#O@YÛ“6k'KÆ)y-²Ã_Ï©g2èµvL©1'q_ÆCD*øæÕD¹iƒ.ãùÂ[cÏ_#Á¼"òq&PýbGý´‚É„[ Ö\hbëÈ¡ÈÓ‡IßNé§yDê‘nUl457–ÚÉ®e%w–xžã‘k÷?=~žK×ëªÄ©Ù‰)„mâG‡¹|vƒáb«C°û1w™ïÝqxè¬ARÜÞ²Õç,&ê§ã“éî/TxyX‚t$™xBŒu–.®n…_ÉÇ{˜f±ÜQ¸÷¢§&³˜o·«^†2Ç¾°ƒ|)v¿•5ê6	9Æoy«'¡TÕsm-Ã‡\Ež£llÇ?!Ÿxüè~ñ^ÆÄœåÉ2@”íè…˜'t™GÏQ^€ÍÝ)‹@½GéMÊ'ºþÒÁžëÏ"CjŽÄ!û¤ãzïsŸUÒ¨å‰ïµ*QÅÇãs8Ð™ªæ`lµ† ã°ØAQì-¿úJ¼³[Ê…–ÓAªGèð±]=Z ¸ƒ
~é+‡
tý¡úœ½öœ5½4CÉ~§+¤å€âr‹20…­`ÈJÅ 0¶ù`v#'èA¸s²êÛe’›×ÈÃ³ÿ	hs0:%cÎ0j£ªzV»¥»•:ØVi›zpq-êñ¹½’\¹j×$Oó«ÉlK-aØÁ ¿x)W1~,Íekzdh'ÌÊ±»á›Óàê&pNˆ)ÄO š6äè79¦føûÝ-þ¾O>fïbvüÈ’¦»?(B|¹e2h!õ‡âöç|JèU¯ø¡œðBØ;á¿~Í^ïm3Œø”ex/B&7|aFwì‰ŸgÕ‡q€W YÖ	E?ð¶ZI×öã-h1IŸÅJÿ -{ÐWyf·MFxp{¸±&l7X—y¦…rý`ÕìL˜U\åQ6Ís¯\àa\È‡#ÿÿ/NÃî²Ã§@8ŸIò
€êi6VE¼öiKºG¼Tì¨³RµIØJÁ•%iá—Šxøé™1Œéøš%ªOÝ³œŠTM-Q’ÓŸrÅê‹ŠP†ÁË+/Â:/I~à®$¾KFy…psÚdA‘e°<„/³¢›Æb¥ZÚEò ÆS”½_1:¯Ýà(Õò2W² á„åk3 ì":aí|N68²Õtâ“(J_¦JjØ²4ø)M
[šXöÓSJYPDDŒJ¤R>éÚ	»~@Ž8/¡Æ¿ÇP×ut:§%«¬¥$Êj™RTèHµü%KM.Ë›Z{ FzTE5¸ñ^›H¼²UÊMðCú²ç«"âË¾–ïþ¹.¹n†æø°3/*iÛN j~Ê¹WùLÙ4*¹‚%â ™FK-ù–¸¤'=,·xúA\LÑC”g‚+¬Ãd´Gƒ˜{b”.‚*®ê:¨L‹jû¯ñøãS—Ax‰—ä)JOÈ—í\-B÷tb»$b‰ž*5¬ñdý'6eÏŠ"óÏ¶Ì³ÜXb‡È|pÃ¡SÖJAkA¸ëŽ{GpÆŸEk?ÆèÀ[dZfñØÙ ÑÁœ8'pmàa¨g)ž’‰[´•-8dÉ|À`6|l¥¬áœã_õ4ËÅÁ_¶¥©È&èêäª±‘zQ§ò ÷â…[í‡ëV¡PåÕ…¨‚S4±N“9­’êù<¬!Ôö-? ê	4W¢ý¬c…áF‹Lxþ —ÒÑ$ŒØ2à[¥¹)Å°j£½ºd…òTq·V“±¯–Z>]Ñµ&]ybI#½ÒÈ¦”Fìê¢1kGõSbJÚp¹$á…î¬ƒV’RÞçhŽ~Ð9àÏsœï÷.ˆ¢7I>$Ñ±dZÎxyöKÀhºÁïa#t™ÙEUò»åUFV²ráº’RÅ,Uœ“ª„–\SþÍÂÀ–¼ñÎ)!?XB•õ4}Éí´+±Õ'^‹o­Z6ïŽ?ßlUÜ¥Ý¿Ã'+dõb½NASHÃ ‰B”ÿ]×¬ŒàþË/[ñ&…+—„•%L'Â[ÿÆëö9k¶ò²åîÝå+×¾îKJ¸,š;dm+¹> g©W®7–¥tª,?äò.¸2/z’õ¼‹E[uÒw…ýìŠE(@±äŠ Ü ãCÏ²eoLžío-ÔZóì·lŸýÔ;À®xz`Õ÷&ð¾÷£½°UÅ"d(ì
0·¥2],§l9x%œÛ2Ÿ‰Æ}ötHrû£å¶·,Â+ý™<ý)f]èÑÂÂ¤éþ9ÿlÞ‡ÜÅ9ú¹[niâ×³¿¸CÝ–æOg:Ì‡ºPÝ_»dæø³îÈŸØ1…]ÕžaþÎxÔðïO¬9ž'±½Dù"Äà&{Qù@ž)4©Ý¹’W-ŒÌtØÑš—,—3º>LÅ|z3½iFƒÑˆ¹ØòÒ‡¨òHtå¸¾^D#ècÌOo³½e×¾üÅ¶€évãºÇµ‘öé?YÕæ>Øð,ùÐð…$„M OF(s²Y1¹áàsät?Œ»–—ÄzGÎÇÖ§%—®àž#=]A~5@sWÄ/WÑg×Üë‡qŒÉöÄ¤´Š–5ÇZùn¬(Ä¥uüácgº¬þ&Éz.Nü½-ß¢ÇÃëhE‹kFáŽë¡ëè%ñl¢[ø³«Ï4^xì‰w°Æ#ì>dôÁÔüÌµ &ŠÊÆ3J&.NÇNXøæ©ß¬Ý.nÏÆV,ÈíA¦v^ïG6„^¦'!¢‹™í›8Õ¯=²Áö®’¼?Ä,f/Üjí™ˆ‘«‡:vÙÏ“$'ô±jPG2Û·;Ø³aU3§F±zþÑW8€ž“”“$Ïî*'9U3^z_GÀ×SJöLÊ[ZÀÝ'¡ø .ö;	;hÿ<£î=£¤¨Ô—ã9ˆûY²‹}Ú‡ð¯ƒÎW%:§h	ÍO´PëÒ¾–Ù\CŠ#”FÍH^´òw1@Ý‹d#<öFü2Úua÷ëâšñ&‹~?ÉXË8îìm¬‹FÍöM	hcÂ.ÕŠj¯i_.~Û4ƒYÃò0Žô¯ÅºZ\ÉL>e —h14¯€ª§ßÀØðÖóüª[Ã#üã.ídð.¹bÅà‹ÖÏ?G²{†ˆååF¤¨£û-k ªòÞ6Àï´Í^ºÕ&½È0‰„¤mµsL,¬îÇ®ÌïzFD@ùPT=T"Þ¢©ðàƒ ××ZRpl”=Ð¡tÃÆ¥‹&ˆ(]2,~ ÑH?€pf8‡|w’#Ú‚†Ç˜q+yñâÍ›ÀG H¡P	þfÄ§kÉ-³MíE’‚ØLÞ¬ý;>‘ î?"\‹Yh] ‹p.¾f²‡×Éº<yD™]<ÈŽ6-Ž(ç_T‡ÇÐsaß
¿±ý‹ØzÍUáGÌfõÐïhïÏC»GãKü2à"¸Jžü=Í‡¢?öü˜Ž5Ï¢:> /¾f:nTg§=äŒW»o\ÀÜ]„î^ˆÃà¯ýG×kæLb×?:Ì:)Ø`É‹énÊk¿9"Ÿç–ŽU(ËŽŠQ x§tqÔ“»DÜàÈ„¢ü)ŸIKX1J~ù?ãQZ7GšåW•Å¡gM…(Aûæàf˜ÛˆM#›MúÇe)õ‹7/ßþãèÍñÁ[{ÿ¤"žÁË7ôJýøþôàí$?ÿtprøóÛµûè§—ÑÉûãƒÃƒ“— ãŠ%B)cÀ|ª&×é<+á]…y‚Ç 2'sŒÉN£Œ(Â UØ«HBñÊÓª-‡ßêA^®.
ˆ:¥¯ŸÑªjFÐˆ¾ÿÏEùèýl€B˜ÔÀøä×å]ØH•ÎæÉ$·ø—ÂÑFMŠÿ6àë
N–w•2ø/æÚoÂ+šÎñø¼g¿)A*Åjjˆ™:IÑ5XàüW£a†4ûâò™~¨ƒÂâÆ-„õ>Í“ÌA…Õ«Š‹$x§àAD€º"ø™„‰=ë'øùÍKðsSJh¹áTþ{¨Í–…†õ,ƒ)j˜ÓÇ„%£ìƒøÞÆ‘§*ã§XƒÐ—¨mýë%J!­Éô¶Þ¸¿Ð]nÍUa5²˜eÉœc^Y¸0½¹\ðÔVÓ¾¿úª(Y¥+C¬ÕÞýT³žeÇC¾ÅáN¼Ø¿f)Ó:pq<Í§‘!v93ýr1©þõRì`ÚZúú¹7—Ç`Ÿ‹QžÙÔ‰«îäU™œ‚q.ˆ¡M­iöÐÊàHñ¿ÕðÂöWÆ,GœSÞ$rœlÌ0ìfŽz¬G¡–CË³ \¬,phHv%Úˆ¤´pøòÝ'G¯£G'$yH@ç1 5i+’JtwkhQ@„lÇ±ÿBgÍ¸œ-A±F2æ’ýõÒXˆ…5"íÐaÑE›O„O*ùJ¾Î Éãt”Áë½@ÑVnÐ»N|Fp[ê°XRÁ.Ëz(ó¶ifŠç#}…Ê;\(|DBL§=GýZÀ£7ÓI>Ý‘(½MoAn?}Ñº*êÃt¹VvB÷3ø…´JI5rˆ6%hKLoÑB@?ÝRÿHâ¹*ôj1á•º®tåÓ<ñÃ¬=L*o0âE×é‚ô×I$¡‹ðg×Ðì8f Üøî»†…bËLªìYzn¸„ÖG¯œ·¸F` ´·¥¥¬ÝÍ×”ð§MrbïÑ<íòuÂEB Íœ-¿´¶†nôÃŸåH¿ß[õ¦™6K2áij—yýþíÁIIE6J
ž¼<ý9Ü ‚µå=kT(Éú‡%K
þôþ4g â1®‰·dv¡gj›5ø¿ù.
˜Rl·/>ø}ý~·‡M©rdþÒ¾Y@:r•C,ùnO¶ùìéíIäqÒÔ¢ÛŠ~M/¡ÿïta”õÒüî‘Íñ&+‰%B ã¼wg¶’Åß¦•Mçy½CG-Ü•ŽâÀØy±Üy¸ZÝ]ãøÔ¡ñÔeáS„KÏ|…{Û”à˜ìú:»j>·úójüç¸Á/µß¦È#€6Å4JªA3²Hì/âŠ²vN%.[RïÁ%xÉ1?>úš`ÚÆxžÔyùØ,«òJÖhÈépÉ
-Ù³Œ8øxü!6A†Ç@ýé| ñåù‘D`Ñèº ¹ÿ8ùùm‹æ³î7@›x*YhDmy¯ìÊL
³ê]Þ›¶\µ6[Ñ«‘»£<]gé*¤!€¢óñÀç›®Q²>‹³š`|SÓ+2dP$°“
¦)/5Y¡&Û¡”%Ìwó‡w§Ó›dâAìw¾öMŽºòéG< ¼Iî”é8w­j€><™øæ!½ò†°d²ÐÚšöõ›FÃ
f5ŽÒŒ8®x!œG(¬W†ET°5[dÃzþQÞf$R>K˜û¸?Š¬9÷¿‡DŽ1»t”;
ˆÆà–\5´­¬J8t~®ós9ßºdk¢ú¨±N5Øtó_0ÍÆÈR›²þÐK˜ÝÛ"ãy¾õ"½NI+ƒI•µR=FÍ[Há_¤£µ6|j¢‹ÖÐûz™oœIS½d(ñíJÏº¸c¦\#d† c(ÁÁ³zD•-ºVß Ee½þ_ƒåÖ}cÃè¶|:/¾ŸuÎíŸúK)ên½žö€xO^ß[fí"{Ñ/µdù¸{QíuŒÑ· õ‘3á÷ÙQ}M­×þÖíö··“Ð.§‚)PH
Ê-©ãÕ«—;èæì©ãMÜOòòçÛííç5þ†ç¶ü~²+á¡HúèHœ’ìWyS´Yû‘²}zdw p¿(àø0¨—ì/È\ü!¹LIÀçíî!¼TŽÉæk%÷Ë²X°&¥¼šJI5*ÖåÛÆþ6£`{jËR~ò€@F-&é/ƒZ²ƒU=sšêU–$“£AÆ™ÙI’ïJ/
vÚ¹o¿°Æùi±sˆ¾œäëÇ“AŠ–|LhŽ®"îSÿŠÐYê*$ƒ†¬DM<Î)R6És0ÿ\öfV.x•Î×¨œQM­[ÑÓJ5²’FDzû:éu[TªD¸RKÖr`åNýíÔßp§šµ‰íú›¾]-À|äì79è\ `B€Úhâ¦lþ†5ÍT^{¸`6ª3u,wv£µ¤Ä«Ÿ(SP€ñ\ ïjÄý:þ`:!û®ŽçL;5½_é4ÔJÃÎùÀ´Caödn]È´rÌ$dŽÄÖÁ^¡Gao>¹V9ý”Ç“ŽKÛï' ¨Eýá|:²ö)Aœˆ¾Qæ¾†¢	0E®šÝøS)|Rá;4¾®ð~.…/ Íé
_@',WøÂ
œ_á+ˆšÂgSPFíY"*Ú·Ü ˆàoœÄ—é(Íïêrúï4ªh1òâ‚Ž>€B0:kŸ3_xƒ!ûJ‘X‚¥:ò”#Q°i%"y[ïTj½óÐÖ™påm¹[©å®·esæò”&hŠ¿²)@_V)QöÂÅÕ°ÑB~ÔdAKÛƒ…’å¤~ÊÅa¸ÊËgNõDïORâÖŠ{‡y-ÉVžÉ¯‚`×Ökj9¢øÉ¢6ö”B´o	qÁ—ÏAS£;$üÊÑUwÈþÐÓ­g¬Òs&b	XXM¸¢„¡²æØùšIàž9°KRòöžA~FvßAQý=a}ñ¾˜NrÆ:®  UïxXÑ,£ÂYÔÜ”r‰Ö^¦ügtÜ·{,o¨²ªn«?ªHþñ9ÓQì¥¤7m£Hû©0ÉôØúà–™žÜnÜFÓSZ‚4¥jþÖ¦+™¶
¼Ùû¨ÁbÓ©f<ÂÈÄ‡}¤Ø!Íë—íNæåK–(ÓÒ–Ý×Pv½WflONÍú¥ú-¹¦^f]/¡È/©óh5ƒ&SÔ¹¿·Ì÷Æ\â˜5éíúab)
Ç@ÝŠç&ÆèšÛ(K¨aX´ ÑŸB€ÖUQ˜­É€¹û¬˜‘É­ÀðÄcÞÌ3G‹ÃŽ²ÒÒ½ö‚' Ùøz	Šït¼w„RÁt’°Ìoñ¸Á‘§õänäÁŽQb<¶€*u!|)äËÍ¬²ÜøV;f„ý2ŽçwÑ·BŽY=‰ŠÇì†ÚCmÀ¿Žs#ØÐˆÄ[g5fU1 ÒgI<k·:˜bj|I1‰ì4èpi\ä¤•PjûßQ ·8ím±³£àÁ´Ñ–ãæ¬‡3‚²®?1áZi<U. 0zðÜ_f*"
‹bë}2eÁìhíÓæFF*Õö×ÍÙ¡C¼LŽöC!²¸PÙ—!ˆˆÃ+!°?D4™®gý9píKxöm=O§(¸1¿…	¾<ãÜ©©Ù7C%ŠÏÉM’‹œûT…×BÈöTRWf]p=<†ÕlØzáXd¡{R=‚Î–sñæ0röö–ZÿLƒGyjB­È8=°‚AU°RÜ«å²sÀñõ J=¬Nß%ö$Úqr>_Þ¥Œ{å€›CÙ‹c¥ø•È4h­0¶Qò#¾fÙ[í®žC€
Æ3­H»õô‰^Ä—0EÆM!X:SÕXÖ”#Ç¥'—PÀA8Ðô,#€œuDU©)q¡9£È:*HQ¼Ðèˆ S X+œMºðSÄ):]`ðÖ©G­VCú7V¿UA«^ˆçÝãÑÂÂêÙ®ì˜©˜ÑQïˆ3Ár2k÷"e€†©È(¡ØCÒÎSJ2Ècü]( ¬z1ï''Ì~ÖößÄ“hÝ”‘ÃîaÉ¨JÜLþÓæ©€@xŠ,ÃŠp|qµc„vó«æ´ GK:³ Åà¹!=¬ËGÁe £s-@±?–x[ÔF;˜àbsvõ)“½ÿ0²¢Â¿?‘°¨°ñ2Òò|˜ôož§óþ(éþñ$FÀJDFwÿsÒ˜c‘õOD`ÂSoP%éW§3F‰†?]³|˜Âl.À1üU2!ž²Äg/5›f%£ñ´hXÁoXS [\ò2§ä¶$@}aJæ‹a$ŒhUb¹_&}¿7o'ÓÙA›¸‡›ìT)Ú­{KÃp¦Ý)poÉé»FíÐ¬ùçA,Q‘D¥¦‘Vi ò‚ª‰l{Kú#LpiÜ	×´âÃé-Ùe±Ëè‡¯néF•½¥þK;àÁEù#,w©‰7wŠrSãÞR“€ÕÝË)¬ž±¬C_«(¦ÍÏ‘êÖƒëIÿìóa`—S†Ú>¦‹ø¢wÿi2§ho²hÇ]žÕ‹\V
xåŽV Èæ©Æ8KUòÓÒ†C`HÖïÄëyãêJÆáÌÕÒqî5kÜÛ”b/§ØûR.ífý^×vñ©ââ(ëuu”»¼ðº¾;eK]à‹žðºÂ=àºÄÛ-c2¾âƒ*ú¹¼èêƒùi’Q(µ2™û mâU=­ß¶JªR
Ø@½PÆ“õvý	ÙVý@LÀ2qöë¥œ2¢4ÍÀ1ú ¤r—.XøøxiK!+•d¸Ù®šáf- eŠ½ß»óùôöÅôvòÕ?Ð.ô•{?{GžüÅBˆüÁt0¡tt¯r:§0{ëøÙ[Nï “ÂaºT´¯o#Wm™‡“º$ÍY=OÏ
yÄ0Õƒæ'ÎüëðÕ’WXï¹¼ðhHæ¾¨´ð?ïš^ûŽ*]_»Gƒ?ËÏ’BÂÿêg[Ûæ,‡5ÂÐÀ`ú®§•ÇÆ,úáá¶.®_lp£5ÆxýF$õÀÏ’<Ç;ls·{’Þ±Ó-MêNä?Éò©Í…ê=(óä~â(rrõ¬1e˜ËÖQzC™Æ,o[2O)Ù%ÍÐT…È‡ÒneÚ½`…iÇ8ºy‹E8kš$é¤V8±°¬P³K²UDKrõW«!†UešV)N÷÷dq¦w‘žt¬GíÝU1Eª›üî=	¬ÅúzÏŽ¡.ûƒˆÝÜÉ¥ñå4óæË²lEœkêºVvÞªZ´0Óö–Ö_ID£—å—´Ñ5V®«ˆ=e“i6ü’&·VQAþe¡ jD(ƒ‚ñsl3>]{Çð•`ú~t4¹šxIhfÙ'šÙÚÖµHÕ¿2Vl5iuÍ„OLã—k†Eqþ._Ž$o®n„¥'5øÎt2qéî»äjždÃç·fCûk…½>ÉÎg«ÀþzÉ±/¹‡™ÕE8-×ÁbæÑ7Ñ›ôzg)-8×Z±*[ø<ð×¦%˜rîñ¼]N†¢3w¥“4ª¿¡ÈÈ‚ÑlØ.«![G³h<è…OjiÇhÛOäÈÏŠ¢lÐMm­/wñZƒÁ.M-oÙÒá6<{oöBðDW	¥6ÈvbááHÅ£ržþ»]–.òsã0ÄEä,æ|Ê€ömë×ª–¼@V½
Ô¡’¬ŒâÎHÂn+:1
ç{_e8¶9‘ªª×ÃÑŠ¶a¾Ö6¼Õv(ëK‘vSA–ÿƒ(	ÑaN«$ôfˆx\½S9SóÄý2ýÊúäçÓÍ·ó1¡¾¾z&IONÁ3ù€!éç)…Y×µÐrªí¿›Þfü<®º†á³£;™]41¿Œ™ ßê:†q:†š±žO×/çÑÕ|:Vò\K'ƒôzJëÒ‘¬PÜÒN…åá9§S]E²¨Æ®À_íòv}…¦-I7:m3#ºÕmváOŽ 1øùqdK9´1Ñ?‘Þºò§ÿ©ªÔ½ðž½E¨<¬ÏÁ^—ú<¬$úx¨5‹ÁûÙhÊÎÙ‹Vßp«dO…éÑ;Ì<‰£ŸÊ+hâÜVéYQ™¸tSgK˜¤“:5N)¨ó‚zàÔ~LÜ6céÕÁ4ÿŒ¡r‚v#†VOiáÞS"â¦{¾ÄüÈ7èšD?L§×ð‡Éx‹5K³xˆ¸d¬"?5a[DÙ™Ò<¥}þ68ŽcÌT€“?Ç|êÛúôê
³mEÄa²Ì]2ÂmL©YONßsúÂ:ø&Îp±œÌæ0„èÎ35ß$cÌ¶ŒP£â»eÍÈÌÊŸV*”fcM(ÝäŠº•»GhgÎr]
 µÚË³é£êÑöÑ!’EgèËfb„v]–/S(Àà´à”5zšÀiÑß7Zù%™ÃöQ­<OnôÙˆ4ã¨>$u3kDÃxò}·T†#Ca3'·iÞªf8dêûw¯;í`6kåÙG\04]øªZù¿ñ,²vÌó·³:ç‰ÕÏxt¢i’ØL3+'†)§‹çü¼»’ôuó5|©ú‹yEÆ6·ùöÇL£5\æ¢–i°ƒROÈ^Qr¿—ÛQP!TQ8}+ä’n¬h¬â—nå¶`[É)ù¯r[0àO#}^·qÝyáQâ'ƒÈÃà3‘Pòh Ã¢‰àW:ù 1úÑØI2$Ü»™[¢J’·Û½ˆá•º©.ìw	¦Ä°_«4/ñ’æ+#:“öÊc µˆïì–@zÑ‘ï:{DŽÔÊ)5Üœ•y<$£KQó\öƒ2,Xý™5TÊ #±EÏûC–Î‚¾äw ¦ž§KOÅ_Š_žæ‚É.°
r±Êdì§Q	p÷ýúò^ðCš¥—'Žð²øè/Ú£ÏÝ¶ù\rûf:Hø3ì‡ÑXùÍRþŒ]0‰%9"sŽ0.4>fž;ö»¤þàƒx<-f<a‡~©$[yiŽè±y-0¬²Ž±è7iuEÀ^Ú:Þó‰ÖÕtþ2F\¬‚;Æ,¤Étðë˜Ù{ÇB Ö6E	e/i›ÚÃ¼®	k%ýo{=§=ïYUN0ÆÌ«G^|+ Œóÿ*o‘¹Ñ„øïØ½×)¶./!MÒ~¾I05]J‡¦ªž\@¿Æì–=©YÇØÏ[‡„‰ÌJßè›Ô®>Þ,ÐòKŒ6GÞ­<ÖÌ×¦ÂPc>&ö¼m¾ôÀkÉÍÁ÷ó•Õ§€Õ¿¿Ä,½ýååÉéÁÉ‘=ko~~qðzíO½ê/N“	†ü’~½¿°æÀ‘!Ìá7Q·Òì—tž/YëŒa—G,ÁL3ª¾;x{òêå;ü~üþõÉ…úœÔÎ[ðÊ:¥D@Ÿ°d’f*Z÷÷“.i6‰gøÈžÀhªB« â:0VÂñË·ÿñþàµNþÄZPó,ZûåèÝ)”#§…WG'G?éåµUrœŒãÃ µÛ|¥ä­ãùuÌNÎõ=Za‹µÀ_ë–\Wy‹%ÇËu½‹b™aüæ–‹zÀ‹°rï,N5œ|“°iç7%&ÿk
¨àz0Žó/±ý>rØÝÚéûŸÞyw>öõmÏŸ«´÷±duÚû#ˆÝñÐÚó|ÄéÀšW A00ˆbP%­Á- ¼ªš«§Ô-Ÿòf®’s¯ì’ûbLA¡g5µLˆ@±®âW}Öñ·˜p*sŒù¬RŒ2N$~3H4:AÏÊ§¢lòØWœ2zŒf©vîySYfdÊƒ¾aß€ 9
B¢vê÷ú:0îØ˜#|iý|ùÈç¨(£›NÙc:gå.lp9˜]“t]u‰A‘ÈÅb´ßä/ÈgøÏ‘§î‘™üÍX}J—=™%}…ï¹¤DUš¶Øä°CÆ%¾y¬-I¦!h¶tð*MFXº€J“âqeÂbÇ›Sª¼jÏ¸&„Ñº‰)Y´lR³…hm¦ÙâqÜ¿AûŒÕ¦mËÐÛöÝ}I5T|dCöµ>Ù“ôúúî0žÜX}ñSÕŸà}Ñ§#!PÊN…ˆ”·_§s’÷~fuÌ“|wÉsGt†û©‰žx¨¯"ôÕž%‹¦ê“äÞRsò7Æ$9ÄÙÛ“át†¸Ù‡ñµÕ“–«~8×e'½eí[6<ã?¤W9íÛsïV-Ü¦¾=©í8gƒVÙž%o-ä‚=P¾”œc¬„Ðú©°B|ËÀ™ÞàÊ(›wk~ÕÔùçºˆÖùéšA¶\2W•xøˆƒ½ß‹É…Õ’rW2Æx~Sm Ö#/”­Àû<Æó|S4‚þ‡M{u³4™Â|Y6NÆµþHA˜¦zuÀ*5ý°Úyaa5vÝgä€*‚¨¬¬Ê¶j£÷cZ	¬íÜ0Iô­†¬eâ`^ê÷L0¸èEr#È%ÖˆÖV„šÅ#-:¹ô¢>InÞæYÞÐ¤aœ	äÁ½Hs¿  ºo¾‰êRø„¥AÎÚÈÏD£~[“äTõå#BfE•€Ú†\Å«OÔì“Ó +€±2¼ÑÊõ)„RpPGMä79qáåã!½µÏ¡Ù˜ƒ.u~sø 	{U§R©iŠs^ªÄš£˜ü.úˆF®\ÕT»i+$b:§îV¡âÞÕáXƒ¸§ˆ  ]5ôaX‰©ó¥qBÍxPIÀ‹oCÐ~>õÇÞDéàh;ÖÅ^RK'a€ýÕjžGE?X%«4.p‹åË Š$«ÏÌc ÝWø\„ù™§¦2X?»Iî(ƒÀ¹[ò·qlI‹¡Dßt²¦5QS/¾À·â7	¡%WÓF*#Sm
µ´é0¹@úo<:Ry¿µÑÐOüÔAÖ½)¦r3ÆŠL¼€y:f®IÖŽÞB[ò!é¦MP5ÄžÚë8LîèY)mÖè¶v®´åO&Ò5í8Ë2àˆž{Œ5ìœ‡Ì.¢½r·”4éïÎ¥*IÆÔ{¢›”ñVþú· Åù‚èÄÑªsÄ}÷†r2
ÆŠ¹¦«Õ‡+ +ûû–êÈÓ=m
é¨‚º
£5<MÆ³©iF«¶ÄlM&°ÂB±·_d·šö¤ßwÝXÈ».öVÅW°t¥@ÿÑôè»ØÈÌl6ëá²šÐÊz&=Ðí¬®•EUpå$L7,#P2`þkA’ßà _kˆ{\É@²ƒ¦‚\õœm°»“ünDy¢ë}~Åè›‘—š*¢åA9aMP¶µžÂƒ¾¼6ãÜwÚíµ&9UÙ¡®és$Ãg˜G™¸kÇsÈ y
é€³éU~xmÕ¯‰Äî¢Œ²úz(b–­îÑeßè–Ý1àëýuº$™€¯W1b>xºÅ®ûûÅîuÚvØuO¤Â×áÛmu€.ûÛÞrVóÜ×m_<ÏóÙÈ×4¿áoœß´§…_öN¿gtmÀXO·$ü€Õ«<‰G>Ñ-w@è²Öê½-®Ä¹Ü—^oîáº·dKpÒ†Ì<@Òé­Dí÷Á´¿@ÕºœîZä8‰¹g(“Ê9ý¬OgÉD€Ÿð<eOÏA"ûx+Ð‰+ëëª•Ðá™×*€fC¤“õ!bô&,B±Í.×7N“'ÌTUhNÝ3Š­€g»mzR!¨Ä¢CÑ­ÀÑ‡Fl»qÐ)Œ‹À`_\D°-“Í  !µ¶… +[OXìjÜ¿ñ„aÀ¾Ø?—ø‡šëZÍÛe®úa”ÆFÙ úÃàGú>ŸÞâw‘€¶j£Õ úNdwFˆÀŸ«"DÎÚ«4®¯0úãÁ¯RÐ©4¯_¶Z¶ÕcA:Ž/u×
ýÆõòPÿÑ)Ç
sý¶9YÝØáØ9n€™›¼´€PW9^ŸÀÐã"Št+‡ÃUðëwÕÙQÁH´u¸hË¹[™®EÂï|‰Hx•/	n2b¦æûºDÙ ½g¨ézØì!'îŠ<Úx^.†¹ð±n´vð„ŽùÂ0ó	Æ\ë2¯²²üHæ_/…ß/ÓJ˜‹/Ã•Ò0Æû¡¼
$F…jñ·
Ë¤b¼áš%Ž{?ËpJ7PI znµ#¤äµýú	¶MÒ†‹w9`äž8òƒþsLuåO<q‡Ð¿*wœÌ³4ÆbR¡òÚ‘¤áÀIkÇ¶€©´ëa\L’s®óTS{K[	ö¡Á‚.ˆ˜.I r?2Ëìs>ˆ’Ë'Ã<v\Ä>üx"ê¬ Àcºt?ÑÏ“õA2F«;F¯yKÉ8æßŒ
Ú¾÷Œ›˜F—yWƒfÐ©6°ªmÜ’(t\%@ÔÞO1”Cƒ!å€˜àñD‘õ¦‹œbµKh½Xïê?d%&1îëþbžMAOD«¼Üµ5g||ácKËY)Œ”!>»Ó1D4ƒ¯^þ3î¥ üUo°º}ÏÛ!g¬<ÛNåÑýRÖgÅ6én´N£I“~Gø8®'@øÌ8Ú´§?ˆöüa>`8fQVÎ›7 0o^ña’0Z›¹ØÕõÏ´¬yo)¢¦JKâ#†H¦ßOÒ«4h¢ãÛÉà:™ûH9=*e\ÏÐK o_¦gÐ•UÎü‰D/gÇ‡~ÒÂ:®*õ»&5ò }Ôö ÷!:~x¢A}ÐH—ì¤5€tYÛ_ÖýÌÒciîY~§ìr#ŠB³`2R…QA	B×áè¬GX8˜Lå€ÏJk’ŠMGlÁQUÆ3ù@þ,kã$}ÚÊì«¬ŒoÅ	hñRr¶ç÷ï¿ˆh€ª.¡ ,RAãt‰,]ºêÈŠŽãž½”‹ª»Ì;ÍÏiOÇÚº×	ªÍš‚*úçRÏmkb	¥EË€°ìWO6Æ2:6J‡…+yŒo»{…{å2Qn…Å }®ÇÃSLÙã‹&íW¨œÁÞN†ÓÑ “ÜøÛÅs¤ ‚®î.ÈÄÅV«u€¢&¸¾÷j®lÈ%Ræ£áÞvt(¥]7%ØéJ^@²;Lv·…âÔ¦¡uè—)fYPË!@¬ônAl£ÉÕTì‰+Ofð 1Ø5·däs¡Q|Fô‰tE<n])mµË,‰ÜbCÏœvÌyŸbJaë²Gé™ÖŸnÛcëÕ$N‹ƒÜóÈË›¡a”ýM ­Ág‹ªŒÔ[@¯­ìŽ61ƒNÏâg˜IÊÎÉ)nòx–¹zÓnŽ°3i>Ÿ[|Cì ÈÞÑÊÜQªçd‘Á„Î›˜<ÙÉ_^Šc/4¹kÁ~´¨"²¢ÉÐCü…–ÇÅÒQOIç&ör·*xF¹Ñ°‡4¿¬‚§¸c{D¸lõL:Åð®yÒx{ž"WþsK)(-BóXù—“|~./œozšN¸,yçô”ŸN¨$wËé)‚þrß/Ö]]*¯¹õø¯ˆ{>B~bò	æ5z€yAá5½`°É3¯Çÿ†Cùõ¾pCCmÖÎžD–MñßÁÖ¸ÚJ-	1lDx±…êWŽYGSó5ëñ_w=.41¿%3+=ÁzºWX°çè´%b¼…îý&×`ŠöZ,Mxf¦ÎL·Blòs«™xUü,ub|=¥0	ìqè­6ò¡¿:¿ÙkTÌç®ÑÈË¹vsôáÐÏŸÉËÄB,Ìp¹ïùCƒ­l”ö“z»éè=ŒÇ‘û5Á}à§1†ë%†ª†~7 ‘ÃP_ Yþõë%ÔuqïD{{7}Žƒ¥ËÓKšFkÿº¶³^¦½~<Be#ø@DbŽëþí9Xuüªï²	~¢ÐÞÉƒ’\´Ã$òõIL½{˜e´ÐõO‘Î¨¸ž¦Ð«ä6¯y´:ýãSá<S}b¨ƒbQÅ=ëÌKôGÙûˆ*Yö„ÃgÅèz­º¬DýSÚ`PÕÓýñ@¿+R¯jÁ>þ¼%êc›Âì¬9ØÅËÑx OEïHV2‘¡ˆ|¶¸¥<²jZ˜^Õ3åK(Gµ­N½­aÎˆÆ¨ÒEó“æ$<ì\ºV—†}Ôë1i‹s#v‰ä©’ƒÜcl‘——Å½6¾Ž²yŸ‘ezî>ŠGù^í ƒ_3¨“lJÛ@|?È¬êÄU2Ÿ'óã)Ðá»½Údº..4Xýƒ‹­¶^¼ù±Šé•6*”õ›¼Çåg­´±É +¦<è§>In#ŠÆ“Ëg¿à•ÛÊ ŒÅ¸Q¸QR/ìž3/Èj¡1$[1ƒÎU¸¼T£¬Ã8jŒÁ$—|Ìçxñnûöj:Çùs2½÷ïÔ3{²»ÕÊ[ê©ÀÕ§ÒG°{|èµI6@ x”Û*­S¸ÃƒÚö¥R+ošÖ…¹|aÝc]_5›EÚ$ŒH­ì^2¤Ð¨øÖcy¡G¼ÏøÄ`ÙOdùÉ‰ßHâj ß@N!Ù'0${%Ò•çäÈ:"òÊNRxQGŠRw{L–ÙîÁ(™ç}ÙGÜK­øZUDîˆÚþi:ˆo(áƒÇ×GºV””° ÷b`á¨½>¡*i¶¹›Œ™ÅæÑ*ëZ­*ïòK+Ú7ô4w]å+]•8Oœýn‹ªËõÙ<!È>úû]´Ý.>)0Õ?qÏH,Å±#,÷¢@õeéœ¶˜)«zKÚüÃc³d
ø™»Ë›EœG¯“Ët2¨ýúç\hëÆB»F 7x"ƒN­Nî'õ†¼Î¿™ŽÒ/’<NGÌ¼©g2Ë0Êgy!k£øí‚0[ÑR_—ƒ4›â»^DŠÐWéOGâIþ½*t¬­E.Mïõî³¡Y< ?ÒFTÒX‹Vc`Ít4ºŒç½Þúmry“æê’Ù¬²|Ø‹¶f\á:-Y³ZŒ«¸¦5ßc+!N>¡Óëùp1¾·ñ·þå`;é|oÜçñƒñ EðAd0žö/îaÒâ`’‚È™Ã.™S#ÆKÌMXfQP‡ÿ¦˜#`:‰vôOd{íóò\RèÇ•{H}K\ÆSìW›µ¶U:*ö–Káˆ†Ê1Åìíb·Xò1ÍËª*5”í]],Û“’æ6ìÈ®<Ä$HêŽÚúŽ›¡Á$¹öùôŠãÝŒè¬¾µžn7#¸Ô­:òÑ=çyÌ“jÍù<AÄ9ÙS@_¥•ƒUò¢AVç¤;òd·€.a3Ãõ³§íÃsÓÑÅý’ ¯åÅ×K¹[—×÷„C'”&	Tœ›õ¶Ï¾âmï¶iA­žÒs¦î®"˜°„!ñ´Š»éã"a¼’(–N´6ö9ƒ¥#Rá³z¢môÙëú]Â4–G¾Õö—&Â>,Ð|†VÃ´QöÜ—'ËûüTíDþð`UøË°ëWBI÷B¢0~*ž>¬JZåS•,ûx"S]èZi)ˆU7«aås‹Ýÿ\9¾’8ªßmŒ®z#Nh„‡í–¢~w,²Ðt*¤²,ÎöäKA*>(ý¾›ÞFÃ•Rö£Eºï‡<êHØ=œ—ÿCòA²X+óýÂ4ÇõUqçV¦yÄ±¨ö³í.½¶MÐƒTÜC²Â¦“` –øðƒ+›h	Ü/	½dù9j ^¨ìyi&/Ðx¦PÄ,«d‘‰°bx˜øü6FÄpÆ*‹ù+ÀTGˆéyýz_Nk¢ðÑh ôé¦Þà$¹=¨aÙ3{ðLAAào9Íº)z‚¦î*÷1kÑ‹ô:ÍãÂêÊ3ëBkž—l}ã¿^l\7	Žß¯o5Z |ž \Sß‚;mÖ‡6|*õ:ýˆg·ÑÅé»ÿ\±Luì~£sQ\‡›ÔFšyêÅ‹&ÂÃU,ò[œðž1¹eO˜˜üæHVxVJ=18•äbÊ*Éœü‘Â'î…‹:ÀâÙÇé¥iûBÌ'3‰ux¼U­â“Ÿ¢ƒ?Èˆ£MµöÍßEá~â³T„„|[úÊ±¥
Yëszæ£<ª7äá}uîKv¯•v\ß!*}IIŠk)qÍ3Òòˆ9ä Ãøµ¯\rDà%¾gÉá5~xÁ²†+LLÀ£J|ŠÜ*Âa›¼âB7…ŠŒ5¨.øØ«¿°‡ù²£éM‚GÀ¡þ‡¢[CzHèÆ_\\4¤ßúÏ0k0¶YãóËãédúç“ K¤ª¹HäL}%¯$z˜>¹J9)ïLF¼’ÛÔƒ9Vx ‚–•bjQNÁþ¼[¹@Mìö"	‡ÍöDuþw:Ýj±L.Õø7Ðùëþ{«‹_v³ó!ü2û\æÇú·Úâæüï±»‹Ám§&rqSäB~/«ïó?v§32VäæaŸ#ïoêkñîEÑÝÞ¦k†z)}@x£ ø${!ïìýtprø3Lknž”×þØaõâ½k_TwÙO¼ß(ô7]…üH{U±gd€ºxßrußëjÔFä¨ûd7ìÕt`\JE„·XÕ±ÔÚ×ïßœÔöéO5]Éª€-žÚ>ûû *Žßý|ò:Áþ>¨Š“—¯_žÁ¾e_ªTR¦»•;™¯²ÓŠˆw¡¯c7Yà–rgÑ?BjÛìÉ4 ¶!vú¿`&ÞèHfv·?·h¶»-&y ¯ÿ+M1®ÔkÁûÓä®/ÇSqà¿eyg/úÙ¸&e?®íÓŸ¨.¡Û#I]¥Yz³‘äp-Kbh<×rmŸ‰ê§ñ<…Íµ˜Äi“_%óf4[Œ²¸F£J}:Óûsÿ3W\QtÛçÔ‘Ãÿ¾†¡­^$“póÏQýçÊ¡/¦Vy(WMÿXVÈ·@;ýórDšà•ôÁj$§:Ñ	’>¬eGJ§=2úŠäç BTÎ¢©Aì}>ÆƒÃ
—)H*R¡’TD®èî_në#5ýßo|>ÃÎÇQý’ëÿ÷ß÷¹ü)ßöXö‹ïzÿ­Õ&Û½ˆK£DcÅ•ÿ…4jþFA›É*ÇY¥NóèJ£Xu<_ïèàÌûïfeáÌŸWs¢ª0În¯6YŒ“yÚ¦%õ³ÈŠšdn…_J7ãôX
bÙÅòO§­¢‡¨lbV@“).@À…µñ„/
jîýïQäï&ò!»©~ù'’÷V<÷û”úsÑêÏ/z®J±ÃÂ*‰¥›ŠU¡×Ÿ$Øb#ŸJ¯ÿ1·j?ôìÍMn³ÛeT»ŒnS-¢Ú…tûw=…ÜéE	$jD„ü_áçt_ácû?ÇPðy˜ÇçcUÈ*,ä!L$ì*#¶_)'%«1“Oò¨á-}:Gùb<¥„«”ò•*ö•€_‰˜° {‘%Ê9LU=Í”0šÿµæ22|ï‰^A âvY¸Å>ÊFÒÄ¿þµ¿œÜ‹Mp"õj4s‡BaóRÁ÷¡ô‡†5H{ènEº":XG8»Þýc©ŽÿV@øÔá\_Ö­}âú)-#8g#/ø2?«×‰6¢Ce0Ýt€V§5»ØØ;q˜ÐÈ†êOx•<œb¨ÚW:šOo³½åf¸@qžÐâX³d.Æúô®€0¼"Ptš§¸Ad<b}ždé?‹)^€ÖQ¹‡Gç}ÒˆÁÀ^`/+Û÷ÐÏˆ¨Þò>•Ý«X±I³<íÎ{&‘D³±LGæ#©¸åÃ:{&~\˜H/’M¥½ÇÓ •Â²qèH„záCÓ­º…~oI7BIî¨À8…×ûa;"¸¤C;g÷'çZE·øRo=|4Yµ8¡ÅÃ©òÍŠoìÉnf~E¨'üllDG“(0¡s3Ê‡iÝN 9,fÁÏ‡I”åøm:'\+¨1¦£¤5š^×k'ñxÿ¨O3ëÕš6BLaÔýj¸Rò•^aG“ñ4š-æ³i†œ÷6‰ÙFÓ›L3öVÔ|+þ¦#”9ù»¦W80Ž¬l.ˆs^ï'éKÇÉ|qÃ°<héÎ »ûlô±h1…Ä ?üåýŠ3ŸÏE_€8òÉD 8ßÃ© ¯÷!d€?Z@
ì	8®]Sh,ÊãÇ>ø¥òûDZýyù%Æ&Š‘"Vqû³0<VÓCR%ò÷=ÇÙpåaþ1ž-²ÏI‚JhéÅÝ…Rªß±ŠÊv7ÜGÎò+ìåûï=b4ƒq:9IrÜîÙq|7Šàpl(`%×Hš÷€”'où¯:ÑVâgøt…&ÒWüÇ9{ #ò’zIï5ý)`cöÈ)~3ËcBVþ—_^]1«ëÔU“fôð0±‘“|:‡÷h†Gø‰µïþ
Ì(ƒ!å a5$j\ó>}Å+QÉžÄK×k5NýØp›{Ù8“i†£†Ý§Ñ#Î5¹Óz–Å’pÿf³_qü~Ee«Æœòø`}oWFãTX)¯…†Õ¡MKÝèVCÞ§ºëªºsßŒÎÄPœÃ9yÀ@£äõôtKcÍDfçæ |H¼3ÁZvú^k…ÉÚÖqz<}¦Ö¦ñ~êµŒ®dþ‡(p›^Gl.üîo›(SÚ8›¤fd< 7.ÖÔ	Ïq=8£:ÅòL½¨6›OÇ*`žæˆ\{Oâß RuŒû@eûpû _Ì#z2ºÃp©ñbÒ_Œ0ò0FÀøI´È¯Hå¤Ð·WJ’Ü$¯;@^w½GÑoDJ’[ñlŸå×Å¤µÌDÇ\Õ—3­"{Âj‰‹,ª\	 ØÅö´Ÿ»Å\ CüzÊG«£qN„Ë-cÌúHï8=¥VƒÓäË×íeL^+Å”
äÅtIƒÉÎý÷$¹I&¯¹ÒÓ=#ëëðßÚíí—;çµý“4‹£.0ÿy½Ž¯}Q=^í^
YjÜ-Å¬OK‡"ê‡I^Ö’òàüzFeÓÍj’VH†úÆôÕêc±ŠØY1e†{Á,‘LÐ'¤ G2ý]©qÐÝ¿äÆ>k·ºˆ=_˜ê5°jJŠM«G‹,0Ñ)æ52îh§Fw'ÆÌUÂÁ¦Ë‹û1(Ü;>Œ'èåsû>gÇ'# pð˜j™³e`ÅÜ“ ”¾,Šg£ôFÏÄÍù0e<êÛ«AcÅ—£ÅC±a=hÖ›6·<ë4£n3Ú<ç‰c=	c©–ÖH%±ý)¡k)÷Œ³æ!<ëv6žž+^ß±Ö¯Ç@jï8¥KjEã°fÇI½J!éMüc07™ƒe›ÞŽ’«œ¥FRyEißnl¶¹ŸX{[$Ë”›¸#-Î%BâWa‹žÙ}Ì§HÔçù%sT¾]m6ÿëŒˆ«“øòË¾ñöq‘Nk[ñeÉ±ym’¢vŸ¦‹ÁûÙ<cÞ6aÞ6qR
Àè?¡‚Ó@þsÅ†«ˆ'f¶=OG­]U”³à®dýéë¼¦¦OâÙa&RÎ(³éwDÿÎ)JaÇxm$×qñÁÜ”ÈÑ.ú‰Ão ÅYŠpßD§É8¶ùÍO„zRo–F‹›Ôƒ~“Á°N¢Ûx>‰£¦L‚|ç8vš¹ÎOKÂwÌÅLGœPÒâxRªb²¯YUw£ä-yýônæMØò°Õêÿ¥ê=›ÿSxÀ!ðTKNØ¨;Ë³µl›p­­1»~¡Æ“2²íø“sRå1¯’$úŽ¬³ÓŠÄìC¾Ç@AL-¨©ä’&f§jBÀèkÿIÎ•´q!æ4~ñC”@Ö©Ä"Q?›_ó×Ð“5”éôÃæJŒcÍÓÝûwž¼î
þ•â™vöÙ
Š×ïIo¼ößƒä KŠþŽ|æ!GÊ®•myæÌþ’xåZÁââÎ€4ånYÌÕóJ…æcBN,zŠšÏ©SÌ¢'Q4ŸBaÑSŒÙÚ¯÷ª³}ÐÝÂ×³žcô6±Åô&•‰-3ˆã#¥”öHÚC­<S_CƒôR÷Ì¡•HlÎlù@_)SR4ä£…ÿL¯®0¿`—ýR‹™@v:†•ÿ’¤MüÞþ$êeõì›o¢ÝçÃ6`iº¬/GóªJ¢ý>&ˆuÄÐ“L:S³%Ðãdrç$yÜ$xà _Pú±³¤šbã›,É":/J3˜Ý|:·ÅÐ“ašŒžaÒDQ~(ý9Ô»ÜÄyƒ:¥Æ4bN>EÓdÉ!}ËO5JÏ
O|ðÕÎlå”Ã
»ãÆîëéõÏ‹J'’^™^r2wŠ=›/×Û­íÚ>?•TKÐg¾ò?Ù²<yr€Ó£E<§¥z³˜ôSX½ ÛÄbE%ùrÏlÙ–³· q×xLRWýÀÕÜÉºÁgÅÞÒWD‘ëL%AVØjCK¤ÈWƒa%NçFZVsdØ;­¬Ã¿çtdjdÁñ$x$výh&WäpýhdnÕ‡ÓB³—óx6ûstÝ…=‹ù£Û,¹˜òÏÖ²±JÛh8‰p¡Å­Í-nív(
;[Òµ±mòÛõñû³>ÎñåÒÝü82¶t°-nl3$¶¶…†NøGZ mö¾Ža;ðçÿPs]«¹`»,ÉíÐø#KÔ6ÀwF “ÉÀ¡ãHdwÔ(ÿèt!™â¾sÜP‰œoÄ}—ªsyHNU×Îr<¬r\ì³—
ŸŸr£’ÝwØqÈiaÞWÝÊ¬	œZ;å|Ä¥ß(èÁÃœÐ+Ó6 ïÓÉUz½ÀLlÑ	˜(<Æ4‹š—ª‡Œ‡°·eÝ¨]læ·Jø]§¶ÿK2—]v¹ŽÛoo[®²ö¡ÛÚjµCVPÖmã°ÁÎ‹±F]ýô]´0Á˜çQmÿäôàðõKn-dã§Îåävý¸¾C„¨¬¶¹yÞj“rˆ-½£MÔÒv¿a§Zû¥Ç‰ãß1&€Ù©Ø“ŽàLÞ´ßþäË,®Ø/–À@)LL÷mÔn9¹áM†e'7S„¯êBã0® àæç}"Ú¸4Û´µ±í‘U«ÉÙ~ÂLO¨Uk¸él
›’[´l‰ô'LA½Yð‹±«ÛnÔfEÝÖz†ê›{XÁjCS©l‰›î<ÉF¸zVªªúdšC¬æöj5½_Ùž<GÃ^T_F<,°ñ¯½ˆÅCG÷–_ìi¾ä¿Jþ«mæ,éw\%yD9èOÓ1PZ`2²‘E˜ðsÁÂÝÿs°`>üp«Rý÷èˆŠ§‹0rÓÉ {¤N0ÃwÉíÚHò{5{Ñ°z•È:D kb6Ÿ^Ï“ßÄù°l»®Ú‹Ö#»âùÍ¨Ó0+K`GŽU²òo£zê¿ôÒXôÏÿ³ˆE¦T1uê
›é¼nÖù-›J•;_^6³=Ò,nÓ	ÐºÖ<ùïôž­è÷«yŒþ±0¶²¶Þ˜ã¦x¤ÓT^¤jMBƒ¡ùáõñtod=#+—Î¹ô^Ü3—W³»¿´0Eh¡6`óîë«ÿuò!	Ÿï%.Õ9Ç¶Ûkª™è€zÎ6–ëEÏù¾`Í{Ñ	h‚Ù©ºtv®UöL=Ž•®ìnÎò±?R§“dþ.¹beáËî§o^¿H?¼¡l¾_ÇÎé>çLU=îö‘vîúíì_ùPšêÓÏ³dÒd2ò·ñ
’’¢¯8ÐyþÿUüz°„Ò4Zôèkóš^Á®Ëýú™á¤ÍêtJ¯‡³œâ5ÀíàŽj«O(W›ƒ§­e0Yvð)s÷Ñ2²§mõ‡éh åÎR6öqáÜñ‰Ó÷)>ªïOýÝÆ¸´±b(Ôb6Ü× „Õ¨«¶Øõ¿§ƒ|7´¢t	‰S÷{½zþ˜>#‡5ª¸=£uÝ8™aÁ’%>O§ùPÙ…õ¸+sá±i±©Ê#Ó%œÙN¨]ËáþËÏ+G»ç^þÞßÄó„óU­‚ï"ÿÄh“ðHuÎ‚³\¬àö÷Ú=`:/@íAB	·Ž@yúÎª!ÍêX:¥ÇáÏ®g¶F „æC¸ýÝwîZ£RÕZ¹|íb¹†½§U)‡‡~éË÷;ã’3@ªž â~ñeV·‡]oÍåÃ.ÊvõmX‡æX‹gÌ°@k®Rý®’èî™×·„^—£ïˆ³ù¬O<f~JTòvÁ ‘ì]&±Šß`UæÓ=d—Æˆ-c\ˆ?š„Ü`^¥³ªgfõ—×öÒYŒ‹÷œƒJV”I`CîÛàœþ{)L"ƒB)†6±;'‹Åq’Ì?¤ýD‹QÒ¸¸AƒƒWÇÚ)]u“Ø¼“ß–_l´òa2©Ã Ø¥êÈ7ß ~Dã–õï˜5ÝX\Ö´ÕEA›6 ÛyXOæs½QôŒ¾KõšiÞ?Ä{¢Ô\v„64Œ„†*Ä’ò	`Kc8‰=	\8Ï´1zf’ºf0bÑº|MâX¾Y¨›˜jµkr'Ôz•ú†ˆžEúª×oÑ4õ`Ü¥kMµŒ›p¥©¶…y+þHë¹ç¾n¨×ŒP0"þXo7£×/yùú„R²3B0Â)Q—é„Ô~m¶ ôÁ†šN	áåÕtþC¼ ù–U{æ¶þ]Ô9†o…ã*u.
tœ9ÅÁÒrºG£©C ÜgR·T:mxu}êþz´Ù§J<f¼9èÜùæ þÃ†¡…w	,¥¬¢7Éxê	žSa’îues2½E4¹ÅÀc.{Sèã	k%ÚäÒÉcƒ§ºßÃŸ}âµ¿­¯ÛÒÇ@¯šÁèÅW@øþ‘Äóz£ñKôÐÝõè7]_dm¶f‹l¨	ewðl/XUÉÛô¿ÏëU7Gñe2Â›ù
;ÆÑ¯j„~c)ê¨¦“ëUßAxë^2+m8o™>X7·3ýDñ!žÜ5žáB»œzs+ Tõ™ÁG4½*#‚¯~ÂÆ“ç.¹N9Ì:i/Q¿\}µknÁ¬¾Œâæ6½Í£üSÐƒ¦2‰’-Ý>ÇÙÀNb)s†¬‚45zI>Wß?2Ê‘eæ‹IE}Œ}·î¨1ô£ fïŒ[cV/^¤ ¯MgHüßpßÁ¬™p˜yë8ÇÙâ‘ÀiÎáT¼Çœ©°n
öá’wƒQÐk0lôn”Xb~v›BÏ¢º¦Âj»­ŠíîÑÃùtòOÁ»¡‹sLyÎ\†j{þâñ«ÍnM×câ>R©¢—ñà:9¼†»tÌÉJœ£ñŸ=¶wv¶Î‡Ðô*ž‘~ÂxÈÁ¹üÐµ`áþ{ý-;ô–'éèC2_á-Ÿnl>)zË­ÇÛÛ;OÃo©ŒÝ&Uð¥ÉSÚ¬¯{uÕ@ÔÀ@ti ~˜Ž+Ãá“';íÃ¢axñôñãöNxbz¥S(ûõ¸`DùMùÂìR‡ío·IowŒòÈÙ+¼¡g­7ì¼ì>Ý<\q¢ŸT™èßDï´Ø	\ó^/X¸áAr/Fyo…QHºÉ“«vÑ(´“x;)Zî7wÊõ¾ÿ+ÝoAkØsÍ4Y7£ñ5óœŽ^£[à¬ë–y™Ñðž(€–ìéÂÔÇ¤pO,—XR]L3@-‚‹ëø´2.TÑ Ä“ÄÊJæ²ªÆÎé&¯]2%ÏÛ‰ëeÔÈèHOÀ±`V4x‚" 4ÿ“­'4\†9²îHÙªÍÎvÛ§˜õGÀÔEÕÔš4ƒ»"»ÎUS‡ç7‡×R;Öù-ª‹‡×e¸ÎŽ$Ok:@Ey1@Ÿ×¯ç0¶Ð¿zgs{\7#Î/ác“*¿w˜7gwmãéV¼yù¾0Š(Û0X'ç$mãÙÉ%6ötg»³-ÛÐ¸§æm¡“ ±ÆÚÝöNç±lÁâAù	ÍX$Èt4;žOs‚×"{Jr{Kü÷žùÀî1cDt,q4¤ó‚ë¢Vä
Ð1Î÷+ºX. üè
µ¶št‚CÁÒjúsº—SÃžEO)tVÛr¢j-¿kÑ…Øäõ|º~©áIg¸×ö–æÞ«ËÓ[ÍcãÛèÇd>¸#FrÌ’d ”M›ê„OKUa@Kt¼ÛÁwy²Bd¢æUäòc8Þí0O¸î·Sà¢%|Ñþ¹îœ‹0â,‡{	 ³Þq|í¿¨[™î;dz…ÈêMÇÐv©c¨ëŽð€&’U¼JÈ¦ÇýÝÆ…¥/#f½‘ç Vâ“àzª¾ˆ8Jó?ÊÆÒý]qY:®ÞÙ‡kXíƒ|¸WÛ9&¸’öjÝüø&·‡Ó{µ6ìúî“vÔyWµÒ”jŽ¤rã~H³ôr”xe’«Ìã&ÈÈå|#Gé  å¸‰ëµèc:óÿÕ¢;þ÷cw¯R^éÒ_ÜÃ.$³ˆq°ÇðÉ§{µ¿½|µŸ f›ùè¶óìÁáfûI¥gY/õ‡»ÝçÛÛ/ýøæ€xJ0áŠFêF†b¯?Ž„øÂçµ³…?ÄÄÒ/ow¯XžY–Æ“CØ¤ÐÕÁ‹äCJ”v¯¶SCÓ:0¾½náÐ+_%Ï§ãÙ4Ã½šÂc'ÓÅ¼ŸÀkÌ†i¿—ºâùé,¡x‹½.šÀ(°—ôx(yV‘õ·Þ¡äÈÑÁ¼ïI3´;‹Ð;Ã˜¾‰@‹„±Š¢lüÿ×‰ºÛt½æ>íÕÅÚ½™åóéîéëË¸ÞÝÞnFêŸv‹šÀ3ç³Ø–xk¥Ï r|U§˜3²ž‘ú–‚ÌŸ†EuB;šÆM®‹ týh’ ›HH0÷&8~÷A]ÌGõ¿yèEù >yè FB,‚ÒÚt1:59‡ã5ûz|(ñ£ÉZzYÍ„¿&xß£!ù«ÓzR(‰î”‰œùlköñÜ~›'¡.vŠª$£Àûë­‰o´¿È¬û§qÜ²è›èu:Nóèè±h]ÀíÏô‹Ó!Ìò´­Ì3Ë”ðmïYgzet‚ny¾ÄnÄé‰o>alœæùxw‡qqºPL/·‘^³Öõ… àˆ|±Û&®ØA6Ï¬Vü×n=Æ:'×§¦Ï|„ÑƒIˆœ+E°ßÞÝÀkˆ,ŒPç·<ª3½¸Ò=ÚÂF©»ÅGéqk‹S·Ûê~î‘ê°‘Â¿l¤„=û!Co»Òà´qtP£¯26´LîøBú(ÖÍ_HŸuTXÍlñQyµýôeûpÕQƒ>‹R1¾é*#Ó¥‘–ˆ*£ÓÝêÚÛk{ësï¯ÿ  ÿÿ ®G¿°xœì½írÛÈÑ0úßW1Ë8µKR$õaK–ä¢dy­X’IÎ&Qô¬!"±"	. Zâ*¬zœªSïŸs§êT{®à\Âéî™f€ ”íÝd3Y‹æ³§§§¿¦;rï#v¿Sio4+l¶Si­­UØ7îTþpÐ>xþw‡Nž8#w§AñúåæäþŠÝøã¨~=tº·†;ãîÀv*aäQe·Ýü)Ú^Á»O˜òÙ^	?öwŸhÏV¾e‡ã±°ó‰ëöü‘Á÷}èÀGìÛ•¹ÞBÏû¨ŽÉ¹ýá4rYäOê—­önèÞÓ?õ®?d^äŽÂzZƒvš†‘w3“?iJü{E*tNœqvþÏ’ùûÃ›N&nÐuBA àðÆýú×sÃˆ·}7€îWž5Ùä¾¾ªvÇ†®ÓÃÒcìVv/Î:'ç·ç‡l•í½?êœ°‹ƒ³ÎÛ7‡g 3G¹Áµï‡ÊÒ(#Ðzc#(™7òúƒ(3{ÆÎ&l»3öFNäööý)ú£3œº;ÝiÀ,ŽÜîðp|ã7"?r†s¶’¦aðÛ+°†ê#ñ@y‚8q>½Ž¼hè²ö_ÐO#Òø B¦¹Špß`¿Ô[ÍÔ·­L=z†•%P)`­ìüõàˆe2†V*ï±}h£º<ß^´Rc˜dÑ«Õ,Ä¯Ëf£íŽ®tË,`jL=ØÛŒ†{Þºã~4`uÖb/Y5³òÛYd`ìí4pÆ}âÍÜáÐ¿«¯6a€77~ x³O#èÎª¼ÛËìˆ¾c­«ÆÈÃPÌ8…`#bC§ï±[—=ä7†€Ÿgg”ÁÌe¶e˜y¥3î9 Ø¡3`#º3q<Ø;Ð<"€~ßû†ýÿ÷ÿõ¿+éöRtjeb@ñÔÏäw
‹i+™ñ}àLlß	z›àº/v} Û¶çö±¯ý ÷ÿS‡°«aS4YÏ	n·´§Ïái8pz°žPoÛ6üsÿ ™ÈûèÂŽj79&•¨)åY«™ÙtÙy¶ëYÊ›*Fô\Rîk7ºsÝ±NÖap«–n0©ëÖgõ–¡,’„µb‡£AÍp†¬œ¼b·ï¦Ÿ	X3Œ2MÅcóùó\?ù˜.ÿðºµÞi¯]1X{7ª[_o¦]<O¯ºx¼Ùl®¬ãÿ‘d¶ÙdVo6Öcº™‡9g>ë3×­¹–³Ë4ßôRêíçìŽ÷[ÍË{æ†B"¿àxÈEÀˆ¢ð2Íæ+là"Å¿ŒkÞ	\g \À$rv`Ñê1´6_Áƒ99Aßï<< ‹±ÅÖk,À6·X«YƒyßÀ7øríG‘?‚¯l>7õƒtoBó+x9„±;ìðž‡l×Û© ïâH/2˜áÆ¯°ûÖN¹5þç¾ÍÁ3NKT‚±3ÿæ&të |° «ÇQ‡?{;Ä‹f;pÆ¬Ï3TÓÖäf¹6ín¯è°ÀpÅÄí¿uî½YÚÇÅ}ë;t®ÝaÅV,Œÿ°ï›kÕ½çÖr¸ÿÎ½_€z>·•‰¼îíLjçáÆ†®µœÃVË‹Y ·ý÷¼I/>›g¿Îlxs¯‰I ò½óPÆr™íì"ƒÉvw`oÑ¸“Oé%pâÙ20¯½{·Wm-Ï?À1®ÔÉTHJ7—çoEéÅ@|áûÃÈ›Ø&Üå’Êy4ºH%¬;æHfŸè)m’-V	ú×Nµ¥½Zckík66×—+µœ6ˆdCÕÖäžäãõ˜¡‘f™FÎ`£MCl*pG•šµtWö7779Å$aƒÀÂ”üÁå4´‚<nNÙ‰ÓÃs
Â±ÇZmhØRvnÃ´Ë¦0Bg<#d»ü ¼êÓ4³z2]»/»¼<ÿPc•=`{Æ?9•+['DUbèªëÛ^_¯ÉÿàDÅ•áGÊž82*8+ÛømH‰Ç–u«Î&°éGþØð8.$‰Äh“DIÒsËý@§ïC»±n]o8ŒO„–•Žp5Ä4Vÿ`:—-ã0Âk{%>åMÜ—‹°°,i˜rb†3¶=ÜÏ<6v%àriqàŽÒR+5™bx€É^c}¬‹ÿ æ"ñµïLêmÃÉžæS#gR­ŽjÀ9ÜngeÑå-,ù”šÛÄfèPú‚»Íð“1Ó»²a‘#à……+1‰¾›ºä«0Ökf{Õð¬Ï,L*ÉÈÑFÁä:”ÝFÚ·ó”°–?JU@71à…zþ1HÉ#)òZxã -ÂÃr¦CÁ’š¾ëØŸØ[w:Ž¦ã>ˆ%¿…j@At	½ÈóÇuä„Þ4pèÇzóÂ)MU×8ù7¸}Y7;ÙG
©k(\e9õ/ yþùàäðœë{LR§M¸l¬6áåšÍõƒŽÐ¬j“BÕB"ZY'	¶È­RdVùÊØ÷nÍ“z‡ý÷ÿù”W,fõ•¸ÌñØ[l}vÆm\Ì¬âBè¦81&µd"Ç™ùß‚³vº„Ï;Ì¡/\•µ³³Ã¼Ö:ï4ûŠþjgÕa–62VV1¤À–L&°"tvE¸ç=7®5t{ÌãFð¡£9Ì´4tap0FjnA
«T²cÀ‚×}>óXæ5õnXÕ£¹4—Pd†Îî¿zözµ}eh“;¿	üQR¤}øÑYÖÚX3µ1g.ˆ7ÊðZ/>×^rÂðøc™áµžƒ,0’ÑÅ†'ÔÀë||¼‘Üñ-1sk…{ÎGÄ-V†Ñ¤9;M4Æf6êz
œûØxJsîÊ|‚Ã´† ö‚B$!ìþpxáÓn­z–c?M™Ìf-¢Â@qémvpD;¡R…Û|äÁi’Ÿl
+0>|ˆÏÞ»z«ÍøFÜ³‡CÚÚf9®‘•{jBüÄÒ*$‚ÌçO_¬|×9€öÒ(1Wía‚µöaœ! ­&«Óø_„òÏ§6ÿ“0xô“+¾êíöa¡t«ðÎœÅé«™Ïà"3;ð?‚¸×ŠY¥ÔógÍÇñæÆ±Ï?X4˜¨á¬ Š°ÝÖÕÅ¥¯ÈÜ¦—8^Ë—l)YŒ% •¾éa6É×p€ñÏƒáXüÓŸŒXL&ÍÅ¶ä:“[¬NŠ^ÜNˆØƒú* Äþ›£i55Ëm¨u:[ã>¼1íMÑ4í¡íÖö,q„ÚtDŸKÍõg0 ³f=wñöU»Ö:S¦wK}°Ä¾ƒâiM(ÿ½Uæ1
7¦é=|0º'ØÅA_9;³(=z©L6ÉÀã$Ù…wç1g(§}’½™³i¶G>¨'ƒu¥‡ÎNžÃ`>5ÈiœrˆÝ~`Sà1óVä†:ÜîêÏñÔÉl„4ª~Ùü±=¹ÿñ9üÇUpk­Úf³¶ºA
¸+ûœ {Ïl‚êÌp‚¿Rcx–ÝŒÝ0Üb°d5X³Ñ„”“«M»úÑBÆŒ¿½Â9ƒ8ŸæYæ{³Eöñ>¶I=bkGÙóã¹íü€£Y}­‚SÌô{~çMœk¥9!ÞsÇî…,±ÓG”šeàÞì<p>)®xæÞ¤açÏ©ÌÎÃÀ÷†.ÿ•.•æ¤ð½Avõ¾îL#Ÿx¨ç,ÃŸ{þg­!ÊÎØ¸mjôÚ	X}„>%d£OuZ qmRn±%dÊ–JúQøNŒ‹ÔÉqÉôúë³û‚è‘ß½Q„F¶›'íÂè¾?š€@'ªn—©º·(-5•å]ÂtÖÃlÑÛz“/›ÅŸKiÎà°f=Ô	Ý¡ÛÅ)rtFÿƒJ×Ö‡1–z"®S[ìº¬~lböz(šjž¥Ø¨óÔUQöµ„ÆííÁû“‹÷'ßwNÔã*ã)eÑÇZG˜q›Rú]_àÈÍë6>`GW® xc`ÈP 9Ÿ9À<l±ÿþßÿ/3•DMo¼<G#d\¾ ,«[_;÷Ð”	LyPÌá¬èµ	ƒS¢§;îq¹3jÊ*ÐŒžrùŒ:hÏéõÝ”z9ÑKÆòPòHötÑ(QT¶õEü.žlkB6ËøÚØ`T§àBÂQ:1AMÐç,ò+4û¼Ö,´Xƒ˜¸?Î	zÜ¶2Ê¦mò72P¶güÅ'¬@!Ü/Üàv:îz_êÉÑø8À»#7p†½º‡ü•÷å›ôa!Ÿoþ*@%É/Ô\ªe¶ÑÊžâ‚eõ§ÝßÐ³.æJ‹–4ïÐôîZ0¼œ¿ë¬M¸ÄÏÊ
{…>ðp ¸œ£L”ðh¸ìCšStë¼¿C`Ñ€)Û¾ð`óG:ó$”6;&å7)aCØë£&VÑƒµ·jEºNÐE>‰[%Êéå‡3¥XáÈ¿s±¶°ô„³yMä¼BuzÜvÃw‡SØ&ÕJä\“Y´²lÖ²'ŸÔÊœzýþlÏßZGnàb°³ÐúâùumpW×‚bq0È‚â„ÞÂ0º ~›ï'V %–†…A$-Pž™£4x&¾·8öìC¥Ð
aŒyTbCÎãÁ¢tÿ	pqz#û×¿˜éu5váâÛŽ*4Ù@×9ãÇŽj~
Øâ®sf;åðçÇ±uäº0q€©¦ùl|Ï€ùÓ(ñløC7„ep‚EÃ¼³…S×î4z7…)Ë§×è…Y¦Ó
Û*`²Ÿt{-joíÙúúÆæçh¯Mímnn¬·ÖÓ^åÍvs£õ–(§nŽJ#ù˜”^éOâ°UPÐh«Stac‚ÅÏ8æûsÌõ„à•XÓòL|±Âmàõzî˜ÁÎ®ê—›$º?M„XiêØà
ôJ¾¤k³`&äþŽÜ›ˆ»]ÈÕ‚	äºœê³æ—s8Aù1ÉÅ ñMÈd¢o tŒ/&A}mq$Û<ˆˆ½ñ‡&µn‰1£Å®ÕBEz¢I‡…|ú“²y±%W×ºÅÈ&ðÀ£ëœéåÖQŒ$•u¼[Ôl¬ÛÚì2^bÞù*ù)s)9ôÜÈñ†ácà^Rý×¶Ø·ž©Z6éMÞ|ú:fæúEÐë!ì¸r°gì¯ïÞï¿98câÊ£U{Wfr…ÖË¸¤I××JA@Î)Oû¥<åÐü	ÍŽÌ¾µ¦D½r³ËU_ÆÅJÝ/þ¼^°pzÓš—œõžÛ)ª¿‘3ž9ì¿ÿ×ÿÃÎÿôV¾ùŒk]j»æËøòƒ;V’÷×	¬V0C©M«ø¼¬’Å’üÂŸ°Ðyõ®tAº~ªŽÙcˆŠî³Ð¦iõÖJ[uf¹§wpà?Ýzj³8 Ôlöƒt:1ve.¶èâ<Ç—#ù”‚Ü_ñn×²WN8@kªH6`;àÄ¿ Äî10z¼í´²Ò¬©¬|¶¹ñë _ 1„ý±¸a0	ÿº¸Q~ÏŸÑ…‹,‹×áª«còîêí5õ*RË‡˜ Û´êýŠ4¾0ÛeˆŠÂ:çËæ	9–<-¶q:à8Z=Òÿ¥ÌÖ¢~K^”¶Z+u°Vv9ÌàeÊ1¤æÈ†æ¾Ð*š¡™ö«2F;!Ú'ï±Ä„¹O®KT!½èar5=åtVRt{Ô9<.7ùÒ‹iÔF†A$¦¥!œ°t\f*=ýÓÎÛÎ!;?xÛ9ëœ|ÿ™áP©‰ni*ÿÊsúþ˜ 8¦A¬ÞhXäÞÜ áy×B5H¯èÙ+"…c&’¿Ô×9óÌÿÖzxë¢Q«ÍR.È #£û98hòf=G„ki‘7ºúN*<àÅãrRçŠ‰ï0I¼ÉY@×"Çî‘v(+Õªõ•íVÚ¿©›ˆobñe;ŠŠf8_÷ál÷ÛŽÐr(92®l±ó?wQ;òžl,,òT+tZC·ŠÐêhF ‚8”öç$4ñ^CšÜ¶jì2¨¥¢´dŽ“_U–Á‚1Àô{§I “B…Ôâ‘NR:,u×‰+M³S»9ŽúžÛm1±‹ªqÛÀ˜b[!_:zÍ}øÈ;„¨I©ì¾ê¼¾èœ±Óƒ#87ÈeKÄ^R4êW–PW†87_òÖ/?¹_ˆŸ£Ã7vÒ9ïìuÞ°W‡B·uxrh¤iµŽ9–M™ 7Ü›ùyÆ›9¾0² ÎéìU×ö–öbý£Ó6ß¸ÌÅ2mê¨ç·¹Þê wØc®>§«":*r~ÅŸ|Ýe˜
í ÈÄºº.A?`°MýD9õ'@·ý°7Zc"ßià†î¸«ùÏ€ôGÞMà4@?£ªÁÅ„[îFXî‚ì°¾Q=ò3N»D?
¼S*V»ò	še/¯–7Þ2~ŽÝ§4gØâêÉÖÈõ­J8äÐ)Ö˜¬ß ˆ9Ë‰Ï êh},‹¨v)£œÅ—9¼0Fã¬*1.7á£ÝwFwÇp´•+ê£òhË|èMêþÄÈ¥*—+Ô=M=gˆ:Á+ò`S†¢‚iÔŠ¶ÌEÝ{/*Ódúê¢&HW¥H?FþÑÄfK âF &©‰0ðd çd¦­4c&AÊ÷ŠýZÁBQôVX;¨$HÚÊ¿j_-i?×î´×,½šUÖt¦Œœûúà¨Lþ°E‡< €Æ¶´*ŠËgm›ˆÛsB}ŒÑ ¬€ø®Ë
Ã´­0»ü¦ó[%É 
F°’âŽYxˆ@ükoèþgÑÐÀŒÒåÖä,n+@à7F( ÌZÚ,žá(E8‰r(fù1FÉëf¦¼£=(fÎ)Êl!sR6fa}§•ÉVÎ"öRrÒ5ÅË&Oßœï\šï.oà½‡}£ºL	!Ë§¼©íVöNõ1ÐŠ•å¶2ÙbHÖK‹÷îŽ™÷ÊîN0>èÂyìÈŸ9Ãh–c}Œf!ÿúýãO*üqçÅÜufVaO“{ÚFÿxe³®|g®ªšo0ZÁü7ƒRÞªL²_BÌSÒq»fDG1r‰{ÎØvB_Q`œúª•Ú,v`Pí4*t¥=r{Þtôè‹E8ñ¾ÞÊÓ°fBÁÃén‰A¬WQ4Ïòöáéƒ™*Î[ëj…„Óz=Î $Ì“‰ZpÌ6ù|³E…%ÐFú«l›Iš·Ÿ!g#\xì^#Û½.Þ}uÅH¸Ü†JBýÔÚ@ñw#G£k ßú²k¦»â£üÉ¸{ìŽ¦ƒË&rý†=<šHÛMXyçèÃ`æ&jQ¦\ú”æ„rÈ‰Û¦ýhŒ€»(îus-.{îÈƒÓS`Çz2x8ÈöÁçñùÆ@ëbúõËÕu:òcözÆ×I€×Ôä•äz4ðl4‘2+C·ZP\/w¥%ñ“›´ª¬V€kò=ªK9Ü–s¹N·Ô³×C-GÿÛ÷Ü7ÔpÌ•ÖÈ›>r»—0ÝeNˆ%Œñ
ŸÌmscmlR³u³~³¹TXÑ(A~JxŠ•’qò.iÙÛ2š"Òž¬ŸY3«ÞŽ*éH˜ùÚ‡­\Îãƒ¦êú,º;Ií9]üÆfº`/l þõOnˆ*Â¢‚Ü pƒSÈâl§2öëòQi·²~4ö4G”6Œ9èJv*áŒitNÐ‰ªPzAoWšÀŽ%]hKÙÝ‹$W­ä$Â¥<Ø\*é›cz¤ßÐîá«-&‰÷Éid\¡èKõ¥²C,	ë²ÅLÌJ,öBË® ™…ÎáÛÐcÕU¶7/—…WïºÈ^5ÄÉÕ¸ˆ$ML‰¡-âcœW$—±{Rñz¶z%5uäÆ …/E›…Õ%ÂT$Ê‰…R¤}ÁÏ§h`ð“ÊƒC^
x»F§G€PÊ	b™ôÃY=ŒM­i]RŠÜ+\	'ü6×•HÖùä!ÒÅ4šNrpÅ®ˆáï×ž ¿½’XGJN5ÔŸ/«'àöŠÅJ™íb{å4ð#
©sêðp ÐðüÅ“'ä¿rb{?ön<·wUoP­B4²µ^oƒÍ¡Â¡DDÜ‡ê#`Ýw×?m±Wð…ÊueéšGñ_b@üåmú1˜b+ô5¾¦¼D1´Ö´R“7Á±¨j=¶Ø˜Rà“kŒrpØ¥£‡I”CõUàÜCI¹	 *T  ° r“ 11DlAþô?bkþøÈï{0Äª^„§Øð½Š­¸ÉûË+|;–‡‚»p®¡‰ÞZõ±2,hÂ°Z¼µé8pž@NÐ¶_g8ì„gðzÑÚÆjK‡½X¼Q|Œõeeãˆ\êLMØ|µZ5&µjé×ô©ÕÒSª™§QKþÉ|Ë¼À±LÍç0v>z}@g;ûDüâV{^â2œ^ã@qØçôõŠ> äv…þoà¦T&?ò+»Uõ¹Öšˆx¥Ž·mx¡õdÚ·5w«ø¯©—SÖ<=ÑÚ…amç£z×C—/6óWåÚJµÝTëM0ÌFÊ¹Æ?µžµŠ‹ìrá‰‹Ãî¼1ì›¶„ÇÒ7v{Kè±¤V_bÞX–}©­|#FKÐ‚3FKœ2>¡kÝÔÝîÏSºÇøw!]ÅJ¦´ÿ'ªÄý€¼c5×ºrÿØÁ'î±Û<PsÏD½£3Ma¤5 f˜@º
B× xl9«jÒÖÊ¤Ø3!¯ŠÃé« øµ”ÿŒÝ;mxÕŠbäªÔŒz¯k¿‡æÿ“xk±Ð¼3 ~ø9d=Ï¹…—·ÎøcúŒ‡-¢hn­¬«¾ï÷‡.-‘r¨ÑõG+½•Öÿ¸iÞÜŒ7‡ç{ï6Ü¨ïƒŸÆ‡ÿËZ»÷|ã®û1ËœÌ³Ž¸Z¦;`U×Jw‹?twN óß3a^ˆ}§ÌÁÐnoÀãf»zbû5_nÐ(ªn˜]˜’AäcÌfŠvVhÄF¤8—äW2w(¤ujï’uNiª!ÈO~€¾Á ¯{8ù±hà…<7ð ™ÈYó¿øï¼†žTr§Ÿ…nep,ñîî ÿ×¹fÝúà…Ö]¢}’Þaóü€H:ñë\¡	¦hHîXx¶ñmžK<x{D5´SDhbùlŸH8FLÎ‰g°¦6ÆyŸº>þ†2D±ïÄ@|ŒÇD_=¿;!þË/C—~ó2¢fó©Ë™†Ì$p?âŽh€ÑöøƒïX»YÓza‡XŽ×O¬šð4tz½ƒÙN@±ZáÃµW'.‘Êj‚h!pG r”n—Ô4N8ÉÔ…æ°ï»Ñ¾ˆu„9oþœ-Vø&Awí|À41½%'°$Rc-½ÐÊÅìuRðB>ÒK
Þ;)÷†?ÐK%lyRðPcÕñ#Nš¤È‘¸4“ƒ£mf†	%“ù>`rÂ·mÄáÛÔ¸mÅ „&ÑÅ©ïÇ-ŠŸJƒâI¶½ ¡µÀÝ¸-ú¡´D¿³í˜–ššLƒÉ0iLüTšOÔ3ëU:^þ†EÁUNÇaÁb‰Éw‡]R‰˜8|Ñ’Ç´
+¯ü)8>õÚ_LazÎ½qýy
Âpr¼ËØmPõôìÝñ»óÃøŠ•ðøít4™'`xƒ	œb½©Ãn¡zâDs0Ý"5óœ	W|Š(ßCŒ(Ún60"ÐÄ~:v°ÁNÎ8UFÛ;9dkh›T™»˜Þ¬dß#wè&Î€‚SÂø(éSèŽ®[Ÿñ¨KÉÌ ß¾[–[Ù{Û¾ûþÙÏáßûžýmuvt»¶×ûÞ«üt{=éÆ­FæýÛwÂªÎ	,eRB‘”N>çFC.wWhF|}Î]øê k¥Vp‹¥}¥U™ˆ¯aÎç°’&ýµz´ÓèA{å…·p|*	GÒÙ©X¶à_ ;N¼[t%€õ‰|Z‰¨ßq!C÷ÚaÊØKu„X!¢E±,P'ÁàŠ#gäˆEÖBÃž	.<F¬³¿œž3'r¦ìP}Ì^íFˆ[Ç¡ÄÏÍŸ/þvx~ôñÝñþ_Æk7«Ç‹ÎhÏ_÷Âz
%$L5ðI„à±]Íq<:ž\‹QA »&¬¦1aÏ½vB¶çYã™:¢“ê@×t 5X ŽœÛ)®J²Žj{òœeÇà_ly…D¬79@ô¥‡.Ðl½+7ž´‘6ÿØCð]Ó<(.ÊÀ!4O$£ÃéÇütô®éþéÙÍŸÏÖoîVŸü–w8u§¿ül#ÈÅèÁ@-ÏÂË`0øÌòÃ¿W:K!³Úö.<ºfQEuäyH†¢¦(0kRï÷2IJÊG ìy«Á^{KžwþþÀ…©»÷0f.p¹½áDÀTÛ°F£	Ý9eçÓ‰ƒCQ"öÉRMeð„ÃŸ)L¹h¦ƒ‡žLCiû_ÿ2=þ‘šSßÝ<;ÕždŠü€E^ÄâCÜ³ÂKÑ0<JÝ¨¾UJIÈcÝo¼ðÄ9©ö p„suyµÊo¶«'"ˆ?Å£‚oðêüsZø:qzçº«Ú®±¥æ’"±‰4Þx¹qÇügÙ6›óáéc¾õôA48ÿ ã•¦Q–u–²“‹FèR#7F$J¯üóúŸ½‡ö|‹þýçõŠ2êc$å5¨Ù¼Jã·ÄÆv¯»úãž‚Ž÷h2äøÇQOà:¶<!#@/·x•^l¬ËÃîÈÚÆ‘WùŸå—êh² rFòL¬R]¼ue#+É$&/xðÉì‹èQ'¨+g¬Ü€ºY¥Ã§`êçÁÕrØšÕdH|Yêå {ž 7 P+TêŽÃ 	¸òž*Wêõ­z"_Î¥’â{ºÉ¬É¹ìzFë‘P],£kœC®¿=‘ZÓ[ÄdšÚEaÍd¤Býîß©+ÃI^“ë93õ=G¿ž‡w ºŒzD{•ß¼¹t{N ^¥Ñ	Æ˜nXy7®<3vÐónnÇÇ$»B6ëJïÉcSõWÎ õ	™b«q³+¬JÙØ¿e«ô§½¶¼üBÛhJ<·£Ä€·¨¼°o%Åßº#¨0ŽKkõ'Â:u8Ž†œN‡ŸÐï&OØëÞ¶ØÒXë% þOA:÷ºð{„M^Ï öÊ{ÄVmÏHøcÌi´¿â” ÷Ü’×«¾‚6ÄØh¥2IAè°8Œž]<¶rÏ3‹ÅÍ/Ñtqy¥hß`½®›ÚE‘ÏT³‰Ò½xœÞOº²)Ä&‘”ª,+ÝšZiÜøÁÄÚÊî³¡ØÚå…¨)\tï°p:±£‚®qãRö±—~C´ÈCß´#DkC%ÆÚ‹Á½1™†bøÉ’Nf©‚Ê‹5¬ÉµãŠ»+E-è§Ü%‘”†Œ*?úiÆÉd¿ 6âSÕZé“uû|àS¶Ø=§ozß1×)§Õ[™¦€s#'\½%"º®åÊ4º¸=/¢´Õ¶†¥,Ûª¢óÊ4\"<y¢S›–Ú¯L‹  ‚õ›ô_Z`~ƒ®±a¯ÿ…ðaI) uw2` <²xŒ«JÔÔ½¢m•ýÇÙ/L(—2Ã¢E5@jSeïôÛØµT­jýòâ¦NsÐOW½ÊžÅcß‰Vë]VÑû·áh¦¶¼ÿó3ƒ6VsäÏ„Qˆð®ÆRà1lâ ("œt¶ŽoSñ²¦Ô^‘×½¡^Àœ.sÇ‚—§¡ìŒØ¤FØÙ\Ïö‡õî£ºµ­ªÁxMþ•ºltŠÏ&ŽM†…Ê%™böš]QÃU™ÇÀ]Ä5oAá¨û,f]¹‡Šî}¢†ÕÐÇ2Ì6÷Týþ”{­¥ÚäÅ'/të—Y–SÁ–2©B…at'eÍúq¾d-erX	±.¾%ô2N›$ÞP(gÕ»6ÓžƒÔto1I6¬GSQ.÷j­êÙS±URFO¾ÀyãßºõKXIPmƒ•Ì®Ê/DBUC.áÄ/C{ü øs¡úÈ”´É–;l¶tËõéÔŒŠ™ÍŒ-’ÑÆ®¥¦L´9@‹ƒ<¤£âlYq-íbL1«'íDjºÜ íf“+ë‚„‚û«ý>iŸÛÿòÍ¾RšBH}Iâ@v;2d±Wó‹Ö¯,SLà!â»ÊØ6*;‘ò‘Æ«Èã;žzý#‡,ªÉØo/*Õ~¼qÝÔÃ	Õ0hM+aÆOˆÊBd³Œ{¨¬ˆãämáÈ1jå<Ý`6êµVÏvmLÔjÅ¬“;Œõúp&v¤¤œYFIR g±ë}“øþ± 	i™ïZ.%â}qøGãÖòXð,ß_À…S6-êMÁÞ²e31È¶<Î†Üó@:‹‘8XÍ¦«Í½ã‘	ˆ8²•]~§»Ós–a{e°j‡!k®•©7Ëð¸1xF"SCNˆ N¡\#dÏñò¾bÑ$\Ce®w[“®52ñÆâ$·û“…4w§è–ÊB P»ë:°ë¨·oÖc’	Ó`º.b¸äi»µnŠiT†'3µ™¹EaØAxl!þÚâ7”-£9ú—&cŽ ]*}2Wš,!þ,SZ:ƒ<Ã†‰†l£Ñ(-
ým[¶ ‘ä5l¢°l8Éx£¥x³—UpËz“Šìêû”t¡
T‰<‰Æ‘äÜo¾@OlÅóiÏ°Wþæì¾%í¤/¿=˜¬_<@CŸë³‘ÎO¬Nå¸†|nÚ˜¶kéŠú„ŒU2Jsn¸³\Êe«E’Ô/pª<Z­BáæQ¥Âµ+iÅJé›#d¿ˆÂÙl™Ì:ÙÙ57Lš¶ž¶æÞG/ÎP"To~>u1HnSáœÚÜ&˜—v^ù4ÊõSë3&¾$„ð™˜ˆöâ9!ðÉÎ'šSž™Òë<³ &Ž´ÆÇQAFœ›¡ò£¯pý¿¾§ƒ”í°o×Ò¿nkóz9Wœ¥I<iA¸:¥½ŸDcâŠ¦ðª‡¶å7á”ÓU‰˜.ùÁ=“Q:9‚ü)-„¶²xrŸ¯üø§àµX6 Ï™s'¯bè‘ò0/ê!iâ×]´%ÚÄ¿~L˜ÆÔséI¨?æ&ÔÃ„§ÄÐ
KŸ8y4Ê
Ü![JÁ±fáz°ø¶dõÃ
ÏØWµWž>€Ð÷û³CLÎòé8ªr-Ï?.š’­6=¾$ô£(«Áò…{äøxå/8:%AôbŒ+š‡>§/)"	GÍåùËpàßÅ·G{;Ÿ:©Ü÷T%š„$ïR6ñC>Cü¨È¤qÖ?ñiR¸N)fbJÒ®ÇI±`FñWEy]ØÏËÓßdaØ„˜Dm¢EIÕ’‚+?QmAú–rq­„A$°(NëÄ'Ž&è©I¹cN‘˜	Â³¢R³fä©ÊŸ>¤”=¿<§Œ¿”Œ¿ÈŽÇù7Hµ+ß¬Ë›ë£‰"3qÝFë½ ¥³¡où#’ék–,—Ö©¢´DJâú]àL>)ç,O¸jVà×tŒ—RjN<²iQâB%ÛM/‹6¿dü4
xAãóæ«M@`QTO[w´tM)"³ƒ$–—xÆ@1t|¹àk%"Œ•f5±âKŒIÊá oŸèhRyUjl¹.´Œ­'IÍû+‹'”/e€T&èTŽ0]v*B\>wïCF<£kÚÜÁàþátz;ÅµH—›³÷> ˜?\p±M–‘b\Q*v—2û¥Š•¡ÃJæO G[¬Ca/
i²=[¼µ
!m!˜÷!^ÕŸ >žŽÂÂ˜«å±ÒE‹•¶äÉh^li¢fãÂ“…Î.Þ‘ñõ;W¥2%\þBí¢Àñ–yä¥çy1B¢c^¤¬äclqáN¢gÔMŸ»š{pYÛ	…ºV–Ÿf,‰=9>1øBi;Ë¢ZÖü`î¥cø§-"ÕŠÝï¹1Æ\œ¨0õêYŽ…e=ßÂ²nrŠùv”cÞn*j\väôÍºÜÇY?
Ë¥ÜŽL6m’Ìu¢ ‡“ß•ÿÄ*ZAÛ9Nq®c¦ŸF#Ržæ•´­TÕ¨m…Í1tß †‹TIuc‚*ƒ;˜LŒ-[o1¯ŽaaŽ5Å‰CäŒŒ²ò·Vâ¯LRWâpÙ-Ä›xégN$vî&Cºþ“ˆöxëÚœþ*›Ïc\·›ù.$>'m‰å™—Êì§Hƒ³á©ù.¬}© Õ6F3l{Š’"¾YaS2oÓB™Kò3 'FF)Q*©Ím(¾2DŸY ³IÁùXÈ 3«ûm;å|»hnÐx¶‘Ó_t¢v–Îà®´p’VÃDxV)5{+¥@«C_#{êwmg§aruÊË-UÂT•gÓ^OÊ˜m¨.ÆŒbºyÈå“´Ú¸ùå2LDìÏ™z+Þ éÐBÆ½"KJ&»§=·çƒ)gš‹_<“¥%ÁÍ}ÆK9àÓø’é(K¦¢,“†ÒÎhÑ)2hNBíOHC¹òiÐ©qõ5|kl¿Ö.°¸¦àË °To…Y#½)Á@Rd¤s@Ç³X@m¬™Ý›uÞMŽ‰‰”_ùÀs»û)è–mŒrèáçÒjøkK MƒFCY,ò'í>ºÊ¬³WJtN´\ŽÍò¹ãìÍßÓÂ	ú%ç$Ì3k8ÛÑSäÚ†³™Âèä«DBG¡ì®ì‰¶8c8PùÔ6šÙë+B¾+b‡ãH‰¡çŒÑï/¼rfUó ¸×’,!/•yÁî›(¹ÑL^¼60'0ìíG÷ç\ShÑB~ïŸÈQëïíÚ'Òæ£;2Yýþ<ADµÓ².ÄHªJj+lP½‘+Wû˜„öäf»Ù;×\zN(âvì‡Ÿö”è9á –}‹5×ù9uëUÂîCZƒËQŠÎa¤òiX}L†3‘³õg°ÄÆ7ßS3Le@È5Vä´€F÷Çx¶.â"ú?sâTñ	.}×&=:ÐàKÜ³æŸkåbþB.Ño]i±}ëF@)WØžx‘S mÛ}¢ü!rEmÕ¹Þxùm@k‹ÏU³ù!?“·yo—°½/ž‹ÔvqÌ‚PÛ{†kÉüóE‚;ƒCGÌî_þ¡·¹æ¶n´¿¥ìY@×t?-’Â†}ùMsÄ3i¦ï¹¥MP¥ÔEB£a€ížQ0,…M“*ZRÝ"bî>ZÏÂëU°-_5+ÿ#5+N8A»Êekc°<!\yjû<KlèÑ6fðÑß|aÃÏ#4@9û!µöšêgM¨~Ö¬ª¾]ÖÕòì÷¢ú‰áqíC…´‰èkÓŒE\-’½Ø¤Û€eÍEieJ3<ZKK_“ÄÊ»˜4'©¦Ùª‘By³ÉÉÆ2~&ÍM™P1om‘YÊjïJ["S‰MŸ¦Çû\V¶Ìøòô|N4[îsðþR:Í	,`\ÀÔ|Ìv6Óå‹Í¯,Ë‰q±LQ€äçÑ8“‰Z-px(yÙý™ž‹Äæ9fZ•ÅBr¤ƒé–b»NSªœ±wQá‘`só²%-ÍuèZ`•mwÌ«os¶Ô±˜Çø¯ZJ[nheQH32)âZ³¹¶¿¾¡‰k„m]¿ŒØFÇâÉ]ÙÐlª¶œ3?ç4Ò}²è§	dù­×3ïÎ™9Qœî“'ûñQº"vîu¯œÈasô¼3¦SÕël±s€|x‘<º¼RÚy¹Åªx¹ðÈ'¢?¯}(ð¸†*¸PQê¥Œ»
½È¼¦55 /—ZÉËá…î6¦5ÝeóTfÐÕ(Ìç:çqÏÄo5Ah™¢®t§NàŒB™Sy¤•uâÔ¨Zª=éh„Áq)ß(Ì±ë9cÌ8Êªmy!ï3D×xÆèä–¾“§Îù/S7˜‰ü¡ño­bÅ˜ÝTYH-û¨ò\›Pzõí‰MNàîûÏíñ†“ßÆù<±%Úãí!R]ÜÓ5nu0@{µB/“1öd–JÒ'j¦ó.Ü mÂøï
vó€Ùvá5qôØ{þ×¿è¡r[\}­ÅÓ¦¶Õ[¼ÞÇŽU.ßê™U ¤wµììJYžE/ïzæÞÀÔÏ\¨Ó °ÃÏí7ÇG¯¼"•`¼ qx—0Äì3ï¦˜*¥ú“;öBCôd^šhûŸ±”¥¢(8¢äïñ´‡Õ‰XxÛçnðÑëRÚ†ËÊEçìð-»xÒ9¬ÔXåôíü³wzrQ¹Òò¦*7B `ÕÿÂ±	 ªÃÂÅ`i“7²n„hH–-,§JÄÁ"ä{j~9ÉÛ €ì ×Ý{±,ùpê½4 MÌB–0ÂŠßé¦*é¾DvDÜeÐ—ÎÆ]–ÎWùa×[“UzÉÈ•yTM4Žù°)éý'è;\¹Ëš/´NŒRÌØÁ~¡NÔžPs@wUwØÄ	Bïö„ö~jÆNNÝ‘bî)óëdæ÷PÉ¿œ’il_2àÓ€Ð—¾7&ôo±ÅŠÙKõž½ycf+¼ôÏÑÌ“§Ž·´Äëù½ü1vðF\õlRFðx€Ëóå${O<·Ÿ€ûª.ýs¼$#úcHûÈœ¡L:RùSJ±|&ÒWÄeþ
pr‰ØçLH4Œ¨-±5!ºzWÔ	{c†åÄÉ2
ûR°ªÎZ éˆXÝI‡…¿\×2>¸vÂFèüáÛ“wvqÖ99ï¼=?d?tÎÞŸ|Ï.Þ~û¤ž÷yrøjK1U«Ý§ã¢˜Ëà›g«›W(;–ß­®\þW³¾yµÒ¯a Š$…F«½Œ×*EqÛÄëù“Øbk+)£]Tâ’ìýþù“c7òñ’¤¹K5)™Tà~¶
üí¼ Êß¾rnàP‘™÷¶¾}Â·WÈ…‹‚ÊO„>Ý´dZžûä‚0áý£^èUsíq6M-Íá7”]$8?h~)­ew0X+K®ªr«Èü‡ÉÓÄ%CíwIMúÂáV‚ÓÉ+%=ˆ’£ÚòR©§G×z“kß	z» €ŽTã®4‰XgS«Q0uÓïñ†°?•jªçek¬¹&•Q…éµiNÕÜÙz†•üõ(;ãüù>j¶¶¹Úgªðµj*ÚøˆÎðš5N:·@ð]£L;ˆ	åËäa³õhÕÂ‰®–Ç2+ÉðR‡·þNK×'˜Ñ‹¥”žú‡rP¾v]ÊbÑUåu¾£³*•)Èà¼ŒWåý,¬€xÎoq0Ô±[¢ÍyÍZ¼²wØù{3 VâJ«˜öJânœLa6•˜PÉ*dé óêøð$é"n(<(ff¨IÓ©9qAj"æsE¡‚ŽÏ×gôýÝéûSöªsÒI~½ûë»äÇ÷ïN;O~ž¿ywzp€Ô´SiÎy¯xÌëýÿVRŠ‚¦rl¿6žŽ²¥EOÞë¿+ªY%š„¢ŸH
þ® ÿ®kÀs‰nøÉðBô%sÉQ'ñ¹‘ÊŸEQrH„“¡U—jÀ¾¢ø6Á};G‡šýjÅéÞð—*å‘8Žuù;^M‘KÈl ÿUýgï»å†ßÞÃÕÆwËOW<Úòz¡Æw/ãBXK©ë2J§
•øú—hÆÓíî0‘¢ó„`Âk\¶®–æ€W¸¢tšT}ÉÒu@*Õµ¯2­à‚¤›‘…`¡Ù¢xòÂŠP›4Ö1•.i¬Iéh¿*[y.FÜœ|#h¨N1ïêDHñ¼ÌJòºÎŠ“jó»ùÇØ•Õ!(jTÇ ‹õ¦ uUn·†¦’€X#ø\þl–NfhLp;½ï(gÌ»™r…¦ÔÎ”¨SS8ÓMÕü “NJ–Ž'”uÖŽ#K¥ò‹Ò;Q%_Îó”Î¤Ä#ŠÆ‰šÏÒ^xˆYw0Y¬V´#˜ƒt,²_ê/©"2kÙD´IŠÙxœã†×aJ	.Õ˜€Öko¡G©FFþô­˜®DƒT–ë”µÅIJji#çZU#·T=ò¾Hx‹yQÈÖuÊÂV3–L š:ÒtŠ[]öÞRCåÆÏhëàx²ÅÒe`Uçåv*(ÔT®––™Òpô±(T¬¤mSFâ®œö^÷>ï„-h½ÈTqyoGè¢¶£Ž½áßÜÀ\ñ…µ–ìF­féFÂuü¾&‰3r0ÚÒFbBj.+¬½xXÕzÆ‡5­©kw B&&š_
G¾–”×s“ðZc­X1âYnµ¿âÖWÜútÜŠQÈBècC®ÆM¶Hô3F³F—4nŠ®×^FÀL¬Oa9îr2ñÀÄDVVÐ‚cˆ	–Ç?‹.ëk©Rúb ƒ ¦9†p9ÞdTšÎ5ewYò„OO8o–
"L?ëÑBÿ\ÛZY¦ŒÏw&å	lß÷PK=¶²ÖW<¦¸ýU€·%ºÜtë´\4BM°³äÀÅóžvSŠx‘-J(“”Œ„ÂÑø_{ãƒ`§èP~ÂwC¿L'/WÆSÓz, sxšð ˆ¥è‚TeÔG$5äÃŸÊd.“ÈðêÛÚ€µÔÏ–‰ÄÍ©9Øã‡1ûÕ²ñÐ˜ÒÞ…@1=ÌQ~Ã¹•'Ð%¼UÖ‰ò9<—ÃÖôdá)eaJ¾ÃC»Œ%=M,
Pà&bÓãZÛe—9/ŸŠAb‹i)m« ‹ñé¦J)«PKÊ„ìédì1L—ÂDK°^I;„Í”@À´–C9Róð‰ËÕdt@„ƒq8\æO)¬ð†ÄÀ[JçB!ôî³p„‘¤Þ]»:{s’÷Ñ§Î0&äªBxÚfiFü‹N\£áì@ou¦UÑep¢¤ÒŠÇËÐså0–*á¼m½€?€Jûðä»ï²bvOÅ±¤jJ—B4¨3OÝJ1âLÇáÀ»‰´ÓX,`Ïˆ3kz6\‰±¥÷8É`	ËŠÑÉ.ú•He¾K4,z›’Þ§i—Žò1½Tƒ×Óî­Å¸Â}‰H,‰ÕÄáˆn hÑùClP›	oLÅþ¤Áeùï Žj×À,&¤t>œ‚§Ð]…ð×8ðËðÎ›¸¯¼ÀU|Â´Gš÷Vs9ã‚BóÛÐî5³ïîÝ1Ç£	?Ãzz8î¹÷ÐvÌÈ¨éiÞ&[~V^×¸îBÊéûŠ_*Ý ";A­o”>ÚdùcM”ÑW%iaW¯ù’µFÔ”8i½K¼&ËMâ©Ö˜]\ãüšf-¦I/]jÈá!Ë1)¯3¼sf¡˜»žÅóçÈÊ!OPX¥ƒêÎewÎ˜D¸ø´Ç×âÖ®§óº¥Ë«à5Àž7f3L#Â+Ì³3î Šíâ™Ç3Š)âmj‹ÓGAÒÔ.o“hžeÇ¼Ð)ù]&~¨éc˜„jD ¥LÎRÛ¡G˜/·—™ZIa?óÑüë_jEæûUEÌ‰25E5kBó
áH­Va¿]Ó†I–ò:^Jåd«+Ce;½OíèSVAÛÞ"¯Þ‚»›j—~y‹
GÎ‡_áa1y§¸trã–	žLdÆÌ-U…àR`Ä•z†¦^arPÊ šl®Ÿ¨™ŠÅ‚8T¤ÙjÉ‰õçåŠ™¦«­Ëè¹wOŠŸ§WUùÉÙØy‰å£¦6ps&zN“/¯–‹mT=±³;±ÐÆÍLÒ'Ú¤rÍuH	ƒåFM{«6µ…-¿Kûº)‹fÁ)Š{ÅI _Û…ŽÐ‰çªbÄ”ÞÑ5ßœì¦UÃîäÉê%š²j¤"‚mw)a€ø•¦ö”ú²¬áUéh€§Ý›•ÒªÅïvØqçðäÇóƒ³¿îœó5bŒÝÛˆaØÈ¾%#f\ÛTBÉÎ—­PVíñÂƒ€ç‚èO¦rõè9c6ü>þéûg†_@œ™¸.þ¸â.wT±ô¤xñ¢a	¿ eP*i*†/Œð¯C3nTQ$¬dQ	»p¼á..­#¿Êå¢,ÍÀâŸ¹„ ¡4*õä[\×!Âz‰_.Nénæˆ†h¯o¬º×Š{/3™“aRjsuuÕu2¥|’úãR®³þ¼ÙÍ”ê®;Žµ6œÕµlSº,Ëô®ÛÏž=Ë”¡ke²L³·¹öüy¦ÌÌbðYªë<wšk™R@“ÎºíöF¦HØ½¤³ç›­ëv¦¬˜×÷ãRk7kîz¶3?T`ÔjõÖ²Ãvð M†´ùìY3;$wäÎ0ys}scc3.6Oo)ø“Ä®b‰gÒK&}ŒXF2ñ	pºa#¾G(}'Ø’ üÕ®æž×Ušø—–ÑöŸB³YœEéLàî¥>Ì+Êz'Ñ2žQêœà<ÏGô¥Ý"*Î4E‘M'?ñ#Ðd§/Ýa´ó„´­ ž¤!¶b(¶Ì¾EcS”l’SH3†×p€ÿ³z†A—íÝû‰ƒ÷1¿'~ƒdûí‘f—×òv«—º‘Îï÷‡.UÈ»”i<Ny!fˆ?ÊÝ¢ TôX0ù},Þ'éW¼‡ó¬Ñh`™tE­e®Þì¿;zwvŽTI\X]ªðûõôµÝÞ__? ¯«{ÏÛ¯7èkçùúúëgôõ ³·Ú|Î¿î¯=ßÜ\º¢´”¬Û§ñ;£xûùë
é5ç>Ð;q3¾ümŒíbÏ¦ ÇVù¬™Ô(˜qqáEõëúš¼1«ÂDoþ„!f@ûÈkç\ñ E‚ÏIlÝÚ`¿Ôõ€ûx'ûÓCRW(Zë!æ­wëÛ@rCÈ2QÂX´ï‡é CæËØÙËöñÎøÊ¦=ÊÍÃõšýc/>§R'<}0Û&_²¥8vN*äG°c)¦›öpn–[úKéWéËÌQµrACAXhÌ·£yyoö7‡½È¿ô…²áÏ£}…eV ÅŠ`z®“Lj‡kC8Ü¹u~ìR°}²ÒÜÁqÎÇ‘ÛG»¸ðeÈ a{+âW‹½l7Öw„ñ­Ÿ?:2=ŽÏ”.U" L\õL7C´§0U­5Ê¯%”Ÿ5½@ùÈ»¶ vü%¦­M_Û¡M®<â¬à{ÈJÅæÐÊ4«ÁZ™ˆ½ñfZ$ ¯£²Åá¬-–°"“;“ã?êQ¦Ðœ¢8U¶¸½´c`9ÞOôî0f:°“%Ëå¢‘áåð¸7;Y•‚H_ƒúÚsMß#ñ»¯;S²ê×yë×N übêÜå§d\®Ô’ˆ0h<ÝÌåÚ:¬j†ò™NPOÿÑ§ô©v*@2þXñc‰_Öà¤{NÀiòõ;±ªgÎ`Nû"DÓ÷ÎÚY·7ƒSqoÂÜ”{˜Ä	¾œ:g1¯t1ùÍÏ^vßÚ©4+lÆÿÜ·ù/øS”˜|àê¸¿T‚ùãžv*‚[æÏÞqvsç¡5/J±ª7ÊÁZØl³±VÐðöŠ‹¨®äƒu{–‹"Æx=]ü[÷•ƒWäg¶SYe«HÜ+òääv;Åà è_;Õv{£Ö^m×ÚkÍ}97ïìöß:÷^˜—ÃÑè-¦[#mbnºoš:@ÄãÊ)‹ì÷"eQ® Ñkˆº€µgkÏ÷@üA}îýâí&ÿñmøÙ4Ä}Ôf…èÒ´—ÈÙ…ï#o’7bæG3­L³¶¹Vk57`Yš«ËKù#ìòtVÀy>WÈ›8³¡ïô4û³í“¸¢~ZÖL¾ÊäÍ¤„Ê¼•IRc·J€\‘à¦$Ïœa7Ê¥Ï¶Åm{ƒ"JºI!¡šÏiŽ*	´Ç;UvL…Ò1W¹8¡0PYHdz.“BÚÁ‹ò»
´ÑÝ<nÂ)WŠh÷•K´dOÃ‡Ëÿ¿Ê¥FpÆ!ÍúÑÎƒ ×‡ ;újÐ_¨°ÞÌ!9y«‘ãÜŽ‚––YyèGQ‚H³—]Ù£úÅV-^,Ç²• %)Çö¾<R!ÊRÚÊ]([ú@3i´¸à‡xî/YE°ª”ßx«Hs-Ë%²‡ÑlˆÊ®»üF\|QÆ°Dñ–9e«6Y“!Qcâ`pJ0<&X³±º¾¼L;*É–j%zKtPµÍÆzÈ\ ZK…µs$ü°W¹Ã–c?Û+°¡­,íŠäimáå¬óâBHáÃÌ£t¶Ú”§ž+TRYù%TÊáùëª"
õÌÙÔ¿³òADJITç2
ÿCÕšÞ\çôl¢.`?Gþ_Ið |’Ë«Í²	×aõ×PŸ"Ì¿ë™äY†VMo.ñx“²rÀÿÉ’T:Û,Ôÿ‡“RÓ¬\WSaœs„BÓ.3fx3Ä„.›¾UèéÝ`âO¦C8q7û°ÛNñp3‰eC6WDûz ¤ôûªò6±t.Ïÿ¸l=G>S~ÃN*$ˆŠÊLõ>‡ú'ÞXÖµ…Ö%á
#UûYÝ½ß©¬Ãìf¼1ªíß½žÃûÓ()ø,§àÄé¡‚²3î#S¶n/$6Ù‡¸ ÷žƒç’ô$|;EU™÷<™3ÇfÞ—³¶œI'Ó®šjÙÊm¯ ZXQ¦PÝñišŠÏ¤§(+k”ÕQä3N¶´Jx8<ZKñÅuDCË©LŠ	iIü‚Š‰j‰|#OÐ/£°J@–E[ÇJrKJ&¹Veú¨Æ0uH:r÷ÀŸà_´/0	&Ì0§¤HºíØ¼v8­BžC’ª2Eƒ$úäÍ“ ÒÉùŠ·VÆ##ZÆIcò2 kdN[é„Šá @W¾f%VP2¥>"›ÂwÂÁæ¹ôÙ´çrrš.’Ú@åÏâ\¸IÕœ™»!ñd†§0z<bŒÊâ-ÎÊ™N¿ÇþŠ_Qjï¢p¿G	tØ9Ùë¡[Ê#I·LªRbì “¸k¤kR{ÕGä•Î]¶€ã„I5qÎ=£„³DÖÝÉ4ö´7U;åNEù=ŒÛ=/I!¾ ù‹&jÓ:M8úen„¬â™•où#a5e…`J©cG’Dšy”ŒúÕ¤nÅ¥%ª×¬®U”°«]X {6-þ4<—u–ñEb}jï®{Nen`Vã+–bÖòŽ¥¸J‘§.Tý«&x ‚µâ¼UÀˆäÙ“Æþ] ò3!€H%«û^õ„< ¦ŒyšËßÊeÏåj¸ãVŠÇâœ©ØFO®Ü6·ÒÎ`Í‰S¨-L%áYoÚUÍi²ä“#C„YÍzHÙÓÛXFv-ª‹è$Þr%êžìJ™JŒ’øÓ
»÷Èï¡—«?9rf ïVX—’œì<è×É˜w]Ã¹È˜ŽùE;m^7†3®Œe4†’ÀsÆQh3Š¶Åª=/¾HÍÙJÛî¹ßbPV¸©·ÚMº,ÜnÚŒ ‰w²±À|Ù\±+Æ•3Šâ.[æ.Íõ0må#à°ý¹à`Ú¦•˜Zqm¹Š¤Ïw¥k-B9:+ø¯émB\‘wŽfµNÐ_¿Rc(.ÜŒÝ0Üb«ëM¼66B=;üj›GÜœþNåÞÔ¾ÚÇs8€JH*"DA»w±¸Œ`Í8p€Åá¾@†2þø–÷à¸sQµsãò´£.@>EõZ_7Ÿë¿I„ô‡®ˆÁ´D¯Æ=àc]Ÿ‚]E³²Â©e`Îê»ìóðU¡iÀ0
mŠ[ì[›þ¶2}¡Ò¯³VžŠHL¸ckÄ-\jMÇZWvõ@·­s3ÉcÁÕØ7njøMú»lqàž#ôá0úèùÓðñ+Šœk7Þ…) wý±àŽÛÖÁ<~¸ËÒFCÚÍ5¦ÝA}âŒë3™Nä{ëÎõ5µLSFñÂx­\±]¥E9ù1Ö‹•9ùBÊÂwiÓ’ÒyxïGß°MòoÜÚz´aqrá5ýù"÷rPÞmÝò“É¿Í›ñ§ÝîMl<z.àéZ¤H1Vâò&2
ÀIÃûžÓ·çßóv¨y”×}ËåE!ØQ«ëÍ¥¤î»²/.£VC‘6&s/ÒÞ‡ª™£ d?g%Áì%d4BÇ[¢ý®¾NÇNˆÐêœ¿E‚êJ+É›<l#K|ÙZ‘]å½áÕpgGwë„×þ85
¼8ƒ|$G îV+ýÓèÅ:Ÿ`4ÄÝîTÿÊS9„ä¸2
~Åz±a€€=¤u½aj4×´±ÄÏäH$š«š„ÛYÁ(”Nb-±ÚKœq76­ÙµíœžæÖmRh9´]F‘iüÈ)’R†-˜s‘žÐJ|Õó_-aLîu³X<×4‹gYƒMysMrÎæI–Ê‡›U$­<oª8²£„zªÝËfcsó*QÌµÖ›v»~î-ŽR¤Õ¢{+z+’kY\ÅbOÔã`þÁ ÿIõ«¢ú¸kÕÓý D‚¢3ÅY»¿žR&k)Šu³(üç|—+âŸJ™’Ëš£›bî¸­ësûÊ‰ÊŒr‹Ûë>ðá=K™âì.Ž“{²mNfõfÚÄyW¿ñ"Àà$‰?X.œøyPêûWgÂ"ÅRhÄy¤'AŽž¨ƒ÷‰y4æcŒ.¶8JW¡EáŒ¸eˆ°\F5'ì´fs9ÏAÒç:ô‡S²X ý³Þä
ø{‡AÀ®$ôA4¤3gQDUÌ"ÉáB;;E>µN–éøX„Uß•€ÏœÂõi˜—ëŸS×ÂsÕºYõ¸u¤PpÄæL¸ŒM©d†uµûc¼ñÂÈfæ+Êäþ½˜jÆÕ;†¢{©×sn™ÓsX¤Þ?ñµ°œ<Ûv%g_Ù}
L6¤Ä(“5%¥lAº^ð{5Ù·¿šì3Ÿ¯&û¯&û¯&{9Œ¯&û¯&{>Á¯&û¯&û¯&û¯&û¯&û¯&ûO1Ù¯~6“ýö`õ·¸›Œw=ÄMê·<´“—GÛ^¬E¡2áºKx”hÆ²’âÊe9W5®yøïêubâ•Yãý‘µI_\ä€6ßË–‘uœÛ‡eØjKŸèBñÓ¯é=aèìßÔq",_}&¾úL|õ™øê3ñÕgâßÎg‚ôD¼çF„OŽ	ŽJ„¦QeŽñ¬RJP%¤¼Ÿo»ÔŒdAE?‹bßŠŒ>.ëö`÷jÈ÷kø\žFß†çl ÿÉ•ö¿€gCoÃŒ`í1¾%£à-À(?ÎkÀ`ÿÍu|0qÿJ…•]±·}£óübßeày§¸Ø0W…_ÅŽ_Ç×Šq¼Ô’)1™&û$¥F©¨zöCæ‰íýû1ðÇéÌ÷KÜ§†½ ,læ¦ø{tCù°„Ë…TýçÊ5•.
ÀBWfÎ}aû(91"âl³¦hq‹éiù2d4kV”†Ze"uí§ŒD=šùA•÷ñS}õVsïø§Jmc4üJuM‘·ÿ¨ä(s÷¡8Šm<ˆR%KyªŸßÚTýx²tt³R~¡ùNœè.ðìózqªŸ2(Ÿ2nŠzéO‰Âfl³À§%å¹Qþ4~”Ï e`ŸÕ{ðsø&ŸÅ<•ù-ŽR<¡2¦ÏåM—EÙÐ*…Aø0‚%¹¸–wl[^¥©ÍB€µ»].°åÊÇý¬˜œté¢ö@n6–ç¬–ê2¯Ç¿¶ÒÃúêÙXÆ³1ñj¼•Ÿ¨PØúÍ\m’ôNÄCtÑ9ôQƒ{ì÷œ!{œÄÐ™)N:¨ÇöoXÏïNG¨À|<rn¼±Û«P~úÀÅ!ú`	’ä‰±ob½Ê’ìjy÷n„ÐE'ç_@ ÞD¦P2á!eùññ`7š7Œ‚‚_§*¶Ð£"Úš@Ãü›äÐ2X™çSdIÞG,|kl®S†¾–QN°dô•En?SE)‘,Þ¥IK(Ôh#ç¾N?%¬5*cOQ&ñÃ¥Ç \ãßêÛu½ITn	iæ¾¤Î1Ífw¢ïŸ~p³Ì¸½¾kð.Ëñ›G_Ü&ù[(¾ó€£ÒW§ê´íix3D½?^	×1yÎ×Ý€t¡
MéCÓÌ4nTEoTæl±µ&&û$YêÇÇ”AˆÕoD§õ8†S§ƒü¤XÉËæõÖäþGüOÈ§ÿa
[ãœ`oy«Æï-<báâe×îw¶tuûÚ}Æ¥K?6.åþÐ‡Ss+ú«o8¸½1‡ß²yYíflúÇóìAQÅ¢FÉ¶É×†¬a:Ð´Ì¤Ù tålV²'6drÍÊy¾üÍ I4.nŽâ¢&è]ñÆuzF¯\‹L ŽT©"jñ´‡<H"Ío#Xó¤8¸6rpm\J¿­dÏË¿ +~¦âäŽÄ=Í´²}Æ$}0ŒÅ"ß£R;>xdW\›xÌËf£íŽ®*»?tÎÞŸ|Ï.Þn¯ÚÆþò%Ô”2ãó¸;9ð'žùÀzY€újNÇìØ!O ³‹fssåì˜õöu°²ûÊöƒ7tÆNß	œ{;C“Žé’……Î†v¿láÄïî$›3Æ€™U$ø•¢¾–ˆÊøjËÈg”Œæ2øæÃÅÙßGuµ€PM5wsr«+—ÿÕ¬o^­ôk¨´l„@f]Ì}Ój/›½Ú‹‘w¨Ç’„9Œ²é•!*ÆË3%Ö²àgeMÕt‘Š®D%F·OÊ{ò¥öà…X$»iHCŸ•ï•Ì˜¨j6Ö+»yhcS¹ä&)ùyŠŠ|¼]–Î\J]tÐªƒ›²„½MG•ÿDXÂö{îoHÞ9òb:v¼ÿHr­ùoA¡²_l¹´¹0väû5î—¢ë‰Ë7ÐâõR¡v¯\Úº>g”óNÇzóÖvÊ\£ aã2aòcä|nogø‘3öµþ§ß›Þn¯Pœº”èÊ^ÌŠø% wABrS¤…æYö¾¯e¦']ÂŽª	ÿÌÝÃM¯bý¾ùõ'è;¤”4¿?";œzËšÉ¹—ŸßE¹{÷Ùä	iÔã¢Ç5 f.tg1¡3ÊG…é1œ˜)Ãb9há¨äÏÑŒí²j^yÌÿ ¸â@¿¶(Ää®ÀÂOkÎîMYÚ’YØt
À÷Ø`b/vuÅÆáÅÙ0òFj.ý·LˆMÒP–²fžE,¸åBÇÜè#+ž%ðOdZBv>œ`¶Ð©Õ&1(dÚA§ç„Ò\*çAÛxJ<kš¦Ô©§j=ò™’™ã>k¸$ËÊ¢çÁaxÐëî=ãY )¶ºÁLñÑ€oÅ¯—2ä+ Rà»ÛÊ£1íÃš½›FöêWRå{Ò»QKÞÛBþ ³ìxHÙ]Éciù¯´¼Œî’äV¯3L—ÓÂ¯µîÅcÍd.µµÙìÅ+ÁU½SŠè~¿š…é*óÎtûÂ:ÏÊ.°“á½?tÇYá“í(B•(±±,ž\£Þc|~·ø‚æ†ÕÊ%B¸7|vÌø­ðâ¼q"?Xœ:çŒíê—Í^’N“zåzw´ð)ôžlàŒoÙÌŸ‚T•³öË/²§lN–4Öå=øÊXd.Î;ìmçüð»88ê¼a{g{ðåäÏ’†ŠBŠ”H 
} ¶Oa|NßÕíVmÊ’ÿZÝŸ,øXÚ×´²+²o³7@=0yzä9œ—»5ÜG UGÄ”+ixÎbØFðlµ„ÍÂªÙîç\w‹mÛ<dÃùÀ	¬±Á²j¾K;>”c%Ö+#ØU_¥±”›¾…ûx«Ñl_©múŠÌ¤îg¾ùÜÌÛiÂeßŸx fñ‹80zÝ?‚ðh•ãÞ²!P¶s
ÙÀœê¬²ç'ô‘¡7® ¿¾çô=85­TÒX+Çi²$ªp7ˆ;oÜóï„žU«è3†¨i¿œÙ>øM;Xjî»‘sËN@[|q¬NÞº~¢sKþ
'
ëGú¦|6¤ÜdŒž.¦5¯ÊÅ4šNŒÇƒm1,Qélnµù^³i¯Õ$†˜tm\û½Ù­êöÊi |®å)œ{Øøò‹'xŸ[D¦òGh0<á©¸Ãœp6îm¸ñÐMó5ü[C¬9÷?`z(ó¼Ù”ÞÐU3åÙÏS OÑž4ÏÖŸ,o¡eaä…îöCÜ—Û{·ý‚¡†`cMT`ó]RA¦ivïdÕ*T÷‡˜V<p1äŒ~O'àNC;TÛ?£2ÖÝÀ?½?;ªâDõ÷þ˜Rï°*9ÞiADLŒQ_t"H Á/	é ïaÐ…2ÔB#ÁÛ^BÏáta¤>]µ|Òk*ªFE¹°Ç‚ôý…öz ×ßóÊ•}VÀØMÖØlQk7YI=Ö‰Zo`xÏ’~•$½UñðÛ¸¯eì¨”c¿œ”,§¾Á³ŒÔÞø³oÕ9¬ÈÑ¾06.ªuø$ù›Ät0ŠG¼Ñ¸cùÁÐÅ_Õ
/ ÆuáOrÀ©%oãeVLôQ´8^ðcU¬VÚ=µ/\¦o ¬¾8|‡TG‚ DïÊ>ŸF—·‚òs>:%&®,kÀâ{ï…$Ñ}£8wãßjèÕÿ§9Ö² ñYh›'Ó‰|¹ÿ*¶´òÓÄÅ¸‚€¨zâ{CÿZe[ª×ðÀ‚Â_¥C³èD"…ZT/±ÚUˆ™»)ý³qù_+«ïž®ÔX¥²Ì¾c•ÆOr6þ‹†¨N,S£û=ïX¼-À€ý»j&Òe6š ‚Õ4E­I §«÷’½-š¾½5uÓ¨£µÍW,iü$no®“?Ñ”¨nÀ£j
ÆŸ¼ä<E¦‹jÌÅYÙÎgûàNÏÞ½><:`ç‡'ßŸ³ÓÎ÷¬zêŽûìmáÈ(Ò¥Ï×5âÜæÍ» ö¢ãCxÊOo
CŠ¢ ‚ßù}oŒ_£Û§X°nòWï'=ä%~ä‹> $0œ^×kûÓèÉœ‡WÅV·˜l…ý‹!;ø"é
½­ÇGßë½H`‹Á¡Ü ÊL0¾Ú6ÿyÎï‡º\rÞ–Å/¯vw_¤‡Áæt$ÓPK1|ÿ¾ä†*Gò"8¬]x¡O™>T¬ŽÂ~Ì’(È
:XTy1‰‘ˆY).uÃÒ pNäoÂM^â¡KÖ—oÎK‰ßUNWV˜P!àœ˜7žL£âÐí;­‰"Ñ}ÑÊ‚Ù“äÀÂW‡XöÌ½áíÂ—í7ÇGôTœ\»œ©O†Óç-P“‘VŽèÙ°Æ-^"¥šè.È_W¼mª¸Í½Kô2öWã¿ÆÒ{­¢Œór2€ÝŸ4{ÿ4¶KTƒ7w’Í¡¸ý(ýàÍiò}0I¾Ÿøê›±ÿ#Y©<$MÍéõˆ£Ž×QäL»3tP“÷àÄ¿õ©‹œ|ïò•<Èiÿ5¼NZ¿¿¨m¾ˆ§‡'§ÌUVÏöN½q2—wÉocWúPá\ÕjŸ$¿KÔ†?7^0ÒZØ×Ÿ•h%øw|ÔÔÀyüS«{íûC×ïV)²wº>w\Ÿÿ\ ~2ê¸äQ~;bipmpKœ ðeÒvCä¿†Ú†Hž”„’ÖÀ¹ò ÌE |n›¤’[l‰Æµt	w1}Û¾s§¯?Y]4WÙTÔ|ìvu’ßÚè>¹K•°‰¾½ð(7+!Zoù’«O7‰ÿ¦ÚÇñOÃšF %nn¥Q…Bäoq'ü­JYé•FDÓ4TÔHˆ&¯’"iÊ¨F….jdQ¥ŠjO*ä}éÄ.KëDE•´ñŠ*Ó‰˜äMç5v‰o¯bÜ|?&.›…æ™Ž‰Ãˆ×Ÿ¾‡ò($)q¡Œ-|¹¥Ií<©§|&©‡€j©'8ríÑ<µ¾ßðV1ûªQ0•J­Ü‘ó»ñÆÎð„‚21+Žxa:¾/Í^j/0°Q•ôÄñ.ŸÅ+åÄ”ž«”®$Ùzï““£]<Ët!ÐIéDà­þ:éB=¢m eV:€´¶ïphð(•`Âª*Žê°Nz!|¶uC/·âXÞ¼®ìÄ¾-”>»‚§>ìqâàžI|)@VçWxâ%MDÁ,&7ˆ çÓ‰ƒl·dÔÏe(ØŽ¶1i1,q"t:wŽ1[µéú‹…-Ÿ‚:È-eªŒÉÅÕÕWNä’ª/æm)x«¾æH³¥¡œúþ†‘dµ¦ëé˜†K~È±§³â¥&ê{ã.œê¡g¬r(ßju†Ž7Ïc#þN+?˜F¦`0C¯´Òtùx‹ã¹žÄ/ð—–Æbè~t‡¢ø~Ëå¯ÊÞÙ»“$÷ùrVç5ôxc¢ ŒÊ¨t)Æ==Õu>çø~#zIâO¸´Üà[+•¼#•r©Š*‹Rª¦e¹áþ\]R÷ÂRMÙ
0¤‚&VÚqÈòÉöÞë‚üŽ¯F£!•üsb…F@øLð±€í"d¹ð|sj~ŽÜˆùM'úùkóÚºÕ-+–Ìê‘ªýéUµHÓ À~Ó%‚®ú”¢ëdãœèOPS¤`n½.gñMLØ5Ô{©â‡öHn¢ºß”)87ÀÄúÓw0?Ÿ¿;©Vîœ (Ü0 ïGì®RcÆù£æ ¹­¡ß©A
52	Cã™…{M–ÛÊtªëje0“eÔ–(fºî^v‘H!‰&E¼S¨lMM>«êL¯"c§Þ(òsêMJ.®&G¿ˆU­i¸T"©¿©Æê(D•Š;® û±ÆÈ'=ív† `ö¹!ÐËké ÐóBo4qÆß$ÃãôhÎº¨í#]íŠ×lj @5\n§øÞé#6P3”À¶j;· ]pšñ5üµã)
çý»”ˆ$lÐ¸y7#w<ã=MÜ`zí@‰†Yãê“œëçÈmFÈè¤r<õº·±|Á½jèíkRÙ¢i=4\©åYRÐ^˜U·e,7Ürá
Ób‡/—M‘’…d*»?%LÄÈÌz¿¸xÙf}ËZÍöšø“,3ÎÌ_n6¦FÎ=´q¼G°}KJpbD#ŒÜ4œŠ„NÐ`Çx{|ÇÂ
¨UIgže9-ÂO¢GµÙBÒœPMÝUnâ ³5ýƒæê¸M^AS9'Rµlº–ê2U[+«â H™TÔ=Q°¦HÚ¼™ì>(¤ ˜@Q7…øˆ<+3øF9† ^êœäV¡XT„—Š´V1º)m,k²Ä7ŠšQTK‘¨¢~:tÑ„ûøÌüiÀÐŸFÆ÷ú1:£‡1ŽzÖ÷œ†jEÕMžsetÙÁ‘ŒfœM©Á¾ãCc^l×01g<¼Ô£1²‘z<Ê pÈsMàC­?4¸•35em¾QÊjz¥¢Éœ »ëŒÑ¢|‹0šD³d>×À°ˆ‚Õ]£ã:»õCÜÏßú4¤•ÿúgïacþt¥òoTUG¸Ðq£iÈw´v8cpRõ½(LÆ9€q†ò9Pý[‡Uµq#Më3ØÏSv®½ÁrñÔ@¤Ié´3È¾ ÀÑð#Ž}Š”K{>Ùõ)qQj	z€CoEùÐ£Ò|v]¿ëßæOÅHÒˆ©W'ÈÉÚ\ÑOp Ž=®)µPŽZN‰Œk,E»Æ!UdÙŠ·˜ø)£®°œÑ™|È-g‰ûí6©Òqc6¡H~C·¢l°›Ý˜–X¿ý1?±¥ßlê„O
:À1M¢aÿ6i¾ëL`¦.&iüèþOzå­XFÃ;–AÊª÷Y§3Hu!ÒÁœÊ{¤Ë{ÎIñ}ÎfD¶Ô®·4¯Ec¨N-‰Œo¦gQyžä.qs®<Ó“Œz%cFå{G*!¾¿Y=Ç±‚;Y(U‚Üî u¹;ÂtŽ4Ð-UwJÍº6nZe/ùÉ&S¡`Z«eoŒ<˜‰9÷|`Òõ¹´ãEEõœ´”ñgƒ}5•)ë>ýˆº­{{pôîøôÝ[vxòúÝÙqçüžîu^ª]>ñß¢ w?ˆÀÑÕ,L™!ÅIrþ¥çlÁðÍfóÓ3ñ@=™“GúÜÆ9âÕœé@ˆ­Æ	XPŸÉ/©>µ§ÏµkÌñ\²×ï.Þ	íºE6¥@™„<ü
F&-O<«ÔL‡°jò3Öv`¹<<2F[ÜJ]ýÈ¢ò&làMÕaZ	`'×š~oòñ/ÈÎ€®Ö»þÛÂ?¥€Â(›.on¹€0ß±ZðÂùúbÙÈàÂiMz,Ù;X†û=-ðm™L4K?·(^dzKiÎ÷å3kÄ€$ÄgÎ˜ï'iF+ë=%t«ƒîŽV|Îœ!°
À+†äZJE
[`a,j¿ü‚Ì­aS¨ck·t¼Ò‡o4pXn.›¯ÈÅ)ˆâûš<]~_“?[“é™àQàðqH#ö(]ÄÎ×ºù!™‘ùr]fò¦=~”}aê2l]Ú‰ÕhýÎÉQÆ*¥Tu®p$Iû¾êÓ,$¾yû¯4Ã§]“Rx@å]ÞÐï¹ [XHéãýmc ñyÑæzÐaPÝJ¡Ô’cÖõ†ÅaŒfêv%ì'ãÎ×ý7;Ñ-äñwqž“yìÈE­OúŽ—é@7$ÊÑ(óÓ‡Øm…e\zv?ÉE˜…iyeSs…Ê”FGYàEžR/ô2÷F3óü	¶FŠÉ“ï+%Vç«RbDÝ__¾;ùJ„3"Ìýë~¯TØùta+ì‡Îg¡Å‰KáoLŒ•üÇRcéNý• «óÕ²ŠÅ¿eîw|ñŸG™ÃÈ	¢ÿ8Âlü¹}ìLÐÔõ;%ÐÂoÿÂMðGAÙ?V}²¿ •¾\ç¶~ç½QK<xÓƒã¼áxÚÏ£ãÚ`ÿc)¹¸ó•«óU	9Çö_‚gÍNmÅìôö (ûIçä··6É‘üç™ž.#Ó÷“‹Cò¢ø;q7²Ð[wv†#ù½ž¶ˆ]ÿ?   ÿÿì½ÛrÛÆö7xŸ§èpò©‰©ƒeÅ²K';ÚÖ)¢¼3óùsÅ	‰Ø -)Úªš»yŒ©š»ïf®§ærež`aÖZÝtÝ (Ë‰ˆU¶Hú¸zzõo½q!H?Å‘?ˆ¨-Dåü¹&Q¹1ÿÀG8Ë¶#`$¾h¹j‰ÙVž°Än+Oc¸KOé›Þ£fß¯ ¥·?Ex/wØÁñëã·glûíÙ™æ.ãHßŸAHèÛÅ1&‚åq^üF«Š”‹Ô"N:ÏUPm¢F7</m&”|0›:º ’
]@N¿R”TüOiK¤@t*¢K+… ÈLwÕeG‘Ú•WÜÂ–É4†I3À^udU0`Î`ž§i=‰-ßo€ë91ÛOƒòv«•ù¹;•
wF©ÿðxwë Ï^Ÿ²½Ý}¿aý“½ýWû;ìÕþÞÁn_yø¡êW_kòæ[# ¸§nKlL‹\d¡ÆôÇÅ‡Ê©Ž+8q1_4¬±Ú4ÐM’IWrƒ¢`£k‰mP†Êª>à¤=U'õqÐ†¥@ÿÖÖÊDi	¤ÕÌÒ–dÒÊôå«Õ<ÖæìÕrBg­n6hù¾&²JL€­%Åžó,ØÛ§s™‡KÔáv’4ŒN€âœK
'/â¹U·<Ç®€-›„—^·‘0i¾ëˆ?ÍT<YG¤ø)GðT§&·äò½+sÿÌÙ|ÍªÖ,ñÁ«K†t¿™Þ^R¿ÊÉ}«(úiÓÔ¾ÖÄ¾H,œ1Ó°m'ŒÉ}osÀs\TÉf;§äÉËÅî¾*&)þzJAgÀWŠ*>¬ª.ð» ¹À•© kÖUó¨>”ex²nÇ‹¾kàÜðµÀ’“n ŒØ-:Ë‡6wgš¥…ò‡Ë|-ªÖô”a2U‰Œb\¢óXgÖØMƒ«ëá"ÎÑ'T6õù‡öHO>´¹L»^v Ô$X@’²f%dìÄó½K¦hpó³•tLú†óÐ»œŽ9AYÊ¦ëö|¶¼z@"ox`¯	Èž
µp}þ±/ù§ ô8;ù²3À‡ì°ãC/AdÓáæ­”# Ê¥„Ü\g(rÖÊ¼ù„nÝ–üv™GlyÖ¸[Q„Èö%©ÙæÌ#Zòñ`Gµñr	‹fÄ2¯BVœªŒã}çÚúuZo›aÓTøönWó%dØíU)›§+/U%Ð³gv¥»Fn`öp÷I»ÃÄ:µ·©*“`MâÇ‰;ô¦“ì¬²[“sÏçŒú$S`f‘f|ïÆWL“U?árëãiwïcn…³yÜí‘»}:wã°iæÆ×éÌÜ¸²šÚØI8ƒ<I¼Ž8BÇÌÓ?žÍ€aAx¢VFWX3ñ‹Ù˜@ÑSaíq%ïmÆ}ÉNÔÃ!ßªH¨Ùd›ó_þŒ\ÎÎçþbœºóÚÏgäu5ÜÎ¼wnµÅ+dù:¶œ×Ê;\™6úáˆÀ´¹…ÊRáÞ'çNÌù"ÑtàÚYaO¯”_Õ‘òmå«¾:Ï¸)ÂÓBæY K¹™ó •5VÀÖ˜÷`úp8};ÿÃÏGP±ÝÍ[6º:íxŽ!üÅ%³‰Š
¯ÉbN95F¡ƒ°Ù¥i”l,.º×Î$òÝÎ œ,¢À¤ô•Åë5¥×ÊÓOÙð³‰¨bªò)LûÊ¾Ód#œ¦¾¸<.‰_µdl´ª¯¼¬^0â§™pÄO.Ù¾ÕDÿ­yø)JZ –±†»ê1îX—ÊéæÉSé­-¥˜k¾ágc³!c®Â°Š‚ºÙvsÕ¤TsÕLÁ´„!"­ôLîd±¶D˜@2¶$G&9‚2Ä’MªÒÎÉ'*Ø°5G´9&õÁcœhšp7¬M[½mr šêzrå¯É*hµ*i¾‘/ƒ5L¡– c°Æ,!µ_¸Žk‰gQtÜÙ:÷™TÜ³ØIF½Ï ã~’B{O5_ÍŸ[]•<z½N-}ã‚êc.U6v¹­ÎGÙ¹såXSÞ×6´¡NjºkNâY™‡¸TÀL»{ÌÃÏ×ßwoçÛøJ¶ö²ƒ³–3ß|\~koÅÒž ’23ø¼MJÐ}ù Ûz¶Ê«XÁsß9wµ És?Ì¦Å|â z*§ËºñˆŸšùâCBíµö¦Ú„âÒÛk—ýÂvÊŽÕWJþ’Í”ƒZ7¶—4[ÉL'Hö­$ÂL\®våÝÓHêý)V’-Ñ|…rÙôˆ˜÷æ *äO×(QPtÉ<Uór]t’)‘r>ŸO-±á%#+£ƒ*kÖp%ù±ómÐµM±ø©3iþüéÕžy!õhh7æúóZÉ9êåg¶íSþ)6qŸög¬†p5ÅXu¾Ï®¼íì!4Ç}õ·,MÚW¥Â©Gí¿Ž•æ(#'M¶¢LŸ{TåÄ¼„A-2à|äãòú\…;<w…÷Ñç”,$÷Sè0§w8Ú`KëÝÞòÊêÚÓõgKªÜ£*÷¨Ê?%U.Kp¥ =ªsÆÏßPp>÷Õæd¢Û¯I™k.ÃùOPêDŠÑ”7.åÓ<0jœÁOóÑakœØµÿ
Má™MkÓRÃ5ÖÛâð*Ù¼]™Q±û§ßa‡.(>c´ÞëöæÙé[ê..Á·7aê€P‹§3é|ãðõé{Ýû?ò¨û=ê~ÆÏßC÷“ùF5 ±GåÏøù*üs_Í1a¾µÏ€þ“!·dÈG
h
z…vÕ¼CþÇi†…¶[(ì¥-ù £¤˜˜´ˆÉm¶¥Ýß’Ï%mOƒt:fÎxð=@ó˜Ì¦ƒ.WþÄ6`Úÿö@£I¦Cg\ŒšæìñY…y®ŠÐªŽZùc•Ýêb(ì­Vt‡,xÃƒ„SL3Ç¥’_´’"¨ñ/+#ýqj¶Í
¦7öÕa£`a÷fëÝÒÂ³÷ÿ¨~xâ\£Ž6o×ª›!t}%çìÊ*8—®íwb—”ööâß]¼œgOžÌuó /Í³µ¹Y¢˜³U.3HÊÕ>s³Ý£Õþb~]üüÌæ“>œø9þ½y´q†÷Á‘>Ð
CäîbñX>»ºP`3%¼*l¦ã§&X[êÏ÷nÜã‹d° |Àr÷3FÿVÜ,ëH¢_Bà \yRíñTðmÙ{úDfµb""}ëÌBb61ƒ€h*d,V­Xõ´1KAe|8ÑP/ªÔ=üü½ÄBUs­Hh*Ìâ€ "·tÕÌ~Â JèËùó‚ZWKÕÁäê“…ôÔ¶oèÑ—(rèÙ¯W
R«Ï*	Šè»ŸI¼E¤ïQ|‰² '.òß_½LÐøW%fØÝY~ÜÝyÜÝ1}>ãô‚ú.<îÂÚzÜ¾1|>}ûÆˆþ/?_àŽÀ~¿ïŽ€io†J  ol@£åó°8æ]ó!b#À{÷Z
š\/8Ó4¬ÚU1¢¥?…Æ>µ¡ Zg¸é®Öì ,”ÇÒEãç@îÐ6Õš¥=[‘3vF|ËéÆ>¼Ð1G™'ðÜ@zù	[G™l›â‡ÆÐ›E¸š±Nó9„ël‰î+^m<øÌ:c{¬dž=Qfoü4‡òÆ¢ƒËüsY&vÅH K˜•vk±œUE~`ßüSE4CÔÑ,â{VBòÛ¿|`’ø_œy;{ª¦‹O‘œÏs„õYóõl?_4f}Èª„½ûñ›oa¤ªù7Yû³vaÎ•yüBƒˆž¤^ðÑMÒ	0­3å¼øîý<ÜŽÝ¡ëNÜá	Ž1CRý Ó6'n¬Üòúžô™s.n¾†Ø‚(ùænƒeMÛ`;¢ö†¤_jëë;¾›(m„öÙÛÿrƒí›n˜:µÁNÕß¢\ÙËÆWîÇÐê=Î­¾âð†Þ'ý}u\àQo¸Á’4&õ1m´à9~ì‘?9ÏPŒ¯­ä¿a¾]èó+ø#FJJ˜x‰ûK}7ð/Œ|ÆŠ8½HÖ “?’Œ‚¸âZÐ?ŸÎK?ÁÏ§ïùÃýŸ¼püÄ->~à~tým7p/<$ñ¦vµºiäƒ®ÜOÝˆÞ~›ýT_{Þ„“#È`ZÐÅMüÂ‘x‘3SQ²—Ð¨ž cvããÈ¨‚ýâÕêæ¡ª?ˆ]70`TÊ«Òe­¹|Â¬-û='}J¡²þ›ü¥üù‹vWyç_"èògáËóŸÎèêžïâB(Õ§‹Ïðb´w†7AŽ %âÐ÷K/îz‹¯q±wqáÒ¶*CE@’8fRØ,”,q„¹¨£lùÃÿùû×è°‚t?r&í»)‡áûèøû°.Â¡ûÏ~çÌ›¸À	~ÌŸI~BQç¡V¢ñ>o7ˆCl7©‚›‚…Üj/¦ñÔý‘Ýýh~óÀƒÚò&¯ÒôêY8Œú”NxÆJéÍ½`X[¥|“dÇ÷>Â0xI
«:n?™`óI~2_‹y(}ê˜8ŠÃîæ~lV¤#¢Iƒt¿"Sì/%^ÎŠÌïŠtƒ¡^ Œ©¹8e
¨[`rêÍç@Hÿœ&ár*ñ»]T*‘Ìói*†ƒ)®§G–Íé]¾‘}á-Ál?Ø„÷FÿÅ¦£yP=(ˆ~°;hG6?jÕ+ï°ç›ê[…Å¦,b'ò6Yw½÷#[\dÝ§KÑ5Ýa?°n¾_*Ç)p 9ö³ÆâÀä?~ÈË4tŠß¿`W “ºÌØŠ;0¹ÌÅÉòÃ0¢ìSÔšCe5Ê ¼ØTŒ-°îªž·§Ôâ¥¼qwÆ´Æ‹=Ûji¶Q(s^¹îŽ@’‡ ‡<I&a˜Žžä•eÀÝ<ëyIü–Ë»@mI­|þ
Ä9€…g™“jVGÞØ iÎÂ/f*ÄÆ!šRÉf*ÄÄò1¦a‡òç=]ü†“$ö—»Âpc h‚3‘º	»ò€ À@J¨šË¾gÃÐ½’íÄ]Ä=µ)*üN½Iù«¾Éµ¼MZÅAö#¥…ŒÃ$.i:•ŒÛšôÖ™üEJˆ¦©ô HÄAmé§a…v.c¥î¤Ý‚ÆýJ¥¶D³•Ü@w&-­f$jïwQ±øñ©õB1¿âáQ7Ïwn¨;t’ôl±¨>ÿ=‹"'fŒy®ü*tVNi¯|xè›èw•»"^,NöÞuä }-4Ùò­Îó0„Å¼È´ZN‚¸; }aAxºFâJ”Õege(!¬ó…¨TÃÐ¾é_ÅÛJŒÓ|!p©ÁÛ…½ñyÃ†wƒR"/ <Sôú‰ø1YÈ€OÚÙï†ƒ(&¢?ÀèQ§B\š­œà $¯Õ’Œª@Š ÒÃo‚&$HûÖõm3ù*ê¾,ÖU¢å7YŸÆ•ë’),aú3BË¹5'°ss}_) —Ãä8ËéNî~»¹ÉŒÏë­ÌØ,nS´Ü …Á"@Æ´r¼µAVÇ íPôHvÜ²T‘z"cáÇwFÕ§«f\!¸SG„¯ e)”zý-¿™÷ ¶ý'0¯	ê>h«ÀÛØ™¼ýtÊ"Eÿ);
±q˜„Á¥ÒrµÝ¢½ØÞŽŽO,ì9[™¡IG¼l2Å· ÕR†LÙ
I
í›xèóî¡]ŽÅ±;cèNÓVÒüX„Ù{´Ö¼…1]†,S˜ÿt0*´~äP“â>á¸º:i£u!Oã›\Gãz¶ðG‘A«Çþ¹Ø—K'È–”7Ì¾"Þ ¬\ü1ÁS¨÷§‘C;J0”PG ”ï••&ïKOXtC¤”\âiu„s®/e¶×¦Q‚éÅUMV{²¡ôTÕˆ¹-ë˜z+B·§ƒ–œ iûÈ,c‡žQ=ñ8üMÝà}åw:q8i?É|‹Oæ ³8Êí[µmÐ¦Žû[›#Îç]ÑúT_6 ÅÔ¡ŸP«:ÆP»R‡Z}nÉÈo™<§ÒÓ€xÁ(†õñ=¨¤²iäÊ›2Ä3£0äy/:¹³³°`dSó‹å½ûQ¡Lá«UGG\j+õÎéÜ–›sáJõ–Þ?ûÇGíÖ,âàòWïWlYkžéeäD]«¹H7U•ª|W=ÃÓj©wÔnýN1¤î–*ŠƒÊ<è¶ð{•¼å7õÆ‚uÓ[ÍJ°Åç<Žã9#8é¸ÄN[¯Ä’à£Fó	cˆÏ+­©æ½¯ÏKxR^ˆÊ¡8ËåÕLd¢,øQó'ÕZm†qWëžŒÁîÚÍ¼0ò‹ðræR[*û¼O×	3¿…lX¿‘@×ô×±;ðüV>˜XM'Io`<qk?ÏZè6iÉIp}Î¦UÙjjZÅJ}>F‘ª8w'nPÅz±ŠºÖò„­-+~_Ö[¥éËãaÑõ†ôµÁäueNÛ™šËÔXÅH¤;¼ƒÞHsÛ9‰ŠËôÜ!¥‰ûÁ0ÜÄsˆ4eÉÂ #RÞ.}/µ”Š´%Y¨™tèy¶,:w¥Î’Ÿ÷tæ¼¶û”õS·öéAÑÍÂNÊ–ý<S¾ò W¡—DÈÈU‚*ãßò×~½nÍåŽVh5„:nÑf=|.÷»nY¾oœ"ßÙÝEVpÿÂ†xºÕGïÉ„µwÝgê§s-þf«S¸4#Jð1Š5+ „õ=h©|u×¹Á´Î®ò
EAho"Ö|ãK”ïä!­ÇÐ““£ñGøýËŽ á/zC+UËû@³¬Üw·TÜÝ(øÃ™–‹!,<h¥9ùf=YŠå™S&:j6F˜3ªÌsƒ_9k)®ê/¢‚ê)7óœ¿ œópá ;œÜ“
y'r*$ÎÞ ƒemäÑ!þË½OË9Yé…È·W”·å‹+ú‹|¸òêÝ!2¨6rÉìÕCž/@\TÈÇ7{u6<´®¼y€OÈk³t>´ïð«$éòå™ˆ&“Š°öÛñ4Æ\î8yX²–®Ü,˜ÁÇÝn†Z6CØ2•NOvX›º OørŸA˜@¡ƒ©OVc2—;kâh@çXyjN•š›†¢#KbÖ`˜"ð½c~iB²zÁ¹Ö/Dqx‰[ëúU
¾y©~Y¼@Ç´‹wE¯˜UyRüEŠñ­öYÒíb"\Ú¥=§Ašï{*Tyá‚8¢Ò T£Ïêž¬juçÕÁ b%•Æ­œúì†lžk4_Y¥9¯<X2óAúþ{lf”gGýÞAZ*‘ÅÙÛA£	 ‡Í 0¡‚v—F6¿JûòW±ŠÄj)šªIÿóÚKsÜ¸¥Ò‰ØÍÏÊ‘5/ù3þ]çüÚûÌ~èNBd@¼áäWº–C¾ t‰]Š[Ë}ì·™EMÍžÉÈ+¹OÜCL‘í‰Ý¬®nýˆžçc¯Õ…,Ìêƒ½íôß-½Ÿ—üb)—LkÜRlíRÓ6XwiI·»5Wf”â‚8"®Òæˆå²—/yð,H©›¹—$Ëu¼¼$-Z¾«;TÙ,ï4J€Hƒp&0üðùèNÑXIA  ¿Ö¿ù69•Ùêk*æšÎ‡ªs
nÛÇ‘÷i¡$RËc6¸?6eÀäðªÕU/æH«Ž®œ^îF¹IóÚ"ôq›X{†®a³yµüw¾âlDóZMZ%òœÇjzÁ<ôêN“9DE/`7
ÔãËëO¶ã0øÝ}2gš#ÝmzðõZ(åæ¨+æGKÃÁàs¯õvÓ¥Rã•9ý¨%âŽ?ï–,é]¹’XWô!‡8Ø`±´”»²²JtÎK<¤í[-ï; Bü¨½‡Š=
Q´úhÃ¡“Žðr3/~9×x´ÝVûNCÊ”ÖÌ±EÞj¬D»1Çþ}››SÕ€Â+,0¥*I´Vj6Ñ2^+‹ŠyÆŠ¤¨ðB m+QÛ>:'m{òõ<f’¶4x haÏ­ç˜;þÊ¦F”ff™Ð’\4„`¤:üÙòåÀ¿’3c¡ìX1þN^v²Õ†í§g@ûÐGAÞéZÿ‚uWi²{+â¶ƒà»qjöò¤ðTF†Ü¸é ù]{0~º«‡ÛÜK(ìJƒ–º1Á”‘³
'´ÓÄŸ®Ø½_t}Pcmk¡«JQ\O¤8¿ÛnÇ™"L ³ÕœÚ³…žö-“¥»CœD3LJƒØÐ¸Ð Ï³u\‘ôßRçéêœ«Uh{f[j¹ºÜÎVÑ‚ùBË
•¨6–"¤J3ª)¤¸IQï.O¨ªT»ÎGnJÝû[ým˜óWjÎ;79	|zc^Œ…¤~C^ã¡g*(w[´]£Ë–Ê¥¨c¿OQ©©)øÊúî'’ê&ÇùuˆQë”†¥i#uºiL@Úo_…/rÉËc)rç˜é*‡(@ço«°ï¦8ç…˜¯[‹)„;çåXnjêPÈ·Nò( ÉšAÉýÉ»-DnŒY3Œ›pkc¨9`r@Ýñ1£O%@ÁRÞ±ýÝÜèàÞçæÔ	¶ùÃ\èñ“°´«¾ãÁ£]a2óKíR¾9H–ÿýí”BÓ4»£ØBí¦ÞPí–Ö^íNÞl$þ·{ý3IÌ&­Úö/<³Ê"'Fƒç~pÃ9Þ™h·¦»MHÅc9S,é¦@\¥–ð ¼rãXUY&RÿÈ+Vt9ËA¦æ;22ã˜PÙx#Õ´©*þ<¯~ùá‡"—ƒ‘×Íï½óÞëk«fQê2ñ1>hx8í “kš˜Ÿý–ö³¦ãÄE·ÞÀñâ±´Êþ†”A³è0F1KwÃž¸6<%
ÄVì0Ú¾zÉ¹3ÂogdõÓÅBSFÕê^>7?lfÕp=Öê¯È§I¶4¯ia6ÓûÌ¡á¥Š™K?}¾LÃŽ&¿aßâÑ?þ¾Í”W™py¶½wðöíîonïÐ†¢¸±»rzÜßë«×ÊWv÷™á±½£Ýý£×­¢‡K©ö3”Î²©2iëÜ#íœ¸%¼‹*Þý	ÔV‡bèö’6Z¥=Ò¬> ò‹Àì*EP	?ž³|è¢æëUMïåÞîÛ>Úo!u§ªÜ}Æ³ öèêR©ÅS¨Ò¶DÚäï¹çÎ¥Ç=ÅQæmÊ—†2Úp­0`ß˜¾×¨0Œ¦©•ëÿD’EãùƒFáV­“…¥¥Øíd;çI[—8Iä{ÃÑ‰Ýá4†¶3€6M¾ây„Î`äÄ;áÐÝJÛK M,‘t{Ë…~9!%ñÊeš”ˆe	ËÙ[¾A¤Y1ÐòvAÐò‘“7UY;Øš,i³™×TÉíš+µƒ,
ZÓ2åG<—K×ë)bøPWS'ì!Ú·yœl	_ºª;z Lî©)‚_õw#/(½JfPáe²rJo£ox=(uGd,—ÚnütR¾6ŠÊ×ŽBÓ“Aøë(*¶L¤.)¶M$^)•Áóè¡Å$qûKYÕ+'w¸ƒ[(¯äÌ¾d]0ˆ`9ý@×8Ž”~‰F¼|1(½,» /Z Ä¨8ú…ËŒÎÐ·Û…F.*ý‘^0ób×_”ë0{^NkCyy¤|“ƒw2[løÊ¿¿\„÷^j”+Œ3à?(9KV›%º«4¬š"Õ¨ÓY¿@Š~›—f9«ÙPÌ«µ›æHî{ÑëÏOâ0¥­K‚ÀÇ6oñÿ;–z©ïn
WJ+?ê¾y›}½“q’›·âËv¤}óVýu‡6hxõz
l|óýŒwÝàyxû®¼ÀK=Çß¼½eaä¼ôÍ3ÿ÷–Tt
•¤=×¥ç–æ ˆ½`ˆ[[tíåŒ	0òF-L·ˆ®ÖÚbEš}²µˆwô¡ä‡ìÉâO4#Ž5™÷„ƒƒ xiåc÷bóVu`Üå÷rHÆ¢çUy¤¼¥›-]v‹ÿPŠV:ÁÏzf÷2Ð æMÔÝ#ØH'B„J)Löó´½à’ùƒFX!“n‡½Ù;8><9~ƒ&Á«ýö=;Ýûeët—µ_om¿=z|ÿÍÖéÙÛyþ‡¼=Ûÿiž½:>;f¯Þ°7Çg[oæÙÑÖáhÑl{o{ë—­Ÿè5Ç„	áÉ‚î:kæ’wKž;yO@O˜cUÅxå½’mP œŠ°Hç—ýE‡zV 2ásvøœD$aà=ñ-$Z”èŸâÁoÖ \áYé`Q|N	HŠ°e³/8ÅòÀú¿MØe\ìoÅ®ÃÚ”±Å`›Ä¬¡ùâÙsÛÕÀÑ†mc¢ÞV6¢Œh¹¢W2‰TD	‘,vcƒˆ«ÖQ¨»‘ñ%vãr]Ý±îO'lèaÎ—N…hÖˆ+¥ñª§þÈiñöƒœT&0d$)¸ði,ÒÁw·ùÐc'«Ñ±¨«pá2v†Èµ†ç1E~ÁÊ{Õ]Ýê­¼g=g!Œ‘áŽ<ã` þhÝÑ/a…DÔÎpé\h×ß‹,8¾7½‚¼òÔÁ„#Ÿ!Öó"U "½X=æè¹7¹dÅÉŠ ÊÐÒþ‘NzwÅÇ?•-ÏLZ±cÓ*=,v–6[¾óûMÖièB~—¶#‹·ËXÁ#þ'<ÿ7N÷ 'šî¬Jp=À´öT„©Le`C¹ƒŒ²Ul)Hìÿø$„e|³	ÚÅ‚¼TxVƒî›ƒ9)q	 Pm{-®`´°bbZbjc`Øñ•KÁÇÛÀâ/‰ÿ²ã¸¿yc@e,6(öõX–K¬@í)'v’8‹="nÃÈÁ&¨zÁÅÍâ„'@,Ã>§Ã>Ú0ôÖaà¿d²qµ°¼†GøWaáÃ8ŒrœÏlÿ“Zª¤„Ò¥ åQxqàv‚íìqùmØ„`û%Þ®ê’0'ÐÚha¡yW
íR› .C¬’æÌ)2<Ñ–êïl±ŸOaæ†À{eÈòShITj‰XÍåulB-$<·Aèëô¥¢j‚H,#>uËP>v˜¾š`Þf‚™L‰TÁ¾æ¿¬ÙWo3oK‰ŒGÝRÓ…åa÷ƒ&ù.a¨ yAÜŒ‹ÎÒª	>s"åÑ¥Î3ã£fÈíŸOyøEùyet½€àÄÍ(“0$¨ !X.]Ê—©{‹]˜/¿ÚË…i ‚²k:/ÞY.b¨
â7ÔW¤ŠG,¬^	-È?…ã>&ÌÌ˜8øâoÔ?aÄž9“ÈóÇt¶vèâê9‘¾×â;,¿7úëUkl¡øS¬âre‹X›¡?“'Wç‡8Í#Ž«^;¢Š”ƒ‘’‚Â$èLìxQ[)uŒ´V¨}¿ám(
àÒ²*GLU®,µ^NR´÷ÂÄŠãY3ªq&gæÍù¡…_˜`åN•õfážK@6P®‘‹”ð6D}›¶y‚ŸÖ<k„—l‡œ=ßŠãðê”*6@]«”I¾‘'@tQ£&VKðF€d“0W¦EY1àÛ®ÚÓ¢$©u°Þ¸¨«sÓÚØUXÂ(‚8Á _ CüvNctL ×ÖDÏ„R\¼ÔlÍjð¤Ò{áŠ¤îxB–[ní]/q'çÓàÆCŽªd¾sè¿Ši/¹öñý÷†ÓÅŽÑçý‹.C€-hüØY@äâa+ç[àÕ–‡Ï\$E`z!Ïšz%& óM8±˜…›E—BÜâªÎRJsY6-Wð¹:>wb˜¥f¸ÕõO”‰à¢miWÍ¸%Âç™ºeêµ$…5]k?ŸeÝ„Ÿ±“g‰à6¼Þ#~™3¨Qü‡ê7àWª¼®Yñ[èÌZ×IßXç7@ßë¡¶‡]U³lØlÍÝý×eCAnDaÝ&¼U5ÒUñ°¤§\ƒ¹×lÒDÎ¤ÇU§Ø[»[4<’o´ÍH;#÷ciZÐ+ÇÓ"³hÎFC¹(å‰m'nà45£xcv&h¿n*]q¦bfÄO¹8B1q?Ó–SþQ6Ÿ®Â‘s˜¦JÙ}~ø®ñû`.3'h,V:Ðš\ŸgÐ¬ÿOÓ–¹u"wÕE#ü‘| ‘HÐyãâýTý‘úŒH—{R¶¶FC‰¢¨½E¤Ô/Š½Óàä—ÓÀ±éÅ=e³¶ðp~™/3„Þ,{Ù
é¨ºõiLlY*3Í"FËCžµõl¢ýËºµ–C2Š½`¼°T£©¯Xýs.aN¼eä™¶Ô'E®»ÎxQíF6OöÎÇg†RL/[/¬3y7“,4$Í©"‘â=eK¿ÍLÎ7=à’åmÐîYÛ¦Pá«þ¥i…YþPSƒ‡þ4G7ôµ;ä~˜®ÚóÉ™Þ+Ÿ)3ýå;u¯ÐÁÞw)˜µùÉÆïÁ³š•Myü
‹p÷zÖ•q{Cúý	 €2¸p-¿
Ð®
IQÎîD»0Ô;‹Þ4‹gË©ñlÝ'¹ÙrÑX]2«Wì:eÝÂdœË<cå<\¨ vµ,|&u1·˜Vf^¬¹R“ë1Æu‡ÑèFoê×«xèÈW6kkÒ–te¨@ þÆÂÕ‚…¡ÜSÏÌ;fz¢ˆÉm'ÈÉàG²4˜¶ÜéI&÷Üè™xš¢Ë¥8XsKfµU!àS×šØGû°ˆëhñ»[7„C÷íé>êù ¼ƒ4ô#x™'ôè“/kqú_ÿâDö¿ÍÒ$Úí;7ä>¼aüDúŸ¶DÍNõ°<Bš@ÍO@zîïÂ*`²;Ø“êƒQÉ™q½W^R5í¦Î,„Ý™ëmõ÷Î@õøéíÙÖÑk…sôŽçZî®?'
?Z“Õ&ò+~‰yÆÈ»h¡¨8›ø5zêù~*ÜúÄ‘²ÚDNâ¨U–ðåšÿ™8ÁÐIÃøF$ò8wblœ‹jdW„U»êbHå‘$÷”GåóS
6Ä‡EyŠÇ. ò°«'°(?”bïŒ¹ÿ”1Ì‚Wô=ÜâÆÃþS¢üÑÂ»•ÎÓÕ©××sƒ§Ý÷èy‚Owm)ËL	Ä0D€âVÅÅ<`1 - m©V`‘æò¨!Ôiq`èDAPsšÁìóH:RñÃ–ö¯09­—¸Ü& ƒ)1/+˜À¼I·ŸYxAÐE¼8íT„i¡CFðÿmèæ^A¥¥v§YŒV‰Èy7ú¾—.öý0eC7ñ.ê ˆ oBÇ®‚KÙÊé“ÀƒÉlÂžôDZùuìQi¬‹´&¹£4íDe=8ÉÕ5uW?m¸~ƒˆØ…Ã³Ç0n€V:ÇÄ¹§fÀ0ši¸xó9t{l!ßA¹¡e=ãÒŒ½jærYCuLÙòiY)†èm«wîOc¼Y«*ŠÕx#¿øúú\Îdh8jH'µÌ›\Álš²L‹§[Øk«t¯/sºð®£Âgb0+Y¼ ÀÑY<@fËG„ò€Å¶? |uÅ$y"²ì
Cÿ9‰Äh‹Ø÷›yã²«“êªud¡h«9VÆÑD2Ê×¼uØˆ.”5[gÉ4«¯Áð	c$ßzÈ\wæfì“§U“6Ê§`}Õ¾e/†¤°aT¥RÚ"UTõ9lºEÝ·(ü¦Þ›i·€Õ¶Y›eÙþ}jŽ§KPÊWëÅidß”µž9´%£³¤yÅ(ÈÌÚZý¶ÕÖ²5³¢vïòIŽí>˜}y~üsj¿Ù!õ¯Mý}v¾úì|M¨¿ëîÊŠ3|TÕßGõ÷Qý}Tó=ª¿_„ú{óÅù6zTT3…uàý¾æQ~=¸ˆFô)Â(ésªÁ‹ékS‚/ºƒ•¥¡_,?t{Jð£ü¨?*ÁJpÞ G%ø‹P‚û£0>}¹í\>jÁÆE–qUuàc``ñ£úûê¯¶ù)¿õsê¾hôkS}Ý§+ƒåP}KËÏzçªï£êû¨ú>ª¾ªoÞ GÕ÷‹P}wbwè¥$Ä5_Ó5_®ê â»ëžÁ:øX<ª½Õ^Dþ«ÐzK.<ÏFª«áèwÉïòÂð„¡Û­iÌêÑwST%ÆQk5øá-~&ý$vÐÝ¼²Û4‡Ð,žSÄk°Ã0/ôàoÐY%0³ÄR+¾ä^{é=êR×‰wMi­€M/qÝ¯ ô¯éÂï—¿ô^HÓh´LÁÑõáªõŠâOpÜr˜|ÆÙ-rDg09ãQõåB|?râ±nc¼¹Ô°MÎUÊ‡2"-•6‡=3ü/z³µö|±Dt
)/«0È{G¯·ÎÞžn}àÅY[²n|Ù ÆÎI›ÍþÞd•ò•ÎÇeØHÊÓI˜x‰wâ´]l?[b‰³Cµ5Ài2"5Ý€*V‡”ÊãW¶NáÎ:Ÿ‚‚Ò¬Î4ï,Lðÿ\á8O3£Ä5C€h¨cêõøY=Ç¨ƒ=âI½Õ'õòuÆÏç	^b‘¦eìV~@//eM;n–aAÌzîÝrÝv
îS™	é+v¥¯›JJlB¦*-8#0U•vX}ô°  `:y¸l¸Ö›ÆÎÞï=°8 í<ežžç9*²x²ÿˆgY=)$éIžƒ„ÒžsìþäL#4‹ÞÖØì3¯?;$“BôÕc®Á[³t?˜(#3Î ídÂ4¾Ù0¡Nü…î²oÙv2“K¡mgä$E€£1àçòÕE™ÌÚ-IEÑñÕŠÃ9È{ˆ‹Æ¢âÜŸºª¨ ß3‰
QB¥¨xþÚÏ]ë’¡"t9A—ÌrÂLâæÕþË3<4Š“¾Å™OC!ÌßÜ±¾ë»˜ø)Š|i¸új_O<ß±s¾ØxhŒ1r¡LëO|ßŸ›7Eµä!S9äã(:¬Tžé/{)õQô†<CùÑîñÑ^‹Æ•ƒýþO¥Q2û4¾t‘dpŠHQ¤^|H9T5gîäAM:r'R¦@}M¥L¶%Éqe&I£l,TÉšþ4°®¥ˆ|)ähˆisF„Š¬Iÿ¯!hv¶ÈŽˆÉÁzäÝÃ/¬ïaÁ";Dâï,Zˆ?ÑÐÀùD5¦m–—ÌœÐ	ÇØ0¶­9S!¬P¶¦êL“É'ÑR¡¹˜þMsBEô=úZò!=JÎûIÎ·còZœ¹ãbÔÂý(@ßûýQ†è°©á«"@ñçLÒ“¿_-:Ïn"»•&ÈW^ù«HM ò$7UNúº5D’ ¶°Dör+ÆìÜMœ˜ßx´Ð@Œ
.ÅGï:™ «˜I®ýËoXŸ¿†BÉA÷/{ãp{Ã"Jµ:g¯2¯m†j|'¾tgªæ€¿>¤™Ùäô¡;ô¦BN»CÒ+þ>rºŽîäøäí	ëïìíœí±ÃãÝ­ƒ>{u|
ÏÎö^÷›mú'ŠÀ-íú"mžË¼~¸GÞ[zß(ç`aÙp.g*EZU€ïÃÊ¹ÆØ‚òcåh‚ò35
e­B”ÓF,‹(]+GséÛ€‹…@0>EÛáõ'˜,AÝ¦ƒ˜‡fðP&ƒÚ¨6=«&m†UŸDºÓš‡7Á³¬·
¥m]`Àófx-eŠÆZâÄ¹^  Èd²Á¿+¡—[÷ïz¡-¬Ùã9ê¶ó)(°´IÍØ_ú8zŸß¼!ìÁjA
˜wl@}‚zÕ8:_X‘=9oŒ^‚alV{ãëÛfí¶–ë|g:	@¹ƒs~'¤št?óì½r{Ã°Í lv÷6VÉƒ¢¾ÜÑ¥z–Ô:sÇ—Åe®·•[ ™ê­+Ìƒrn(îîÃy‡÷¶jDA X÷qP,šwmEŠÃòÌ¾ºÙJ“v%h±`l%Þ'ÞÀÁdÀÚ}à€ƒš‰±(†|æ ¼'#v¡¬”•³VYÙV±ÜÉk#ü–´.fªTÜÊzuŽ×«šqÖ \3W¹ó…t÷Ÿþ-e_n×K"ÌùlØ‹d<i*Ôý¦¨†.vFa]U]¸Ð0×‰1²7Ÿ,¨ž|€gnÌ=º¯AÞGM,ÂÆ'¹&Ã®¼tÄ†!üôÉ&Ä½v1ª)fŒ‰1ùèx±ÈßèèfóŒáÞ3†«Ø¢êî§ÍâG!j:\¤†·g™®Pv¨i_1žøÅµDÉÊª	«3ÖÁXýÏÆolK<Œ=­ ™hÝ¶½õÓVË ¤Õ.ÑZÅJÆo.Sä±Ù¹óÎ,žÜ åyæ;ç®Ÿ¯îý`‚†íáÁÜdz¾5âJ³ƒyPÂPÊ[ÿßÿþ¿ýŸðï´ØÝ|uen T¶\ú^2Êê¿Yû--`6õS˜ìdN«çÿ†ÿÔc¨æ}gâDí6ê„Ö“ @Êa ‹ÙK¸€Z6™¶êñõ¶¶|ò?±+90ÌŒ˜Kªpù»7›·Y6>ÕèP«ü ú®œðßÎª`N’M˜á0kþ1òûÆÄrü£ëîÜ;Yí)ïÒ–UÁÿž;ÚçM-Ê>ÿ(“]ñêø»ÿioíÕÊ«Õ÷ÆPØbZscNóü´ÑY–6¨F¹QÎ6¥ÔXg‰5gÃ&í^LêÛ¬ÚOÝ44õ¬i®D)F×-Jë_.È¬Y¦ôÖTÝ/¨h·{Ö,Ù•D†…Ð^²V­JOzƒ"ÖÖÍ¢Î>_ø±Úeù‡ q]ûª¥±±Åg|Aú­Þ; ŸÔ7«Q×ìvÙg§|×tM©á1^ƒjó ìMd‰•©'3kÙ–Ê–\i'56ùÖžÖp¡ª™ºUú‹ÖûÎÈ…E«iqy²Û$Ã±»ðnù½Ý?€ŸÊùµ©~üc’wÆäë†:93Õ±·ÁÎö*ŽŠIõYµFËM¸~—ðÐŠyÛcÞ SÕ>?AÃí‡@d|0NšY£dR‹¬ˆð`»î…3õS%ÒƒµÅ5Ð*-åÓXŠ}¢ËžøˆG$y_¥wŸÜ8tƒKo<M=–Tb©´•#²SÇN	ñ‚¬Êsõ˜ó°º!¯ŠpÓ’bÝg¼mq@÷ãmäð=4ì}æó3Ày|šË”Ûüð|	3;¡È®‘{:Â¨TOÓ¡}„£iùYpú}†ØûtAÞ	'aœ:ç>çÌ¦¾D_
nœ	üzl‚Y—ù0O°Þªa~HëL#aÓ‚=íoó›Àøò{|Sœó"‹ó`†Üäa9òƒªV–ÿh¹=Zn_ªåV‹ÆCÑLj`Ã|Ê"Ûã»­O­à$òÃ×.²î*³¡Fí´7Ÿ¿ƒ½‰ÂõÑà|48ÿRçò{û†À7ÎöÞôÙ.`À÷ý³ý7ìäôøõé^¿Ï¶·NZ¤ÚÖZ­Qj7E±}|G-aÛ`ÐöÛ
ë§nÄvmøxå
²` ÉÍÂ:†o›ãOòè´KZLì ÍU”+ÑàñV8ÂÌš ™ÃÚceA¯ÉCu[ ŒHX¼Ù[÷˜WuÛíacòSÛ3Ñ£¢Vu™‡Cj²T£ÄšYW°çtTŒH•Á¶Àj–þ«†‰Ø¢fáÝååÎòòÌï‹pXx¦²ÁÛ­µµÎÚšýA«f^§ÇÃ©Árë¶"‹á…òC •Ù²ÚŠc°ë›R~¶¼(Ì­ÖN°Ç-˜=Ot‹yÃlÒóÄ„L)’y–6\ëö¢køî¯)LÑf$g…ËÔ[Éë6(,c(Nm!_–Å­åÅõÇ	-/	²ÂÖóÂ–¦7~„ùqTcˆrÜ^:Ñ;u fŸ'¤6Ï‚)º‹^€i~ËøTð Oþ­Pï¡kØbh9µËnò
Á,ŒP N(8¯ý\rïÙË—¬WWŠ—¸©¯U,°ãë_?z&·ƒÒžÙû×?š×~j
ø©s*à‡¢ºj³àZîÑkáAá.°ÜXcÄlÁ½X7
Gœ@L“pš"š-‡¬¨ªFé·`Í•? éùîOh&#_”‘É^•CyóÌ‰”÷–:ÏêßS•x-£¸—Xó*3Fš?ºæ®£~6ÓÜ«pœkíF–µºöÁ²Ÿ+íùú‡IM>€€v¤Ðe©àÕ•ºÚÂäŸl1~R›U•ûrz%¥ìi9p©¡‘YW·ÝiÃ?õ–hN{Ul‡ÊŽ§].AõJ¼Xáu±ê ùgOðÌZ?~ÔG­ßÝf<˜Oª0Õ9B/:Œ]ƒ†ÕYè&ÔBã“…ðáÇ)-³úr&)õŒv6~²)®ß& ÞT¸;è<©SY+xŒLÄo<,•/ÓãæTŸ°–š8¥H6rJÕ™XO®?„kªÞE=‰®?µÕ^üXwLÞ^d5P®Åºï{ÏE†~–ÄñØ6`µØõZÔ}\MGÊ'hßF7x*F•-™[/­¸«ëšH,†ô_'vW£¶±’gX(ˆv=ƒÃzm˜«MnXP2ƒ‡ÄÃÐqôì”ÒÈÅdã³…—ÂÅrWwd¯·ŽÎöþ¯áYÇQxuâ÷<ë¸Üð¬cõ1¿ÂIÐO=¹×ûCOî™j›w‘`]•äÝ÷P]ævA-+è©¹YÌEçF·cãÌA^Ÿfõ¬°÷@¯flÖZÐ×7îÍ)¹SÆÛÎsVöí¯®}kÈ*—_;Aê!²ˆÄÏwXhF þ!8Ud™o\í@ŒYEÃ¥c©Â™…M·/?që¥mèG{3’orZ¥tçóO!$÷:Ÿ²ÇaÌÝ$A¥À°¥y¦ÑþM%ÜŒÎÓñF¯À"ñš@Š«Ôs"Ó¬”µªÇX(ýhðÇxËwãtÇ‹¾km;4¾xäËÁ²©Ï°÷
3­ìÑÔ¸·eæ4J,ïX	®x*’µ½F í#'A¡ŸPÖ)¸_„ql‡¡ï:H†åüç?Œÿ€NÏ™©ÃÞLk.²ÍÀ·Øõie	®ZØeuìÜpE#¤ZZoÙ±g\ñh2¬¶îòlJ="W°N¤‘O{$.Z ¯ñCu`xÜf+˜NÜØØíèÈIai›­wKÏÞÿÃþàGÇŸBÓ`9AËˆ¤*ÃßÈÜÝ•ìý8±ívRÜ!H;Th'v#˜b·½øßw/ç1_…‡A3Üx³uè$Óñ…L!â‚³­`èØ;Šç\¦£ÍÛîR“ˆ8iVF}u×"§Ë}#Š~†ÛÑ,H‰q5Ñ[Tï»pÈ›cÞ´{°5–Q±ºÝ*„<ÿM·øSö©±*r´¿-,‹
"±§|[¶§|û4É_o ãÇîu1,úç{7îñÅ…E f€XîÚU¹fMyTd\ô¹WŠèi’T­ZNüùR{³íÄSãØX%ÄŒò¡Z:<€lh.Ê!÷ªN*˜dÂQþÚ'È»D8‡	cm:|1gëA#‘ð(Š‹8¨MDÁ
‚/TØ±;þ P% î—JóÂ»å¯Çñßðž9‰w_æ_ÁÍ?™—7åäø¸àâÞãjNnâã;ú‹÷æå'‹î)/çãvÍ¾dàú§y> ›	7¨Ã ‰§"JLù”mÙ“ì}uÒãa|ŠÝÅå:'báŒNO—¶ÎMóÍÃ˜^#©4WØ:¼ÇqÛI¿±wñA&‰G®õ.ÌiV†^‚G‡›Šï|„A°<XØAYèVmÝWŸ¾×wWß-už=»çvn>#+êŒd1OÅ¹©u?ó …8;9b“xV³iUGÎ.TJÐ˜Ý(m0q×¨à8=-£©ü‘r…*r0ŽRwÍËÜ£IäFÜµzè7 Ðétª³ôš®Ûƒ“xé"ö „‹½lãÙŠJw»~é!·¿ûowvðÆÖÑþáVý;ó&x:Pž½Y·ÁWšlƒWmð€›mƒg›ÑëóMáó=ï&@ÀM+h¶å)Ç±–¯µ<Àáµ¦M(y2ƒmàÛæ¥#‘òëâòRõ&¸áÐ&å€ÿò}b
Ù¬Ýö-jU®ûsxk`ò}ðÃU|/¦g<VÚ8q€a+ø¹vcÐÍŠÝÕÖ2ÜxFÏv½é¹3úÖ´ÕkÎTÐÀ ¡fN8:Õ6–Ûµ¨þB	¾3q ÍCØƒ2!áì5æd\Â[¬?ìy§´“û°œiEÍãü¶¿uÆö^Ÿnõ÷¿€dÎzƒ²ý=3:„Ùy-W^ ë„‘´[£4’ÅÅ«««Îe^úngN'N”,&®F‹/ÈÛì~ÿÛÔo6B.8'Þ»S Ï!$?ìº‰óÃ/:á\:1b¶~2Æ_ZÚ—¯$ë‹;qcÇ×¶âå¥™Â}äK:ë—Wk‚~ž:êš6D”ÚÂ¿à1·i»%–ÐY8‘`ûi»°®8t.î—“ð[KËÑr›g¸Þ˜¾Þ´ûù-ö/Ï÷y¦Üûgsù¢“qüá²¶ :ÅØæ&¼7 ûíªh·Ïy!ü±ê=+`L
{WfâŽâå8O•¼ñ'×LGeÄ([ñ_8w<™&N*iö˜íÐð}qÌñÄS'¸q`U~Ïþé\¶Lmþ~n=²¾c}?MÏ§èÈßN¼û0@³òét&îâZoýéÓ§+Ýåõ¥gK
ä'2H‘MaâÊL2+¥FOä¨ýß¦Nlg‡¢0æùÚ¾pv¨Q>’ç”í`æºð¥1Äç†<¿Œœ4Áä‚qCÃ—XßóoÅ%kR³í„Ñ±äo
ö.ë-õÖ˜ƒl
›¨þÂ¢T~ÀœÖÈ›¡.U˜ý'vºXµ;PVÝÉ{m™þ?ÿƒ7þ—­Ó·G¯ÏŽ÷•ˆªÛe?išÈµ*ÊÄãxK…çŸœ1Ûñ¢Ôa»žÂ×˜©q…	S^Ê¼ý|
S7tÙI3æ‡ÄòyºÅí¬ð‚ÃÁt‚ßâ):d›^à	äh»èCdM?wªÛ}ñÂ—b¨¿¨$xUû°ú>}?`­Æ]]TdÚ x6¯b³œ\«Ý)°”3ì4­Ñä`4d™[¸r{ÙÙ9…é·à,ÏÏ§ÍvÜ5„©4«À5JÁV&ºMN<ÄÚ›éŽ°«r&ÇÒ˜5éÝ“ø§4#©=ÿ9&g89¥MKïŒÊSù¹Y“UðüsôcgŒYžS3Ÿ©³ªK÷T’r¹UÙÀµÖ‹×ÓÀÁHSŽŽL…3N<6p#'5ªvµô Î«êOÄ–÷½ àÄ±VOB u!%®®™Áøl+ëˆ7¹´}&ñ`óöƒ´ÜœÈëü' @º1m|ì.r	ºð[¼€Ék_bÞéÍÞêÒ5üû~è¤Îæw· CáÞÛÓýp…´º=€.„7ÞÎÙAU?Ýlíˆ'¥´·Åžú¡3„yÞlùÎï7¶‡†.´„žr’›ÀA]¶:GüOxþow ŒÏ»n»ñI¼õf³„òÒ¹v|ÈF´X°³€¹ÙHSt_7F>ÕXÅ­e"Dõ¤7Þò#kP¦c6·jUØ&šõ=,®ýÝv›S°Å4ÇäÙ llw*(oææ8tRÉíœ‡Ã›o²WeùÀýèúlÛ@ýM“?R[¦š³Šgµ¾GÅù³)ÎÙ‡×5ŠþÛ«Ê¦üÏ¹j|ƒ\†¥±†ç˜=@2NÄ¹pîfÖ™×ÌøQÏÏ`µn¬ú²À&k®+?¸jüÆE3¸Ä´ŒÄ‘ã@=wÍÕe.d?¯¾¼Þzqä{xìœÓ<sÇÉØŸ&ÞÅ6ÝOaÎà_D&ÝUQ{ò’C£ŠŸLâœzê”ÖªEÛÅVð\ w—|’:qÊ=òšæTÐªìÅK–"÷ŠÒbpÝ€õlaxÒoò©*·ÇãqôÀšu J©;¯Qö
ŽÃYrÄú.)ñÈ»QúV8éÅìÛ4ÃŠ>˜Ž°Ü[³žI@ÝGþÜê¬àKg!(u ‚Áþo‡-³í©f{S­ÛÈ_uW·z+ï[/N£âRN±:øão|·O¸ýÄ.ìï>±m®|a
õÉ(LCvÚÀqÄÔüAjµ—Pí¼òãÈÕêGµÚ‚Õv4Ñ¨ÿ\§ó~‘žï¡T¯¥z¥Ñ1à?'÷x3¿2¢ìvE–ÁCïãW^.ñaSŸvŒàln<¨K9ù$¤“¡á„ŠöŠXp^x¦pŸ¤D×*Ç4ÆfUìÄó½KH…‚ 7˜æÞôÄi€Kî€64ú>ª´XïR£¶¢6Çaµ¡W¬Uô,¼ræMÜpš¶yÙ¢8:n|ê^tnÿËÎ Ðž›gÀ,¥YpÚ-QBt´¯`‚Â|Äá$_À:Ô¸Î+è%€EpPäÝ\“ªÜìGË'Ã¦'+ÏŠPgW›ÃÌ9€¶Ž^¡sw[“sÏGeÓco¨ûy<cäZvóË ËKT7¾ùé2—¾†SÉ
;z:ãIc…ÈþdÒÚŸ R¡áªîâª!4ÎN‰Ð^Cb¯	¡•ï|YæÃ+$‡þ l‡™2ûoa8¡4¯Ü¾øƒ
$NÞªöm\‚[þŠ,Še´(2ƒáÙjÁ`·ú8§$EÅ2¡lrÆ,)µ
Zõª4¸¶”¯ð0ÎWZ»[z 0
EjV’1\1}+ÆC•Y¡[M2ÈR)E"r¬OÕdÓ|&ÅÙÐm*õÝÜj)sœ|Ø9’‰ÛIÀ M0r.é@O»d;Ô:®mÎ,òmáo•ÓÆÞ*ƒ]éucR‚Ú\£œÉ+ÃÆÓ` ëJLÙ»î*)´ÉdCZ€¶¼yù+B„¶uÚ+?Rj½Õ<àÝOW_µuÅîG¼xè¤£ŒH{©³:ÏŽH;oó»)ç:iø
™I»77gºÑœ½,ä	6“âü
ØïÉ©!¨ó7~R/õ¡ØIvŒ±F”4‹TÅ×ð­Æ*_%ò”9µF·[p\òóÑa22qÕ°YúÎuëek>[š?ÁöïrrÙ?H+»û¯¨õ¡(ÉÚ+:úák¦£ý€µ˜•Œöƒ‡¡¢Û|JQ£éVÄ+Uæd«š¾n´9<îÁQ ºÊ¤¬–&¥<	U› €ñ¦ÓcÛ‚9.µìzØÇØØý‡±¾š«8Ù+UŠÿÔ[Ubåps:â“M“¿ÇR¡Q•ëålšN£VJcÇá=,Ê×¡ã¹5Á-±'øèÜK)èLW7,3g
*9g-á¥Ë	ãÄÌHŒe#çÎô,†VhFªåÖ2 WÀ2}z´ðn½÷qô¾HhÊ+ÔÓÑÁèëÂÌg™•˜džæ€Ä$½ñÉâÊJØ`H´¿Ë™îÝÜórƒÝp
T/éïàÜ/áßë¡ ,—h;õe àm~òfkòÓÍ˜DS8¢sÐè?!V;˜¹ôxªÁÅ\ÞªÝ”c‚V\È–a¶š¼€	³ljåM¼ç‹áÐ½kî³æÁÑH"ìÿý_ÿ&c¦`‹ /ó›ÉØñËØûM–}æ,¥üï'Àõ°p0w?~óO‹G›O(¯Ë¿%ìÃ-à Gò ?	(þÄ;”ò3¤Ìó|eÙï÷üµ~J‡þ[ê[î5è¢0wûðß5½·§^Qß|ÎƒXØŠÐRfe]8¿%ð8Ïº,eòo¬µ9À”§ìÃÿáã{)°{~ª!ŒËË–A^(>8ô.=ð9C‹"LLîL”ˆòÃ)E
R˜¸Øh)ÄVx¶1v#(‡Eò öÛsØØ™x¶ëRÔ˜UÎó­‘¡9)\N'ÑÔÇQ.ózéýH‰ØG%x–â“Ø9b+]:Xoe•7<q“)Üó)ìjìb‹ÂÔøLÎDjguT·±DrbØ€Ê¨…²]úˆžPK½ì‰Ä¥—`9aüT"ÛËÆã½ÀÐŒ§T ïÁ·s=ÌI)óÅÉÎ¡6ævâ€¼Å×0Æ^*4™	kj ÷Rúî¦póßÆlÔrXÏa¢ð,=<,+€QÂµK§8@•ü=á!³ô/6—>ãêsØã‘ƒ‰!ö„†5£Ó'±ÃÌÌƒŽÒæ•D;lXB;q#7N=¿qÆì2Œ]ºÀþÿíó|tsgÂ({<77Ï"9®Ô*t0O#ÌŒíOÙØ÷ÆìÉ™h(4¤ïr`/:XÕÎ$rèí±+Fz‘†cÉL#$yÜ6ÉfÙ>Œr5ó0Áì(>~…›P]êbMð•¦]ÌTèi³‡.MÔm–AcÆu…þçñÈ‹;lnž»@0)|­l°í8~wçYßóA¯›g¯Áº™g'¨Ð¯š§E¸ë9`ÜqD&3†Ij.årÃ:‘ëñ[”]Â`ˆ»mÝÒ¤ž{‰£p…1_ N¾ÓÊ”§¢±'‰=§2sÄ./4 «Êß ¦|kÏ8L¾.9Ëô]„ª˜ »x5bo#v2õ¡±ß³]h+ÖuC‹ï,»@Ó/Žõ;Î¥7BÞ>ùgîìnÂƒ˜G]¦9«\ÔñTÆ½…_p+eí]¸¿xü¯ãÅ× ¼ÜÌURÙÈ7Ãª#v’@ù8NÿvQ ¸>¡“f7;’‹MÜØŸJðþØA˜=GJÄõÇqý9Š½sX¸œ‹äŒ_äHyÀ>Ç0°(NRg4åë‰	¹TiµvhDYì]A[S¶GœŸW"£LPPÌ9»;adí!c#¾Ø€¡ýZÊGˆÂL‘b”H–NÌúmåpÆ
·‘@s™ËHlÉŠÌcrúùÁ~…+NSø#_
Š Ïñ®TJ†—«p¥Ä|	¬"˜ãq@"‹Ø¸,Züÿ^UJ<ÆÒ¾âÊ	ê(~­}*½tÑùbþ®ÜxÇI@­êxÁÀŸÝ¤­hUú#sh‰·Ùßæºß7x(+Æð)¶²,Ù;q‡JÙ~²dêÔ÷¨ªö¯TÛÐÀ Lø`Ë…¦‰Èˆ)µbcÌrdêš%·åªúÅ‚xíUÆqÙ°­ºsw…ø¥F	?@WÄci€IRzÐ`¶âOb\Ô!PX°Ú5÷KÙéRÄy>ê–wjüÙˆÐejéùâ¨«Õó§ù‹¨r®’aÒ0Ð£2_„L‹³1hæ¼-ÑNùXÀsQ‚)QypÞm©A³¤ø.@ŒÒCpðt|­¤]ËŒ°CFLˆ	gÜQ6äNGwIˆÔ
oÓ½¦tŠ1ZHåP¬T>$šÃ„7=ÁÜãxIÝOÃm9Z“÷#_C<KBƒ¤
¸G¢¶ŒÀbÅ­Ýîê/–[£×W[?“~VI­yc=žB‡Ÿ2\° ^j‚’ŸcY9âgè^¼ì\ºz‰ô€lÕ\	”œ^Ö}èš¸S(·*š‹Á²Ê~;‹x¼Þ`ÝºÈhUR^[â¡óYÂ7†Ààyjû[ê,­VÇBß~0CYÁÛŸyPqµw«îKöÄDZ%àüîê¶‘½ÔL8™<)zÿÄjÍ›ÔÖº„þ#&³>‡SÓqòQ+9ZÃ˜éòá@=óo“ µìøS9GoiúÔô¹Ç•Ï’ÂátNƒóQV¸½õâçª ´Š¼Ø†M–(.áígohqÕ·,{íMÏQ5ÐÂ@á8Ö+WöñDÞèüÖùÍ–áÊœ{»éÞ~ U¦[³obZõq˜RÓ×—¨‡ô °ÏvÃ« @×\Á˜mü,úÖ?SŽõŠ Ûª¸¿lN”6Û7ÞsÙa™ZEHŒ\¤/’Ua|ò£Hùf·[Õy äGZ\3ÖZ:‚@ð4Îò<sa¹@+ðÏ~p<µÎZŽ²„ ð³më—tèkD'ym$>Y´ÏêÊ0ðÛ<eDsÖ[Qcc&©'§h½ØªJCåVCµØJÝ‚­4Ë	úÜV*0ÐÊÞCsìm­'T+;hMæã!Öš¥n/S‹À¸+§à)QæÍB¯ú<«2YoÒ%›\óXÄ2ƒÎ¢xX—CÇ¹˜W²Ì	Ë†lU[—eƒBbˆö¡!(T¯Â0u«ag=='VŽ¡‘!h¨[Û™ù\äDš[¨F;H·$Ò!úÏ2NÖ²ž¦ùu&1=,`C×m3cÀnÁ^6œ3ŸI&v]…²„dÝÃ˜cô¥ «Wñ[8^ð²¨Fˆ‡÷fmÉºe7Q‹ªatZuæM¸7ÁÍ>ÜEgÜxÑÜ©¢šUùIªò“yö„£*?±ÿ™ÙT0½Aô¬óÓ*¥0·gÍù<—Z1€Ñ¤¡Ùñ“%¯ô‚«VöÜ|Tü«Îü´€ŸO÷û÷	ð’<þmžFÊ/hAòLRö.O¥‡Ú$˜Á£LÆÔ€»4¾Éœü%`ï|Á&9WŽ—²7ŒÚ¿Å^ò6ÎƒîøÃç~xž=(ßìàÕváÉiìÃƒ‚¼ÞžtøA’cŠU‚ßm|©ðŽÚ¼”EcðWö|µŸ8O²çñÉÎ(v/p<b_»<Ìûÿ§âWŽ]û+‚×v¢àò‰|Z‹úè8@yÁpgäùÃ6–£×%Îm™_Þ	ÒðªÒýØýŽ•îO³±½cFœµÝ8ã9mzBßíÐåö“lZ/s ÂŠä/*£¥,fOY´?f;-w÷ßÂ¨Ù»øä]‹¥¼qaÈÐd2Î×sIÔQ)Ï!—_î}i ÛK¶54×ÖrÌÆÅÕ²`[î‘`Cù‡‚=J2!Z4……¬ï!ØjæÒKÜGu¯ Jÿå8í+KKÑêãX,LhHŒ¢µÞ‰žÍúýèS¥†`¬çBÆ¨” °¹ÔŒ@cÚeYÑ·Ylê´HŠf:§õâgXO¥Ý•¢ÆÖ›ŒPSQc°'2k½è@ùù”½¥Ô³,,g§,:ËV
.®
*‹ŽIá}^«XùÎ¢‚]“°å"ú¡@ŠËdT³ñà$ÆÂ&<Ÿ@+n™ZÌ¬Vk¹bºyÆ¤T¢YÝ07!Rä¼Æ…ý“ÕšãšÅJ—-'c3E0aˆ:&¬Tê†«2@¶›l€8Í£†5Ä~®Çu»K5®¶§K†l·3À£ÙCiù–‚‡«Ðù'©@çoJ½Èz¥Ò`­ÜgÛ—«4U`K½šn˜ì ãž‚d Ô›NU£sàË
7ß„xB>0«
_Ê-µ¡Š…”)LÎYœN­“Ö‹¬¶7(©~>-»£¬ÖEn»nå¶`åÎÄmï!™{éZ²ýà"´žWµƒ‰ß+hÅÀï |è—…	Y½\)«+ÆÀ¼ËØí»CimOÇN©ÅÜ…+0G{ñ“ðÔtŒÂÖŠ(×ùb	<ô£UÙ÷OøËO¶1|ï‰á…­Øy\âlŒ]6æôFAc©“˜*‘QqFiÂ{XC©ÊVX‰áÝCŒ·£wEØn”ÇR$„6¼ù&.¼x‚#£¼C!Ö²L¥gx;×vð¼|âxß2‘«û|:Nµ"• bùyÏ7Ã“Ôæ™gDp¬Änä»“Ê~¥)u‘™Q?WñPÞqƒ2úåkïÅ­Ç~`Ý»ÏZ7ŠšÅ^ôsiéoqš&ÒÀ¨Ò‚íÑUK)ºe—ªDE#€ŠzxŠ*pŠn3pŠ*ªÃ YÔ×2–Z½›¢Kq·\s†YUGì19zw\Ë¹SÃÉ,#˜†afÄÔhl>´©œI,”j‚\¯ÄK‘è‚v´”ª‚4ã¡XIf9¨í´`8Ò¸Tq¤q™o8f&h±ä¬™Ïçò‚™6¿*S¥WùÙÂÂ;y{Ðßbß³“­7{glwël‹í`Fõ£½£3|à›oÈü¼ ýÏ~DìÒÂ¨½¡/FªDègõ7d¨Î/wJ—HS,]Æ…Y~Ö^ºÛ—ê%?¼ÏàYõZÃL+‘×Þ½‡K?ùÉéñ¿öw÷NûZoÞ½ÒøRÅ~µRÐ„’À{Ö:sýq8É/‹¶nMž×FŒ6øŠ–#*ëu+?é-o©½—™/ñ‘^A“ÆkëÙkÊèpI)ëÎå ^YÉë‘#—7i/«æŠŒzÑË•íËg¥uÖß;Wóyy×ZZïv1¹üí‰¿ËüoO\ï‰ë=q}U\_×W—[ï¿§”Ió'Õ'm?†¯|B#ÃÐ4u¹c•OÞë£—fÍ<Ù£tóÿ  ÿÿì½ùvÛFÖ8øž¢ÂÉQ‘â¦5¶|hÉ‹ÚÚ"ÉÙÜ"!	-nHKŠZ¿3Ï26O2uoUµ d'é/<Ç	 
µÜºûâØAö¾‡ìªgÙkÊ>²kŽƒ!ZsÇ0DcGÓÌ%ÞñJ»º»ß¶oj‡oæ
ÿ»Ê7‹ÿ^¿×øßuë&Þhçîç=Ò½‰¨¤aÛ<Êu„âàE£~t1v=ñ¤oëð}çð¢gãÒ!dKŠ—Û†÷Ä®¥míàO[†WõÓÆ)mØÏŽCÈ÷¡¹Îÿnð}á×øý5û>7Q¢îT÷çÝÛ&Iµ¥é6Ïz—I¸ö){Ø·Sü)}¯øeÏnåÕ¹¶ìXV¿[ïÁ5½Â·ñ&}ïŒqK»'­ªºmŽÛ)¶9²lÛ÷‹’C Å©¶m;&å•ó†Úö+{Ô·_ü)}¿øeÏ~åâµìWVNXïÁ5½à°ñ&}¿ŒqKûeGŽ	np$¸Á×?|ÖMK† P¶í.Ç”Ëµ5è#2NBç)ãÏyÏ<cœ0¸è;_b ÌÃ%×Ù‚{éÉmíàO›g
®'J§´?'ûÝãSë­óµÎÔ:?Pëœ°­ó=\ç{¸Î÷pïá:ßÃ¯Þ§ž±Ý›
fü3XzÁž.ªœ(Ïš ºpôa0¢MYËzbLNuù_;ËKdYÚ£sRÅE¼ÆÒY6wè3sø`“îÐYƒ„Š%aµ±DÀC¼MÊ+×Ï)a­N0IJ],X¼È{c‘ŽìE `HrÄ³
±!¹š¥õ™"J0ÍŸ¨‡ÂØz:FùÓç…q4î+Ñb–<S'³AÓkgã1LY	@úpxtº{x bA6ØL*`Gq»Ÿâ;ºb|Xô5øÑåÏ6òÃÍ†üt³Å~±QmBÄPk­¼ª©¼«i¾¬¥¼¬¥¼¬Õ2Wzo)½·ÖòÆ¶ÒÐ—!k½’?³†¹0ÒÜæh›ê›ê›+–ù5ÌõfÈß‡4ƒRˆÇvéDQÔ kåÅ8¾Ý$† ”éÿ!CˆrŸñgPˆ„ŸÑ0š†ý›¼üÛl<Táx4K”÷}
QuvòÐ´ƒÁà¿(øƒÈŸA¶)ð//â²åí Ñø ÊlYRYZ“
[Ø
!‹A¼z8%¯ñi¿zNoòyWÚäÕsò‚ÂI«Cþé½lÂô6´ªdßá ÆfÛìøÀŽ¹•?f¾_–Aî¿úš¬)C^É†üiÁxˆ>€[¡÷ð—œLã²\ƒñh:ikh3k¯+3k¯Û¦Òžc*ÛŒON°f4W”™4•©Ð3FöGSr&òlÂ³ !Ûà[r2N†a?g*«-e*«­›ÔÉŸYz,Û´ÜÐ#®Nn=oŸºWI˜@Ó·ŠN’R$9³[_Qf·¾Â¦ÃÍîI÷Tž¨&ÌCÃ¾Có2Ã>¦·ä,ujVôSØ^:59‚ƒ6N9hÔŒQ7µ-iXÆ-vƒ%9	ÎC‚“w^Ômh¯˜“q|JÌ‰#Æ:2Œ­Â}Ht!MN9	'³ ¯ï« "Å;·¬è¸ 'cœs2–#¦óVCjkòDº“IBÞJÕóSw‰ì¾Z"¿œ.‘“É¬<9ê¨›ÕÁ3ÃNÌÏ
‘¹±˜J›MêçiðÚ‡4`ejÿaYÓ‹:Öf`ÝXŒ>b¨¤¿ÃY³¥‚UËsNuyòG–aÃ°£¼mPs'ÜXN™©ý¸{DZ«ÊÌZxFàÝ 3À~ÏNgg¡#Ð'µ¦î×š[ C‘'º+¾˜FË‡!•Åft“èØˆÒ	¥;åg\6¼¡­4Ì #s`ÆjþtòbŸ4W] ÿA*ÈÈ6ý…·€ÊI+Ÿt–“éåÏy˜wCÅ¼~(Â¹pT`nbÕaÅQï UÐo·2(9=ÞUØ‘8²°¹Ø—D^“ÉíyÛ¦Šxš:ŸDfò²úÀŒeì®ƒÛäpä[Âê>d'ëRñœì^Í¦,ã¢$ßœbpÙë`t1Ë£Ï-•†µÖs˜@:9“»Í[ö–ÊÖ¶V|èñÌ¥ÊTæk#Ç›ÇÎ6TvÖ&ê2HB“<+Ôã™ÐÄÕ{Þ™±ÿq<˜Ñ3iÝºbp¯¾ÝÐÖÐ +Ë-ÌD†9@¬OˆŠˆVeD”=|2¡<äPëŒŽFwLf#‚{õ`>PÒË!)B¦î Â)¦säE>“%áâpœ‘ûMÂØ$Ûü®¦û>kñ,»ùîý÷Rszc¢-T@¢³ˆP/mëQÃD„dI—äg§ÁÙËx<Ä,:ôI¹eý"œVè‹˜y…ç™ø²IªÒÄÿó1tì=Ó½ÑG0Z¬+~)Y`õIoUåqÉS›\RìÎê`GÙo¥G¦óØÒ2Ó²â6aŸG§‚“Ïkk\/ÒÛåøš·ÀÒEK¢fº|Qé‡«T¶$ÿÞL{›ŸìgGº ®Ugl­Êé‘¶ª¼©¶AbQŽâqÖ›*Â¯)à‘z·“Ð„Væq„™ãe½!Éìì®>S/s½Ûaüƒ®Ð²(«lê*n7ÓÄ=³êÍá™{=ó°¼0“à‚èöÃéå¸Ï M¾¢îJ/H.qÀõ¿PÆôžøã*H(®Â¯× ßð¿VIGØ“«{³oékXeÚ”%Äí"îdÖƒ&ØÁ©qYp0º5çÎ{ì1øe8;Û–¯xR?CŠÐóAðûïpØPvô«úHÞ½ßª¾{/ÇŠN2#}p?Žyé:ÕFR•ðÁâ’‚xw´õ‹ósÚ¤*Ç™‚t”ìg£)æ™”Ï`ÃK¥SDÉ´ºXŸ^†£jLÉŒä¦†”¬Ÿo¿… Sþ§ŽéEé÷n·õ(Á¿UqgQ~LJ›µ(¹ Ú–.ë@x÷1¯®ûÅ:ÆiB˜&VžTÂ3+/à›èÓnÙ)ƒnV0bs‘÷+0Ù¢)‹…ø=j‚	’¨×¿¥T>êI¦‘ÄØCn²¤kgÀ‹X	 8Ô$¥Ø]¸	j±žŒcº«å°× .œÀkä,ýNéRPÇIâeüÆÆ›‚u|P!¸×Ïì	NªòÎsk[0¥xMox¤.X,¥PYTSt~/4Å‚vø~VÌN\ú4žõ.Ã¸’. [r©µ82¸ðhzîûÚ Ø5ßˆäsäv ^Q¶ÍÕJŒÚdf¾Ê4uC8ÿPæ>Þ²OßùÒˆ¹o9ºÌ¹ë¹5l—Êkb7å§…2¯½7v«d 9VÝy§ü
0QÀÞ¿gïQ8©ò{~g·aüaÂŽä‡„’¢Y¼IAe`Üåñäâ¤ã ÓsþE‘ï]z;D&.‰ƒëÞ=|A¹˜¦Õ¨.&†ÇÐ´ç£)=bïTóÐ7Ñ IíyõÂhP­ò§ÁxC¥ E²Ìÿb±Æ÷êdød¿ˆïEr5ûÐ÷Ã,2†Ûæ}¤VÖlªÙMÎîIƒ–î	ÑLï[ªf£Â—ÂùÈ
}D@™ m0£¦GàN/Âvé7žœ’×÷)ø²ç29Œ)»Ä%¯t³dI[Ê	–4	Ñ7Fx3ˆ³xŽefK^xe1Fìãú)• @WB‡‰¿§Úï×Gé×ËIúõ`,]?°[•ŠLúÒWÉ´:áúÂ)_öœÃ&ë’»¶@(UòS4½¬.¬¶àd‰ô°È0-©Ue©·-òe•Í—]bó˜èÙ ÌÚIpTt.ï<¯°],ì*B‹ÌK¶ô*0W^T—¥ã@vc!-©» Û¼À5ãxD#ñ ÜàrA‚×Ó§ð"ñF5»$„r÷”3å³“½¤Ì*Íàâé©Î^X}· hÒÿP [x¿DYÕál0& €"]A" l¶xp\¢;)o­tù]ã= ®å’ƒcg€èÕµyª·£¾×ž@–¶’À5ùŽÃkv­f\ù¿ÿõÝjky	 Ôêì¹àîxy%`ÓÈ3¢_¢!iä¸|E^©ƒg)»"89CÎƒ4_T+,•#™`ít:ËqBe
`£ñ”$,Yê*¡/óì›Š‡åL@j`œH¶œ0€úX–M€å%‡
E;®Îµìmæ¿×”à
‡O«Jp,!Å¬‹jQ¨j1Ï°Öøål0#UJè¢!%uÍ+ô±XÏ¼ò÷
&q’MƒTÍ¶E™vFã¹Òè#3ès—j ž©’ ÈqxüÀÂ=¤ Ói”R 6Œ“€…¨_ÛÝYX¼ÿh0!©ÊéãñdŽ^8·‚Í&:³Â”TìþÈnÊÚ*þˆ|I~›ófúM cš—)ìVfÉ¾ŒgSUhF²¸¶ŽßDÅ¼{mÏ<âú5~™µ±žE®P;šA„y¢æ?cýµ¦]T Ÿõ5¤]0SÀÇ×Á`LºXûHÊD²Äª¦`}&V*lQÓº®ãêß“ªyG]ßûE^«Oñ&œŒ%ÜKK¸–ž™Uë(~ˆI){
“6	Â¿>Ü3÷A`"§ôúèÉÎ÷<¯Ÿ~sŽ€!{¼»=R^²¦ñÕ„³¥'³@tª¨¼·”cÉüçÒ8)”œë²h¥CTiÊ!‚CäV=T4¯2èRý©B«z|¥Ð—R=¾b(cøøI–,dLŽáæ-ËI1(–‚¬VÉ=Æûíö7˜ÊH™%ÞZX´Ýiöí×Ûý…œÅ4Yý,²›ö—­Íñ²Ôªhéï9æÕð¼+ÛÑÇP÷I
¿lŠÆO×øK³ÇRÕ\U†!¿â«ê‹(Ž6Þ–òä›$•Äå–™7…äi?Ê­Íl·äŽ˜ÿ…ªQ”ïsŒ¨N7®'ÔŠöG%ßŠVkô(¸
Eð™˜1ãu0cQ'y>ãT'Éu‘êÓùÚ?
e¹ê¿¸¦@ ‹öÏ¦äË õ^ÑéÊñ‚O¦ºÐF¢á:}´žA ¸vvX‚¿¾Ü‡Eß=ùžü°½k~-3ŽÚÔ¥shE—”w+z,ÁÌ	ÿ+÷uêP“ÿÝûï¥Û²Ñ:}$m$3õ¿ešö¸èˆ-ï¥EÿåÜRˆçŽ~¿e•þ°‰¤,íqÍh/Õ…B?RKl•®²ä…¤Œÿý*~±4º"R“]Øà‰u×ç¨H;¹ˆƒ~DEŠÚt\;‹	¸fÚ>EþZë®¯½‡xWøÑÙYY³'çÅ‘4¥dçzJNžÝnØ'µáM­E’á&|éÁ~YÇ$¦üú´¦¦ùýr9|ÿ°¬½Î—ªÙzÝùŸÎÂé5ÀKÁ³v3UÔrÈ§å+Ë_e8k-Gž§òù¬$`Ó*ué9'Õœ®î„ñÞâzqKî&OQ#A¨™±Òg7-%"}5!Y™`d0ŠPO]lOñ†Ù.Ó—%Î´ÅkÞÊG”Œˆ(Ü¥ˆ«?ž@¡cŠc†ZÚb[V#«^S¯®Y&Õqæ“¥<n8R¯ðS ‡ ¿É¾CªhŠk|Ç0ç.Vod–9n“Øâ¾·GšÂJÃÏRñC¨}H‡•¥+/—QYL¬]2Û§†tøgáÀU''?Oj,çTsëdùí)H›PRT”ði•uùyH¥w! wŒBœða†AÁ-œÎþMe?u	–q´Ì ©¸a©w¥gnLë¬é)O)˜¶ê+n·Q×ÓH²ÍÏtöuž¶áÞ½ÔJry[²;Eå¤gr³¥Œ´%_”®dÇá<
)Ö¸Ž¨@(¬¥åž V;}!Ý]åxxh˜#­—¾æµ¦%)¶Yr>¢ìª‘Dø8ÚbŸŠ;O+£e£žùE{(?½kvÌŠJ¼«¬\6ž1Ê°Þ¨6Mµ.«Í€•æ“h¶-yXÓ% ,¿M¶[JS6ã…6ëe¥b}«¹F–ÊijY\ë¾¤¼òz³Õî¬¬®­oX‡[êTRê†õ9¥¨“B7/õ`×V¬¬çhÉÐ^ýæŽ­½äÔ†‚9óœÍRFš,6æ(nê8ÈQžýÐ0¢tGàEqRKNZuZ6ªiÃ»Ô¢Ë°èÎ²ËœS«…Ÿ(*H£o¾^>`öúƒÅk¡:X>1À-è9ÕTÓ…b"KÛWž‹|¶žhHì›ËzkeÙÛ$¬òªeI˜¸„ÿ-›íÊ–j”´3©§W@–¸;•4¥à¢õ¯å£—ƒô}D;äSžê»5»S÷OfT*)µ%àh(+ÜÌ¶§–n€¤”.¾RlØÏµ:óÁ†Wµ¥ªírÞ-OK‹òº…2K:]Á[¸°Œoâ¶²€ÖÛ© äçl…Úb¸ 	W¶Ø.Ûø(«”he§ÄŸ»X`J­6jù•æÿåüå
ÐAÖ¯Ž<xG§~iõôÕ‚3Ö¦Äß
Zx“˜lš¾6T-œÁ)E€²ujZ[J÷·	º,ÙZoÔ"MdùÛmhÊê*@ª
7¸¨ÏßšµÝI½ÌÄÝêã«}^Éæt€a•ìZ*´é7 •L@pÑQše•KàwG.lK­Lù0|-Ëc²—0R=%ËéÈ©
šÂ]Æ¼èd–,štèú9¤˜]-ÇÓ1•Ì¢\Ä Ú
ªÐÑõƒ„vG!žåpKÊêÚÜ'ÚÌµUQ´-rJùžHMQ	å)(RfØ\ƒ÷%åCö‹8êãP'¡<§8p\‡Fz='a58s³^p.ãÝG¬1‰j½Ââ…èYK§fßè|b’+{ïU˜wi‚òIw¦"/¥2¢–_µ vGÅšŒ"ÝÁÙ¨o¸ÿè©àUáÁ8OÝZª˜Sè_¨pØÃ”¦^ÆgÅÀ)Å†^˜²!VØ «t7yÞ~¡ÞY1€§¼ˆJÎ­VÃ%ÆÁbeFðY_)‘¬È‘{Ks‹«²ÍRïI=8”Â%Î–K[LGòk0q*Š³¼óçÑ` å–·qs(ËQJ-ÂÉt¼Ä F-A…×òkÛ›\†e&^ßí”ÏxfCrRšL—&:Ç2UE½ViYŽN³yQÇù<üµ4bk)¦ræ‘6ÚGÔbåsZHR‹)€XÍQ¼â¼Ìúø¤$QÜ'9ä›e6¢‹„Ú«ËHÛ›7Y±Dæ™Æ§/;$'CÇ¹^·œë¦û\[_HHoqÀYcÛ°–/;ÖášÜýM’§ö‚Íá–ÁÄ»	„¼	§ÑU¢GAL’(_æ~0	ÀÍ}tRäQ´Í,•gºÝX$ÞN¢ÁM;ŸÒæŽuÒRlÈÔËUØ¬ëaÔÕr €­Üä É9­ßŸ7³Ÿm0¨f?Ñ}#û¹BnÒÏUQ9’ö Øl˜Ï’þ€{ƒóc­ô–Úºo¬ø=F}›Ö`-aGøî%b—OÄ§‚\@,Ðý¶0¬gì…V®Tµw:©•µu:ã°z·¼\kÊ!ªJ¼uS»k×ï–E4ØÂzzKÉå.ÂùNSÜPFd;WÎÁZÊ¼ºí<º?‡s|ÇR,®ªìlô?½§møCKW+ÖÚ´Táçê(Ü“_ÎÕ4gƒ±,ÅU¶^ñEà*è•…z=ÜýK»ìrÐ;/Àor]£êTÃt¸)ªYQ.,Y"ú°y®x /ý¸N&?Ãj^üåYEÊ
GÎ°r–ÇqcÑØYUý(¥ä<òfVÎ't²4)™óo!ãO*dXt*ËÊõÿùb‚j1Ì®öÅ…ÇfPVñ@ÿ2HC=vP° yÊá²EGotººàD?Î;11J€óËÀÄCA–zÒß',4ä^/n­4â!nY«×<æÍß,LËî§±jþ¦iàRÚò¹<ó7Ì2]fMÓì±ŽÆ¼w/˜:e3—‡…ø „F;p
h6ý¾œÝ³Ê‹'®N?s¼pÚªuÖI	Ãg£ñuLtNÅÉÛjþìcD²yxXE¦ýÏ8M‰ïJÅ6SUŸ}6ó­n}¾éM’G5‡¡‹}Tuöq1|.¢öv>žÏäàÜòPŽ.¤©êBZª.¤­êB:ùÊ:1K,¾¦þ°Ã‹ÂOäâgöšbt k"„—‡Êa<•øiwwSB¡,k®Q—?ùZø×ÄØlzÊrüå•1”/ðñ®nJ‰©‹Ì@¡3ÃñZëÑáé¾aqt×ÝÜ‡ñï›;nŸÉP,üà9æÊŽŠ«îmðòÇó
aWÉ¬…†EY……ÁœV «NËaýòîøÍ¡¦CuÂ+3¯¬’’/æ!«àÓ0áý2Ü¿M‰æ
0ö/Ð]š¯Ç§S) ðÙòû‘ƒgªÏdJaBºÖÀœÃ[P½ç*Rqtej}•'H'ð~ŠÎ£2Î½æ¶`½ðœzÙ¬¬j`wÏY(ù”R~?ÊNjZ–×V1|ÎëÞ„ö6Ëqõ{:çí[½ÜõóêsŽ´žá»_Nc,†¢óhŽ3\ƒ:ä‚šc÷ë¬q!sëáóP2Ž5Ÿ°å@ÀçS(›ÙgT&ÃÇ£Pf+áS*KkUú¦=vÄ-³èçÑD+ò_ –y€ª„¨pS?bI1i£œL ËôÅGq˜„£^(EÐê%>uµÎ¥F7aŸD#*â×äw ¨¹ŠM*L™¯‚«–'C=¢Ð¥%wêÉ‘§ßê+f(C_ÎÛ4Ífâ‡œ7hx¤S9Òc¦jºSWÝÖÜñÆìû²ön}åÓå{¶5„IEÜœ`ŽòÞfgý8+8ÐÚ÷b!§ö¶×µJ˜7d…‘»“‹ËsáÙ™<Ñ0þÀmÛrb›3ß£°å•-%‚fLß9>€òNúnÃÿÓ{QI{tq(I&|Ë´á¸\8ÒÐ–õ–¢É	¼®A&‘uG°_vdçý\)ÒØ_œ|ŠöÙrÙrÚÉ§Á RÄ’òd®MÛ€+HÜ†Do_Qgôª3&Ó>KGzˆ~3µéuÔhg(AF¤`Ì² ‘zÝÖ”Ç +™Œl fÄ¡ë%Šªjày>”Šëˆ°î Ã×ò‡W?0¶Úå´nAJóDO›«k	^rAë3zô‘[RrÑ[ öNÔp†1çãŸFxòyË	¨KI^Bõìó©Õ³Oá´U_ÀìÓŽïç‰¿NÑ¾/Z3Eãi&#ƒ7„”àŠKB>Æœß u’_Ø*F?ŠqjVßlo†wJHÝã;áÔ¯øô	Å´llì1¬’+ZP¤z—Þýb9/D;§ä›¸[~½{|¬Q«Ìë¨XæÆöeø)ŽQìWô‡'å€×ïE`x;O³–áQXþšÌtËœR5/˜¨cú mF9ÚÚ­ø¢1ÊU»tgä…”+v˜îTð1›0[ÿ‰òé/e£¥fœÚò42ðÈò5öò)¦§œ°6Ü.)*RšŸ‡.›,ÝÆ~;uÌ¯®c~—N²O	j™6°–(I	f/£–©üå"–Y—ÅI&ûX	'ûÈ*È[–yëF¢o”¼î	rd¢ž	(ŸjöÝ¼Ô(ì3—ýV¢†í\}øC…É\éQ'yª[œË“D"~~³S•£ŠœïÊ«Ïöê_ÅÚä(ïÝ>ÓCçˆÒ4ïØDîs,0óè@hçˆJòúÎY”¼ÛùvíbæyUP-4·»C[n\´ù"b×æR¥ò­ðö¢H9úÁ	ú¹béúphfWÁÈº)EüÈí
{ãQIƒo(â%m>eŒzWT&Ë Ï?bHRAiqm¾ZNäaÊüpÔÇt:^Í~|~	?:Âîí¥|áíz}WÇs¨ô)ê¦'ŒÒ´8bJWUÑ¿úpEÿÊgÐæ·C›oQP—L³çVQ¿áÇ"‰È+;‡×¦ª.§øµáù[í+_w)Ò¢ÙÁ¢¦	y>¾) Vå¦uœHÉ>Ê‘µ†+ù®}(óù3äd*ó"žãsÛº	k‘dh9	ŸŽGãb—jÙ­9«nYUö9ŒRùvH¸>Âîx½¸òxloš‰.E8"ÕÄÏº÷gÖŒ}%W½q‹1sIDâýŽ"Xà”=	êpSìuî<þYn3ÌçØ5«0•›)†rÜP~äøbÙ_m‰×Ný‘û.VåŠü=tËìdÑeÒ–ªµ½9…õîV'‹Å½´Œ2ÌõÐ‚=˜+s–æŸÃ´X%¡í(îÂVQw
‰7ü½Ã "
ùé2˜&ÝÉÄØ9{ZÃ‹s¶n¨Õ——I­V#{»'§Ç»oÈÑÞÙ>Ü?:<xqp
w¾ú
—çœò.pswôÛ,ŠoÃd6˜¢Þ2êO›$A ±ôwòïiGç;Á­r±OÿØÝ$#$ëpjBô÷Ã)TÍž›`AÒPíïÂAGWrT}Œ”‹}*/ò…)ÿSÖ‰6€é,Io,ì½=èž`yàç/öÞî“ÝçÝ_ºÇxåôÅñ/Žw_î¾éžìÒ;¯v_îuýuú‰Ãs(5&|ÿÕWLµ}zøæÅÁ‡ƒÃýÝƒîÞ	yJ hðNdmÙ$y6K¢xW«Í~ñ‚]+,ŒNz|Ey|E}¼‰ßyõ.(#e4‡b_RûfCí •ÛAKí ¥uÐiØG,¹¡ÙlÂF)Ó'6zÿ½XeG¬RlõIKYí(r¿IØÅM"tGÑ
=õ,»ùî=¹Ouô¢¨!+lÃlä¢Ì*•ØïÒû%%«à{Öä„‚Zøda:¾
GO¦¶ªü¢Ü0ìf—~Qz`0¶%R‡‹çÙ…ˆÖ,û­´6N3[†­¬Ú«Úá‹8ÇrxÁ2 wG	kIŸaýd¿•nÎÆc°$lIz|Þƒ ¤§°JK²”ŒW”^‚Ñ­s$–"iª_Õû{÷~«úŽ—ø¢×_œŸÓw+õÑÀZ%û”B6æ§R·ópÚ»”Þ@z@•1¯O/ÃQ•âk½†]Ö×·ß¸ÏþÔ1›~ïÆqp[ü[wåÇ5móÍ:ÐÊï-Ö±Ô;Tz‡Š
ï!@@µ‚€À&ÛŸvËŽ-Ì’D#ùhnòBïj7¾ŽÊú±ºxPw˜Õ]SŠÖñ¤O¸õ<çÞc• žFùˆóË­=l¯\¨h°X<ŒNk.Òñ³ºŒz©W¼ð¹ë}–*ö)–Ê_ë3}*-õi©Ëöp@.ƒZ“6\þWÿÝ¿úÿªÿkéý?–=>=‘í)£OzqUùz¾ïAœ àá—ÝÑTió®ñÞbuÕ¬	¸&¬›­§”d™O²Qòçž ¥qšýþû½É«ýË<¹ü/´ú²B%RIFqùõ.ßàv}eL}•GËÖ•ª¦«õô)ã! ¬å‹ŒKWE*tk©œ)ÚBíLñvY®©ÊÎqóâC_f­ßùoe´kÜ©˜CyåËqéÖ‘|Eå1¨ u‰,Æoq”p^ãl6ºãq ÏAÿWÉ4—3:]»7é3Š\ÀüŒG'³4ÁNË…)uo<‰dz¿ý¶EžÆ‹>•þF‚•Ë8"Û‚Hö¹>ìêEú³ gÆÚž‚@t.µfÜíÓ¨4t>Ž‡œý¢ÏÉí¨ÇÝ:v%9L#|éý,1’Œ–T1Ûõyõ&;
¼DíWâñŒ©c¼Í÷_y:Â{S:1*nƒ´ž1Ý£]B§¢©˜z4H	L‘CŠÏêL¢cà¥HpDSúîQ?ãuR¶7[—%"”¥¯¸ý`‡Ï7zV±H³¸÷¾Wp:ª7â—¥†*Ue‡ôl0ÙEm-®KÍù¥”Ó•{:r¼M:íMròæ-aæåaS–È6ÌÒuÚÐkU¼ÒÎð+Îjº”–)¾ 5ZSj¨1™2<è~9>È3AæãQ½P=²Šs\´N’RÍ~ ²¥û^gV¡+Jm @“6væ*†é‘ƒ«it^ÿhðYI°­z³³)jb×§P¾‚I,ëÞìÌ½îlÜSÑù—\ófgQLqwçh.&êlp9¿¹KÔ=ÑÆÈÖV[ðÒë»N¡škhÈÉ¬\’½Ù(H,«»Þ^øbk²p(†A…
g¸>Êš$8ä™.ÜÊŸÞq¹USI1¦ìÏ¨ö{	È]A4 <#Å	ŠBBüž¼$°& öXeòFcAýÙX@AA -¸ø*¸_n¿¹c•¿÷ž.ç7wÆc×)n~¢YÂr¶¼tµë÷‚S:yö-¢«ÒïºP!{›á[vS^¤“ÙU&xˆÔÁZ."a?ÅæØ‰.õÁÑŒIEMóí}tˆÌÚ¤Ø¡‰*ZäìQÞ.Yöé³t}d)†/X˜ôp5ð]„»{}ÑP«ÏÐ'êìÇ3òñ›»ì÷=2ÿÚf„£ÈùB~ì‚U¸rÜÜ§€5îÇnEïŸ)¨Å°ƒg¼o5½îa²”)Æ&k¨q"ŒÙÇíÑšnÏ‡ô_ôNRe6¶Ç_ðp-,-Ü›2,1­~Æ I·˜‚_€ %RoÁbÃˆ”üœ¤øÇ¯ò=¡ÿgå;²€-4úp<«SÙ¶øˆYÒ­Å» —sSÁ=îm«”gH£"¿)µ-Tº¯Þžœ¾=!­Fkµ¢NAµ5¨¿å'%ÛCúU™03C4”ÞK„5ßÙûÑ¬}+Fzæ¶P€‰^µg,)mý:ýò!BÍÓGºˆµoî(€„T~½®WÂùáT[[_¼ÿ(IÜndŒÿT%Ð%ªZ7Ð(^ñ¨ZÉ˜™éGm£P
©ÿPò¸Åao
úB–{ %“ApúHA)°ò0x2žW!éÏ†Ã[ fN,AL†!½_Uò½gL¯p*ìSA—võvV}¶YÑ)l	ú%y0Ô¬Í†¯ƒÔr)ª¡¬Š
o¼Jÿ<!º¨I¯~÷<MÑÏwO¥g{—AlKwZÉ?H5¢ðßÔô/š\†8å<á†4ö¹cWuä¾D>ˆ©—8ý=`[ê€2INO)·T[n¿äæ­vNóVKn¿äæíõ–³ùshÝgÍá—Ü|Õ›ž·ÓÉÑÖ¤z2;K¢~´Èû¡—ånÖÔ9¼O)‹¼Ä‡gÿC[îwbÿþG\áýÞ‚Gýî5*9«Y›Nc‘)7éþÂœl®.#HC˜õ@A¡¤~Ö‹ßkCÕhn:öº˜.ô uÑlÁP`´®dÊ«[/5uÒR'%etôãÑ‹½îÁ«WÝ<¿Uù /~ÌžÖ©)NM£«‚ªf|
²»2eý\vºÊ÷äê§KR#¸üÙø…·¤¡äÎ¢dÓO4M’Yž`êF}éã„¯$±¤î~‰¬r0º÷Ø9»Ïc­ .œ!\Y°VV›²ÙÌð¨ª	T¯îIH	ÔC•{€rA£TlnáœûÂVˆô±pÆ5hÌLÊ”)YàæO±èhÔ/ÐåÏžd(@kÈwì
Ø³ÆÃ*Þ8¼ÒezI|9%1`i¢DL+ÈûP§ríwì%²æ’«õYÓl'Ùß(œ²pÒ¦ŽÒ™b¤Æô’I~Q!²\é—\Ð~>¾cÒEN_Ê8²D>èéup.'¬_÷€5Ž'$óÅÛ¹µ?$%œvi„õ™‡ªzq„ÅtùÐ}nÓöJ¿[ÛG6ãëˆnßu}<	GÕ—Óé$Ù\^¾êÃpyµµ¾¶¶Öi¶×gàöô›»pÖª·Ç»Ûãád<
GÓ*].Ú=-Îô´‹3£;dàìÜJ ÜxbÛÈÇÛ6Ðó¤*"yç2qF^l!Ë<Ê&ÉÈôÏ»SJä­%$ÇŠ“EÊXCo²Ûf°MvO.`j—ø¼v„lÐ+rŠ§ÚþxXœc<!”Q|)‡I™AqÐèrÕ¦ãÚYLÎãñPª;ø)
¤$’ô‘Ûp Aß«"tƒyRNnj«Po§‰Ãi®ºg•šjÃV˜¾`.ø²N¯OÅõ©äÛ	P$/W}&iÒÈvÓ èÃ\ƒH¤UíXÅX,+ä»RTjÃ¸ÖnákéŒÌjßJçËÎÆÓ)]¯Kµ¯ë@ý¾Ž/åâ p½öÎA­Õ¡Îà¾³Åßé|iº¤¿Ã2ç/1îµ›µˆƒ5H®fÕÊ²^ [­Ò€Ê #î']ïÔ—]ié‘pr½jÕZTn×Úk­æÚÚ¥|Çõ$Éõ§µõÕ6HŠÄÔû.›6on
ãÌ§|S²—%	.äxl«2jÖÅ)²%åPŠõé¡ÈhöÛâR,u‚Ë—MmÊ–x`LXšNÚàoæ9`žØÉ|è9ŠFÙ¾ÍÌ¼¨…¯®ê–ò6ê|•ªS»“ è">	£Ö– (
« ë>ûÞ¡?(îóV@ç»˜–‹k\Æ\é²Äý¼¢éy‰äÕ4‹s_ªeœy‚…,qÛM-nÛé°_ ,£xÞÇªÒ»»#%öƒ}¬ó¬ÂÎ.jg
×@[—ÜTÀ¸*t£Å0ä1¦‘Þ‡,L+òê°Ë°:Ÿ•‘sâ3Ü®@k¢‡ß°«ëeŠ¢0ñâdW[=üÄŒ1qÒÊb‰3õæÀÞÖ0^ê¦LäÊ,ý	!Ž¼y"kž%™¶Ø§\ëÓÊh6¤LwÏ|†¢…=”ÁŸÞ5[f<O‡ì¸qÓ–/4;Zš<›O¡Ù™šßBÚø´˜­6¨’[íŽ9ô~”gƒ°O‡—)°…ôjÍ&äjaJ>¬q‘û°¼|%ƒ±¥µÐg•ÈÚ—¡ŸÑ«‰§«bE7¹ð@'¯/»™ïÏGû³!h9#é’»²FÎWÕÂOô@%Œ/7ß«ý”aÀš¹ÉÉb3N¾å‘Ëx°Œ¨Šü:Œ3/)?Ã…M%®»ß±¡Â5vÃ‘ÄIÇTNÙZ«®ÞÞ8 kai!”Ö’I4Ò¶Þ•‡‘î>Ôkë…Wõz½T Ø¦)Ù·ºpÝu™}«xòz=lOZMÔÙ'/Ù¡®î¤«„×(t$Ih5t·f&I(ÆËø'´ójýÌ—GÁ_:Ã™¤Žl¢®ºÈ¶PR{ i.Ø`0‹ä‚Ê]ã5E6<aÙ}ÔhSÙ2žV+i5ÆaGj uHÁgzšy™Pi •4‚®6ÒÜd=éW¨ÄÝ&(zÈH.Ûf	¡édcEÑÝHøÌ’Ë‰—ÜH×UŒ{¥Àé ¢;ÂcL¹Œì Á%c;dŠÌŠb±Þ ;LêAySðNÃövG :,ÑQ0
ZŽeÀF®\‹œ&öØ“Ioë<N×ÍŠƒù3£²ânb½ R¼ào_iƒ‰ @S¨Œ§Œ=‹Y±Ü¤|E,tZËN
¤ërÑp\¯BÜ=8Ÿ@ÊlB‹&0ór
ð^`å¯’€%Àž¤âÞ·Ümì¤–XSii—ÔdžB·Îà(ˆ}]äâq¢°Ôø›‹„*´áØð"ƒµN!Hcé% •*’ã¥¶\ÎÃ. `ÿnEnÒ;VÍwØóæÎ	îœLB©l–äMÝWa+oòŒ,ØÜË¹ïù‚½e»ìïY÷½ÇâÕ,|‹Ë¾§Ùñ¼Çê.<»oZv…7=È–ü.ÅvÓ(˜UÙR¶È–•pþ#ºÃ}}sNè
¼¬?B·aH·,¦!®²…+ Ÿ©¸¤£u—tdIr•i½ÜAùÔnzV·”†@ž>+EÅ’xör“*×âM îKsj­=nj |§Â;³Û†U2PžÊSKÅô7ôµEWaÙ(p‹Ÿñ—xízGAP¨E2Šëö\´î*{ž,/¾b˜Š›10:–µµ­¹#Y¿€pK$¸áÀf_Ç™(”9ÅìluFwÉH–É2X…s+Ù9Ì5Ë‘kcÒZÅ£AøÅÝÏ‘×êË®NfkXFIh¾’Òç¹r§Šm­PI=O.)õ’=‘¤±Ö¤·9Î’MÍyéSbxÅäØÒÒ¹ÉBZ¶¥2;Ð/ëÙ‘„ä4l†yeÖfzÎ4©Kš³ÅeŸ¿û:t¦)pÖ£ñ« çËx¥¥7jÊ§YjXø ›†Ïò«¿çÑH¡(e×4GBÑœáTÿb£ªÒœŽúµš¼ôë#šé2ÇtÊ €º¢Þ°¨<JÃOô×‡:>‘¿áÎwÇa/Œ&¶Š$&¸©ˆÔp6}Ú}Nš›,±E–î¸‹¾Ò
Z¾³"#­·K–òeÒÖE¢i´¥%JëNz\Ê§¢¶-‰¥ì}nrÊÂ^·÷H„`n}
H<¥Ãcc`æ·ž«€½e&ßqoZúÞ1¸°¶ëjzö~“‹±ñÒw²/ê÷5u¿¬À3Mes8ó°\ê¼ ßµ9ýy<Ê8«ÿTœ [z.ÎÔÅTi¯Â£¹dÀæÝèKf|+ ‡Òú«Û?¹ì/Mjc£›îêÁw1Ùçf¨ºU¿ìX‡mU}æX!a³¸{[âÝBR+Ú(‹#ÄðÀLH{Ë ÌÈÕ€²å™ý†;¥«Ñøš¦=	YúÖo™RÔ­ë`ÓIle:rEèd¸™ýlƒ7`ö}¡³Ÿ+äf ý\åºtè~éØêfÙRÓ±:XãÉt‰Dý§y„ÉôÍ5fA“ðEP´yšGj™TeñŽÇ¬oaØã3Òìt:õ5¡‹+­Eˆ“y	…5ªM\.µö¬üŒÍï­ˆå©‡Åªaõo\…w
WÃÒÈO¬éÕän4–À3À„ñ <£ Ú.gƒ™ÅrlÎßý„»°Nât1£xþ[8ºéÎŽœ5±Ê‘¿Á·{÷[—ÍNÂ|.Õ˜´8hi2†3Öá‚kÂ»tÅ×íE¶ìx³,ùámÊ—§ök”
UN`îªm¥>|t¾êO–¡—ôÕÓ}è…þÊ;jH›.¡¨2ÉÒç›”¼š:»,wäV.§ï7˜"Ô-aŠ²Ï‹dZ'ÿçŽ
ŒÑg1ì
èô®ì¡êæVzÀõ n¶v¾ Ù8¼:ÒÕ²²ÃBNM ÿËÊTÙð×P…€ÿÒ¥ÒAæL#¯h÷Tƒ,LÐ­Ïöï9hyYÿùõº.ù–òî{ÂîW`¡œ·,Dö¾Hå6å»¢]¶n­Mk“þyµûº+émº'ÛE47\ùö×ÒÝü-ÔÿÑB½U-‰‚ý•$2¯%jû¿XŽ§G¨Ñî8b >ëî¨ü!r{áÃi—8<2¶Ë0Î<~%Ÿ©báÃ\Z\GÔy2_{ËaœÏ­¥²uÌaN;i®#…¯//PÉ½DkÒ…Ç¬*¯qŠw±'6Þ
Ã$'Ý†9}ä‰(IoçÅl«É,m’CŽáÅc:Û8;ÛÄÎ„_«êª»²*~Ï¦ÝmcÜœ”	ÏáïT˜0µTóiæ¸XôøÈ6ÜŽ,VÊà
—Pb¯ôºÚ4Ö'(ØýPÂ‚U¬5ï“«bíôyq¢?íBsw*¸Œ9Ní%žþ’ëy)Ç×R~9u—(‡±U[É,)Ú×R´´ìr:ß ¥PáRNÉæT[üW­ôóò<1‹5eµ—Ájý…–;Mx÷åWz*h¡"Í±š–‰šÅ:Ÿ³„"%µˆœ)¢8.’&«ôÚº¸7/Ã˜7­þ - ×î@&>ík†¹HªÄçZ´4ŸçQÃ°¡ä–?Û“µÖ¨S÷€j£¾àÊ¬ÚhNÑ‚Nry¡½.ƒS0ñynM7w^t*V€ué@m":¶0Åô‡þŽŽRÀsŸÅ£´•ý–Up.±St¡ò âj‘×i>#žŸowY*N¨kh=ô§öUšó_ Þæ%f1ö["òîûûÄZ;QVB85fJÑëäühŠ<jò;ì¾t"BÊÏ%ÃMßñ€\qº‰…Q§
Pcª‰’¡ž3¦t°Ö-/3Z0NË¦©¶åtw\L‘Å‘SùQŒ#À}Z{×ª¯Äásv©ê®U¡Zsç‹Zyìˆ®GR}Ù|*KÚœÝASRAfI£ksg$%ÒdØ3Zæd¬¸®A¦ÂuGŠlÅäøMs\6çàÚÇH2á¦?.Rbg~ 	õßQ˜#úWâÇ¶®0W."=†±øùX“ÎGËîg[„?æ„©XUû"*K9mÙ"«Ü'Fâ†3ôG-QQµÖIz[qÕÖŸj‘5Bï±”Uªúg8Š²GÇ;úüPd×mÛÃ+ž‘ŒA;.ŸíŠâ|<­=×ôÇÇÖór‚šÀî'äNgÝf™ÆÛkE6°ª¬sÃ1„úá(bJÓRðàf[2q5ÏôU4X’¯·¾XÆ‰hžQýªCQ@µÚl“^ô$â¯ZU˜8Ê•òÝÖÄ¢‰°j!:¥ƒH†EtóEâéª
?çgÙnw,¼-C3ûHö·èyi*ÈO—Á4éN&ìØ¸EWˆ±~’Ll•mõnèvC~yæ_„ðê”ÊòÑ«·šÁ#/FÎSo³²¼"·\Ï—),úyS`]’‚4³«jEæ3H„µ—ÃkºGá
0Ÿ¥ÉñÓÚÅ/) `òy^²8»à/ÁL7»×Ràœ²zÉéÏŠ“ËñõËŽÝ€•7>‘.8^›¶†Ï ‰Ò°ž¾ÒÊc ÕV`7É“§P,žÇ4¾·Ün6 OúL;-•§>¶Ÿô±ÇcMí¹fÃñ`KÐÕc[{°åê±£?˜õÈ¯°ò&€VD³F½ÑX1ŠX°Û³¡\¨>Ûx=Ÿ,Ýd,ñÙÈ¶Ml£ä}«¦=K`dÕŸÂ¾(Ì2nª%i$µ´O¹\ËÐ¶»sñ	+Ìgà0
¯	ù Î
+¾ÄgaZ"w$™ÞB¢œaÝ»¥ÅWz•öJ/`ÀÙðeÌê‹cUš7‹uövx¯<&8mÝ^ž•»RþÖ#ª<?Ø­,‰klÌôjcƒBÌZ{e}MºIQ"½E?È‹«€œ“EÄÙ½ñ`…(»`›ßEj0-úJ¤å”ã‹1½-
pÐ¹Ç·“)h‡ÎFúØ¢^½7.Sx&Ï~{Jïlvú¯z?½ü¿½êtvÆ³·7¿®MÚŸvG¿G‡{ñZóCw/ùaãÇÑáåO*Ô·_¯º9Zùyð¦ómò´ÉSÛòò`Æmw-DÏM³±Úh¯4?ÏfÞå6xtQ¿Çô\\Å³®Ìõ¤F·~JIåòl2ýd¹Õhµ–›Íå³^Pƒ>ê“Ñ…w¾ûÝƒÝcP4ÛT„h­¬­4:kŸiÚYÍ×Ä#:A¸ô‰ò„ãg-¦ÊàfÜ^nt–µV£×\Ûšëça°¶Ñ
Ö×[g•Õ ×ì„ëg+ëõOüËñÜºÖz£ÑltZõ•vÇXŒ“8"ÝÛ9žMFÑ `í±Èi£öiúrúÏÛÁìè——³íãçŸ>¬^vŽº‡íÝáÆ«éáÑËW/Î:¿½ýÔú—ÁëøôªÖÐÈ{	ÁpÊîÆ1“xü	8<:ìîtŽæÙÔ€1ÝÔÕµöyÐjí ßêÕ ßúux6I×)àÃÙT
&f¨M*éC$ ÷p—¼xÓ%'Ý£·§ÇÝŠZsPj½²ÑY]mSú¼žµ>9Þ%Ý_Þ’ã·G»Ð–7}o…,iU^uq.KI¸³ÿKíÍ«ÎZ<;ºÚ>üôËó³µþu{ÿíÕÛÏÖ:Ó_§³ýæZôêäd:»­µÖ=ùùæçËŸzŸØÿ×ïðÇÃÇZ½ÙÛ_ì‡ÑÛçVV~;ß£KÖ¿üñôhºvõæ§_ú/{?ôÖ×›¿þó÷é«QüÓlôCsuüóåÅçY¼¢pòúðèÅ%ôDÑÙÖ/Æã‹AL¢—à|Mj´£~mx5½¨Q>™ÞZ†ýˆÒ‰è,âÛåÎÊ‡Æ‡^pEï€ õ)
¯?´ý•ÕÎy³užs1ëç_–÷JZË¯£ÖÍ²¨ú³(*IŒNË]µX/J‘*É·Ûú(u¬VŠ”±Ò’û>¼¨ç;,ÅcÑ¢VâÎ—«Å­$+»šËRG©S¬zRÓé}ø›ƒ$P`Œi¥¯Jãz#›§÷ºÅÑãêšÌnlÁ»F½ßW¶Dr“í kÁ¨D1ä]ý1F9(îßåjñÚC-Gí¡u­ Ð	+Ýý-¯]MfâÍ~fÍd¦-8£'d‹Ø»3)³C’KšQ…5Xè0ò†ÙËq‹m ±äÜ1‚¤ FªeØQ/ á°ÚÎ#È{ÌÏ\c‹ê”Åo¨ûÈ Ø™™F¹äªÎU8"¼mÏù§¨¯Ã8ÊEúy$Q~Q®@5v_ÆáùÓL¸
&I=˜L€fÖ/Ëg£·Ñtûeÿh%¹ø-ºîlTÔÖ¬ÆÍÓ
«þ¨êéyZ¡º$ÝíÑ˜¾(¤’½¦•ü3‚²/§>~­ƒ'ñÔ~09ŠF* K©š2E2¿¬ËO¹ 5EÁÜâˆ2£Ï®H7.muž*8ìp‚nGÊžKg/“µŸP
‚:ÎÝs¦b·„á<{ì§©JÕe˜ºl9­C9K¦U¿+XÑ
Ôç\³6vgNwÛ‚•Þƒ+ÞŒ5”rÙ²å"´ ;<Ü¹"[ç->W€Á²ÆÁd_SZ#£ø‚¶`E[mÍ³c¢aï –Èƒë–à¹P¸{'ÐÃQŸr†¶ }üÍté®	ÑnVm6G»¨U©‚3å…Z–Š%ÙòoOœöRW±6’Õk»™Z³©ÙFÒºl™RÜêblhsøF3½í“<%þÚmÎ’Hª1tÒäY¦¼µËBÕS½Ú§•JqF26!Ã¨IÑR/:$pn|™?€†•ã¸ôÐö‡»Lï7#ƒyE5aâªþF‡f™«ÉìÍŸr»ã:8>5ÍÍî½à—r>.¡ÌõÑx:F!,Žà×b•axÐ'E•µ»ÔðSMÍBöÈÚ‚®$Š"@÷ï“ƒdæ\]Auìâ£²bP	$¦…à÷ç[1.cxFc¨qYÙ’M±¹•Y9¯7†‰o-~¬’É·úµl¶¸ŠØ#4ÜúòpÈ¢¢œƒ—O©eòÝ#îäÅ¡È¼r:›Î&Àè†Æ±U uïE—Á4õr•ÂÅ*fh€ð†Ðo8}÷íc1êšðnÜóì#©/C`ÉÐ¹Ý¦ÞS?’žP´«`ÒŠ%«ÞPý-b©7J€§3ž–çÝù4oµÕÌù×Qèîë(oQ;Gç¹	ÁzŠÛó®`[Å àiÞl4áqR×†:ý—v³Rªx˜wÔ¬ë]5eújI}µÌ¾J«-õÕ6új•WGê«cöUj\[dEô–öÐXZù²CYlÁoû:{Ï²|‚x¸D"Dªö|™øAdé1ïKŠ¸·gV0ÖjŠÑWLÅœd¥sª¹
cæ(©î`žuÜ OLeÞ°rtu<ÆÞD75ÿ=þôh¶òÌÞV.6ÞI¼ßTÛ©èì˜nÅ®¬in’;ÛÿÛ”1:Ø¸ªÀZÍM¹þ—V¶švðzÄÓéžî“ê~˜D#Ø½à¼U©“]˜K½£'ES[š£ÑIuA2¡ÀDcu¹Ùx¯4Yj¶/LV$‰{™Òùúúº~6Šê½q=ê/OÆ1eŒ“åæòóƒÝåœQ(0,ï2oˆ°ß«Á³`b5»Ó§à×…Ð¿ô.#¨›]€§½dÆgÿ†‰õ`=M.C(°Æ”¡¾ÝvÍ®Ó¶‰¤.í˜ˆ«ÔŠÁMY18<*˜ïm,ËîŽúŠ>Kc‡éw:\×™/Yç“çAÿ"Ô€’›+WJÉ[\(÷Û2÷‘§¥¹ìôë”	g'áp°3gé2Õ6‡‚h5ß1#ÇsBæÊ­ž9fH¶hùh,’ëZþB	{k&ÔV¶X†

úîüV9IµX†Qáö~Š—‘2/éü¸EÕRdŒ2Ob+ÖââI„i05;ýòecC!ôŠÒí+–‰o(Rô]	ü¿¼ÒS„Öf(‹;Dbààk2°Å^œ¶€Io0Æœ}×A<]èÙù,Û3—ÊëaÚ®‘÷–6wY48®ewD«9	‰ÑMÀ¥ñq$k»Îv‘ð¶Ü¸'ìÉ:67‰™“ä½yígžË(™…¼Z·^wOwO¼9^<‰xÿzKÙ=xCöº»·˜ª¬ƒBñ\ËY2{ÍÿNd x,ý>·ç†à¿äb~n„°Q_ù,Áz1‡Ó‚¦U1’)exU)y¨}àS:öÀ‹¨ë²1.XÂþ4Ž¨H¢±—œ2„++iOÜ¨Ûã›îÒ,¨N¾Rg@±ft™*UZôÜ¤@ùAÊn&$èƒà’œáÅcG‰÷\ÔúÑí}Ò$$3¸ŠÍ„¹?žî“ñ ¼Dž%ÂJ8ÑÃ,ï­y8ÅÍyZyÏ²€b˜Ål‘®T²é4(ÇÜ¢/¼M×ô²1…<2…ØwOºn¯†’íwON_oww­ËWGnR¶¯n?÷V­ö^*§“lmþí7æÜ¦Ï¨ªlÙ7XÛ‹/ ¤”2Z=T1ùùe­êøÛØØ;#`œe7`!áÆy}F*o¢8‚Ž A¤žÓ‰Ã«p!.'gÁ5½LòKñÏœ9AÙp6»šFä
Únƒº©¯Ü”zgÅ²“W¦ã{8&’·žÂ	$j•™Ê[5*%Œø{_ïs_¸ûˆ§ÉüxÑ½ýre5Ã7þM—‹kˆ$=Zâ»`¦u1év§'ÂcnƒÈxð'Û	1¬?ÅfXQ®kCÊ:´ºeÐ<(5mØr=³yó`¶¬º¥3qhZ²¨ƒÿ\¥=(Ñ+ÿi ÑŸÅ˜6w,5`±¢~f×
Ûi|‡ø]‰]½]ƒ3åeMó*·éºær©¸“- n;tÁñ[ÍyÙ{wLêyï{ìuéÓ nÞ§óÍv£iYÝƒÄ§„	/û8kôy]
 G…Ayíõ×°0=–ÚHÃ¨Y4‚³Ù ˆk£Ù01¢ôüµÓbQ«óVd,tŽì•ÏÝ½ÐóÇÇ‘a³•[bÑ!0­=®òG§a•­lMé[sU¼€–SßÑá”}
—æ%"aä)D“³q÷ë×1ÝÃS:ïª
%Þ2»¬fïÇdJ¿Ñ0 m|$ÅÝå‰£Ñ×}¥qÝÐ¨Ø[¤À~1Zbž#gÆ­µÖðìåöxr[4×*oâ-`XV«·¸¨]²g ×R\0€]{ú¿bÊ‡_”x0íÏš6û)û€öcÒ@ÒÃÀ’õÖõš?%S Roä"œƒŸ‚ŒXä|øKòÈ`)±’²ÀÁ†T!†9<û"–1Ð9ù%ìzŽ±ò~<ÎðxIVd´—á‘‡z²²Ôãx‰~Ë+®khsÙ+Þîc²øfÑ}Ée³øP}Ì–}æc¹ì}ù¯f.ãÅ{ýÙ¯b¬—XlŸ³páGòx1ö)Á‘±O._V„'c33Pð7ÙÊ•cÔØÇÃ®±ÏÊ´±O.,”gàxÃœ:Ôì/¹ÜÒý¦ò3ˆºøA† ö&ùáx÷äo“Ïg3ù´íHW½*Ô_Â/]J;P:s‡ä‚©/æ[x›z y2%SÈ¸¨E£~t1ÖÊØx+d3Û:|Þ‹>~~™ù'XØè¶–¢™«"¹ƒø©ÙÈO8‚S#/ç®Nã™Ðiv×ŽÌúoq”¼6¾íž~B90-žöEùr%|Úì¥k®#a’+îc\ÐÉ¬¥p{•­“=ìo ¬ÔÇ&£ö22_j´H¯ÛAƒ¹Œ¤6ÃêÉåx†GÁíÙ	FÁ9üñp‰ôƒEpp¾Š&³÷(¹†¥¾šÐSÍ†u}Oô%Ñî;%âEïje`µbGk~FWÕx#å{!c‡&ì^À¿I8Â“Q”bÙß+9‡3ž½šØ=8ÆiïÆñøúb
106ŽÅMì•ûâ—»&™œÝ¨A–Ó)#ÊÉfÈ>99ÙÇ—ÙÐ€½E,î‰ÅçÐýT™ûù;
Š#å}9èœåc—‡¨ñ4ö3ãÊÈ³ÊV•3À¼óDÈJVè€]i©f|ÍõJ{q6WÞ•°žÐ‘ÑU.PEg+×`_ý9mëæëgçeIdµÀrP¤„RëUF<×†êëÞÒsü1K ¼ G_G
QÖ_’dX+ÂKßY!‚•èÒ¢t—µwëO—ï]d¹ÍJ`dÖÛ¬4þ’´Z@¨ó\VQNEõð;_ÙZóÒ_Q9åé£}àMoº'»ÇdûpÿèðàÅÁ)ù–ìu9|{Jª‡ÇÝƒW/Èéëû/ÈÁÛîÁödÊïýTÆúJ”Ã8§'a’Ð9‡}ÌG	ûïHï2ôcŠƒï7Iök“‡”hÕñÿàdîµòè'Ê{¤= ±Ñ‰H¹KO-Å}Õ
>ô!aOUÑå œi%«> !Nq^Gø££¯x%i@‹ßðô¸ODuŠûžV–ñÉ
á‰(XaùÞ<7ø¤­ñøÖXÎû'p7+N‚¹÷‚ÛñŒí,¤Åq¾‚M‘nÛò½üô&©ÃÑ¬BþC*ƒ`™ø}Ï£])}”@‰’“åuÎ‚øp’–*‘/y‹•à½M(½óo,í ®`	L§ÿ˜Ðñhð*¯Ée¾ùZÀWeªZ%Hw6>'ýqo†u[¿†>¯žG£°_YLI#ñ`]|y1ñ7âo¨iYçø9©V@
`ç˜ÐdòazIÛ‹É`F?ïeØÆC –+iLÇƒ¦	Ù”":)…×§ðz“­¸50ù$¸ JïSF˜˜#\Jûâž½ ¦˜‹vîZ–¬K6’t¢ÒâÒ^¤ú}±xßËO€_ÛtG”áiPƒS¿g•§½S©‡²N¥_ÀVmQÞÄª_³Õåw¯©p1¾¦Ô+™ÓÞå‹OPî
Ê­°oÙª~èaþ;
gR‘
«/ÎÏ)	0€õkå¼Q¶ükZ%²ì5_Pl*ú~‰¼“»YRÎÞRÚö½iô"Àƒ\K!ê„>ªT´„"ô'Ãžô"TOØ$YÎÈ%Bã’>%Psš?»(1ëm]4Ñÿž¼Ç:}P}®u¹œ¢UµkŽa³žð‚6R@„z‡¼¥Yc‚5û1£ÒF)‰ÁšZŽù4C½…Åþ0 ›°v0¸·¤¦·Xä¬)ãµâÉ+JEÜ‹ÞÄkV)ÎySÉG KvÛdõw˜€ŸPFë7…	ö´Ø/cÊ›Ž.ÈOÈãJ9)5”kq_†he}ö”òº·<êï×’©$\u£Ë„.b†ÆàÍ‡›˜ªü²ÖT<îõÆ§tHKo:W¢¨q±íUÞ›ŽTrÖ2aœÅ,†”.rLœŸ¯uZï‹x7ÇþMÝ0àÊ?‹Õðä,„º,¢›DÌðK^}¯m9ƒsÌ|*?5ýƒjav×ý©{üöà•3ý€HO¼U'ì¹ÍÕ„ý%Ëv§‹-Äžß’¯8ô-Þ·aKÅƒ‡4¹bõ,6qJÀx–uÊ”§œ­™Úi¢¯_ž½ÌÌºÍYq Á?Ì(Þ€ )($ orŠŒyÎ”>¾¢E,Tzn¯ö7[›WÅ|"¹À™¶˜~œØÚÊß	Î Ë»fU(1ª%,,RLµÂ(f‹úºæˆµÚí¡LÀž¡ßõ§R¦ì­£*ápì¥6£­K—M€EÈ).÷1Í’S_‘×º\@Eì°`B§š’Z³\}cwL`½‰!OJ-UIû˜’*—}^ó'~±9Øz´ÕC¶ZÉ8lÕ®=h;â…9‚ãiï!ôÆ¶ûhÎ{Lß2%+¼$mºeY†·eWŒœ2ËH¨’g?u¶¤SÉ|U{{IèlåuÅ ú®YoÐ±èµr½Ð­Ì4šè2<Ÿ]±v¾"ð\#‹AE·áf4‚ÔÙ•-ñ6[õ|´z6ŒMa‹Ò²×t=«h‚½Üƒ@tvuQæe}6Š+ŽN‰43ÊŠV
<õ3£ÊjCãX)^°kæu#‘¢™¿Á$¨ÿ©xó7ÖD´B)ïé#"x4=ôÙdÙÝ©Ô×†úm“´V–Ìñ|DE3ú³ey›+ëÂTôïÖW>]¿Vó|QA¸	‹óëAÝ’@*ÿ4P²Ax2Ü¢G„z<.¬P¾ïž;g<»!åMÎžYf‰ÅÝúº¶AweC“\¤Êï…\v\%Ã™?ÚGçÏ”âôR.ëeJ\Ùé*[û/Þ’“½ÝÏ»Çº‡‘2ŒÒn®qÎ‚Q'GzU¤ëæ¾áäø
YÓˆ›}×Gd¿Ô)K|Æ IwTZKaÒ_>Ž…ùÙ" »Ø§cc‰”R)ý6¥‰åu5SŒ!PxÑÁóÅrD™§2ƒÇ³eÄ=P…‘î=îÅ‹”U8Y&žÊfKQ‹Âzîò¥e.èÁz{òŠ‚…?Uûi ¼)G›èÉUÙ:ÚÝÛ}M^w÷ºûÝÇÊJÙg>ÑTn›' ²SLåæA]ðÉYÙ§„{ºúÜÄ-‚ðÃÿî>rEk!_áŽZàBÔÅ•¹DföÉœÙ‡‰Ïs	`9ŠPïkYán‡Žž‡ëHGmÍ+š›È>½žq§Š/T”n8°ÈòìóÐ€d;Èû0u,Ë˜ˆ©+~\HQ¶ðÜ¥H†ÊbO¶/C
¬v!ÔHà‹R°žÅ{GãBñ†²´HÒ0¬ÛÁ‰ú´¸€#¨§uË>ºña!W»I–2{©/+.3X`ú¨+_µ–£ô-Š“ÇZ	ýëñÐ–ËÏ«}{’ç!}w? o§Á0È×ÀÍ²‘öÏ°1m·Êv
¾J¸~n¬4–;†kÍ†žDo¾=¢kp8+æV¬ìÒ`Ä’e¥¬¢Ôš¨Î^ŠC{´€§ ¨ËöÁr›®?¸îh±ºO†ZçU$6¢»VXYqrc†šgÞaéH Cö@:ÚE‹ßú !sáK‚A˜`fŸ€U™†Â6ÓÞåN0˜[ŸñÄ&	F·ïÞŸ=øl“T¡ÆÔÞ­ŠôçÙ˜²óÁh‰ò nD‡iÒ;	Ö/$ÿá_Þ½_"úâ€…x%Ï°wDG”9‰’ðÉ§qÔß2|î6÷ƒÛ_èQA¬ýp8æ.-´‡S¸G§îžV—È»÷ˆxÓ¶ïÎ£p\Stæz™ý–=ºž°YnUÓáÊr¬xÔü´v!Æ+÷„AÜ»üaÆ·ØÅIö[q,ã5"y+pý·{Ñ0šb³é‚òný¹Um5s¼²¹ ÿ ýBŸµ
.TðŽ šÌ!(½Ä¨àY0`na‰BbŸvÇÖhS~Á½æ?”Ýzï´6m6E¹¾¹ê&eË+{ ±gÂ¾<d¬Ðª1E Q
fuÖWu*sì-Cp×bòS"‘9­ñ%~FÀ y9¦u:HÐ%¾Â)¨°Z¢×a¼MIA•ùöUåî¬Omb¿)ûÁÿ@tk‡¹‚Â3â‘¢P±(1IÜm/¸ýÕÁe(¡TxÃšÖØ 3F^Ä›Ô£Qo0£b¹ôæÅE…s×pÌËÆ3	âi’®9¾‡…™JMeÈ`$øp}Ž.¦—¸¶íEä§žØáéÃyÃ6ß[êÌ†ì>+Û_"ÍÆ¢íÉ¡öäÐù$+$Ù¤üæ^p¿üÍÝÿ½½ÿènÓâm¨lÝ?,&Õ=¬…EìÁzÕèO^~sÓØÐ];n¶”9eŒ“øvÿ•yfV‚'àÌãhÈOAE>>iÏôôD} _^z~j§#¤ôõ‘E˜”Ügo–L)s?«SÊ(ý‹[xç^5	nÁÝu?œ^ŽÕ™(wæyC†ðáøMÂUô}Ù¦‹lK8âN¯)‹‹'ÁE4¢O”@Æ6ô]O(›VKD¦–‰P›¨*ƒÂ’­‡ÃßÃé#¡¿gt(,óÊÑ¯ä;ØZì@¹A¹‚©ý¨‚ê§Ø¸ü€d¥Cž#¬}@ÏÖçùh<:•/-mMš–á{Ò‹)/
H ¡owÑåùÉëÓý½è÷
ß2üÔ!¸
ŸŽ'Küëk,HJùÛhÓØ/J@ 8• ÒÖ)Ï\ÌÓ.èô•V[O•>é,VÉ€¦2X‘'ö=aG&5:ƒ3‰ÃO0³ý`zYF#vá;Òj,y»Lî}Æfå{é
Ê*·F¯Bö^¯8Åž‚ƒyÍ|^%ùÈ•)À4_Ë‘f#Ú¾¨1l(Š-›{°Õâñµ£:KäEŸ3szjÞ®åÒPØÒ@¾©É”¢²n…_¹}µ¡ÛboI»ùÃc¨ÒähÃž¼ Š‚&Y[¼C­n¥©ÎÂ´ÝV¶þ¿ÿçÿÕlD¦_‹¾ÞCuË[~¾„¥Úæ¥z]·ÁTZ;7³^¥è0è`S&wªß––d#'A)»·2z&`Qœ	[H(µžÑ©Pp\Š+˜Æ'¸J"\1Fì…“`ªY2ÙUÙrð÷ ¯ý8žÇÕÀJ[Jðqñd"ºGéÔ7¸*ƒdÆÍÃ›Å¨úëOÁ`>½sl7ª	1ø&pUuÕ°>EúRÇŽÜþwt%¤ê.Ï˜ŒÏÇ”[ÝÏ¦àpÆüÉ5ÓÕ$VóhH`ÌrûðÉÏ[¦»4©žÐ“µød™µñuÄ”=¢øQ¨U÷v–6¢ßµagy‹äÓôtp¤Ùä= €pzÞÉGÊNn	²Ïü´<æ¤•²/D»lÑ-'©L†©ô'õ³ÐÆ"œ+Àé{®U;Ù¦RÃˆŽ8ÿdºŒkóÕ.sNìXö”ñÊÅ¦P³©Â‰NÛ¢Ñd¦!p|
Á€aÅ`˜¼­žŒÚÀÝ¢ØžÕ
Ò\•ãÃC]
%ËþÀ‚jÍÙr˜¼®Ën’6/,Ë>¬*\òÆ–¶%U»v!süoNÕEÀÒŽ
ŠAfšùÜûóÜôôù.þªC€zl±%»£ˆTïÄ<î•#kÉzSvóÎÒŸaù›hID÷§ÙDN¨êõn^]Þ§qÔKÈÉl8â[EÖªç6áôg?Û¹t±\`£’–gU¡÷F¢)wHc¹œìV™X
!‚§Ý=r¸ÿë‹SR}¹»wúâøÅÎ¢æ#gy§.ªÙÄ¯ã	¹ËÔ@¨¢„P®å\ ë¼»³°¨»2ua”„kú:*˜ï ¸ó¨Lî%!i"¤@¯<TŠ…[}®ô^wd==îœtßœì’Ó·ÝÝüe/+» Uÿ=6Èñ¤
ŽÂá•F@óúH²Ç«&þïÙèƒÃƒn1Y†dEÏè—Óîó·¯÷×¢Ûžb4×+úßÇÞælÚl“EÍ£%LŠ·a´F•ï*ÁOß	Q@Lî üêÎâ"œ-I®•‡µŠyy’ÙWZ@yºèúM¾L..Û˜4?…ÛãI­¹Ü"LÏÝÂ3\Î"=	ù	Þa$!ÅÜL—6ÂøieY¿	³/“î&á Y‰Q½nTÒãB˜dªÒ=½l’–äÄá×ó8²T>º 4x2¨5› ËéÌS|-žKS—Ó—6ÁŠf¥ÇÇ#fþnwì—¼šÒJJŽW,‡/KsGQ?LV‹g{@óôíÊÄ¦ˆÌÅÅÂ‚¿¼#p­
&FÖ†'SˆÜt¦ñ`(?æ ¬cEÃbO0’“•ùÄÆèDƒÈ-‹4ÆÄ´ô .ÿÉòô²\ë#q¤çi:]‰Ðþ•mNEŠq?,ÛŽ;p²Ð9¤‹¶èµXwwDXÑáçlÜW²ÔÓ³D÷ vKø¿(m”>N…É†µ†à}´ârœ
O&ÁèéÝÊ½¶"Í–œý[s‚µ”,o ä9¦"ú„íg£éìŠ‹Á%lÚò´oÙ6cÙ]u“¬ž,J(¯p=š‚ó‘9=Nã›ßÜ¡ß
zMEýÙLè(¯D€?•%ÔÂ)V0<Ãh‘ž4?Æ®9`ÞÚÀaâj–UïU¶þ¯;sþpÅÙæz·—]¬lÝe¾i’Óšû%v`ñ¯•WÉéŸqçøŸ;Ã%	ôº)*$o‡³aÅú1Ï\Üûn±t·X
‰ÙºÄ¡édYX…š#Ë‰¯ •i'lCÖoHÏä¤éÌ”­¸;Öç‹îž3‰ÕÄßêFxX¾¹÷ÆWµJ÷HB×otHúR«)Ñc[†ž=Ë1*vU?)§´[jä6‚T¤tò*Ž¼ªßÊÄˆ¦„$ @öÇqH^ŽÇÓPµö{ù„-Ê%äå™ß&Ù†Rh~Ryõ‰ù÷Ã¤õ@’ý;;µ
Ä~	£¶OÚkïŠ{é+Œý9"™LÆã8›ùÊòa¹„èAË‰(+Ž|¨Ü–27Y#3‚ß`’éU´zºJÀ<yß‘}ð±i5È^x]BÉõÛàŠìQø08x[$“-Á“qOºî	b©GCOx?&ÈˆÒÉÏýð8Ìzaa_r
RèRÞ¢ÁÍ‰WåÄÍgÓ£·úÅ^ãfžk•Øµes«õólúaÂzý²n´Ô–DËéP™–o¦?¢»ì×úD˜w§e2UÞÈ–à5ÉòRúÎg|à`æÃ 9Ó+Å¦—QïŽÎÇwdpƒÍ‚¨Ü,•àvfæÅÎ¬™PŽŽü|–Ò‹˜‡÷ÍÉq­ÑhI—cLIQa~j'á(ÇJÑ¢ìI:úó)}ôþ’CJH£K'_mv6)®©‘V‹þ]”Û`™$û ËäpTÛ™Mo¥G&Ñh{Ü‡1P|Õn¦¸äÞ’„;Ë®ŒT(Í¯™^Tf‡q®0†ë=fâÏ´«lZ8½lZ¹“Ê¦Ô\ml4¹ì^x§;lzÏŸ ÎÙ†B¤YõµÄmòCÞ"§^ž0ûÄþ»5ë.à‡8§:P„¨_ÈÜoÿ²1|,uk™9ÓGŽ³@¹g§õ¨¹Qà>W}4Uõæ¤@n¤¥yôI%wŒÒB\)Û_Ø“õìÌEŠF#©´Îûšpõ
ýœ'²gÆ ã‘×9Þ½qƒÚ3zž®ìEzï$²
'ÞëÊE†.uAËâ)oñaoçã¹Ô”7y¸7ªÙ¬³²Ú”×ºªm4´þ€Š˜J®÷ôaØfÃ´ÓuamÕÖOJˆuÆýà|€?pÊïéë6±@“õ§i¤(h'œÑ !¯Àa§„?Ï°/ùó´Šøó|f«¿Õ¼€ÔþYûø‘(kÂÂÜã_(ú®´4~|B Vã!äöë^ÍFLØQ€å²]ó¨vÏl%Ò“¢Û¦£0RG!¢*Uä<?1º®ŸF.·N92 ;²¼{M¶nìhÆ–ÞLºñ§Y£Ýr^DÉ4üIErâ»×Í±U9aõ8ß„‚Fçµ{PfUdÏ)y](JO¢!´ x~Dä„.|8|ìå)?ßCÊG	@  ÏrVºW”çP;ÑYGW`l.0ó"~š‡šmdèÊ“&$KqlŒ´¡çaKpúeH*'†Mÿ   ÿÿì½[sÛHÒ(øÞ¿¢šÓÓ¢zDŠ /¢Ô¾,u³5¶l)OïŒÇ§‘‰Ip Ð’Z£ˆóº±±û¼{ö‡_°?a3ëTª P’»çûöpz,¨kVVÞ*+ó÷€»¶ž»&ö`.£ÙHî².~Šú:DÛy~´lr,æZ7üSå‡¬%½y18ûð~ð†¼{òæìè=ÙýáèìíÛ³—÷½÷õˆð¬!˜ÊCt´¨HÁ÷g+?	ÃÄîMZè1¢öwþb:z€zx‰ÑSV—¤žv£Þ Ê]ÚÓfqûY²4d§é-)‹öWÁCA»¦£›öÉs²!åBrÄ±˜xÐ—NÎÄ3~vŸÁE¼ Ðl=Ú`¶ÖÚÅœü1œî‹ô`CóÝç;í´Ò4‡lA©Y™ƒ/•7î
V@ã»V®[hk+³æ±P˜x£0F°–'¾80now]„µ)è¬)„‘±g]ºP{&²Æ‹ã§³©ÒÏŒ¤‹fpºGø"¥áÊµÖMX”+Bïª=/!sáã6ŽÎ¯Èðìý‡WÜbOèÔÂ$œ{IcÑÉtuÜæ’G€ßAÌ1˜!„KŸðc°lö$aðÈù†ãg¯x1Ån6†¹??Ç$2ãÀ›…2¢èhG/>Ÿ{W”9„Œý¨™st±%SŸOú™<{eÍÂ­AÚ½ÔéÝÅôÿž‰}ÊNâ™EÚ2[G3VHÔ°'hœ%¶¤ÜZ"aËwÝ‰Üi•F¿v[¹võ˜Õ9Ã³ˆÖ¯ÎNŽé!ì›·oØÝ€j¸¼šÃ“|Û9§‘\fêUä,Öi¸ÑÓRzÊ7ú0óó0´ŒFÀ\)Â³AšUh“„ölgEÎ•6i$Mv‰?hÊ[üDçU´¤ë´Ÿ²½¯O1³í§i!ñ(ëÚ×Mü¼¹ñf
¹—x3¢&yå')AÑ€rÂ‚b.&Ï$ú|š=#Kô´æt-sÓÅ ±l	ª&È`æB‚)þÅ`Í@‘i0Ì]{\2è`ñØy‘Gfüš^³"ÌHŽ6%Š?Ñ°Ë^vÍ —Ãj™¨"|Ž$—†VOÁúHj;Î¼æ¦÷Ë«^ø¡ø®±î'%Suú(Ön¶
íªW:IšÔóÆìMiíU:YêZ5ÀÖ¯½~ÈKÃóøÍ[ø#Ëéñu¯’Þ‹Puôß7áØW+¤ñ”¿Yßóê£š‚m+•^	!œE¨—û0&ÞðÎC/KY­¥g,¥5ƒž´e‰­i¶o=C6®ÁK­¢µŸ¦" ˜…î=‹Ë§4¸¶ ·ÌÞc9ý¶ðxWroÇ¹&ÓªZ›ðxt)µ7LÂKØãÑ¼n¬Åw°S¼‰¯·ÉªjíEþ2Œ’|æñ‚|ã¬5^QkÓÆŸ#«’—&}ÄZôÓºz›Á$¸˜y¿þ*7*ž‘wïÞî§MÿÝ[æZMkS&9‘9¥ˆH8–&Î¹cšäQžg¡~:é¾`~¼üÇÖ§dW„ƒx¡¶Û¹ìàüMÈ–?¡tÓš%\Š,¨øÁœ†çx!"¹ÌU ¬,Íº˜ËØ[)Uxê46—È{m+Î5¥ N¯BF˜¦HHi¸S˜¿¡iNj+hÂ¦…ÉÙ’"hZsç•D‰Ýð§.R’¼©ñf¤4

óAê;ýñ}ÒŽ§²ŽgDÔjìzÄ¬ã…fíÆ¾$ß#¸!søÚWøM÷ ÚUÁ%“[‰ ¥Yv*¸™Tàl‰þ¾UÙòzxïcl *¾ò…è#xÈçœŠÌûMOû<—O0á@—¥¹r-™”ôTE,mˆ-#n^ª3$À=ôãK ­dÈ)²”k]¢Ê@»”;•jFt…B§çªÑëT"Õ•­i’\ÊsDŽ˜¾äã#â?hÔ3ƒ+ŸÐe@6ÖU™G¦àé@YŽøù9ª.×9IŸ k]>5¯–¹+Ï¹ “›4³îWà™%ó’éJ O$”Ì™U)
¹ƒ/i8¾´ñ“Ì·gç'ÖÅ\®òÑé_ëU9€DØ)(Þ>6£1³š¯Éjbà¦Ù•|"kÏ¨ÞH(”['J8ne‰\½ ÏÒX»ê®„áñXzŒEØ`!Ì1±¹BÍ+%»¼O’K[rK¥%«¥íN[qK}Ë²MÝ]»ý¬ÀQw<¥%û¯"ºTú]5F5·t±0U²F¦p6¼ËEðÛîæÂâ°èo¹`yûw>»¢á°FN<hŒn`ÍÖÎ>3J³NÆOk”Ñpæ<!pÍ‰%<WÃ	µ(_Fÿx@9Öé0ÛuþByDAnî 8¹û9´0‚'˜\‚¯2üh¶Í‰üÆßÍ»orÏ*²6<vQ.*pÌYÎP@ˆ,Y+Y¶ÊXb¶T5‡e!N[Sš#(~ðJ™æe-»Gj÷$Ö2ÇÔº3ö†±4Œ/ÐÐ}éÿŒ“éÓÛŸ<Û#nÅEÏeÀÄcu¥c	Ÿa`G[ÍV¯ÆP6ÏŽIáUä-¿þbŠPžU³û°Å4Fs^Xó]}9«i¬‰	M’ùŽ¯’ô(¡°ù}J¼øéC|.²eëÆä©%zF…a$ÅÌX]YGÝØÖcT¢kBÇq3AE?a^oŒ™IsœOßŒIÛãHk²œ%K©‘Žš%z)ú×ËIçœ›	‚ãA¨IyQMi7òh»æòëÄzQ‘ryýdö)H—{÷oˆU,Ùª–ZõÁe=ûZ§~”JÞªà”vì
+­dfôÔ`~yWê]Ò\ºVÑ²nv*‹5\ûc,b?ipSKjîÖ(J‘¹1G¡Å´]«h,`i¼Š\'1/ zlBJ1'_Ì¿’²¦J-“ì° e*KÀÈ¾®ÔŸM1jé¡À·5‡$=U¬¥È£›[Ó5 yâr®?Ö
ym aQ#Åbÿ=øº[h¼¸X ƒŸ-Cw%*JK¨(Èm;Û]~Åú:.
ð¸®	½“5ÏGfB+U4C€ºž9·$´ ²åËÝòN×±T‹É9UžgBJås¬9T29ëÜË<h®{…ð™â?¿—mÐ‹ÏfãC‡¤n‘×7‰­–.V?Ì"SÝâ÷øF>>2ƒ©¯ÿuM}Â°—DCZÀlòÜ¤ÏË3Î¯G×ñ£ GÐ£¯ú¨—œ+U‹*`Ìë Né!&ï—dÞvˆd paºx;M{ã}!Ì¦"YSô.×›öQÉˆÊWì¦T¹f‰A•},fU>U+"â§ØÄÊ>%zAö1˜`M3cÞÛjmqø‘í*åjC[ÑÖKº’}Ê­(Ur¯XŽ¤»TEí«¶—ž…æUcKøXÓA°¶FŒÍ#Œ”ª=’ñ´ïd«[Mæp9ë`­xÖ0Ö”•>ì<PhÒLwðc@Ò»Á.%P<æ¢É.Ä[Ð·ïaÿ!&Ò6OÌâVUžeÞŠ½È¼×ÙôÆ_ÁÓÈ¼Ós§äã±T¹ñni1HÙ$BŠÕEæ!^.EñÇF…ûÚŠØ§Àb$>¿/"¡I¨g°©ƒñ6Eû÷À˜ªÎÖiŽ3ö^°XSeV€‚£q)(fÎ$ÞÌñ±¶f'=,;ÇHVRžˆœåçV8pg}a“Enâ•<Äé/@ÆAú ~cx·­ûºŽçZÜ#uôêeoéžûcÑÏ9àžÏä_dÀØÊ¹žãf¤NÔ{ü5ÿU—ß!, +ê9^;gT£¶:_ÿB¿F,2~…Ñ%0–¸ö)ó^âSÖ4!Zk‹Ñl:V=s–:â£kú~üÎÃÔLØ£¥ò#ºú7éeÎø§ ™AX®f±G†V*í]úIý¤+W™a¼™à²rùsØ®a\¹øvÄE€—«O"½ðÜXÒ¸X•krG¯Š¥ÿÕçßƒKšßkH%+¯úxfþ¿ú\ï®Ñüt•à€‚â)úÖ¶Ç4Y#+­êqµËpqÐˆV¥c\žš¥¤„ –ùõ–6M<¯Ø"ê·O¥}÷ý÷ä[uKÑjŒèÀÆ?º¸ðG‰¢ó*X€öÑd¾Bg!º$\R?ˆs
L8ò²,ðZk²A£Ü²€š9Pmesà5óÎýœðÊúÀWuòÿîV…Õs²|ÂíãÉ |éÓkëB©IO1tN`‡¥ÇØŠs)ÿUÞ !ö½‚ÁlÂì°<¸.^?§"¼¡W¿
Îë«r*x­N
ýIö+]„§·é×;…™`ò«ì×e!OoW4›·pÏ5³CA³@Ô¥<pN&þødñòBÙÝ8üžÇúž|ñãóèoÒ«=´.ÞÉI[×Æ¾?œG	)f/?,1ýÇ»i˜„´Øø[l˜Ù×!ÀRü„%yC·&CmÚÌjùÞXyL£¹à;váï$¾Ál6ˆa›ÙXÔ
'ãX+M‹¦ÒÁCø¿cƒ}‡²ñÂ‡Ú£Ÿì‹²GNLÏY•tµ²±tåö0Ìè•ö”/#ŒP•f”ñªŒ‚”ô[´#­8´TÉË@Š·¤z#3p-€ÔŽW£Dàù'Í-VsˆÈŸC !Ìa}/MŸ°ŸCÀ)tåe:ý“J­>{¦a#Œ7ùáË•áêhºG>,à—¯ ª{Eç,Ö‘Å€Ñ¬·Í›KoI¼:G¯Ý	œAŠKî˜œúÎ‹¼y,_,¿B	üKTÇìŸ+h\~Mc2!„¡.;h¦°8~ÄÓÑIí¸ð‹ü‰p#&[¿æK/šx^y3ò3ÆÂ"nn‘–|“1'üö‚f¨¤™¥'J0zÆ,–AŠ©®À|õ	è‰A8~Ÿ{>Ç]#? Ie¤>9Ÿ¼ˆ¼±üìŽS‡guüW=(ì£ÁœR7†äâ§2nÖÒ³z­¦Þ\ÄP„PÇ<ÿ‰öP¹½Šèå& $t«B•ü‡¹gÌ`R“õˆs E éÐ–Gð½ÁjÂ—'/ÏN__Žf>’«tÞL}2ÈDü¦cÊõŸÛoò›HÎÿÛ¬Ê¿þ%‰tß¢H'TªM.q3þÌÇ¸Å Ôñf'°N¨þyØÄ`º@µÌÊÄ'X
]L`DÔÖÁÛ#—†Ü|>¹zõE¸z¹âHNöj¬;bœd°izãñÑ€z¯ûð ¾ûÔˆ²±%jóÇjUÞ}ñÓª0¬
“p5šRÑ^ís©:Èqx­NK°Zócyæ–ØÒ§Ë€B¬ç¿ëªy1Dk†	¬€Ži¤ˆ†¨·øwê®
¤r†gÕô%uéT~TZ ò6f…žg·%^"2aˆaÚ<Ž:ûñ§¬¢60œ€ZPÈ³§ò 1»BwSNò ÷˜Žç.7{¾.™J’¶‚Þ{Z[YnIa‰çrB„µkzKÛmµÄº	ýDY¥ _”®`¶´›?æÈŒšëaµú¶-PZÛ¶Öª¯a¾ žÐü$¡ŸÊsJú¶hû¹Dš2"®²‘\Âà@4×†–OäÛ"B«î—ûiyŒŒ³A5×mé$Ïâ&E=†xé<¨’Î§òœ4”÷”övZpó.—w¨ÑYÈ”z^t”àÅÅÐ4¯Ó­²ûýkXTF»±€á‚¾køEýìgŠ,¸"¢y3óCÛÅóïjÍ¤nI³Ù2	XˆQ@K eìÁ¦Nxw¡.v¹•Iê¼¨ûéÇ<‹xû4\!ÆHù†&~òri“Í–ÂÖE›þxB'ƒ„$§d2	ñ]*m8ŽÜH×ÒÈ0 ö({+ÊPvm­„‘¯5b,wêÍ¼yZoïOE’e²D›`ŽV(^51']3Nnf~S˜ãÔüÎmÍ8ª²ºµlˆ²]µ…4Œ"–—MYQN`RWË…÷­¬Žoj;’e§M<Õš4e°Q™ùŠ¥ãÊ:¦ûyD³ÏŽÒÜ ðÀ‹1ï×&FÈñìÙs²±(›}¥;ÕÌÙóì\-ýBÑipŒ$
ìÆ¦r*(§%pG>Mè®‰fî+0‹­½yþþ~Ï€ú/n<{ë¢Àýšg–/ìdE*u!·"Û‹ê™¶!ÕQÈªØî2nåÕñxK5ã¥67ÕÚ—ÎA˜¤À,6€¼o¨É¡.·÷¼‰oÉóçDy,°øy“žx–¼Ç×-¹_²sÎ‚£æd/Ó¶+',¨2¨Ic%ö­\%Ûw¦ÁÙ· ,ŒÀ~`Yà–^ûTZÝ¨Ýœñ=£TTaÍ:¾ØJ†­z’e6’…• pP’ç0–¥
m¼¢!óÇÁÈ¢K<u}*6À$›
ÚVhã?±zÇï)ØëX®ù&œoÆj5ßñ¹7å?xêxþëÏ0¸é™?_†›,«0Ä¤'ž°U|r–Nh²Ä—E¬wÈšIÌëÒãâ%«¦Ãïžö[*rÌã*³¡ý£×NÉáÉàtÿä5žþâðäÝû·Ã£¡ü,ÿäð„Š½9<yó"£w%+¨)fŒ–cÉRºøxƒWˆ $7ß©[Šô?÷ qÑ¢
m
P+ßi8öf›,Ãož€2íÉ”#+•Ôi²&Oý™7[EÐas::< ûoNjtá+ÂÕ„*Lè@(;¶Z¦Éˆt”¨q°²lRCÿDZo‘CS]¬rÏsZwOÕ¾+—¹—”soæ(/lßq¸™IÐÁÉåŸùûSºÑ¼Õ²ÅÂð%ÛË<ñæ#öm&Øà&°ÝzM^ôyC—‡Í­¬àXY,I‡%=7
0Á&»Màú£ÑŽÃo¸;žßk}’Kâaæ:ûà¹ã^z7_’EmûÉEW2~° nŸSùjû»[€q8ö?¼?9N.`4yîµy÷™¤«V ‡!˜  ²£,ØÊÂb÷¼»{Þã°èûŽ7®‹|I‹3@'>òa™‡G*Q=2@^3QÁñãIÑ‚ãf!,.œQ§u!~¶wGŽ[ù’iG~LªÂ‹®¶i‡þ¹Ø¦,„€¿ÓµG£V{×=¯|I`^šFÆy(0õàÞ@ø¤Z•å»_(Rÿ…åˆ£ ÿÉÁ!´ñŒ¶¥É™RµWU$·›çŸR=WóBJ„zšÁ_1¯°ŒÕÜÇ‘$SCŠ}GRÏÍ9ÌaŸÖ®¼ ËËyk›„rÔ|9¯B¤¤çÆ›Ÿ[MOÚ=AãåOZR+˜¿þIK5ôÕû‹rl’Îñ]Ã†À?oW‰vûÑQ¡c	ð¦¨/ÏKb‡§±Jsîâ‚_¨~éÃóD<O´T´7¼}ûæ„F†··Éá•`Dþ
xFäd6[aÒ7jmÅ;ªÜ·§ÔC^
ê#\viHªåu£‡Ñœa.@èš“`ØLürÞh»¹ >Ù›ÛŽÓjµ÷·FÄá&^ÑVˆ÷´›†,On«ÕßßÝMïî?ÕÈ^I›Ìt¨4Ú9èö²F•ËŒ;Çýã*¢%Qjó¨×…9‹6•XÕHŽ÷m¦#ê:Žëf#rÛ5°!¬¾áò^Bþë*éMîðBÎn@•<.§÷xéiDv…÷c›Þ™ÔHÐ+ˆÓÆGg§Ë_Á·EË]Á{GÔÀ»ôw×nøxÈó~ÔðÈ¾ÿ
Jó ®øå´ìzéÌ×]ã/€­µ^?­µ€âàûkTÝÙÓvZ#×óÙ"~Z›&Éro{ûêêªyÕn†Ñd&ÓÚ†6jªË8u¯žæã‡È£½õÙígã[Bþ' «4‡awC/9˜…«qÁ%²ÖÑC@Ø#iÔƒ:€t‹åõæÄvŒ®½>†µÛ"·¤¼Kþ€!Øžáð°#Òly¿8Ž‹-ü;€ãf?ˆÆÎ½ Ð¦cèÀÒn»¾ÞjîÀx2ÖZ8¹.6œ•mît‹Š÷×+^:·Kî(ßíVyu¨º÷‚ªÛ¡£k+£ëU!nKT¯®ë/‚+87xÿÁš€¨{9+Þ±[b„ÒŒÚ…3êªÅõ‡ØäÂç¸1BÂÒ(ÚM¬(•$%’ìvb*S6‚E/¾‹}}ó¬ê#)Â@ãHQtû= sØÕ!Ã©’ëÆSË{Ñc 2Døvw>ôipä­
ëíGZe ÆÐiºæQÞ<l(íõ†â6{–¡ áZs(Ÿñ2 ÌÂÕØ¿ˆ­—ŸN¼àú	ÆOkKP.†«zH¬‘þ÷Úå¿á/–ck•JtT ¾ˆý„UÂÔ
ó´ö‡ããcLEŸ½e
5w-÷
MM²h=J£T™È5šr%5¹­N(Å¨.}u0="Ì_gþ Ù}íéïuvN7h†È“m¶§Œ/Q»tšdøêod›½ùëÉû·§GoÎÈ‹÷ƒw/O†ôŒdLÂE¦*›4MÚ”Ië·DÔ¥ã*€Ô(ˆF@xF Ù9€`tƒ_º5pj÷…†·Šfõ?p°Yú‰¢k’CÁ¢c€¼«	8tÚimu[ä/îV§Eºð¯KþÒënµ»d~tÉ_úôOŠuÉëýów1VîHûÝí{{rÏ9é9imsr`´0¿80v·Kœ]ø³Cþâ¶ào‹¸L¦ìºô¯ë¶pê¯±ü-›Ûý§†Xy<»A\BÀ*¢Lô©˜ùK{«Ezøe¾8îVGµ$° ºélå˜º5Gü~rä-ŸÖ¨9îÑ—IS•'Õ†¥kva6]üºC¿:ð¸úÄ@—xÜ©=±T3E”ÆÏ­Ñî÷p²²Ã©J›¤-QürS±ÑÈ"€MëçÖÏýåõÏÑäÜåöKÇÝjmD´ùéëÓ"Ø‰=Ü˜]$Imø×e„©‹„	è&øÓƒb@‹\ú§d¿¶gRD©K—›.qaVm$EF{º”ì¾æ4è+ÒÕÿA|þñáøÐóGi\M¤é¸*õaÒêo Òt)aø£H2`ÃíPšò ˜×]JgÒÝ2ê`0èýÿ†×Ã|ƒÿŒÎ<µ·-Çœöï¹çèÑÙ4˜Ï}š¢M %è%mÒ6ß£.šn1Ëé+¢‚j}*žÔi¿Ë	ï´¸Ëž½Ë’)£.Ÿh§Å'Ú-îu×Þk‰!õê:|¦n«ÊLw¸®ù:_Òbø"â½gx¬~ù1Ù"§¡–¾,7ÔŒ*w·œ> Yr\{iU«íÁ.ljø?}èVN&ÎlGWYÛ-§·³…'HEBëÚ›æï6ÉÙË#ÂƒåbÆíƒ³ï¬ x2ÉÎ7žÖ¤#·-ÒpÜM+Ä¾Â_oèÉ8÷›8‚nécrÎ¼’`|öÝÖ–ƒ
>0@`Ìx¤±å´P7‘s~·ñ9ÈÙH¤X—Ïàß:î¸®iÃØ!›iâkõ/Ð'¬»\	ûëc-Ú±ÓE„èÁƒnŸU²8½^»eBä
#p» nÏ¥=»	˜¤Û‡Âwá/šÚ-—UÊGP$Û–z…UèÛ×ž­þOaˆ;mÐ 'VÜ‘e{ì/a^Å.œÝL`WRÏ…št€c¬ÝþÛÆ'éÔÚ‡.,C1¹Ñ›¥ÅuÚr: ÐÐwá‰´c©Ý4eÊNËé»9y£D¾*„:uzdS_ÓKŸHŒ
Á‚×>	ªÈ5‚¬¸ÌÒê©¾#ðh}t­°‹ül˜Ÿ‹IÄxÈlhBÈ3ß›‘aùœæÉà8étðŸ³›M¨+MDŒ»h¥Ñ/v˜\:-|8XŒ¦hÏãñÌÏã5ƒ_<Ú#üü‰a­¿øàØ›3hÃ:5b^.jÏñd;¸/è0
#`B° o1xQ4ÌoG[4?~¢‘Í¯¿Æì:½‡ÍÐb8GÇ¡×çv­™µÛ%+'°!›Y{­•ƒÁ=hrx£â”B½[/Œi
¦·S²p‚ädÓsÕÉÑÉ¶ÙáíÄ†HêÜÝ­níÙÙûÁ›áñÑûÍ›ÓuF¹^¥+µ;\Žvu™ö;ÇýƒþaÉ-á™¨ïÈ#¡Žì¯‚úéÓË¤Ne”+6¥¥·ðgø
¡³ŠüÍ"ùDP0t˜ÓŽ›Ñ/”¢Ûé3ŠÜÎ¶dë¨}è”s—¢©ât^†Qð+†˜Ñ5ÁìÃ8xT‹ô)zGOÜdyxäÖwÙ‘›Ûí°37|ï°}ÐÞo­·ù>võ>v¿§¥wBŸ<v/N®ç+ôâæzq¿B/í\/í¯ÐK'×K§r/;àOXÑ)¶À™EÞ(Lœ3LÞ‡áE¡‚¡É„¨Oì€ Ù¡Â!ŠÐødíLÖdþÅÛº†Ž{¬ã­H¢>ýÓÛ•;>lw;­¼ü^hP§!ÞAÍbàÁX ‡…_*‡>[¼¾vNÏek×©@»ÒÕ•kù¬õÛÓûÝÙýMúíëýîö~‹~Ý–Ö¯ë´“~]½_Ôƒ~u¼rÑ?ãáýlª E8ðáò†lã—/^LWd˜õw‘?Vs¦¼|O~B«S!ïÏ¬n·îkTÍéßîÎV¿K^;í6þý{NX}(Ïç#g3*ÜÈ9*ÓiS*Óu±ÙÅ¢£Ÿ×× ];m®Ïhç>lá¶º‹ÄÀÖ`º´ÕÝÞÃZuÝÚ\»ÇþÐ%rÝÎ[í°V»öÇ¡­vº–VËÄÓ— "RÖ¸…³UÕ¸°=&R¢›Þ˜Ê¬ýýâi!®J„µÇ7^KtNàv:3uH›Ûé¨}°ÑG*ow™Å äòöŽd q¸$cÝƒöÀ­@ZÊXé‹YxEÏ+pð6Xc‚q} 0~¼Ù~ƒC(X‹Ûºñå_ÿ2]xÚ,:]QàÁÊÌ „ë*à±ËíA2.ºI‚þs‡]soKø†cz0:¾TßÝeúQ¿]b‡aFòLÝí5×°TäõÝnšŽ%|coÁúþDïŽš–ÞÄ¼!þEbvÉ ^‚¶O†<ôZ%½°Oç½›é…]7[—vG7Ô™ØÌÈ·áp%ÃÍUô‡ãƒ£ƒÃNíîá†O8õg*!	ÊfœÖ.ßþ­–ÐÃv¶ÿ‹d\H¢´`4/Ú.0‰àŸñ€ñû”´½ÑÔOøŸ"Š¿Ç-~!7À@‡ÑTTè¶*d[Ô‘I–cØ£Ì(©·uhQÎûÜÓbÆ7;vûÃQoçÈ]‹ïv$û­D~(ÂáäZ’­GhQvv˜µßÛù÷J®*èziÿîÑÁÁN¡¿x6µÝõAçîŽz­j ë;ÿ~ ë÷ìXwìtZ…²W6µöú *t±v€q§œRÐÄG«á!àÁÅ…ïoÇ”Äœ€àïˆ$S<ãB¢Y‰"¸ìØÃ‘¸ƒd3Ìþh§sÐ>(_‰^µ]»»f÷íÎnÿ°ÔðQµ{*x®Ó½ØUÓýN{Íîf>N÷ýÖšÝïîww÷{ÖýÎº¨Ç¹AµîËœ£ž$|r†©óÓ„šá×1»»NK¯Ú’xÕíçÏAûûÝÁCw©[Ã”•É;D.8‚\@§TiðlìöÍ‡¸-•4ßC2dÂ4J†ûGGíã~É°¢†çr-ÇNE<·'Œàý2
Iì	ARôÒ½´Ø÷>[ÜW ýW’.ÝKnºh_©Ž8ÍÇYýµ)F©‰›"ÛO^4'o¿øÑÔ÷Æäµ7_’óÕì<åS€zq&û–r¡L`ßáê:Ú*˜­UÎ<T]Wä%¨Ý.çùQy¨Jˆ}èv%•!v	6<¦J^0gÇ-SÀÝ{+àeÒÌpæûË ¾ñ(L„“Á—zíÕ
ÕeúìÆ§Y!X¼n@(Q*,:³·ù¡‡qÜªBÃ’n #6–1‡lK:C¾¦b_t#Û{„œW‚¾Ån$é„¨Í6H—mrvXµ}a08ßCKë«äå6±¹q¬“Ð­h‰™'Ìø†œÏÂó{ ç˜T@tNÛÛ»Né¥xªÌöžÐPQÕÝÚœäUGÔQ©uþÈqk‡8ífwÏ ¶vî!í_åCCË¹Š¼%ž¿xÌ££Wt¹í5ÑÙ’yÍ;mæ(Mkþh_y	eG³/×ú7…,Êks™¨)øh§ÉKé£tÀîAû¨›?è.ôÂ,qjaþUË0I`ÌËj©°Ð4”û ¦V‘G¹­Òi÷Í¶7¯ZÖÃÈ¬äâÚiÃòöñâ\›:Ùº=öàï’¸sØ.§‰•…·Ë7'õwˆdŠÑ9wí¼Ù‚^=Á¸Uù:æüëDIF)*%¶Æ@‰æ8ÿúGÉž¦Ìµä³6¡JYÞê4ÖÝ¯80Ÿçt0ž«òcÏý#OÆv»ðSM+>
«åv*}±,ÖR€25"Y>5!IÌü§·5˜zÇ’—n‘Ú_ÿŠÿi'?-Ó‚?™:òdiÜO÷z†³ ßÛð¥Óž¡Q(Í¢ÐH‹ÐkR¦mÙû>&æ¼ß.ƒDƒ …ëÓÃöWÏÆ²t[d.c€ç=•~Ø¼ÀóÄÓ0Â“,÷l‘ý‘ DÔ\À!¦QÏ×â’{Âóˆ:üÄŒÖHDñ’£Áòl©1!i8Ô»oY†pyI‚b€ðró9Pü‘OB „Á¢ÁèÕžý¿ÿ×ÿþ¿ÚŠãN:ÆçË\Ç)Äseý³õÁÀw†ôêAÖ÷çŸªaÚ/,dHÃÝhSú¯ˆ:IÃæOþÜ¼Ù¸$›TÓ,pûacCQÌNN^ùósoF‘å'6
ç>½ÜaÚHË¥•jO‘µ¡Æ;ÑÑIrvÄ¨ºå18køè¹©(@m´Xj Èö±€íGè"\Èe£+Ât"]`ßX
aØ¢Û]è¡‰˜ýá¯0ºâØ‹.÷”§ý‚˜‹˜Ÿ·É¢Âòï|–F7=ƒ0±žWÙ cG†„Šõoõ¼‹–Sa	šylÿeªçÅMãÜO®03bÇÌ6í·ì5Ì{­mÕWõú°ÕÜiNŠÈò1XµÈª<ÈhßÝm}2ìwþSb•wÆD›ÛnžEÁâ²aŽÇÉ'À"µ«s@bÑ•º)B×Ú"æ%ÃÔ Àæ–'­4ü¿ ®³IŽ¸fðœf#E¥qLSJ[{FiFµFRµ¼8P)#I*ÈÇ>¦Ê~$¿ÙpðÒ£þ<U8ßÌÒ³¶á™kf	 rûÉîlRHö…·Œo¥Ü äO$ßydxÒ Yttž: -‰Áºá‹%Yôô}Ç¿ü°‰¿ô]¥}é6»å8nDBª­‡}€pbÅ;3î	åA‰Wïý’ÜÖ•,AÏ›rž	šøƒ&{Áð‘Cšv¶¾Œ'‡¾J&×úÐÏ‰á+0VåYœå|/mÏ±Úè­±ÇªŠÅø¹Õ¹W.ø¸¨ƒ©ÿ%Â<ß*¸: ®ŽF¢
M(üVéè0¼Z<´+«	 tãZ_XE*yàÀ¯PX;(¼ß¨Ô·¤¹e*Š>`Œ¬¯~¤xúÌÎAÃßg¡RÍz/ûHöEÝš·JádÁS‹‘÷×îÙŠ¿ÝUbñŸ,òÑøÕ„RZÔy“d…ŸJªQicyM”Ý=ÇÈÿ÷²&ëmO¢`LðÜÛ1*Ê(¼“Xž—D¹ÕÈ-KkAÓ‡ÖYFÐ Àæ">JZûÇ.RËÌöpÜ•Ôäð4_Ëwê%Óž >ÆªÁFÃÓÐë;Í.ÕwL¹è(ÄÓ;Má¡Òå6èb‚— “MEZfáÉò°ßç”w/ü8nàm–OcFRnìv‹t¤\
¦4\q	XU(8âÌf÷s ‹P‹} ÒÜÒñmÃ(&²™ÑÀ¹èIˆ~B|,EÆeñ±&@»ÑBWDøWèþ‚IS‘!nˆþ_¸	Å§ÒL‡³ ÙÎB44S¯è½zsL®‡Z» :2
ÔKçŒ“uyš„>NÚ¥ÉP,ê9*D÷ta¿ˆ'Å=;Ý¯nI‡[’¥ËN’°ÄSTÛ¤èÅŒÿ1*·ÈGÓw¶]ÒHÏx7ôA^¤&`ÊaÀ¯ô¡ô3œÁ?ûó€u¼ô0‰6‚è(á6Hà¨¹YrÍôªÑCX2˜Í"É+zÎ{À–ZEf;&ör¢w#¾ÌT2Øn¥&¢¹"ò²½²wÕØ)´ U¤êf¸ 8î¯’¤$ÐM1 ì¶E™p“Gfÿ„g7þ‰1ªÈ&¶ÐIá«UÚ.%ªL®X¥íÅ…Ô=r2H}OÎðÃÉâ"¼×&²«²l‹ xŠó™äHÇ•åšo@w>(þ¹"sÙ®àÙ½w‡ªB{2•UwZÁ×²h1}^Y{Óv`E iS¤n'÷ÙO¨¬P`Z”ª2s˜Ò\5L¬@ãó+Àíg$µ¨U¢Á˜µ#›¯2k[Î¾Õ,©–Žy™ˆ-˜Tˆyú*R"R°Òfk)Ö´Š<ˆ6¯­pÚá·Ó‚î=àJµgï—ö¦êIçK¶µãÜqc´ZŒ€?WžªX$š(q}c“6•5&^yÛ¬Gé\Èr.Î>w…v·"ãÚvf0—±¢•šFŠŽÔ
å­Oy^w¦Pùä°úPÜˆ“OjŸ*ç¶wš‡ëtúÑ—`ÊBõzÈ¡Ëñêc=Ì¼(ˆ-÷ñžÄü±4–zï&·SŸ´é˜¯ËùzzÌ—*àºñE_MvÇmF¬8ÞC­pü™Jñ¡µ4PŽGå¥R/üse’Èf²zÎ$;äêx¬UM§)Mùyp–nµsÚ{ä=è/¤nŒTˆÍ¥Laø°3½¬‹m·ôÀãÉñƒêåt™žÜú3I¾"UþíF_»xê>à¯TìH
ÏpðL#
ôÐÏ  AbNdKdËí©»¬n\çLµ2´”?:—<±Òäµ%ÞU@¸¨‰
H—rüÂÍd“o´Ã'^‚?<t:»ÀÛD£|õMdj‡½à]±7¼;WÐ5ÓKJÞø¦‚=ÅÅ˜–&ÆX–VÎêSfÔ4ëíód‘©ªé¯š+•Îže¾dC¾¢ù¶‡¾O ¼á±²ÕŸˆà¼§²™²WÛTÆe†»—ÙX®©kR{Œ›÷É6ÃÄ
Â@)¹Î›ï¹©t9õ×¢“i:fz$„×©¯‚dJ+ œì…™åfùOoÏAøÎfÕßûù-¤óˆ”Ç^7ðœ†{—ÄøsÍþÌñÔ*	£Â²GŸ{2dŸfê¥I{Ø{@²0„‰p¬¦q.°SztŽ^nÚèòKw'áè²µ ‘uw6•3‰ñµõT´ØxQBž¢¡5i^‹q}„5FÍ%ÒÆQÒÆÔ!©¾c£[x¬Q~ Æ2Xû6)Ù’Âšîf<Â‚m=¯²$µæuÛ´3ŒÚ¸‡0%?ŒŠh¯¨lØN¯›åÖuúìGjÅ@ÂHÔIj"YWÌŒ, ÀH„L9iA¢üdRâcó^‘+@±§üÉ£7¤¶¨B7y]0—˜|˜›¦Ä¼™Ù5ånúÐv&¦p/¸Šƒô¿c›ƒM¦P+Œ£GnZ¸ä¸Î›%¼4uY-.lKsLÂó_N#…Ì%„IÌi•˜ÄhÖ²‚¾Í[%g0ôô©8´±ï'¾I»ÚÞ5Ø5ÉÐltÉ„¾…XBk®—ùy°[—W€f`PèdSû0_ÍkÅ6Ž'Ût*… +¶-”Y¢Sív”3t`/ÞSÓvÞ>•°ÊEmîË„îÓÐÜd,fá>ô«gÅ
æ?m—NØù/^[±¨ºB©¤ÅÄÀlós3L«8x1/
›—^4ñþ¼òf÷1±•›Õª©Åe†Û#wáK›‡ÿV7dÀ,6¥çT9yBº"'?.ºØõ4ñÒ4ål‰rB%™?™’çWðñ›˜F6úÒ›P*]/48/ÏB”î¨0Xl,fžÍä4J#ýÝ­¬´Iœ<ÕM³Ö$e4µ\«.zåÖv-Æf7ãrP™–'>…ûi8éµ*V«Šªm¨!Ò-ÈŸ“ÏûG¯OHý;þ¤ùÏäænó3Þ_Ç\'µ›•º¬Xÿ^±ÍÙ€KyûvK2Ð'foÍ™kßû—áÜ½*$ïäu¶çøO^Ú¨`¹Õí¶ dÜÓFk´GÞËÈÙ©jÖLeyØ¯Ùf5½éËºwÅe$õœ,]+«¬
&ƒÄÊynk—þj‘0v§õÇZ3^Î‚¤^«qx4õ"á”gõõ¤œ[øÑå8xÏê´ß¹—Ó~ÅÅ[:»GhìŠ¬Z­]oìþ¸v^¿i9#*2WæW¶VV½wš:"~ÞÚlwë/FáØÿðþä œ/T‹¤ž»Ì·y÷ÙÂÐü@:m¹–µl¾·ZvCµX>öÒµí‘EÖÈÌVWÉÎÈoª†QRÿÔ5­‰‚)=Ì(¸ŽÐì©ØîÇ]Wh|‘Ì—n&@#u1Yð¸ÓojÈkÌ)ÃÀ4#[¼8‰üd45lÛÌq“–^$LC~D™6ðjýÈvÙÂaÁ8›aê˜³E!óxdqÌÖÓ©]ãªÑéX,:ÌÊ$æƒß³ûV@;Fè›×–R çuÐÃµgf!½Ç²Wz‡nÿp×¸W>bYîl²€-WÑr–g¶üñ.;BÅÓ±#‹“)÷¶ÐÛw'¯O^Þ³£÷ûƒ“WF"iµÑkë @XpñvÚÉÁËp8"t~‚PN·¬š¹•¿Ð«¸‹É%,Ý¡·ðÈ d,Û!W§ÚÈ)=m¸Bç4*¸‹•–…×>44ø!í>Ê%:?Ð®a[ÚŽ-L„à!

!^q&Sx3#á2	æð<»¼%I¼é
ïÕ5PXZ/Åp7Ž19™ÍVèÞZSW_˜TMÍƒN…*“û­îŠ:Û«Kw—t&·þÞDOÍ2W…lÆ<Zö66#Å÷æçx¦Nf…1²Ë²c «èÅU÷Îq€$Á¿Ÿ¶¬…Ó³ _í-Ð÷{øOÛZ£Ú1ƒµ»ìÂNÛ>¦È_ú:¢.0¾{rc/™»ï³ö°M&^`n>ú}›{9R¸Ì»7XŒƒIH	i…b»µXž+Ñ)C´‘¼›maZJÊçGa° 4Hbg½©ÂM²
8IE±-Ò@ü*ÀGXý0ÆXi§U\ºêE±‚î2Œt›ná¸*cåxY8EÆÝÂ·“¹,uZš¿RU¿|Wq?—Üp¤È»èËƒ,
E^Æ§®ãõoÆýÑªéÉæ™t=¥òÑºEÓ€HK5È„ß¶©n*• ä/Æ\…™6úl§EØo¼ù±Ö_^£Ÿ„Ócñç§b¥íj#ˆb[yì3à˜8ÜAtc(º•ÈŒ2Ã+”ëìÄ¢à{÷›ã2x¹?÷7\{}Àe
ôï
7Žgí–„w¿ÜJ	Lp1yãÊX˜Ñ`.ü›ßõõ«±¾¿qÞ×‡Ú½ßýõöG2ê<äw®¾“ä­?&—ü®—4—°ã>½¤º…fVÀ(Uçh!épP…èVT:\,Œ;£é~úÚ:G|W½S|uC×¯ô¶ôêšÂ]áÇ†Eÿýÿü,RŠC‹ítIíz¤Šcvðçë# èc¢Aÿ1Ð€èy”:qDà"Yç·B„5=¿oOÞüõhxvzôæìç·ÇÇGï‡ìÐŠ·3·MÓ¹UÂ±Ó¬ñµ„ÔOá%ÚbPnEht2GÈfË*üV:á¡C‡þÌ%þø-N…MÈêz Å¼Ùh0Ç„Hxtg‰,Z)&œf×ocˆˆjÂ8Éîbì´G‡Ÿ¶ñ&,²=££»«˜ÁÐØêP ÅŠ(Y¡ôÕÎGò“Œòk{kV3â
ëµéÙ\£ÊÕR“ÅÛxÌÌ@¯žÞRìi&þ"ŒîìæhÚ-›f.–,Pö3;vì|†Ýé<»,8VE°1çí¦ÿØ‹§þX½ÞîV»½[ «#¤é™“)Bb±O—åné,·pœårœUN øú˜ƒpüx`Á…‡â~åµÌº–LÏv#>DT¥û2_µGF2šiðUæÆðŽÊü`yÔE’Š0ò\æ,gp•³i¥Žvie7·5ÜÖä7¼JžƒŸªºSê'¬‚ÇHÎlÝs×9ï}’‰ä·¿–Ã\dòga5Ù^Ù®€ïQ¼èÎ¢Ç©Å»ÌæV ÞZ¬",ïß²¦÷YQ7iÛ·ž¸ƒÇ¼sÄ=<5œœY@C±,­ =·ÜkÁ*Z07Ë-–|Ô7 Nk¯¡7h×Q,Vz08„^âÍÂÉ»Ü=z/é)»ž¤ÝcX.l+œß±Œ·ò/­ ^Zzz‹ÿªëO79¾â_ro‡Óð*-!~È¥¶ï‰QpåÝx‰Ž@ÑJ¦( L `nóµ÷¢þ6d8÷# @úõhéëpÀ‚ñ/wÊÕP:›ô—âxÿ„7lï±Á£ÛºŒA#ˆÏ¤Gw*D”ù”%MPy§¤5þm–=àþ¤¡wÏ”¢æçw œŒ}KÄ÷‘ú›ãR¸J82Á·»ÇÀ:‚ñMÇyb&!Ö‘~ÞÝ{c]†‹‹ šƒ$ÞXú±·ðÕ±ÉP÷?6^é×¼©—3õwîÓÈÙSL»_¦ŸòQwËGg©W¯¹\ç¹«.2ž‹ˆFýÅ”Ã ]”_A	:]] éêš²1˜„wÙUíQ<|5!¿öŒ%˜&ûŒñƒŒîV9ß$»³4HÏG]paò·pf§‹i·äÖÞ»FìPLM#7Ìûr‰g™e2êÀ@æ_Òñ˜ü-éMåô’³ÝP†ƒÊ®g×™ïrÚ²ùþ3·°ëÞKôŒ,‹“½%ú·@ðíÜdÃä£é”Fµ7§©²)T¯@¼‰'EtR!@oÛ)™_m§ˆ‘àUrÝq#+¿ëfv‘f\¨â,šî†ì‹q12¹­›‡J~ bNöë–a[mÕf´§H"Ž}ŸìG¾w9ÆPßåÑ€½±ë³õ)#lÆ°)0¹J­}½rÏâtÑŸTÃ0†«ó$]¦Àß·xTºÿîAç‚ÑîéU/;™Çf;}ø»o“Ë0&¯‚(˜Û$ƒyB AhÒ¿òÚEaL=yè’¸MhÓÞ¿=
ÿZ®ñ˜÷jAÑ…žYàæÎî"ÛieqS ö%Ç˜ Ü‚¨`Ä†Û¶#*v«|’}FØ¤ñLùå…óŠ³ÆºDKö©£™ŒlHøü»RpÙœ‡2kDnRw=³=Œ]e‰Uª¦Ñ’†ÜCŽiê°ÿãÿ.2Š1ÛÙÔô¦„ÛˆXŽ¼Ijg1 ’L‚¶äKB/N.½]ÔŸ`–ÃÅDÅoa8ìqQJ33s² ½a-S\–ÐükÉÑ×’=}üµPÖòû_Ê×’§?û–ŠûÊr,é–zôE1¤r^?ÒÁÏuÙ D5Xƒenº”s«=;CÜÍvÇ¡r·ƒ6Æ+Â@÷ž‰ˆeÏþDŸaÂò­i\Ç58y5[¶NÆéå94‚îÇd;nsdó9O©g ‹3…¯i‚G%v'ÞuGÖHßdâ-öÈß8þðÅ?ô|-hÃº™qÂfÑ
õDDrÛç†H7¡¨BôŽ½PKÐñ×ÿ»ÉûŸ7›¿„Á¢¾ñÅ†á€‰5ž4R ŠðO‰	Ý8ŠµÊZ ñÆŸ*>#ØÀg:é¹}ÄÐÏ†BŽ6l½N`ŽÙ®|ªì©[Ý¹Çh }J>¿ôf!ùÉ%uBÎÂy°EbØà aL “hÈÙÃõþîVF;À±ÄwøZˆí{lÑÊeè,Øôö$À üàÅ:©áf¶¶úÃçüŒ¯‚ˆHÍpé/êŸ§I²Œ÷¶·¯¼æÜßî¹ýŽÓî·v[Ï‘&=5Þ{æà‚åÙ"?[\šð‰ŸrÔ?~2¿TbGâd¼ü±gî°ÓxÄÙ!Jh9(GåH"p€;5WISX-¼GyŒÇ¢ 9¢{Ê`À?çÒÒH¯NÞŸœ’¿žÈO/gÃÁ»w™6vV"¤C~W©Í¢3ÖmŒÏRq­ØÍ\y±Òcí‚¬iºí’¯V*ó¯ O+Œ§¥€ÕxbÁé‚!86}N~¹?¡„pOÃ±—E›¼Mn–~xAÆáhES!~‹' ‹`áéÁD,û%àƒèLÐc´=Ùm=ÏO	]zQì™ÿÐQúó`EPÿ¦>J]”ÎjRGªS þ4O€È(#eÞV›Ý¬o®¥'èÌM r´~$ÛÛxÏ5W‡‚É|ü1=øÂ±žzÉ´I1©®ÌâµáH]*4ïnš¦ƒùw®R8ˆÿ”ëýGY42Æ«ÌÉËÁ5½´Ï.4þÚø¸Ÿ
ÉW—9UÅƒÖ™Œt>ÆÓ)“kŠñpÊT08e*e…DºïQßêäƒñå}Gò”MuÚY ÙÊ6sˆ¶G<)`ƒP˜Ãè†É1ð]EÐf1»¶ôC;·ÚÂ}v«äPP…þÚ=ªg…H@Ž—(‡àu"oŽ’Tî‚ øx	ÐðgÙêÚÃÖ‹Þuƒ:ñcÝë¨§‰ºÿ+çâÈ-¤[·i û†d…ÎnÏUˆv›Gr«TƒÍ|Páàv6õçæˆF…íŽr‡kç?w”+ËhÄÀxø²3—˜¥R£({aÌVš?ëªÑÆtamWÊ,¥]ÌiÌ#ŒÐ?Ç8ý"ò¾-ÚB§Þ½6i™”iôø4zÄ–6Q*R¤®¯ëÄÏçl5ŒÓb¯ùŸ©|¬Á*ì®k&Gg·(°p0¾5°_«³³ù(Kw:Ílje>ÎYdµ—4nÅ[·Âx\eb¯Ÿ0Á:SB/wúËBÍ[Â>¹‡Gù 0Á|WÙE_µ¶( ±‘ÙŠcÛq‚HÊôòÔÛð­“ÅreMek±Æ¸¥ƒ}2ó@=(—’ó™Þ)ôM>Ÿ…£ËÚ³lØ©<íªÚ‘· ˆöÃnÝ\§&¨ìÚ“ÚÌ‰Ùý‰òdJO\ËKBù+¤ýR-Í|„î‡BæfžJ4fFkÃ^^b’ÍíŽÅ@†§˜¡’·4“ƒ¿PCŒßL¼hâ'<SäÓ¨SõíÿåãOÛ“-²a²dÕ/y,Çh%’LG"õÙÓÒ¬Ñ*ÞÓâ?e%*E€âmèbŽ‚R£¥(²"¾•ã¢WŠpWÊÛ‹E7ÝÜ½™ÛK™­à¡‹2ÅìŠÑÓšånšõ¶v‘ÃúÆ~¦Í•ÞÂø*Ç¾§ ±hsƒu.>z]s’PWäp¹"ûxƒÆmZ6½fáIÏý’œÞ,¼y0"\)>àz*5Ó#Ù%õxhÆyrvAdsMÖÑ±Fq¢Èö¡œºV—§iw=Ô/äA×Ò¬À©’dä¤îUç±åLÁÛ*wx@€³‚ýEµçÁU‘—KÑ­¾.;E~-”5E)pè0
£ƒÿ'XéöW]:¥ks›¶\"rHOVjÏþD¥›Ð´X×PÄ•®+õZf75ÐanriïÑåWF›Š!0…Ã°8‚Z¿‹Î»‹Æ`<lçý·¥dM}ÀBßƒ)Ú¡‘»ÓJ…w+ÞVg1‰¿•ä÷ýKµ#?AI>›…b¸7ó£¤^êRqÝ}iHÈ®7•›¢[‡Â<] ~[ßØÅr~ pœê'°ƒ÷Þ¼ goOO¶¾ùf˜ÁÎ1¬å/+tZÉf‚ÉJ¼zÐ,ÒçÞä¶s X—«dï›o~xÏ_½cmÀ·T‡Üûá›ÿþ_ÿùžø¿ñbïÜ›îý@Ôóþçôdž¦XiÔîX…wÁ, ÕˆP³	­a²œðÆuÍÊÓ£ÜB^Äêæ/äZ*çé#zØ‰8kþ(FFµ§ñB©H‰“ÊSË”]ûÍ7§áäÈs&À¢“:/Æð}Ë*|ÃæKtrŒÉ2]œl}ù|ÐÄœˆ0Nr	O§ß~þÑž…¡;¼sOÃQ¶„{ÈÏ»ò>D¨ÓV?5§ßáÅÇlÏ´——ïép
àÙ§Z:0¡W½&L•T=%¢ÊÚ«^ÖÃN¨wƒÝjwƒy˜LãTUµgFMät—¨èLJØÍ ŠÂ+Cìò"[m‰µvÈ÷ö›ÇùÄÈfÜmÖS+Oþ¸YÄÆÈÍóp|CŸÑJO`JÐÖì:¶!†K˜÷t8BÄ=òÞ÷FIóøàÉ-r:Øa3£~2f÷%Æ?’ ~z€0Ï÷@\
g>€ýîì¨º\e+-ÃŒrûG°AF‰r ŒRÎ˜aÖ”¸¦£¿Û"EÙ-©:§X;à* ù=™üä¾Uã…äž¶ˆÂ7ïPåÒR#˜h$*Ò¶h)PnÊ°tJ(x(»†Já.p½ä(¶ä Öt'0‹¼ÓÝÂœ»°½öHOqê.È›Ò¥?ûUÁ®¸*ø±ÕìÐ Rý×¥ÿîö¤P†EÇÛ°ý¥ ì¥T@çL{›Á Ï|5¹†¸Z<¯²Ç_¼Þ\•…/Vy¨k ›ÂVö4M:™UžgPÕkàv$’è`ÌÆ‘OAÝÊÅù£±¬ä"ŽR@æÙw‰Q˜Â›=˜;2’“ˆ¯ðZ®	šÁÍð•!œžQ÷Õ3jg¸ÑU!ŸÂ^D³#rí…|b®½´t+k–yµ“ñÜûì¤<×2‘OÎx¾-§!æšôccbšA’6œ«	2VÒžkñ
t°\ç½Â í4R{z ïðù‚SöœÛœÓÊÑÓ›ÀFOnjÌÎêÝVFÒ“ìtÄŠßU0Ÿh±¢ìr.»Í¦íæ$'39¹ëFsÎ·ÇÛÎÏ¿hÀwgÃý·=?™³è—ÅÉßþÒqÇýÞÕè‹–…ÓcÖÑµç•2aª"KäƒùÑ»TE õ‹°!É­×ÕÍ›Ê¿ÌŽ«lÀÂ,M‰G+¦çËaÆ4ŸtÊî	c#øÉˆÁ5‹kmYÉ._z3ÀÏ5¥†6âÌ>%Û?27ìÑM{ìÅ4w#Àå+c­”i:=x³ÿM]±ê²~‘ÿ¬-©¢R#'wí:"Ÿá‘RÚ3¦Þ›ìõÞ @Ë©}›Üœ“šÐ=ÖSR°‡¢¶!ìÃZ˜ÕGaÌPàÆÀÆð³&n[¢oê"¾[’´ÑƒÄBL¾­“€¦uÂó}˜ÌšÙÚJò´•e¯U<Ï©7ó9ÙÖÎÆfÞkúîŠ»C7›ÒDFŒM£ïå„Š	ÄŸQJ‡N˜ùxQ¥™Gi¦fe´ô•›+IQò9QryPº,~­MÖQ5¥)9Ç‰DÆ1Œ¯qï¢`³¹ ÚÄ®Ôù¤Át"·¥\uØîjÎkèi˜GQ¯As<¦í¦2C~‘õ'Š–4¯‚¥ª3à$*ð`˜êíéXág&åt: #"ñH_ƒÊÓÛ)’R¯*»*‘½ý\ xhJßw·i½»Ïi|©'ñI üøWûáõÓZ$·ÿwådâVQ¹™~„RêQœÝ
IÁ— Îg~ìëùl3i…WWÍ«v3Œ&ÛxyjF–W›žŒý‹Xsstx@öÃñyÁ}BõÛrHÓ‹Ò·ÁøiÍ°
>«‘k¦üÇ¹á¯Ý§5À|"¾i\Cb>;@7V ãÓÚœ#w·½Ÿ³n©•XûrµÖ±³ã´jO¶ÕÁçî	âäÏ¢`N£Qå©³²U&¿æÔ™h±öÔwîºSgF5r ­g­ÕiÍCÿÂ[Í
Àpoh¹ýÎÁÎúÐîíœuÀ`ŸÜpkÇ_crÝÝ^owýÉuvú]&¥k<8;ÅXJãuV×KæXå«ìmÆSJ&ßÍ×ê·ûÇëƒ¬Õ9ì´ÖÙtw8˜úu¨&P‹~Xïïßƒîîì´zëÎú”f9Ù÷—‹D5Ð…æGÁ'Îãs‚Öþn_ßÐ_c«ÎË}ôyµ;‡íÝ{ å(]ÙC¼y5¤ò7´ë‹ÊŸRâGËÓ0Í§µ†Cg)¾\ãd
ckã–HˆÿÒ¦rác¿¼Û1ÊD52†fz8¥ñ¡ÿ% } âM8Î6-~øÃ·LÀ†Ú ¾ä&ÎÆ­¨T¼Qt†F£Â;9=ž¼a¢Î`xDŸ*ŠÁ„ÃæimÍêá°YÓ%¦S/X0‘i8õg3žÆ™†)w»ríV7S°uáGåœ~{Ÿñ¾%Ùj¡…—>"M»ã`‹ìÁO¬AÝHè,ý>^{&xm{©ßª<R—´§3„6ËòÞùÁ2!ï"v1v8sôEh‡¨ÓKÔ—ÆÓaÃqÅpþÐÚm:¹ìÊB¾ã‚Î¾ÿ«o]«Þí°›u¸ÛË:ìr ô³ÝVÏÙ‘–GH­Êò`ØÃ „'¬<¸LŸ­¿C¥/&/è‹«)&U@¾õÁuWX¡ÒâD”-ˆPl±Iíf“’¡Ø«ªÔ³fmÁ™ƒª›SûùŽÑeÂMÃ	Ä=‹JÂØ#U •TÊh"Û¤‹&Ø|
4<ŽYz®V³CMÝ.ÏvãhÙÖò¸Âñã ½øÉ‡‡tÀ¨¿Ä„Odt9÷¢KC˜å„UB¥U,5cÒÄ‚’¹ÃafcúŸ>…¯
Ë ¹Ýq½@²Ï‹Ñ¹Éœ¦L7í1ýÔ¨Álü
Ûv‡ýø‰o	êJŸÃá98L¥ûQpQ#3?º5D(,&È“ò1•$Ÿ2Íè…Ã*}§pôûƒ£Þñ¡<úÞ£×GúâhxôŠ¼¼?ûÐl6K«üP~†ÁÎ¶Ñ¯ñí/‡a’Ï<–b:r=­¥7›ê èl‘Ýöfnˆ!G<“"ðÈ
'§®8íþþá1g#º²óf›|*ð(èç+ämCëýöC“r)ºU‡‰¼üwg§ò8û¿ë8{†q>Ùž¨¨ ˜y¢ÍIò#‘[NhÙÄ~Gr+/Ò,\Ÿ>] ~ŽÈ†’ìžWu–^2% pœ:N‹ìôÉkÇi“¾]øÝ­ÑÃ‰LÈm«2p3•Š_ƒ*4ò–OkT’’ŸbPªô±>£èW@ˆ;ÇíÃ–Bˆ)zJ¤x·ÕzÙ?zÿr0<yým	a.ÀÁWþÍÒ§Ð‘ïéh!È;.`‚ÓÑ	26Ú¾n“7«9Ìcäá}¤›<™¿Õ%Ä,7H}þ¥Ýã_ºSvS–Ä[ÔpÒ*NZÇ1WrÓJnZÉM+Á7¥Î'v ÷ñòz‹\Þ|²'ŸcJBš^0åöþÀÏË›»Taêd’õŽ®ŸÝMC¼M=z!}ŽŠ0ðUÁÎãLOr)ÂJz[Ñ0ŽŽ;µ(ñ ë‹QN#Ê7îTlý¸»{ÔÚÏZG—ÄÒÆÝŠg¦ ÚøÛW:.o¨0£¾'‹1`kFäõÑ!yM½iÍ¤˜Ñ7e¼”Öõ8Ïì¸”Öµm
“P‘RXlå+Ÿ„ö•ø-éºYO¦†bzºg~ñ™Š^gÈÃ`ìç”O±šW5Ûn¦°Kö¡jvìú³Ñ¼¡Ûþôfc]a`^¶®û9”k‹V2U?vpØfÔk÷¸Q> _4Gïl \üÈ+úìÉ¡O½(òÄŽ*¹³ãÝTh©„&Á5Èª…«¼O3†rc/]Ümzþã/â¼YP³Å8]×hŒé—.­Ù4¢›óhº>\l×ÄéŠEAC]”nOjVX
b*Uæ@·I>@K{uôúÃà=©Ÿ¾}sô7€ÄÁ`ø’ÞœœÎNÞ¾Ù4	uC`j/w 4
±[†äýjxS²±llrŸÆ|2ù3{Ãšw\Ï¼–‹aÒð†c,'|K¥Â=,Ü2Î²óv¶Höu‡hQÚÒÉÕÑ¥VIp­lSÑšTIŸ>¡’ä»
YìºYÜ¡É†wÝ¼[GÎ¯¨hà1†ß¢q©„(õ6
&ÅÉå5¤]^×
åj‹†¹Ü÷óŠ1cÞ1Ã/ryÆ¸Oéni2ÂŽ´{Û:e¦²ìLG±@óc£‰3?Â¦jŸ]´/^›qŽtx=Ih·4A@S„(®	Xž»$’Äyßü|æÏ	wi©¤÷´¹Úã0µg7£züÐ©xh¦!¤êG›Z×y˜«H÷ ÁaòÖ!yF¸bÅ0*¦Ôïé@{Œ!H‚åÁñáqWSwÓ”Ój½2+ë²“žPÈ°ñQûºƒ¨®õ§ÜÀ%õ¡?
c/ºá{tz4 4•¥•% 1ëôKYx§W# ÀhdZ¶öìŸÝnjt©À¸¬³ûoÂ*MúOŸ²‡ÝÎ@–`%ö=Iow
‰½+ûÞÑÑÎþN%bo§änÖ·Û/¦ä‡ÎñàH—ÿ)%Ï÷'Óã§Ç;šJ–wPL;©Šº=^Ëd¡ÈkØ—^t9ó1Z,u]­7ŠÉþ*ÂëÄxxH×—`ü‹IŽ¬¯IyR’ÔB­ø÷–©ì×s%9÷¼}`yK‚Äþœ}#5löúÄéwÉëüíÃß6qv[ì÷®K^ãû]xßëñßü=þ†òÏÌì”Â-„Óë²V`%vÿÂ]øÚÉžvÙSüŠ¦Ø^[~êˆ²í´…lpW–tpí¢Á9]â:88‡á:.~Ý…/íìöLËõ¨8{æˆrm^·bòÊž™ôÃv“‹Qï¹:u¡¼?$ÃŸNÞ‘Ó·åÐ°“,û7EÃé¢Ú…|ÓÿÀOm!wzÈsÿh%S.N97Sì(Ïwí>ëéŽÔ6¥Ýg]i©`;oFe+R±
0T/Óov¿·ËeVÊ<\e½-,´Aác¡<ëä˜ùõXÍ–:{íÊº”kb¯’;¥¢LÍHµ"7$}“™ÇêM~ŒÌ.?¹©tSée|4s«Îõgs•”:ésÛ‘É,ÈUOG—ìR)Ãk¿Óm·tå³•÷¯ªÌ"ñFÉá~òÐ’ÉN©íÄÈ²Ü# Xm‚þû£†ÿN]P»ð¢ÿã/\â:1FÒëËj>Ÿ2"!uÚ¢›·ÙÕÊÜÈ…”ÒáRJÏ®åE”‡WQ,ti`ËîîdÊYëØ=>’‡ÐyëE¿öì¿ÿ×ÿ–þGúýÝ]Óñ˜Bì2TfFfd x³”µœ‡šÅÙêšÙ‹5¸dÆpu3†ØþÕ˜¥ã=þ.jéýw¥æ2!7Aº"™ˆ»A¦KAü2Ð»p¹ZâE ôl.w‹«0<Eap
{F€¢€Œ(½2t>a—òh7-U æ$ÆÅçóÏ_K+ÐoŒ¾a
ÈoŒ‘^pgâ¥Äée¯6”ÙScátûìÊ¡r[‚t5­TËZë•0Ó5ªN‡&þ•8¤h¦Ú-r iâ` Dˆay¤Xé“]HT$ës”[q’0‘»[|EÛŸÒõ0ðio-±ŒÑ bLÛUo~òæÔ¬üaÇŽQä$’ÒÔ(’ÑéÛ—oß³o^¼ø ‘Òi;ÛÇÒ½MñÌHyw­€’–ÑŠîçŽ’XGz.Í`èaúRð¯ïñûÊK ËÄË\ß¤ÈïÜI±ÍÑ“©›¨ßÒòèw¹ñÁ-S%*€!Z÷ºá£ë½BÔ%ÀK
©çˆÏ'éd1«Scw´¦ìÉÎéù"ÍÞ€ÑÊÍy&èH–^„î¬˜h"Ë?e¤—Æk¥Öû¤êïÍ”‹œÀ?Þl†	]—‰ˆÅbŒ¦Ã ž %Ò«¤é9¦”TJ~Ì/™VgHü†}1cRÓ§˜"'©äØ_‚%Ÿ%¢À4>¸–Ä”òICÔl)F¬í¾@c*H˜3Ç¨j„\Î?”ß¾†Ms:ÙÞÕâBëû”ED€Y“™ýžab¤Ô‚äÚû}BÆ¨·ùË§³0±9c¶ú²Ä©È¨’Âö²œiQæ[´ÏµøÔ#„zÇDœUñ\(ƒKdJ3ÿ<˜’‘ê(2¨ÕØ›L	ãÈ¡ý ~ÝxY%së*™Jhr¥íÓ–·‹!(£N\6¥‡®ÀVWÙg÷#¦ôË…€ÌÅV·» -bjº˜Š‘Þx‹$–CÀXMÎtŠ ùÑýÄ¢2¤¼R‰“ù  eÁ1ù7.1"ª Ð¾ûD¤K+pžneæþõ2Œ@fã÷X.Væ9X.ë,,#c÷q×¬¼‰¿…¡_óè	èî–~"Þ<Sb1Šh3Lu:L ¿9ñiÖÕzÍ[.Í×6‰Ñ
ÍXÆ4;ï³ÈÆ3õã™/Ê±'l°â¨ÖëØæžÔV:}´$ÿ¨16q‹¤å1ä'y\‰>ˆ€’4@ \È¿ó0½° 1þ#Ä°:d°ÆDÇ¢h…0˜QâÈÒè âË‹ñò£T4ö¾øc4%Ñ¤Ê¶õÂ½ðs¥jlExÆ³(clO©œÈu¯g5,«½‰a^òó¥?
fµ,(Ž¸IO|›Â¶…aJwyÍ{¹#þv¡3k_U;éTèd†ÉqLœû1ˆöåôõNÊ*ô²
&Ôûè‰ì®[J®WyjézyEÌk½%rþ*Ûù–ðtÕ{Ð`t‰°Eþ‰"ób5‡¶ÈÝÇOÏDš`ÞÆµ:MùeÌ7W%¥)šgµØïòŠhÎ]%zuåiq##ÕÃ¹Åâ—	ñ§Ëö×¡?K¼o4¥[#-ð¬¾‘¶·±©ŒÕû[>>CúîQ2Ë:æŸ+]³÷Òkër%a0±þLÕØ?OrC:Ô*ãÑ^ZG£•ƒ±è}éð™ù&èhO5Ø¨o@£¤ÑZV‡Ãb˜#yÌéÄøJ˜±ˆutÆÒ0DóÔqFþØ*>~‡‰‘ÙøÞ+”q)¯¬ãQJÁ8Ô>´eCÂÀ–
¿©Ë#ˆ†}]D	\ñ]GQ/ñ†á*©²F-žú~& ¤Gþ9aµguñXn5ÀwÓ0	|>¤?5ØŒ@*}"X5ûûÌ(ÊÄÞ…/1Æ?ß¾±V¯]QMég 	ÁÏKÚ-È·w›BªÉ„,)c´¤FrsÇ¸óÏ<Ÿ2o}mj®º2F„ŒP
hü¶·™Ê)ø‹½L¢›”wqï«Ò0cü[N†Èu—F:§¬–ÕJ;Ã17ij…ô•àœ#/M	¦¶»½“/IÛÛd°JÂF|³Øã ¦÷¾ÅH½QÆ±"ðïµÑ[e,l¥2Þ/Ã>f°7‚Z©- !Ã•èŒ­Übàbè\Ü¨CK[7€Nˆr…³³ ì»¡ñKá®¦]®°ÄæÌ_L’)–Zú6?Š¢¡þ¡ø¥à=D'Ð6EQI`¡íS9€ý|¬!2ëÌ˜™=9«”)ƒõ7æ!*ÆÓt¤ÊS£Ä"}oüt¹¼‚hq2”?÷Ü ¿Œ—µ¬‚‚iØÿÏ©#$i\T5˜<ž˜æÔŸ‡¹-ô­º‡ø >~’µ“¨î¯Ã+Ó_Aì4¿‹ò•IX…ÍæBd©m6“¶p ìBdàˆÂù°€Ñú
?"q ´0¦§o*Pú¾jØ/Þ&S,u‰‚ïµ&ó>©'8á Ô—6qŠ»°žh4`3­FG€£u,,Æþµ–€ˆ|µþ¹òOÆ˜âäœ¨ñÝmÒÆ8iüû35+x—q€OhKw´Èè_oÆ~¼óç^Œ95äÌ'¬‹_üE@c‚>iþc[RúFiVsî'˜»%«zJTªË'sèÇ#¨+µÔ£ÙjìÇõÚ«Ápÿí›ÚfZ•€Îüù,ïw·ÙØïÈ!®©—¤I†XíÏRå=ke9k"Ks¹Š§uùÀ?ï¥‹!Ÿç'Ê{$¸ü(Ÿÿöü—=–+ê·|ZnSi††¢ßàPÙP^	žQ×8B*AZ0Ýp,Ù9”R¹ŒGsá S$_Ÿ{ã‰ÏLI“Ý Í½¦Wlf4n½(DièÆëÕÂ‹7`Y6Î'iÊ8a¾”SÈq³ xä´ZdÖòPÝLë°_Rö ËËÃŠ¼+ä’0œôá]Æ7³íâ†¦j©ƒÎÌ²cò=ÓÎÊv5VxômðQåö5^´­yöªü¦N‚¥¼1ÏÐa§x[Îü„¢Z$†GgoßoŸÞŸ¼"gƒýo^ÞÔ²¢HÓ¥žŠ55ùYÚšw‰ð¥v$ŒÖíÚÒÜ™—Ææþ=ö°X7ã&N‡mÝÅcëöå‹mÝ¼¸È%[—â´`¥zí‹­±ÈFiü.•ÆŸXò^[¶Ý$ha õ—+\¶µtCñVÅú¾Q§t8ú6eO‹6éŸWó™7}ì=º?øÛàý6g‘…{ólpº?xI-šÚ^Ûðæå‡³Á›–øÊ‹ÏÃj™ŽÒÒÌ>=¡Ë7öï±Ùº71ÃËûla†
…;X]³ç)´qÓQˆÕ*ïq©‘jÛ•oìóÙ*;ƒ¤?¤²ô÷½÷v§I2“©§	ÞØ¶4[ÅL[ÖîMò§“Oõ‰lø4Ù¡¾ç³,ˆ÷áÍ1•ŸRe'¨ìZÌï½Òù·Cºˆö‘4_ù	Ppyæ3ˆ¢ç ‰*%iZNBáHt6ÉŸ.Sx>_†0Ô±G_Ò‡gøì®ùù~œ²‚˜+-’¤‘Œ¼ bcæ÷ ]Ç~%¤¦É=™¬ÒÛ˜i†ö\®ú\^ö{lO†A<„­sèÝ nŽ=‚è±EÆ.û¦l®É´*¯f³¿ù^Ä7àØÕ~ÿ½2#^ë4\$S¥Šxb.O‘U.Îp«aFhØ®’””Å¬Ü*™ú°­˜x™ê¥”"ð]aŽ®¿7ä*H¦Ù†qð‰òÇ¯a³â1+îYN¶ÐyD†Í“Ïš¸Ç˜2%Æùý÷ÔÕ¤É—íyFÒ7IßØÌÑ­©Ç ¡pEQôƒ@TqªØ½SúLê>… ôŸ+Æ¦JÒ±ñßjÑwXMNg¶Xþ+Sç7U±%?UnàØFmf²¸ þå¥’hÅ¥ø-êKkÀ‰’zÝÛ"ç±ÏÅ ³0=$ Zƒxù§©“€fÙ7œt™ógsfÖ§œ¯ºq0>`‹b´¼ñéêv:,ù­ÁÜ˜‘³ðºMa3ÖÛÃ :yÓdÞ¥ãÔ‹.³Ù FKfz=A>×€–¡*¼ÊãŽÑñÒÉ–½Q8_¬Òz8þxŒü:o&rš¨uVA”)3éM£Ù J˜çNùuÎCÄ2ºeäÑ)>Ë—G¬3¾»‚›TY†åè‘Ûl6±À'µüVË›€÷@Ð`ëiKâ‡{»>$ƒøo¢â½Á¾H†kÅ;!ˆO˜±\Ï1äÊu$E^5sµ ¿y\ÍM°p;² ƒö±H2¥fr¿“ù1/^qgöÇûÝ×Œ‹è&zGÇ4¨†ÂâNãtêU¾© dnDü„åiÉÔ»xÙ4%¦PŒ
C¸³ÃÁ2†*ÁÅ àÕì†g¿2BCl¡+ý£˜žÏS'­|½ŽzOF8Â^ùþ’9$’
0dµÓ¸ÂÈìñ™˜Áš@Ïº¢Ó ”LCt€œz@žATb,H¡!œ+ùW”‚\=Œ×¤Ã@¤-K°@%˜'Ë»N¾EM]9/‚…?®ašÜKX«(ïäWÍ¥¡W.=ÑÆf&Àz”Š½"…P ªÞ¨Ÿçâ ¡ôÓ£ÚÒV.u0¦óÞƒÝ+©Kz$†`„*Ô#¹¿çÂ<x“=J<”çw’h¦(+åÂ™ßôñ<·^;ö‚`bÒˆ ƒÓ\aòþÚ¾à«›T’oÄ¿f‰CºÊä¶Aþ’Ü¨˜/N<áð¦òcôlK0eºHi­2<w¦C•ÇyP‚dÜ)´vL–Vþ'<þŒÎ)o‘u’wkæÎLïhƒ‚±êšGÚÒ”ÛMÂÄ›á´‘.ÀŸ&ˆÈ+êÞhÄJ!¿`°ê¬_zÑÄûó
¯‹§lnÑv+£M•Í½gá]!Ù6à ¶úãÀ«oÔÇ,ÝVcŽ}ª–óâ››¬ ÿ¨´È]íý±ÍÏu#`çñ?/éüÏcQaC&Èß*cÊñ­Ô´äb8âR[ipL"Ü÷’ø¹{V0;<Ñ–ñË§BložŽ ³åüêÙ®ZcôåãO7#_"àœG8°×ÔÝ´Gœ-ƒìÆ–}ÆšRVWæÍ;‰|ÌÊûà~øðžµ¬/Oo ƒ§®DºP¨:ˆdTŸ7Ù€²ubýÜ¢(´¤:¸ò‚D¯ˆ´ü`‚ð-/£¨FõsØzþ2A4U×OCÉ»ËºÀ™§¬´Âª³2Í©ÉœÝi¦ÐàíÀŸó(¼‚¡ÆL&‡‹„Ä«%½l`XÞ¨Å@OkÉê’€’;a…ö@œÁ'Á%pà}o\z‹RNAØØ$ã@tGoð {þlE–Á,˜’3o~îMÉ¥O^Ós„xÓêÆ”½D°±8ò›Íš¼oÊ a¼(`§[d·ËFºßMJ ßz¼[Mû-ÓCF$å£p¦¬’iêŠx¬=,÷t
b,‹*ë÷K+ÞMeÊ•5YçØôÂgWT0’‡¶ÿÇèëùÿ\ùqÂ„hÄKdûÔ#”Jª¦íÄÇ>³'e
 î#îæbô“(œ’*šæ@}gsNCËÇ|\36U]úÉ“ÔcåBxPß,‹©½TƒÍ¨5•!ÆNýé¤iéF©çô D0B©õã0z‡A] )1¸œd"Râ§Yb7ÅôšRù8Æ›•M)]6i£$þ)H¦õísäGt
ÖMÊ K#zìÓ÷ïÐi“m¤Œ˜„Wh™mŒý9â
´ï/ÄRŒ6ºR­xé#A©ÈŸÞ9ÐŽä&Ý¨Æ1ð‚…iH’#á§‹ÛÀ4ÄÞ=(Ðßx—~Ò@HãkTâ¢àÒø€•¬€>šÞý3
bã‹½%’ÕÂSR<êž«3${©AÃ:ÍÔÕÁÔóØO@hde5Üa êUÎÜb^Ð½(aè<wiºÎ_Xk<3/X,n<Ë\ÔtvgjÜrŸ`­–¡ïµK &jg_HLÕ¼´AÉØºMÈ±(}¼û¶‚ú`Ï ‡™iµÎ¾´ßŽ ÚêUÚØ|óˆ¡¯°R¸F‘¹áì²ÈÃ1ÍÏU¤¦e˜<Í_Ò…‘ŸloÖŠ½{ñô<ô¢±Ü¤‘CØ†^Ûì+*A(59ßÉóËÌjÛ´ðFvNðÑX=WM¾êVy~öæø)˜:ŽjÄßÐ‚KiªÒn54”ÁXinjj 	†ÅÐ&û•¡Êˆ"õ³òñTÙr%+fTÁ0lE¹™¢)\Á¶S(Ï—îŸ H‚‰ðmH<¼*´L‹V0ñ`\Ì¼_-%"¹Ý½¡É­Á]&ŠƒhýÒ›^°`z3MôÎ³s XÍ' ]ŸÄÃKv÷£–~C°€¼(-FÁèëÉÆ¦•ÙÖMâYJc |&Œ®üÖ¬Ó~5lFöU€r].¿²E U 3»3IÐ{Öô?§ÜâÚžP1ÔFª’¥š!+ç_'‘÷–žfÄÏ1PÔzØÁRZëGê‡–{ˆ–0öð•#=G×›}@ÚÅÈ
?¼9CÐ†?Šs,ê9¤¿Q§¡?æûñ{+¿Aèë¥½Ùì%hfa¤<sä£‡(è‘O³wt4bÞÒ¨Úß5é+õ:Ó(3IÐ37¢*Di{«hãOŸ£wj-1QÓë›Z(ðôÂ j9–/ûÉfInÏ_/EãÆº¨ïü&‘Á_Bç[^‰“øJÉB#£ð=³…ò˜ÞïƒWjÆËYÔ·?’³OÛ›[ŸôK¡<¯™–olCù•1Ñ¢ò5Ã¶~f––‚Žä‚tÌŸ¿»eÜOÍ¥7Æ¸àIÝ…­ÞÚØ¼Û/¢—­O²ß©DØøh"¿å	(TÚ¿är	n™kv³‰Ù smH“ÍÎíxË8)ËJÏrÑk=Á I,[4n?À¬3Í ¦ë*¡Qø$oŠ¢°\(íXrFg'Åj9Î9è8¨¯›úº	/æõMz®¼±aîø£Zå“Öµ©ŠÑæVçhàeÒÜ†¶EÒ˜’•^Ù+°W³1Ý²¸[`DÊNá=grÈŽ×3«mf7daW 6t(”!4þ=†Jeìåmô
UEìÃ¨Úæº¥ÞœdLÌ5&‘jŒ1Ä¡çjÊ¨ØÉšÔ2<È[_7akåï´¢ç6w[Ð‡Š§b Ž&N¡X~žXùZËéywÖŽUàAŠfßS…_Ù¼ñjéÑpHÍ¥€1Ú.–D
ZÄx–&¶»„¾õZ&¢ÔÐï—¡CTh3C?úŒ| ìŒÀ×7U¢šwÀàü/#zVŒMñ£¡t¢â,žªRMSçþ°ÆÈã`YÕÞ^óô®}Ñ¼zÞÞý˜cÒëÜ…Êöû,ÞXz„´Ñ×1™34¤ßx,ü†Œf^ÄÛ+x¹‚Å©6˜	ÍtÎÂ9ñcÞlSëGl3ö‘´Áp7ÐÛ0ÿ|Nƒ˜má=ZÆ0	£ ƒg„SÄCK6ÛFïç_VÞl‹Lð@/Úø±¨6¶§0:µ˜Dó3ŒÎ)0–Ý«³M#D…¶Ä›}	¦ädèbtÜžÞ2 qôrµäÐC‚ŒP½“P@ƒÎZ… ÑïæãJ'NCR"M¾'”ºîñé¡üré-’Ñ“]ÐA-š@÷áW˜Œågö„MiŽqNòü˜·ÏÏxÛärD¶	“ÛTéFG‘€ÍïìÛÂm§NØ.³ÆÛ,ì\¢›è\Îezv¯ØðÉðíòõº‘>ÝÒ¸Ì{”H¿c9±äf`$¥@•DÑº<îÍ<©‘›ÍOšÇð–KJfåÂTÆ\Ò»Zz-vmiÙL—±6vÁjcCwQ#~¬U™,V!"6èÐ.%_qtÃÒõh¡¸sª </÷0µ÷9è[È–ÃK*Š´E)òbÛiËËQlhõ4XhŒ§wó5¨ïÕ)n©’´9lƒJ}¶rÕpÙj} ›ëŒï-œ’¶ÝèÜ†™ÌAÙC•yî%ôÇ‡h}²ÝIûK¥!­òÝ¦Î-+lØ<®fQ+@2Ö„úŒþ®³–¶8Ro¡5X µÃPÿ
D­O›:¯"r›1ÆžQl@¬ç­l«Pd-ëÊñ¨\uV ×’…¢§Þa”¬|4EóÐsafF[)˜™~ÿAŸ…,é
P/ÍXëü·ñ’„üá¯mCºËƒWû]è³áÇªŒ«³é{êjEúÊhÎ¶/¼‰7ÃØüçÞÈ£|2%öÔË6Š”~$?[£†ÌÈGÿ!5ÆÜÑËÙD~V¼ºÌ¯ÚVU¹Ÿ=û
‚Yø»¯¬ TénIßiJ€¦ˆ>®Ïüt´wÐùíÝ÷nÔ–òTA×ï&à0$Ë‹7*Æ |CÔ•QÛÄZ¦špC‹2óYêm‘o¨'4ÆqY]z”/òFñ†Òê.Q™LPž…ÓG”ù|ž50Ñ»	Ÿ‰[á©¡•_AeÏyô	›$E‹Rù<W á’
Ì7žØeqàMyƒSúƒËÁù+aóC„º8\¨"äŽ)«Èr\,¨eï'è+ŸMi `6v)@Ÿ-ùœXç<_³={€%#00æÿ  ÿÿ þ8Îgxœì=kwÛ6²ßû+mïšÚJò#»Uíø8IÓ¸Moìœ{÷x}RJ„-ÆÉ’”×«ÿ~gð  ([n“½Ñ9‰%p 3ƒ™8 D|æß˜ßæ?|#¾E´ ã~áÉóY^$Sšœ’rrúƒ€'q^3ZŒ'" ?¿ŽÇÄë’§ä¦ì <#^>IfQð+x±¬Òé’¿þ•ÍRäçT¶tD³ËpLaþ<‰c:.hàu»Jƒ„Ùµö[b4öÇ &/hTøÏñ×àœÛ²é§ÞZÙùZ÷K‘ŸG8ŠB?™ÿ6-Bx°;8K²1}9‹¢wô,£ù„ì’~‘¡Ñ×kÑÀÂžð±h}Hüøz¼™Û g9Í^†QA³JkˆU¡×äßÿ&^”œŸÓ`?~Ovï’*íì5?˜†ñ >‹zÆ@©!Ñ¡ßÀ§OG¡«â>ˆ9R:HÉKê@Âü0KÎÂˆ¾#®—òÂÏŠüÂbâ­­§4>÷‹YæÇý”®uq<&”òÈá%=öG|€9-Š0>‚#_©#3ðÁ1iØtv"¶!ª2JýÐPGÎþ~`Öƒ)üøüÜqÆÃ¦F£pÐÞfPN#€ZƒQ{ë‰ß#…?šÅìw_R nö€óÃ8¾†§“YàP@/iÔ#iÆEœ%E5¡í4Š~-Aq
¥#3'4Ê)#±1s0P€î6Óz1öÐ%GÇÝ±.!‹'YBA×E6£_…õ^ŸA½xÜ‚©à/fØwcžûÅÐ®õŽR:ÏÂñÑl
°{–€Nöc¯¦c@8tˆñ¤dV£Üä€º*/8Ð|¹D w‹	yJ6°ð‰ðy¡/Tq¢ÝavÃqÈtjL¯˜ÔëŠdÿèíQ‘÷¬+æ	˜Q’ƒÁ€+:pØW>¨D—ri ¨ä¶F¶j.ë}ê§)³-$à J<oŒœÐOÌèñÌªÐt0$ãšÎÇüûëó÷GÇýooÄ°YKä;²Ù¤~p„ÊÓ{Ô#kkÝù¯=KÛU«¶^îÖ:®pØ*
¶¶v(Û^«î ,Èµ@sùA(!J.È=&`ÈEÍÙ¢å!9˜MG4ó eQÄ¬ƒz•})ôJR¸*½æêA©"†«Â+¦Fx®W\à‡ f`¦uœ¸ fBÒ0Å(ó,Kâß©…>/Ao!(ê/NCdÞí†‘Å4BÀy_Qu!‘búà<¢hË€¨ðz'§æ²BH®JfšÑKÝi0›ƒOÐÂÀrk	XÙ3™3øõš^‚¶a…–öŒ‘Z@^ç5ñ¨¢×ÉÍžƒFAoF¯_‡èvëã”´ŸîØéU.†eý«Á`€#´P?u¢+V¡c‡Í(ØÑ1«b˜[ÊDFb1Ñ8ððNªîNÁexö4,8Ï-TY­˜»ô{€ ]‰[ó¨Ð)Ñƒ/
;ÎÛ¡È<ß’wÍçŠíµŠ•´\\hvn:®¬Œýöxó=Sœ¬©L¼ÖC{ÿGÖ\;µJiðP}Óžè»W-ËMDa°¤™ÕZqØob¢ë´jÄY¢ÎÖ‰4qf@uœßQâ4xžDhg¢!ñŽž™–e4.~hÁÓRI1öq°ß³Ìd
d0ð(É¼ÎOþ¹Ý§#ì“J©~–fÏ°Ó#Ø”Úã¢øÑcšç48ò#š	ûsÎwî³¡¹C>²}¸'76Â>¬µ{ˆù˜ãyê­Õ0¹÷PËØ—R‘_*ôÆýs:Ñ®ðzÈ€a¹>-ûÂò²“1Ì÷þ—YqU\fÂÕÈ»ðÊ¿ödüáši9Õ½ñ”Æ¬>Ü×ˆ¤<±ºÝõ¶ÀÉŠf=äæô‡e‹–±Á@€=Ñßâ“SãŸ z„ÌS'è.Ž“À¿ÆVÀañV<ä (o’Ii˜?iHrÖôac(v’Ò¼ Û=³Æ
ùl+X7ŒŸOÎ¢äŠƒˆq¿€ÂQâg/Sù¢†â4‰‹IE:ý¡X!Þ ŒD£ˆp+¼¢TÝrÐ8`Ä Â8t-JR0u¡%ùHã0ïÁj3õóÙFK€dÅ,Çø	.?QŒ3
| QpF§–Û£\$6KS•ƒr~rã˜ÛPNGþy¨e
ME³°QL\0h”H­Që‹¹T8\q]Ú!¿2|?`á‡ooÌÁÍu·ñze‹³‚QÍîÃ‰Òz³Ùø6s^ŸS[j¶0ÝÁs¡äpKšù{Òá(WSÑ-èXx¿<’¯rm[@gÖVMx•l¢ø ÞD÷îÓ÷YMF}ýo_(+ü¹äÊò'Eî¹÷XÝk~ ŒƒýöTŒA{èŠÚ³ú"P³È}XÐiCÌTž`:…ºÒ*¸¥…E|YA‹á¯±þ|¬pÆ—C2Æý$6¬Á¯Ï®+´Ï@ëÑ}ò~:›Z:û¹^ÔbÀ£ÏXí£oÃ™^Ô"Àêô­Ð°vÑ0Øã÷{û¶)|eäœÕ,e²U°Wô`—f†Õ¨ŽÜ-x½BMðÞ‹¢!œ	½¡W”ÚÄU«R)Íª E¸ŸK	útŸP®aˆÓf`Kõ˜Pw6¢fÙ²¥DGÁøÞ¨ªEÌz¨#S¡T=ú;ð¼‚E“
n‰°%è]y—Ø
)Z„jêg9­p•µîQ»Q3³É–Ö1ÌèýÍe ºy´/ÓÐ-æð«Ñuv\*Wh]î-²ø1µBÀÃR3yÃ"Ÿ Ac|pý_ëÞ¿‚ïºë–jLÅ—•š&†$§h?.”J'›§=²¹±hr ~·0üh3/r_z9`ÝWC
¾[?wŒ§„gûjüû§‚pnˆ'ˆHÏIrVVuí,1ÒÑó²å$‚Vå–•ˆôÜI:ƒ|P³"ü°W±m;ÙÊª0ì>­rÐ'&áú¤Ý4‹6+\EÁ}ˆaždÜˆ9 W X_†YŽjÄ‹Â¼°…Û»vÝâ¦Ö<`»žfèÈQ£TZ •ö G]»{fL×¬ò¬^eä¤+ÈØdàr×ìóN»ÀÉ›`²¸Nj?µŽ}ŸÒ‰iNÛ“n„Ðuž_3Ø°¤a¸ÐÈ3³‘Q­‘‘«.cÐÄÜ!„Œ—Áöä’£ƒ½J×Ú‡)Œ=÷`ÃàYÕ†}”mˆ!@#ƒ(ó>O¦ —°{½* Ü[Ô'ÍÂñy`èÅyX„—aq=$khê¯Y7^ëeM’%ö­¤io‘5¯´ýí§»K«‰]™»¯¶ Ô‚Lq`˜¹¸¬ÕlwUmó-[Ù´•šŽi©ž91b£ºd3±Q}j;/aîöÖ‘ï©XÖ§”mèšThs´dÁÞ»8éÐrd¢c¥ªc¯Ü*Ë=¡‡–™oqá™éf©Ð7°›'Ôù¢ùB}N‰PYã¾ÿ/xÏyv£b¶6³[ÐRÓlÔn9ßz3+8èa9Öp/>â3<Ð{÷~ù—ø~„Š5Z¢XØòä«¿ÌÙ£íÚáÖà½ÿ0zf¢‰Íp ¤]—a.Ha?u ÏµZw?ZøaÔo„á;$
LÃ'læšôâd€Š¯mË|—üúí$² åþIýÌëÎ«SÉ:à[é§”·ä)å…gþ„ó1,œè±¦QkºŽÓ˜­¨SWkCî¸¨@õ&N¨m7Aë§¾R½kÑ´›R„)˜Žq±Ý?
’þÅ$ÌÀÅGˆ¶û&–'GÀÈš	q7ÛÊ¤ÉŸµÇÂõ´m—ES¸lŸ…•x:æÎ½ÔüŽDµJ(U–ÚsŒ£l¹Ø7[Ê ÌšŸ÷VËŸÃdLl½€,Ë˜*kJø–ÃÇoß­!#¼"‹“ç–þ¸é{B¸œ(r{(qÆÖC%Š®ªÏ˜€Šri[<-6îÁ•is~Zp¤´£å²é6£ë6mmQoç²ØM°E®K­Â]œ—Å¶Ó½©ã±"ç–ÓRz7.ê­Ö±Í¹Žøí¦^m£=¨µVâÍÔõ{pgJÍ¾
o†¿Ì…‡u‡ÆZîvj*ð%›ÐÚ·îÜTßƒc$ø8vÄîÝÏY¦[û¥w×°ok ÛZ¸|Ñ¦õNyÚç1§ÛØÄ®VmëýüIæ1—‹u\—X`rE?xú™Ã·z˜ƒ.c—\²È6«7]ku?oë˜%É,ÝÜÆ¸=¦q’‰>
üî<‚ô³_Ì&Çtš&ò”|(°ÄYÉuBhï¢ÏlCs0ýå˜ÙÿßÃ‡6ÊþBA’|ÅË¹(>{C[˜r•fkob;Ö“Öf¶Ý6h¶´íunû:£Û”t­Å[cs¿éèÛª^{tÙC÷`CV*pFä:2ÌG£Äm8"à&c`ô¤‹ØØ=˜‰Æ`À@4Ñ¸wÓ°]‡,£ÉŸcšoðlëk]xÐqÐ÷ïöñ¸C#t……
x²y*–8qN‹SßÖÒTHÒÖÎÔiìý*Ä¥Ôr(_m¼‚s›Wka^™4§E÷ãlù“©Ö0#ÞÛæe…%öeU¼m/4½wðYÙ±AmÎÂ—;µVAlÚóR!LñùÏ!Ëâ­Ý–¯Â|#\è§ÊDYuµ.ÙFaíµ¤U{²ýþ?w‹«šx6ÍOA×á·"\+¯—ñY93-rX'"i’^ëóvU›2b5låï½y¶÷jñ^ÎÏL´to—‹›ËÙ]ì-®t÷çnïžü¹^©X:Ú»¤5;¶µ3júÍn¨	Ýb·gÑÒgow¥»7m©º,AþÐMÛ·óÉm#r{ãõ)^•^w2ïÁ
ýNî7_²³dæí1ï¤„ægÍŠd|¡jEVŠ¯ïÁjfW‰œÌ'ü5Òz)?ô`–«±^ó_G»¢ð´ÒgÈV<Ù*1üâxŸG;Ç-3êUí·kž}’Ú¡Ãì¿£¥S&ºe²Œ“ÐÑ‘=fZ£;å\ u›SïÌ±:”‡gZŒ¯½Ô%¯ÖWM4‡Ä”G/ÆÎ +òVëÑ {”LYEˆ#ÅW5µ:g+4ºÆ¦Ê/Àñ HeÈRŒ–fŠfwWà,ƒ!¾‘$sÏv:]=±a½Ýáíè#Æg„M„Õ{†]¦§`ì•iPw:D°	sYÈ¼–™--I.ëñ­*Á®;UM,!»»„çÓ¬¾øu£kÁÑŠ‘uÎœ±5ÃË‘øa^¦™eOÙ{†KŽ#ˆÓµPŽY:^ÄqDÓ'Êwõu¶z\<ž±—ô`„2ý){û¨ÚÖdY,µgŸÃXVI›ã2KêPX`¯]ÉAe’Ò.æósŒÎuê­®‹žRNU±•´tZâ3NÉ %™ë³SõqR~k¦!J~IAž§ÕF?åIz¯D2WA;†Én‰Ô"ºUÎ›j\(tS‘¤^ˆÔÓ–lÏ’	5\T‚‘Ð±%%jXêèIâ.JMO°fJ•ÂâÚ:jáà¨ÜS¬öËêM"í;ùì"‡…/Ç~˜]øqGiÖÂ\¿–ó[fûµM±þ°6Ëåc6ÑÊ¬èÚ^} KålL=Ï{læØŽ ü"ßö¢Ô@ì_òÙï¡q`cm×ä™åT£ï`0ëÞOs *Gý¹È#\j^ýi•Y¹Ô9:€Ìp,ÄI¨$Y.'Dµ
«y›«cÓòqšK ¸0‰l=y,ÎpcD¬<¬ŠíY«9ÿ[ŸÜ	SêÖûãCfŒ”å7ö.ynãËj=Ç¢v‚X¢ðCod¿QÕ«Ü(®ª¼¶SÙ±,/6$peo”dÅè'¬ÉA«›eŠÁ_-`–òO4¦H«Ç|Ñÿœœ¡ˆDÕ6î^æ¯ÁóÁ@Ê™®]‰*Ž›$WG)¾îo<?»Ã¥LhQ 6}#ÝáÏÎÀ£òÔ=<nó®FOE³RÍ€æ/Ë³­UþËÓw YtCaS$ùLmrÅ^ EËoúÅ	©O¢%Ö¯‡ù+ÔØxzÄ–u–»\óyˆ0°x¸J| ãŠ¡°¬‡^EJŠ³ü<‰‹½ÏLq<»ÄýlÀI1a’`ó(™ec´ó½Y1yGýàZøTëëä§(}áIÒgá¡"!?%ÉyDÉÑ„RX¯&ÀA—@V9t0*›º'}‰I2¦¥XØ”Œ' ¶hþMmÞÃ"ô#ìyìESÀŸ›ðEaªJa ðKhfi¢³UÁoó$O½5‘!ÔÎ\<ª/˜9ãA9ƒòJ®ÔLÜ•t±6€LÏfa bSÀj‚¯Y_R‰Hp
°ÞNÞ+›&#~Mùq æKG¢’ý¹ÂóÜ2Œ(»Ï¦æ†ê‹¢W{~â¬fÚ®xõüÕôwØè°¢JÇ´»ê¼SÏqÒPK€«4Yï¦ãitm>>qÁ/ê´H
?Â%E\ÂmIÉTº¡¢X)µ{¸¢>QíWµœyY¥]#XTó¦‰Á·è¿½1¹|Ž¯Ó›ˆc¡‹ðYÅ—Ò5O,güí ®å³†¿ì~»žÙb+˜
 ”ö.US©ÑråX ilèÙ5’\§¿¬ª®Öó
WË„=v…»£
ÿ; Te!ÉøâŠ×dVxæé<r³E¥#ŽD~œð%‚¯žjsINSÕWékŒ¤>69G}fgBç–òAwÀ,.Çâ`¥ñtåg±×+¢+bn]ã¤Ç2»;˜Ò<—ÙÁ©ì‚Ùz¼¡D@4‹€Y’èlºŠ¹K7g¹tñQäuÖIR;1›ÈX# °8ûÀDô=³t'xùIyF+f+¾F÷Æ­Ÿ<ª~ã•'»Còþ—°ä:©Ë×ºí6Þë&uu§#ÈŽ§Ï˜¡Ë|Ÿ¡-ÉÑQtÆ’7#êgÃ8¾ÏÔßxIÒ,Å}YÊòªqÊÝþ3FNI:ÅÃ@|¡³A*Æ£o(˜CU!D²¨ccÂº)‘‡ñE–ÄaŽ3»êæ‚:w%æªª“—¯\1ÄrÑO]z^ìŽc?øÔÓûÖ+Ûåþ=*’d7—~>z{àu@–a]ý ¤?°ñç€ YSZwœƒ5>"Ã–àü|ûä—âœø‡Ý®W²ŽVÉ¸‘»”"dãWÖ<Sqƒ£ˆZ¹'®Ò(ÂïHs©î°+]T®Ü"rá´ ±êuÅlZ/b.}5ë#‹ë†‡N–˜Zc®Lç5•ó§ #	ˆkuyjM‰àcôî¤r*ÙN"R± ‹k2´Oå§Â(<¨“Vmº-'JÒZêª:%‡t°ÒÔ~A§Ö¦°W«áÙµUééK)œ»
ëRT¡¡9d¦§ë#Íè4¹¤®MõÚr{òRR¯3Â³/á…û?á'Ïé,Ÿ áB½XY;@¶Îº„yŠ]üx‰'OñœÐa’²:¼¤“&)QiGåI¹¢³–¶_ƒv˜ÁÐA§ŸŠÁa–\†H7¸ø3ºssC"Ñc´?†rduæ:ƒ—Mæó§‚fÛÏ²ä
òf‰fe)¦ÀðóÜëQ‹›òë¼z\ÞåºsS~UÛ¶¾wnl¥J%¼þ¯zö2Éýb²sc-Vªigˆ±óð._Êårµ^ühŒãä8I•Òã	Ø*¯13¥x/§h¡ÀZHñøØ4	èNWêÎÓ•›¼Œo¡ƒ¨,©Û¼º¤4†5ïz§“³’Ž0Ïh°só ´Ôæ$‰ñ30ç\žlá³y…!X¤ûVûœ&,n„—J)á½ûiÚ#ÅEG{ro9-Iý1Ë·\¤ùœÐ¦	ÄœýQ@¸`–±0´6x¬ƒ>Õª™¤ÖŸ‘«P,•Ûâ;HÚ§QGa{½±±…]aŠ=±+Ïx
õ´`„ûyŽÜÎYø‰`ë§ý­0ÏŠþ’…çüû{ÿdssã´cöÁÚ©fŠX;&¥GàìinKËé˜$VÉYEËè¼†{ÿñ%* þ‡nnl´ÿˆd	nÓý­O9‹è'v¬,ï)Æ$É¹Ÿö’|âƒnìŠ:–mÄÀiÙG"ôñ:8©«þc2¨zÐ¬\ýŽ*Ó¨ö7­3ÁÀS˜uu²¹‘~:#.ú£È_T<fx.p,òüøØ±J›m–3îìÇI:c„½þ„NÇ¼Ž_ ì"·×Óe0ù¾B$‰‚
Gv<
d¿ö«ó´âë¹³÷íu šãÑhVIlgU‚ª+
ÇRo¡y;ãÙYoƒïj|·U2ð›à«è\¬EÃó\ö¿¬è>ûz–dSó¹Ø(^—y~¥3ß#`¾Gn6[çt±Jøz%âõçVZwW«ÊpiÚcÍ"<Ç••¦ÃX†’Ädç†Ûâ'›ô¹½Æ‹0Ÿ†y.kˆŸ¢¢¥NÂËC‡}ÌêÈh±ƒìT¡Í&ª1¡›5Ð$f…"ûaóËXÓy!˜|ga6bbVUmÕõ—)QVÛÌ€)×Ðj95aj‘¡zl×¬£ÇzvŒP«	=ö3 þ_ë›æ9P~˜p³8ƒÙ= Ù:ù6]þtTr=Ñ[ F“‘µmfç'ñ‚Û~;`ë±»±vÔP	À$ÅwFÞÑ ÌÀLUyìùktŠtë©Ùxão5Û³:cº«WÀä,aX†Y‚ÿ–šÛËÃ
˜Ó¤ÜqlÔ˜Õ¦0L¬ð,`‚¬c5ÄÄ'‰•°©lW)ZJÜJQ³‰Y[qm®I0”Q²j&Âñ}ãg{Q´—ãÞ´¤…VX§µÞú~À^+lè¯Þ™¥'m-Û^ç
A/kT"š§ë¤¡dD4P
ê«úª€”±~U@_®€ô‹<X ¨–m™xüæÑ0y^Ú¢•VêJ4ÿ‚½1ÌÚ¶hõä“»Ú^åÜaßÛÃšë­¨ÁS8ðÆã
Ò‹t¤ ÇÜa5€[8.‚·ø©uíÜTßÍE ŽS«,CÈVìðÿ—¬KSU\¶í4ØÓÖU›å¥hi™Ü%û”µC´<¶í@®<Ý=Ç¾,6­·*ÜîB?<Aæš×äÚŠkn28Q´w¾pÎ(K`ßŠÔü»wôÊÏ÷XîŒõf‚ÂâZÌ ¿~š%gaô8`=ìDŒ›¤aÑÎa98|û”ÎN+{ø­y3Â¸ÍÛ§G´(dfudÑ ù§™­€àV¯Ë¤_ÞÌVÝukÞ„3¢¬ÛëÚ´ÜÚj¬1äç§~eÏÿ`öÉˆFü*Üõ¡¢¼÷§ŠuÄí¹÷mC7„¬sq
º9ùØ]|¦¥ð“V|À^7âÆ_@k‰YÝNoç†´Cþ·,ÌUwöïöÚ¸°YxQÌb_5·±ôK·Î¢Üm›3Õg×vMa/1MM†Ý.iƒÝ>^ú´è£ßóeŒT«Àþ:ëÛ¯ûvøãþšwü‡MòÈ‹™zE£t±°×WÕjìµÖÕ»(Ä,²vávû¾H+ä@Õ}™jLÒÂ_¥ñÑ&Ð½Ì†8!ñr1a^2LÈté ðíÃÀHÍöAà{3§*‘úÏ5ó¿
ØWûÓÖÛ<É¿ qzÆe¼»Œ'´¬…,íŒ<Â³VÚó¡ÿ§»ZîO·sSXÇ(YzÙšA	¬H8klÝ6.31¸váTðw]Z­[r/¼v î¿ÚZ£žé]ZüM£Ær[âîxƒå•Y48¢‰%ÖÇ0gQrµo”µl¬ñ¾„‡–Òm9üq3s—ã«™Œ¦IV,7¢Žm&Þ±G¶ÕY)m%‚¶«—ùéŠûšcûýh¢Ï{àKöNÖ™YxKÞ(al‚Z&yYNRËjƒÈ ì?þÀöê•E3ž·0î€üõ–AÞ$Æ·ÃÌ7’ê9[[åº)I¸Š#U·åÄ»ÅºßUdµü×Ê-[–ùÂQ&´Ðh¯†Z²áÒçQx¥¯båœe¢èã[×!]Ö p1†šÔã·Üš1¾ªç9ËûW¿+a©s6ûý¯œU}¾rÖJ8+ãGpVéóS=n{jÑ¡[­u·á<Zf—¨ÔŠîcyà¼½Åe%½……¯ÜN²{ Í&6æ¡jã\8Ïj®’zw1¾ZÐòþ,¯[[QV'³½ËgVou ¶ÕÑÜ•LëRgÙ¿Îë3¯Õj¼Ü\*õlÓY¥_¨õ–‡®dØhL,¹¤bk€™e„_™j·œ²èõZÇÉW_ü¸=§å¨ûÍgð$µÔ·øm1iŠþÜÎ7n¼…d¶4Æ[»ÿŸmüïfýoä?3ò‚bö{ÌÙ-Þç$ü­râ½Í0#aé…ºäoësOá.sæ` Ö‡…h<sFöÃzêmâÞC6l-h·¦´\’XiEñ]bzuüiW$@·º1˜lAaòöeZo*+ó&WÚ•¦«SAIà_¿L²©_ðTñ¿~{µÙ~ò¶@yUà õƒ#LîmõÈÚÆZw¾þ- Ï¡Ù%ˆ¦ëÝ\XGTÁ~ÿIýÌëb[çXèkL“6$¦„cf;KU~9 ŽEPèâ€Ð7öW¿gŽWªr=KJ;a•»h8¬d½z¢ÎÆëñS^¨ÏˆXÜ‰côyP»2¼ŸÎ¦Ž¦q˜8K‚Ùyæá…ô´Í€"kL”P€:•h¥þ53 h1I²+/)´<4®(Ä<ÓÇïööÝÒ©ŸÏ.*¢³tÎŽËYvMÅÐSƒ³(I2Ï3ëuÉ:Ùd	ìí-¼ò³sÿÌKT2fŒÂk©«_jÆk c9«{$,*Á·txa1H‘èãbwP5-0ùÁç¿ì^éÍ®¼ÁÃ1¶#:òÏC¤…€Ý~bŸv³Ìè(aWT‹¯äfSòzûùNÆ(õÜ×,íÏmbk[‡Ëd™'ª8÷0'%>±]âW?×bDs,œF[Y†Z™IlI[ü4É|×¡ÇÒ&+«›€fÏ˜—ÔÎúieÞnt¯^9'êØÆ&ÞöXblw…ˆZ I°¤7ËªX}Y|¢¬ºÙÌ-
Ä·Uù40©˜MxÙP¡¨e?<ÃÚò[Fôn¹ñ¾Zƒúë6þbn
ÏÃ³Èÿý÷%Ù©¬få'ùTš_I #5¾zq¾ßÇF‘ù¿2¾‚ÿgÏøwÝtb×$Ùp>º“èa$=÷qdL,ÓðX2 Ê'ÎÔ€,"f1SÚó¸†1Œ¶¿Á2·nlœªNi|:ÔÒ~fÏ®ÅOSžÜ^[%Üm™r—ú),5e$èTÒéÈ´Â¦ðU¤ñGy¡ö‘Ô÷s¼¨ÿýÆÆú#øí/‚,Iû£h–õs#ó¦yFºY`˜ÿê4RÅ>VI†6”ÑeàŸ¡j$Wý3ð©ÉÔÿÔg9Fa”<©Ì@ZôO¶3:=EF¥«Ä¤˜7¹¤»ìOÂ  1I?õŸôºÿX'Jí] ƒ¯ú›[dÒß<®¨)xe¯ÕO}¼n“Ì>A”x—–d¥:c\.yyD‹+LX­1:ôðÈ’<wÛ‘/v{ò°–Å(jæÒ=ùËÆÆãŸì:³Øvžþ‚Ú?âý	Gþµ¿½>yhípAþÞ2m.§$&Îüìb¨”=´”m5%úí<ei­ä]B2rL³4ŒÂ‰5Ç®#¿nCnÝ¥Å?
%0nÉ?ö¹%AÆ³,O²>»«”^ëüü¯%¥³5«®+£® QªÎ ¿ƒÍHÂ.*òâÅØž%†'‘ÎïlÈV­noÄõ	Šë7µëÉ²õÕÃ%c¬;˜õ4Öc+™Öïß¡Û¿}ŠéŠé-Òó)¿³ä¨²»>¹Hò$>o/fr{Úf>P‰Oú'O6.'§•J¾.Õå#’f 9»`ägýbÆÉî_Ë/¥ÚuLç>¼½ÄÃ‰e"ZGXÁÓðß ¨Œaapµ¦‰­L"Õ2fX„Ê#rfy1LqEÆÛÐ†é¨ïÂÔF#¹ÄT)¶ù¢W²¯¹”‰U.Ÿr¡)s°»»ÄÌýêh÷§èTØ$TC4œž“<ïX*Ï‰ÆÝÎõ‘1‰›ð?Éè#ƒ4ãpœ‰¼ùÇÎqÍDT»Z(ã†*j—kàúãFB²ÎaB
j ây²``Â_ŽÝ¶”´ªkÏµOÀþCª™=¬ëö¦-ï¾ÝV˜Å¸ó+q!rì;{¶Y'y¹ùxoëÑiçé»Ôàg€þyæGì~XLF/"õkaÐß±ÖmÆât­_·°ÕLàæ¼ýücXü§×ž¡ªz¤¿ÙÀ&ø±¬MËÅ2vˆªª&(ÜC«¥JmKñÛ`¥O²|¡S}HÕ›0žåú¨ÐºÿÈdÓÝ%Lžú±…Q·šE•‚fÂp¶ý­¸†Ä&ÿ@–ùÊ1:u£ûc˜F…Òð°k#»ÉÍžšIÜSÈc*š²iÐJÿŽÉnS÷6¾éC÷Å.ºwßðh6â{¤ß|Ÿ_„Y·YüìØâM;5Q×%~)/£îuÈÝïÊ®}±&ÀOÝqµm~–°{2Xíu.xBn?û)ÍýØë‡ÏåÇqÃ±lÌ€VÍ/õÚÇý?–Ù>Ùla<H½©¼ýH~«L¼­Åº_¡ÄÃõÍÜ´ÒINVs»”å•7äðÇ£½rôã/{ïö~r0OÓ8Ž«ojžž>q®›sŒöºóJ7±8¯–Â}é€ï–ðµOOÊCmiM}á^=Åýg÷e÷Å}ß3¯=³Ýz¦LÔÜìµ¸ùL’pÉÞFÁ5®E[Æ‡Ùmq[›À‚úÝk–Ò¥£ÊU˜*KòÛD©ª˜³5"<övæŽQ‰Nm!*«¶°E’1 ±L$YÜËoéVñ/åÚB~EÚÏláe·£xK£¡²:q}RÞà†¼Æ.lJî¥þ…?á‘¶k#x·+^<‰#CLBâ_Ìbb¹.s¾[›‹šÛº€µÎ³0 øÌ9Pš­c6Y6ÚÝFká§¾ÈkÖ=ŸsÅ
UæåÉóÇLuÁoo.ˆÙ½Åânú+[¦èãÇ¶?óÁ4le_fzìÖžšÝÕ~v–4M¬­‚Õ¬³Î¶Ô.Ú‚wž®êÚAñu3°ÚóNsÉzÒv*ÿé÷„žZv×D/jk\ÉrëæúözíjaÌéd¿ÉŸÂÔÎ¿ù?   ÿÿ >iá