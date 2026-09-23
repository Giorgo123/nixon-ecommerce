import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ffmpeg-core.js: build artifact de @ffmpeg/core copiado tal cual a
    // public/ para self-host (ver src/lib/video-compression.ts) — no es
    // código propio, no tiene sentido lintearlo.
    "public/ffmpeg/**",
  ]),
]);

export default eslintConfig;
