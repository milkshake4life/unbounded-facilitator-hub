import { useEffect, useState } from "react";
import { fetchStoredHeadshot } from "./facilitatorsService";

// Module-level cache so each stored headshot is fetched from Firestore at most
// once per session, shared across every card/modal that shows the person.
const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function load(id: string): Promise<string | null> {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  const existing = inflight.get(id);
  if (existing) return existing;
  const p = fetchStoredHeadshot(id)
    .then((url) => {
      cache.set(id, url);
      inflight.delete(id);
      return url;
    })
    .catch(() => {
      inflight.delete(id);
      return null;
    });
  inflight.set(id, p);
  return p;
}

/**
 * Resolve the best headshot source for a facilitator. When the person has an
 * uploaded photo (`hasStored`), it's loaded from the `headshots` collection and
 * takes priority; otherwise the plain `fallbackSrc` URL is used.
 */
export function useHeadshotSrc(
  facilitatorId: string,
  hasStored: boolean | undefined,
  fallbackSrc: string
): string {
  const [stored, setStored] = useState<string | null>(
    hasStored ? cache.get(facilitatorId) ?? null : null
  );

  useEffect(() => {
    let cancelled = false;
    if (hasStored) {
      load(facilitatorId).then((url) => {
        if (!cancelled) setStored(url);
      });
    } else {
      setStored(null);
    }
    return () => {
      cancelled = true;
    };
  }, [facilitatorId, hasStored]);

  return stored || fallbackSrc;
}

/** Update the cache after a fresh upload so the UI reflects it immediately. */
export function primeHeadshotCache(id: string, dataUrl: string) {
  cache.set(id, dataUrl);
}
