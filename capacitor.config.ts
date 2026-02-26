import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polaris.app',
  appName: 'Polaris',
  webDir: 'out',

  server: {
    url: 'https://polarisapp.vercel.app',
    cleartext: false,
  },

  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
  },

  ios: {
    backgroundColor: '#0a0a0a',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Polaris',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0a0a0a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
