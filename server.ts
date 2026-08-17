import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { google } from "googleapis";
import { createServer as createViteServer } from "vite";

const app = express();
app.set("trust proxy", true);
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express body parser error handler to ensure JSON response for oversized payloads
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("Express middleware error:", err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: err.code || "PAYLOAD_ERROR",
      message: err.message || "Gagal memproses request data"
    });
  }
  next();
});

// Google OAuth & Sheets State Persistence
const TOKENS_PATH = path.join(process.cwd(), ".google_tokens.json");
const SHEET_CONFIG_PATH = path.join(process.cwd(), ".google_sheet_config.json");

let googleOAuthTokens: any = null;
let connectedGoogleUser: any = null;
let syncedSpreadsheetId: string | null = null;
let autoSyncEnabled: boolean = true;

try {
  if (fs.existsSync(TOKENS_PATH)) {
    const raw = fs.readFileSync(TOKENS_PATH, "utf-8");
    const data = JSON.parse(raw);
    googleOAuthTokens = data.tokens || null;
    connectedGoogleUser = data.user || null;
  }
} catch (e) {
  console.error("Failed to load stored Google OAuth tokens:", e);
}

try {
  if (fs.existsSync(SHEET_CONFIG_PATH)) {
    const raw = fs.readFileSync(SHEET_CONFIG_PATH, "utf-8");
    const data = JSON.parse(raw);
    syncedSpreadsheetId = data.spreadsheetId || null;
    autoSyncEnabled = data.autoSyncEnabled !== undefined ? data.autoSyncEnabled : true;
  }
} catch (e) {
  console.error("Failed to load stored Google Sheet config:", e);
}

function saveTokens(tokens: any, user: any) {
  googleOAuthTokens = tokens;
  connectedGoogleUser = user;
  try {
    fs.writeFileSync(TOKENS_PATH, JSON.stringify({ tokens, user }), "utf-8");
  } catch (e) {
    console.error("Error writing Google tokens:", e);
  }
}

function saveSheetConfig(spreadsheetId: string | null, autoSync: boolean) {
  syncedSpreadsheetId = spreadsheetId;
  autoSyncEnabled = autoSync;
  try {
    fs.writeFileSync(SHEET_CONFIG_PATH, JSON.stringify({ spreadsheetId, autoSyncEnabled: autoSync }), "utf-8");
  } catch (e) {
    console.error("Error writing Google Sheet config:", e);
  }
}

let firebaseAppletConfig: any = null;
try {
  const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  }
} catch (e) {
  console.error("Failed to read firebase-applet-config.json:", e);
}

function getOAuth2Client(req?: express.Request) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || firebaseAppletConfig?.oAuthClientId || "";
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || "";
  
  let redirectUri = process.env.REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "";
  if (!redirectUri && req) {
    const host = req.get("host") || "localhost:3000";
    const proto = req.get("x-forwarded-proto") || req.protocol || "http";
    redirectUri = `${proto}://${host}/api/auth/google/callback`;
  }
  if (!redirectUri) {
    redirectUri = "http://localhost:3000/api/auth/google/callback";
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// 1. Google OAuth URL
app.get("/api/auth/google/url", (req, res) => {
  try {
    const oauth2Client = getOAuth2Client(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ]
    });
    return res.json({ url });
  } catch (err: any) {
    console.error("Error generating OAuth URL:", err);
    return res.status(500).json({ error: err.message || "Failed to generate auth URL" });
  }
});

// 2. Google OAuth Callback
app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let userInfo: any = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userRes = await oauth2.userinfo.get();
      userInfo = userRes.data;
    } catch (e) {
      console.error("Error getting userinfo:", e);
    }

    saveTokens(tokens, userInfo);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Authentication Success</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white; }
          .card { background: #1e293b; border-radius: 16px; padding: 30px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h2 { color: #10b981; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Google Sheets Connected!</h2>
          <p>Sistem berhasil terhubung ke akun Google Anda.</p>
          <p style="font-size: 12px; color: #94a3b8;">Jendela ini akan menutup secara otomatis...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: ${JSON.stringify(userInfo)} }, '*');
            setTimeout(() => window.close(), 1200);
          } else {
            setTimeout(() => { window.location.href = '/'; }, 1500);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// 3. Google OAuth Status
app.get("/api/auth/google/status", (_req, res) => {
  return res.json({
    authenticated: !!(googleOAuthTokens && (googleOAuthTokens.access_token || googleOAuthTokens.refresh_token)),
    user: connectedGoogleUser,
    spreadsheetId: syncedSpreadsheetId,
    spreadsheetUrl: syncedSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${syncedSpreadsheetId}/edit` : null,
    autoSyncEnabled: autoSyncEnabled
  });
});

// 3b. Save token endpoint (for client-side Firebase or OAuth token persistence)
app.post("/api/auth/google/save-token", (req, res) => {
  const { accessToken, user } = req.body;
  if (accessToken) {
    const tokens = { access_token: accessToken, ...(googleOAuthTokens || {}) };
    const userInfo = user || connectedGoogleUser || { email: "Google Account Connected" };
    saveTokens(tokens, userInfo);
  }
  return res.json({
    success: true,
    authenticated: !!(googleOAuthTokens && (googleOAuthTokens.access_token || googleOAuthTokens.refresh_token)),
    user: connectedGoogleUser
  });
});

// 4. Google OAuth Logout
app.post("/api/auth/google/logout", (_req, res) => {
  saveTokens(null, null);
  saveSheetConfig(null, autoSyncEnabled);
  return res.json({ success: true, message: "Disconnected from Google Account" });
});

// 5. Update Sheet Config
app.post("/api/sheets/config", (req, res) => {
  const { spreadsheetId, autoSync } = req.body;
  if (spreadsheetId !== undefined) {
    syncedSpreadsheetId = spreadsheetId;
  }
  if (autoSync !== undefined) {
    autoSyncEnabled = Boolean(autoSync);
  }
  saveSheetConfig(syncedSpreadsheetId, autoSyncEnabled);
  return res.json({
    success: true,
    spreadsheetId: syncedSpreadsheetId,
    autoSyncEnabled: autoSyncEnabled
  });
});

// 6. Google Sheets Sync Endpoint for Customer Data
app.post("/api/sheets/sync-customers", async (req, res) => {
  try {
    const { customers, title } = req.body;
    let targetSpreadsheetId = req.body.spreadsheetId || syncedSpreadsheetId;

    const authHeader = req.headers.authorization;
    const clientAccessToken = req.body.accessToken || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);

    const activeTokens = clientAccessToken 
      ? { access_token: clientAccessToken, ...(googleOAuthTokens || {}) } 
      : googleOAuthTokens;

    if (clientAccessToken) {
      saveTokens(activeTokens, connectedGoogleUser || { email: "Google Account Connected" });
    }

    if (!activeTokens || (!activeTokens.access_token && !activeTokens.refresh_token)) {
      return res.status(401).json({
        success: false,
        error: "NOT_AUTHENTICATED",
        message: "Akun Google belum terhubung. Silakan hubungkan akun Google terlebih dahulu."
      });
    }

    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(activeTokens);

    // Refresh token listener
    oauth2Client.on("tokens", (newTokens) => {
      const updated = { ...googleOAuthTokens, ...newTokens };
      saveTokens(updated, connectedGoogleUser);
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Create a new spreadsheet if we don't have one
    // Create or search for existing spreadsheet if we don't have one
    if (!targetSpreadsheetId) {
      const sheetTitle = title || "Data Pelanggan - Warung Tomi";

      // 1. Check if a spreadsheet with this name already exists in Google Drive to prevent duplicates
      try {
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        const searchRes = await drive.files.list({
          q: `name = '${sheetTitle.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
          fields: "files(id, name)",
          pageSize: 1
        });
        if (searchRes.data.files && searchRes.data.files.length > 0) {
          targetSpreadsheetId = searchRes.data.files[0].id || null;
        }
      } catch (driveErr: any) {
        console.warn("Could not search Drive for existing spreadsheet:", driveErr?.message || "Permission/Network Error");
      }

      // 2. If still no existing file found, create a new one
      if (!targetSpreadsheetId) {
        const createRes = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title: sheetTitle },
            sheets: [
              {
                properties: {
                  title: "Data Pelanggan",
                  gridProperties: { frozenRowCount: 1 }
                }
              }
            ]
          }
        });
        targetSpreadsheetId = createRes.data.spreadsheetId || null;
      }

      if (targetSpreadsheetId) {
        saveSheetConfig(targetSpreadsheetId, autoSyncEnabled);
      }
    }

    if (!targetSpreadsheetId) {
      return res.status(500).json({ success: false, error: "Gagal membuat/menemukan Google Spreadsheet" });
    }

    const headers = [
      "id pelanggan",
      "nama",
      "tabungan",
      "investasi",
      "lainnya",
      "hutang",
      "level",
      "poin",
      "total belanja bulan ini",
      "peringkat",
      "aktivitas terakhir",
      "mutasi tabungan",
      "catatan hutang",
      "terakhir diperbarui"
    ];

    const customerRows = Array.isArray(customers) ? customers.map((c: any, index: number) => {
      const nama = c.nama || c.Nama || "Pelanggan";
      let idPel = c.id_pelanggan || c.id;
      if (!idPel || idPel === 'CUST-0000' || idPel === 'CUST-XXXX' || idPel === '0000') {
        let hash = 0;
        for (let i = 0; i < nama.length; i++) {
          hash = (hash << 5) - hash + nama.charCodeAt(i);
          hash |= 0;
        }
        const positiveHash = Math.abs(hash).toString(36).toUpperCase().padStart(4, "0").slice(-4);
        idPel = `CUST-${positiveHash}-${index + 1}`;
      }
      const tabungan = Number(c.tabungan ?? c.Tabungan ?? 0);
      const investasi = Number(c.investasi ?? c.Investasi ?? 0);
      const lainnya = Number(c.lainnya ?? c.Lainnya ?? 0);
      const hutang = Number(c.hutang ?? c.Hutang ?? 0);
      const level = c.level || c.Level || "Bronze";
      const poin = Number(c.poin ?? c.point ?? c.Poin ?? c.Point ?? 0);
      const totalBelanjaBulanIni = Number(c.total_belanja_bulan_ini ?? c.TotalBelanjaBulanIni ?? c.belanja_bulan_ini ?? 0);
      const peringkat = c.peringkat || c.Peringkat || "Belum ada belanja bulan ini";
      const aktivitas = c.aktivitas_terakhir || c.AktivitasTerakhir || c.aktivitas || "Belum ada aktivitas";
      const mutasiTabungan = c.mutasi_tabungan || c.MutasiTabungan || "Belum ada mutasi tabungan";
      const catatanHutang = c.catatan_hutang || c.CatatanHutang || "Belum ada catatan hutang";
      const updatedTime = c.terakhir_diperbarui || c.TerakhirDiperbarui || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

      return [
        idPel,
        nama,
        tabungan,
        investasi,
        lainnya,
        hutang,
        level,
        poin,
        totalBelanjaBulanIni,
        peringkat,
        aktivitas,
        mutasiTabungan,
        catatanHutang,
        updatedTime
      ];
    }) : [];

    const values = [headers, ...customerRows];

    // Clear and update the sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: targetSpreadsheetId,
      range: "'Data Pelanggan'!A1:Z1000"
    }).catch(() => {});

    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSpreadsheetId,
      range: "'Data Pelanggan'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values }
    });

    const nowIso = new Date().toISOString();
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;

    return res.json({
      success: true,
      spreadsheetId: targetSpreadsheetId,
      spreadsheetUrl: sheetUrl,
      totalSynced: customerRows.length,
      lastSynced: nowIso
    });
  } catch (err: any) {
    const isAuthError =
      err?.code === 401 ||
      err?.status === 401 ||
      err?.response?.status === 401 ||
      err?.name === "GaxiosError" ||
      (typeof err?.message === "string" && (
        err.message.includes("invalid authentication credentials") ||
        err.message.includes("invalid_grant") ||
        err.message.includes("Invalid Credentials") ||
        err.message.includes("Unauthenticated") ||
        err.message.includes("OAuth 2 access token")
      ));

    if (isAuthError) {
      console.warn("Google Sheets auth expired or invalid. Resetting saved credentials.");
      saveTokens(null, null);
      return res.status(401).json({
        success: false,
        error: "UNAUTHENTICATED",
        needReauth: true,
        message: "Sesi login Google telah kedaluwarsa atau tidak valid. Silakan hubungkan kembali akun Google Anda."
      });
    }

    console.error("Google Sheets Sync Error:", err?.message || err);

    return res.status(500).json({
      success: false,
      error: err.message || "Gagal menyinkronkan data ke Google Sheets"
    });
  }
});

// 7. Proxy Endpoint for Google Apps Script Web App Sync (Avoids Browser CORS)
app.post("/api/sheets/apps-script-sync", async (req, res) => {
  try {
    const { scriptUrl, payload } = req.body;
    const targetUrl = scriptUrl || "https://script.google.com/macros/s/AKfycbyS9FZaw8H-ckTRaCN3ZJP4FVeuMoAFwx9y6-pGSPtHFDCgxxLK-4HRV1WfO1xVBL8T/exec";

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      redirect: "follow"
    });

    let resData: any = {};
    const textResponse = await response.text();
    try {
      resData = JSON.parse(textResponse);
    } catch {
      resData = { status: response.ok ? "success" : "unknown", raw: textResponse };
    }

    return res.json({
      success: true,
      data: resData
    });
  } catch (err: any) {
    console.error("Apps Script Proxy Sync Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal menyinkronkan data ke Apps Script"
    });
  }
});

const DIGIFLAZZ_CONFIG = {
  username: process.env.DIGIFLAZZ_USERNAME || "hohebuo6jzVo",
  devKey: process.env.DIGIFLAZZ_DEV_KEY || "dev-692c3780-91a3-11f1-ad23-a1e7117c6546",
  prodKey: process.env.DIGIFLAZZ_PROD_KEY || "1c51adda-d915-5450-8a0f-db1704fb5ee7",
  baseUrl: "https://api.digiflazz.com/v1"
};

let serverPublicIp = "34.34.244.38";

// Asynchronously detect server public IP for Whitelist guidance
fetch("https://api.ipify.org?format=json")
  .then(r => r.json())
  .then(d => { if (d && d.ip) serverPublicIp = d.ip; })
  .catch(() => {});

function generateSign(username: string, key: string, refId: string) {
  return crypto.createHash("md5").update(username + key + refId).digest("hex");
}

export const DEFAULT_DIGIFLAZZ_PRODUCTS = [
  // Telkomsel
  { product_name: "Pulsa Telkomsel 5.000", category: "Pulsa", brand: "TELKOMSEL", price: 5350, buyer_sku_code: "tl5000", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Telkomsel 10.000", category: "Pulsa", brand: "TELKOMSEL", price: 10350, buyer_sku_code: "tl10000", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Telkomsel 15.000", category: "Pulsa", brand: "TELKOMSEL", price: 15250, buyer_sku_code: "tl15000", buyer_product_status: true, seller_product_status: true, desc: "+20 Hari" },
  { product_name: "Pulsa Telkomsel 20.000", category: "Pulsa", brand: "TELKOMSEL", price: 20250, buyer_sku_code: "tl20000", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Telkomsel 25.000", category: "Pulsa", brand: "TELKOMSEL", price: 25150, buyer_sku_code: "tl25000", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Telkomsel 50.000", category: "Pulsa", brand: "TELKOMSEL", price: 50150, buyer_sku_code: "tl50000", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Telkomsel 100.000", category: "Pulsa", brand: "TELKOMSEL", price: 99800, buyer_sku_code: "tl100000", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },
  { product_name: "Pulsa Telkomsel 150.000", category: "Pulsa", brand: "TELKOMSEL", price: 149500, buyer_sku_code: "tl150000", buyer_product_status: true, seller_product_status: true, desc: "+90 Hari" },
  { product_name: "Pulsa Telkomsel 200.000", category: "Pulsa", brand: "TELKOMSEL", price: 199000, buyer_sku_code: "tl200000", buyer_product_status: true, seller_product_status: true, desc: "+120 Hari" },

  // Indosat
  { product_name: "Pulsa Indosat 5.000", category: "Pulsa", brand: "INDOSAT", price: 5800, buyer_sku_code: "i5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Indosat 10.000", category: "Pulsa", brand: "INDOSAT", price: 10800, buyer_sku_code: "i10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Indosat 25.000", category: "Pulsa", brand: "INDOSAT", price: 25200, buyer_sku_code: "i25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Indosat 50.000", category: "Pulsa", brand: "INDOSAT", price: 50200, buyer_sku_code: "i50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Indosat 100.000", category: "Pulsa", brand: "INDOSAT", price: 99500, buyer_sku_code: "i100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },

  // XL
  { product_name: "Pulsa XL 5.000", category: "Pulsa", brand: "XL", price: 5850, buyer_sku_code: "xl5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa XL 10.000", category: "Pulsa", brand: "XL", price: 10850, buyer_sku_code: "xl10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa XL 25.000", category: "Pulsa", brand: "XL", price: 25250, buyer_sku_code: "xl25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa XL 50.000", category: "Pulsa", brand: "XL", price: 50250, buyer_sku_code: "xl50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa XL 100.000", category: "Pulsa", brand: "XL", price: 99600, buyer_sku_code: "xl100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },

  // Tri
  { product_name: "Pulsa Tri 5.000", category: "Pulsa", brand: "TRI", price: 5300, buyer_sku_code: "three5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Tri 10.000", category: "Pulsa", brand: "TRI", price: 10300, buyer_sku_code: "three10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Tri 25.000", category: "Pulsa", brand: "TRI", price: 25100, buyer_sku_code: "three25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Tri 50.000", category: "Pulsa", brand: "TRI", price: 50100, buyer_sku_code: "three50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Tri 100.000", category: "Pulsa", brand: "TRI", price: 99200, buyer_sku_code: "three100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },

  // Axis
  { product_name: "Pulsa Axis 5.000", category: "Pulsa", brand: "AXIS", price: 5800, buyer_sku_code: "axis5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Axis 10.000", category: "Pulsa", brand: "AXIS", price: 10800, buyer_sku_code: "axis10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Axis 25.000", category: "Pulsa", brand: "AXIS", price: 25200, buyer_sku_code: "axis25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Axis 50.000", category: "Pulsa", brand: "AXIS", price: 50200, buyer_sku_code: "axis50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },

  // Smartfren
  { product_name: "Pulsa Smartfren 5.000", category: "Pulsa", brand: "SMARTFREN", price: 5200, buyer_sku_code: "sm5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Smartfren 10.000", category: "Pulsa", brand: "SMARTFREN", price: 10200, buyer_sku_code: "sm10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Smartfren 25.000", category: "Pulsa", brand: "SMARTFREN", price: 25050, buyer_sku_code: "sm25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Smartfren 50.000", category: "Pulsa", brand: "SMARTFREN", price: 50050, buyer_sku_code: "sm50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },

  // PLN Tokens
  { product_name: "Token PLN 20.000", category: "PLN", brand: "PLN", price: 20150, buyer_sku_code: "pln20", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 20rb" },
  { product_name: "Token PLN 50.000", category: "PLN", brand: "PLN", price: 50150, buyer_sku_code: "pln50", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 50rb" },
  { product_name: "Token PLN 100.000", category: "PLN", brand: "PLN", price: 100150, buyer_sku_code: "pln100", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 100rb" },
  { product_name: "Token PLN 200.000", category: "PLN", brand: "PLN", price: 200150, buyer_sku_code: "pln200", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 200rb" },
  { product_name: "Token PLN 500.000", category: "PLN", brand: "PLN", price: 500150, buyer_sku_code: "pln500", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 500rb" },
  { product_name: "Token PLN 1.000.000", category: "PLN", brand: "PLN", price: 1000150, buyer_sku_code: "pln1000", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 1 Juta" },

  // Data Packages
  { product_name: "Telkomsel Data 1GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 14500, buyer_sku_code: "tldata1", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 1GB" },
  { product_name: "Telkomsel Data 3GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 28500, buyer_sku_code: "tldata3", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 3GB" },
  { product_name: "Telkomsel Data 5GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 42000, buyer_sku_code: "tldata5", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 5GB" },
  { product_name: "Indosat Freedom 3GB 30 Hari", category: "Data", brand: "INDOSAT", price: 22000, buyer_sku_code: "idata3", buyer_product_status: true, seller_product_status: true, desc: "Freedom 3GB" },
  { product_name: "Indosat Freedom 7GB 30 Hari", category: "Data", brand: "INDOSAT", price: 38000, buyer_sku_code: "idata7", buyer_product_status: true, seller_product_status: true, desc: "Freedom 7GB" },
  { product_name: "XL Xtra Combo 5GB 30 Hari", category: "Data", brand: "XL", price: 32000, buyer_sku_code: "xldata5", buyer_product_status: true, seller_product_status: true, desc: "Xtra Combo 5GB" },
  { product_name: "Tri Data 2.5GB 30 Hari", category: "Data", brand: "TRI", price: 18000, buyer_sku_code: "threedata2", buyer_product_status: true, seller_product_status: true, desc: "AON 2.5GB" },
  { product_name: "Axis Bronet 2GB 30 Hari", category: "Data", brand: "AXIS", price: 16500, buyer_sku_code: "axisdata2", buyer_product_status: true, seller_product_status: true, desc: "Bronet 2GB" },
];

// Helper to call Digiflazz API
async function callDigiflazzApi(endpoint: string, payloadBuilder: (apiKey: string, isProd: boolean) => any, preferredProd: boolean = true) {
  const username = DIGIFLAZZ_CONFIG.username;
  const prodKey = DIGIFLAZZ_CONFIG.prodKey;
  const devKey = DIGIFLAZZ_CONFIG.devKey;

  const tryKeys = preferredProd 
    ? [{ key: prodKey, isProd: true }, { key: devKey, isProd: false }]
    : [{ key: devKey, isProd: false }, { key: prodKey, isProd: true }];

  let lastResult: any = null;

  for (const { key, isProd } of tryKeys) {
    try {
      const body = payloadBuilder(key, isProd);
      const response = await fetch(`${DIGIFLAZZ_CONFIG.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (endpoint === "price-list") {
        const items = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        if (items && items.length > 0) {
          return { data, items, isProd };
        }
      } else {
        if (data) {
          return { data, isProd };
        }
      }
      lastResult = data;
    } catch (err) {
      console.error(`Digiflazz API fetch error for ${endpoint} (isProd: ${isProd}):`, err);
    }
  }

  return { data: lastResult, isProd: preferredProd };
}

// Endpoint for Server Info & IP
app.get("/api/digiflazz/server-info", (_req, res) => {
  res.json({
    serverIp: serverPublicIp,
    username: DIGIFLAZZ_CONFIG.username,
    status: "online"
  });
});

// Backend Proxy Route for Fetching Digiflazz Pricelist (Products)
let cachedPricelist: any[] = [];
let lastPricelistFetch = 0;

app.all(["/api/digiflazz/pricelist"], async (req, res) => {
  try {
    const params = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const { useProd, forceRefresh } = params;
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    const now = Date.now();

    // Return cached pricelist if fetched less than 10 minutes ago
    if (!forceRefresh && cachedPricelist.length > 0 && (now - lastPricelistFetch < 10 * 60 * 1000)) {
      return res.json({ status: "success", data: cachedPricelist, source: "cache", serverIp: serverPublicIp });
    }

    const username = DIGIFLAZZ_CONFIG.username;

    const resObj = await callDigiflazzApi("price-list", (apiKey) => {
      const sign = crypto.createHash("md5").update(username + apiKey + "pricelist").digest("hex");
      return {
        cmd: "prepaid",
        username: username,
        sign: sign
      };
    }, isProd);

    if (resObj && resObj.items && resObj.items.length > 0) {
      cachedPricelist = resObj.items;
      lastPricelistFetch = now;
      return res.json({ status: "success", data: resObj.items, source: "live", mode: resObj.isProd ? "prod" : "dev", serverIp: serverPublicIp, rawResponse: resObj.data });
    }

    // Return real response from Digiflazz
    return res.json({ 
      status: "response", 
      data: resObj?.data?.data || DEFAULT_DIGIFLAZZ_PRODUCTS, 
      rawResponse: resObj?.data,
      source: "real_api",
      serverIp: serverPublicIp
    });
  } catch (err: any) {
    console.error("Server Digiflazz Pricelist Error:", err);
    return res.status(500).json({ status: "error", message: err.message || "Gagal mengambil pricelist" });
  }
});

// Backend Proxy Route for Checking Digiflazz Deposit Balance
app.all(["/api/digiflazz/cek-saldo"], async (req, res) => {
  try {
    const params = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const { useProd } = params;
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    const username = DIGIFLAZZ_CONFIG.username;

    const resObj = await callDigiflazzApi("cek-saldo", (apiKey) => {
      const sign = crypto.createHash("md5").update(username + apiKey + "depo").digest("hex");
      return {
        cmd: "deposit",
        username: username,
        sign: sign
      };
    }, isProd);

    // Pass real Digiflazz API response directly
    return res.json(resObj?.data || { data: { deposit: 0, rc: "99", message: "Gagal terhubung ke API Digiflazz" } });
  } catch (err: any) {
    console.error("Server Digiflazz Cek Saldo Error:", err);
    return res.status(500).json({ data: { deposit: 0, rc: "99", message: err.message || "Failed to fetch balance" } });
  }
});

// Backend Proxy Route for PLN Inquiry
app.all(["/api/digiflazz/pln-inquiry"], async (req, res) => {
  try {
    const params = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const { customerNo, useProd } = params;
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    if (!customerNo) {
      return res.status(400).json({ error: "Customer number is required" });
    }

    const username = DIGIFLAZZ_CONFIG.username;
    const refId = `pln_inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const resObj = await callDigiflazzApi("transaction", (apiKey, isProdKey) => {
      const sign = generateSign(username, apiKey, refId);
      return {
        commands: "inq-pasca",
        username: username,
        buyer_sku_code: "pln",
        customer_no: String(customerNo),
        ref_id: refId,
        sign: sign,
        testing: !isProdKey
      };
    }, isProd);

    // Return real response directly from Digiflazz
    return res.json(resObj?.data || { data: { rc: "99", message: "Gagal terhubung ke API Digiflazz" } });
  } catch (err: any) {
    console.error("Server Digiflazz PLN Inquiry Error:", err);
    return res.status(500).json({ data: { rc: "99", message: err.message || "Gagal melakukan inquiry PLN" } });
  }
});

// Backend Proxy Route for General Transaction
app.all(["/api/digiflazz/transaction"], async (req, res) => {
  try {
    const params = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const { skuCode, customerNo, refId, useProd } = params;
    const isProd = useProd !== undefined ? Boolean(useProd) : true;
    if (!skuCode || !customerNo) {
      return res.status(400).json({ error: "skuCode and customerNo are required" });
    }

    const username = DIGIFLAZZ_CONFIG.username;
    const transactionRefId = refId || `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const resObj = await callDigiflazzApi("transaction", (apiKey, isProdKey) => {
      const sign = generateSign(username, apiKey, transactionRefId);
      return {
        username: username,
        buyer_sku_code: skuCode,
        customer_no: String(customerNo),
        ref_id: transactionRefId,
        sign: sign,
        testing: !isProdKey
      };
    }, isProd);

    // Return real response directly from Digiflazz
    return res.json(resObj?.data || { data: { rc: "99", message: "Gagal terhubung ke API Digiflazz" } });
  } catch (err: any) {
    console.error("Server Digiflazz Transaction Error:", err);
    return res.status(500).json({ data: { rc: "99", message: err.message || "Gagal melakukan transaksi" } });
  }
});

// Fallback JSON response for unhandled API routes to prevent HTML response
app.all("/api/*", (_req, res) => {
  return res.status(404).json({
    success: false,
    error: "API_NOT_FOUND",
    message: "Endpoint API tidak ditemukan"
  });
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
