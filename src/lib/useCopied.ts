import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Clipboard helper with transient "copied" feedback.
 * `copied` holds the id of the last copy for ~1.5s, then resets.
 */
export function useCopied(): {
  copied: string | null;
  copy: (id: string, text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1500);
  }, []);

  return { copied, copy };
}
