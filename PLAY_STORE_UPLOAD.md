# Play Store Upload Notes

This project now includes a Capacitor Android wrapper for the existing Next.js web app.

## Current readiness status

Not ready for final Play Store upload until these are completed:

1. Replace `https://your-domain.com` with the deployed HTTPS app URL before syncing Android.
2. Configure Android release signing and keep the keystore safe.
3. Build and test the release Android App Bundle on a real device.
4. Enter the public privacy policy URL in Play Console, for example `https://your-domain.com/privacy`.
5. Enter the account/data deletion URL in Play Console, for example `https://your-domain.com/data-deletion`.
6. Complete Play Console App content declarations: Data safety, Ads, App access, Target audience, Content rating, and any required policy declarations.
7. Provide reviewer login instructions for restricted areas of the app.

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

## Play Console privacy and data safety notes

Use the app's actual production behavior when filling the Data safety form. Based on the current code, expect to disclose collection of:

- Personal info: names, email addresses, phone numbers, addresses, roles, and account identifiers.
- Photos and files: student photos, school logos, and document templates uploaded by authorized users.
- Location: precise GPS latitude/longitude/accuracy for school coordinate setup and teacher attendance check-in/check-out. It is user initiated and not collected in the background.
- Financial info: school fee records, payment amounts, payment dates, payment mode, and receipt records. Do not claim card or bank details unless a future payment gateway stores or processes them in-app.
- App activity/content: notices, homework, admissions, attendance, exams, marks, communication logs, and generated documents.
- Diagnostics/security: session, auth, delivery, error, and audit logs required to operate and secure the service.

Current third-party service providers mentioned in the privacy policy:

- Supabase for authentication, database, storage, and backend services.
- Hosting/infrastructure providers for the web app and APIs.
- Meta WhatsApp Cloud API for school WhatsApp messaging.
- Resend or SMTP providers for email delivery.
- Anthropic for authorized AI features.

Declare Ads as `No` unless advertising SDKs or ad placements are added later.

## Current Android package

```text
com.nayshaeducore.app
```

Choose this carefully before the first Play Store upload. Google Play treats the package name as the permanent app ID.
