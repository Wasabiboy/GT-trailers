"""
Scan HTML for local image references; resize any raster wider than MAX_W pxin place, preserving aspect ratio. Skips SVG. Reports external URLs separately.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MAX_W = 2000
RASTER_EXT = {".png", ".jpg", ".jpeg", ".webp"}

SRC_RE = re.compile(
    r"""src\s*=\s*(?P<q>['"])(?P<path>images/[^'"]+)(?P=q)""",
    re.IGNORECASE,
)
URL_RE = re.compile(
    r"""url\s*\(\s*(?P<q>['"]?)(?P<path>images/[^'")\s]+)(?P=q)\s*\)""",
    re.IGNORECASE,
)
EXT_URL_RE = re.compile(
    r"""https?://[^'"\s>]+\.(?:webp|png|jpe?g)(?:\?[^'"\s>]*)?""",
    re.IGNORECASE,
)


def collect_paths_from_html(html_dir: Path) -> tuple[set[Path], set[str]]:
    local: set[Path] = set()
    external: set[str] = set()
    for html in html_dir.glob("*.html"):
        text = html.read_text(encoding="utf-8", errors="replace")
        for m in SRC_RE.finditer(text):
            local.add(ROOT / unquote(m.group("path").replace("/", "\\")))
        for m in URL_RE.finditer(text):
            local.add(ROOT / unquote(m.group("path").replace("/", "\\")))
        for m in EXT_URL_RE.finditer(text):
            external.add(m.group(0))
    return local, external


def resize_if_needed(path: Path) -> tuple[str, int, int] | None:
    if path.suffix.lower() not in RASTER_EXT:
        return None
    if not path.is_file():
        return None
    with Image.open(path) as im:
        w, h = im.size
        if w <= MAX_W:
            return ("ok", w, h)
        new_w = MAX_W
        new_h = max(1, round(h * (MAX_W / w)))
        mode = im.mode
        if path.suffix.lower() in (".jpg", ".jpeg") and mode in ("RGBA", "P"):
            im = im.convert("RGB")
        elif path.suffix.lower() == ".webp" and mode == "P" and "transparency" in im.info:
            im = im.convert("RGBA")
        resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        save_kw: dict = {}
        if path.suffix.lower() == ".jpeg" or path.suffix.lower() == ".jpg":
            save_kw["quality"] = 92
            save_kw["optimize"] = True
        elif path.suffix.lower() == ".png":
            save_kw["optimize"] = True
        elif path.suffix.lower() == ".webp":
            save_kw["quality"] = 90
            save_kw["method"] = 6
        resized.save(path, **save_kw)
        return ("resized", new_w, new_h)


def main() -> int:
    local_refs, external = collect_paths_from_html(ROOT)
    missing = [p for p in sorted(local_refs) if p.suffix.lower() in RASTER_EXT and not p.is_file()]
    print("=== Local raster files referenced in HTML ===\n")
    resized_count = 0
    for p in sorted(local_refs):
        if p.suffix.lower() not in RASTER_EXT:
            continue
        if not p.is_file():
            print(f"MISSING: {p.relative_to(ROOT)}")
            continue
        with Image.open(p) as im:
            w0, h0 = im.size
        result = resize_if_needed(p)
        rel = p.relative_to(ROOT)
        if result is None:
            continue
        status, w1, h1 = result
        if status == "ok":
            print(f"OK      {rel}  {w0}x{h0}")
        else:
            print(f"RESIZED {rel}  {w0}x{h0} -> {w1}x{h1}")
            resized_count += 1
    if missing:
        print("\n=== Missing files (broken refs?) ===")
        for p in missing:
            print(p.relative_to(ROOT))
    if external:
        print("\n=== External images (not resized; host controls dimensions) ===")
        for u in sorted(external):
            print(u)
    print(f"\nDone. Resized {resized_count} file(s). Max width {MAX_W}px.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
