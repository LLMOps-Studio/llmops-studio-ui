/**
 * Central backend URL resolution.
 *
 * Every lab tab used to hardcode its own `http://localhost:800X` address
 * directly in the component (RAGBenchmarkLab, PromptOpsLab, SchemaLab,
 * ReviewLab, MemoryLab, BatchEvalLab). That only ever works when the
 * browser and the docker-compose stack are on the exact same machine with
 * the exact same port mapping -- it breaks the moment the UI is opened
 * from another device, deployed to a server, or pointed at a differently
 * configured backend (e.g. an external Ollama / a remote LLMOps instance
 * used to evaluate a Finwise model).
 *
 * Resolution order, highest priority first:
 *   1. window.__APP_CONFIG__  -- injected by docker-entrypoint.sh at
 *      CONTAINER START (not build time) via envsubst into /config.js,
 *      which index.html loads before the app bundle. This is what lets
 *      you point a already-built image at a different backend just by
 *      changing environment: in docker-compose.yml and restarting the
 *      container -- no rebuild required.
 *   2. import.meta.env.VITE_*  -- baked in at `vite build` time, or read
 *      live by `vite dev`. Used for local development (`npm run dev`)
 *      where there is no nginx/entrypoint step at all.
 *   3. Hardcoded localhost defaults -- matches the previous behavior
 *      exactly, so a plain `docker compose up` with no extra config still
 *      works out of the box.
 */

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string>;
  }
}

function resolve(key: string, viteKey: string, fallback: string): string {
  const runtime = typeof window !== 'undefined' ? window.__APP_CONFIG__?.[key] : undefined;
  if (runtime && !runtime.startsWith('__') /* unreplaced envsubst token */) {
    return runtime;
  }
  const vite = (import.meta.env as Record<string, string | undefined>)[viteKey];
  if (vite) return vite;
  return fallback;
}

export const STUDIO_CORE_URL = resolve(
  'STUDIO_CORE_URL',
  'VITE_API_BASE_URL',
  'http://localhost:8000/api/v1',
);
export const RAG_LAB_URL = resolve('RAG_LAB_URL', 'VITE_RAG_LAB_URL', 'http://localhost:8002');
export const PROMPTOPS_LAB_URL = resolve(
  'PROMPTOPS_LAB_URL',
  'VITE_PROMPTOPS_LAB_URL',
  'http://localhost:8003',
);
export const SCHEMA_LAB_URL = resolve(
  'SCHEMA_LAB_URL',
  'VITE_SCHEMA_LAB_URL',
  'http://localhost:8004',
);
export const REVIEW_LAB_URL = resolve(
  'REVIEW_LAB_URL',
  'VITE_REVIEW_LAB_URL',
  'http://localhost:8005',
);
export const MEMORY_LAB_URL = resolve(
  'MEMORY_LAB_URL',
  'VITE_MEMORY_LAB_URL',
  'http://localhost:8006',
);
