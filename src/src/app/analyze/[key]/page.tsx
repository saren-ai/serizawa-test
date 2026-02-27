"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Loading messages — 40+ rotating phrases in Japanifornia voice
// ---------------------------------------------------------------------------

const MESSAGES = [
  // English lines
  ["Counting tropes.", "数えています。"],
  ["Examining interiority.", "内面を検討しています。"],
  ["Assessing narrative weight.", "物語の重みを測っています。"],
  ["Consulting the taxonomy.", "分類学を参照しています。"],
  ["Checking for Oxygen Destroyers.", "オキシジェン・デストロイヤーを確認中。"],
  ["Is the character load-bearing?", "このキャラクターは主軸ですか？"],
  ["Reviewing casting decisions.", "キャスティングを確認中。"],
  ["Running the Serizawa Five.", "芹沢の五を実行中。"],
  ["Detecting silent enforcer patterns.", "沈黙の執行者パターンを検出中。"],
  ["Evaluating Q4c — irreversibility.", "Q4c — 不可逆性を評価中。"],
  ["Checking for Dragon Lady flags.", "ドラゴンレディフラグを確認中。"],
  ["Scoring with extreme prejudice.", "徹底的にスコア計算中。"],
  ["Asking if the war is still on.", "まだ戦争中か確認中。"],
  ["Measuring cultural specificity.", "文化的特殊性を測定中。"],
  ["Consulting the Wall of Shame registry.", "恥の壁を照合中。"],
  ["Checking for yellow peril undertones.", "黄禍論のニュアンスを確認中。"],
  ["Asking: does this character drive the plot?", "このキャラクターは物語を動かすか？"],
  ["Reviewing accent authenticity.", "アクセントの真正性を確認中。"],
  ["Scanning for gratuitous kimono drops.", "着物の不必要な使用を走査中。"],
  ["Evaluating independent motivation.", "独立した動機を評価中。"],
  ["Asking: what does this character WANT?", "このキャラクターは何を望んでいるか？"],
  ["Cross-referencing Nikkei heritage.", "日系のルーツを照合中。"],
  ["Applying the 30% penalty cap.", "30%ペナルティ上限を適用中。"],
  ["Verifying subversion bonuses.", "サブバージョンボーナスを確認中。"],
  ["Consulting the Mako Mori standard.", "牧森基準を参照中。"],
  ["Checking trope taxonomy, category 4.", "トロープ分類第4カテゴリを確認中。"],
  ["Did anyone ask if they wanted to do karate?", "誰かが空手をやりたいか聞いたか？"],
  ["Examining the Hāfu representation.", "ハーフの表現を検討中。"],
  ["Running Bayesian confidence weighting.", "ベイズ信頼重み付けを実行中。"],
  ["Assessing Q1b — moral complexity.", "Q1b — 道徳的複雑さを評価中。"],
  ["Checking for pan-Asian blur.", "汎アジア的ぼかしを確認中。"],
  ["Asking: is Tokyo the center of the universe?", "東京は宇宙の中心か？"],
  ["Evaluating production authenticity.", "制作の真正性を評価中。"],
  ["Calculating weighted leaderboard score.", "加重リーダーボードスコアを計算中。"],
  ["Measuring emotional counterfactual.", "感情的な仮定を測定中。"],
  ["Consulting 1954 Ishirō Serizawa archives.", "1954年 芹沢一郎アーカイブを参照中。"],
  ["Applying tonal register: Ruthless Mockery.", "トーンレジスター: 容赦ない嘲笑を適用中。"],
  ["Checking: did the character earn the 😂?", "キャラクターは😂に値するか？"],
  ["Assessing Q2c — internalized heritage.", "Q2c — 内面化された遺産を評価中。"],
  ["Final calculation in progress.", "最終計算中。"],
];

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30; // 60s max

export default function AnalyzeLoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get("name") ?? "";
  const mediaTitle = searchParams.get("media") ?? "";

  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const completedRef = useRef(false);

  // Rotate through messages every 2.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (completedRef.current) return;

    try {
      const key = encodeURIComponent(
        `${characterName}|${mediaTitle}`.toLowerCase().replace(/\s+/g, "_")
      );

      const res = await fetch(`/api/characters/${key}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterName, mediaTitle }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        if (res.status === 429) {
          setError("Rate limit reached. Please wait a moment and try again.");
          return;
        }
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { characterKey?: string };
      completedRef.current = true;

      const characterKey = data.characterKey ?? key;
      router.push(`/character/${characterKey}`);
    } catch (err) {
      if (++attemptRef.current >= MAX_POLL_ATTEMPTS) {
        setError("Analysis timed out. Please try again.");
        return;
      }
      // Retry after POLL_INTERVAL_MS
      setTimeout(runAnalysis, POLL_INTERVAL_MS);
    }
  }, [characterName, mediaTitle, router]);

  useEffect(() => {
    if (!characterName || !mediaTitle) {
      router.replace("/");
      return;
    }
    void runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [en, jp] = MESSAGES[messageIndex];

  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--color-ink-950)" }}
      >
        <div className="text-center max-w-md">
          <p className="text-base mb-4" style={{ color: "var(--color-washi-400)" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "var(--color-vermillion-500)",
              color: "var(--color-washi-100)",
              borderRadius: "9999px",
            }}
          >
            ← Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-ink-950)" }}
      aria-live="polite"
      aria-label="Analyzing character — please wait"
    >
      <div className="text-center max-w-[480px]">
        {/* Breathing glow orb */}
        <motion.div
          className="mx-auto mb-10 rounded-full"
          style={{
            width: 80,
            height: 80,
            background: "radial-gradient(circle, rgba(231,76,60,0.6) 0%, rgba(192,57,43,0.1) 70%)",
          }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Character context */}
        <p
          className="text-sm mb-6 opacity-60"
          style={{ color: "var(--color-washi-300)", fontFamily: "var(--font-mono)" }}
        >
          {characterName} · {mediaTitle}
        </p>

        {/* Rotating message */}
        <div className="h-16 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <p
                className="text-lg font-medium mb-1"
                style={{ color: "var(--color-washi-100)", fontFamily: "var(--font-body)" }}
              >
                {en}
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-jp)" }}
              >
                {jp}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: "var(--color-vermillion-500)",
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <p
          className="text-xs mt-6 opacity-40"
          style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
        >
          This typically takes 15–30 seconds
        </p>
      </div>
    </main>
  );
}
