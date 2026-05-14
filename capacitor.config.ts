import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.base68dbdc9e123473250628e807.app',
  appName: 'AllPlay',
  webDir: 'dist',
  server: {
    allowNavigation: [
      '*.supabase.co',
      'allplayuf.se',
      '*.allplayuf.se',
      'allplay-uf.vercel.app',
      '*.vercel.app',
    ],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0F1513',
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F1513',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2BA84A',
      autoHide: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
