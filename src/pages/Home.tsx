import { useI18n } from '../i18n';

export function Home() {
  const { t } = useI18n();
  return (
    <div className="container">
      <section className="hero">
        <h1>{t('home.title')}</h1>
        <p>{t('home.intro')}</p>
      </section>
      <div className="tool-cards">
        <article className="tool-card">
          <span className="num">01 / SIMULATOR</span>
          <h2>{t('home.sim.title')}</h2>
          <p>{t('home.sim.desc')}</p>
          <a className="btn primary" href="#/simulator">
            {t('home.open')}
          </a>
        </article>
        <article className="tool-card">
          <span className="num">02 / DOCGEN</span>
          <h2>{t('home.docgen.title')}</h2>
          <p>{t('home.docgen.desc')}</p>
          <a className="btn primary" href="#/docgen">
            {t('home.open')}
          </a>
        </article>
      </div>
    </div>
  );
}
