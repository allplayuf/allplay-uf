/**
 * Geolocation wrapper — uses native Capacitor plugin on iOS so the permission
 * dialog shows "AllPlay" instead of "localhost" (WKWebView's default origin).
 * Falls back to Web Geolocation API on web/PWA.
 */
import { Capacitor } from '@capacitor/core';

export async function getCurrentPosition(options = {}) {
  const opts = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
    });
    return pos;
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}
