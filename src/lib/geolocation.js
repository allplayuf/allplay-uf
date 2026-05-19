/**
 * Geolocation wrapper — uses native Capacitor plugin on iOS so the permission
 * dialog shows "AllPlay" instead of "localhost" (WKWebView's default origin).
 * Falls back to Web Geolocation API on web/PWA.
 *
 * Always call requestGeolocationPermission() before getCurrentPosition() on
 * native to ensure iOS routes the dialog through native CLLocationManager
 * (which reads CFBundleDisplayName = "AllPlay") rather than WKWebView.
 */
import { Capacitor } from '@capacitor/core';

/**
 * Proactively request location permission.
 * Safe to call multiple times — iOS ignores repeated requests once decided.
 * Returns 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
export async function requestGeolocationPermission() {
  if (!Capacitor.isNativePlatform()) return 'unsupported';
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const current = await Geolocation.checkPermissions();
    if (current.location === 'granted' || current.coarseLocation === 'granted') {
      return 'granted';
    }
    const result = await Geolocation.requestPermissions({ permissions: ['location'] });
    return result.location;
  } catch (err) {
    console.warn('[Geolocation] requestPermissions failed:', err);
    return 'denied';
  }
}

export async function getCurrentPosition(options = {}) {
  const opts = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');

    // Always check+request first — this ensures iOS routes the permission
    // dialog through native CLLocationManager (shows "AllPlay") not WKWebView.
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'prompt' || perm.location === 'prompt-with-rationale'
        || perm.coarseLocation === 'prompt' || perm.coarseLocation === 'prompt-with-rationale') {
      await Geolocation.requestPermissions({ permissions: ['location'] });
    }

    return Geolocation.getCurrentPosition({
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
    });
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}
