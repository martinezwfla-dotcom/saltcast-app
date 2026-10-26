import { useEffect, useState } from 'react';

/** The current time, updated every minute so "right now" stays current on screen. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
