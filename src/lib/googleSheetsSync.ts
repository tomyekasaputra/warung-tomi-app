export interface GoogleSheetsAuthStatus {
  authenticated: boolean;
  user?: {
    email?: string;
    name?: string;
    picture?: string;
  } | null;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  autoSyncEnabled?: boolean;
}

export interface CustomerSyncPayload {
  id_pelanggan?: string;
  id?: string;
  nama?: string;
  Nama?: string;
  tabungan?: number;
  Tabungan?: number;
  investasi?: number;
  Investasi?: number;
  lainnya?: number;
  Lainnya?: number;
  hutang?: number;
  Hutang?: number;
  level?: string;
  Level?: string;
  poin?: number;
  Poin?: number;
  [key: string]: any;
}

export const checkGoogleSheetsAuthStatus = async (): Promise<GoogleSheetsAuthStatus> => {
  try {
    const res = await fetch("/api/auth/google/status");
    if (!res.ok) throw new Error("Failed to check auth status");
    return await res.json();
  } catch (err) {
    console.error("Error checking Google Sheets auth status:", err);
    return { authenticated: false };
  }
};

export const getGoogleOAuthUrl = async (): Promise<string> => {
  const res = await fetch("/api/auth/google/url");
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Gagal mendapatkan URL Login Google");
  return data.url;
};

export const disconnectGoogleAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/auth/google/logout", { method: "POST" });
    return res.ok;
  } catch (err) {
    console.error("Error logging out Google:", err);
    return false;
  }
};

export const updateGoogleSheetsConfig = async (config: { spreadsheetId?: string; autoSync?: boolean }) => {
  try {
    const res = await fetch("/api/sheets/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (err) {
    console.error("Error updating sheet config:", err);
    return { success: false };
  }
};

export const syncCustomersToGoogleSheets = async (customers: CustomerSyncPayload[], title?: string, accessToken?: string | null) => {
  try {
    // Sanitize customer objects to avoid sending heavy base64 avatar images
    const sanitizedCustomers = customers.map((c) => {
      const cleanObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(c)) {
        // Skip base64 photo strings or non-essential huge attributes
        if (typeof value === "string" && value.length > 500 && value.startsWith("data:image")) {
          continue;
        }
        if (key.toLowerCase().includes("foto") || key.toLowerCase().includes("avatar") || key.toLowerCase().includes("image")) {
          if (typeof value === "string" && value.length > 300) continue;
        }
        cleanObj[key] = value;
      }
      return cleanObj;
    });

    const res = await fetch("/api/sheets/sync-customers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ customers: sanitizedCustomers, title, accessToken })
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      return data;
    } else {
      const text = await res.text();
      console.error("Non-JSON response from sync API:", text);
      return { success: false, error: "Server mengembalikan respon tidak valid (HTML error)" };
    }
  } catch (err: any) {
    console.error("Error syncing customers to Google Sheets:", err);
    return { success: false, error: err.message || "Gagal menyinkronkan data" };
  }
};
