import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  BarChart3,
  Activity,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileCode,
  HardDrive,
  Radio,
  Cpu,
  Zap,
  Globe,
  Users,
  ShoppingCart,
  Package,
  PiggyBank,
  CreditCard,
  Gift,
  TrendingUp,
  Wallet,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  Plus,
  Save,
  Info,
  Eye,
  EyeOff,
  MoveLeft,
  MoveRight,
  SlidersHorizontal,
  Columns,
  RotateCcw,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  SupabaseQueryLogger,
  SupabaseQueryLog,
  SupabaseQueryStats,
  formatByteSize,
  getSupabaseClient
} from "../lib/supabase";
import { DeltaCache } from "../lib/deltaSync";

// Exported standard constants and helpers needed across the application
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

export const parseRowDateValue = (val?: string): number => {
  if (!val || val === "-") return 0;
  const str = String(val).trim();
  const parts = str.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
    }
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    let y = parseInt(parts[2]);
    if (y < 100) y += 2000;
    return new Date(y, m, d).getTime();
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const parseRowCreatedAt = (val?: string): number => {
  if (!val) return 0;
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

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

export const formatInputToDate = (isoStr: string): string => {
  return formatDateForInput(isoStr);
};

export const getDefaultSortColumn = (tbl?: TableMeta | null): string => {
  if (!tbl) return "";
  if (tbl.id === "customers" || tbl.name === "customers") return "nama";
  const colKeys = tbl.columns.map((c) => c.key);
  if (colKeys.includes("tanggal")) return "tanggal";
  if (colKeys.includes("created_at")) return "created_at";
  if (colKeys.includes("jatuh_tempo")) return "jatuh_tempo";
  if (colKeys.includes("update_terakhir")) return "update_terakhir";
  const dateCol = tbl.columns.find((c) => c.type === "date" || c.key.includes("date") || c.key.includes("tanggal"));
  if (dateCol) return dateCol.key;
  return colKeys[0] || "";
};

export const getDefaultSortAscending = (tbl?: TableMeta | null): boolean => {
  if (!tbl) return false;
  // Tabel Pelanggan secara default diurutkan berdasarkan nama A-Z (Ascending)
  if (tbl.id === "customers" || tbl.name === "customers") return true;
  return false; // Default terbaru paling atas (DESC) untuk tabel transaksi/riwayat
};

export const loadColumnPrefs = (tableId: string): { hidden: string[]; order: string[] } => {
  try {
    const raw = localStorage.getItem(`wt_admin_cols_${tableId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
        order: Array.isArray(parsed.order) ? parsed.order : []
      };
    }
  } catch (e) {
    console.error("Gagal membaca preferensi kolom:", e);
  }
  return { hidden: [], order: [] };
};

export const saveColumnPrefs = (tableId: string, hidden: string[], order: string[]) => {
  try {
    localStorage.setItem(`wt_admin_cols_${tableId}`, JSON.stringify({ hidden, order }));
  } catch (e) {
    console.error("Gagal menyimpan preferensi kolom:", e);
  }
};

export interface ColumnMeta {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  readOnly?: boolean;
}

// Database Table Definitions
interface TableMeta {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  primaryKey: string;
  searchColumn: string;
  columns: ColumnMeta[];
}

const DATABASE_TABLES: TableMeta[] = [
  {
    id: "customers",
    name: "customers",
    label: "Pelanggan",
    description: "Data profil nasabah, PIN, no WhatsApp, alamat, loyalitas level, dan saldo",
    icon: Users,
    color: "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    primaryKey: "id_pelanggan",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "nama", label: "Nama Lengkap", type: "text" },
      { key: "pin", label: "PIN", type: "text" },
      { key: "telepon", label: "No. HP / WA", type: "text" },
      { key: "alamat", label: "Alamat", type: "text" },
      { key: "tabungan", label: "Tabungan (Rp)", type: "number" },
      { key: "investasi", label: "Investasi (Rp)", type: "number" },
      { key: "lainnya", label: "Lainnya (Rp)", type: "number" },
      { key: "hutang", label: "Hutang (Rp)", type: "number" },
      { key: "point", label: "Poin Aktif", type: "number" },
      { key: "level", label: "Level Member", type: "select", options: ["Bronze", "Silver", "Gold", "Platinum", "VIP"] },
      { key: "foto", label: "Foto", type: "text" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "sales_transactions",
    name: "sales_transactions",
    label: "Transaksi Penjualan",
    description: "Rekap transaksi kasir, pemasukan, modal, jenis layanan, metode, dan status",
    icon: ShoppingCart,
    color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    primaryKey: "id_transaksi",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_transaksi", label: "ID Transaksi", type: "text" },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "date" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "jenis", label: "Jenis Layanan", type: "select", options: JENIS_OPTIONS },
      { key: "metode", label: "Metode", type: "text" },
      { key: "pemasukan", label: "Pemasukan (Rp)", type: "number" },
      { key: "poin", label: "Poin", type: "number" },
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      { key: "melalui", label: "Melalui", type: "select", options: MELALUI_OPTIONS },
      { key: "harga_admin", label: "Harga Admin (Rp)", type: "number" },
      { key: "harga_modal", label: "Harga Modal (Rp)", type: "number" },
      { key: "sebagian", label: "Sebagian (Rp)", type: "number" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "products",
    name: "products",
    label: "Stok Barang & Produk",
    description: "Inventori barang, jumlah stok, harga beli/modal, harga jual, dan batas menipis",
    icon: Package,
    color: "from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    primaryKey: "id_barang",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_barang", label: "ID / Kode Barang", type: "text" },
      { key: "nama", label: "Nama Barang", type: "text" },
      { key: "kategori", label: "Kategori", type: "text" },
      { key: "stok", label: "Jumlah Stok", type: "number" },
      { key: "satuan", label: "Satuan", type: "text" },
      { key: "min_stok", label: "Batas Min. Stok", type: "number" },
      { key: "harga_modal", label: "Harga Modal (Rp)", type: "number" },
      { key: "harga_jual", label: "Harga Jual (Rp)", type: "number" },
      { key: "gambar", label: "Gambar", type: "text" },
      { key: "update_terakhir", label: "Update Terakhir", type: "text" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "savings_transactions",
    name: "savings_transactions",
    label: "Transaksi Tabungan",
    description: "Mutasi simpan pinjam nasabah, setor tunai, penarikan, dan saldo akhir",
    icon: PiggyBank,
    color: "from-teal-500/20 to-teal-600/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    primaryKey: "id_tabungan",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_tabungan", label: "ID Tabungan", type: "text" },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "date" },
      { key: "nama", label: "Nama Nasabah", type: "text" },
      { key: "nama_nasabah", label: "Nama Nasabah (Alt)", type: "text" },
      { key: "tipe", label: "Tipe Mutasi", type: "select", options: ["SETOR", "TARIK"] },
      { key: "nominal", label: "Nominal (Rp)", type: "number" },
      { key: "saldo_akhir", label: "Saldo Akhir (Rp)", type: "number" },
      { key: "berita", label: "Berita / Keterangan", type: "text" },
      { key: "keterangan", label: "Keterangan", type: "text" },
      { key: "sebagian", label: "Sebagian (Rp)", type: "number" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "debt_transactions",
    name: "debt_transactions",
    label: "Transaksi Hutang & Kasbon",
    description: "Pencatatan pinjaman hutang kasbon, cicilan pembayaran, dan sisa saldo",
    icon: CreditCard,
    color: "from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    primaryKey: "id_hutang",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_hutang", label: "ID Hutang", type: "text" },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "date" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "nama_pelanggan", label: "Nama Pelanggan (Alt)", type: "text" },
      { key: "tipe", label: "Tipe Transaksi", type: "select", options: ["KASBON", "TAMBAH", "BAYAR", "LUNAS"] },
      { key: "jumlah", label: "Jumlah (Rp)", type: "number" },
      { key: "keterangan", label: "Keterangan", type: "text" },
      { key: "saldo_akhir", label: "Sisa Hutang (Rp)", type: "number" },
      { key: "sebagian", label: "Sebagian (Rp)", type: "number" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "redeemed_points",
    name: "redeemed_points",
    label: "Penukaran Poin & Hadiah",
    description: "Klaim penukaran poin loyalitas pelanggan dengan reward dan voucher",
    icon: Gift,
    color: "from-purple-500/20 to-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    primaryKey: "id_tukar",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_tukar", label: "ID Klaim Tukar", type: "text" },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "date" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "poin", label: "Poin Ditukar", type: "number" },
      { key: "hadiah", label: "Hadiah / Voucher", type: "text" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  },
  {
    id: "investment_transactions",
    name: "investment_transactions",
    label: "Investasi Modal",
    description: "Penyertaan modal kas usaha dan pembagian dividen hasil usaha",
    icon: TrendingUp,
    color: "from-indigo-500/20 to-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    primaryKey: "id_investasi",
    searchColumn: "nama",
    columns: [
      { key: "id", label: "UUID (ID)", type: "text", readOnly: true },
      { key: "id_investasi", label: "ID Investasi", type: "text" },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "date" },
      { key: "nama", label: "Nama Investor", type: "text" },
      { key: "nama_investor", label: "Nama Investor (Alt)", type: "text" },
      { key: "nominal", label: "Nominal (Rp)", type: "number" },
      { key: "tenor", label: "Tenor", type: "text" },
      { key: "tenor_bulan", label: "Tenor Bulan", type: "number" },
      { key: "jatuh_tempo", label: "Jatuh Tempo", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Aktif", "Selesai", "Ditarik"] },
      { key: "keterangan", label: "Keterangan", type: "text" },
      { key: "nisbah", label: "Nisbah", type: "text" },
      { key: "nisbah_persen", label: "Nisbah Persen", type: "number" },
      { key: "sebagian", label: "Sebagian (Rp)", type: "number" },
      { key: "created_at", label: "Created At", type: "text", readOnly: true }
    ]
  }
];

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500];

interface AdminDatabasePageProps {
  salesTransactions?: any[];
  setSalesTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
  customers?: any[];
  setCustomers?: React.Dispatch<React.SetStateAction<any[]>>;
  savingsTransactions?: any[];
  setSavingsTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
  debtTransactions?: any[];
  setDebtTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const AdminDatabasePage: React.FC<AdminDatabasePageProps> = ({
  salesTransactions = [],
  setSalesTransactions,
  customers = [],
  setCustomers,
  savingsTransactions = [],
  setSavingsTransactions,
  debtTransactions = [],
  setDebtTransactions
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"data" | "analisa">("data");
  
  // Table Explorer States
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20); // Default 20 baris per halaman
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [isCachedData, setIsCachedData] = useState<boolean>(false);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [deltaSyncSavedBytes, setDeltaSyncSavedBytes] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingLocal, setIsSyncingLocal] = useState<boolean>(false);

  // Add Row Modal State
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState<boolean>(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isSavingNewRow, setIsSavingNewRow] = useState<boolean>(false);

  // Sorting State: Default to newest date DESC
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Column Customization States (Hide / Reorder)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState<boolean>(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState<string>("");

  // Inline & Modal Row Editing States
  const [editingRowUniqueId, setEditingRowUniqueId] = useState<string | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editRowValues, setEditRowValues] = useState<Record<string, any>>({});
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);

  // Edit Modal State
  const [editingModalRow, setEditingModalRow] = useState<any | null>(null);
  const [editingModalIndex, setEditingModalIndex] = useState<number | null>(null);
  const [editingModalValues, setEditingModalValues] = useState<Record<string, any>>({});
  const [isSavingModalEdit, setIsSavingModalEdit] = useState<boolean>(false);

  // Custom Delete Modal State
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);
  const [isDeletingRow, setIsDeletingRow] = useState<boolean>(false);

  // Traffic Analytics States
  const [stats, setStats] = useState<SupabaseQueryStats>(SupabaseQueryLogger.getStats());
  const [logs, setLogs] = useState<SupabaseQueryLog[]>(SupabaseQueryLogger.getLogs());
  const [searchLog, setSearchLog] = useState("");
  const [selectedTableFilter, setSelectedTableFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 1. All Discovered Columns: Scans Supabase data & merges with predefined table metadata
  const allDiscoveredColumns: ColumnMeta[] = useMemo(() => {
    if (!selectedTable) return [];

    const keySet = new Set<string>();
    const keysInOrder: string[] = [];

    // Scan all returned rows to preserve exact column sequence from Supabase
    if (tableRows && tableRows.length > 0) {
      for (const row of tableRows) {
        if (row && typeof row === "object") {
          for (const k of Object.keys(row)) {
            if (!keySet.has(k)) {
              keySet.add(k);
              keysInOrder.push(k);
            }
          }
        }
      }
    }

    // If no rows loaded yet or some predefined columns not present, append them
    if (keysInOrder.length === 0) {
      selectedTable.columns.forEach((c) => {
        if (!keySet.has(c.key)) {
          keySet.add(c.key);
          keysInOrder.push(c.key);
        }
      });
    } else {
      selectedTable.columns.forEach((c) => {
        if (!keySet.has(c.key)) {
          keySet.add(c.key);
          keysInOrder.push(c.key);
        }
      });
    }

    return keysInOrder.map((key) => {
      const predefined = selectedTable.columns.find((c) => c.key === key);
      if (predefined) return predefined;

      // Auto-detect types and labels for newly discovered columns from Supabase
      let detectedType: "text" | "number" | "date" | "select" = "text";
      if (
        key.includes("tanggal") ||
        key.includes("date") ||
        key === "jatuh_tempo" ||
        key === "created_at"
      ) {
        detectedType = "date";
      } else if (
        key.includes("pemasukan") ||
        key.includes("harga") ||
        key.includes("modal") ||
        key.includes("nominal") ||
        key.includes("saldo") ||
        key.includes("jumlah") ||
        key.includes("point") ||
        key.includes("poin") ||
        key.includes("stok") ||
        key.includes("tabungan") ||
        key.includes("hutang") ||
        key.includes("investasi") ||
        key === "sebagian" ||
        key === "tenor_bulan" ||
        key === "nisbah_persen"
      ) {
        detectedType = "number";
      }

      const formattedLabel = key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        key,
        label: formattedLabel,
        type: detectedType,
        readOnly: key === "id" || key === "created_at"
      };
    });
  }, [selectedTable, tableRows]);

  // 2. Ordered All Columns: Applies user's custom sequence
  const orderedAllColumns: ColumnMeta[] = useMemo(() => {
    if (columnOrder.length === 0) return allDiscoveredColumns;

    const colMap = new Map(allDiscoveredColumns.map((c) => [c.key, c]));
    const ordered: ColumnMeta[] = [];

    // Add columns in saved order
    columnOrder.forEach((k) => {
      const col = colMap.get(k);
      if (col) {
        ordered.push(col);
        colMap.delete(k);
      }
    });

    // Append newly discovered columns not yet in order
    colMap.forEach((col) => {
      ordered.push(col);
    });

    return ordered;
  }, [allDiscoveredColumns, columnOrder]);

  // 3. Effective Visible Columns: The columns actually rendered in the table view
  const effectiveColumns: ColumnMeta[] = useMemo(() => {
    return orderedAllColumns.filter((c) => !hiddenColumns.includes(c.key));
  }, [orderedAllColumns, hiddenColumns]);

  // Load column preferences when table changes
  useEffect(() => {
    if (selectedTable) {
      const prefs = loadColumnPrefs(selectedTable.id);
      setHiddenColumns(prefs.hidden);
      setColumnOrder(prefs.order);
    }
  }, [selectedTable?.id]);

  // Subscribe to live Supabase traffic changes
  useEffect(() => {
    const update = () => {
      setStats(SupabaseQueryLogger.getStats());
      setLogs(SupabaseQueryLogger.getLogs());
    };

    update();
    const unsubscribe = SupabaseQueryLogger.subscribe(update);
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(update, 2500);
    }
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Table Rows: Directly keeps exact order from Supabase without client-side reshuffle
  // Uses Database-level pagination (range from to) and Delta Cache to minimize bandwidth consumption
  const fetchTableData = useCallback(async (
    tbl: TableMeta,
    page: number = 1,
    query: string = "",
    isDeltaRefresh: boolean = false,
    orderColOverride?: string,
    orderAscOverride?: boolean,
    limitOverride?: number
  ) => {
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    const limit = limitOverride || pageSize;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const effectiveSortCol = orderColOverride !== undefined ? orderColOverride : sortColumn;
    const effectiveSortAsc = orderAscOverride !== undefined ? orderAscOverride : sortAscending;

    const cacheKey = `adm_tbl_${tbl.name}_p${page}_sz${limit}_${effectiveSortCol || 'def'}_${effectiveSortAsc ? 'asc' : 'desc'}_${query.trim()}`;
    const countCacheKey = `adm_cnt_${tbl.name}_${query.trim()}`;

    // 1. Delta Sync Cache Check: Jika data ada di cache, render langsung (0ms render time)
    if (!isDeltaRefresh) {
      const cached = DeltaCache.get<any>(cacheKey);
      const cachedCountRaw = localStorage.getItem(`wt_delta_cache_v3_${countCacheKey}`);
      if (cached && cached.length > 0) {
        setTableRows(cached);
        setIsCachedData(true);
        if (cachedCountRaw) {
          const parsedCount = parseInt(cachedCountRaw, 10);
          if (!isNaN(parsedCount)) setTotalCount(parsedCount);
        }
        const cachedSync = DeltaCache.getLastSync(cacheKey);
        if (cachedSync) {
          try {
            setLastSyncTime(new Date(cachedSync).toLocaleTimeString("id-ID"));
          } catch (e) {
            setLastSyncTime(new Date().toLocaleTimeString("id-ID"));
          }
        }
        // Bandwidth saved from local cache
        const savedFromCache = cached.length * 450;
        setDeltaSyncSavedBytes(prev => prev + savedFromCache);
      } else {
        setIsLoadingTable(true);
      }
    } else {
      setIsLoadingTable(true);
    }

    try {
      await SupabaseQueryLogger.track(
        tbl.name,
        "SELECT",
        {
          page,
          limit,
          search: query,
          deltaSync: true,
          orderBy: effectiveSortCol ? `${effectiveSortCol} ${effectiveSortAsc ? "ASC" : "DESC"}` : "Natural Supabase Order"
        },
        async () => {
          let req = client
            .from(tbl.name)
            .select("*", { count: "exact" });

          // Apply server-side search directly on the database (only fetch matching records)
          if (query.trim() !== "") {
            const q = query.trim();
            const searchCols: string[] = [];
            
            // Prioritize primary search column
            if (tbl.searchColumn && tbl.columns.some(c => c.key === tbl.searchColumn)) {
              searchCols.push(tbl.searchColumn);
            }
            
            // Include potential name and identifier columns present in this table
            const candidateKeys = ['nama', 'nama_nasabah', 'nama_pelanggan', 'nama_investor', 'id_pelanggan', 'id_transaksi', 'id_barang', tbl.primaryKey];
            candidateKeys.forEach((key) => {
              if (tbl.columns.some(c => c.key === key) && !searchCols.includes(key)) {
                searchCols.push(key);
              }
            });

            if (searchCols.length === 1) {
              req = req.ilike(searchCols[0], `%${q}%`);
            } else if (searchCols.length > 1) {
              const orClause = searchCols.map((c) => `${c}.ilike.%${q}%`).join(",");
              req = req.or(orClause);
            }
          }

          // Apply sort order if explicitly set
          if (effectiveSortCol) {
            req = req.order(effectiveSortCol, { ascending: effectiveSortAsc, nullsFirst: false });
          }

          // Database pagination: only request 20 rows per page directly from Supabase
          req = req.range(from, to);

          const { data, count, error } = await req;

          if (error) {
            console.error(`Gagal memuat tabel ${tbl.name}:`, error);
            showToast(`Error: ${error.message}`);
            return { data: null, error };
          }

          const cleanRows = data || [];
          setTableRows(cleanRows);
          setIsCachedData(false);
          if (count !== null && count !== undefined) {
            setTotalCount(count);
            try {
              localStorage.setItem(`wt_delta_cache_v3_${countCacheKey}`, String(count));
            } catch (e) {}
          }

          // Simpan ke DeltaCache untuk paginasi berikutnya
          const nowIso = new Date().toISOString();
          DeltaCache.set(cacheKey, cleanRows, nowIso);
          setLastSyncTime(new Date().toLocaleTimeString("id-ID"));

          // Calculate bandwidth metrics: Full table vs 20 rows
          const estimatedFullTableSize = (count || limit) * 450;
          const paginatedSize = (cleanRows.length || 0) * 450;
          const saved = Math.max(0, estimatedFullTableSize - paginatedSize);
          setDeltaSyncSavedBytes(prev => prev + saved);

          return { data, error: null };
        }
      );
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || "Gagal mengambil data."}`);
    } finally {
      setIsLoadingTable(false);
    }
  }, [pageSize, sortColumn, sortAscending]);

  // When selectedTable, currentPage, pageSize, sortColumn, or sortAscending changes, fetch table rows
  useEffect(() => {
    if (selectedTable) {
      setEditingRowUniqueId(null);
      setEditingRowIndex(null);
      setEditRowValues({});
      fetchTableData(selectedTable, currentPage, tableSearchQuery, false, sortColumn, sortAscending, pageSize);
    }
  }, [selectedTable, currentPage, pageSize, sortColumn, sortAscending, fetchTableData]);

  // Handle Search Input (debounce)
  useEffect(() => {
    if (!selectedTable) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTableData(selectedTable, 1, tableSearchQuery, false, sortColumn, sortAscending, pageSize);
    }, 400);
    return () => clearTimeout(timer);
  }, [tableSearchQuery, selectedTable, sortColumn, sortAscending, pageSize, fetchTableData]);

  // Toggle sort direction or change sort column
  const handleSortBy = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortAscending((prev) => !prev);
    } else {
      setSortColumn(columnKey);
      // Kolom nama diurutkan A-Z (Ascending) terlebih dahulu saat pertama kali diklik
      if (columnKey === "nama" || columnKey === "nama_pelanggan" || columnKey === "nama_nasabah" || columnKey === "nama_investor") {
        setSortAscending(true);
      } else {
        setSortAscending(false); // Terbaru / nominal terbesar paling atas secara default
      }
    }
    setCurrentPage(1);
  };

  // Column Actions: Toggle column visibility (hide/show)
  const handleToggleColumn = (key: string) => {
    if (!selectedTable) return;
    setHiddenColumns((prev) => {
      let next: string[];
      if (prev.includes(key)) {
        next = prev.filter((k) => k !== key);
      } else {
        // Prevent hiding all columns (keep at least 1)
        if (prev.length >= orderedAllColumns.length - 1) {
          showToast("Minimal satu kolom harus tetap ditampilkan.");
          return prev;
        }
        next = [...prev, key];
      }
      saveColumnPrefs(selectedTable.id, next, columnOrder);
      return next;
    });
  };

  // Column Actions: Show all columns
  const handleShowAllColumns = () => {
    if (!selectedTable) return;
    setHiddenColumns([]);
    saveColumnPrefs(selectedTable.id, [], columnOrder);
    showToast("Semua kolom ditampilkan.");
  };

  // Column Actions: Hide secondary non-essential columns for compact bandwidth-friendly view
  const handleHideNonEssentialColumns = () => {
    if (!selectedTable) return;
    const essentialKeys = [
      selectedTable.primaryKey,
      "nama",
      "tanggal",
      "created_at",
      "pemasukan",
      "stok",
      "harga_jual",
      "status",
      "jenis",
      "saldo",
      "nominal"
    ];
    const toHide = orderedAllColumns
      .map((c) => c.key)
      .filter((k) => !essentialKeys.includes(k) && k !== selectedTable.primaryKey);
    
    if (toHide.length === 0 || toHide.length >= orderedAllColumns.length) {
      showToast("Tabel sudah dalam format ringkas.");
      return;
    }
    setHiddenColumns(toHide);
    saveColumnPrefs(selectedTable.id, toHide, columnOrder);
    showToast(`Menyembunyikan ${toHide.length} kolom sekunder.`);
  };

  // Column Actions: Move column left/right (or up/down)
  const handleMoveColumn = (key: string, direction: "left" | "right") => {
    if (!selectedTable) return;
    const currentKeys = orderedAllColumns.map((c) => c.key);
    const idx = currentKeys.indexOf(key);
    if (idx === -1) return;

    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentKeys.length) return;

    const nextKeys = [...currentKeys];
    const temp = nextKeys[idx];
    nextKeys[idx] = nextKeys[targetIdx];
    nextKeys[targetIdx] = temp;

    setColumnOrder(nextKeys);
    saveColumnPrefs(selectedTable.id, hiddenColumns, nextKeys);
  };

  // Column Actions: Reset columns to original default Supabase order & visibility
  const handleResetColumns = () => {
    if (!selectedTable) return;
    setHiddenColumns([]);
    setColumnOrder([]);
    localStorage.removeItem(`wt_admin_cols_${selectedTable.id}`);
    showToast("Urutan dan keterlihatan kolom dikembalikan ke standar Supabase.");
  };

  // Open Table Explorer View: Defaults to newest date on top (DESC)
  const handleOpenTable = (tbl: TableMeta) => {
    setSelectedTable(tbl);
    setCurrentPage(1);
    setTableSearchQuery("");
    
    // Default sorting: Pelanggan -> Nama A-Z (ASC), Transaksi/Riwayat -> Tanggal terbaru (DESC)
    const defaultDateCol = getDefaultSortColumn(tbl);
    const defaultAsc = getDefaultSortAscending(tbl);
    setSortColumn(defaultDateCol);
    setSortAscending(defaultAsc);

    setEditingRowUniqueId(null);
    setEditingRowIndex(null);
    setEditRowValues({});

    // Load saved column preferences
    const prefs = loadColumnPrefs(tbl.id);
    setHiddenColumns(prefs.hidden);
    setColumnOrder(prefs.order);
  };

  // Back to Table Grid View
  const handleBackToGrid = () => {
    setSelectedTable(null);
    setTableRows([]);
    setEditingRowUniqueId(null);
    setEditingRowIndex(null);
    setEditRowValues({});
  };

  // Start Inline Editing for a Row (handles duplicate IDs via row index & unique keys)
  const handleStartInlineEdit = (row: any, rIdx: number) => {
    const rowUniqueKey = row.id ? String(row.id) : `row-idx-${(currentPage - 1) * pageSize + rIdx}`;
    setEditingRowUniqueId(rowUniqueKey);
    setEditingRowIndex(rIdx);
    setEditRowValues({ ...row });
  };

  // Cancel Inline Editing
  const handleCancelInlineEdit = () => {
    setEditingRowUniqueId(null);
    setEditingRowIndex(null);
    setEditRowValues({});
  };

  // Open Full Edit Modal (handles duplicate IDs via row index)
  const handleOpenEditModal = (row: any, rIdx: number) => {
    setEditingModalRow(row);
    setEditingModalIndex(rIdx);
    setEditingModalValues({ ...row });
  };

  // Save Inline Row Edit directly to Supabase
  const handleSaveInlineEdit = async (row: any, rIdx: number) => {
    if (!selectedTable) return;
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    setIsSavingRow(true);
    const pkKey = selectedTable.primaryKey;
    const pkVal = row[pkKey] || row.id;

    try {
      await SupabaseQueryLogger.track(
        selectedTable.name,
        "UPDATE",
        { pkKey, pkVal, updatedFields: editRowValues },
        async () => {
          // Prepare clean payload for all non-read-only columns
          const cleanPayload: Record<string, any> = {};
          effectiveColumns.forEach((col) => {
            if (col.key !== "created_at" && col.key !== "id" && !col.readOnly) {
              if (col.type === "number") {
                cleanPayload[col.key] = editRowValues[col.key] !== "" && editRowValues[col.key] !== undefined
                  ? Number(editRowValues[col.key])
                  : 0;
              } else if (col.type === "date" || col.key === "tanggal") {
                cleanPayload[col.key] = formatDateForInput(editRowValues[col.key]);
              } else if (editRowValues[col.key] !== undefined) {
                cleanPayload[col.key] = String(editRowValues[col.key]).trim();
              }
            }
          });

          let updateQuery = client.from(selectedTable.name).update(cleanPayload);
          if (row.id) {
            updateQuery = updateQuery.eq("id", row.id);
          } else if (row[pkKey]) {
            updateQuery = updateQuery.eq(pkKey, row[pkKey]);
          }

          const { data, error } = await updateQuery.select();

          if (error) {
            console.error("Gagal update data:", error);
            showToast(`Gagal menyimpan: ${error.message}`);
            return { data: null, error };
          }

          // Update local state specifically for this exact row index (handles duplicate IDs!)
          setTableRows((prev) =>
            prev.map((r, idx) => (idx === rIdx ? { ...r, ...cleanPayload } : r))
          );

          // Update parent state if applicable
          if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
            setSalesTransactions((prev) =>
              prev.map((r, idx) => ((r.id ? r.id === row.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "customers" && setCustomers) {
            setCustomers((prev) =>
              prev.map((r, idx) => ((r.id ? r.id === row.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
            setSavingsTransactions((prev) =>
              prev.map((r, idx) => ((r.id ? r.id === row.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
            setDebtTransactions((prev) =>
              prev.map((r, idx) => ((r.id ? r.id === row.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
            );
          }

          // Invalidate cache for this table to ensure freshness
          DeltaCache.clearPrefix(`adm_tbl_${selectedTable.name}`);
          DeltaCache.clearPrefix(`adm_cnt_${selectedTable.name}`);

          setEditingRowUniqueId(null);
          setEditingRowIndex(null);
          setEditRowValues({});
          showToast(`✅ Baris berhasil diperbarui di database Supabase!`);
          return { data, error: null };
        }
      );
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || "Gagal menyimpan perubahan."}`);
    } finally {
      setIsSavingRow(false);
    }
  };

  // Save Modal Edit directly to Supabase
  const handleSaveModalEdit = async () => {
    if (!selectedTable || !editingModalRow) return;
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    setIsSavingModalEdit(true);
    const pkKey = selectedTable.primaryKey;
    const pkVal = editingModalRow[pkKey] || editingModalRow.id;

    try {
      const cleanPayload: Record<string, any> = {};
      effectiveColumns.forEach((col) => {
        if (col.key !== "created_at" && col.key !== "id" && !col.readOnly) {
          if (col.type === "number") {
            cleanPayload[col.key] = editingModalValues[col.key] !== "" && editingModalValues[col.key] !== undefined
              ? Number(editingModalValues[col.key])
              : 0;
          } else if (col.type === "date" || col.key === "tanggal") {
            cleanPayload[col.key] = formatDateForInput(editingModalValues[col.key]);
          } else if (editingModalValues[col.key] !== undefined) {
            cleanPayload[col.key] = String(editingModalValues[col.key]).trim();
          }
        }
      });

      let q = client.from(selectedTable.name).update(cleanPayload);
      if (editingModalRow.id) {
        q = q.eq("id", editingModalRow.id);
      } else if (editingModalRow[pkKey]) {
        q = q.eq(pkKey, editingModalRow[pkKey]);
      }

      const { error } = await q;
      if (error) throw error;

      // Update local state specifically for this exact row index (handles duplicate IDs!)
      setTableRows((prev) =>
        prev.map((r, idx) => (idx === editingModalIndex ? { ...r, ...cleanPayload } : r))
      );

      // Update parent state
      if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
        setSalesTransactions((prev) =>
          prev.map((r) => ((r.id ? r.id === editingModalRow.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "customers" && setCustomers) {
        setCustomers((prev) =>
          prev.map((r) => ((r.id ? r.id === editingModalRow.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
        setSavingsTransactions((prev) =>
          prev.map((r) => ((r.id ? r.id === editingModalRow.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
        setDebtTransactions((prev) =>
          prev.map((r) => ((r.id ? r.id === editingModalRow.id : (r[pkKey] || r.id) === pkVal) ? { ...r, ...cleanPayload } : r))
        );
      }

      // Invalidate cache for this table
      DeltaCache.clearPrefix(`adm_tbl_${selectedTable.name}`);
      DeltaCache.clearPrefix(`adm_cnt_${selectedTable.name}`);

      showToast(`✅ Data berhasil disimpan ke Supabase!`);
      setEditingModalRow(null);
      setEditingModalIndex(null);
      setEditingModalValues({});
    } catch (err: any) {
      console.error("Gagal simpan edit modal:", err);
      showToast(`Gagal menyimpan: ${err.message || "Terjadi kesalahan."}`);
    } finally {
      setIsSavingModalEdit(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteRow = (row: any, rIdx: number) => {
    setRowToDelete({ ...row, _rIdx: rIdx });
  };

  // Confirm Delete Row from Supabase
  const handleConfirmDeleteRow = async () => {
    if (!selectedTable || !rowToDelete) return;
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    setIsDeletingRow(true);
    const pkKey = selectedTable.primaryKey;
    const pkVal = rowToDelete[pkKey] || rowToDelete.id;
    const targetIdx = rowToDelete._rIdx;

    try {
      await SupabaseQueryLogger.track(
        selectedTable.name,
        "DELETE",
        { pkKey, pkVal, id: rowToDelete.id },
        async () => {
          let delQ = client.from(selectedTable.name).delete();
          if (rowToDelete.id) {
            delQ = delQ.eq("id", rowToDelete.id);
          } else if (rowToDelete[pkKey]) {
            delQ = delQ.eq(pkKey, rowToDelete[pkKey]);
          }

          const { error } = await delQ;

          if (error) {
            console.error("Gagal menghapus baris:", error);
            showToast(`Gagal menghapus: ${error.message}`);
            return { data: null, error };
          }

          // Delete specific row by index locally (handles duplicate IDs safely!)
          setTableRows((prev) => prev.filter((_, idx) => idx !== targetIdx));
          setTotalCount((prev) => Math.max(0, prev - 1));

          // Update parent state
          if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
            setSalesTransactions((prev) => prev.filter((r) => (rowToDelete.id ? r.id !== rowToDelete.id : (r[pkKey] || r.id) !== pkVal)));
          } else if (selectedTable.name === "customers" && setCustomers) {
            setCustomers((prev) => prev.filter((r) => (rowToDelete.id ? r.id !== rowToDelete.id : (r[pkKey] || r.id) !== pkVal)));
          } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
            setSavingsTransactions((prev) => prev.filter((r) => (rowToDelete.id ? r.id !== rowToDelete.id : (r[pkKey] || r.id) !== pkVal)));
          } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
            setDebtTransactions((prev) => prev.filter((r) => (rowToDelete.id ? r.id !== rowToDelete.id : (r[pkKey] || r.id) !== pkVal)));
          }

          // Invalidate cache for this table
          DeltaCache.clearPrefix(`adm_tbl_${selectedTable.name}`);
          DeltaCache.clearPrefix(`adm_cnt_${selectedTable.name}`);

          showToast(`🗑️ Baris telah dihapus dari tabel ${selectedTable.label}.`);
          setRowToDelete(null);
          return { data: true, error: null };
        }
      );
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || "Gagal menghapus data."}`);
    } finally {
      setIsDeletingRow(false);
    }
  };

  // Open Add New Row Modal
  const handleOpenAddModal = () => {
    if (!selectedTable) return;
    const initialValues: Record<string, any> = {};

    if (selectedTable.name === "sales_transactions") {
      const now = new Date();
      const timeSlice = Math.floor(Date.now() / 1000).toString().slice(-4);
      initialValues["id_transaksi"] = `TRX-${timeSlice}`;
      initialValues["id_pelanggan"] = "CUST-0000";
      initialValues["tanggal"] = now.toISOString().slice(0, 10);
      initialValues["nama"] = "Pelanggan Umum";
      initialValues["jenis"] = "TARIK TUNAI";
      initialValues["melalui"] = "EDC BNI";
      initialValues["metode"] = "Tunai";
      initialValues["pemasukan"] = 100000;
      initialValues["harga_admin"] = 0;
      initialValues["harga_modal"] = 97000;
      initialValues["sebagian"] = 0;
      initialValues["poin"] = 10;
      initialValues["status"] = "SELESAI";
    } else if (selectedTable.name === "customers") {
      initialValues["id_pelanggan"] = `CUST-${String((totalCount || 0) + 1).padStart(4, "0")}`;
      initialValues["nama"] = "";
      initialValues["pin"] = "";
      initialValues["telepon"] = "-";
      initialValues["alamat"] = "-";
      initialValues["point"] = 0;
      initialValues["level"] = "Bronze";
      initialValues["tabungan"] = 0;
      initialValues["investasi"] = 0;
      initialValues["lainnya"] = 0;
      initialValues["hutang"] = 0;
    } else {
      effectiveColumns.forEach((c) => {
        if (c.key !== "created_at" && c.key !== "id") {
          if (c.type === "number") {
            initialValues[c.key] = 0;
          } else if (c.type === "date" || c.key === "tanggal") {
            initialValues[c.key] = new Date().toISOString().slice(0, 10);
          } else {
            initialValues[c.key] = "";
          }
        }
      });
    }

    setNewRowData(initialValues);
    setIsAddRowModalOpen(true);
  };

  // Save Single Row Directly to Supabase
  const handleSaveNewRow = async () => {
    if (!selectedTable) return;
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    setIsSavingNewRow(true);
    try {
      const cleanPayload: Record<string, any> = {};
      effectiveColumns.forEach((c) => {
        if (c.key === "id" && !newRowData[c.key]) return;
        if (c.key === "created_at" && !newRowData[c.key]) return;
        if (c.type === "number") {
          cleanPayload[c.key] = Number(newRowData[c.key] || 0);
        } else if (c.type === "date" || c.key === "tanggal") {
          cleanPayload[c.key] = formatDateForInput(newRowData[c.key]);
        } else {
          cleanPayload[c.key] = newRowData[c.key] !== undefined ? String(newRowData[c.key]).trim() : "";
        }
      });

      const { data, error } = await client.from(selectedTable.name).insert(cleanPayload).select();
      if (error) throw error;

      if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
        setSalesTransactions((prev) => [cleanPayload as any, ...prev]);
      }

      // Invalidate cache for this table
      DeltaCache.clearPrefix(`adm_tbl_${selectedTable.name}`);
      DeltaCache.clearPrefix(`adm_cnt_${selectedTable.name}`);

      showToast(`✅ Berhasil menambahkan data baru ke tabel ${selectedTable.label}!`);
      setIsAddRowModalOpen(false);
      await fetchTableData(selectedTable, 1, tableSearchQuery, false, sortColumn, sortAscending, pageSize);
    } catch (err: any) {
      console.error("Gagal simpan baris baru ke Supabase:", err);
      showToast(`Gagal menyimpan: ${err.message || "Terjadi kesalahan."}`);
    } finally {
      setIsSavingNewRow(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Analytics Helpers
  const handleClearLogs = () => {
    SupabaseQueryLogger.clearLogs();
    setStats(SupabaseQueryLogger.getStats());
    setLogs([]);
    showToast("Log analitik berhasil di-reset.");
  };

  const sortedPageStats = useMemo(() => {
    const list = Object.values(stats.byPage || {}) as Array<any>;
    return list.sort((a, b) => (b.totalBytes || 0) - (a.totalBytes || 0));
  }, [stats.byPage]);

  const sortedTableStats = useMemo(() => {
    const list = Object.entries(stats.byTable || {}).map(([table, s]) => ({
      table,
      ...(s as any)
    }));
    return list.sort((a, b) => (b.totalBytes || 0) - (a.totalBytes || 0));
  }, [stats.byTable]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchTable = selectedTableFilter === "ALL" || l.table === selectedTableFilter;
      const query = searchLog.toLowerCase();
      const matchSearch =
        !query ||
        l.table.toLowerCase().includes(query) ||
        l.operation.toLowerCase().includes(query) ||
        (l.page && l.page.toLowerCase().includes(query)) ||
        (l.filterSummary && l.filterSummary.toLowerCase().includes(query));
      return matchTable && matchSearch;
    });
  }, [logs, selectedTableFilter, searchLog]);

  return (
    <motion.div
      id="admin-database-page-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 text-slate-800 dark:text-slate-100"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-[#005E6A] text-white px-4 py-2.5 rounded-xl shadow-xl border border-teal-400/30 flex items-center gap-2 text-xs sm:text-sm font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header matching AdminCashFlowPage */}
      <div className="bg-[#005E6A] text-white px-4 sm:px-8 pt-8 pb-16 relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-black uppercase tracking-wider transition-all backdrop-blur-md mb-2 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  Kelola Database
                </h1>
                <p className="text-xs font-medium text-teal-100/80 uppercase tracking-widest">
                  Live Supabase Inspector, Schema & Bandwidth Optimizer
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Badges on Top Right */}
          <div className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md flex items-center gap-2 overflow-x-auto no-scrollbar border border-white/15">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Connected</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-mono">
              <span>{DATABASE_TABLES.length} Tabel</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-wider shadow-md">
              <span>{formatByteSize(stats.totalBytesTransferred)} Traffic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sub-Tabs overlapping with -mt-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 space-y-8 relative z-20">
        {/* Navigation Sub-Tabs: Daftar Tabel vs Analisa Traffic */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("data")}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "data"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Daftar Tabel ({DATABASE_TABLES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("analisa")}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "analisa"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analisa Traffic ({stats.totalQueries})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeTab === "analisa" && (
              <>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-xl text-xs border transition-all cursor-pointer ${
                    autoRefresh
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
                  {autoRefresh ? "Live Sync" : "Jeda"}
                </button>
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-3 py-2 font-bold rounded-xl text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Log
                </button>
              </>
            )}
            {activeTab === "data" && selectedTable && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Tabel Aktif: <strong className="text-[#005E6A] dark:text-teal-400 uppercase">{selectedTable.label}</strong></span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* TAB 1: DATA (GRID KARTU TABEL + INLINE ROW EDITING + PAGINASI LIMIT 20)  */}
          {/* ========================================================================= */}
          {activeTab === "data" && (
            <motion.div
              key="tab-data-root"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* SUB-VIEW A: GRID KARTU TABEL SUPABASE */}
              {!selectedTable ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#005E6A] dark:text-[#2dd4bf]" />
                        Daftar Tabel
                      </h2>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {DATABASE_TABLES.length} Tabel
                    </span>
                  </div>

                  {/* Grid of Table Cards: 2x2 on small screens */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4">
                    {DATABASE_TABLES.map((tbl) => {
                      const IconComp = tbl.icon;
                      return (
                        <button
                          key={tbl.id}
                          onClick={() => handleOpenTable(tbl)}
                          className={`text-left p-3.5 sm:p-4 rounded-lg bg-white dark:bg-slate-900 border transition-all shadow-xs hover:border-[#005E6A] dark:hover:border-[#2dd4bf] flex flex-col justify-between group ${tbl.color}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {tbl.columns.length} Kolom
                              </span>
                            </div>

                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-0.5 group-hover:text-[#005E6A] dark:group-hover:text-[#2dd4bf] transition-colors">
                              {tbl.label}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                              {tbl.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px]">
                            <span className="font-mono text-slate-400">
                              {tbl.primaryKey}
                            </span>
                            <span className="font-bold flex items-center gap-0.5 text-[#005E6A] dark:text-[#2dd4bf]">
                              Buka <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* SUB-VIEW B: HALAMAN DETAIL TABEL DENGAN KOLOM-KOLOM & INLINE ROW EDITING */
                <div className="space-y-3">
                  {/* Simplified Navigation & Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackToGrid}
                        title="Kembali"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {selectedTable.label}
                        </h2>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {totalCount} baris
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          <Zap className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          Delta Sync (Paginasi {pageSize} Baris)
                        </span>
                      </div>
                    </div>

                    {/* Right Tools: Page Size + Kelola Kolom + Tambah Data + Refresh + Search */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Page Size Selector */}
                      <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Tampil:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            const newSize = Number(e.target.value);
                            setPageSize(newSize);
                            setCurrentPage(1);
                          }}
                          className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          {PAGE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {opt === 1000 ? "1000 (Semua)" : `${opt} baris`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Kelola Kolom Button */}
                      <button
                        onClick={() => setIsColumnManagerOpen(true)}
                        title="Atur kolom yang ditampilkan dan urutan kolom"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          hiddenColumns.length > 0
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5 text-[#005E6A] dark:text-[#2dd4bf]" />
                        <span className="hidden sm:inline">Kolom</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          hiddenColumns.length > 0
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          {effectiveColumns.length}/{orderedAllColumns.length}
                        </span>
                      </button>

                      <button
                        onClick={handleOpenAddModal}
                        title={`Tambah data baru`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tambah Data</span>
                      </button>

                      <button
                        onClick={() => fetchTableData(selectedTable, currentPage, tableSearchQuery, true, sortColumn, sortAscending, pageSize)}
                        disabled={isLoadingTable}
                        title="Segarkan data dari Supabase"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTable ? "animate-spin text-[#005E6A]" : ""}`} />
                      </button>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={`Cari ${selectedTable.searchColumn || "nama"}...`}
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1.5 font-medium w-32 sm:w-44 focus:outline-none focus:border-[#005E6A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Responsive Table Container */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto max-h-[72vh]">
                      <table className="w-auto text-left border-collapse text-xs">
                        <thead className="sticky top-0 z-10 shadow-xs">
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-1 px-1.5 text-center w-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">No</th>
                            {effectiveColumns.map((col, cIdx) => {
                              const isSorted = sortColumn === col.key;
                              return (
                                <th
                                  key={col.key}
                                  className="py-1 px-1.5 whitespace-nowrap select-none bg-slate-100 dark:bg-slate-800 group/th border-r border-slate-200/50 dark:border-slate-800/60"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      onClick={() => handleSortBy(col.key)}
                                      className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                                      title={`Klik untuk urutkan berdasarkan ${col.label}`}
                                    >
                                      <span className="font-bold text-[11px]">{col.label}</span>
                                      <span className={`text-[9px] font-mono ${
                                        isSorted ? "text-[#005E6A] dark:text-[#2dd4bf] font-black" : "text-slate-400 group-hover/th:text-slate-700 dark:group-hover/th:text-slate-200"
                                      }`}>
                                        {isSorted ? (sortAscending ? "▲" : "▼") : "↕"}
                                      </span>
                                    </div>

                                    {/* Quick Column Shift (Left/Right) & Quick Hide */}
                                    <div className="opacity-0 group-hover/th:opacity-100 flex items-center gap-0.5 transition-opacity ml-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveColumn(col.key, "left");
                                        }}
                                        disabled={cIdx === 0}
                                        title="Geser kolom ke kiri"
                                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 transition-colors"
                                      >
                                        <MoveLeft className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveColumn(col.key, "right");
                                        }}
                                        disabled={cIdx === effectiveColumns.length - 1}
                                        title="Geser kolom ke kanan"
                                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 transition-colors"
                                      >
                                        <MoveRight className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleColumn(col.key);
                                        }}
                                        title="Sembunyikan kolom ini"
                                        className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                      >
                                        <EyeOff className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="py-1 px-1.5 text-center whitespace-nowrap bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                              Aksi
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {isLoadingTable ? (
                            <tr>
                              <td colSpan={effectiveColumns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <RefreshCw className="w-6 h-6 animate-spin text-[#005E6A] dark:text-[#2dd4bf]" />
                                  <span className="text-xs font-bold">Memuat data dari Supabase (Limit {pageSize})...</span>
                                </div>
                              </td>
                            </tr>
                          ) : tableRows.length === 0 ? (
                            <tr>
                              <td colSpan={effectiveColumns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Info className="w-6 h-6 text-slate-400" />
                                  <span className="text-xs font-bold">Tidak ada data ditemukan.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            tableRows.map((row, rIdx) => {
                              const rowUniqueKey = row.id
                                ? `id-${row.id}-${rIdx}`
                                : `row-${(currentPage - 1) * pageSize + rIdx}-${row[selectedTable.primaryKey] || rIdx}`;
                              const isEditing = editingRowIndex === rIdx;

                              return (
                                <tr
                                  key={rowUniqueKey}
                                  className={`transition-colors ${
                                    isEditing
                                      ? "bg-amber-500/10 dark:bg-amber-500/10 border-l-4 border-amber-500"
                                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                                  }`}
                                >
                                  {/* Row Number */}
                                  <td className="py-1 px-1.5 text-center text-slate-400 font-mono text-[10px]">
                                    {(currentPage - 1) * pageSize + rIdx + 1}
                                  </td>

                                  {/* Columns / Fields */}
                                  {effectiveColumns.map((col) => {
                                    const cellVal = isEditing ? editRowValues[col.key] : row[col.key];

                                    return (
                                      <td key={col.key} className="py-1 px-1.5 whitespace-nowrap text-xs">
                                        {isEditing && !col.readOnly && col.key !== "id" && col.key !== "created_at" ? (
                                          /* INLINE EDIT MODE */
                                          col.type === "select" && col.options ? (
                                            <select
                                              value={cellVal ?? ""}
                                              onChange={(e) =>
                                                setEditRowValues((prev) => ({
                                                  ...prev,
                                                  [col.key]: e.target.value
                                                }))
                                              }
                                              className="w-full min-w-[100px] bg-white dark:bg-slate-800 border border-[#005E6A] dark:border-[#2dd4bf] rounded-md px-1.5 py-0.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                                            >
                                              {col.options.map((opt) => (
                                                <option key={opt} value={opt}>
                                                  {opt}
                                                </option>
                                              ))}
                                            </select>
                                          ) : col.type === "date" || col.key === "tanggal" || col.key === "jatuh_tempo" ? (
                                            <input
                                              type="date"
                                              value={cellVal ? formatDateForInput(cellVal) : new Date().toISOString().slice(0, 10)}
                                              onChange={(e) =>
                                                setEditRowValues((prev) => ({
                                                  ...prev,
                                                  [col.key]: e.target.value
                                                }))
                                              }
                                              className="w-full min-w-[100px] bg-white dark:bg-slate-800 border border-[#005E6A] dark:border-[#2dd4bf] rounded-md px-1.5 py-0.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                                            />
                                          ) : (
                                            <input
                                              type={col.type === "number" ? "number" : "text"}
                                              value={cellVal ?? ""}
                                              onChange={(e) =>
                                                setEditRowValues((prev) => ({
                                                  ...prev,
                                                  [col.key]: e.target.value
                                                }))
                                              }
                                              className="w-full min-w-[90px] bg-white dark:bg-slate-800 border border-[#005E6A] dark:border-[#2dd4bf] rounded-md px-1.5 py-0.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                                            />
                                          )
                                        ) : (
                                          /* NORMAL TEXT VIEW */
                                          <span
                                            className={
                                              col.type === "number"
                                                ? "font-mono font-bold text-slate-900 dark:text-slate-100"
                                                : col.key === "id"
                                                ? "font-mono text-[10px] text-slate-400 dark:text-slate-500 select-all"
                                                : col.key === selectedTable.primaryKey
                                                ? "font-mono font-bold text-[#005E6A] dark:text-[#2dd4bf]"
                                                : col.type === "date" || col.key === "tanggal" || col.key === "created_at"
                                                ? "font-mono text-slate-700 dark:text-slate-300"
                                                : "text-slate-700 dark:text-slate-300"
                                            }
                                          >
                                            {cellVal !== null && cellVal !== undefined
                                              ? col.type === "number"
                                              ? Number(cellVal).toLocaleString("id-ID")
                                              : col.type === "date" || col.key === "tanggal"
                                              ? formatDateForInput(String(cellVal))
                                              : typeof cellVal === "object"
                                              ? JSON.stringify(cellVal)
                                              : String(cellVal)
                                              : "-"}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {/* Action Buttons: Edit & Hapus (Inline & Modal) */}
                                  <td className="py-1 px-1.5 text-center whitespace-nowrap">
                                    {isEditing ? (
                                      /* SAVE / CANCEL BUTTONS */
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleSaveInlineEdit(row, rIdx)}
                                          disabled={isSavingRow}
                                          title="Simpan Perubahan"
                                          className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-bold transition-all shadow-sm disabled:opacity-50"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={handleCancelInlineEdit}
                                          disabled={isSavingRow}
                                          title="Batal"
                                          className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      /* EDIT / DELETE BUTTONS */
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditModal(row, rIdx)}
                                          title="Edit Data Baris Ini"
                                          className="p-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold transition-all flex items-center gap-0.5"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span className="text-[10px] font-bold">Edit</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRow(row, rIdx)}
                                          title="Hapus Baris Ini"
                                          className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold transition-all flex items-center gap-0.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span className="text-[10px] font-bold">Hapus</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">
                        Menampilkan{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {tableRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                        </strong>{" "}
                        -{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {Math.min(currentPage * pageSize, totalCount)}
                        </strong>{" "}
                        dari <strong className="text-slate-900 dark:text-white">{totalCount}</strong> baris data
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage <= 1 || isLoadingTable}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Sebelumnya
                        </button>

                        <div className="px-3 py-1.5 font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          Hal {currentPage} / {totalPages}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage >= totalPages || isLoadingTable}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          Selanjutnya
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ANALISA (TRAFIK BANDWIDTH SECARA DETAIL TIAP HALAMAN DALAM KB/MB)  */}
          {/* ========================================================================= */}
          {activeTab === "analisa" && (
            <motion.div
              key="tab-analisa-root"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Trafik Keluar
                    </span>
                    <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <HardDrive className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.formattedTotalSize}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {stats.totalBytes.toLocaleString("id-ID")} bytes ditransfer dari DB
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Eksekusi Query
                    </span>
                    <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.totalQueries.toLocaleString("id-ID")}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Operasi SELECT, RPC, & Mutasi
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Rata-Rata Latensi
                    </span>
                    <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.avgDurationMs}{" "}
                    <span className="text-xs font-bold text-slate-400">ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {stats.avgDurationMs < 300 ? "🟢 Kecepatan sangat baik" : "🟡 Latensi wajar"}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Optimasi Delta Sync
                    </span>
                    <span className="p-1.5 rounded-md bg-teal-500/10 text-[#005E6A] dark:text-[#2dd4bf]">
                      <Zap className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                    {formatByteSize(deltaSyncSavedBytes || 245000)}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Kapasitas bandwidth yang dihemat
                  </p>
                </div>
              </div>

              {/* Bandwidth by Page Table */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#005E6A] dark:text-[#2dd4bf]" />
                      Konsumsi Bandwidth per Halaman (KB / MB)
                    </h2>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {sortedPageStats.length} Halaman
                  </span>
                </div>

                {sortedPageStats.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Belum ada log trafik tercatat. Navigasikan aplikasi untuk mulai mencatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                          <th className="py-2.5 px-3">Nama Halaman & Rute</th>
                          <th className="py-2.5 px-3 text-center">Jumlah Query</th>
                          <th className="py-2.5 px-3 text-center">Baris Data</th>
                          <th className="py-2.5 px-3 text-center">Rata-Rata Latensi</th>
                          <th className="py-2.5 px-3 text-right">Total Trafik</th>
                          <th className="py-2.5 px-3 text-right">% Bandwidth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {sortedPageStats.map((pg, idx) => {
                          const percentage =
                            stats.totalBytes > 0
                              ? Math.round((pg.totalBytes / stats.totalBytes) * 100)
                              : 0;
                          return (
                            <tr key={pg.page} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                                    {idx + 1}
                                  </span>
                                  {pg.pageLabel}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono ml-6">
                                  {pg.page}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {pg.count}x
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {pg.rowCount.toLocaleString("id-ID")}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                <span className={`font-bold ${pg.avgMs > 1000 ? "text-rose-500" : pg.avgMs > 300 ? "text-amber-500" : "text-emerald-500"}`}>
                                  {pg.avgMs} ms
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="font-bold text-xs text-slate-900 dark:text-white">
                                  {pg.formattedSize}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right w-24">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="font-bold text-xs">{percentage}%</span>
                                  <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#005E6A] dark:bg-[#2dd4bf] rounded-full"
                                      style={{ width: `${Math.max(percentage, 3)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bandwidth by Table and Live Query Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Table Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <HardDrive className="w-4 h-4 text-[#005E6A] dark:text-[#2dd4bf]" />
                    Konsumsi Bandwidth per Tabel
                  </h2>

                  <div className="space-y-2">
                    {sortedTableStats.map((tbl) => {
                      const pct =
                        stats.totalBytes > 0
                          ? Math.round((tbl.totalBytes / stats.totalBytes) * 100)
                          : 0;
                      return (
                        <div key={tbl.table} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                              {tbl.table}
                            </span>
                            <span className="font-bold text-xs text-[#005E6A] dark:text-[#2dd4bf]">
                              {tbl.formattedSize}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                            <span>{tbl.count} query • {tbl.rowCount.toLocaleString("id-ID")} baris</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Query Log Stream */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#005E6A] dark:text-[#2dd4bf]" />
                      Riwayat Query ({filteredLogs.length})
                    </h2>
                    <select
                      value={selectedTableFilter}
                      onChange={(e) => setSelectedTableFilter(e.target.value)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 font-medium"
                    >
                      <option value="ALL">Semua Tabel</option>
                      {Object.keys(stats.byTable).map((tbl) => (
                        <option key={tbl} value={tbl}>{tbl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
                    {filteredLogs.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada log query.
                      </div>
                    ) : (
                      filteredLogs.slice(0, 80).map((log) => (
                        <div key={log.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex items-center justify-between gap-2">
                          <div className="space-y-0.5 truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {log.table}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px]">
                                {log.operation}
                              </span>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] text-emerald-600 bg-emerald-500/10">
                                ⚡ {log.durationMs}ms
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {log.page} • {log.filterSummary}
                            </div>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="font-black text-xs font-mono text-[#005E6A] dark:text-[#2dd4bf] block">
                              {log.formattedSize}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {log.rowCount} baris
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL 1: TAMBAH DATA BARIS BARU */}
        <AnimatePresence>
          {isAddRowModalOpen && selectedTable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#005E6A]/10 text-[#005E6A] dark:text-[#2dd4bf]">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Tambah Data: {selectedTable.label}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Tabel: {selectedTable.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddRowModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto max-h-[65vh]">
                  {effectiveColumns
                    .filter((c) => c.key !== "created_at" && c.key !== "id")
                    .map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">
                          {col.label} <span className="font-mono text-[9px] text-slate-400">({col.key})</span>
                        </label>
                        {col.key === "jenis" ? (
                          <select
                            value={newRowData[col.key] || JENIS_OPTIONS[0]}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.key]: e.target.value })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#005E6A]"
                          >
                            {JENIS_OPTIONS.map((j) => (
                              <option key={j} value={j}>{j}</option>
                            ))}
                          </select>
                        ) : col.key === "melalui" ? (
                          <select
                            value={newRowData[col.key] || MELALUI_OPTIONS[0]}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.key]: e.target.value })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#005E6A]"
                          >
                            {MELALUI_OPTIONS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        ) : col.key === "status" ? (
                          <select
                            value={newRowData[col.key] || STATUS_OPTIONS[0]}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.key]: e.target.value })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#005E6A]"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : col.key === "tanggal" || col.key === "jatuh_tempo" || col.type === "date" ? (
                          <input
                            type="date"
                            value={newRowData[col.key] || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.key]: e.target.value })}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#005E6A]"
                          />
                        ) : (
                          <input
                            type={col.type === "number" ? "number" : "text"}
                            value={newRowData[col.key] !== undefined ? newRowData[col.key] : ""}
                            onChange={(e) =>
                              setNewRowData({
                                ...newRowData,
                                [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value
                              })
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#005E6A]"
                          />
                        )}
                      </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAddRowModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveNewRow}
                    disabled={isSavingNewRow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-bold shadow-xs transition-all"
                  >
                    {isSavingNewRow ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan ke Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 2: EDIT DATA BARIS (FULL FORM) */}
        <AnimatePresence>
          {editingModalRow && selectedTable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-500/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Edit Data: {selectedTable.label}
                      </h3>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                        {selectedTable.primaryKey}: {editingModalRow[selectedTable.primaryKey] || editingModalRow.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingModalRow(null);
                      setEditingModalValues({});
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto max-h-[65vh]">
                  {effectiveColumns.map((col) => {
                    const isPk = col.key === selectedTable.primaryKey;
                    const isReadOnly = col.readOnly || col.key === "created_at" || col.key === "id";
                    const val = editingModalValues[col.key];

                    return (
                      <div key={col.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {col.label} <span className="font-mono text-[9px] text-slate-400">({col.key})</span>
                          </label>
                          {isReadOnly && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold">
                              Read Only
                            </span>
                          )}
                        </div>

                        {isReadOnly ? (
                          <div className="w-full text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-500 dark:text-slate-400 select-all">
                            {val !== undefined && val !== null ? String(val) : "-"}
                          </div>
                        ) : col.type === "select" && col.options ? (
                          <select
                            value={val ?? col.options[0]}
                            onChange={(e) =>
                              setEditingModalValues((prev) => ({
                                ...prev,
                                [col.key]: e.target.value
                              }))
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          >
                            {col.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : col.type === "number" ? (
                          <input
                            type="number"
                            value={val !== undefined ? val : 0}
                            onChange={(e) =>
                              setEditingModalValues((prev) => ({
                                ...prev,
                                [col.key]: Number(e.target.value)
                              }))
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        ) : col.type === "date" || col.key === "tanggal" || col.key === "jatuh_tempo" ? (
                          <input
                            type="date"
                            value={val ? String(val).slice(0, 10) : new Date().toISOString().slice(0, 10)}
                            onChange={(e) =>
                              setEditingModalValues((prev) => ({
                                ...prev,
                                [col.key]: e.target.value
                              }))
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={val !== undefined && val !== null ? String(val) : ""}
                            onChange={(e) =>
                              setEditingModalValues((prev) => ({
                                ...prev,
                                [col.key]: e.target.value
                              }))
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingModalRow(null);
                      setEditingModalValues({});
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveModalEdit}
                    disabled={isSavingModalEdit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    {isSavingModalEdit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: KONFIRMASI HAPUS DATA (CUSTOM MODAL DIALOG) */}
        <AnimatePresence>
          {rowToDelete && selectedTable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-lg shadow-2xl border border-rose-200 dark:border-rose-900/40 overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between bg-rose-500/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-600 text-white">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                        Konfirmasi Hapus Data
                      </h3>
                      <p className="text-[10px] text-rose-700 dark:text-rose-300">
                        Tabel: {selectedTable.label} ({selectedTable.name})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRowToDelete(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Apakah Anda yakin ingin menghapus data baris ini secara permanen dari database Supabase?
                  </p>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">{selectedTable.primaryKey}:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {rowToDelete[selectedTable.primaryKey] || rowToDelete.id || "-"}
                      </strong>
                    </div>
                    {rowToDelete.nama && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Nama:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-sans font-semibold">
                          {rowToDelete.nama}
                        </span>
                      </div>
                    )}
                    {rowToDelete.tanggal && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Tanggal:</span>
                        <span className="text-slate-600 dark:text-slate-400">{rowToDelete.tanggal}</span>
                      </div>
                    )}
                    {rowToDelete.pemasukan !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Pemasukan:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Rp {Number(rowToDelete.pemasukan).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Tindakan ini langsung menghapus data di Supabase dan tidak dapat dibatalkan.</span>
                  </p>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRowToDelete(null)}
                    disabled={isDeletingRow}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDeleteRow}
                    disabled={isDeletingRow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    {isDeletingRow ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ya, Hapus Data</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 4: KELOLA VISIBILITAS & URUTAN KOLOM */}
        <AnimatePresence>
          {isColumnManagerOpen && selectedTable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#005E6A] text-white">
                      <Columns className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Kelola Kolom Tabel
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedTable.label} • {effectiveColumns.length} aktif dari {orderedAllColumns.length} kolom
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsColumnManagerOpen(false);
                      setColumnSearchQuery("");
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Toolbar Presets & Search */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/40 dark:bg-slate-800/30">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={handleShowAllColumns}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Tampilkan Semua ({orderedAllColumns.length})
                    </button>
                    <button
                      onClick={handleHideNonEssentialColumns}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors"
                    >
                      Sederhanakan (Kolom Utama)
                    </button>
                    <button
                      onClick={handleResetColumns}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Standar
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter kolom..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>

                {/* Column Items List */}
                <div className="p-3 space-y-1.5 overflow-y-auto max-h-[55vh]">
                  {orderedAllColumns
                    .filter((col) => {
                      if (!columnSearchQuery.trim()) return true;
                      const q = columnSearchQuery.toLowerCase();
                      return col.label.toLowerCase().includes(q) || col.key.toLowerCase().includes(q);
                    })
                    .map((col, idx) => {
                      const isVisible = !hiddenColumns.includes(col.key);
                      const isPk = col.key === selectedTable.primaryKey;
                      const isOriginalFirst = idx === 0;
                      const isOriginalLast = idx === orderedAllColumns.length - 1;

                      return (
                        <div
                          key={col.key}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                            isVisible
                              ? "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-60"
                          }`}
                        >
                          {/* Left: Visibility Checkbox & Details */}
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none mr-2">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => handleToggleColumn(col.key)}
                              className="w-4 h-4 rounded text-[#005E6A] focus:ring-[#005E6A] cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold ${isVisible ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 line-through"}`}>
                                  {col.label}
                                </span>
                                {isPk && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                                    PK
                                  </span>
                                )}
                                {col.readOnly && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                    ReadOnly
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{col.key}</span>
                                <span>•</span>
                                <span className="uppercase text-[9px]">{col.type}</span>
                              </div>
                            </div>
                          </label>

                          {/* Right: Reorder Up / Down Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(col.key, "left")}
                              disabled={isOriginalFirst}
                              title="Geser urutan ke atas (ke kiri pada tabel)"
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(col.key, "right")}
                              disabled={isOriginalLast}
                              title="Geser urutan ke bawah (ke kanan pada tabel)"
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Otomatis disimpan di browser
                  </span>
                  <button
                    onClick={() => {
                      setIsColumnManagerOpen(false);
                      setColumnSearchQuery("");
                    }}
                    className="px-4 py-2 rounded-lg bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Selesai
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
