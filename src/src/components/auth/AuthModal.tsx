"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Message to show above the auth options */
  prompt?: string;
}

export function AuthModal({ open, onClose, prompt }: AuthModalProps) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // No redirect — stay on current page
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(10,7,5,0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="relative w-full max-w-sm p-6 rounded-2xl border"
              style={{
                backgroundColor: "var(--color-ink-800)",
                borderColor: "var(--color-ink-600)",
                borderRadius: "var(--radius-xl)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
                style={{ color: "var(--color-washi-400)" }}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* Wordmark */}
              <div className="mb-5">
                <h2
                  id="auth-modal-title"
                  className="text-2xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-washi-100)",
                  }}
                >
                  JOIN THE CONVERSATION
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
                >
                  コミュニティに参加する
                </p>
              </div>

              {/* Prompt */}
              {prompt && (
                <p
                  className="text-sm mb-5 leading-relaxed"
                  style={{ color: "var(--color-washi-300)" }}
                >
                  {prompt}
                </p>
              )}

              {/* Benefits */}
              <ul
                className="text-xs space-y-1.5 mb-6"
                style={{ color: "var(--color-washi-400)" }}
              >
                <li>→ Vote agree / indifferent / disagree on each rule</li>
                <li>→ Submit trope disputes and new trope suggestions</li>
                <li>→ Earn Critic status after 3 accepted submissions</li>
                <li>→ Critics' votes count 3× in community scoring</li>
              </ul>

              {/* OAuth buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => void handleOAuth("google")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-ink-700)",
                    borderColor: "var(--color-ink-600)",
                    color: "var(--color-washi-100)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {loading === "google" ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                <button
                  onClick={() => void handleOAuth("apple")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-ink-700)",
                    borderColor: "var(--color-ink-600)",
                    color: "var(--color-washi-100)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {loading === "apple" ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AppleIcon />
                  )}
                  Continue with Apple
                </button>
              </div>

              {error && (
                <p
                  className="mt-3 text-xs text-center"
                  style={{ color: "var(--color-register-trigger)" }}
                >
                  {error}
                </p>
              )}

              <p
                className="text-[10px] text-center mt-4"
                style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}
              >
                No passwords. No spam. We only store your display name and vote history.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
