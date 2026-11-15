import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates a callback URL to prevent open redirect vulnerabilities.
 * Returns null if the URL is unsafe, otherwise returns the safe URL.
 */
export function getSafeCallbackUrl(value: string | null, baseUrl: string): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  try {
    const destination = new URL(value, baseUrl);
    if (destination.origin !== baseUrl) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
