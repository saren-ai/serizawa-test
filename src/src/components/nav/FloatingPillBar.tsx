"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Trophy, Skull } from "lucide-react";

// ---------------------------------------------------------------------------
// Navigation destinations (4 max — UX-flow.md §2)
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: "/",         label: "Home",   jp: "ホーム",   icon: Home   },
  { href: "/search",   label: "Search", jp: "検索",     icon: Search },
  { href: "/fame",     label: "Fame",   jp: "殿堂",     icon: Trophy },
  { href: "/shame",    label: "Shame",  jp: "恥の壁",   icon: Skull  },
] as const;

const SCROLL_THRESHOLD = 80; // px before pill bar appears

export function FloatingPillBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Show pill bar after scrolling past threshold
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll(); // initial check
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Determine active tab — exact match for home, prefix for others
  const getIsActive = (href: string) => {
    if (href === "/") return pathname === "/";
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
          className="fixed bottom-6 left-1/2 z-50"
          style={{ transform: "translateX(-50%)" }}
          aria-label="Main navigation"
        >
          <div
            className="glass-pill flex items-center gap-1 px-2 py-2"
            style={{ borderRadius: "9999px" }}
          >
            {NAV_ITEMS.map(({ href, label, jp, icon: Icon }) => {
              const active = getIsActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors group"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: active ? "var(--color-washi-100)" : "var(--color-washi-400)",
                    backgroundColor: active ? "var(--color-ink-700)" : "transparent",
                    borderRadius: "9999px",
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
                  <span
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: "var(--color-ink-700)",
                      color: "var(--color-washi-300)",
                      fontFamily: "var(--font-jp)",
                      whiteSpace: "nowrap",
                    }}
                    aria-hidden="true"
                  >
                    {jp}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
