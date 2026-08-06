import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const DIGIFLAZZ_CONFIG = {
  username: process.env.DIGIFLAZZ_USERNAME || "hohebuo6jzVo",
  devKey: process.env.DIGIFLAZZ_DEV_KEY || "dev-692c3780-91a3-11f1-ad23-a1e7117c6546",
  prodKey: process.env.DIGIFLAZZ_PROD_KEY || "1c51adda-d915-5450-8a0f-db1704fb5ee7",
  baseUrl: "https://api.digiflazz.com/v1"
};

function generateSign(username: string, key: string, refId: string) {
  return crypto.createHash("md5").update(username + key + refId).digest("hex");
}

// Backend Proxy Route for Fetching Digiflazz Pricelist (Products)
let cachedPricelist: any[] = [];
let lastPricelistFetch = 0;

app.post("/api/digiflazz/pricelist", async (req, res) => {
  try {
    const { useProd, forceRefresh } = req.body || {};
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    const now = Date.now();

    // Return cached pricelist if fetched less than 10 minutes ago
    if (!forceRefresh && cachedPricelist.length > 0 && (now - lastPricelistFetch < 10 * 60 * 1000)) {
      return res.json({ status: "success", data: cachedPricelist, source: "cache" });
    }

    const username = DIGIFLAZZ_CONFIG.username;
    const apiKey = isProd ? DIGIFLAZZ_CONFIG.prodKey : DIGIFLAZZ_CONFIG.devKey;
    const sign = crypto.createHash("md5").update(username + apiKey + "pricelist").digest("hex");

    const response = await fetch(`${DIGIFLAZZ_CONFIG.baseUrl}/price-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "prepaid",
        username: username,
        sign: sign
      })
    });

    const data = await response.json();
    const items = Array.isArray(data.data) ? data.data : (data.data?.data || []);

    if (items && items.length > 0) {
      cachedPricelist = items;
      lastPricelistFetch = now;
      return res.json({ status: "success", data: items, source: "live" });
    }

    // Fallback to cache if rate-limited or empty
    if (cachedPricelist.length > 0) {
      return res.json({ 
        status: "success", 
        data: cachedPricelist, 
        source: "fallback_cache",
        message: data.data?.message || "Menggunakan cache produk Digiflazz" 
      });
    }

    return res.json({ 
      status: "error", 
      message: data.data?.message || "Gagal mengambil daftar produk dari Digiflazz",
      data: []
    });
  } catch (err: any) {
    console.error("Server Digiflazz Pricelist Error:", err);
    if (cachedPricelist.length > 0) {
      return res.json({ status: "success", data: cachedPricelist, source: "fallback_cache" });
    }
    return res.status(500).json({ error: err.message || "Failed to fetch pricelist" });
  }
});

// Backend Proxy Route for Checking Digiflazz Deposit Balance
app.post("/api/digiflazz/cek-saldo", async (req, res) => {
  try {
    const { useProd } = req.body || {};
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    const username = DIGIFLAZZ_CONFIG.username;
    const apiKey = isProd ? DIGIFLAZZ_CONFIG.prodKey : DIGIFLAZZ_CONFIG.devKey;
    const sign = crypto.createHash("md5").update(username + apiKey + "depo").digest("hex");

    const payload = {
      cmd: "deposit",
      username: username,
      sign: sign
    };

    const response = await fetch(`${DIGIFLAZZ_CONFIG.baseUrl}/cek-saldo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Server Digiflazz Cek Saldo Error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch balance from Digiflazz" });
  }
});

// Backend Proxy Route for PLN Inquiry
app.post("/api/digiflazz/pln-inquiry", async (req, res) => {
  try {
    const { customerNo, useProd } = req.body || {};
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    if (!customerNo) {
      return res.status(400).json({ error: "Customer number is required" });
    }

    const username = DIGIFLAZZ_CONFIG.username;
    const apiKey = isProd ? DIGIFLAZZ_CONFIG.prodKey : DIGIFLAZZ_CONFIG.devKey;
    const refId = `pln_inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sign = generateSign(username, apiKey, refId);

    const payload = {
      commands: "inq-pasca",
      username: username,
      buyer_sku_code: "pln",
      customer_no: String(customerNo),
      ref_id: refId,
      sign: sign,
      testing: !isProd
    };

    const response = await fetch(`${DIGIFLAZZ_CONFIG.baseUrl}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Server Digiflazz PLN Inquiry Error:", err);
    return res.status(500).json({ error: err.message || "Failed to contact Digiflazz server" });
  }
});

// Backend Proxy Route for General Transaction
app.post("/api/digiflazz/transaction", async (req, res) => {
  try {
    const { skuCode, customerNo, refId, useProd } = req.body || {};
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    if (!skuCode || !customerNo) {
      return res.status(400).json({ error: "skuCode and customerNo are required" });
    }

    const username = DIGIFLAZZ_CONFIG.username;
    const apiKey = isProd ? DIGIFLAZZ_CONFIG.prodKey : DIGIFLAZZ_CONFIG.devKey;
    const transactionRefId = refId || `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sign = generateSign(username, apiKey, transactionRefId);

    const payload = {
      username: username,
      buyer_sku_code: skuCode,
      customer_no: String(customerNo),
      ref_id: transactionRefId,
      sign: sign,
      testing: !isProd
    };

    const response = await fetch(`${DIGIFLAZZ_CONFIG.baseUrl}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Server Digiflazz Transaction Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process transaction" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
