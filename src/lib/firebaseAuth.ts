import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const TOKEN_KEY = "gs_access_token";
const USER_KEY = "gs_user_data";

let cachedAccessToken: string | null = null;
let cachedUserData: { email: string; name: string; photoURL: string } | null = null;

try {
  cachedAccessToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);
  if (savedUser) {
    cachedUserData = JSON.parse(savedUser);
  }
} catch (e) {
  console.error("Error loading cached auth from localStorage:", e);
}

// Automatically sync cached token to backend if available
if (cachedAccessToken) {
  fetch("/api/auth/google/save-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: cachedAccessToken, user: cachedUserData })
  }).catch(() => {});
}

// Firebase Auth State Listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    cachedUserData = {
      email: user.email || "",
      name: user.displayName || "",
      photoURL: user.photoURL || ""
    };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(cachedUserData));
    } catch (e) {}

    const token = cachedAccessToken || localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch("/api/auth/google/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, user: cachedUserData })
      }).catch(() => {});
    }
  }
});

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/spreadsheets");
    provider.addScope("https://www.googleapis.com/auth/drive.file");

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;

    if (result.user) {
      cachedUserData = {
        email: result.user.email || "",
        name: result.user.displayName || "",
        photoURL: result.user.photoURL || ""
      };
    }

    if (cachedAccessToken) {
      try {
        localStorage.setItem(TOKEN_KEY, cachedAccessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(cachedUserData));
      } catch (e) {}

      // Save token on backend server
      await fetch("/api/auth/google/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: cachedAccessToken, user: cachedUserData })
      }).catch(() => {});
    }

    return {
      success: true,
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    return {
      success: false,
      error: error.message || "Gagal login dengan Google"
    };
  }
};

export const getCachedAccessToken = () => cachedAccessToken || localStorage.getItem(TOKEN_KEY);
export const getCachedUserData = () => {
  if (cachedUserData) return cachedUserData;
  try {
    const u = localStorage.getItem(USER_KEY);
    if (u) return JSON.parse(u);
  } catch (e) {}
  return null;
};

export const logoutGoogle = async () => {
  cachedAccessToken = null;
  cachedUserData = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {}
  await signOut(auth);
};
