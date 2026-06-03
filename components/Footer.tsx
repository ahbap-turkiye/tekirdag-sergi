"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-(--border) mt-auto">
      <div className="max-w-360 mx-auto px-5 md:px-16 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold italic text-primary">
              Tekirdağ&apos;ın Gözünden
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Link href="/" className="hover:text-primary transition-colors">
              Ana Sayfa
            </Link>
            <Link href="/gallery" className="hover:text-primary transition-colors">
              Galeri
            </Link>
            <Link href="/voting" className="hover:text-primary transition-colors">
              Oylama
            </Link>
            <span className="hidden md:inline">|</span>
            <span>Ahbap Tekirdağ</span>
          </div>

          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            &copy; 2024 Ahbap Tekirdağ Sergisi
          </p>
        </div>
      </div>
    </footer>
  );
}
