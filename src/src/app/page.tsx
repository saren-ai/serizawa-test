"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { normalizeCharacterKey } from "@/lib/characters";

// ---------------------------------------------------------------------------
// Preset characters — 6 showcase entries from the style guide
// ---------------------------------------------------------------------------

const PRESETS = [
  { name: "Mako Mori", media: "Pacific Rim" },
  { name: "Dr. Ishirō Serizawa", media: "Godzilla (2014)" },
  { name: "Mr. Miyagi", media: "The Karate Kid (1984)" },
  { name: "Hikaru Sulu", media: "Star Trek (TOS)" },
  { name: "Trini Kwan", media: "Power Rangers (1993)" },
  { name: "Yukio", media: "The Wolverine (2013)" },
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
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-ink-950)" }}>
      {/* Hero section — full viewport */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          className="w-full max-w-[480px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Wordmark */}
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <h1
              className="text-[56px] leading-none tracking-wide"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}
            >
              SERIZAWA
            </h1>
            <p
              className="text-base mt-1"
              style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
            >
              芹沢テスト
            </p>
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

          {/* Preset pills */}
          <motion.div variants={itemVariants} className="mt-6">
            <p
              className="text-xs mb-3 text-center"
              style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
            >
              Try a known character
            </p>
            <motion.div
              className="flex flex-wrap gap-2 justify-center"
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
                  className="px-3 py-1.5 text-xs rounded-full border transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: "var(--color-ink-800)",
                    borderColor: "var(--color-ink-600)",
                    color: "var(--color-washi-300)",
                    fontFamily: "var(--font-body)",
                    borderRadius: "9999px",
                  }}
                  whileHover={{ scale: 1.04, borderColor: "var(--color-vermillion-500)" }}
                  whileTap={{ scale: 0.97 }}
                >
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
