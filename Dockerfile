# ── Python dependencies ──────────────────────────────────────────────
FROM python:3.12-slim AS python-deps
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv venv .venv && \
    . .venv/bin/activate && \
    uv sync --frozen --no-dev

# ── Node.js dependencies ─────────────────────────────────────────────
FROM node:20-slim AS node-deps
RUN corepack enable
WORKDIR /app
COPY agent-ui/package.json agent-ui/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Next.js build ────────────────────────────────────────────────────
FROM node:20-slim AS node-builder
RUN corepack enable
WORKDIR /app
COPY --from=node-deps /app/node_modules ./node_modules
COPY agent-ui/ .
RUN pnpm build

# ── Caddy binary ─────────────────────────────────────────────────────
FROM caddy:2-alpine AS caddy

# ── Final image ──────────────────────────────────────────────────────
FROM python:3.12-slim AS runner

RUN apt-get update && \
    apt-get install -y --no-install-recommends tini curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app/data /app/ui

COPY --from=python-deps /app/.venv /app/.venv
COPY --from=node-builder /usr/local/bin/node /usr/local/bin/node
COPY --from=node-builder /app/.next/standalone ./ui/
COPY --from=node-builder /app/.next/static ./ui/.next/static
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY agents/ agents/
COPY entrypoint.sh /app/entrypoint.sh

RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DB_DIR=/app/data \
    PORT=3000 \
    HOSTNAME="127.0.0.1"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["/app/entrypoint.sh"]
