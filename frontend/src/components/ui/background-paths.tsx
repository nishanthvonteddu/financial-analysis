"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

// Colors sampled from the hero gradient blobs so paths feel like part of the same palette
const PATH_COLORS = [
  "#9333ea", // purple-600
  "#7c3aed", // violet-600
  "#6366f1", // indigo-500
  "#0ea5e9", // sky-500
  "#38bdf8", // sky-400
  "#be185d", // pink-800
  "#d97706", // amber-600
  "#f59e0b", // amber-500
];

export function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 28 }, (_, i) => ({
    color: PATH_COLORS[i % PATH_COLORS.length],
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    id: i,
    width: 0.4 + i * 0.025,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full" fill="none" viewBox="0 0 696 316">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            animate={{ opacity: [0.06, 0.18, 0.06] }}
            d={path.d}
            initial={{ opacity: 0.06 }}
            key={path.id}
            stroke={path.color}
            strokeWidth={path.width}
            transition={{
              delay: path.id * 0.6,
              duration: 12 + path.id * 0.8,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({
  title = "Background Paths",
}: {
  title?: string;
}) {
  const words = title.split(" ");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
        <motion.div
          animate={{ opacity: 1 }}
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <h1 className="mb-8 text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
            {words.map((word, wordIndex) => (
              <span className="mr-4 inline-block last:mr-0" key={wordIndex}>
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block bg-gradient-to-r from-neutral-900 to-neutral-700/80 bg-clip-text text-transparent dark:from-white dark:to-white/80"
                    initial={{ opacity: 0, y: 100 }}
                    key={`${wordIndex}-${letterIndex}`}
                    transition={{
                      damping: 25,
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      stiffness: 150,
                      type: "spring",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div className="group relative inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg backdrop-blur-lg transition-shadow duration-300 hover:shadow-xl dark:from-white/10 dark:to-black/10">
            <Button
              className="rounded-[1.15rem] border border-black/10 bg-white/95 px-8 py-6 text-lg font-semibold text-black backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-black/95 dark:text-white dark:hover:bg-black"
              variant="ghost"
            >
              <span className="opacity-90 transition-opacity group-hover:opacity-100">
                Discover Excellence
              </span>
              <span className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">
                →
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
