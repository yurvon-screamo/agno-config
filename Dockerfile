# =============================================================================
# Stage 1: Build Next.js frontend (static export)
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/agent-ui

# Enable corepack for pnpm
RUN corepack enable

# Copy dependency files first for better caching
COPY agent-ui/package.json agent-ui/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY agent-ui/ .

# Build static export
# NEXT_PUBLIC_AGENT_OS_URL is set to empty string so the frontend
# makes API requests to the same origin (Caddy will proxy them)
ENV NEXT_PUBLIC_AGENT_OS_URL=""
RUN pnpm build

# =============================================================================
# Stage 2: Final image with Caddy + Python + Node.js
# =============================================================================
FROM caddy:2

# Install Python runtime, Node.js (for npx used by MCP tools), and required tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    nodejs \
    npm \
    tini \
    curl \
    libstdc++ \
    libffi

# Install build dependencies temporarily for Python package compilation
# These are needed to compile native extensions in dependencies
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    rust

# Install uv for package management and uvx for MCP tools
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY --from=ghcr.io/astral-sh/uv:latest /uvx /usr/local/bin/uvx

# Create app directory structure
WORKDIR /app

# Create directory for SQLite databases (volume-mountable)
RUN mkdir -p /app/data

# Copy Python source code and dependency files
COPY agents/ agents/
COPY pyproject.toml uv.lock ./

# Create virtual environment and install dependencies
# IMPORTANT: Venv must be created in the final image (not copied from builder)
# because the Python binary location differs between python:3.12-alpine
# (/usr/local/bin/python3) and caddy:2 with apk python3 (/usr/bin/python3)
RUN uv venv .venv && \
    . .venv/bin/activate && \
    uv sync --frozen --no-dev

# Remove build dependencies to keep image smaller
RUN apk del .build-deps

# Copy Next.js static export
COPY --from=frontend-builder /app/agent-ui/out /app/www

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile
# Fix Windows line endings (CRLF -> LF)
RUN sed -i 's/\r$//' /etc/caddy/Caddyfile

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
# Fix Windows line endings (CRLF -> LF) and make executable
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set environment variables
ENV PATH="/app/.venv/bin:/usr/local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DB_DIR=/app/data \
    PORT=7777

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Use tini as init process to handle signals properly
ENTRYPOINT ["tini", "--"]

# Start both Python backend and Caddy
CMD ["/app/entrypoint.sh"]
