import { useI18n } from '../i18n';
import { DISCORD_URL } from '../lib/links';

/** Sober per-tool call to action, shown at the bottom of every tool page. */
export function DiscordCta() {
  const { t } = useI18n();
  return (
    <aside className="cta-block">
      <p>{t('cta.text')}</p>
      <a className="btn" href={DISCORD_URL} target="_blank" rel="noreferrer">
        {t('cta.button')}
      </a>
    </aside>
  );
}
