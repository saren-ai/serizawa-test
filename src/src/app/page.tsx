"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { normalizeCharacterKey } from "@/lib/characters";

// ---------------------------------------------------------------------------
// Preset characters — 8 showcase entries for the home page
// ---------------------------------------------------------------------------

const PRESETS = [
  { name: "Mako Mori", media: "Pacific Rim", img: "/characters/mako_mori__pacific_rim.png" },
  { name: "Dr. Ishirō Serizawa", media: "Godzilla (2014)", img: "/characters/dr_serizawa__godzilla.png" },
  { name: "Mr. Miyagi", media: "The Karate Kid (1984)", img: "/characters/mr_miyagi__karate_kid.png" },
  { name: "Hikaru Sulu", media: "Star Trek (TOS)", img: "/characters/hikaru_sulu__star_trek.png" },
  { name: "Yukio", media: "The Wolverine (2013)", img: "/characters/yukio_the_wolverine.png" },
  { name: "Akira", media: "John Wick: Chapter 4", img: "/characters/akira_john_wick_4.png" },
  { name: "O-Ren Ishii", media: "Kill Bill: Vol. 1" },
  { name: "Hiro Nakamura", media: "Heroes" },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const presetVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const [characterName, setCharacterName] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = useCallback(
    async (name: string, media: string) => {
      const trimName = name.trim();
      const trimMedia = media.trim();
      if (!trimName || !trimMedia) return;

      setIsLoading(true);
      const key = normalizeCharacterKey(trimName, trimMedia);
      router.push(`/analyze/${key}?name=${encodeURIComponent(trimName)}&media=${encodeURIComponent(trimMedia)}`);
    },
    [router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleAnalyze(characterName, mediaTitle);
  };

  const handlePreset = (name: string, media: string) => {
    setCharacterName(name);
    setMediaTitle(media);
    void handleAnalyze(name, media);
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}
    >
      {/* Hero section — full viewport */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          className="w-full max-w-[540px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Wordmark with Dr. Serizawa portrait */}
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div
                className="relative w-[60px] h-[60px] rounded-full overflow-hidden shrink-0"
                style={{
                  border: "2px solid var(--color-vermillion-500)",
                  boxShadow: "0 0 20px rgba(207,45,37,0.25)",
                }}
              >
                <Image
                  src="/characters/dr_serizawa__godzilla.png"
                  alt="Dr. Ishirō Serizawa"
                  fill
                  className="object-cover"
                  sizes="60px"
                  priority
                />
              </div>
              <div>
                <h1
                  className="text-[42px] leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}
                >
                  THE SERIZAWA TEST
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
                >
                  芹沢テスト
                </p>
              </div>
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--color-washi-400)" }}>
              Japanese character representation in Western media.{" "}
              <span style={{ color: "var(--color-washi-300)" }}>Scored honestly.</span>
            </p>
          </motion.div>

          {/* Analysis form */}
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-3">
            {/* Character name input */}
            <div>
              <label
                htmlFor="character-name"
                className="block text-xs mb-1.5 tracking-wide uppercase"
                style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
              >
                Character name
                <span
                  className="ml-2 normal-case tracking-normal"
                  style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)", opacity: 0.6 }}
                >
                  キャラクター名
                </span>
              </label>
              <input
                id="character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Mr. Miyagi"
                autoComplete="off"
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-3 text-base rounded-xl border transition-colors outline-none disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-ink-800)",
                  borderColor: "var(--color-ink-600)",
                  color: "var(--color-washi-100)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "var(--radius-md)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
              />
            </div>

            {/* Media title input */}
            <div>
              <label
                htmlFor="media-title"
                className="block text-xs mb-1.5 tracking-wide uppercase"
                style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
              >
                Media title
                <span
                  className="ml-2 normal-case tracking-normal"
                  style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)", opacity: 0.6 }}
                >
                  作品名
                </span>
              </label>
              <input
                id="media-title"
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder="e.g. The Karate Kid (1984)"
                autoComplete="off"
                disabled={isLoading}
                className="w-full px-4 py-3 text-base rounded-xl border transition-colors outline-none disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-ink-800)",
                  borderColor: "var(--color-ink-600)",
                  color: "var(--color-washi-100)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "var(--radius-md)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
              />
            </div>

            {/* Analyze button */}
            <button
              type="submit"
              disabled={isLoading || !characterName.trim() || !mediaTitle.trim()}
              className="w-full py-3.5 text-base font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-vermillion-500)",
                color: "var(--color-washi-100)",
                fontFamily: "var(--font-body)",
                borderRadius: "var(--radius-md)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget.style.backgroundColor = "var(--color-vermillion-400)");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.backgroundColor = "var(--color-vermillion-500)");
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                "Run the Serizawa Test →"
              )}
            </button>
          </motion.form>

          {/* Preset characters — prominent showcase */}
          <motion.div
            variants={itemVariants}
            className="mt-8 rounded-2xl px-5 py-5"
            style={{
              backgroundColor: "rgba(250,246,241,0.03)",
              border: "1px solid var(--color-ink-700)",
            }}
          >
            <p
              className="text-xs mb-4 text-center tracking-wide uppercase"
              style={{ color: "var(--color-washi-300)", fontFamily: "var(--font-mono)" }}
            >
              Or pick a character
              <span
                className="ml-2 normal-case tracking-normal"
                style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)", opacity: 0.6 }}
              >
                キャラクターを選ぶ
              </span>
            </p>
            <motion.div
              className="flex flex-wrap gap-2.5 justify-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {PRESETS.map((preset) => (
                <motion.button
                  key={`${preset.name}|${preset.media}`}
                  variants={presetVariants}
                  onClick={() => handlePreset(preset.name, preset.media)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-full border transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: "var(--color-ink-800)",
                    borderColor: "var(--color-ink-600)",
                    color: "var(--color-washi-200)",
                    fontFamily: "var(--font-body)",
                    borderRadius: "9999px",
                  }}
                  whileHover={{
                    scale: 1.04,
                    borderColor: "var(--color-vermillion-500)",
                    backgroundColor: "rgba(207,45,37,0.08)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {preset.img ? (
                    <span className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={preset.img}
                        alt={preset.name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </span>
                  ) : (
                    <span
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px]"
                      style={{
                        backgroundColor: "var(--color-ink-700)",
                        color: "var(--color-washi-400)",
                        fontFamily: "var(--font-jp)",
                      }}
                    >
                      人
                    </span>
                  )}
                  {preset.name}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Below-fold teaser columns */}
      <motion.section
        className="border-t px-4 py-12"
        style={{ borderColor: "var(--color-ink-700)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-[960px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {TEASERS.map((t) => (
            <div key={t.title}>
              <div
                className="text-2xl mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-vermillion-500)" }}
              >
                {t.title}
              </div>
              <div
                className="text-xs mb-1"
                style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
              >
                {t.jp}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-washi-400)" }}>
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Footer — minimal */}
      <footer
        className="border-t px-4 py-6 text-center"
        style={{ borderColor: "var(--color-ink-700)", color: "var(--color-washi-400)" }}
      >
        <p className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>
          Serizawa Test · Not peer-reviewed research. Just peer-reviewed opinions.
        </p>
      </footer>
    </main>
  );
}

const TEASERS = [
  {
    title: "THE FIVE",
    jp: "芹沢の五",
    body: "Five questions. Human Individuality, Japanese Identity, Harmful Tropes, Narrative Impact, Production Authenticity. Weighted. Honest. No curved grading.",
  },
  {
    title: "AI + COMMUNITY",
    jp: "AIとコミュニティ",
    body: "Claude scores first. Critics and audience validate. The math is on-chain. Every analysis is versioned and auditable. Scores don't disappear.",
  },
  {
    title: "WALL OF SHAME",
    jp: "恥の壁",
    body: "Below 4.50? Yellowface with major tropes? The Wall of Shame is not a joke. It is a public record. Named. Documented. Searchable.",
  },
];
