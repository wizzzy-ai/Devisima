"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div>
        <AdminHeader
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <div className="flex">
          <AdminSidebar user={user} />

          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-card overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <AdminSidebar user={user} isMobile onClose={() => setIsMobileMenuOpen(false)} />
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
