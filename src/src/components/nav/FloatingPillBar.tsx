"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Trophy, Skull } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",         label: "Home",   jp: "ホーム",   icon: Home,   matchExact: true  },
  { href: "/#search",  label: "Search", jp: "検索",     icon: Search, matchExact: false },
  { href: "/fame",     label: "Fame",   jp: "殿堂",     icon: Trophy, matchExact: false },
  { href: "/shame",    label: "Shame",  jp: "恥の壁",   icon: Skull,  matchExact: false },
] as const;

const SCROLL_THRESHOLD = 80;

export function FloatingPillBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getIsActive = (href: string, matchExact: boolean) => {
    if (href === "/#search") return pathname === "/";
    if (matchExact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
          aria-label="Main navigation"
        >
          <div
            className="glass-pill flex items-center gap-1 px-3 py-2 pointer-events-auto"
            style={{
              borderRadius: "9999px",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              backgroundColor: "rgba(20,14,10,0.85)",
              border: "1px solid var(--color-ink-600)",
            }}
          >
            {NAV_ITEMS.map(({ href, label, jp, icon: Icon, matchExact }) => {
              const active = getIsActive(href, matchExact);
              const hovered = hoveredHref === href && !active;

              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => setHoveredHref(href)}
                  onMouseLeave={() => setHoveredHref(null)}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 group"
                  style={{
                    fontFamily: "var(--font-body)",
                    borderRadius: "9999px",
                    color: active
                      ? "var(--color-washi-100)"
                      : hovered
                        ? "var(--color-washi-200)"
                        : "var(--color-washi-400)",
                    backgroundColor: active
                      ? "var(--color-ink-700)"
                      : hovered
                        ? "rgba(250,246,241,0.10)"
                        : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    size={15}
                    style={{ flexShrink: 0 }}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="hidden sm:block">{label}</span>
                  {/* JP tooltip on hover */}
                  <AnimatePresence>
                    {hovered && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] pointer-events-none"
                        style={{
                          backgroundColor: "var(--color-ink-700)",
                          color: "var(--color-washi-300)",
                          fontFamily: "var(--font-jp)",
                          whiteSpace: "nowrap",
                          borderRadius: "6px",
                        }}
                        aria-hidden="true"
                      >
                        {jp}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
