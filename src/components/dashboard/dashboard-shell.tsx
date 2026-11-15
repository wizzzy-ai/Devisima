"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { Menu } from "lucide-react";

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="lg:hidden px-4 py-3 flex items-center gap-3 border-b border-border/50 bg-card">
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold">Dashboard</span>
        </div>

        <div className="flex">
          <DashboardSidebar user={user} />

          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-card overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <DashboardSidebar user={user} isMobile onClose={() => setIsMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
