"use client";

import { useEffect } from "react";

export function VisitBeacon() {
  useEffect(() => {
    const key = "bb_visit_ping";
    const last = sessionStorage.getItem(key);
    if (last && Date.now() - Number(last) < 60_000) return;
    sessionStorage.setItem(key, String(Date.now()));
    fetch("/api/visit", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);
  return null;
}
