// Lightweight Digiflazz API Helper and Credential Management

export const DIGIFLAZZ_CONFIG = {
  username: "hohebuo6jzVo",
  devKey: "dev-692c3780-91a3-11f1-ad23-a1e7117c6546",
  prodKey: "1c51adda-d915-5450-8a0f-db1704fb5ee7",
  baseUrl: "https://api.digiflazz.com/v1"
};

// Pure JS MD5 function to guarantee execution in browser & node
function md5Cycle(x: number[], k: number[]) {
  let a = x[0], b = x[1], c = x[2], d = x[3];

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17,  606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12,  1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7,  1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7,  1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22,  1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14,  643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9,  38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5,  568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20,  1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14,  1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16,  1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11,  1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4,  681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[2], 23,  76029189);
  a = hh(a, b, c, d, k[6], 4, -640364487);
  d = hh(d, a, b, c, k[9], 11, -102164208);
  c = hh(c, d, a, b, k[12], 16, -1862885105);
  b = hh(b, c, d, a, k[15], 23,  2000412519);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10,  1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6,  1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894980168);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6,  1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[11], 21,  1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[13], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15,  718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}

function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s: string) {
  const txt = '';
  const n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= s.length; i += 64) {
    md5Cycle(state, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  const tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
  for (i = 0; i < s.length; i++) {
    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  }
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) {
    md5Cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }
  tail[14] = n * 8;
  md5Cycle(state, tail);
  return state;
}

function md5blk(s: string) {
  const md5blks: number[] = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] = s.charCodeAt(i)
      + (s.charCodeAt(i + 1) << 8)
      + (s.charCodeAt(i + 2) << 16)
      + (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

const hex_chr = '0123456789abcdef'.split('');

function rhex(n: number) {
  let s = '', j = 0;
  for (; j < 4; j++) {
    s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
  }
  return s;
}

function hex(x: number[]) {
  for (let i = 0; i < x.length; i++) {
    x[i] = rhex(x[i]) as any;
  }
  return x.join('');
}

function add32(a: number, b: number) {
  return (a + b) & 0xFFFFFFFF;
}

export function md5(s: string): string {
  return hex(md51(s));
}

/**
 * Generate Digiflazz signature
 */
export const DEFAULT_DIGIFLAZZ_PRODUCTS = [
  { product_name: "Pulsa Telkomsel 5.000", category: "Pulsa", brand: "TELKOMSEL", price: 5350, buyer_sku_code: "tl5000", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Telkomsel 10.000", category: "Pulsa", brand: "TELKOMSEL", price: 10350, buyer_sku_code: "tl10000", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Telkomsel 15.000", category: "Pulsa", brand: "TELKOMSEL", price: 15250, buyer_sku_code: "tl15000", buyer_product_status: true, seller_product_status: true, desc: "+20 Hari" },
  { product_name: "Pulsa Telkomsel 20.000", category: "Pulsa", brand: "TELKOMSEL", price: 20250, buyer_sku_code: "tl20000", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Telkomsel 25.000", category: "Pulsa", brand: "TELKOMSEL", price: 25150, buyer_sku_code: "tl25000", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Telkomsel 50.000", category: "Pulsa", brand: "TELKOMSEL", price: 50150, buyer_sku_code: "tl50000", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Telkomsel 100.000", category: "Pulsa", brand: "TELKOMSEL", price: 99800, buyer_sku_code: "tl100000", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },
  { product_name: "Pulsa Telkomsel 150.000", category: "Pulsa", brand: "TELKOMSEL", price: 149500, buyer_sku_code: "tl150000", buyer_product_status: true, seller_product_status: true, desc: "+90 Hari" },
  { product_name: "Pulsa Telkomsel 200.000", category: "Pulsa", brand: "TELKOMSEL", price: 199000, buyer_sku_code: "tl200000", buyer_product_status: true, seller_product_status: true, desc: "+120 Hari" },
  { product_name: "Pulsa Indosat 5.000", category: "Pulsa", brand: "INDOSAT", price: 5800, buyer_sku_code: "i5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Indosat 10.000", category: "Pulsa", brand: "INDOSAT", price: 10800, buyer_sku_code: "i10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Indosat 25.000", category: "Pulsa", brand: "INDOSAT", price: 25200, buyer_sku_code: "i25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Indosat 50.000", category: "Pulsa", brand: "INDOSAT", price: 50200, buyer_sku_code: "i50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Indosat 100.000", category: "Pulsa", brand: "INDOSAT", price: 99500, buyer_sku_code: "i100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },
  { product_name: "Pulsa XL 5.000", category: "Pulsa", brand: "XL", price: 5850, buyer_sku_code: "xl5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa XL 10.000", category: "Pulsa", brand: "XL", price: 10850, buyer_sku_code: "xl10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa XL 25.000", category: "Pulsa", brand: "XL", price: 25250, buyer_sku_code: "xl25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa XL 50.000", category: "Pulsa", brand: "XL", price: 50250, buyer_sku_code: "xl50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa XL 100.000", category: "Pulsa", brand: "XL", price: 99600, buyer_sku_code: "xl100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },
  { product_name: "Pulsa Tri 5.000", category: "Pulsa", brand: "TRI", price: 5300, buyer_sku_code: "three5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Tri 10.000", category: "Pulsa", brand: "TRI", price: 10300, buyer_sku_code: "three10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Tri 25.000", category: "Pulsa", brand: "TRI", price: 25100, buyer_sku_code: "three25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Tri 50.000", category: "Pulsa", brand: "TRI", price: 50100, buyer_sku_code: "three50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Tri 100.000", category: "Pulsa", brand: "TRI", price: 99200, buyer_sku_code: "three100", buyer_product_status: true, seller_product_status: true, desc: "+60 Hari" },
  { product_name: "Pulsa Axis 5.000", category: "Pulsa", brand: "AXIS", price: 5800, buyer_sku_code: "axis5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Axis 10.000", category: "Pulsa", brand: "AXIS", price: 10800, buyer_sku_code: "axis10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Axis 25.000", category: "Pulsa", brand: "AXIS", price: 25200, buyer_sku_code: "axis25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Axis 50.000", category: "Pulsa", brand: "AXIS", price: 50200, buyer_sku_code: "axis50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Pulsa Smartfren 5.000", category: "Pulsa", brand: "SMARTFREN", price: 5200, buyer_sku_code: "sm5", buyer_product_status: true, seller_product_status: true, desc: "+7 Hari" },
  { product_name: "Pulsa Smartfren 10.000", category: "Pulsa", brand: "SMARTFREN", price: 10200, buyer_sku_code: "sm10", buyer_product_status: true, seller_product_status: true, desc: "+15 Hari" },
  { product_name: "Pulsa Smartfren 25.000", category: "Pulsa", brand: "SMARTFREN", price: 25050, buyer_sku_code: "sm25", buyer_product_status: true, seller_product_status: true, desc: "+30 Hari" },
  { product_name: "Pulsa Smartfren 50.000", category: "Pulsa", brand: "SMARTFREN", price: 50050, buyer_sku_code: "sm50", buyer_product_status: true, seller_product_status: true, desc: "+45 Hari" },
  { product_name: "Token PLN 20.000", category: "PLN", brand: "PLN", price: 20150, buyer_sku_code: "pln20", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 20rb" },
  { product_name: "Token PLN 50.000", category: "PLN", brand: "PLN", price: 50150, buyer_sku_code: "pln50", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 50rb" },
  { product_name: "Token PLN 100.000", category: "PLN", brand: "PLN", price: 100150, buyer_sku_code: "pln100", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 100rb" },
  { product_name: "Token PLN 200.000", category: "PLN", brand: "PLN", price: 200150, buyer_sku_code: "pln200", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 200rb" },
  { product_name: "Token PLN 500.000", category: "PLN", brand: "PLN", price: 500150, buyer_sku_code: "pln500", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 500rb" },
  { product_name: "Token PLN 1.000.000", category: "PLN", brand: "PLN", price: 1000150, buyer_sku_code: "pln1000", buyer_product_status: true, seller_product_status: true, desc: "Token Listrik PLN 1 Juta" },
  { product_name: "Telkomsel Data 1GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 14500, buyer_sku_code: "tldata1", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 1GB" },
  { product_name: "Telkomsel Data 3GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 28500, buyer_sku_code: "tldata3", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 3GB" },
  { product_name: "Telkomsel Data 5GB 30 Hari", category: "Data", brand: "TELKOMSEL", price: 42000, buyer_sku_code: "tldata5", buyer_product_status: true, seller_product_status: true, desc: "Kuota Utama 5GB" },
  { product_name: "Indosat Freedom 3GB 30 Hari", category: "Data", brand: "INDOSAT", price: 22000, buyer_sku_code: "idata3", buyer_product_status: true, seller_product_status: true, desc: "Freedom 3GB" },
  { product_name: "Indosat Freedom 7GB 30 Hari", category: "Data", brand: "INDOSAT", price: 38000, buyer_sku_code: "idata7", buyer_product_status: true, seller_product_status: true, desc: "Freedom 7GB" },
  { product_name: "XL Xtra Combo 5GB 30 Hari", category: "Data", brand: "XL", price: 32000, buyer_sku_code: "xldata5", buyer_product_status: true, seller_product_status: true, desc: "Xtra Combo 5GB" },
  { product_name: "Tri Data 2.5GB 30 Hari", category: "Data", brand: "TRI", price: 18000, buyer_sku_code: "threedata2", buyer_product_status: true, seller_product_status: true, desc: "AON 2.5GB" },
  { product_name: "Axis Bronet 2GB 30 Hari", category: "Data", brand: "AXIS", price: 16500, buyer_sku_code: "axisdata2", buyer_product_status: true, seller_product_status: true, desc: "Bronet 2GB" },
];

/**
 * Fetch real Digiflazz Deposit Balance via Server Proxy
 */
export async function fetchDigiflazzBalance(useProd: boolean = true) {
  try {
    const response = await fetch("/api/digiflazz/cek-saldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useProd })
    });
    return await response.json();
  } catch (error: any) {
    console.error("Digiflazz Balance Error:", error);
    return { data: { deposit: 0, rc: "99", message: error.message || "Gagal mengambil saldo" } };
  }
}

/**
 * Send PLN Inquiry to Digiflazz via Server Proxy
 */
export async function sendDigiflazzPLNInquiry(customerNo: string, useProd: boolean = true) {
  try {
    const response = await fetch("/api/digiflazz/pln-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerNo, useProd })
    });
    return await response.json();
  } catch (error: any) {
    console.error("Digiflazz PLN Inquiry Error:", error);
    return {
      data: {
        customer_no: customerNo,
        status: "Gagal",
        rc: "99",
        message: error.message || "Gagal menghubungi server inquiry PLN"
      }
    };
  }
}

/**
 * Send transaction to Digiflazz via Server Proxy
 */
export async function sendDigiflazzTransaction(options: {
  skuCode: string;
  customerNo: string;
  refId: string;
  useProd?: boolean;
}) {
  try {
    const payload = { ...options, useProd: options.useProd !== undefined ? options.useProd : true };
    const response = await fetch("/api/digiflazz/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error: any) {
    console.error("Digiflazz Transaction Error:", error);
    return {
      data: {
        ref_id: options.refId,
        buyer_sku_code: options.skuCode,
        customer_no: options.customerNo,
        status: "Gagal",
        rc: "99",
        message: error.message || "Gagal menghubungi server transaksi Digiflazz"
      }
    };
  }
}

/**
 * Fetch Digiflazz Product Pricelist via Server Proxy
 */
export async function fetchDigiflazzPricelist(useProd: boolean = true, forceRefresh: boolean = false) {
  try {
    const response = await fetch("/api/digiflazz/pricelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useProd, forceRefresh })
    });
    const res = await response.json();
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }
    if (res && res.data) {
      return res;
    }
    return { status: "success", data: DEFAULT_DIGIFLAZZ_PRODUCTS, source: "fallback_cache" };
  } catch (error) {
    console.error("Digiflazz Pricelist Error:", error);
    return { status: "success", data: DEFAULT_DIGIFLAZZ_PRODUCTS, source: "fallback_cache" };
  }
}

