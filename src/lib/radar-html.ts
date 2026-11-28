import type { Spot } from '@/data/spots';
import { NewsCss, RadarCss, SiteCss } from '@/lib/web-panels';

/**
 * The Radar and News pages in the Radar tab run the website's own scripts (radar.js, news.js) inside a WebView
 * whose base address is saltcastflorida.com, so the app gets the same radar and news as the site:
 * - Radar: NOAA NEXRAD 1-hour loop, about 2 hours of HRRR future radar (purple), GOES lightning, NWS warning boxes.
 * - News: NWS/NHC alerts that open in place, Florida headlines that link to the outlet, Live from NOAA strip.
 * Styles come from the site (src/lib/web-panels.ts, made by scripts/web-panels.py).
 */
export const SiteBase = 'https://saltcastflorida.com/';

// The site's dark theme, with iPhone system fonts.
const Theme = `:root{--bg:#0E2A33;--surface:#11242B;--surface-2:#173039;--line:#244049;--ink:#E3EEF0;--muted:#8CA8B0;--accent:#4FC3CC;--accent-ink:#06232A;
--go:#4CC07F;--fair:#E6AE3A;--nogo:#EE6B55;--f-display:-apple-system-condensed,"SF Pro Display",system-ui,sans-serif;--f-body:-apple-system,system-ui,sans-serif;
--f-mono:ui-monospace,Menlo,monospace;color-scheme:dark}
*{box-sizing:border-box}[hidden]{display:none!important}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 var(--f-body);-webkit-tap-highlight-color:transparent}
h1,h2,h3{font-family:var(--f-display);font-weight:600;line-height:1.05;margin:0;letter-spacing:.01em}`;

function page(css: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>${Theme}\n${SiteCss}\n${css}</style></head><body>${body}</body></html>`;
}

function spotJson(spot: Spot) {
  return JSON.stringify({ id: spot.id, name: spot.name, lat: spot.lat, lon: spot.lon }).replace(/</g, '\\u003c');
}

export function radarHtml(spot: Spot): string {
  const css = `${RadarCss}
#detail{padding:8px 12px 12px}.d-head{display:none}
.rdr{margin:0;padding:10px;border-radius:12px;box-shadow:none}
.rdr-x{display:none}
.rdr-map{height:calc(100vh - 330px)!important;min-height:280px}
.ltg-banner{margin:0 0 10px}
@media (max-width:600px){.rdr-map{height:calc(100vh - 330px)!important}}`;
  const body = `<div id="detail"><div class="d-head"></div></div><button type="button" data-radar hidden></button>
<script>
var S=${spotJson(spot)};
window.SC_STATE=function(){return {spot:S,water:"near"};};
try{localStorage.setItem("fwf-radar","1");}catch(e){}
// Open the radar panel if radar.js didn't already (when this page has no saved storage).
setTimeout(function(){var p=document.getElementById("radar");if(!p||p.hidden){var b=document.querySelector("[data-radar]");if(b)b.click();}},1500);
</script>
<script src="/radar.js"></script>`;
  return page(css, body);
}

const RegionName: Record<Spot['region'], string> = {
  Atlantic: 'Atlantic Coast',
  Gulf: 'Gulf Coast',
  Panhandle: 'Panhandle',
  Keys: 'Florida Keys',
};

export function newsHtml(spot: Spot): string {
  const css = `${NewsCss}
.news{margin:0;border:0;border-radius:0;padding:12px 14px 24px;background:var(--bg)}
.news .fine{font-size:12px}`;
  // news.js starts on the spot's coast (it reads the spot's region the way a town page does).
  const pick = JSON.stringify({ id: 'app-spot', region: RegionName[spot.region], name: spot.name });
  const body = `<section class="news" id="news"><div class="news-tabs" role="tablist" aria-label="Area"></div><div class="news-live"></div><div class="news-body"></div></section>
<script>
window.SALTCAST_SPOT="app-spot";
window.SC_SPOTS=function(){return [${pick}];};
window.SC_STATE=function(){return {spot:${pick}};};
</script>
<script src="/news.js"></script>`;
  return page(css, body);
}
