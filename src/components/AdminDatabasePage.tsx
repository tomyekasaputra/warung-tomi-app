import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Database,
  Edit2,
  Trash2,
  Plus,
  Filter,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Download,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  User,
  Users,
  Package,
  DollarSign,
  Tag,
  Check,
  ChevronDown,
  SlidersHorizontal,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Eye,
  Info,
  Coins,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  SupabaseSalesService,
  SupabaseSalesTransaction,
  SupabaseCustomerService,
  SupabaseSavingsService,
  SupabaseSavingTransaction,
  SupabaseDebtService,
  SupabaseDebtTransaction,
  SupabaseInvestmentService,
  SupabaseInvestmentTransaction,
  SupabaseStockService,
  SupabaseCustomer,
  SupabaseProduct,
  cleanupTableDuplicates
} from "../lib/supabase";
import { generateNextTabunganId, generateNextHutangId, get4DigitCustId, SavingTransaction, DebtTransaction } from "../App";

export const JENIS_OPTIONS = [
  "TARIK TUNAI",
  "PKH",
  "BPNT",
  "QRIS",
  "TRANSFER",
  "TOPUP DANA",
  "TOPUP OVO",
  "TOPUP GOPAY",
  "TOPUP SHOPEEPAY",
  "PULSA",
  "PAKET DATA",
  "TOKEN LISTRIK",
  "TAGIHAN LISTRIK",
  "BPJS",
  "PDAM",
  "VOUCHER TV",
  "VOUCHER GAME",
  "BAYAR VA",
  "MULTI FINANCE",
  "PRODUK FISIK / BELANJA"
];

export const MELALUI_OPTIONS = [
  "EDC BNI",
  "QRIS",
  "BCA",
  "BNI",
  "BRI",
  "MANDIRI",
  "SEABANK",
  "DANA",
  "OVO",
  "GOPAY",
  "SHOPEEPAY",
  "MITRA SHOPEE",
  "BUKALAPAK"
];

export const STATUS_OPTIONS = [
  "BELUM DIAMBIL",
  "DI PROSES",
  "SELESAI"
];

// Helper to convert DD/MM/YYYY or string to YYYY-MM-DD for <input type="date">
export const formatDateForInput = (dateStr?: string): string => {
  if (!dateStr || dateStr === "-") {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    } else {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      let y = parts[2];
      if (y.length === 2) y = "20" + y;
      return `${y}-${m}-${d}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
};

// Helper to convert YYYY-MM-DD back to DD/MM/YYYY
export const formatInputToDate = (isoStr: string): string => {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

export interface SalesTransaction {
  id: string;
  id_transaksi?: string;
  id_pelanggan?: string;
  Tanggal: string;
  Nama: string;
  Jenis: string;
  Melalui: string;
  Metode: string;
  Pemasukan: number;
  Poin: number;
  Status: string;
  HargaModal?: number;
  Sebagian?: number;
  hargaAdmin?: number;
}

interface AdminDatabasePageProps {
  salesTransactions: SalesTransaction[];
  setSalesTransactions: React.Dispatch<React.SetStateAction<SalesTransaction[]>>;
  customers?: any[];
  savingsTransactions?: SavingTransaction[];
  setSavingsTransactions?: React.Dispatch<React.SetStateAction<SavingTransaction[]>>;
  debtTransactions?: DebtTransaction[];
  setDebtTransactions?: React.Dispatch<React.SetStateAction<DebtTransaction[]>>;
}

export const AdminDatabasePage: React.FC<AdminDatabasePageProps> = ({
  salesTransactions,
  setSalesTransactions,
  customers = [],
  savingsTransactions = [],
  setSavingsTransactions,
  debtTransactions = [],
  setDebtTransactions
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterMetode, setFilterMetode] = useState("semua");
  const [filterTanggal, setFilterTanggal] = useState("hari_ini");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [displayCount, setDisplayCount] = useState(20);

  // Category Tab State: "penjualan" | "tabungan" | "hutang" | "investasi" | "pelanggan" | "stok"
  type CategoryType = "penjualan" | "tabungan" | "hutang" | "investasi" | "pelanggan" | "stok";
  const [activeCategory, setActiveCategory] = useState<CategoryType>("penjualan");

  // Detail Modal State for Penjualan
  const [detailTx, setDetailTx] = useState<SalesTransaction | null>(null);

  // --- TABUNGAN STATE & CRUD ---
  const [savingsList, setSavingsList] = useState<SupabaseSavingTransaction[]>([]);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [addSavingForm, setAddSavingForm] = useState<Partial<SupabaseSavingTransaction>>({});
  const [editingSaving, setEditingSaving] = useState<SupabaseSavingTransaction | null>(null);
  const [editSavingForm, setEditSavingForm] = useState<Partial<SupabaseSavingTransaction>>({});
  const [deletingSaving, setDeletingSaving] = useState<SupabaseSavingTransaction | null>(null);
  const [detailSaving, setDetailSaving] = useState<SupabaseSavingTransaction | null>(null);

  // --- HUTANG STATE & CRUD ---
  const [debtList, setDebtList] = useState<SupabaseDebtTransaction[]>([]);
  const [isLoadingDebts, setIsLoadingDebts] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [addDebtForm, setAddDebtForm] = useState<Partial<SupabaseDebtTransaction>>({});
  const [editingDebt, setEditingDebt] = useState<SupabaseDebtTransaction | null>(null);
  const [editDebtForm, setEditDebtForm] = useState<Partial<SupabaseDebtTransaction>>({});
  const [deletingDebt, setDeletingDebt] = useState<SupabaseDebtTransaction | null>(null);
  const [detailDebt, setDetailDebt] = useState<SupabaseDebtTransaction | null>(null);

  // --- INVESTASI STATE & CRUD ---
  const [investmentList, setInvestmentList] = useState<SupabaseInvestmentTransaction[]>([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [addInvestmentForm, setAddInvestmentForm] = useState<Partial<SupabaseInvestmentTransaction>>({});
  const [editingInvestment, setEditingInvestment] = useState<SupabaseInvestmentTransaction | null>(null);
  const [editInvestmentForm, setEditInvestmentForm] = useState<Partial<SupabaseInvestmentTransaction>>({});
  const [deletingInvestment, setDeletingInvestment] = useState<SupabaseInvestmentTransaction | null>(null);
  const [detailInvestment, setDetailInvestment] = useState<SupabaseInvestmentTransaction | null>(null);

  // --- STOK & BARANG STATE ---
  const [productList, setProductList] = useState<SupabaseProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch Savings Data from Supabase
  const fetchSavings = async () => {
    setIsLoadingSavings(true);
    const res = await SupabaseSavingsService.getSavings();
    if (res.data) {
      setSavingsList(res.data);
    }
    setIsLoadingSavings(false);
  };

  // Fetch Debt Data from Supabase
  const fetchDebts = async () => {
    setIsLoadingDebts(true);
    const res = await SupabaseDebtService.getDebts();
    if (res.data) {
      setDebtList(res.data);
    }
    setIsLoadingDebts(false);
  };

  // Fetch Investment Data from Supabase
  const fetchInvestments = async () => {
    setIsLoadingInvestments(true);
    const res = await SupabaseInvestmentService.getInvestments();
    if (res.data) {
      setInvestmentList(res.data);
    }
    setIsLoadingInvestments(false);
  };

  // Fetch Product Data from Supabase
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    const res = await SupabaseStockService.getProducts();
    if (res.data) {
      setProductList(res.data);
    }
    setIsLoadingProducts(false);
  };

  useEffect(() => {
    fetchSavings();
    fetchDebts();
    fetchInvestments();
    fetchProducts();
  }, []);

  // Helper for parsing date strings (supports DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
  const parseTxDate = (dateVal?: any): number => {
    if (!dateVal || dateVal === "-") return 0;
    if (typeof dateVal === "number") return dateVal;
    if (dateVal instanceof Date) return dateVal.getTime();
    let str = String(dateVal).trim();
    if (!str) return 0;
    const parts = str.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d).getTime();
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        return new Date(y, m, d).getTime();
      }
    }
    const parsed = new Date(str).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // Filter Popover State
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Customer List State for Dropdowns
  const [customerList, setCustomerList] = useState<any[]>(customers || []);

  useEffect(() => {
    const loadCustomers = async () => {
      if (SupabaseCustomerService.isConnected()) {
        try {
          const res = await SupabaseCustomerService.getCustomers();
          if (res.data && res.data.length > 0) {
            setCustomerList(res.data);
            return;
          }
        } catch (e) {
          console.error("Error loading customers from Supabase:", e);
        }
      }
      if (customers && customers.length > 0) {
        setCustomerList(customers);
      }
    };
    loadCustomers();
  }, [customers]);

  const parseCurrency = (val: any) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    const cleaned = String(val).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleaned) || 0;
  };

  // Helper to extract last 4 digits/chars of Customer ID (e.g., CUST-0120 -> 0120, CUST-0000 -> 0000)
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

  // Helper to calculate TRX-(4digit)/(sequence)
  const calculateAutoTxId = (idPelanggan: string, nama: string, allTxs: SalesTransaction[]): string => {
    const custDigits = get4DigitCustId(idPelanggan);

    const custTxs = allTxs.filter((tx) => {
      const txCustId = (tx.id_pelanggan || "").trim().toLowerCase();
      const txName = (tx.Nama || "").trim().toLowerCase();
      const targetCustId = (idPelanggan || "").trim().toLowerCase();
      const targetName = (nama || "").trim().toLowerCase();

      if (targetCustId && targetCustId !== "cust-0000") {
        if (txCustId === targetCustId) return true;
      }
      if (targetName) {
        if (txName === targetName) return true;
      }
      return false;
    });

    let maxSeq = custTxs.length;

    custTxs.forEach((tx) => {
      const txIdStr = tx.id_transaksi || tx.id || "";
      const match = txIdStr.match(/\/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `TRX-${custDigits}/${nextSeq}`;
  };

  // Add Virtual Sales State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState<Partial<SalesTransaction>>({});

  // Warung Tomi Admin Fee Schedule
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

  const handlePemasukanChange = (val: number) => {
    const adminFee = calculateWarungTomiFee(val);
    const calculatedModal = Math.max(0, val - adminFee);
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
    const adminFee = Math.max(0, jual - modalVal);
    setAddFormData((prev) => ({
      ...prev,
      HargaModal: modalVal,
      hargaAdmin: adminFee
    }));
  };

  const handleOpenAdd = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const formattedToday = `${dd}/${mm}/${yyyy}`;
    
    const defaultCustId = "CUST-0000";
    const defaultName = "Pelanggan Umum";
    const autoId = calculateAutoTxId(defaultCustId, defaultName, salesTransactions);

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

    const newTx: SalesTransaction = {
      id: addFormData.id_transaksi || `TRX-${Date.now()}`,
      id_transaksi: addFormData.id_transaksi || `TRX-${Date.now()}`,
      id_pelanggan: addFormData.id_pelanggan || "",
      Tanggal: addFormData.Tanggal || formatInputToDate(new Date().toISOString().slice(0, 10)),
      Nama: addFormData.Nama.trim(),
      Jenis: addFormData.Jenis || "TARIK TUNAI",
      Melalui: addFormData.Melalui || "EDC BNI",
      Metode: addFormData.Metode || "TUNAI",
      Pemasukan: Number(addFormData.Pemasukan) || 0,
      HargaModal: Number(addFormData.HargaModal) || 0,
      Sebagian: Number(addFormData.Sebagian) || 0,
      Poin: Number(addFormData.Poin) || 0,
      Status: addFormData.Status || "SELESAI"
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

      // 1. Unshift into local state
      setSalesTransactions((prev) => [newTx, ...prev]);

      // 2. Persist to Supabase
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
          sebagian: newTx.Sebagian
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

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<SalesTransaction | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SalesTransaction>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirm Modal State
  const [deletingTx, setDeletingTx] = useState<SalesTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Unique available dates in Sales Data for daily pagination
  const availableSalesDates = useMemo(() => {
    const dateSet = new Set<string>();
    salesTransactions.forEach((t) => {
      if (t.Tanggal && t.Tanggal !== "-") {
        dateSet.add(t.Tanggal.trim());
      }
    });
    const arr = Array.from(dateSet);
    arr.sort((a, b) => parseTxDate(b) - parseTxDate(a));
    return arr;
  }, [salesTransactions]);

  // 1. Sort sales transactions by date (Newest First by default)
  const sortedTransactions = useMemo(() => {
    const list = [...salesTransactions];
    return list.sort((a, b) => {
      const timeA = parseTxDate(a.Tanggal);
      const timeB = parseTxDate(b.Tanggal);
      if (timeA !== timeB) {
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      }
      const idA = a.id_transaksi || a.id || "";
      const idB = b.id_transaksi || b.id || "";
      return sortOrder === "desc" ? idB.localeCompare(idA) : idA.localeCompare(idB);
    });
  }, [salesTransactions, sortOrder]);

  // 2. Filter transactions based on search query, categories, and dates
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

    return sortedTransactions.filter((t) => {
      if (!t) return false;
      const q = (searchQuery || "").toLowerCase().trim();

      const txId = String(t.id_transaksi || t.id || "").toLowerCase();
      const txName = String(t.Nama || t.nama || "").toLowerCase();
      const custId = String(t.id_pelanggan || "").toLowerCase();
      const txJenis = String(t.Jenis || t.jenis || "").toLowerCase();
      const txMelalui = String(t.Melalui || t.melalui || "").toLowerCase();
      const txMetode = String(t.Metode || t.metode || "").toLowerCase();
      const txStatus = String(t.Status || t.status || "").toLowerCase();
      const txTanggal = String(t.Tanggal || t.tanggal || "").toLowerCase();
      const txPemasukan = String(t.Pemasukan ?? t.pemasukan ?? "");
      const txModal = String(t.HargaModal ?? t.harga_modal ?? "");

      const matchSearch =
        !q ||
        txId.includes(q) ||
        txName.includes(q) ||
        custId.includes(q) ||
        txJenis.includes(q) ||
        txMelalui.includes(q) ||
        txMetode.includes(q) ||
        txStatus.includes(q) ||
        txTanggal.includes(q) ||
        txPemasukan.includes(q) ||
        txModal.includes(q);

      let matchJenis = true;
      if (filterJenis && filterJenis !== "semua") {
        matchJenis = (t.Jenis || t.jenis || "").toUpperCase() === filterJenis.toUpperCase();
      }

      let matchMetode = true;
      if (filterMetode && filterMetode !== "semua") {
        matchMetode = (t.Metode || t.metode || "").toUpperCase() === filterMetode.toUpperCase();
      }

      let matchTanggal = true;
      if (filterTanggal === "hari_ini") {
        const txTime = parseTxDate(t.Tanggal || t.tanggal);
        matchTanggal = txTime >= todayStart && txTime <= todayEnd;
      } else if (filterTanggal === "bulan_ini") {
        const txTime = parseTxDate(t.Tanggal || t.tanggal);
        if (txTime === 0) matchTanggal = false;
        else {
          const d = new Date(txTime);
          matchTanggal = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
      } else if (filterTanggal !== "semua" && filterTanggal && filterTanggal.length > 0) {
        const customTime = parseTxDate(filterTanggal);
        const txTime = parseTxDate(t.Tanggal || t.tanggal);
        matchTanggal = txTime >= customTime && txTime < customTime + 24 * 60 * 60 * 1000;
      }

      return matchSearch && matchJenis && matchMetode && matchTanggal;
    });
  }, [sortedTransactions, searchQuery, filterJenis, filterMetode, filterTanggal]);

  // Reset pagination count on filter change
  useEffect(() => {
    setDisplayCount(20);
  }, [searchQuery, filterJenis, filterMetode, filterTanggal, sortOrder]);

  // 3. Paginated slice for display (starts at 20, increments by 20 on scroll)
  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, displayCount);
  }, [filteredTransactions, displayCount]);

  // 4. Infinite scroll handler attached to window / document
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (displayCount >= filteredTransactions.length) return;

      const container = tableContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 80) {
          setDisplayCount((prev) => Math.min(prev + 20, filteredTransactions.length));
        }
      }

      // Also check window scroll
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        setDisplayCount((prev) => Math.min(prev + 20, filteredTransactions.length));
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [displayCount, filteredTransactions.length]);

  // Reset displayCount when search/filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [searchQuery, filterJenis, filterMetode]);

  // Open Edit Form
  const handleOpenEdit = (tx: SalesTransaction) => {
    setEditingTx(tx);
    setEditFormData({
      id_transaksi: tx.id_transaksi || tx.id,
      id_pelanggan: tx.id_pelanggan || "",
      Tanggal: tx.Tanggal,
      Nama: tx.Nama,
      Jenis: tx.Jenis,
      Melalui: tx.Melalui || "-",
      Metode: tx.Metode || "TUNAI",
      Pemasukan: tx.Pemasukan || 0,
      HargaModal: tx.HargaModal || 0,
      Sebagian: tx.Sebagian || 0,
      Poin: tx.Poin || 0,
      Status: tx.Status || "SELESAI"
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setIsSaving(true);

    const updatedTx: SalesTransaction = {
      ...editingTx,
      ...editFormData,
      id: editingTx.id,
      id_transaksi: editFormData.id_transaksi || editingTx.id_transaksi || editingTx.id,
      Pemasukan: Number(editFormData.Pemasukan) || 0,
      HargaModal: Number(editFormData.HargaModal) || 0,
      Sebagian: Number(editFormData.Sebagian) || 0,
      Poin: Number(editFormData.Poin) || 0,
      Status: editFormData.Status || "SELESAI"
    };

    const primaryId = editingTx.id;
    const oldTrxId = editingTx.id_transaksi || editingTx.id;

    try {
      // 1. Update local state with deduplication (replace matching row by id or oldTrxId)
      setSalesTransactions((prev) => {
        let replaced = false;
        const result: SalesTransaction[] = [];
        for (const item of prev) {
          const isMatch =
            (primaryId && item.id && item.id === primaryId) ||
            (oldTrxId && (item.id_transaksi === oldTrxId || item.id === oldTrxId));

          if (isMatch) {
            if (!replaced) {
              result.push(updatedTx);
              replaced = true;
            }
            // Ignore subsequent duplicate copies
          } else {
            result.push(item);
          }
        }
        if (!replaced) {
          result.unshift(updatedTx);
        }
        return result;
      });

      // 2. Sync with Supabase if connected using UUID primary key 'id'
      if (SupabaseSalesService.isConnected()) {
        const payload: SupabaseSalesTransaction = {
          id: updatedTx.id,
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
          sebagian: updatedTx.Sebagian
        };
        await SupabaseSalesService.upsertSale(payload);
        // Clean up any lingering duplicate rows in Supabase
        await cleanupTableDuplicates('sales_transactions', 'id_transaksi');
      }

      showToast("Data transaksi berhasil diperbarui!");
      setEditingTx(null);
    } catch (err: any) {
      console.error("Gagal update transaksi:", err);
      showToast("Gagal memperbarui data transaksi.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (tx: SalesTransaction) => {
    setDeletingTx(tx);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);

    const targetId = deletingTx.id_transaksi || deletingTx.id;

    try {
      // 1. Update local state
      setSalesTransactions((prev) =>
        prev.filter((t) => t.id_transaksi !== targetId && t.id !== targetId && t.id !== deletingTx.id)
      );

      // 2. Delete from Supabase if connected
      if (SupabaseSalesService.isConnected()) {
        await SupabaseSalesService.deleteSale(targetId);
      }

      showToast(`Transaksi ${targetId} berhasil dihapus.`);
      setDeletingTx(null);
    } catch (err: any) {
      console.error("Gagal menghapus transaksi:", err);
      showToast("Gagal menghapus data transaksi.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Manual trigger to clean duplicate rows
  const handleCleanupDuplicates = async () => {
    // 1. Local state deduplication
    setSalesTransactions((prev) => {
      const map = new Map<string, SalesTransaction>();
      for (const t of prev) {
        const key = t.id_transaksi || t.id;
        if (key && !map.has(key)) {
          map.set(key, t);
        }
      }
      return Array.from(map.values());
    });

    // 2. Supabase deduplication
    if (SupabaseSalesService.isConnected()) {
      const res = await cleanupTableDuplicates('sales_transactions', 'id_transaksi');
      if (res.success) {
        showToast(res.message);
      } else {
        showToast("Proses pembersihan duplikat selesai.");
      }
    } else {
      showToast("Duplikat di tampilan lokal telah dibersihkan.");
    }
  };

  // Export to CSV helper - dynamically handles all active categories
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `database_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeCategory === "penjualan") {
      if (filteredTransactions.length === 0) {
        showToast("Tidak ada data penjualan untuk diexport.", "error");
        return;
      }
      headers = ["ID Transaksi", "Tanggal", "ID Pelanggan", "Nama", "Jenis", "Metode", "Pemasukan", "Harga Modal", "Poin", "Status", "Melalui"];
      rows = filteredTransactions.map((t) => [
        t.id_transaksi || t.id,
        t.Tanggal,
        t.id_pelanggan || "-",
        `"${(t.Nama || "").replace(/"/g, '""')}"`,
        `"${(t.Jenis || "").replace(/"/g, '""')}"`,
        t.Metode || "-",
        t.Pemasukan || 0,
        t.HargaModal || 0,
        t.Poin || 0,
        t.Status || "-",
        t.Melalui || "-"
      ]);
    } else if (activeCategory === "tabungan") {
      if (filteredSavings.length === 0) {
        showToast("Tidak ada data tabungan untuk diexport.", "error");
        return;
      }
      headers = ["ID Tabungan", "ID Pelanggan", "Tanggal", "Nama Nasabah", "Tipe", "Nominal", "Saldo Akhir", "Berita"];
      rows = filteredSavings.map((s) => [
        s.id_tabungan || s.id || "-",
        s.id_pelanggan || "-",
        s.tanggal || "-",
        `"${(s.nama_nasabah || s.nama || "").replace(/"/g, '""')}"`,
        s.tipe || "-",
        s.nominal || 0,
        s.saldo_akhir || 0,
        `"${(s.berita || s.keterangan || "").replace(/"/g, '""')}"`
      ]);
    } else if (activeCategory === "hutang") {
      if (filteredDebts.length === 0) {
        showToast("Tidak ada data hutang untuk diexport.", "error");
        return;
      }
      headers = ["ID Hutang", "ID Pelanggan", "Tanggal", "Nama Pelanggan", "Tipe", "Jumlah", "Saldo Akhir", "Keterangan"];
      rows = filteredDebts.map((d) => [
        d.id_hutang || d.id || "-",
        d.id_pelanggan || "-",
        d.tanggal || "-",
        `"${(d.nama_pelanggan || d.nama || "").replace(/"/g, '""')}"`,
        d.tipe || "-",
        d.jumlah || 0,
        d.saldo_akhir || 0,
        `"${(d.keterangan || "").replace(/"/g, '""')}"`
      ]);
    } else if (activeCategory === "investasi") {
      if (filteredInvestments.length === 0) {
        showToast("Tidak ada data investasi untuk diexport.", "error");
        return;
      }
      headers = ["ID Investasi", "ID Pelanggan", "Tanggal", "Nama Investor", "Nominal", "Tenor", "Jatuh Tempo", "Status", "Nisbah", "Keterangan"];
      rows = filteredInvestments.map((i) => [
        i.id_investasi || i.id || "-",
        i.id_pelanggan || "-",
        i.tanggal || "-",
        `"${(i.nama_investor || i.nama || "").replace(/"/g, '""')}"`,
        i.nominal || 0,
        i.tenor || (i.tenor_bulan ? `${i.tenor_bulan} Bln` : "-"),
        i.jatuh_tempo || "-",
        i.status || "-",
        i.nisbah || (i.nisbah_persen ? `${i.nisbah_persen}%` : "-"),
        `"${(i.keterangan || "").replace(/"/g, '""')}"`
      ]);
    } else if (activeCategory === "pelanggan") {
      if (filteredCustomers.length === 0) {
        showToast("Tidak ada data pelanggan untuk diexport.", "error");
        return;
      }
      headers = ["ID Pelanggan", "Nama", "Telepon", "Alamat", "Tabungan", "Hutang", "Investasi", "Point", "Level"];
      rows = filteredCustomers.map((c) => [
        c.id_pelanggan || c.id || "-",
        `"${(c.nama || "").replace(/"/g, '""')}"`,
        c.telepon || "-",
        `"${(c.alamat || "").replace(/"/g, '""')}"`,
        c.tabungan || 0,
        c.hutang || 0,
        c.investasi || 0,
        c.point || 0,
        c.level || "Bronze"
      ]);
    } else if (activeCategory === "stok") {
      if (filteredProducts.length === 0) {
        showToast("Tidak ada data stok barang untuk diexport.", "error");
        return;
      }
      headers = ["ID Barang", "Nama Barang", "Kategori", "Stok", "Satuan", "Harga Modal", "Harga Jual", "Update Terakhir"];
      rows = filteredProducts.map((p) => [
        p.id_barang || p.id || "-",
        `"${(p.nama || "").replace(/"/g, '""')}"`,
        p.kategori || "Lainnya",
        p.stok || 0,
        p.satuan || "pcs",
        p.harga_modal || 0,
        p.harga_jual || 0,
        p.update_terakhir || "-"
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`File CSV ${activeCategory.toUpperCase()} berhasil diunduh!`);
  };

  // --- TABUNGAN HANDLERS ---
  const handleOpenAddSaving = () => {
    setAddSavingForm({
      id: `SAV-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      nama_nasabah: "",
      tipe: "SETOR",
      nominal: 0,
      saldo_akhir: 0
    });
    setIsAddSavingOpen(true);
  };

  const handleSaveAddSaving = async () => {
    const nameVal = addSavingForm.nama_nasabah || addSavingForm.nama || "";
    if (!nameVal) {
      showToast("Nama Nasabah harus diisi!", "error");
      return;
    }
    const newSaving: SupabaseSavingTransaction = {
      id: addSavingForm.id || `SAV-${Date.now()}`,
      id_tabungan: addSavingForm.id_tabungan || addSavingForm.id || `TBG-${Date.now()}`,
      tanggal: addSavingForm.tanggal || new Date().toISOString().slice(0, 10),
      nama: nameVal,
      nama_nasabah: nameVal,
      tipe: (addSavingForm.tipe as "SETOR" | "TARIK") || "SETOR",
      nominal: Number(addSavingForm.nominal) || 0,
      saldo_akhir: Number(addSavingForm.saldo_akhir) || Number(addSavingForm.nominal) || 0,
      keterangan: addSavingForm.keterangan || ""
    };

    setSavingsList((prev) => [newSaving, ...prev]);
    if (SupabaseSavingsService.isConnected()) {
      await SupabaseSavingsService.upsertSaving(newSaving);
    }
    showToast("Data tabungan berhasil ditambahkan!");
    setIsAddSavingOpen(false);
  };

  const handleOpenEditSaving = (s: SupabaseSavingTransaction) => {
    setEditingSaving(s);
    setEditSavingForm({ ...s, nama_nasabah: s.nama_nasabah || s.nama || "" });
  };

  const handleSaveEditSaving = async () => {
    if (!editingSaving) return;
    const nameVal = editSavingForm.nama_nasabah || editSavingForm.nama || editingSaving.nama_nasabah || editingSaving.nama || "";
    const updated: SupabaseSavingTransaction = {
      ...editingSaving,
      ...editSavingForm,
      nama: nameVal,
      nama_nasabah: nameVal,
      nominal: Number(editSavingForm.nominal) || 0,
      saldo_akhir: Number(editSavingForm.saldo_akhir) || 0
    };
    setSavingsList((prev) => prev.map((item) => (item.id === updated.id || item.id_tabungan === updated.id_tabungan ? updated : item)));
    if (SupabaseSavingsService.isConnected()) {
      try {
        const { error } = await SupabaseSavingsService.upsertSaving(updated);
        if (error) {
          console.error("Gagal edit tabungan di Supabase:", error);
          showToast("Gagal sync ke Supabase: " + error.message, "error");
        } else {
          showToast("Data tabungan berhasil disimpan ke Supabase!");
        }
      } catch (err: any) {
        console.error("Error saving tabungan to Supabase:", err);
      }
    } else {
      showToast("Data tabungan berhasil diperbarui secara lokal!");
    }
    setEditingSaving(null);
  };

  const handleOpenDeleteSaving = (s: SupabaseSavingTransaction) => {
    setDeletingSaving(s);
  };

  const handleConfirmDeleteSaving = async () => {
    if (!deletingSaving) return;
    const targetIdTabungan = deletingSaving.id_tabungan || deletingSaving.id;
    const targetAltId = deletingSaving.id;
    setSavingsList((prev) => prev.filter((item) => item.id !== deletingSaving.id && item.id_tabungan !== deletingSaving.id_tabungan));
    if (SupabaseSavingsService.isConnected()) {
      try {
        const { error } = await SupabaseSavingsService.deleteSaving(targetIdTabungan, targetAltId);
        if (error) {
          console.error("Gagal hapus tabungan di Supabase:", error);
          showToast("Gagal hapus di Supabase: " + error.message, "error");
        } else {
          showToast("Data tabungan berhasil dihapus dari Supabase!");
        }
      } catch (err: any) {
        console.error("Error deleting tabungan from Supabase:", err);
      }
    } else {
      showToast("Data tabungan berhasil dihapus secara lokal!");
    }
    setDeletingSaving(null);
  };

  // --- HUTANG HANDLERS ---
  const handleOpenAddDebt = () => {
    setAddDebtForm({
      id: `DEBT-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      nama_pelanggan: "",
      tipe: "KASBON",
      jumlah: 0,
      saldo_akhir: 0
    });
    setIsAddDebtOpen(true);
  };

  const handleSaveAddDebt = async () => {
    const nameVal = addDebtForm.nama_pelanggan || addDebtForm.nama || "";
    if (!nameVal) {
      showToast("Nama Pelanggan harus diisi!", "error");
      return;
    }
    const newDebt: SupabaseDebtTransaction = {
      id: addDebtForm.id || `DEBT-${Date.now()}`,
      id_hutang: addDebtForm.id_hutang || addDebtForm.id || `HTG-${Date.now()}`,
      tanggal: addDebtForm.tanggal || new Date().toISOString().slice(0, 10),
      nama: nameVal,
      nama_pelanggan: nameVal,
      tipe: (addDebtForm.tipe as "KASBON" | "BAYAR") || "KASBON",
      jumlah: Number(addDebtForm.jumlah) || 0,
      saldo_akhir: Number(addDebtForm.saldo_akhir) || Number(addDebtForm.jumlah) || 0,
      keterangan: addDebtForm.keterangan || ""
    };

    setDebtList((prev) => [newDebt, ...prev]);
    if (SupabaseDebtService.isConnected()) {
      await SupabaseDebtService.upsertDebt(newDebt);
    }
    showToast("Data hutang berhasil ditambahkan!");
    setIsAddDebtOpen(false);
  };

  const handleOpenEditDebt = (d: SupabaseDebtTransaction) => {
    setEditingDebt(d);
    setEditDebtForm({ ...d, nama_pelanggan: d.nama_pelanggan || d.nama || "" });
  };

  const handleSaveEditDebt = async () => {
    if (!editingDebt) return;
    const nameVal = editDebtForm.nama_pelanggan || editDebtForm.nama || editingDebt.nama_pelanggan || editingDebt.nama || "";
    const updated: SupabaseDebtTransaction = {
      ...editingDebt,
      ...editDebtForm,
      nama: nameVal,
      nama_pelanggan: nameVal,
      jumlah: Number(editDebtForm.jumlah) || 0,
      saldo_akhir: Number(editDebtForm.saldo_akhir) || 0
    };
    setDebtList((prev) => prev.map((item) => (item.id === updated.id || item.id_hutang === updated.id_hutang ? updated : item)));
    if (SupabaseDebtService.isConnected()) {
      try {
        const { error } = await SupabaseDebtService.upsertDebt(updated);
        if (error) {
          console.error("Gagal edit hutang di Supabase:", error);
          showToast("Gagal sync ke Supabase: " + error.message, "error");
        } else {
          showToast("Data hutang berhasil disimpan ke Supabase!");
        }
      } catch (err: any) {
        console.error("Error saving debt to Supabase:", err);
      }
    } else {
      showToast("Data hutang berhasil diperbarui secara lokal!");
    }
    setEditingDebt(null);
  };

  const handleOpenDeleteDebt = (d: SupabaseDebtTransaction) => {
    setDeletingDebt(d);
  };

  const handleConfirmDeleteDebt = async () => {
    if (!deletingDebt) return;
    const targetIdHutang = deletingDebt.id_hutang || deletingDebt.id;
    const targetAltId = deletingDebt.id;
    setDebtList((prev) => prev.filter((item) => item.id !== deletingDebt.id && item.id_hutang !== deletingDebt.id_hutang));
    if (SupabaseDebtService.isConnected()) {
      try {
        const { error } = await SupabaseDebtService.deleteDebt(targetIdHutang, targetAltId);
        if (error) {
          console.error("Gagal hapus hutang di Supabase:", error);
          showToast("Gagal hapus di Supabase: " + error.message, "error");
        } else {
          showToast("Data hutang berhasil dihapus dari Supabase!");
        }
      } catch (err: any) {
        console.error("Error deleting debt from Supabase:", err);
      }
    } else {
      showToast("Data hutang berhasil dihapus secara lokal!");
    }
    setDeletingDebt(null);
  };

  // --- INVESTASI HANDLERS ---
  const handleOpenAddInvestment = () => {
    setAddInvestmentForm({
      id: `INV-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      nama_investor: "",
      nominal: 0,
      tenor_bulan: 12,
      nisbah_persen: 10,
      status: "BERJALAN"
    });
    setIsAddInvestmentOpen(true);
  };

  const handleSaveAddInvestment = async () => {
    const nameVal = addInvestmentForm.nama_investor || addInvestmentForm.nama || "";
    if (!nameVal) {
      showToast("Nama Investor harus diisi!", "error");
      return;
    }
    const newInv: SupabaseInvestmentTransaction = {
      id: addInvestmentForm.id || `INV-${Date.now()}`,
      id_investasi: addInvestmentForm.id_investasi || addInvestmentForm.id || `INV-${Date.now()}`,
      tanggal: addInvestmentForm.tanggal || new Date().toISOString().slice(0, 10),
      nama: nameVal,
      nama_investor: nameVal,
      nominal: Number(addInvestmentForm.nominal) || 0,
      tenor_bulan: Number(addInvestmentForm.tenor_bulan) || 12,
      tenor: addInvestmentForm.tenor || `${addInvestmentForm.tenor_bulan || 12} Bulan`,
      nisbah_persen: Number(addInvestmentForm.nisbah_persen) || 10,
      nisbah: addInvestmentForm.nisbah || `${addInvestmentForm.nisbah_persen || 10}%`,
      status: (addInvestmentForm.status as "BERJALAN" | "SELESAI") || "BERJALAN",
      keterangan: addInvestmentForm.keterangan || ""
    };

    setInvestmentList((prev) => [newInv, ...prev]);
    if (SupabaseInvestmentService.isConnected()) {
      await SupabaseInvestmentService.upsertInvestment(newInv);
    }
    showToast("Data investasi berhasil ditambahkan!");
    setIsAddInvestmentOpen(false);
  };

  const handleOpenEditInvestment = (i: SupabaseInvestmentTransaction) => {
    setEditingInvestment(i);
    setEditInvestmentForm({ ...i, nama_investor: i.nama_investor || i.nama || "" });
  };

  const handleSaveEditInvestment = async () => {
    if (!editingInvestment) return;
    const nameVal = editInvestmentForm.nama_investor || editInvestmentForm.nama || editingInvestment.nama_investor || editingInvestment.nama || "";
    const updated: SupabaseInvestmentTransaction = {
      ...editingInvestment,
      ...editInvestmentForm,
      nama: nameVal,
      nama_investor: nameVal,
      nominal: Number(editInvestmentForm.nominal) || 0,
      tenor_bulan: Number(editInvestmentForm.tenor_bulan) || 0,
      nisbah_persen: Number(editInvestmentForm.nisbah_persen) || 0
    };
    setInvestmentList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (SupabaseInvestmentService.isConnected()) {
      await SupabaseInvestmentService.upsertInvestment(updated);
    }
    showToast("Data investasi berhasil diperbarui!");
    setEditingInvestment(null);
  };

  const handleOpenDeleteInvestment = (i: SupabaseInvestmentTransaction) => {
    setDeletingInvestment(i);
  };

  const handleConfirmDeleteInvestment = async () => {
    if (!deletingInvestment) return;
    setInvestmentList((prev) => prev.filter((item) => item.id !== deletingInvestment.id));
    if (SupabaseInvestmentService.isConnected()) {
      await SupabaseInvestmentService.deleteInvestment(deletingInvestment.id);
    }
    showToast("Data investasi berhasil dihapus!");
    setDeletingInvestment(null);
  };

  // Filtered lists for Tabungan, Hutang, Investasi, Pelanggan, Stok
  const filteredSavings = useMemo(() => {
    let list = savingsList.filter((s) => {
      if (!s) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const nameStr = String(s.nama_nasabah || s.nama || (s as any).Nama || "").toLowerCase();
      const ketStr = String(s.keterangan || s.berita || "").toLowerCase();
      const idStr = String(s.id_nasabah || s.id_tabungan || s.id || "").toLowerCase();
      const custIdStr = String(s.id_pelanggan || "").toLowerCase();
      const tanggalStr = String(s.tanggal || s.Tanggal || "").toLowerCase();
      const tipeStr = String(s.tipe || s.Tipe || "").toLowerCase();
      const nominalStr = String(s.nominal ?? s.Nominal ?? "");
      const saldoStr = String(s.saldo_akhir ?? s.SaldoAkhir ?? "");

      return (
        nameStr.includes(q) ||
        ketStr.includes(q) ||
        idStr.includes(q) ||
        custIdStr.includes(q) ||
        tanggalStr.includes(q) ||
        tipeStr.includes(q) ||
        nominalStr.includes(q) ||
        saldoStr.includes(q)
      );
    });
    list.sort((a, b) => {
      const dateA = parseTxDate(a.tanggal || a.Tanggal);
      const dateB = parseTxDate(b.tanggal || b.Tanggal);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [savingsList, searchQuery, sortOrder]);

  const filteredDebts = useMemo(() => {
    let list = debtList.filter((d) => {
      if (!d) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const nameStr = String(d.nama_pelanggan || d.nama || (d as any).Nama || "").toLowerCase();
      const ketStr = String(d.keterangan || d.berita || "").toLowerCase();
      const idStr = String(d.id_pelanggan || d.id_hutang || d.id || "").toLowerCase();
      const tanggalStr = String(d.tanggal || d.Tanggal || "").toLowerCase();
      const tipeStr = String(d.tipe || d.Tipe || "").toLowerCase();
      const jumlahStr = String(d.jumlah ?? d.Jumlah ?? d.nominal ?? "");
      const saldoStr = String(d.saldo_akhir ?? d.SaldoAkhir ?? "");

      return (
        nameStr.includes(q) ||
        ketStr.includes(q) ||
        idStr.includes(q) ||
        tanggalStr.includes(q) ||
        tipeStr.includes(q) ||
        jumlahStr.includes(q) ||
        saldoStr.includes(q)
      );
    });
    list.sort((a, b) => {
      const dateA = parseTxDate(a.tanggal || a.Tanggal);
      const dateB = parseTxDate(b.tanggal || b.Tanggal);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [debtList, searchQuery, sortOrder]);

  const filteredInvestments = useMemo(() => {
    let list = investmentList.filter((i) => {
      if (!i) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const nameStr = String(i.nama_investor || i.nama || (i as any).Nama || "").toLowerCase();
      const ketStr = String(i.keterangan || "").toLowerCase();
      const tenorStr = String(i.tenor || (i.tenor_bulan ? `${i.tenor_bulan} Bln` : "")).toLowerCase();
      const nisbahStr = String(i.nisbah || (i.nisbah_persen ? `${i.nisbah_persen}%` : "")).toLowerCase();
      const tanggalStr = String(i.tanggal || i.Tanggal || "").toLowerCase();
      const statusStr = String(i.status || i.Status || "").toLowerCase();
      const nominalStr = String(i.nominal ?? i.Nominal ?? "");
      const idStr = String(i.id_investasi || i.id || "").toLowerCase();

      return (
        nameStr.includes(q) ||
        ketStr.includes(q) ||
        tenorStr.includes(q) ||
        nisbahStr.includes(q) ||
        tanggalStr.includes(q) ||
        statusStr.includes(q) ||
        nominalStr.includes(q) ||
        idStr.includes(q)
      );
    });
    list.sort((a, b) => {
      const dateA = parseTxDate(a.tanggal || a.Tanggal);
      const dateB = parseTxDate(b.tanggal || b.Tanggal);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [investmentList, searchQuery, sortOrder]);

  const filteredCustomers = useMemo(() => {
    let list = customerList.filter((c) => {
      if (!c) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const nameStr = String(c.nama || c.Nama || "").toLowerCase();
      const idStr = String(c.id_pelanggan || c.id || "").toLowerCase();
      const telpStr = String(c.telepon || c.Telepon || c.HP || c.hp || c.NoHP || c.no_hp || "").toLowerCase();
      const alamatStr = String(c.alamat || c.Alamat || "").toLowerCase();
      const levelStr = String(c.level || c.Level || "").toLowerCase();
      const tabunganStr = String(c.tabungan ?? c.Tabungan ?? "");
      const hutangStr = String(c.hutang ?? c.Hutang ?? "");
      const poinStr = String(c.point ?? c.poin ?? c.Poin ?? "");

      return (
        nameStr.includes(q) ||
        idStr.includes(q) ||
        telpStr.includes(q) ||
        alamatStr.includes(q) ||
        levelStr.includes(q) ||
        tabunganStr.includes(q) ||
        hutangStr.includes(q) ||
        poinStr.includes(q)
      );
    });
    return list;
  }, [customerList, searchQuery]);

  const filteredProducts = useMemo(() => {
    let list = productList.filter((p) => {
      if (!p) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const nameStr = String(p.nama || p.Nama || "").toLowerCase();
      const idStr = String(p.id_barang || p.id || "").toLowerCase();
      const katStr = String(p.kategori || p.Kategori || "").toLowerCase();
      const satuanStr = String(p.satuan || p.Satuan || "").toLowerCase();
      const stokStr = String(p.stok ?? p.Stok ?? "");
      const modalStr = String(p.harga_modal ?? p.HargaModal ?? "");
      const jualStr = String(p.harga_jual ?? p.HargaJual ?? "");

      return (
        nameStr.includes(q) ||
        idStr.includes(q) ||
        katStr.includes(q) ||
        satuanStr.includes(q) ||
        stokStr.includes(q) ||
        modalStr.includes(q) ||
        jualStr.includes(q)
      );
    });
    return list;
  }, [productList, searchQuery]);

  // Paginated slices for progressive/light initial rendering across all categories
  const displayedSavings = useMemo(() => {
    return filteredSavings.slice(0, displayCount);
  }, [filteredSavings, displayCount]);

  const displayedDebts = useMemo(() => {
    return filteredDebts.slice(0, displayCount);
  }, [filteredDebts, displayCount]);

  const displayedInvestments = useMemo(() => {
    return filteredInvestments.slice(0, displayCount);
  }, [filteredInvestments, displayCount]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayCount);
  }, [filteredCustomers, displayCount]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  // Reset pagination count whenever category, search, or filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [activeCategory, searchQuery, filterJenis, filterMetode, filterTanggal, sortOrder]);

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-none shadow-xl flex items-center gap-3 border font-bold text-xs ${
              toastMsg.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
                : "bg-rose-600 text-white border-rose-500 shadow-rose-900/20"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner with Integrated Category Dropdown Title */}
      <div className="bg-gradient-to-r from-[#005E6A] via-[#00707e] to-[#004e58] rounded-none p-6 md:p-8 text-white shadow-xl shadow-[#005E6A]/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-teal-200">
              <Database className="w-3.5 h-3.5" />
              <span>Admin Database Management</span>
            </div>

            {/* Title with Integrated Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                Database
              </h1>
              <div className="relative inline-block">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as CategoryType)}
                  className="appearance-none bg-white/15 hover:bg-white/25 text-amber-300 font-black uppercase tracking-tight text-xl md:text-2xl pl-3 pr-9 py-1 border-2 border-amber-300/60 focus:outline-none focus:border-amber-300 cursor-pointer transition-all rounded-none shadow-md"
                >
                  <option value="penjualan" className="bg-slate-900 text-white">Penjualan ({salesTransactions.length})</option>
                  <option value="tabungan" className="bg-slate-900 text-white">Tabungan ({savingsList.length})</option>
                  <option value="investasi" className="bg-slate-900 text-white">Investasi ({investmentList.length})</option>
                  <option value="hutang" className="bg-slate-900 text-white">Hutang ({debtList.length})</option>
                  <option value="pelanggan" className="bg-slate-900 text-white">Pelanggan ({customerList.length})</option>
                  <option value="stok" className="bg-slate-900 text-white">Stok Barang ({productList.length})</option>
                </select>
                <ChevronDown className="w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-300 pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Category Description */}
            <p className="text-xs font-medium text-teal-100/80 max-w-xl">
              {activeCategory === "penjualan" && "Pusat kelola seluruh riwayat data transaksi penjualan warung. Cari, ubah, atau hapus transaksi secara terpusat dengan sinkronisasi otomatis ke Supabase."}
              {activeCategory === "tabungan" && "Pusat kelola data simpanan dan penarikan tabungan nasabah warung secara terpusat."}
              {activeCategory === "investasi" && "Pusat kelola dana investasi, tenor, dan nisbah bagi hasil investor warung."}
              {activeCategory === "hutang" && "Pusat kelola pencatatan kasbon hutang dan riwayat pelunasan cicilan pelanggan."}
              {activeCategory === "pelanggan" && "Pusat kelola seluruh database identitas, poin, level, dan saldo pelanggan warung."}
              {activeCategory === "stok" && "Pusat kelola katalog produk, sisa stok barang, harga modal, dan harga jual warung."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-none text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer text-white shadow-sm"
            >
              <Download className="w-4 h-4 text-teal-200" />
              <span>Export CSV ({activeCategory.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Ringkas Per Kategori */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-2xs">
        {activeCategory === "penjualan" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Transaksi</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredTransactions.length} <span className="text-xs font-semibold text-slate-500">Transaksi</span>
              </span>
            </div>
            <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 border border-teal-200/80 dark:border-teal-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 block">Total Pemasukan</span>
              <span className="text-base font-black text-[#005E6A] dark:text-teal-300 mt-1 block tabular-nums">
                Rp {filteredTransactions.reduce((acc, curr) => acc + (curr.Pemasukan || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Total Modal</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
                Rp {filteredTransactions.reduce((acc, curr) => acc + (curr.HargaModal || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Estimasi Keuntungan</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1 block tabular-nums">
                Rp {(
                  filteredTransactions.reduce((acc, curr) => acc + (curr.Pemasukan || 0), 0) -
                  filteredTransactions.reduce((acc, curr) => acc + (curr.HargaModal || 0), 0)
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </>
        )}

        {activeCategory === "tabungan" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Catatan</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredSavings.length} <span className="text-xs font-semibold text-slate-500">Record</span>
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Total Setoran</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1 block tabular-nums">
                Rp {filteredSavings.filter(s => s.tipe === "SETOR").reduce((acc, s) => acc + (s.nominal || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Total Penarikan</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
                Rp {filteredSavings.filter(s => s.tipe === "TARIK").reduce((acc, s) => acc + (s.nominal || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 border border-teal-200/80 dark:border-teal-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 block">Total Saldo Netto</span>
              <span className="text-base font-black text-[#005E6A] dark:text-teal-300 mt-1 block tabular-nums">
                Rp {(
                  filteredSavings.filter(s => s.tipe === "SETOR").reduce((acc, s) => acc + (s.nominal || 0), 0) -
                  filteredSavings.filter(s => s.tipe === "TARIK").reduce((acc, s) => acc + (s.nominal || 0), 0)
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </>
        )}

        {activeCategory === "hutang" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Catatan</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredDebts.length} <span className="text-xs font-semibold text-slate-500">Record</span>
              </span>
            </div>
            <div className="bg-rose-50/70 dark:bg-rose-950/40 p-3 border border-rose-200/80 dark:border-rose-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 block">Total Kasbon Baru</span>
              <span className="text-base font-black text-rose-700 dark:text-rose-300 mt-1 block tabular-nums">
                Rp {filteredDebts.filter(d => d.tipe === "KASBON").reduce((acc, d) => acc + (d.jumlah || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Total Pelunasan</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1 block tabular-nums">
                Rp {filteredDebts.filter(d => d.tipe !== "KASBON").reduce((acc, d) => acc + (d.jumlah || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Sisa Saldo Piutang</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
                Rp {(
                  filteredDebts.filter(d => d.tipe === "KASBON").reduce((acc, d) => acc + (d.jumlah || 0), 0) -
                  filteredDebts.filter(d => d.tipe !== "KASBON").reduce((acc, d) => acc + (d.jumlah || 0), 0)
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </>
        )}

        {activeCategory === "investasi" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Investor</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredInvestments.length} <span className="text-xs font-semibold text-slate-500">Record</span>
              </span>
            </div>
            <div className="bg-[#005E6A]/10 p-3 border border-[#005E6A]/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 block">Total Modal Investasi</span>
              <span className="text-base font-black text-[#005E6A] dark:text-teal-300 mt-1 block tabular-nums">
                Rp {filteredInvestments.reduce((acc, i) => acc + (i.nominal || 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 border border-indigo-200/80 dark:border-indigo-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">Investasi Berjalan</span>
              <span className="text-base font-black text-indigo-700 dark:text-indigo-300 mt-1 block">
                {filteredInvestments.filter(i => (i.status || "BERJALAN").toUpperCase() === "BERJALAN" || (i.status || "").toUpperCase() === "AKTIF").length} <span className="text-xs font-semibold">Aktif</span>
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Investasi Selesai</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                {filteredInvestments.filter(i => (i.status || "").toUpperCase() === "SELESAI").length} <span className="text-xs font-semibold">Selesai</span>
              </span>
            </div>
          </>
        )}

        {activeCategory === "pelanggan" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Pelanggan</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredCustomers.length} <span className="text-xs font-semibold text-slate-500">Orang</span>
              </span>
            </div>
            <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 border border-teal-200/80 dark:border-teal-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 block">Total Tabungan</span>
              <span className="text-base font-black text-[#005E6A] dark:text-teal-300 mt-1 block tabular-nums">
                Rp {filteredCustomers.reduce((acc, c) => acc + (c.tabungan ?? c.Tabungan ?? 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-rose-50/70 dark:bg-rose-950/40 p-3 border border-rose-200/80 dark:border-rose-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 block">Total Hutang</span>
              <span className="text-base font-black text-rose-700 dark:text-rose-300 mt-1 block tabular-nums">
                Rp {filteredCustomers.reduce((acc, c) => acc + (c.hutang ?? c.Hutang ?? 0), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Total Poin Terkumpul</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
                {filteredCustomers.reduce((acc, c) => acc + (c.point ?? c.poin ?? c.Poin ?? 0), 0).toLocaleString("id-ID")} Poin
              </span>
            </div>
          </>
        )}

        {activeCategory === "stok" && (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Produk</span>
              <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                {filteredProducts.length} <span className="text-xs font-semibold text-slate-500">Item</span>
              </span>
            </div>
            <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 border border-teal-200/80 dark:border-teal-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 block">Total Fisik Stok</span>
              <span className="text-base font-black text-[#005E6A] dark:text-teal-300 mt-1 block tabular-nums">
                {filteredProducts.reduce((acc, p) => acc + (p.stok ?? p.Stok ?? 0), 0).toLocaleString("id-ID")} Pcs
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Total Asset Modal</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
                Rp {filteredProducts.reduce((acc, p) => acc + ((p.stok ?? p.Stok ?? 0) * (p.harga_modal ?? p.HargaModal ?? 0)), 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Total Omset Potensial</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1 block tabular-nums">
                Rp {filteredProducts.reduce((acc, p) => acc + ((p.stok ?? p.Stok ?? 0) * (p.harga_jual ?? p.HargaJual ?? 0)), 0).toLocaleString("id-ID")}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Daily Server Pagination Bar for Penjualan */}
      {activeCategory === "penjualan" && (
        <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 text-xs">
          {/* Simple Navigation: Hari Sebelumnya | Active Date Selector | Hari Selanjutnya */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
            <button
              onClick={() => {
                let curIdx = availableSalesDates.indexOf(filterTanggal);
                if (curIdx === -1) {
                  setFilterTanggal(availableSalesDates[0] || "hari_ini");
                } else if (curIdx < availableSalesDates.length - 1) {
                  setFilterTanggal(availableSalesDates[curIdx + 1]);
                }
              }}
              disabled={
                availableSalesDates.length === 0 ||
                (filterTanggal !== "hari_ini" &&
                  filterTanggal !== "semua" &&
                  availableSalesDates.indexOf(filterTanggal) >= availableSalesDates.length - 1)
              }
              className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-[#005E6A] dark:text-teal-400" />
              <span>Hari Sebelumnya</span>
            </button>

            {/* Active Date Selector / Display */}
            <div className="relative shrink-0">
              <select
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs font-black uppercase text-[#005E6A] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 rounded-none focus:outline-none cursor-pointer appearance-none"
              >
                <option value="hari_ini">Hari Ini</option>
                <option value="semua">Semua Hari</option>
                <option value="bulan_ini">Bulan Ini</option>
                {availableSalesDates.map((d) => (
                  <option key={`opt_date_${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#005E6A] dark:text-teal-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                let curIdx = availableSalesDates.indexOf(filterTanggal);
                if (curIdx > 0) {
                  setFilterTanggal(availableSalesDates[curIdx - 1]);
                } else {
                  setFilterTanggal("hari_ini");
                }
              }}
              disabled={
                filterTanggal === "hari_ini" ||
                availableSalesDates.length === 0 ||
                (filterTanggal !== "semua" && availableSalesDates.indexOf(filterTanggal) <= 0)
              }
              className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
            >
              <span>Hari Selanjutnya</span>
              <ChevronRight className="w-4 h-4 text-[#005E6A] dark:text-teal-400" />
            </button>
          </div>

          {/* Day Total Summary */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-black uppercase text-[#005E6A] dark:text-teal-300 shrink-0">
            <span className="bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 border border-teal-200 dark:border-teal-800">
              {filteredTransactions.length} Transaksi
            </span>
            <span className="bg-[#005E6A] text-white px-2.5 py-1">
              Rp {filteredTransactions.reduce((acc, curr) => acc + (curr.Pemasukan || 0), 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}

      {/* Search Toolbar & Add Buttons - Positioned Directly Above Table Columns */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-none border border-t-0 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Powerful Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeCategory === "penjualan" ? "Cari nama, jenis, melalui, status, id transaksi..." :
                activeCategory === "tabungan" ? "Cari nama nasabah, tipe, id, keterangan..." :
                activeCategory === "hutang" ? "Cari nama pelanggan, tipe, id, keterangan..." :
                activeCategory === "investasi" ? "Cari nama investor, tenor, status, nisbah..." :
                activeCategory === "pelanggan" ? "Cari nama, id pelanggan, telepon, alamat, level..." :
                "Cari nama barang, id barang, kategori, satuan, harga..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-semibold focus:outline-none focus:border-[#005E6A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Add Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeCategory === "penjualan" && (
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2.5 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider rounded-none shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Virtual</span>
              </button>
            )}
            {activeCategory === "tabungan" && (
              <button
                onClick={handleOpenAddSaving}
                className="px-3.5 py-2.5 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider rounded-none shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tabungan</span>
              </button>
            )}
            {activeCategory === "hutang" && (
              <button
                onClick={handleOpenAddDebt}
                className="px-3.5 py-2.5 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider rounded-none shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hutang</span>
              </button>
            )}
            {activeCategory === "investasi" && (
              <button
                onClick={handleOpenAddInvestment}
                className="px-3.5 py-2.5 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider rounded-none shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Investasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table View (No Container Box, Frameless Layout) */}
      <div ref={tableContainerRef} className="overflow-x-auto custom-scrollbar">
        {/* 1. TABLE PENJUALAN */}
        {activeCategory === "penjualan" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Nama
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Jenis
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Melalui
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Pemasukan
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data transaksi yang sesuai dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((t, idx) => {
                  const txId = t.id_transaksi || t.id;
                  const statusUpper = (t.Status || "").toUpperCase();
                  const isSuccess = statusUpper === "SELESAI" || statusUpper === "SUKSES";
                  const isProses = statusUpper === "DI PROSES" || statusUpper === "DIPROSES" || statusUpper === "PROSES";
                  const isBelum = statusUpper === "BELUM DIAMBIL" || statusUpper === "BELUM";

                  return (
                    <tr
                      key={`db_trx_row_${t.id || txId}_${idx}`}
                      onClick={() => setDetailTx(t)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      {/* 1. Nama */}
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <span>{t.Nama || "Pelanggan Umum"}</span>
                      </td>

                      {/* 2. Jenis */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider ${
                          (t.Jenis || "").toLowerCase().includes("fisik") || (t.Jenis || "").toLowerCase().includes("belanja")
                            ? "bg-teal-50 text-[#005E6A] dark:bg-teal-300 border border-teal-200 dark:border-teal-800"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        }`}>
                          {t.Jenis || "Belanja"}
                        </span>
                      </td>

                      {/* 3. Melalui */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t.Melalui || "-"}
                        </span>
                      </td>

                      {/* 4. Pemasukan */}
                      <td className="py-3 px-4 text-right font-black tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                        Rp {(t.Pemasukan || 0).toLocaleString("id-ID")}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase ${
                          isSuccess
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isProses
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : isBelum
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {isSuccess && <Check className="w-3 h-3" />}
                          {t.Status || "SELESAI"}
                        </span>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailTx(t); }}
                            title="Lihat Detail Transaksi"
                            className="p-1.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-none bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-300 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDelete(t); }}
                            title="Hapus Transaksi"
                            className="p-1.5 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* 2. TABLE TABUNGAN */}
        {activeCategory === "tabungan" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Nama Nasabah
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Tipe
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Nominal
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Saldo Akhir
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredSavings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data tabungan yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  let lastDate = "";
                  return displayedSavings.map((s, idx) => {
                    const currentDate = s.tanggal || "Tanpa Tanggal";
                    const isNewDateGroup = currentDate !== lastDate;
                    if (isNewDateGroup) lastDate = currentDate;

                    return (
                      <React.Fragment key={`sav_frag_${s.id}_${idx}`}>
                        {isNewDateGroup && (
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y border-slate-200 dark:border-slate-700 font-bold sticky top-[41px] z-10 backdrop-blur-xs">
                            <td colSpan={5} className="py-2 px-4 text-xs font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#005E6A] dark:text-teal-400" />
                                <span>Tanggal: {currentDate}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr
                          onClick={() => setDetailSaving(s)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {s.nama_nasabah || s.nama || (s as any).Nama || "-"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-none text-[10px] font-black uppercase ${
                              s.tipe === "SETOR" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}>
                              {s.tipe || "SETOR"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                            Rp {(s.nominal || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-[#005E6A] dark:text-teal-300 whitespace-nowrap">
                            Rp {(s.saldo_akhir || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailSaving(s); }}
                                title="Lihat Detail Tabungan"
                                className="p-1.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditSaving(s); }}
                                title="Edit Tabungan"
                                className="p-1.5 rounded-none bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-300 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenDeleteSaving(s); }}
                                title="Hapus Tabungan"
                                className="p-1.5 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        )}

        {/* 3. TABLE HUTANG */}
        {activeCategory === "hutang" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Nama
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Tipe
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Jumlah
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Saldo Akhir
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data hutang / kasbon yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  let lastDate = "";
                  return displayedDebts.map((d, idx) => {
                    const currentDate = d.tanggal || "Tanpa Tanggal";
                    const isNewDateGroup = currentDate !== lastDate;
                    if (isNewDateGroup) lastDate = currentDate;

                    return (
                      <React.Fragment key={`debt_frag_${d.id}_${idx}`}>
                        {isNewDateGroup && (
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y border-slate-200 dark:border-slate-700 font-bold sticky top-[41px] z-10 backdrop-blur-xs">
                            <td colSpan={5} className="py-2 px-4 text-xs font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#005E6A] dark:text-teal-400" />
                                <span>Tanggal: {currentDate}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr
                          onClick={() => setDetailDebt(d)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {d.nama_pelanggan || d.nama || (d as any).Nama || "-"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-none text-[10px] font-black uppercase ${
                              d.tipe === "KASBON" ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            }`}>
                              {d.tipe || "KASBON"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                            Rp {(d.jumlah || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            Rp {(d.saldo_akhir || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailDebt(d); }}
                                title="Lihat Detail Hutang"
                                className="p-1.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditDebt(d); }}
                                title="Edit Hutang"
                                className="p-1.5 rounded-none bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-300 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenDeleteDebt(d); }}
                                title="Hapus Hutang"
                                className="p-1.5 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        )}

        {/* 4. TABLE INVESTASI */}
        {activeCategory === "investasi" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Nama Investor
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Tenor & Nisbah
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Nominal
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data investasi yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  let lastDate = "";
                  return displayedInvestments.map((inv, idx) => {
                    const currentDate = inv.tanggal || "Tanpa Tanggal";
                    const isNewDateGroup = currentDate !== lastDate;
                    if (isNewDateGroup) lastDate = currentDate;

                    return (
                      <React.Fragment key={`inv_frag_${inv.id}_${idx}`}>
                        {isNewDateGroup && (
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y border-slate-200 dark:border-slate-700 font-bold sticky top-[41px] z-10 backdrop-blur-xs">
                            <td colSpan={5} className="py-2 px-4 text-xs font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-300 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#005E6A] dark:text-teal-400" />
                                <span>Tanggal: {currentDate}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr
                          onClick={() => setDetailInvestment(inv)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {inv.nama_investor || inv.nama || (inv as any).Nama || "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            <span>{inv.tenor || (inv.tenor_bulan ? `${inv.tenor_bulan} Bln` : "-")}</span>
                            {inv.nisbah || inv.nisbah_persen ? <span className="text-teal-600 font-bold ml-2">({inv.nisbah || `${inv.nisbah_persen}%`})</span> : null}
                          </td>
                          <td className="py-3 px-4 text-right font-black tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                            Rp {(inv.nominal || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase ${
                              inv.status === "BERJALAN" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}>
                              {inv.status || "BERJALAN"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailInvestment(inv); }}
                                title="Lihat Detail Investasi"
                                className="p-1.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditInvestment(inv); }}
                                title="Edit Investasi"
                                className="p-1.5 rounded-none bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-300 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenDeleteInvestment(inv); }}
                                title="Hapus Investasi"
                                className="p-1.5 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        )}

        {/* 5. TABLE PELANGGAN */}
        {activeCategory === "pelanggan" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Nama
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Kontak & Alamat
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Saldo Tabungan
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Saldo Hutang
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Poin & Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data pelanggan yang sesuai dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                displayedCustomers.map((c, idx) => {
                  const custName = c.nama || c.Nama || "Pelanggan";
                  const custId = c.id_pelanggan || c.id || "-";
                  const phone = c.telepon || c.Telepon || c.hp || c.HP || c.no_hp || c.NoHP || "-";
                  const address = c.alamat || c.Alamat || "-";
                  const savings = Number(c.tabungan ?? c.Tabungan ?? 0);
                  const debt = Number(c.hutang ?? c.Hutang ?? 0);
                  const points = Number(c.point ?? c.poin ?? c.Poin ?? 0);
                  const level = c.level || c.Level || "BRONZE";

                  return (
                    <tr
                      key={`cust_row_${custId}_${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white">{custName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{custId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div>{phone}</div>
                        <div className="text-[10px] text-slate-400 max-w-xs truncate">{address}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black tabular-nums text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        Rp {savings.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-black tabular-nums text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        Rp {debt.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase">
                          <span>{points} Poin</span>
                          <span className="text-slate-300">•</span>
                          <span>{level}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* 6. TABLE STOK BARANG */}
        {activeCategory === "stok" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  ID & Nama Produk
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Kategori
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                  Sisa Stok
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Harga Modal
                </th>
                <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                  Harga Jual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data stok produk yang sesuai dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p, idx) => {
                  const prodName = p.nama || p.Nama || "-";
                  const prodId = p.id_barang || p.id || "-";
                  const prodCategory = p.kategori || p.Kategori || "Umum";
                  const prodStok = Number(p.stok ?? p.Stok ?? 0);
                  const prodSatuan = p.satuan || p.Satuan || "pcs";
                  const prodModal = Number(p.harga_modal ?? p.HargaModal ?? 0);
                  const prodJual = Number(p.harga_jual ?? p.HargaJual ?? 0);

                  return (
                    <tr
                      key={`prod_row_${prodId}_${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white">{prodName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{prodId}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {prodCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase ${
                          prodStok <= 5 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-teal-50 text-[#005E6A] border border-teal-200"
                        }`}>
                          {prodStok} {prodSatuan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Rp {prodModal.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-black tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Rp {prodJual.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Tombol Muat Lebih Banyak / Progressive Chunk Loading */}
      {(() => {
        let currentTotal = 0;
        let currentDisplayed = 0;
        if (activeCategory === "penjualan") {
          currentTotal = filteredTransactions.length;
          currentDisplayed = displayedTransactions.length;
        } else if (activeCategory === "tabungan") {
          currentTotal = filteredSavings.length;
          currentDisplayed = displayedSavings.length;
        } else if (activeCategory === "hutang") {
          currentTotal = filteredDebts.length;
          currentDisplayed = displayedDebts.length;
        } else if (activeCategory === "investasi") {
          currentTotal = filteredInvestments.length;
          currentDisplayed = displayedInvestments.length;
        } else if (activeCategory === "pelanggan") {
          currentTotal = filteredCustomers.length;
          currentDisplayed = displayedCustomers.length;
        } else if (activeCategory === "stok") {
          currentTotal = filteredProducts.length;
          currentDisplayed = displayedProducts.length;
        }

        if (currentDisplayed < currentTotal) {
          return (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 20)}
                className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#005E6A] dark:text-teal-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <ChevronDown className="w-4 h-4 text-[#F15A24]" />
                <span>Tampilkan 20 Data Lagi (Tersisa {currentTotal - currentDisplayed} Data)</span>
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Edit Transaction Modal - Complete Fields & Status Dropdown */}
      <AnimatePresence>
        {editingTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTx(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-none shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-black">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Edit Data Penjualan
                    </h3>
                    <p className="text-[10px] font-mono text-[#005E6A] dark:text-teal-400 font-bold">
                      {editFormData.id_transaksi}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTx(null)}
                  className="p-2 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form Body */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* ID Transaksi & Tanggal (Calendar Popup) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      ID Transaksi
                    </label>
                    <input
                      type="text"
                      value={editFormData.id_transaksi || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, id_transaksi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-semibold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Tanggal (Kalender)
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(editFormData.Tanggal)}
                      onChange={(e) => setEditFormData({ ...editFormData, Tanggal: formatInputToDate(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    />
                  </div>
                </div>

                {/* ID Pelanggan & Nama Pelanggan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      ID Pelanggan (Otomatis)
                    </label>
                    <input
                      type="text"
                      value={editFormData.id_pelanggan || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, id_pelanggan: e.target.value })}
                      placeholder="e.g. CUST-0001"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-semibold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Nama Pelanggan
                    </label>
                    <select
                      value={editFormData.Nama || "Pelanggan Umum"}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const selectedCust = customers.find(c => (c.Nama || c.nama || "") === selectedName);
                        const newIdPelanggan = selectedCust ? (selectedCust.id_pelanggan || selectedCust.id || "") : "";
                        const newTxId = calculateAutoTxId(newIdPelanggan, selectedName, salesTransactions);
                        setEditFormData(prev => ({
                          ...prev,
                          Nama: selectedName,
                          id_pelanggan: newIdPelanggan,
                          id_transaksi: newTxId,
                          id_penjualan: newTxId
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      <option value="Pelanggan Umum">Pelanggan Umum</option>
                      {customers.map((c, idx) => {
                        const custName = c.Nama || c.nama || `Pelanggan ${idx + 1}`;
                        const custId = c.id_pelanggan || c.id || "";
                        return (
                          <option key={custId || `cust_opt_${idx}`} value={custName}>
                            {custName}
                          </option>
                        );
                      })}
                      {editFormData.Nama && !customers.some(c => (c.Nama || c.nama || "") === editFormData.Nama) && editFormData.Nama !== "Pelanggan Umum" && (
                        <option value={editFormData.Nama}>{editFormData.Nama}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Jenis (Dropdown) & Melalui (Dropdown) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Jenis Transaksi
                    </label>
                    <select
                      value={editFormData.Jenis || "TRANSFER"}
                      onChange={(e) => setEditFormData({ ...editFormData, Jenis: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {JENIS_OPTIONS.map((opt) => (
                        <option key={`edit_jenis_${opt}`} value={opt}>
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
                      value={editFormData.Melalui || "EDC BNI"}
                      onChange={(e) => setEditFormData({ ...editFormData, Melalui: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {MELALUI_OPTIONS.map((opt) => (
                        <option key={`edit_melalui_${opt}`} value={opt}>
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
                      value={editFormData.Metode || "TUNAI"}
                      onChange={(e) => setEditFormData({ ...editFormData, Metode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-semibold focus:outline-none focus:border-[#005E6A]"
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
                      value={editFormData.Status || "SELESAI"}
                      onChange={(e) => setEditFormData({ ...editFormData, Status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A] text-slate-800 dark:text-white cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={`edit_st_${st}`} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pemasukan & Harga Modal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Pemasukan (Rp)
                    </label>
                    <input
                      type="number"
                      value={editFormData.Pemasukan || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, Pemasukan: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Harga Modal (Rp)
                    </label>
                    <input
                      type="number"
                      value={editFormData.HargaModal || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, HargaModal: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
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
                      type="number"
                      value={editFormData.Sebagian || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, Sebagian: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Poin Reward
                    </label>
                    <input
                      type="number"
                      value={editFormData.Poin || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, Poin: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2.5 rounded-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-none bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Data Penjualan Virtual */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-none shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Tambah Penjualan Virtual
                    </h3>
                    <p className="text-[10px] font-mono text-[#005E6A] dark:text-teal-400 font-bold">
                      Otomatis: {addFormData.id_transaksi}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Form Body */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Tanggal (Kalender)
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(addFormData.Tanggal)}
                      onChange={(e) => setAddFormData({ ...addFormData, Tanggal: formatInputToDate(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    />
                  </div>
                </div>

                {/* ID Pelanggan & Nama Pelanggan (Dropdown) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      ID Pelanggan (Otomatis)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={addFormData.id_pelanggan || "CUST-0000"}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Nama Pelanggan *
                    </label>
                    <select
                      value={addFormData.Nama || "Pelanggan Umum"}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        let selectedId = "CUST-0000";
                        if (selectedName !== "Pelanggan Umum") {
                          const found = customerList.find(c => (c.nama || c.Nama) === selectedName);
                          if (found) {
                            selectedId = found.id_pelanggan || found.id || "CUST-0000";
                          }
                        }
                        const newTxId = calculateAutoTxId(selectedId, selectedName, salesTransactions);
                        setAddFormData((prev) => ({
                          ...prev,
                          Nama: selectedName,
                          id_pelanggan: selectedId,
                          id_transaksi: newTxId
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      <option value="Pelanggan Umum">Pelanggan Umum</option>
                      {customerList
                        .filter((c) => (c.nama || c.Nama) && (c.nama || c.Nama) !== "Pelanggan Umum")
                        .map((c, idx) => {
                          const cName = c.nama || c.Nama;
                          const cId = c.id_pelanggan || c.id || `CUST-${String(idx + 1).padStart(4, "0")}`;
                          return (
                            <option key={`cust_opt_${cId}_${idx}`} value={cName}>
                              {cName}
                            </option>
                          );
                        })}
                    </select>
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {JENIS_OPTIONS.map((opt) => (
                        <option key={`add_jenis_${opt}`} value={opt}>
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
                      value={addFormData.Melalui || "DANA"}
                      onChange={(e) => setAddFormData({ ...addFormData, Melalui: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] cursor-pointer"
                    >
                      {MELALUI_OPTIONS.map((opt) => (
                        <option key={`add_melalui_${opt}`} value={opt}>
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-semibold focus:outline-none focus:border-[#005E6A]"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A] text-slate-800 dark:text-white cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={`add_st_${st}`} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pemasukan & Harga Modal (Otomatis Dikurangi Admin Warung Tomi di Belakang Layar) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Nominal Jual (Rp) *
                    </label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={addFormData.Pemasukan || ""}
                      onChange={(e) => handlePemasukanChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Harga Modal (Otomatis)
                    </label>
                    <input
                      type="number"
                      placeholder="95000"
                      value={addFormData.HargaModal || ""}
                      onChange={(e) => handleHargaModalChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-none text-xs font-black text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A]"
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
                      type="number"
                      placeholder="0"
                      value={addFormData.Sebagian || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, Sebagian: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:border-[#005E6A]"
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
                      className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-none text-xs font-black text-amber-800 dark:text-amber-300 focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdd}
                  disabled={isAdding}
                  className="px-5 py-2.5 rounded-none bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Ke Database</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingTx(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-none bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Konfirmasi Hapus Transaksi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Apakah Anda yakin ingin menghapus transaksi <strong className="text-slate-800 dark:text-slate-200 font-mono">{deletingTx.id_transaksi || deletingTx.id}</strong> atas nama <strong className="text-slate-800 dark:text-slate-200">{deletingTx.Nama}</strong>?
                </p>
                <p className="text-[10px] text-rose-500 font-bold mt-2">
                  Tindakan ini tidak dapat dibatalkan dan akan menghapus data dari Supabase.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingTx(null)}
                  className="px-5 py-2.5 rounded-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Ya, Hapus Data</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL PENJUALAN MODAL */}
      <AnimatePresence>
        {detailTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailTx(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-none bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-black">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Detail Transaksi Penjualan
                    </h3>
                    <p className="text-[10px] font-mono text-[#005E6A] dark:text-teal-400 font-bold">
                      {detailTx.id_transaksi || detailTx.id}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDetailTx(null)} className="p-1.5 rounded-none text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-none border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Tanggal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailTx.Tanggal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Status</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{detailTx.Status || "SELESAI"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-none border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Nama Pelanggan</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailTx.Nama || "Pelanggan Umum"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">ID Pelanggan</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{detailTx.id_pelanggan || "CUST-0000"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-none border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Jenis</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailTx.Jenis}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Melalui / Channel</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailTx.Melalui || "-"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-none border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Pemasukan</span>
                    <span className="font-black text-teal-700 dark:text-teal-300">Rp {(detailTx.Pemasukan || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Modal</span>
                    <span className="font-bold text-slate-600 dark:text-slate-400">Rp {(detailTx.HargaModal || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Metode</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{detailTx.Metode || "TUNAI"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setDetailTx(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-none text-xs font-bold uppercase cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL TABUNGAN MODAL */}
      <AnimatePresence>
        {detailSaving && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailSaving(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Detail Tabungan</h3>
                <button onClick={() => setDetailSaving(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <p><strong>ID:</strong> <span className="font-mono">{detailSaving.id}</span></p>
                <p><strong>Tanggal:</strong> {detailSaving.tanggal}</p>
                <p><strong>Nama Nasabah:</strong> {detailSaving.nama_nasabah || detailSaving.nama || (detailSaving as any).Nama || "-"}</p>
                <p><strong>Tipe:</strong> <span className="font-bold text-teal-600">{detailSaving.tipe}</span></p>
                <p><strong>Nominal:</strong> Rp {(detailSaving.nominal || 0).toLocaleString("id-ID")}</p>
                <p><strong>Saldo Akhir:</strong> Rp {(detailSaving.saldo_akhir || 0).toLocaleString("id-ID")}</p>
                {(detailSaving.keterangan || detailSaving.berita) && <p><strong>Keterangan:</strong> {detailSaving.keterangan || detailSaving.berita}</p>}
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setDetailSaving(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-none">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT / DELETE TABUNGAN MODALS */}
      <AnimatePresence>
        {isAddSavingOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddSavingOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Tambah Data Tabungan</h3>
                <button onClick={() => setIsAddSavingOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tanggal</label>
                  <input type="date" value={addSavingForm.tanggal || ""} onChange={(e) => setAddSavingForm({ ...addSavingForm, tanggal: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Nasabah *</label>
                  <input type="text" placeholder="Masukkan nama nasabah" value={addSavingForm.nama_nasabah || ""} onChange={(e) => setAddSavingForm({ ...addSavingForm, nama_nasabah: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipe</label>
                    <select value={addSavingForm.tipe || "SETOR"} onChange={(e) => setAddSavingForm({ ...addSavingForm, tipe: e.target.value as "SETOR" | "TARIK" })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs">
                      <option value="SETOR">SETOR</option>
                      <option value="TARIK">TARIK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="number" value={addSavingForm.nominal || 0} onChange={(e) => setAddSavingForm({ ...addSavingForm, nominal: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Saldo Akhir (Rp)</label>
                  <input type="number" value={addSavingForm.saldo_akhir || 0} onChange={(e) => setAddSavingForm({ ...addSavingForm, saldo_akhir: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setIsAddSavingOpen(false)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveAddSaving} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingSaving && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingSaving(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Edit Tabungan</h3>
                <button onClick={() => setEditingSaving(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Nasabah</label>
                  <input type="text" value={editSavingForm.nama_nasabah || ""} onChange={(e) => setEditSavingForm({ ...editSavingForm, nama_nasabah: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="number" value={editSavingForm.nominal || 0} onChange={(e) => setEditSavingForm({ ...editSavingForm, nominal: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Saldo Akhir (Rp)</label>
                    <input type="number" value={editSavingForm.saldo_akhir || 0} onChange={(e) => setEditSavingForm({ ...editSavingForm, saldo_akhir: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setEditingSaving(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveEditSaving} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingSaving && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingSaving(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Hapus Data Tabungan?</h3>
              <p className="text-xs text-slate-500">Hapus data tabungan atas nama <strong>{deletingSaving.nama_nasabah || deletingSaving.nama || (deletingSaving as any).Nama}</strong>?</p>
              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => setDeletingSaving(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleConfirmDeleteSaving} className="px-5 py-2 bg-rose-600 text-white text-xs font-black uppercase rounded-none">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL / ADD / EDIT / DELETE HUTANG MODALS */}
      <AnimatePresence>
        {detailDebt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailDebt(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Detail Hutang / Kasbon</h3>
                <button onClick={() => setDetailDebt(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <p><strong>ID:</strong> <span className="font-mono">{detailDebt.id}</span></p>
                <p><strong>Tanggal:</strong> {detailDebt.tanggal}</p>
                <p><strong>Nama Pelanggan:</strong> {detailDebt.nama_pelanggan || detailDebt.nama || (detailDebt as any).Nama || "-"}</p>
                <p><strong>Tipe:</strong> <span className="font-bold text-rose-600">{detailDebt.tipe}</span></p>
                <p><strong>Jumlah:</strong> Rp {(detailDebt.jumlah || 0).toLocaleString("id-ID")}</p>
                <p><strong>Saldo Akhir:</strong> Rp {(detailDebt.saldo_akhir || 0).toLocaleString("id-ID")}</p>
                {detailDebt.keterangan && <p><strong>Keterangan:</strong> {detailDebt.keterangan}</p>}
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setDetailDebt(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-none">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddDebtOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddDebtOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Tambah Data Hutang</h3>
                <button onClick={() => setIsAddDebtOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tanggal</label>
                  <input type="date" value={addDebtForm.tanggal || ""} onChange={(e) => setAddDebtForm({ ...addDebtForm, tanggal: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Pelanggan *</label>
                  <input type="text" placeholder="Masukkan nama pelanggan" value={addDebtForm.nama_pelanggan || ""} onChange={(e) => setAddDebtForm({ ...addDebtForm, nama_pelanggan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipe</label>
                    <select value={addDebtForm.tipe || "KASBON"} onChange={(e) => setAddDebtForm({ ...addDebtForm, tipe: e.target.value as "KASBON" | "BAYAR" })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs">
                      <option value="KASBON">KASBON</option>
                      <option value="BAYAR">BAYAR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Jumlah (Rp)</label>
                    <input type="number" value={addDebtForm.jumlah || 0} onChange={(e) => setAddDebtForm({ ...addDebtForm, jumlah: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Saldo Akhir (Rp)</label>
                  <input type="number" value={addDebtForm.saldo_akhir || 0} onChange={(e) => setAddDebtForm({ ...addDebtForm, saldo_akhir: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setIsAddDebtOpen(false)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveAddDebt} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDebt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingDebt(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Edit Hutang</h3>
                <button onClick={() => setEditingDebt(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Pelanggan</label>
                  <input type="text" value={editDebtForm.nama_pelanggan || ""} onChange={(e) => setEditDebtForm({ ...editDebtForm, nama_pelanggan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Jumlah (Rp)</label>
                    <input type="number" value={editDebtForm.jumlah || 0} onChange={(e) => setEditDebtForm({ ...editDebtForm, jumlah: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Saldo Akhir (Rp)</label>
                    <input type="number" value={editDebtForm.saldo_akhir || 0} onChange={(e) => setEditDebtForm({ ...editDebtForm, saldo_akhir: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setEditingDebt(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveEditDebt} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingDebt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingDebt(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Hapus Data Hutang?</h3>
              <p className="text-xs text-slate-500">Hapus data hutang atas nama <strong>{deletingDebt.nama_pelanggan || deletingDebt.nama || (deletingDebt as any).Nama}</strong>?</p>
              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => setDeletingDebt(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleConfirmDeleteDebt} className="px-5 py-2 bg-rose-600 text-white text-xs font-black uppercase rounded-none">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL / ADD / EDIT / DELETE INVESTASI MODALS */}
      <AnimatePresence>
        {detailInvestment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailInvestment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Detail Investasi</h3>
                <button onClick={() => setDetailInvestment(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <p><strong>ID:</strong> <span className="font-mono">{detailInvestment.id}</span></p>
                <p><strong>Tanggal:</strong> {detailInvestment.tanggal}</p>
                <p><strong>Nama Investor:</strong> {detailInvestment.nama_investor || detailInvestment.nama || (detailInvestment as any).Nama || "-"}</p>
                <p><strong>Nominal:</strong> Rp {(detailInvestment.nominal || 0).toLocaleString("id-ID")}</p>
                <p><strong>Tenor:</strong> {detailInvestment.tenor || (detailInvestment.tenor_bulan ? `${detailInvestment.tenor_bulan} Bulan` : "-")}</p>
                <p><strong>Nisbah:</strong> {detailInvestment.nisbah || (detailInvestment.nisbah_persen ? `${detailInvestment.nisbah_persen}%` : "-")}</p>
                <p><strong>Status:</strong> <span className="font-bold text-indigo-600">{detailInvestment.status}</span></p>
                {detailInvestment.keterangan && <p><strong>Keterangan:</strong> {detailInvestment.keterangan}</p>}
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setDetailInvestment(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-none">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddInvestmentOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddInvestmentOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Tambah Data Investasi</h3>
                <button onClick={() => setIsAddInvestmentOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tanggal</label>
                  <input type="date" value={addInvestmentForm.tanggal || ""} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, tanggal: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Investor *</label>
                  <input type="text" placeholder="Masukkan nama investor" value={addInvestmentForm.nama_investor || ""} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, nama_investor: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="number" value={addInvestmentForm.nominal || 0} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, nominal: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tenor (Bulan)</label>
                    <input type="number" value={addInvestmentForm.tenor_bulan || 12} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, tenor_bulan: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nisbah (%)</label>
                    <input type="number" value={addInvestmentForm.nisbah_persen || 10} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, nisbah_persen: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Status</label>
                    <select value={addInvestmentForm.status || "BERJALAN"} onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, status: e.target.value as "BERJALAN" | "SELESAI" })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs">
                      <option value="BERJALAN">BERJALAN</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setIsAddInvestmentOpen(false)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveAddInvestment} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingInvestment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingInvestment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Edit Investasi</h3>
                <button onClick={() => setEditingInvestment(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Investor</label>
                  <input type="text" value={editInvestmentForm.nama_investor || ""} onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, nama_investor: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="number" value={editInvestmentForm.nominal || 0} onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, nominal: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Status</label>
                    <select value={editInvestmentForm.status || "BERJALAN"} onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, status: e.target.value as "BERJALAN" | "SELESAI" })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-none text-xs">
                      <option value="BERJALAN">BERJALAN</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setEditingInvestment(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleSaveEditInvestment} className="px-5 py-2 bg-[#005E6A] text-white text-xs font-black uppercase rounded-none">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingInvestment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingInvestment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-none p-6 space-y-4 border border-slate-100 dark:border-slate-800 z-10 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Hapus Data Investasi?</h3>
              <p className="text-xs text-slate-500">Hapus data investasi atas nama <strong>{deletingInvestment.nama_investor || deletingInvestment.nama || (deletingInvestment as any).Nama}</strong>?</p>
              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => setDeletingInvestment(null)} className="px-4 py-2 border text-xs font-bold rounded-none">Batal</button>
                <button onClick={handleConfirmDeleteInvestment} className="px-5 py-2 bg-rose-600 text-white text-xs font-black uppercase rounded-none">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
