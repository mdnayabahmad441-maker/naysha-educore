import type { CapacitorConfig } from "@capacitor/cli"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erp.naysha.online"

const config: CapacitorConfig = {
  appId: "com.nayshaeducore.app",
  appName: "NaySha EduCore",
  webDir: "public",
  server: {
    url: appUrl,
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: "AAB",
    },
  },
}

export default config
