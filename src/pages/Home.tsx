import { useI18n } from '../i18n';
import { CATEGORIES, TOOLS, categoryKey, toolDescKey, toolTitleKey } from '../tools';

export function Home() {
  const { t } = useI18n();
  return (
    <div className="container">
      <section className="hero">
        <h1>{t('home.title')}</h1>
        <p>{t('home.intro')}</p>
      </section>
      {CATEGORIES.map((cat) => (
        <section key={cat} aria-labelledby={`cat-${cat}`}>
          <h2 className="cat-title" id={`cat-${cat}`}>
            {t(categoryKey(cat))}
          </h2>
          <div className="tool-cards">
            {TOOLS.filter((tool) => tool.category === cat).map((tool) => (
              <article className={`tool-card${tool.enabled ? '' : ' disabled'}`} key={tool.id}>
                <span className="num">
                  {tool.num} / {tool.id.toUpperCase()}
                  {!tool.enabled && <span className="soon-tag">{t('nav.soon')}</span>}
                </span>
                <h3>{t(toolTitleKey(tool.id))}</h3>
                <p>{t(toolDescKey(tool.id))}</p>
                {tool.enabled && (
                  <a className="btn primary" href={`#/${tool.id}`}>
                    {t('home.open')}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
