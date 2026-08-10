#!/usr/bin/env python3
"""Build static frontend from HTML simulation + API-wired app.js."""
from pathlib import Path
import shutil
import re

ROOT = Path(__file__).resolve().parent
SRC = Path("/mnt/c/Users/Moin/Downloads/Green_Drive_html_20260725_055284.html")
FRONT = ROOT / "frontend"

# Prefer Windows path via WSL; fall back to local copy if present
if not SRC.exists():
    alt = Path("/home/moin/financial-system/GreenDrivePakistan/_source.html")
    if alt.exists():
        SRC = alt
    else:
        raise SystemExit(f"HTML source not found: {SRC}")

html = SRC.read_text(encoding="utf-8")
# Drop inline mock script; load app.js
html = re.sub(
    r"<script>.*?</script>\s*</body>",
    '<script src="/app.js"></script>\n</body>',
    html,
    count=1,
    flags=re.DOTALL,
)
html = html.replace(
    "Simulated Prototype. All data mock.",
    "Demo data seeded via API.",
)

# Clean React leftovers if present
for name in [
    "src", "node_modules", "dist", "package.json", "package-lock.json",
    "vite.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json",
    "tailwind.config.js", "postcss.config.js", ".env", ".env.example",
]:
    p = FRONT / name
    if p.is_dir():
        shutil.rmtree(p, ignore_errors=True)
    elif p.is_file():
        p.unlink(missing_ok=True)

FRONT.mkdir(parents=True, exist_ok=True)
(FRONT / "index.html").write_text(html, encoding="utf-8")
print(f"wrote {FRONT / 'index.html'} ({(FRONT / 'index.html').stat().st_size} bytes)")
print("ok")
