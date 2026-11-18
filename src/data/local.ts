/**
 * Local info for the 20 website spots: fishing season, live cams and local fishing and surf reports.
 * Generated from the website's spots_content.py (saltcastflorida.com); app spots use the nearest one.
 */
export type LocalLink = { title: string; url: string };

export type LocalArea = {
  id: string;
  name: string;
  /** Town page on saltcastflorida.com: /spots/<slug>/ */
  slug: string;
  lat: number;
  lon: number;
  season: string;
  cams: LocalLink[];
  fishing: LocalLink[];
  surfing: LocalLink[];
};

export const LocalAreas: LocalArea[] = [
 {
  "id": "cdk",
  "name": "Cedar Key",
  "slug": "cedar-key",
  "lat": 29.14,
  "lon": -83.04,
  "season": "Spring and fall are prime for redfish and speckled trout on the flats. In winter cold snaps, trout slide into the creeks and deeper holes, and sheepshead gather around oyster bars and structure.",
  "cams": [
   {
    "title": "Cedar Key area webcams (Windfinder)",
    "url": "https://www.windfinder.com/webcams/cedar_key"
   },
   {
    "title": "Florida Now live cams (VISIT FLORIDA)",
    "url": "https://www.visitflorida.com/en-us/florida-now.html"
   }
  ],
  "fishing": [
   {
    "title": "Big Bend fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/regionreports/big-bend/395279"
   }
  ],
  "surfing": []
 },
 {
  "id": "clw",
  "name": "Clearwater Beach",
  "slug": "clearwater-beach",
  "lat": 27.977,
  "lon": -82.827,
  "season": "Spanish mackerel and kingfish show up in spring and fall, snook cruise the beaches in summer, tarpon move along the beaches from about May to July, and sheepshead are around the docks and passes in winter.",
  "cams": [
   {
    "title": "Pier 60 and Clearwater Beach cam (Pier House 60)",
    "url": "https://pierhouse60.com/live-camera/"
   },
   {
    "title": "St. Pete and Clearwater beach cams (Visit St. Pete/Clearwater)",
    "url": "https://www.visitstpeteclearwater.com/things-to-do/beaches/webcams"
   }
  ],
  "fishing": [
   {
    "title": "West Central Florida fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/west-central-weekend-fishing-4cast/402040"
   }
  ],
  "surfing": [
   {
    "title": "Sand Key / Clearwater surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Sand-Key-Park-1/forecasts/latest"
   }
  ]
 },
 {
  "id": "tpa",
  "name": "Tampa Bay and St. Pete",
  "slug": "tampa-bay-st-pete",
  "lat": 27.76,
  "lon": -82.63,
  "season": "Tarpon fill the bay and the Skyway area from about May to July. Snook, redfish and trout are on the flats year round, and Spanish mackerel and kingfish run in spring and fall.",
  "cams": [
   {
    "title": "St. Pete and Clearwater beach cams (Visit St. Pete/Clearwater)",
    "url": "https://www.visitstpeteclearwater.com/things-to-do/beaches/webcams"
   },
   {
    "title": "St. Pete Beach cam (FOX 13)",
    "url": "https://www.fox13news.com/st-pete-beach-webcam"
   }
  ],
  "fishing": [
   {
    "title": "West Central Florida fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/west-central-weekend-fishing-4cast/402040"
   }
  ],
  "surfing": []
 },
 {
  "id": "srq",
  "name": "Sarasota and Siesta Key",
  "slug": "sarasota-siesta-key",
  "lat": 27.27,
  "lon": -82.56,
  "season": "Snook work the beach in summer and tarpon pass along the coast from about May to July. Trout and redfish are in Sarasota Bay year round, and calm late spring and summer mornings are best for snorkeling.",
  "cams": [
   {
    "title": "Siesta Key Beach cam (Visit Sarasota)",
    "url": "https://www.visitsarasota.com/siesta-key-beach-cam"
   },
   {
    "title": "Siesta Key Beach live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/en/webcam/united-states/florida/sarasota/siesta-key-beach.html"
   }
  ],
  "fishing": [
   {
    "title": "West Central Florida fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/west-central-weekend-fishing-4cast/402040"
   }
  ],
  "surfing": [
   {
    "title": "Siesta Key surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Siesta/forecasts/latest"
   }
  ]
 },
 {
  "id": "bgr",
  "name": "Boca Grande",
  "slug": "boca-grande",
  "lat": 26.75,
  "lon": -82.26,
  "season": "Tarpon fill Boca Grande Pass from about May through July, peaking around June. Snook and redfish work the flats of Gasparilla Sound and Charlotte Harbor, with schooling redfish in late summer and fall.",
  "cams": [
   {
    "title": "Gasparilla Island and Lee County beach cams (Visit Fort Myers)",
    "url": "https://www.visitfortmyers.com/webcams"
   },
   {
    "title": "Boca Grande webcam (Boca Beacon)",
    "url": "https://bocabeacon.com/webcam/"
   }
  ],
  "fishing": [
   {
    "title": "Boca Grande fishing reports from local captains (Captain Experiences)",
    "url": "https://captainexperiences.com/fishing-reports/locations/florida/boca-grande"
   },
   {
    "title": "Southwest Florida fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-southwest/402036"
   }
  ],
  "surfing": []
 },
 {
  "id": "fmb",
  "name": "Fort Myers Beach",
  "slug": "fort-myers-beach",
  "lat": 26.45,
  "lon": -81.95,
  "season": "Sheepshead peak around the docks and bridges in late winter, snook and tarpon are best from late spring through summer, and redfish and trout are in Estero Bay year round.",
  "cams": [
   {
    "title": "Fort Myers Beach webcams (Town of Fort Myers Beach)",
    "url": "https://www.fortmyersbeach.org/fort-myers-beach-webcams"
   },
   {
    "title": "Beach and wave cams (Pink Shell Resort)",
    "url": "https://www.pinkshell.com/live-webcams/"
   }
  ],
  "fishing": [
   {
    "title": "Southwest Florida fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-southwest/402036"
   }
  ],
  "surfing": [
   {
    "title": "Florida surf reports by break (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/provinces/Florida/breaks"
   }
  ]
 },
 {
  "id": "npl",
  "name": "Naples",
  "slug": "naples",
  "lat": 26.14,
  "lon": -81.8,
  "season": "Snook cruise the beaches in summer, tarpon arrive in spring, sheepshead are best in winter, and snapper and grouper are on the nearshore reefs year round.",
  "cams": [
   {
    "title": "Naples Beach and Pier view (Paradise Coast)",
    "url": "https://www.paradisecoast.com/Beaches/Beach-Conditions"
   },
   {
    "title": "Naples Pier area webcams (Windfinder)",
    "url": "https://www.windfinder.com/webcams/naples"
   }
  ],
  "fishing": [
   {
    "title": "South Florida fishing forecast, Naples to Flamingo (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecast-south/402035"
   }
  ],
  "surfing": [
   {
    "title": "Naples Pier surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Naples-Pier/forecasts/latest"
   }
  ]
 },
 {
  "id": "kwt",
  "name": "Key West",
  "slug": "key-west",
  "lat": 24.555,
  "lon": -81.8,
  "season": "Sailfish run offshore in winter, tarpon fill the harbor and channels from about March to June, permit are on the flats and wrecks in spring, and mahi show up in late spring and summer. Late spring and summer usually bring the calmest reef days.",
  "cams": [
   {
    "title": "Florida Keys webcams (Visit Florida Keys)",
    "url": "https://visitfloridakeys.com/webcams"
   },
   {
    "title": "Key West area webcams (Windfinder)",
    "url": "https://www.windfinder.com/webcams/key_west_naval_base"
   }
  ],
  "fishing": [
   {
    "title": "Florida Keys fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-keys/402041"
   }
  ],
  "surfing": []
 },
 {
  "id": "mth",
  "name": "Marathon",
  "slug": "marathon",
  "lat": 24.71,
  "lon": -81.09,
  "season": "Tarpon gather under the bridges in spring, mahi and blackfin tuna are offshore in late spring and summer, and yellowtail snapper are on the reef year round.",
  "cams": [
   {
    "title": "Seven Mile Bridge and Keys water cams (Visit Florida Keys)",
    "url": "https://visitfloridakeys.com/webcams/water-beach-views/"
   },
   {
    "title": "Florida Keys webcams (Visit Florida Keys)",
    "url": "https://visitfloridakeys.com/webcams"
   }
  ],
  "fishing": [
   {
    "title": "Florida Keys fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-keys/402041"
   }
  ],
  "surfing": []
 },
 {
  "id": "isl",
  "name": "Islamorada",
  "slug": "islamorada",
  "lat": 24.92,
  "lon": -80.63,
  "season": "Tarpon peak from about April to June, bonefish and permit are best on warm, calm days from spring through fall, sailfish run in winter and mahi in late spring and summer.",
  "cams": [
   {
    "title": "Islamorada and Keys water cams (Visit Florida Keys)",
    "url": "https://visitfloridakeys.com/webcams/water-beach-views/"
   },
   {
    "title": "Islamorada area webcams (Windfinder)",
    "url": "https://www.windfinder.com/webcams/islamorada"
   }
  ],
  "fishing": [
   {
    "title": "Florida Keys fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-keys/402041"
   }
  ],
  "surfing": []
 },
 {
  "id": "mia",
  "name": "Miami and Biscayne Bay",
  "slug": "miami-biscayne",
  "lat": 25.73,
  "lon": -80.16,
  "season": "Sailfish season is roughly December through March, mahi run in spring and summer, and bonefish and permit work the Biscayne Bay flats on warm days.",
  "cams": [
   {
    "title": "Miami Beach and Biscayne Bay webcams (Miami and the Beaches)",
    "url": "https://www.miamiandbeaches.com/plan-your-trip/miami-beach-webcams"
   },
   {
    "title": "Haulover Inlet area webcams (Windfinder)",
    "url": "https://www.windfinder.com/webcams/hallover_inlet"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "Haulover surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Haulover/forecasts/latest"
   }
  ]
 },
 {
  "id": "jup",
  "name": "Jupiter Inlet",
  "slug": "jupiter-inlet",
  "lat": 26.94,
  "lon": -80.07,
  "season": "Sailfish are best in winter, goliath grouper gather on the wrecks in late summer, and the fall mullet run brings snook, tarpon and bluefish to the inlet and beaches.",
  "cams": [
   {
    "title": "Jupiter Inlet cams (Town of Jupiter)",
    "url": "https://jupiter.fl.us/livecams"
   },
   {
    "title": "Jupiter Inlet Lighthouse camera",
    "url": "https://www.jupiterlighthouse.org/live-camera/"
   },
   {
    "title": "Palm Beach County inlet and beach cams",
    "url": "https://discover.pbc.gov/erm/Pages/Beach-Cams.aspx"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "Jupiter Inlet surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Jupiter-Inlet-North-South-Side/forecasts/latest"
   }
  ]
 },
 {
  "id": "seb",
  "name": "Sebastian Inlet",
  "slug": "sebastian-inlet",
  "lat": 27.86,
  "lon": -80.45,
  "season": "The fall mullet run, roughly September to November, is the best time for snook, tarpon and bluefish at the inlet. Surf is most consistent in fall and winter with northeast swell, and pompano run the beaches in winter.",
  "cams": [
   {
    "title": "Sebastian Inlet jetty and surf cam (Florida State Parks)",
    "url": "https://floridastateparks.org/learn/webcam-watch-jetty-and-surf"
   },
   {
    "title": "Sebastian Inlet surf cam (Visit Space Coast)",
    "url": "https://www.visitspacecoast.com/sebastian-inlet-surf-cam"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "Sebastian Inlet First Peak surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Sebastian-Inlet_First-Peak/forecasts/latest"
   }
  ]
 },
 {
  "id": "mlb",
  "name": "Melbourne Beach",
  "slug": "melbourne-beach",
  "lat": 28.07,
  "lon": -80.56,
  "season": "Pompano and whiting are in the surf in winter and spring, the fall mullet run brings snook and tarpon along the beach, and surf is most consistent in fall and winter.",
  "cams": [
   {
    "title": "Melbourne Beach cam (The Surfers View)",
    "url": "https://thesurfersview.com/live-cams/florida/melbourne-beach-cam-and-surf-report"
   },
   {
    "title": "Melbourne Beach surf cams (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Melbourne-Beach/webcams/latest"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "Melbourne Beach surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Melbourne-Beach/forecasts/latest"
   }
  ]
 },
 {
  "id": "coc",
  "name": "Cocoa Beach",
  "slug": "cocoa-beach",
  "lat": 28.32,
  "lon": -80.61,
  "season": "Surf is most consistent from fall through spring with northeast swell. The fall mullet run brings snook and tarpon to the beaches, and mahi run offshore of Port Canaveral in spring.",
  "cams": [
   {
    "title": "Cocoa Beach Pier live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/webcam/united-states/florida/cocoa-beach/cocoa-beach-pier.html"
   },
   {
    "title": "Cocoa Beach Pier cam (The Surfers View)",
    "url": "https://thesurfersview.com/live-cams/florida/cocoa-beach-pier-cam-and-surf-report/"
   }
  ],
  "fishing": [
   {
    "title": "Cocoa Beach fishing reports from local captains (Captain Experiences)",
    "url": "https://captainexperiences.com/fishing-reports/locations/florida/cocoa-beach"
   },
   {
    "title": "Port Canaveral fishing reports from local captains (Captain Experiences)",
    "url": "https://captainexperiences.com/fishing-reports/locations/florida/port-canaveral"
   }
  ],
  "surfing": [
   {
    "title": "Cocoa Beach Pier surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Cocoa-Beach-Pier/forecasts/latest"
   }
  ]
 },
 {
  "id": "nsb",
  "name": "New Smyrna Beach",
  "slug": "new-smyrna-beach",
  "lat": 29.03,
  "lon": -80.9,
  "season": "Surf is most consistent in fall and winter. Redfish and snook are around Ponce Inlet and the Indian River year round, with the fall mullet run the busiest time.",
  "cams": [
   {
    "title": "New Smyrna and Ponce Inlet beach cams (Volusia County)",
    "url": "https://www.volusia.org/beach/smyrna.htm"
   },
   {
    "title": "New Smyrna Beach live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/webcam/united-states/florida/new-smyrna/new-smyrna.html"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "New Smyrna Inlet surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/New-Smyrna-Inlet/forecasts/latest"
   }
  ]
 },
 {
  "id": "sta",
  "name": "St. Augustine",
  "slug": "st-augustine",
  "lat": 29.86,
  "lon": -81.26,
  "season": "Redfish and flounder are best in fall, whiting and pompano are in the surf in winter and spring, and surf is most consistent in fall with northeast swell.",
  "cams": [
   {
    "title": "St. Augustine Pier surf cams (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/St-Augustine-Pier/webcams/latest"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "St. Augustine Pier surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/St-Augustine-Pier/forecasts/latest"
   }
  ]
 },
 {
  "id": "jax",
  "name": "Jacksonville Beach",
  "slug": "jacksonville-beach",
  "lat": 30.29,
  "lon": -81.39,
  "season": "Flounder and redfish are best around the jetties in fall, whiting are in the surf in spring, and surf is most consistent in fall and winter.",
  "cams": [
   {
    "title": "Jacksonville Beach live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/webcam/united-states/florida/jacksonville/beach.html"
   },
   {
    "title": "Jax Beach Pier surf cams (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Jax-Beach-Pier/webcams/latest"
   }
  ],
  "fishing": [
   {
    "title": "Florida Sportsman regional fishing forecasts",
    "url": "https://www.floridasportsman.com/verticlelisting/forecasts/395010"
   }
  ],
  "surfing": [
   {
    "title": "Jacksonville Beach Pier surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Jax-Beach-Pier/forecasts/latest"
   }
  ]
 },
 {
  "id": "dst",
  "name": "Destin and Pensacola",
  "slug": "destin-pensacola",
  "lat": 30.38,
  "lon": -86.5,
  "season": "Cobia migrate along the beaches in March and April, king mackerel run in summer, and red snapper season is usually in summer (check current FWC dates).",
  "cams": [
   {
    "title": "Destin bridge and East Pass live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/webcam/united-states/florida/destin/bridge.html"
   },
   {
    "title": "Pensacola Beach live cams (PensacolaBeach.com)",
    "url": "https://pensacolabeach.com/pensacola-beach-live-cams/"
   }
  ],
  "fishing": [
   {
    "title": "Panhandle fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-panhandle/402037"
   }
  ],
  "surfing": [
   {
    "title": "Destin surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Destin/forecasts/latest"
   },
   {
    "title": "Pensacola Beach surf report (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/breaks/Pensacola-Beach/forecasts/latest"
   }
  ]
 },
 {
  "id": "pcb",
  "name": "Panama City Beach",
  "slug": "panama-city-beach",
  "lat": 30.18,
  "lon": -85.8,
  "season": "Cobia migrate along the beaches in March and April, king mackerel run in summer, red snapper season is usually in summer (check current FWC dates), and flounder are best in fall.",
  "cams": [
   {
    "title": "Panama City Beach webcams (Visit Panama City Beach)",
    "url": "https://www.visitpanamacitybeach.com/blog/post/virtual-panama-city-beach-experience/"
   },
   {
    "title": "Panama City Beach webcams (Sandpiper Beacon)",
    "url": "https://sandpiperbeacon.com/panama-city-beach/webcam"
   },
   {
    "title": "Panama City Beach live cam (SkylineWebcams)",
    "url": "https://www.skylinewebcams.com/webcam/united-states/florida/panama-city-beach/panama-city-beach.html"
   }
  ],
  "fishing": [
   {
    "title": "Panhandle fishing forecast (Florida Sportsman)",
    "url": "https://www.floridasportsman.com/editorial/forecasts-panhandle/402037"
   }
  ],
  "surfing": [
   {
    "title": "Florida surf reports by break (Surf-Forecast)",
    "url": "https://www.surf-forecast.com/provinces/Florida/breaks"
   }
  ]
 }
];

/** The website area nearest a position, within about 60 miles. */
export function nearestArea(lat: number, lon: number): { area: LocalArea; exact: boolean } | undefined {
  let best: LocalArea | undefined;
  let bd = Infinity;
  for (const a of LocalAreas) {
    const dy = a.lat - lat;
    const dx = (a.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best && bd < 0.9 ? { area: best, exact: bd < 0.25 } : undefined;
}
