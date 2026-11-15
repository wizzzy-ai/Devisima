import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/downloads/",
        "/notifications/",
        "/purchases/",
        "/profile/",
        "/settings/",
        "/seller/dashboard/",
        "/seller/earnings/",
        "/seller/orders/",
        "/seller/payouts/",
        "/seller/products/",
        "/api/",
      ],
    },
    sitemap: new URL("/sitemap.xml", getAppBaseUrl()).toString(),
  };
}
