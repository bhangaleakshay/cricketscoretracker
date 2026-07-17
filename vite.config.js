import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When building inside GitHub Actions, GITHUB_REPOSITORY is set to "owner/repo".
// We use that to automatically set the correct base path for GitHub Pages
// (https://owner.github.io/repo/). Locally (npm run dev) this just falls back to "/".
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : "";

export default defineConfig({
  plugins: [react()],
  base: repo ? `/${repo}/` : "/",
});
