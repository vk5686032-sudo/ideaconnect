import { useEffect, useState } from 'react';

/**
 * Delay propagating a fast-changing value (a search box) so each keystroke does
 * not become its own API request.
 *
 * Typing "MediMatch" previously fired eight requests — "M", "Me", "Med" and so
 * on — because the feed inputs pushed straight into the query key. Correct
 * results either way, but eight round-trips per search is visible jank on a
 * slow connection and needless load on the API.
 *
 * Extracted from the hand-rolled copy in pages/Search/Search.jsx, which is
 * what the two feed pages now share. 300ms to match the previous behaviour.
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
