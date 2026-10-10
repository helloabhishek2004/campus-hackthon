"use client";

import { useEffect, useState } from "react";
import { sessionUserId } from "./workflow-client";

/** Use the same verified session as Lost & Found's APIs, including in demo mode. */
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let controller: AbortController;
    let disposed = false;
    async function load() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      setLoading(true);
      setUserId(null);
      setError(null);
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", signal });
        if (!response.ok) throw new Error("Unable to verify your campus session.");
        const data = await response.json();
        const id = sessionUserId(data);
        if (!disposed && !signal.aborted) setUserId(id);
      } catch (e) {
        if (!disposed && !signal.aborted) setError(e instanceof Error ? e.message : "Unable to verify your campus session.");
      } finally {
        if (!disposed && !signal.aborted) setLoading(false);
      }
    }
    void load();
    window.addEventListener("campusgram:session_changed", load);
    window.addEventListener("storage", load);
    return () => {
      disposed = true;
      controller?.abort();
      window.removeEventListener("campusgram:session_changed", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return { userId, authenticated: Boolean(userId), loading, error };
}
