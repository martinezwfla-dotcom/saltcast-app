# First iPhone build from a Windows PC

You only do this once. Later builds can be started from the expo.dev website. Plan on about 45 minutes, and most of that is waiting while the build runs.

## 1. Install Node.js

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** installer for Windows.
2. Run it and keep all the default options.

## 2. Download the app code

1. Go to [github.com/martinezwfla-dotcom/saltcast-app](https://github.com/martinezwfla-dotcom/saltcast-app).
2. Click the green **Code** button, then **Download ZIP**.
3. Open your Downloads folder, right-click the zip, and choose **Extract All**. You'll get a folder called `saltcast-app-main`.

## 3. Open Command Prompt in that folder

1. Open the `saltcast-app-main` folder. It should contain `package.json` and `app.json`.
2. Click the address bar at the top of the window, type `cmd`, and press Enter. A black Command Prompt window opens in that folder.

Use Command Prompt, not PowerShell, because PowerShell can block these commands.

## 4. Run these commands one at a time

Type each line, press Enter, and wait for it to finish before you type the next one.

```
set EAS_NO_VCS=1
```
This tells the build tool you downloaded a zip, so it doesn't need Git. If you close the window and open a new one, run this line again first.

```
npm install
```

```
npx eas-cli@latest login
```
Sign in with your expo.dev email and password.

```
npx eas-cli@latest init
```
Answer **Y** to create the project. **Copy the line that shows the project ID and send it to Claude**, so the ID gets saved in GitHub too.

```
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

This one asks you a few questions. Here's how to answer them:

| Question | Answer |
| --- | --- |
| Log in to your Apple account? | **Y**, then your Apple ID email, password, and the 6-digit code sent to your iPhone |
| Pick a team | Your own name or business |
| Generate a new Apple Distribution Certificate? | **Y** |
| Generate a new Apple Provisioning Profile? | **Y** |
| Set up Push Notifications? | **N** (the app doesn't use them yet) |
| Anything about an App Store Connect API key | **Y** to let EAS create one |

After that the build runs in the cloud. You can close the window, and you can follow along at [expo.dev](https://expo.dev). It takes about 15 to 30 minutes. When the build is done, EAS uploads it to App Store Connect for you.

## 5. Test it on your iPhone

1. Install **TestFlight** from the App Store on your iPhone.
2. Apple emails you when the build is ready to test, usually 10 to 30 minutes after the upload. Open the email on your iPhone and follow the link, or open TestFlight.
3. Try every tab, and tell Claude anything that looks wrong.

## If something goes wrong

Take a screenshot of the Command Prompt window or copy the red error text, then send it to Claude.
