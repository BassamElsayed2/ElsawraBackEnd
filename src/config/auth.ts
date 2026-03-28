import dotenv from "dotenv";

dotenv.config();

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Naive eTLD+1 for common TLDs (.com, .net, .org, …). Override with SESSION_COOKIE_SAME_SITE if wrong for your domain. */
function registrableDomain(hostname: string): string {
  const h = hostname.toLowerCase();
  const parts = h.split(".").filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return h;
}

/**
 * When the SPA and API sit on different registrable domains (e.g. elsawra.net ↔ api.elsawa.net),
 * browsers treat cookies as cross-site; SameSite=Strict/Lax won't attach on fetch(..., credentials).
 * Use SameSite=None; Secure for production in that case.
 */
function needsCrossSiteSessionCookie(): boolean {
  if (process.env.NODE_ENV !== "production") return false;

  try {
    const fe = process.env.FRONTEND_URL;
    const api = process.env.API_URL;
    if (!fe || !api) return false;
    const feHost = new URL(fe).hostname;
    const apiHost = new URL(api).hostname;
    return registrableDomain(feHost) !== registrableDomain(apiHost);
  } catch {
    return false;
  }
}

export type SessionCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
};

export function getSessionCookieOptions(): SessionCookieOptions {
  const explicit = (process.env.SESSION_COOKIE_SAME_SITE || "").toLowerCase();
  const isProd = process.env.NODE_ENV === "production";

  if (explicit === "none") {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: WEEK_MS,
    };
  }
  if (explicit === "lax") {
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: WEEK_MS,
    };
  }
  if (explicit === "strict") {
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: WEEK_MS,
    };
  }

  if (needsCrossSiteSessionCookie()) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: WEEK_MS,
    };
  }

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: WEEK_MS,
  };
}

/** Pass to res.clearCookie(name, opts) so the browser actually removes SameSite=None cookies */
export function getClearSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
} {
  const o = getSessionCookieOptions();
  return {
    httpOnly: o.httpOnly,
    secure: o.secure,
    sameSite: o.sameSite,
    path: "/",
  };
}

// Auth Configuration
export const AUTH_CONFIG = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieName: "food_cms_session",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },
  accountLockout: {
    maxAttempts: 5,
    lockoutDuration: 15, // minutes
  },
  passwordHistory: {
    count: 5, // Remember last 5 passwords
  },
};
