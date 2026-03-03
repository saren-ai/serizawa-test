"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Loading messages — 40+ rotating phrases in Japanifornia voice
// ---------------------------------------------------------------------------

const MESSAGES = [
  // English lines
["Counting tropes.", "トロープを数えています。"],
["Checking the interiority.", "内面を覗いています。"],
["Weighing narrative gravity.", "物語の重力を計測中。"],
["Consulting the taxonomy.", "分類表を参照中。"],
["Checking for Oxygen Destroyers.", "オキシジェン・デストロイヤーを確認中。"],
["Is this character load-bearing?", "このキャラ、外すと崩れる？"],
["Reviewing who they cast instead.", "なぜこの人が選ばれたか確認中。"],
["Running the Serizawa Five.", "芹沢の五を実行中。"],
["Detecting silent enforcer mode.", "寡黙な実行者モードを検出中。"],
["Evaluating irreversibility.", "不可逆性を評価中。"],
["Checking for Dragon Lady flags.", "ドラゴンレディフラグ確認中。"],
["Scoring with extreme prejudice.", "徹底的に採点中。"],
["Asking if the war is still on.", "まだ戦争中か確認中。"],
["How specific is the culture, exactly?", "文化、どこまで具体的？"],
["Who wrote this character, though.", "このキャラ、誰が書いたの？"],
["Confirming this isn't just vibes.", "ビジュアルだけじゃないか確認中。"],
["Was the consultant Japanese or Japanese-adjacent?", "監修者、本当に日系？"],
["Checking if the food scene did any heavy lifting.", "料理シーンが働いているか確認中。"],
["This character has a last name. Good sign.", "苗字がある。良い兆候。"],
["Did they say 'itadakimasu' correctly?", "「いただきます」ちゃんと言えた？"],
["Cross-referencing the Wall of Shame.", "恥の壁を照合中。"],
["Sniffing for yellow peril.", "黄禍論のにおいを確認中。"],
["Does this character actually *do* anything?", "このキャラ、何かしてる？"],
["Checking if the accent is doing work.", "アクセントが仕事をしているか確認中。"],
["Scanning for unnecessary kimonos.", "不要な着物を走査中。"],
["Does this character want something?", "このキャラ、欲しいものある？"],
["What do they want *for themselves*?", "自分のために何を望んでいる？"],
["Cross-referencing Nikkei lineage.", "日系のルーツを照合中。"],
["Applying the 30% penalty cap.", "30%ペナルティ上限を適用中。"],
["Verifying subversion bonuses.", "サブバージョンボーナスを確認中。"],
["Consulting the Mako Mori standard.", "牧森基準を参照中。"],
["Category 4 tropes incoming.", "カテゴリ4トロープ検出中。"],
["Did anyone ask if they wanted to do karate?", "空手やりたいか誰かに聞かれた？"],
["Examining the Hāfu gap.", "ハーフの表現格差を検討中。"],
["Running Bayesian confidence weights.", "ベイズ信頼重み付けを実行中。"],
["Checking for moral complexity.", "道徳的複雑さを確認中。"],
["Detecting pan-Asian blur.", "汎アジア的ぼかし検出中。"],
["Is Tokyo doing too much here?", "東京、張り切りすぎてない？"],
["Evaluating production receipts.", "制作の裏付けを評価中。"],
["Calculating weighted score.", "加重スコアを計算中。"],
["Measuring the emotional counterfactual.", "感情的な仮定を測定中。"],
["Consulting the 1954 Serizawa archives.", "1954年 芹沢アーカイブを参照中。"],
["Applying Ruthless Mockery mode.", "容赦ない嘲笑モードを適用中。"],
["Did this character earn the 😂?", "このキャラ、😂に値する？"],
["Checking for internalized heritage.", "内面化された遺産を確認中。"],
["Final verdict incoming.", "最終判定、間もなく。"],
["Final calculation in progress.", "最終計算中。"],
];

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30; // 60s max

export default function AnalyzeLoadingPage() {
  return (
    <Suspense>
      <AnalyzeContent />
    </Suspense>
  );
}

function AnalyzeContent() {
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
        // 408 = our hard timeout — retriable, show specific message
        if (res.status === 408) {
          setError(body.error ?? "Analysis timed out. Please try again.");
          return;
        }
        // Other non-retriable errors — show the message directly
        if (res.status === 503 || res.status === 400 || res.status === 422) {
          setError(body.error ?? `Server error (${res.status}). Please try again.`);
          return;
        }
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { characterKey?: string };
      completedRef.current = true;

      const characterKey = data.characterKey ?? decodeURIComponent(key);
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
        style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}
      >
        <div className="text-center max-w-md">
          <p className="text-base mb-6" style={{ color: "var(--color-washi-400)" }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                attemptRef.current = 0;
                completedRef.current = false;
                void runAnalysis();
              }}
              className="px-6 py-3 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "var(--color-vermillion-500)",
                color: "var(--color-washi-100)",
                borderRadius: "9999px",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-full text-sm font-medium border"
              style={{
                borderColor: "var(--color-ink-600)",
                color: "var(--color-washi-400)",
                borderRadius: "9999px",
              }}
            >
              ← Back to home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}
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
