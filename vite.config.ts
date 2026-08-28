import react from "@vitejs/plugin-react";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

function staticWorker() {
  return {
    name: "moyusi-static-worker",
    apply: "build" as const,
    async closeBundle() {
      const serverOutput = resolve("dist/server");
      await mkdir(serverOutput, { recursive: true });
      await copyFile(resolve("server/index.js"), resolve(serverOutput, "index.js"));
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the app from /moyusi/, while local/Sites previews use /.
  base: process.env.GITHUB_ACTIONS === "true" ? "/moyusi/" : "/",
  plugins: [react(), sites(), staticWorker()],
});
