import { useI18n } from './i18n';
import { useRoute } from './router';
import { useTheme } from './lib/theme';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Simulator } from './pages/Simulator';
import { DocGen } from './pages/DocGen';

export function App() {
  const { t } = useI18n();
  const { route, params } = useRoute();
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="shell">
      <Header route={route} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        {route === 'home' && <Home />}
        {route === 'simulator' && <Simulator params={params} />}
        {route === 'docgen' && <DocGen params={params} />}
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>{t('footer.note')}</span>
          <a href="https://github.com/FrankkDarko/VRCDevKit" target="_blank" rel="noreferrer">
            {t('footer.source')}
          </a>
        </div>
      </footer>
    </div>
  );
}
