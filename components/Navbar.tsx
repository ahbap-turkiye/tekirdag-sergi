"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/gallery", label: "Galeri" },
  { href: "/exhibition", label: "Sergi" },
  { href: "/voting", label: "Oylama" },
  { href: "/submissions", label: "Katıl" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="max-w-360 mx-auto px-5 md:px-16 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="font-display text-lg md:text-xl font-bold italic tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Tekirdağ&apos;ın{" "}
            <span className="text-primary glow-text">Gözünden</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive
                    ? "text-primary"
                    : "text-(--text-secondary) hover:text-(--text)"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    style={{ boxShadow: "0 0 8px rgba(120, 190, 32, 0.5)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-(--border) hover:border-primary transition-all duration-300 hover:shadow-[0_0_12px_rgba(120,190,32,0.3)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </motion.nav>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg flex items-center justify-center border border-(--border) hover:border-primary transition-all"
        aria-label="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 glass border-t border-(--border) py-4 px-5"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-3 text-base font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary"
                  : "text-(--text-secondary) hover:text-(--text)"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
