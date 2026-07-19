#!/bin/sh
# Runs once when the container starts (NOT at `docker build` time). This is
# what lets you change which backend the UI talks to -- e.g. point it at an
# external Ollama, a remote LLMOps instance, or a different lab port set --
# just by editing `environment:` in docker-compose.yml and restarting the
# container, with no rebuild of the image.
set -eu

: "${STUDIO_CORE_URL:=http://localhost:8000/api/v1}"
: "${RAG_LAB_URL:=http://localhost:8002}"
: "${PROMPTOPS_LAB_URL:=http://localhost:8003}"
: "${SCHEMA_LAB_URL:=http://localhost:8004}"
: "${REVIEW_LAB_URL:=http://localhost:8005}"
: "${MEMORY_LAB_URL:=http://localhost:8006}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  STUDIO_CORE_URL: "${STUDIO_CORE_URL}",
  RAG_LAB_URL: "${RAG_LAB_URL}",
  PROMPTOPS_LAB_URL: "${PROMPTOPS_LAB_URL}",
  SCHEMA_LAB_URL: "${SCHEMA_LAB_URL}",
  REVIEW_LAB_URL: "${REVIEW_LAB_URL}",
  MEMORY_LAB_URL: "${MEMORY_LAB_URL}"
};
EOF

exec nginx -g "daemon off;"
