import type { CapacitorConfig } from "@capacitor/cli"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erp.naysha.online"

const config: CapacitorConfig = {
  appId: "com.nayshaeducore.app",
  appName: "EduCore ERP",
  webDir: "public",
  server: {
    url: appUrl,
    cleartext: false,
    allowNavigation: ["naysha.online", "*.naysha.online"],
  },
  android: {
    buildOptions: {
      releaseType: "AAB",
    },
  },
}

export default config
