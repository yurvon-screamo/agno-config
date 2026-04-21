#!/bin/sh

shutdown() {
  kill -TERM "$API_PID" "$UI_PID" "$PROXY_PID" 2>/dev/null
  sleep 10
  kill -9 "$API_PID" "$UI_PID" "$PROXY_PID" 2>/dev/null
  exit 1
}

trap shutdown TERM INT

/app/.venv/bin/uvicorn agents.app:app --host 127.0.0.1 --port 8080 --workers 1 --log-level info &
API_PID=$!

(cd /app/ui && HOSTNAME=127.0.0.1 PORT=3000 node server.js) &
UI_PID=$!

caddy run --config /etc/caddy/Caddyfile &
PROXY_PID=$!

while kill -0 "$API_PID" 2>/dev/null && \
      kill -0 "$UI_PID" 2>/dev/null && \
      kill -0 "$PROXY_PID" 2>/dev/null; do
  sleep 1
done

exit 1
