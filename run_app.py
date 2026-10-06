#!/usr/bin/env python3
"""Serve the card browser on localhost and open it in the default browser."""

import argparse
import errno
import http.server
import threading
import webbrowser
from pathlib import Path

APP_DIRECTORY = Path(__file__).resolve().parent
APP_PAGE = "innistrad-card-browser.html"
CARD_DATA = "innistrad-cards-and-combos.json"


class BrowserRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self._serve_request(include_body=True)

    def do_HEAD(self):
        self._serve_request(include_body=False)

    def _serve_request(self, include_body):
        route = self.path.split("?", 1)[0]
        if route == "/favicon.ico":
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        files = {
            "/": (APP_PAGE, "text/html; charset=utf-8"),
            f"/{APP_PAGE}": (APP_PAGE, "text/html; charset=utf-8"),
            f"/{CARD_DATA}": (CARD_DATA, "application/json; charset=utf-8"),
        }
        entry = files.get(route)
        if entry is None:
            self.send_error(404)
            return

        filename, content_type = entry
        file_path = self.server.app_directory / filename
        try:
            source = file_path.open("rb")
        except FileNotFoundError:
            self.send_error(404, "Required app file not found")
            return

        with source:
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(file_path.stat().st_size))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if include_body:
                while chunk := source.read(1024 * 1024):
                    self.wfile.write(chunk)

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}", flush=True)


class LocalThreadingHTTPServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, server_address, handler_class, app_directory):
        self.app_directory = app_directory
        super().__init__(server_address, handler_class)


def create_server(app_directory=APP_DIRECTORY, port=8765):
    app_directory = Path(app_directory).resolve()
    for filename in (APP_PAGE, CARD_DATA):
        if not (app_directory / filename).is_file():
            raise FileNotFoundError(f"Required app file is missing: {app_directory / filename}")

    try:
        return LocalThreadingHTTPServer(("127.0.0.1", port), BrowserRequestHandler, app_directory)
    except OSError as error:
        address_in_use = error.errno == errno.EADDRINUSE or getattr(error, "winerror", None) in (10013, 10048)
        if port == 0 or not address_in_use:
            raise
        print(f"Port {port} is already in use; selecting an available local port.", flush=True)
        return LocalThreadingHTTPServer(("127.0.0.1", 0), BrowserRequestHandler, app_directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765, help="preferred localhost port (default: 8765)")
    parser.add_argument("--no-browser", action="store_true", help="do not open the browser automatically")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")

    server = create_server(port=args.port)
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    print(f"Innistrad Card & Combo Browser: {url}", flush=True)
    print("Press Ctrl+C to stop the server.", flush=True)
    if not args.no_browser:
        threading.Timer(0.25, webbrowser.open, args=(url,)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping the card browser.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
