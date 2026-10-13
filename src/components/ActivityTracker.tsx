"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { flush, getIds, randomId, trackLeave, trackPageView } from "@/lib/activity-client";

/**
 * Records page views and time on page for the admin "Site activity" tab.
 * Rendered once in the storefront layout; renders nothing.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const current = useRef<{
    eid: string;
    url: string;
    visibleSince: number | null;
    activeMs: number;
  } | null>(null);

  // Close the previous page view (sends its time on screen) and open a new one
  useEffect(() => {
    const url = search ? `${pathname}?${search}` : pathname;
    const previous = current.current;
    if (previous) {
      const active =
        previous.activeMs + (previous.visibleSince ? performance.now() - previous.visibleSince : 0);
      trackLeave(previous.eid, active);
    }

    getIds();
    const eid = randomId();
    current.current = {
      eid,
      url,
      visibleSince: document.visibilityState === "visible" ? performance.now() : null,
      activeMs: 0,
    };

    const params = new URLSearchParams(search);
    // Wait a moment so document.title reflects the new page after client-side navigation
    const timer = setTimeout(() => {
      trackPageView({
        eid,
        path: pathname,
        url,
        query: search || undefined,
        title: document.title,
        // First page of a visit: the external site the visitor came from. Later pages: the
        // previous page on this site (the server ignores same-site referrers as a "source").
        referrer: previous ? `${location.origin}${previous.url}` : document.referrer || undefined,
        utmSource: params.get("utm_source") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmCampaign: params.get("utm_campaign") ?? undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  // Pause the on-screen timer while the tab is hidden; send the time when the page is closed
  useEffect(() => {
    const onVisibility = () => {
      const view = current.current;
      if (!view) return;
      if (document.visibilityState === "hidden") {
        if (view.visibleSince) {
          view.activeMs += performance.now() - view.visibleSince;
          view.visibleSince = null;
        }
        // The tab may never come back (mobile browsers kill it), so report now
        trackLeave(view.eid, view.activeMs);
        flush();
      } else if (!view.visibleSince) {
        view.visibleSince = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}

export function ActivityTracker() {
  // useSearchParams needs a Suspense boundary so static pages are not forced to client rendering
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
