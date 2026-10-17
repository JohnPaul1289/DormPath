import { defineConfig } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("@firebase/firestore") ||
            id.includes("firebase/firestore/")
          )
            return "firestore";
          if (id.includes("@firebase/auth") || id.includes("firebase/auth/"))
            return "auth";
          if (
            id.includes("node_modules/@firebase") ||
            id.includes("node_modules/firebase")
          )
            return "firebase-core";
          if (id.includes("node_modules/lucide")) return "icons";
        },
      },
    },
  },
  plugins: [
    {
      name: "offline-shell",
      writeBundle(options, bundle) {
        const assets = Object.keys(bundle).filter((name) =>
          /\.(js|css)$/.test(name),
        );
        const files = [
          "/",
          "/index.html",
          "/icon.svg",
          "/icon-192.png",
          "/icon-512.png",
          "/manifest.webmanifest",
          "/domi.png",
          ...assets.map((name) => `/${name}`),
        ];
        const entry =
          assets.find((name) => name.startsWith("assets/index-")) || "v1";
        const source = readFileSync("public/sw.js", "utf8")
          .replace(/const CACHE = .*;/, `const CACHE = ${JSON.stringify(`dormpath-${entry}`)};`)
          .replace(
            /const PRECACHE = \[[\s\S]*?\];/,
            `const PRECACHE = ${JSON.stringify(files)};`,
          );
        writeFileSync(`${options.dir}/sw.js`, source);
      },
    },
  ],
});
