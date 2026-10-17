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
    {
      name: "netlify-functions-dev",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === "/.netlify/functions/upload" && req.method === "POST") {
            try {
              try {
                const envContent = readFileSync(".env.local", "utf8");
                envContent.split(/\r?\n/).forEach((line) => {
                  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
                  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
                });
              } catch {}

              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const bodyBuffer = Buffer.concat(chunks);

              const { default: uploadHandler } = await import("./netlify/functions/upload.mjs");
              
              const headers = new Headers();
              for (const [k, v] of Object.entries(req.headers)) {
                if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
              }

              const webReq = new Request("http://localhost/.netlify/functions/upload", {
                method: "POST",
                headers,
                body: bodyBuffer,
                duplex: "half",
              });

              const webRes = await uploadHandler(webReq);
              res.statusCode = webRes.status;
              webRes.headers.forEach((v, k) => res.setHeader(k, v));
              const resBody = await webRes.text();
              res.end(resBody);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Upload handler error." }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
});
