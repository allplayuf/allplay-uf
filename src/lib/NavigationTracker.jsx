import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * NavigationTracker
 * 
 * Posts URL changes to the parent window (useful in iframed preview contexts).
 * Previously also logged page views to Base44 AppLogs — that dependency has been
 * removed as part of the Vercel migration. Page-view logging can be reintroduced
 * later via a Supabase edge function if needed.
 */
export default function NavigationTracker() {
    const location = useLocation();

    useEffect(() => {
        try {
            window.parent?.postMessage({
                type: "app_changed_url",
                url: window.location.href
            }, '*');
        } catch (_) {
            // no-op — not embedded
        }
    }, [location]);

    return null;
}