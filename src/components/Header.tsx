import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { UiLang } from '../i18n/types';
import type { Route } from '../router';
import type { Theme } from '../lib/theme';
import { Logo } from './Logo';
import { CATEGORIES, TOOLS, categoryKey, toolTitleKey } from '../tools';

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

/** Disclosure menu listing every tool, grouped by category. */
function ToolsMenu({ route }: { route: Route }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click, on Escape, and when the route changes.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [route]);

  return (
    <div className="tools-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="btn small"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {t('nav.tools')} <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <nav className="menu-pop" aria-label={t('nav.tools')}>
          {CATEGORIES.map((cat) => (
            <div className="menu-group" key={cat}>
              <span className="menu-cat">{t(categoryKey(cat))}</span>
              {TOOLS.filter((tool) => tool.category === cat).map((tool) =>
                tool.enabled ? (
                  <a
                    key={tool.id}
                    href={`#/${tool.id}`}
                    aria-current={route === tool.id ? 'page' : undefined}
                  >
                    <span className="menu-num">{tool.num}</span> {t(toolTitleKey(tool.id))}
                  </a>
                ) : (
                  <span key={tool.id} className="menu-disabled">
                    <span className="menu-num">{tool.num}</span> {t(toolTitleKey(tool.id))}
                    <span className="soon-tag">{t('nav.soon')}</span>
                  </span>
                ),
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

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
  return (
    <header className="site-header">
      <div className="container">
        <a className="brand" href="#/">
          <Logo size={26} />
          <span className="wordmark">
            VRC<em>_</em>DEVKIT
          </span>
        </a>
        <ToolsMenu route={route} />
        {route !== 'home' && (
          <span className="current-tool mono" aria-hidden="true">
            / {t(toolTitleKey(route))}
          </span>
        )}
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
