import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/SessionProvider";
import { DevisimaAssistant } from "@/components/assistant/DevisimaAssistant";
import { CookieConsent } from "@/components/cookies/cookie-consent";
import { getOptionalAppBaseUrl } from "@/lib/app-url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: getOptionalAppBaseUrl() ?? undefined,
  title: "Devisima — Digital Products & Software Solutions",
  description: "Discover ready-made software, templates, SaaS products, business systems, developer tools, and digital products from independent creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AuthSessionProvider>{children}<DevisimaAssistant /><CookieConsent /></AuthSessionProvider></body>
    </html>
  );
}
