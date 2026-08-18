-- ==============================================================================
-- SUPABASE RPC FUNCTIONS / STORED PROCEDURES (REVISED)
-- Jalankan skrip ini di Supabase SQL Editor untuk memperbarui fungsi RPC
-- ==============================================================================

-- 1. Hitung Valuasi dan Status Stok Barang
CREATE OR REPLACE FUNCTION public.calculate_stock_valuation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_items INT := 0;
  v_total_stock INT := 0;
  v_total_asset_beli NUMERIC := 0;
  v_total_asset_jual NUMERIC := 0;
  v_low_stock_count INT := 0;
  v_out_of_stock_count INT := 0;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(jumlah_stok), 0),
    COALESCE(SUM(jumlah_stok * harga_beli), 0),
    COALESCE(SUM(jumlah_stok * harga_jual), 0),
    COUNT(*) FILTER (WHERE jumlah_stok > 0 AND jumlah_stok <= COALESCE(min_stok, 5)),
    COUNT(*) FILTER (WHERE jumlah_stok <= 0)
  INTO 
    v_total_items,
    v_total_stock,
    v_total_asset_beli,
    v_total_asset_jual,
    v_low_stock_count,
    v_out_of_stock_count
  FROM public.stock_items;

  RETURN jsonb_build_object(
    'total_items', v_total_items,
    'total_stock', v_total_stock,
    'total_asset_beli', v_total_asset_beli,
    'total_asset_jual', v_total_asset_jual,
    'potential_profit', (v_total_asset_jual - v_total_asset_beli),
    'low_stock_count', v_low_stock_count,
    'out_of_stock_count', v_out_of_stock_count
  );
END;
$$;

-- 2. Hitung Poin Aktif Loyalitas Pelanggan (dengan aturan 1 Nov 2025 & Expiry 1 Tahun)
CREATE OR REPLACE FUNCTION public.calculate_customer_active_points(
  p_customer_name TEXT,
  p_customer_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE := '2025-11-01'::DATE;
  v_now DATE := CURRENT_DATE;
  v_earned_points INT := 0;
  v_expired_points INT := 0;
  v_redeemed_points INT := 0;
  v_active_points INT := 0;
  r RECORD;
  v_trx_date DATE;
  v_points INT;
BEGIN
  -- Hitung poin dari transaksi penjualan
  FOR r IN 
    SELECT tanggal, pemasukan 
    FROM public.sales_transactions
    WHERE (
      (p_customer_id IS NOT NULL AND LOWER(id_pelanggan) = LOWER(p_customer_id))
      OR (LOWER(nama) = LOWER(p_customer_name))
    )
  LOOP
    BEGIN
      v_trx_date := r.tanggal::DATE;
    EXCEPTION WHEN OTHERS THEN
      v_trx_date := NULL;
    END;

    IF v_trx_date IS NOT NULL AND v_trx_date >= v_start_date THEN
      v_points := FLOOR(COALESCE(r.pemasukan, 0) / 10000);
      v_earned_points := v_earned_points + v_points;
      
      IF (v_trx_date + INTERVAL '1 year') < v_now THEN
        v_expired_points := v_expired_points + v_points;
      END IF;
    END IF;
  END LOOP;

  -- Hitung poin yang sudah ditukarkan
  SELECT COALESCE(SUM(poin), 0)
  INTO v_redeemed_points
  FROM public.redeemed_points
  WHERE (
    (p_customer_id IS NOT NULL AND LOWER(id_pelanggan) = LOWER(p_customer_id))
    OR (LOWER(nama) = LOWER(p_customer_name))
  );

  v_active_points := GREATEST(0, (v_earned_points - v_expired_points - v_redeemed_points));

  RETURN jsonb_build_object(
    'active_points', v_active_points,
    'earned_points', v_earned_points,
    'expired_points', v_expired_points,
    'redeemed_points', v_redeemed_points
  );
END;
$$;

-- 3. Hitung Ringkasan Arus Kas (Cashflow Summary - Fixed column matching)
CREATE OR REPLACE FUNCTION public.calculate_cashflow_summary(
  p_time_filter TEXT DEFAULT 'Bulan ini',
  p_custom_date TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sales_inflow NUMERIC := 0;
  v_sales_outflow NUMERIC := 0;
  v_savings_inflow NUMERIC := 0;
  v_savings_outflow NUMERIC := 0;
  v_debt_inflow NUMERIC := 0;
  v_debt_outflow NUMERIC := 0;
  v_total_inflow NUMERIC := 0;
  v_total_outflow NUMERIC := 0;
  v_net NUMERIC := 0;
BEGIN
  -- Pemasukan & modal dari penjualan
  SELECT 
    COALESCE(SUM(pemasukan), 0),
    COALESCE(SUM(harga_modal), 0)
  INTO v_sales_inflow, v_sales_outflow
  FROM public.sales_transactions;

  -- Inflow/outflow tabungan (menggunakan kolom nominal)
  SELECT 
    COALESCE(SUM(CASE WHEN UPPER(tipe) = 'SETOR' THEN COALESCE((to_jsonb(t)->>'nominal')::numeric, 0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN UPPER(tipe) = 'TARIK' THEN COALESCE((to_jsonb(t)->>'nominal')::numeric, 0) ELSE 0 END), 0)
  INTO v_savings_inflow, v_savings_outflow
  FROM public.savings_transactions t;

  -- Inflow/outflow hutang (mendukung kolom jumlah maupun nominal)
  SELECT 
    COALESCE(SUM(CASE WHEN UPPER(tipe) IN ('BAYAR', 'LUNAS') THEN COALESCE((to_jsonb(d)->>'jumlah')::numeric, (to_jsonb(d)->>'nominal')::numeric, 0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN UPPER(tipe) IN ('TAMBAH', 'KASBON', 'HUTANG') THEN COALESCE((to_jsonb(d)->>'jumlah')::numeric, (to_jsonb(d)->>'nominal')::numeric, 0) ELSE 0 END), 0)
  INTO v_debt_inflow, v_debt_outflow
  FROM public.debt_transactions d;

  v_total_inflow := v_sales_inflow + v_savings_inflow + v_debt_inflow;
  v_total_outflow := v_sales_outflow + v_savings_outflow + v_debt_outflow;
  v_net := v_total_inflow - v_total_outflow;

  RETURN jsonb_build_object(
    'total_pemasukan', v_total_inflow,
    'total_pengeluaran', v_total_outflow,
    'net_defisit_surplus', v_net,
    'sales_inflow', v_sales_inflow,
    'sales_outflow', v_sales_outflow,
    'savings_inflow', v_savings_inflow,
    'savings_outflow', v_savings_outflow,
    'debt_inflow', v_debt_inflow,
    'debt_outflow', v_debt_outflow,
    'chart_data', '[]'::jsonb
  );
END;
$$;

-- 4. Hitung Ringkasan Laporan Penjualan (Sales Report Summary)
CREATE OR REPLACE FUNCTION public.calculate_sales_report_summary(
  p_date TEXT DEFAULT NULL,
  p_month TEXT DEFAULT NULL,
  p_year TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pemasukan NUMERIC := 0;
  v_total_modal NUMERIC := 0;
  v_total_keuntungan NUMERIC := 0;
  v_total_transaksi INT := 0;
  v_grouped JSONB := '[]'::jsonb;
BEGIN
  SELECT 
    COALESCE(SUM(pemasukan), 0),
    COALESCE(SUM(harga_modal), 0),
    COALESCE(SUM(pemasukan - harga_modal), 0),
    COUNT(*)
  INTO 
    v_total_pemasukan,
    v_total_modal,
    v_total_keuntungan,
    v_total_transaksi
  FROM public.sales_transactions
  WHERE 
    (p_date IS NULL OR tanggal::TEXT LIKE p_date || '%')
    AND (p_search IS NULL OR (
      LOWER(nama) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(jenis) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(melalui) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(status) LIKE '%' || LOWER(p_search) || '%'
    ));

  RETURN jsonb_build_object(
    'total_pemasukan', v_total_pemasukan,
    'total_modal', v_total_modal,
    'total_keuntungan', v_total_keuntungan,
    'total_transaksi', v_total_transaksi,
    'grouped_summary', v_grouped
  );
END;
$$;
