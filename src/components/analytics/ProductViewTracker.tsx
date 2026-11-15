"use client";

import { useEffect } from "react";

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `devisima-product-view:${slug}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch("/api/analytics/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).then((response) => {
      if (response.ok) return;
      sessionStorage.removeItem(key);
      console.error(`Product view event could not be recorded (HTTP ${response.status}).`);
    }).catch((error: unknown) => {
      sessionStorage.removeItem(key);
      console.error("Product view event could not be recorded", error);
    });
  }, [slug]);
  return null;
}
