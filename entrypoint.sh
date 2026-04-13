#!/bin/sh
set -e

# =============================================================================
# Entrypoint script for agno-config Docker container
# Starts Python FastAPI backend and Caddy reverse proxy
# =============================================================================

echo "=== Starting agno-config ==="

# -----------------------------------------------------------------------------
# Start Python backend in background
# -----------------------------------------------------------------------------
echo "[backend] Starting AgentOS FastAPI server on port ${PORT:-7777}..."

# Change to app directory and start uvicorn
cd /app

# Graceful shutdown: kill backend when container stops
cleanup() {
    echo "[backend] Shutting down backend (PID $BACKEND_PID)..."
    kill -TERM "$BACKEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
    echo "[backend] Backend stopped."
}
trap cleanup EXIT SIGTERM SIGINT

# Start the backend in background
# Use full path to uvicorn in venv to avoid PATH issues with nohup
nohup /app/.venv/bin/uvicorn agents.app:app \
    --host 0.0.0.0 \
    --port "${PORT:-7777}" \
    --workers 1 \
    --log-level info \
    > /var/log/backend.log 2>&1 &

BACKEND_PID=$!
echo "[backend] Started with PID $BACKEND_PID"

# -----------------------------------------------------------------------------
# Wait for backend to be ready
# -----------------------------------------------------------------------------
echo "[backend] Waiting for backend to be ready..."
MAX_RETRIES=120
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "http://localhost:${PORT:-7777}/health" > /dev/null 2>&1; then
        echo "[backend] Backend is ready!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "[backend] Waiting... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 1

    # Check if backend process is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "[backend] ERROR: Backend process died unexpectedly!"
        echo "[backend] Last log output:"
        tail -20 /var/log/backend.log
        exit 1
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "[backend] ERROR: Backend failed to start within timeout!"
    echo "[backend] Log output:"
    tail -50 /var/log/backend.log
    exit 1
fi

# -----------------------------------------------------------------------------
# Start Caddy in foreground
# -----------------------------------------------------------------------------
echo "[caddy] Starting Caddy..."
echo "=== agno-config is ready ==="
echo ""

# Run Caddy in foreground
# Signals (SIGTERM, SIGINT) will be handled by tini and forwarded to Caddy
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
