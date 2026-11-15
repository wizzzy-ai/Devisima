"use client";

import { Menu, X } from "lucide-react";

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function AdminHeader({ onMobileMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
