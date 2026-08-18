import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Info
} from "lucide-react";
import {
  SupabaseQueryLogger,
  SupabaseQueryLog,
  SupabaseQueryStats,
  formatByteSize,
  getSupabaseClient
} from "../lib/supabase";

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
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

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
  columns: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: string[];
    readOnly?: boolean;
  }>;
}

const DATABASE_TABLES: TableMeta[] = [
  {
    id: "customers",
    name: "customers",
    label: "Pelanggan",
    description: "Data profil nasabah, no WhatsApp, level loyalitas, dan saldo poin",
    icon: Users,
    color: "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    primaryKey: "id_pelanggan",
    searchColumn: "nama",
    columns: [
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text", readOnly: true },
      { key: "nama", label: "Nama Lengkap", type: "text" },
      { key: "nomor_hp", label: "No. WhatsApp / HP", type: "text" },
      { key: "poin", label: "Poin Aktif", type: "number" },
      { key: "level", label: "Level Member", type: "select", options: ["Bronze", "Silver", "Gold", "Platinum", "VIP"] },
      { key: "status", label: "Status Akun", type: "select", options: ["Aktif", "Non-Aktif", "Baru"] },
      { key: "created_at", label: "Terdaftar", type: "text", readOnly: true }
    ]
  },
  {
    id: "sales_transactions",
    name: "sales_transactions",
    label: "Transaksi Penjualan",
    description: "Rekap transaksi kasir, pemasukan, modal, jenis layanan, dan status",
    icon: ShoppingCart,
    color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    primaryKey: "id_transaksi",
    searchColumn: "nama",
    columns: [
      { key: "id_transaksi", label: "ID Transaksi", type: "text", readOnly: true },
      { key: "tanggal", label: "Tanggal", type: "text" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "jenis", label: "Jenis Layanan", type: "select", options: JENIS_OPTIONS },
      { key: "pemasukan", label: "Pemasukan (Rp)", type: "number" },
      { key: "harga_modal", label: "Harga Modal (Rp)", type: "number" },
      { key: "poin", label: "Poin Didapat", type: "number" },
      { key: "metode", label: "Metode", type: "text" },
      { key: "melalui", label: "Melalui", type: "select", options: MELALUI_OPTIONS },
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      { key: "created_at", label: "Waktu Input", type: "text", readOnly: true }
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
      { key: "id_barang", label: "ID / Kode Barang", type: "text", readOnly: true },
      { key: "nama", label: "Nama Barang", type: "text" },
      { key: "kategori", label: "Kategori", type: "text" },
      { key: "stok", label: "Jumlah Stok", type: "number" },
      { key: "satuan", label: "Satuan", type: "text" },
      { key: "harga_modal", label: "Harga Beli/Modal (Rp)", type: "number" },
      { key: "harga_jual", label: "Harga Jual (Rp)", type: "number" },
      { key: "min_stok", label: "Batas Min. Stok", type: "number" },
      { key: "created_at", label: "Dibuat", type: "text", readOnly: true }
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
      { key: "id_tabungan", label: "ID Tabungan", type: "text", readOnly: true },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "text" },
      { key: "nama", label: "Nama Nasabah", type: "text" },
      { key: "tipe", label: "Tipe Mutasi", type: "select", options: ["SETOR", "TARIK"] },
      { key: "nominal", label: "Nominal (Rp)", type: "number" },
      { key: "saldo_akhir", label: "Saldo Akhir (Rp)", type: "number" },
      { key: "berita", label: "Keterangan / Berita", type: "text" },
      { key: "created_at", label: "Waktu Input", type: "text", readOnly: true }
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
      { key: "id_hutang", label: "ID Hutang", type: "text", readOnly: true },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "text" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "tipe", label: "Tipe Transaksi", type: "select", options: ["KASBON", "TAMBAH", "BAYAR", "LUNAS"] },
      { key: "jumlah", label: "Jumlah (Rp)", type: "number" },
      { key: "saldo_akhir", label: "Sisa Hutang (Rp)", type: "number" },
      { key: "keterangan", label: "Keterangan", type: "text" },
      { key: "created_at", label: "Waktu Input", type: "text", readOnly: true }
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
      { key: "id_tukar", label: "ID Klaim Tukar", type: "text", readOnly: true },
      { key: "id_pelanggan", label: "ID Pelanggan", type: "text" },
      { key: "tanggal", label: "Tanggal", type: "text" },
      { key: "nama", label: "Nama Pelanggan", type: "text" },
      { key: "poin", label: "Poin Ditukar", type: "number" },
      { key: "hadiah", label: "Hadiah / Voucher", type: "text" },
      { key: "created_at", label: "Waktu Klaim", type: "text", readOnly: true }
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
      { key: "id_investasi", label: "ID Investasi", type: "text", readOnly: true },
      { key: "tanggal", label: "Tanggal", type: "text" },
      { key: "nama", label: "Nama Investor", type: "text" },
      { key: "tipe", label: "Tipe", type: "select", options: ["SETOR", "TARIK", "BAGI HASIL"] },
      { key: "nominal", label: "Nominal (Rp)", type: "number" },
      { key: "saldo_akhir", label: "Saldo Akhir (Rp)", type: "number" },
      { key: "keterangan", label: "Keterangan", type: "text" },
      { key: "created_at", label: "Waktu Input", type: "text", readOnly: true }
    ]
  }
];

const PAGE_SIZE = 20;

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
  const [activeTab, setActiveTab] = useState<"data" | "analisa">("data");
  
  // Table Explorer States
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [deltaSyncSavedBytes, setDeltaSyncSavedBytes] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingLocal, setIsSyncingLocal] = useState<boolean>(false);

  // Add Row Modal State
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState<boolean>(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isSavingNewRow, setIsSavingNewRow] = useState<boolean>(false);

  // Sorting State: Default to "created_at" DESC (Data Terbaru ke Paling Lama)
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Inline & Modal Row Editing States
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowValues, setEditRowValues] = useState<Record<string, any>>({});
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);

  // Edit Modal State
  const [editingModalRow, setEditingModalRow] = useState<any | null>(null);
  const [editingModalValues, setEditingModalValues] = useState<Record<string, any>>({});
  const [isSavingModalEdit, setIsSavingModalEdit] = useState<boolean>(false);

  // Custom Delete Modal State (Replaces window.confirm for iframe reliability)
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);
  const [isDeletingRow, setIsDeletingRow] = useState<boolean>(false);

  // Traffic Analytics States
  const [stats, setStats] = useState<SupabaseQueryStats>(SupabaseQueryLogger.getStats());
  const [logs, setLogs] = useState<SupabaseQueryLog[]>(SupabaseQueryLogger.getLogs());
  const [searchLog, setSearchLog] = useState("");
  const [selectedTableFilter, setSelectedTableFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Fetch Table Rows with Limit 20 + Delta Sync Caching + Default Newest First Sorting
  const fetchTableData = useCallback(async (
    tbl: TableMeta,
    page: number = 1,
    query: string = "",
    isDeltaRefresh: boolean = false,
    orderColOverride?: string,
    orderAscOverride?: boolean
  ) => {
    const client = getSupabaseClient();
    if (!client) {
      showToast("Supabase belum dikonfigurasi.");
      return;
    }

    setIsLoadingTable(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const effectiveSortCol = orderColOverride !== undefined ? orderColOverride : sortColumn;
    const effectiveSortAsc = orderAscOverride !== undefined ? orderAscOverride : sortAscending;

    try {
      await SupabaseQueryLogger.track(
        tbl.name,
        "SELECT",
        {
          page,
          limit: PAGE_SIZE,
          search: query,
          deltaSync: isDeltaRefresh,
          orderBy: `${effectiveSortCol} ${effectiveSortAsc ? "ASC" : "DESC"}`
        },
        async () => {
          let req = client
            .from(tbl.name)
            .select("*", { count: "exact" });

          // Apply server-side search if user typed search query
          if (query.trim() !== "") {
            req = req.ilike(tbl.searchColumn, `%${query.trim()}%`);
          }

          // Order by: Urutkan timestamp created_at (DESC) agar data hari ini masuk di Halaman 1
          const hasCreatedAt = tbl.columns.some(c => c.key === "created_at");

          if (effectiveSortCol === "created_at" || effectiveSortCol === "tanggal") {
            if (hasCreatedAt) {
              req = req.order("created_at", { ascending: effectiveSortAsc, nullsFirst: false });
            }
            req = req.order(tbl.primaryKey, { ascending: false });
          } else {
            req = req
              .order(effectiveSortCol, { ascending: effectiveSortAsc, nullsFirst: false });
            if (hasCreatedAt) {
              req = req.order("created_at", { ascending: false, nullsFirst: false });
            }
            req = req.order(tbl.primaryKey, { ascending: false });
          }

          req = req.range(from, to);

          const { data, count, error } = await req;

          if (error) {
            console.error(`Gagal memuat tabel ${tbl.name}:`, error);
            showToast(`Error: ${error.message}`);
            return { data: null, error };
          }

          // Sort rows: Tanggal transaksi riil terbaru -> Waktu input data terbaru (created_at) -> ID DESC
          const sortedData = [...(data || [])].sort((a, b) => {
            if (effectiveSortCol !== "tanggal" && effectiveSortCol !== "created_at" && a[effectiveSortCol] !== undefined) {
              const valA = a[effectiveSortCol];
              const valB = b[effectiveSortCol];
              if (typeof valA === "number" && typeof valB === "number") {
                if (valA !== valB) return effectiveSortAsc ? valA - valB : valB - valA;
              } else {
                const cmp = String(valA || "").localeCompare(String(valB || ""));
                if (cmp !== 0) return effectiveSortAsc ? cmp : -cmp;
              }
            }

            // 1. Tanggal transaksi riil (menggunakan nilai parsed numeric timestamp sehingga 18/08/2026 selalu > 31/01/2026)
            const dtA = parseRowDateValue(a.tanggal) || parseRowCreatedAt(a.created_at);
            const dtB = parseRowDateValue(b.tanggal) || parseRowCreatedAt(b.created_at);
            if (dtA !== dtB) {
              return effectiveSortAsc ? dtA - dtB : dtB - dtA;
            }

            // 2. Data terbaru masuk (created_at timestamp)
            const crA = parseRowCreatedAt(a.created_at);
            const crB = parseRowCreatedAt(b.created_at);
            if (crA !== crB) {
              return effectiveSortAsc ? crA - crB : crB - crA;
            }

            // 3. Primary Key
            const pkA = String(a[tbl.primaryKey] || a.id || "");
            const pkB = String(b[tbl.primaryKey] || b.id || "");
            return effectiveSortAsc ? pkA.localeCompare(pkB) : pkB.localeCompare(pkA);
          });

          setTableRows(sortedData);
          if (count !== null && count !== undefined) {
            setTotalCount(count);
          }

          // Calculate bandwidth savings with delta sync & limit 20
          const estimatedFullTableSize = (count || 50) * 450;
          const paginatedSize = (data?.length || 0) * 450;
          const saved = Math.max(0, estimatedFullTableSize - paginatedSize);
          setDeltaSyncSavedBytes(prev => prev + saved);
          setLastSyncTime(new Date().toLocaleTimeString("id-ID"));

          return { data, error: null };
        }
      );
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || "Gagal mengambil data."}`);
    } finally {
      setIsLoadingTable(false);
    }
  }, [sortColumn, sortAscending]);

  // When selectedTable, currentPage, sortColumn, or sortAscending changes, fetch table rows
  useEffect(() => {
    if (selectedTable) {
      setEditingRowId(null);
      setEditRowValues({});
      fetchTableData(selectedTable, currentPage, tableSearchQuery, false, sortColumn, sortAscending);
    }
  }, [selectedTable, currentPage, sortColumn, sortAscending, fetchTableData]);

  // Handle Search Input (debounce)
  useEffect(() => {
    if (!selectedTable) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTableData(selectedTable, 1, tableSearchQuery, false, sortColumn, sortAscending);
    }, 400);
    return () => clearTimeout(timer);
  }, [tableSearchQuery, selectedTable, sortColumn, sortAscending, fetchTableData]);

  // Toggle sort direction or change sort column
  const handleSortBy = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortAscending(prev => !prev);
    } else {
      setSortColumn(columnKey);
      setSortAscending(false); // Default to DESC (terbaru ke terlama)
    }
    setCurrentPage(1);
  };

  // Open Table Explorer View
  const handleOpenTable = (tbl: TableMeta) => {
    setSelectedTable(tbl);
    setCurrentPage(1);
    setTableSearchQuery("");
    setSortColumn("created_at");
    setSortAscending(false); // Selalu mulai dari Data Terbaru ke Terlama
    setEditingRowId(null);
    setEditRowValues({});
  };

  // Back to Table Grid View
  const handleBackToGrid = () => {
    setSelectedTable(null);
    setTableRows([]);
    setEditingRowId(null);
    setEditRowValues({});
  };

  // Start Inline Editing for a Row
  const handleStartInlineEdit = (row: any) => {
    const rowId = String(row[selectedTable?.primaryKey || "id"] || row.id || row.id_pelanggan || row.id_transaksi || row.kode_barang);
    setEditingRowId(rowId);
    setEditRowValues({ ...row });
  };

  // Cancel Inline Editing
  const handleCancelInlineEdit = () => {
    setEditingRowId(null);
    setEditRowValues({});
  };

  // Open Full Edit Modal
  const handleOpenEditModal = (row: any) => {
    setEditingModalRow(row);
    setEditingModalValues({ ...row });
  };

  // Save Inline Row Edit directly to Supabase
  const handleSaveInlineEdit = async (row: any) => {
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
          // Prepare clean payload with only allowed editable columns
          const cleanPayload: Record<string, any> = {};
          selectedTable.columns.forEach((col) => {
            if (col.key !== "created_at" && col.key !== "id" && !col.readOnly) {
              if (col.type === "number") {
                cleanPayload[col.key] = Number(editRowValues[col.key] || 0);
              } else if (editRowValues[col.key] !== undefined) {
                cleanPayload[col.key] = String(editRowValues[col.key]).trim();
              }
            }
          });

          let updateQuery = client.from(selectedTable.name).update(cleanPayload);
          if (row[pkKey]) {
            updateQuery = updateQuery.eq(pkKey, row[pkKey]);
          } else if (row.id) {
            updateQuery = updateQuery.eq("id", row.id);
          }

          const { data, error } = await updateQuery.select();

          if (error) {
            console.error("Gagal update data:", error);
            showToast(`Gagal menyimpan: ${error.message}`);
            return { data: null, error };
          }

          // Update local state instantly
          setTableRows((prev) =>
            prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
          );

          // Update parent state
          if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
            setSalesTransactions((prev) =>
              prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "customers" && setCustomers) {
            setCustomers((prev) =>
              prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
            setSavingsTransactions((prev) =>
              prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
            );
          } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
            setDebtTransactions((prev) =>
              prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
            );
          }

          setEditingRowId(null);
          setEditRowValues({});
          showToast(`✅ Baris [${pkVal}] berhasil diperbarui di database!`);
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
      selectedTable.columns.forEach((col) => {
        if (col.key !== "created_at" && col.key !== "id" && !col.readOnly) {
          if (col.type === "number") {
            cleanPayload[col.key] = Number(editingModalValues[col.key] || 0);
          } else if (editingModalValues[col.key] !== undefined) {
            cleanPayload[col.key] = String(editingModalValues[col.key]).trim();
          }
        }
      });

      let q = client.from(selectedTable.name).update(cleanPayload);
      if (editingModalRow[pkKey]) {
        q = q.eq(pkKey, editingModalRow[pkKey]);
      } else if (editingModalRow.id) {
        q = q.eq("id", editingModalRow.id);
      }

      const { error } = await q;
      if (error) throw error;

      // Update local state instantly
      setTableRows((prev) =>
        prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
      );

      // Update parent state
      if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
        setSalesTransactions((prev) =>
          prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "customers" && setCustomers) {
        setCustomers((prev) =>
          prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
        setSavingsTransactions((prev) =>
          prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
        );
      } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
        setDebtTransactions((prev) =>
          prev.map((r) => ((r[pkKey] || r.id) === pkVal ? { ...r, ...cleanPayload } : r))
        );
      }

      showToast(`✅ Data [${pkVal}] berhasil disimpan ke Supabase!`);
      setEditingModalRow(null);
      setEditingModalValues({});
    } catch (err: any) {
      console.error("Gagal simpan edit modal:", err);
      showToast(`Gagal menyimpan: ${err.message || "Terjadi kesalahan."}`);
    } finally {
      setIsSavingModalEdit(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteRow = (row: any) => {
    setRowToDelete(row);
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

    try {
      await SupabaseQueryLogger.track(
        selectedTable.name,
        "DELETE",
        { pkKey, pkVal },
        async () => {
          let delQ = client.from(selectedTable.name).delete();
          if (rowToDelete[pkKey]) {
            delQ = delQ.eq(pkKey, rowToDelete[pkKey]);
          } else if (rowToDelete.id) {
            delQ = delQ.eq("id", rowToDelete.id);
          }

          const { error } = await delQ;

          if (error) {
            console.error("Gagal menghapus baris:", error);
            showToast(`Gagal menghapus: ${error.message}`);
            return { data: null, error };
          }

          setTableRows((prev) => prev.filter((r) => (r[pkKey] || r.id) !== pkVal));
          setTotalCount((prev) => Math.max(0, prev - 1));

          // Update parent state
          if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
            setSalesTransactions((prev) => prev.filter((r) => (r[pkKey] || r.id) !== pkVal));
          } else if (selectedTable.name === "customers" && setCustomers) {
            setCustomers((prev) => prev.filter((r) => (r[pkKey] || r.id) !== pkVal));
          } else if (selectedTable.name === "savings_transactions" && setSavingsTransactions) {
            setSavingsTransactions((prev) => prev.filter((r) => (r[pkKey] || r.id) !== pkVal));
          } else if (selectedTable.name === "debt_transactions" && setDebtTransactions) {
            setDebtTransactions((prev) => prev.filter((r) => (r[pkKey] || r.id) !== pkVal));
          }

          showToast(`🗑️ Baris [${pkVal}] telah dihapus dari tabel ${selectedTable.label}.`);
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
      initialValues["id_transaksi"] = `TRX-0000/${(totalCount || 0) + 1}-${timeSlice}`;
      initialValues["id_pelanggan"] = "CUST-0000";
      initialValues["tanggal"] = now.toISOString().slice(0, 10);
      initialValues["nama"] = "Pelanggan Umum";
      initialValues["jenis"] = "TARIK TUNAI";
      initialValues["melalui"] = "EDC BNI";
      initialValues["metode"] = "TUNAI";
      initialValues["pemasukan"] = 100000;
      initialValues["harga_modal"] = 97000;
      initialValues["sebagian"] = 0;
      initialValues["poin"] = 10;
      initialValues["status"] = "SELESAI";
    } else if (selectedTable.name === "customers") {
      initialValues["id_pelanggan"] = `CUST-${String((totalCount || 0) + 1).padStart(4, "0")}`;
      initialValues["nama"] = "";
      initialValues["no_hp"] = "-";
      initialValues["alamat"] = "-";
      initialValues["hutang"] = 0;
      initialValues["tabungan"] = 0;
      initialValues["poin"] = 0;
    } else {
      selectedTable.columns.forEach((c) => {
        if (c.key !== "created_at" && c.key !== "id") {
          initialValues[c.key] = c.type === "number" ? 0 : "";
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
      selectedTable.columns.forEach((c) => {
        if (c.key === "created_at" && !newRowData[c.key]) return;
        if (c.type === "number") {
          cleanPayload[c.key] = Number(newRowData[c.key] || 0);
        } else {
          cleanPayload[c.key] = newRowData[c.key] !== undefined ? String(newRowData[c.key]).trim() : "";
        }
      });

      const { data, error } = await client.from(selectedTable.name).insert(cleanPayload).select();
      if (error) throw error;

      if (selectedTable.name === "sales_transactions" && setSalesTransactions) {
        setSalesTransactions((prev) => [cleanPayload as any, ...prev]);
      }

      showToast(`✅ Berhasil menambahkan data baru ke tabel ${selectedTable.label}!`);
      setIsAddRowModalOpen(false);
      await fetchTableData(selectedTable, 1, tableSearchQuery);
    } catch (err: any) {
      console.error("Gagal simpan baris baru ke Supabase:", err);
      showToast(`Gagal menyimpan: ${err.message || "Terjadi kesalahan."}`);
    } finally {
      setIsSavingNewRow(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
    <div id="admin-database-page-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 sm:p-5 lg:p-6">
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

      {/* TOPMOST TAB BAR */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {/* Main 2 Tabs */}
          <div className="flex items-center gap-2">
            <button
              id="tab-btn-data"
              onClick={() => {
                setActiveTab("data");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === "data"
                  ? "bg-[#005E6A] text-white shadow-xs dark:bg-[#2dd4bf] dark:text-slate-950"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className="w-4 h-4" />
              Data
              {selectedTable && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 dark:bg-black/20">
                  {selectedTable.label}
                </span>
              )}
            </button>

            <button
              id="tab-btn-analisa"
              onClick={() => setActiveTab("analisa")}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === "analisa"
                  ? "bg-[#005E6A] text-white shadow-xs dark:bg-[#2dd4bf] dark:text-slate-950"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analisa
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 text-xs">
            {activeTab === "analisa" && (
              <>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg border transition-all ${
                    autoRefresh
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
                  {autoRefresh ? "Live" : "Jeda"}
                </button>
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
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

                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {selectedTable.label}
                        </h2>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {totalCount} baris
                        </span>
                      </div>
                    </div>

                    {/* Right Tools: Tambah Data + Refresh + Search */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenAddModal}
                        title={`Tambah data baru`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tambah Data</span>
                      </button>

                      <button
                        onClick={() => fetchTableData(selectedTable, currentPage, tableSearchQuery, true)}
                        disabled={isLoadingTable}
                        title="Segarkan data"
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
                          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1.5 font-medium w-36 sm:w-48 focus:outline-none focus:border-[#005E6A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Responsive Table Container */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 text-center w-12">No</th>
                            {selectedTable.columns.map((col) => {
                              const isSorted = sortColumn === col.key;
                              return (
                                <th
                                  key={col.key}
                                  onClick={() => handleSortBy(col.key)}
                                  className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group select-none"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>{col.label}</span>
                                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                                      {isSorted ? (sortAscending ? "▲" : "▼") : "↕"}
                                    </span>
                                  </div>
                                  <span className="block font-mono text-[9px] font-normal text-slate-400">
                                    {col.key}
                                  </span>
                                </th>
                              );
                            })}
                            <th className="py-3 px-3.5 text-center whitespace-nowrap w-28">
                              Aksi
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {isLoadingTable ? (
                            <tr>
                              <td colSpan={selectedTable.columns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <RefreshCw className="w-6 h-6 animate-spin text-[#005E6A] dark:text-[#2dd4bf]" />
                                  <span className="text-xs font-bold">Mengambil data dari Supabase (Limit 20 & Delta Sync)...</span>
                                </div>
                              </td>
                            </tr>
                          ) : tableRows.length === 0 ? (
                            <tr>
                              <td colSpan={selectedTable.columns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Info className="w-6 h-6 text-slate-400" />
                                  <span className="text-xs font-bold">Tidak ada data ditemukan.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            tableRows.map((row, rIdx) => {
                              const pkKey = selectedTable.primaryKey;
                              const pkVal = String(row[pkKey] || row.id || rIdx);
                              const isEditing = editingRowId === pkVal;

                              return (
                                <tr
                                  key={pkVal}
                                  className={`transition-colors ${
                                    isEditing
                                      ? "bg-amber-500/10 dark:bg-amber-500/10 border-l-4 border-amber-500"
                                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                                  }`}
                                >
                                  {/* Row Number */}
                                  <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                                    {(currentPage - 1) * PAGE_SIZE + rIdx + 1}
                                  </td>

                                  {/* Columns / Fields */}
                                  {selectedTable.columns.map((col) => {
                                    const cellVal = isEditing ? editRowValues[col.key] : row[col.key];

                                    return (
                                      <td key={col.key} className="py-2.5 px-3.5 whitespace-nowrap">
                                        {isEditing && !col.readOnly ? (
                                          /* INLINE EDIT MODE (NO MODAL) */
                                          col.type === "select" && col.options ? (
                                            <select
                                              value={cellVal ?? ""}
                                              onChange={(e) =>
                                                setEditRowValues((prev) => ({
                                                  ...prev,
                                                  [col.key]: e.target.value
                                                }))
                                              }
                                              className="w-full min-w-[130px] bg-white dark:bg-slate-800 border border-[#005E6A] dark:border-[#2dd4bf] rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                                            >
                                              {col.options.map((opt) => (
                                                <option key={opt} value={opt}>
                                                  {opt}
                                                </option>
                                              ))}
                                            </select>
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
                                              className="w-full min-w-[120px] bg-white dark:bg-slate-800 border border-[#005E6A] dark:border-[#2dd4bf] rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                                            />
                                          )
                                        ) : (
                                          /* NORMAL TEXT VIEW */
                                          <span
                                            className={
                                              col.type === "number"
                                                ? "font-mono font-bold text-slate-900 dark:text-slate-100"
                                                : col.key === selectedTable.primaryKey
                                                ? "font-mono font-bold text-[#005E6A] dark:text-[#2dd4bf]"
                                                : "text-slate-700 dark:text-slate-300"
                                            }
                                          >
                                            {cellVal !== null && cellVal !== undefined
                                              ? col.type === "number"
                                                ? Number(cellVal).toLocaleString("id-ID")
                                                : String(cellVal)
                                              : "-"}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {/* Action Buttons: Edit & Hapus (Inline) */}
                                  <td className="py-2.5 px-3.5 text-center">
                                    {isEditing ? (
                                      /* SAVE / CANCEL BUTTONS */
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleSaveInlineEdit(row)}
                                          disabled={isSavingRow}
                                          title="Simpan Perubahan"
                                          className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-bold transition-all shadow-sm disabled:opacity-50"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={handleCancelInlineEdit}
                                          disabled={isSavingRow}
                                          title="Batal"
                                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      /* EDIT / DELETE BUTTONS */
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenEditModal(row)}
                                          title="Edit Data Baris Ini"
                                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold transition-all flex items-center gap-1"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                          <span className="text-[10px] hidden xl:inline font-bold">Edit</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRow(row)}
                                          title="Hapus Baris Ini"
                                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold transition-all flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span className="text-[10px] hidden xl:inline font-bold">Hapus</span>
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

                    {/* Pagination Bar (Limit 20) */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">
                        Menampilkan{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {tableRows.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
                        </strong>{" "}
                        -{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {Math.min(currentPage * PAGE_SIZE, totalCount)}
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
                  {selectedTable.columns
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
                        ) : col.key === "tanggal" ? (
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
                  {selectedTable.columns.map((col) => {
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
                        ) : col.type === "date" || col.key === "tanggal" ? (
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
      </div>
    </div>
  );
};
