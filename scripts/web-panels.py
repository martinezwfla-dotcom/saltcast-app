"""Copies the website's radar and weather-news styles into src/lib/web-panels.ts.
Run from the app folder: python scripts/web-panels.py <path to the saltcast-site clone>"""
import json, re, sys
html = open(sys.argv[1] + "/index.html", encoding="utf8").read()
lines = html.split("\n")
def between(a, stop):
    i = next(k for k, l in enumerate(lines) if l.startswith(a))
    out = []
    for l in lines[i:]:
        if out and stop(l): break
        out.append(l)
    return "\n".join(out)
radar = between("/* Live radar panel (radar.js)", lambda l: not (l.startswith((".", "@", "/*", " "))) or l.startswith(".status"))
news = between("/* Florida Weather News", lambda l: not re.match(r"^(\.n-|\.news|@media|@keyframes|/\*|#news)", l))
extra = "\n".join(l for l in lines if re.match(r"^\.(eyebrow|fine|skel|board-head|board-head h2)\{", l))
extra += "\n@keyframes sh{to{background-position:-200% 0}}"
ts = ("// Made by scripts/web-panels.py from the website's index.html. Rerun it after the site's radar or news styles change.\n"
      f"export const RadarCss = {json.dumps(radar)};\n\nexport const NewsCss = {json.dumps(news)};\n\nexport const SiteCss = {json.dumps(extra)};\n")
open("src/lib/web-panels.ts", "w", encoding="utf8").write(ts)
print(len(radar), len(news), len(extra))
