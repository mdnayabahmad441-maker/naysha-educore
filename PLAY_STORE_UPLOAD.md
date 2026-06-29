# Play Store Upload Notes

This project now includes a Capacitor Android wrapper for the existing Next.js web app.

## Before building

1. Deploy the Next.js app to a real HTTPS domain.
2. Set the app URL before syncing Android:

   ```powershell
   $env:NEXT_PUBLIC_APP_URL = "https://your-real-domain.com"
   npm run android:sync
   ```

3. Install Android Studio with the Android SDK and a JDK.
4. Configure a release signing key in Android Studio or Gradle before uploading to Google Play.

## Build the Play Store bundle

```powershell
npm run android:build
```

The release Android App Bundle will be created under:

```text
android/app/build/outputs/bundle/release/
```

## Current Android package

```text
com.nayshaeducore.app
```

Choose this carefully before the first Play Store upload. Google Play treats the package name as the permanent app ID.
