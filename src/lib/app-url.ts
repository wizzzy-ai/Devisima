import "server-only";

const developmentUrl = "http://localhost:3000";

export function getOptionalAppBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) return null;
    if (process.env.NODE_ENV === "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function getAppBaseUrl() {
  const configuredUrl = getOptionalAppBaseUrl();
  if (configuredUrl) return configuredUrl;
  return new URL(developmentUrl);
}

export function getAppUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("Application URLs must be same-origin absolute paths.");
  }
  return new URL(path, getAppBaseUrl());
}
