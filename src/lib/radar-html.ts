/**
 * The Rain radar page shown in the Radar tab: a Leaflet map centered on the spot with a one-hour loop of
 * NOAA NEXRAD composite radar (public domain), served as map tiles by the Iowa Environmental Mesonet.
 * Same radar as the website's "Live radar" panel (radar.js in the site repo).
 */
export function radarHtml(lat: number, lon: number, name: string): string {
  const spot = JSON.stringify({ lat, lon, name });
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
html,body{margin:0;height:100%;background:#0E2A33;color:#EAF4F4;font:14px -apple-system,system-ui,sans-serif}
body{display:flex;flex-direction:column}
#map{flex:1;background:#16343E}
.bar{padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:#0E2A33}
.row{display:flex;align-items:center;gap:10px}
button{font:600 13px -apple-system,system-ui,sans-serif;color:#EAF4F4;background:#16343E;border:1px solid #2C4C56;border-radius:10px;min-height:40px;padding:0 14px}
button.on{background:#3FC1C9;border-color:#3FC1C9;color:#0E2A33}
#play{min-width:48px;font-size:15px}
input[type=range]{flex:1;accent-color:#3FC1C9;height:32px}
#time{font:12px ui-monospace,Menlo,monospace;color:#9FB8BE;min-width:13ch;text-align:right}
.legend{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11px;color:#9FB8BE;text-transform:uppercase}
.legend i{display:inline-block;width:80px;height:8px;border-radius:4px;background:linear-gradient(90deg,#04e9e7,#019ff4,#02fd02,#01c501,#fdf802,#fd9500,#fd0000,#bc0000,#f800fd)}
.note{font-size:12px;line-height:1.4;color:#9FB8BE}
.note a{color:#3FC1C9}
.msg{display:flex;height:100%;align-items:center;justify-content:center;padding:24px;text-align:center;color:#9FB8BE}
.leaflet-container{font:11px -apple-system,system-ui,sans-serif}
</style></head><body>
<div id="map"><div class="msg">Loading radar…</div></div>
<div class="bar">
 <div class="row"><button id="play" aria-label="Pause loop">❚❚</button><input id="rng" type="range" min="0" max="11" value="11" aria-label="Radar time"><span id="time">Latest</span></div>
 <div class="row"><button id="spot" class="on">My spot</button><button id="fl">All Florida</button><span class="legend"><span>Light</span><i></i><span>Severe</span></span></div>
 <div class="note">Rain and storms over the last hour, refreshed every 5 minutes. Radar shows rain, not lightning: if you hear thunder, head in. Data: NOAA NEXRAD via Iowa Environmental Mesonet. <a href="https://radar.weather.gov/">Full NWS radar</a></div>
</div>
<script>
var S=${spot};
var IEM="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/";
var OFFS=[55,50,45,40,35,30,25,20,15,10,5,0];
var map,layers=[],frame=11,playing=true,hold=0,timer,validMs=null,bucket=Math.floor(Date.now()/3e5);
function $(id){return document.getElementById(id);}
function url(off){return IEM+(off?"nexrad-n0q-900913-m"+(off<10?"0":"")+off+"m":"nexrad-n0q-900913")+"/{z}/{x}/{y}.png?v="+bucket;}
function label(i){var off=OFFS[i],base=validMs||Math.floor(Date.now()/3e5)*3e5,t=new Date(base-off*6e4);
 var hm=t.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"});return off?hm+" (-"+off+" min)":hm+" (latest)";}
function show(i){frame=i;layers.forEach(function(l,k){l.setOpacity(k===i?.75:0);});$("rng").value=i;$("time").textContent=label(i);}
function tick(){clearInterval(timer);$("play").textContent=playing?"❚❚":"▶";$("play").setAttribute("aria-label",playing?"Pause loop":"Play loop");
 if(!playing||document.hidden)return;timer=setInterval(function(){if(frame===11&&hold<4){hold++;return;}hold=0;show((frame+1)%12);},550);}
function refresh(){bucket=Math.floor(Date.now()/3e5);layers.forEach(function(l,k){l.setUrl(url(OFFS[k]));});
 fetch("https://mesonet.agron.iastate.edu/data/gis/images/4326/USCOMP/n0q_0.json",{cache:"no-store"}).then(function(r){return r.json();})
  .then(function(j){var t=Date.parse(j.meta&&j.meta.valid);if(t){validMs=t;show(frame);}}).catch(function(){});}
function view(wide){$("spot").className=wide?"":"on";$("fl").className=wide?"on":"";if(wide)map.setView([27.8,-83.6],6);else map.setView([S.lat,S.lon],9);}
function start(){
 $("map").innerHTML="";
 map=L.map("map",{zoomControl:false,minZoom:5,maxZoom:11,attributionControl:true}).setView([S.lat,S.lon],9);
 map.attributionControl.setPrefix(false);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:11,attribution:'&copy; OpenStreetMap'}).addTo(map);
 layers=OFFS.map(function(off){return L.tileLayer(url(off),{opacity:0,maxZoom:11,maxNativeZoom:10,zIndex:5,attribution:off?"":"Radar: IEM / NOAA NEXRAD"}).addTo(map);});
 L.circleMarker([S.lat,S.lon],{radius:7,color:"#fff",weight:2,fillColor:"#0E7C86",fillOpacity:1,interactive:false}).addTo(map).bindTooltip(S.name);
 show(11);tick();refresh();setInterval(function(){if(!document.hidden)refresh();},3e5);
}
$("play").onclick=function(){playing=!playing;tick();};
$("rng").oninput=function(e){playing=false;show(+e.target.value);tick();};
$("spot").onclick=function(){if(map)view(false);};
$("fl").onclick=function(){if(map)view(true);};
document.addEventListener("visibilitychange",function(){if(!document.hidden&&map)refresh();tick();});
var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
s.onload=start;s.onerror=function(){$("map").innerHTML='<div class="msg">The radar couldn\\'t load. Check your connection and try again.</div>';};
document.head.appendChild(s);
</script></body></html>`;
}
