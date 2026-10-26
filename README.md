# Saltcast Florida

The iPhone app for [saltcastflorida.com](https://saltcastflorida.com). It tells you whether it's a good time to go fishing, surfing, diving, boating, sailing, or paddling at 21 spots around Florida, and when the best times are in the next 48 hours.

Built with Expo (React Native). iPhone builds run in the cloud on EAS, so no Mac is needed.

## What's in the app

| Tab | What it shows |
| --- | --- |
| Today | A Go, Not ideal, or No Go verdict for the chosen activity and spot, with wind, seas, swell, water temperature, weather, tides, the next 12 hours, and a 7-day forecast |
| Best Times | The best daylight windows in the next 48 hours, tap one for hour by hour detail |
| Spots | 21 spots in the Gulf, Keys, Atlantic, and Panhandle regions, favorites, and units |
| Radar | A live radar map from Windy, centered on the chosen spot |
| Dock Talk | Tips for each activity and the seasonal outlook |

Data comes from free public sources: the Open-Meteo weather and marine APIs, and NOAA CO-OPS tide predictions. The phone calls them directly, so there is no server.

The verdict rules for each activity are in `src/data/activities.ts`, and the spots are in `src/data/spots.ts`.

## Publishing to the App Store without a Mac

On Windows, follow the step-by-step guide in `docs/first-build-windows.md`.

You need an Apple Developer account, an Expo account, and any computer with [Node.js](https://nodejs.org) installed (Windows is fine).

1. Download this repository and open a terminal in its folder.
2. Run `npm install`.
3. Run `npx eas-cli@latest login` and sign in with your Expo account.
4. Run `npx eas-cli@latest init` to link the project to your Expo account.
5. Run `npx eas-cli@latest build --platform ios --profile production --auto-submit`.
   - Sign in with your Apple ID when asked, and let EAS create the certificates and provisioning profile for you.
   - The build takes 15 to 30 minutes in the cloud. When it's done, EAS uploads it to App Store Connect.
6. Install the TestFlight app on your iPhone and test the build. Apple emails you when it's ready.
7. In [App Store Connect](https://appstoreconnect.apple.com), fill in the listing (see `docs/app-store-listing.md`), pick the build, and submit it for review.

After the first build works, later builds can be started from the expo.dev website with "Build from GitHub".

## Running it locally

```bash
npm install
npx expo start
```

Then scan the QR code with the Expo Go app on your iPhone.

Before committing, run `npx tsc --noEmit` and `npx eslint .`.
