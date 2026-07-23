import { useId, type ReactNode } from 'react';

/** Numbered section panel — the base building block of every tool page. */
export function Panel({
  idx,
  title,
  children,
  bodyClassName,
}: {
  idx: string;
  title: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  const titleId = useId();
  return (
    <section className="panel" aria-labelledby={titleId}>
      <h2 className="panel-title" id={titleId}>
        <span className="idx">{idx}</span> {title}
      </h2>
      <div className={bodyClassName ? `panel-body ${bodyClassName}` : 'panel-body'}>{children}</div>
    </section>
  );
}
