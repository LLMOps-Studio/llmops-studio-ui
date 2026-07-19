# Stage 1: Build the React application
#
# FIX: switched from node:18-alpine to node:20-slim (Debian/glibc). Alpine's
# musl libc has a well-documented incompatibility with Tailwind CSS v4's
# Rust-based "oxide" engine (@tailwindcss/oxide) -- npm's optional-dependency
# resolution (npm/cli#4828) frequently fails to install/load the correct
# musl-target native binary on Alpine even from a completely fresh install
# (confirmed: removing package-lock.json alone did not resolve this for the
# oxide package specifically, only for some of the other native deps).
# node:20-slim avoids the musl/glibc native-binding problem entirely.
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json ./
# Intentionally not copying package-lock.json -- see LLMOpsUI/.gitignore for
# why it isn't committed (a lockfile generated on a different host OS can
# still lock the wrong platform variant for other optional deps).
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx for optimal production performance
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Replace default nginx config to support React router
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
