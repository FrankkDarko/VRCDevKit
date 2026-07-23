import { useEffect, useState } from 'react';

export type Route = 'home' | 'simulator' | 'docgen';

export interface RouteState {
  route: Route;
  /** Query params found after `?` inside the hash (e.g. #/simulator?s=...). */
  params: URLSearchParams;
}

export function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const route: Route = path === 'simulator' ? 'simulator' : path === 'docgen' ? 'docgen' : 'home';
  return { route, params };
}

export function useRoute(): RouteState {
  const [state, setState] = useState<RouteState>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return state;
}

/** Update the query part of the current hash without triggering hashchange. */
export function replaceHashParams(route: Route, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const hash = `#/${route === 'home' ? '' : route}${query ? '?' + query : ''}`;
  history.replaceState(null, '', window.location.pathname + window.location.search + hash);
}
