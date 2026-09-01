#!/usr/bin/env bash
# 而這個專案要本機伺服器。這一支就是那個伺服器。
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo "http://localhost:$PORT"
python3 -m http.server "$PORT"
