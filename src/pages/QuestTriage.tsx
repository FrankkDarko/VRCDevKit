import { useI18n } from '../i18n';
import { Panel } from '../components/ui/Panel';
import { DiscordCta } from '../components/DiscordCta';
import { useCopied } from '../lib/useCopied';
import {
  TRIAGE_NODES,
  TRIAGE_ROOT,
  type LocalizedText,
  type QuestionNode,
  type SheetNode,
} from '../data/questTriage';

const nodeHref = (id: string) =>
  id === TRIAGE_ROOT ? '#/quest-triage' : `#/quest-triage?n=${encodeURIComponent(id)}`;

export function QuestTriage({ params }: { params: URLSearchParams }) {
  const { t, lang } = useI18n();
  const L = (lt: LocalizedText) => lt[lang];

  const requested = params.get('n') ?? TRIAGE_ROOT;
  const node = TRIAGE_NODES[requested] ?? TRIAGE_NODES[TRIAGE_ROOT];

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('qt.title')}</h1>
        <p>{t('qt.subtitle')}</p>
      </div>

      {node.kind === 'question' ? (
        <QuestionView node={node} L={L} />
      ) : (
        <SheetView node={node} L={L} />
      )}

      <DiscordCta />
    </div>
  );
}

function QuestionView({
  node,
  L,
}: {
  node: QuestionNode;
  L: (lt: LocalizedText) => string;
}) {
  const { t } = useI18n();
  return (
    <Panel idx="?" title={t('qt.question')}>
      <p className="qt-question">{L(node.text)}</p>
      {node.hint && <p className="qt-hint">{L(node.hint)}</p>}
      <div className="qt-answers">
        {node.answers.map((a) => (
          <a key={a.next} className="scenario-btn" href={nodeHref(a.next)}>
            <span className="name">{L(a.label)}</span>
          </a>
        ))}
      </div>
      {node.id !== TRIAGE_ROOT && <TrailActions showBack />}
    </Panel>
  );
}

function SheetView({ node, L }: { node: SheetNode; L: (lt: LocalizedText) => string }) {
  const { t } = useI18n();
  const { copied, copy } = useCopied();
  return (
    <Panel idx="✓" title={`${t('qt.sheet')} — ${L(node.title)}`}>
      <article className="issue" data-severity="warning">
        <div className="issue-head">
          <span className="sev">{t('qt.cause')}</span>
        </div>
        <dl>
          <dd>{L(node.cause)}</dd>
          <dt>{t('qt.check')}</dt>
          <dd>{L(node.check)}</dd>
        </dl>
      </article>

      <h3 className="qt-fix-title">{t('qt.fix')}</h3>
      <ol className="qt-steps">
        {node.fix.map((step, i) => (
          <li key={i}>{L(step)}</li>
        ))}
      </ol>

      {node.doc && (
        <p className="qt-doc">
          {t('qt.doc')}:{' '}
          <a href={node.doc.url} target="_blank" rel="noreferrer">
            {node.doc.label}
          </a>
        </p>
      )}

      <TrailActions showBack>
        <button
          type="button"
          className="btn"
          onClick={() => void copy('sheet', window.location.href)}
        >
          {copied === 'sheet' ? t('common.copied') : t('qt.shareSheet')}
        </button>
      </TrailActions>
    </Panel>
  );
}

function TrailActions({
  showBack,
  children,
}: {
  showBack?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="toolbar" style={{ marginTop: 18 }}>
      {children}
      {showBack && (
        <button type="button" className="btn" onClick={() => history.back()}>
          {t('qt.back')}
        </button>
      )}
      <a className="btn ghost" href={nodeHref(TRIAGE_ROOT)}>
        {t('qt.restart')}
      </a>
    </div>
  );
}
