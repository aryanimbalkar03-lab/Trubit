import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.trubit.app",
  appName: "Trubit Food Delivery",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    hostname: "trubit.app",
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
    scheme: "Trubit",
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: "#000000",
    allowMixedContent: false,
    captureInput: true,
    initialFocus: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Default-568h",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
      overlay: false,
    },
  },
};

export default config;
