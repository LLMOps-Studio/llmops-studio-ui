// Default runtime config. In the Docker image, docker-entrypoint.sh
// overwrites this file at container START (not build time) with real
// values from environment variables -- see nginx/docker-entrypoint.sh.
// Left as an empty object here so local `npm run dev` / a plain
// `vite build` falls through to VITE_* env vars / hardcoded defaults
// in src/lib/config.ts.
window.__APP_CONFIG__ = {};
