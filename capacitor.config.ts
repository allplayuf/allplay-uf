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
    backgroundColor: '#121212',
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#121212',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2BA84A',
      autoHide: true,
    },
  },
};

export default config;
