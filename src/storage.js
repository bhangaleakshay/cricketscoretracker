// Storage layer backed by JSONBin.io (https://jsonbin.io) — a free,
// card-free JSON storage service. All app data (players/teams/matches)
// lives together as one JSON object inside a single "bin".
//
// IMPORTANT: use a scoped Access Key here, NOT your Master Key. The Master
// Key can create/delete/read/write anything in your account; an Access Key
// can be limited to Read + Update on just this one bin, which is what you
// want for a key that ends up visible in your deployed site's JS bundle.

const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const ACCESS_KEY = import.meta.env.VITE_JSONBIN_ACCESS_KEY;
const BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

if (import.meta.env.DEV) {
  console.log("JSONBin env vars:", {
    BIN_ID: BIN_ID ? "[present]" : "[missing]",
    ACCESS_KEY: ACCESS_KEY ? "[present]" : "[missing]",
    ACCESS_KEY_length: ACCESS_KEY ? ACCESS_KEY.length : 0,
    envKeys: Object.keys(import.meta.env).sort(),
  });
}

let cache = null; // in-memory copy of the whole bin, once loaded
let inflightLoad = null; // dedupes concurrent initial reads
let saveTimer = null; // debounce handle

async function fetchBin() {
  const res = await fetch(`${BASE}/latest`, {
    headers: { "X-Access-Key": ACCESS_KEY, "X-Bin-Meta": "false" },
  });
  if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`);
  return res.json();
}

async function putBin(data) {
  const res = await fetch(BASE, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": ACCESS_KEY,
      "X-Bin-Versioning": "false", // don't pile up version history on the free tier
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);
}

async function getBin() {
  if (cache) return cache;
  if (!inflightLoad) {
    inflightLoad = fetchBin()
      .then((data) => { cache = data && typeof data === "object" ? data : {}; return cache; })
      .finally(() => { inflightLoad = null; });
  }
  return inflightLoad;
}

export async function loadKey(key, fallback) {
  try {
    const data = await getBin();
    return data && data[key] !== undefined ? data[key] : fallback;
  } catch (e) {
    console.error("JSONBin load failed for key:", key, e);
    return fallback;
  }
}

// Debounced: live scoring can fire many saves in quick succession (every
// ball), and JSONBin's free tier is rate-limited. We merge rapid updates
// into memory immediately, but only send one network write ~700ms after
// the last change settles.
export function saveKey(key, value) {
  return new Promise((resolve) => {
    (async () => {
      const base = cache || (await getBin().catch(() => ({})));
      cache = { ...base, [key]: value };
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          await putBin(cache);
        } catch (e) {
          console.error("JSONBin save failed for key:", key, e);
        }
        resolve();
      }, 700);
    })();
  });
}
