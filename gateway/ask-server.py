#!/usr/bin/env python3
"""Allow on-demand TLS only for *.thecomparisonengine.com (and apex)."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

APEX = "thecomparisonengine.com"
RESERVED = {"reseller"}  # handled by its own site block; still allow cert


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        domain = (qs.get("domain") or [""])[0].lower().strip()
        ok = False
        if domain == APEX or domain == f"www.{APEX}":
            ok = True
        elif domain.endswith(f".{APEX}"):
            label = domain[: -(len(APEX) + 1)]
            # single-label subdomain only (no nested dots)
            if label and "." not in label and label.isascii():
                ok = True
        self.send_response(200 if ok else 400)
        self.end_headers()
        self.wfile.write(b"ok" if ok else b"deny")

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 9191), Handler).serve_forever()
