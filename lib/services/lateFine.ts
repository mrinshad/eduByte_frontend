import { apiFetch } from "@/lib/api";

export interface RefreshLateFinesOptions {
  force?: boolean;
  hasUnpaidCharges?: boolean;
}

// In-memory cache of in-flight requests to avoid concurrent duplicate requests
const inFlightRefreshes = new Map<string, Promise<any>>();

// In-memory fallback
const inMemoryLastRefreshedAt = new Map<string, number>();

// 10-minute cooldown: late fee fine calculation is calendar-day based and doesn't change rapidly
const COOLDOWN_MS = 10 * 60 * 1000;

function getLastRefreshedAt(enrollmentId: string): number | null {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const val = window.sessionStorage.getItem(`latefine_refreshed_${enrollmentId}`);
      if (val) {
        const num = Number(val);
        if (!isNaN(num)) return num;
      }
    } catch {
      // ignore
    }
  }
  return inMemoryLastRefreshedAt.get(enrollmentId) ?? null;
}

function setLastRefreshedAt(enrollmentId: string, timestamp: number) {
  inMemoryLastRefreshedAt.set(enrollmentId, timestamp);
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`latefine_refreshed_${enrollmentId}`, String(timestamp));
    } catch {
      // ignore
    }
  }
}

export async function refreshLateFines(
  enrollmentId: string,
  options?: RefreshLateFinesOptions
) {
  if (!enrollmentId) return null;

  // If caller already knows there are no unpaid charges, skip network request entirely
  if (options?.hasUnpaidCharges === false) {
    return { success: true, skipped: true, reason: "no_unpaid_charges" };
  }

  const now = Date.now();
  const lastTime = getLastRefreshedAt(enrollmentId);

  // If not forcing, check if refreshed within cooldown window
  if (!options?.force && lastTime && now - lastTime < COOLDOWN_MS) {
    return { success: true, skipped: true, reason: "cooldown", lastRefreshedAt: lastTime };
  }

  // Deduplicate concurrent in-flight requests for the same enrollment
  if (inFlightRefreshes.has(enrollmentId)) {
    return inFlightRefreshes.get(enrollmentId);
  }

  const refreshPromise = (async () => {
    try {
      const payload = await apiFetch(`/api/latefines/refresh/${enrollmentId}`, {
        method: "POST",
      });
      setLastRefreshedAt(enrollmentId, Date.now());
      return payload;
    } finally {
      inFlightRefreshes.delete(enrollmentId);
    }
  })();

  inFlightRefreshes.set(enrollmentId, refreshPromise);
  return refreshPromise;
}

export function clearLateFineRefreshCache(enrollmentId?: string) {
  if (enrollmentId) {
    inMemoryLastRefreshedAt.delete(enrollmentId);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(`latefine_refreshed_${enrollmentId}`);
      } catch {
        // ignore
      }
    }
  } else {
    inMemoryLastRefreshedAt.clear();
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        Object.keys(window.sessionStorage)
          .filter((k) => k.startsWith("latefine_refreshed_"))
          .forEach((k) => window.sessionStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
  }
}