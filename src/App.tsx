import { useI18n } from './i18n';
import { useRoute } from './router';
import { useTheme } from './lib/theme';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Simulator } from './pages/Simulator';
import { DocGen } from './pages/DocGen';
import { QuestTriage } from './pages/QuestTriage';
import { DISCORD_URL, GITHUB_URL } from './lib/links';

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
        {route === 'quest-triage' && <QuestTriage params={params} />}
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>{t('footer.note')}</span>
          <span className="footer-links">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">
              {t('footer.discord')}
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t('footer.source')}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
