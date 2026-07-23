import { useI18n } from '../i18n';
import type { UiLang } from '../i18n/types';
import type { Route } from '../router';
import type { Theme } from '../lib/theme';
import { Logo } from './Logo';

const ThemeIcon = ({ theme }: { theme: Theme }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {theme === 'dark' ? (
      <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" fill="currentColor" />
    ) : (
      <circle cx="7" cy="7" r="2.5" fill="currentColor" />
    )}
  </svg>
);

export function Header({
  route,
  theme,
  onToggleTheme,
}: {
  route: Route;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const current = (r: Route) => (route === r ? 'page' : undefined);
  return (
    <header className="site-header">
      <div className="container">
        <a className="brand" href="#/">
          <Logo size={26} />
          <span className="wordmark">
            VRC<em>_</em>DEVKIT
          </span>
        </a>
        <nav className="site-nav" aria-label="Main">
          <a href="#/simulator" aria-current={current('simulator')}>
            {t('nav.simulator')}
          </a>
          <a href="#/docgen" aria-current={current('docgen')}>
            {t('nav.docgen')}
          </a>
        </nav>
        <div className="header-tools">
          <label>
            <span className="visually-hidden">{t('lang.label')}</span>
            <select
              className="field"
              value={lang}
              onChange={(e) => setLang(e.target.value as UiLang)}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </label>
          <button
            type="button"
            className="btn small"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
            title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </div>
    </header>
  );
}
