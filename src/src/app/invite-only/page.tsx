"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthModal } from "@/components/auth/AuthModal";

function InviteOnlyContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const next = searchParams.get("next") ?? "/";
  const [authOpen, setAuthOpen] = useState(false);

  const notInvited = reason === "not_invited";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}
    >
      <div className="text-center max-w-md">
        <h1
          className="text-2xl font-semibold mb-3"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-washi-100)",
          }}
        >
          Invite only
        </h1>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: "var(--color-washi-400)" }}
        >
          {notInvited
            ? "Your account isn’t on the invite list. If you were sent a link, ask the host to add your email."
            : "This app is private. Sign in with an allowed account to continue."}
        </p>
        {!notInvited && (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "var(--color-vermillion-500)",
              color: "var(--color-washi-100)",
              borderRadius: "9999px",
            }}
          >
            Sign in with Google or Apple
          </button>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        prompt="Sign in with an account that’s on the invite list."
        redirectNext={next}
      />
    </main>
  );
}

export default function InviteOnlyPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}
        >
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-[var(--color-vermillion-500)] border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </main>
      }
    >
      <InviteOnlyContent />
    </Suspense>
  );
}
