#!/usr/bin/env python3
"""BudgetLLM GPUs — локальный статический сервер.

Зачем он нужен, если есть `python3 -m http.server`:
  * отдаёт правильные MIME-типы для .js/.css/.svg (иначе некоторые браузеры
    отказываются исполнять скрипты);
  * отправляет заголовки безопасности (CSP, nosniff, no-referrer);
  * запрещает листинг каталогов и выход за пределы папки с базой;
  * не кэширует ответы, чтобы правки в данных были видны сразу;
  * сам находит свободный порт.

Зависимостей нет — только стандартная библиотека Python 3.8+.
"""

from __future__ import annotations

import argparse
import contextlib
import functools
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))

EXTRA_TYPES = {
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
    ".ico": "image/x-icon",
    ".map": "application/json; charset=utf-8",
}

# Политика специально совпадает с той, что в <meta> в index.html, но без
# frame-ancestors: этот сервер рассчитан и на встраивание в предпросмотр.
CSP = (
    "default-src 'none'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "font-src 'self' data:; "
    "connect-src 'none'; "
    "media-src 'none'; "
    "worker-src 'none'; "
    "manifest-src 'none'; "
    "base-uri 'none'; "
    "form-action 'none'; "
    "object-src 'none'"
)

SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cache-Control": "no-store, must-revalidate",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    """Статика из папки базы, без листингов и без выхода наружу."""

    #: Показывать содержимое каталога нельзя: это локальный сервер разработки.
    def list_directory(self, path):  # noqa: D102 - переопределение stdlib
        self.send_error(404, "Not Found")
        return None

    def guess_type(self, path):  # noqa: D102
        ext = os.path.splitext(str(path))[1].lower()
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):  # noqa: D102
        for key, value in SECURITY_HEADERS.items():
            self.send_header(key, value)
        super().end_headers()

    # Спокойные однострочные логи вместо панели «GET /... 200 -».
    def log_message(self, fmt, *args):  # noqa: D102
        sys.stderr.write("  %s\n" % (fmt % args))


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def find_port(host: str, start: int, tries: int = 20) -> int:
    for port in range(start, start + tries):
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind((host, port))
            except OSError:
                continue
        return port
    raise SystemExit("Не нашёл свободный порт в диапазоне %d–%d." % (start, start + tries - 1))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Локальный сервер базы BudgetLLM GPUs",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("-p", "--port", type=int, default=8080, help="начальный порт")
    parser.add_argument("--host", default="127.0.0.1",
                        help="адрес прослушивания (0.0.0.0 — если нужен доступ из сети)")
    parser.add_argument("--open", action="store_true", help="открыть браузер после запуска")
    parser.add_argument("--dir", default=ROOT, help="каталог с базой")
    args = parser.parse_args(argv)

    directory = os.path.abspath(args.dir)
    if not os.path.isfile(os.path.join(directory, "index.html")):
        print("В каталоге %s нет index.html — это точно папка с базой?" % directory, file=sys.stderr)
        return 2

    port = find_port(args.host, args.port)
    handler = functools.partial(Handler, directory=directory)

    try:
        httpd = Server((args.host, port), handler)
    except OSError as exc:
        print("Не удалось занять порт: %s" % exc, file=sys.stderr)
        return 1

    shown_host = "localhost" if args.host in ("0.0.0.0", "::", "") else args.host
    url = "http://%s:%d/" % (shown_host, port)

    print()
    print("  BudgetLLM GPUs — база открыта по адресу:")
    print("  %s" % url)
    print()
    print("  Ctrl+C — остановить. Данные лежат в assets/data/, правки видны после обновления страницы.")
    print()

    if args.open:
        threading.Timer(0.7, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Остановлено.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
