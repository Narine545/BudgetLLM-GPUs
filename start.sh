#!/usr/bin/env bash
# BudgetLLM GPUs — запуск одним действием (Linux, macOS, WSL, Git Bash).
# Нужен только Python 3 — он есть почти везде. Больше ничего ставить не надо.
set -euo pipefail

cd -- "$(dirname -- "$0")"

PY=""
for candidate in python3 python py; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' >/dev/null 2>&1; then
      PY="$candidate"
      break
    fi
  fi
done

if [ -z "$PY" ]; then
  cat <<'EOF'
Python 3 не найден.

Вариант 1. Установите Python 3 (python.org или пакетный менеджер системы) и запустите снова.

Вариант 2. Просто откройте файл index.html двойным щелчком.
База полностью офлайн и не требует сервера: все данные лежат в обычных
JS-файлах рядом. Сервер нужен только для строгой CSP в некоторых браузерах
и для удобства обновления страницы.

Вариант 3 (macOS/Linux). Любой статический сервер, например:
  python3 -m http.server 8080
EOF
  exit 1
fi

exec "$PY" serve.py --open "$@"
