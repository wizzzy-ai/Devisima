"use client";

import { useState } from "react";

function getScreenshotUrl(siteUrl: string) {
  try {
    const url = new URL(siteUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Always capture the site's home page, even when the seller pasted a deeper link.
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    const homePageUrl = encodeURIComponent(url.toString());
    return `https://api.microlink.io/?url=${homePageUrl}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1440&viewport.height=900&viewport.deviceScaleFactor=2&waitUntil=load&waitForTimeout=8000`;
  } catch {
    return null;
  }
}

export function WebsitePreview({
  siteUrl,
  title,
  fallbackSrc,
  className,
}: {
  siteUrl: string;
  title: string;
  fallbackSrc?: string;
  className: string;
}) {
  const isSompay = title.toLowerCase().includes("sompay") || siteUrl.toLowerCase().includes("sompay");
  const effectiveFallback = fallbackSrc || (isSompay ? "/products/sompay-preview.svg" : undefined);
  const screenshot = getScreenshotUrl(siteUrl);
  const [failed, setFailed] = useState(!screenshot);

  if (failed) {
    return effectiveFallback ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={effectiveFallback} alt={`${title} preview`} className={className} />
    ) : (
      <div className={`${className} flex items-center justify-center bg-[#f7f9f7] p-4 text-center text-xs text-muted-foreground`}>
        Website preview unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={screenshot!}
      alt={`${title} website preview`}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
