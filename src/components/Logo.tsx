/**
 * "Quorum" mark: three client nodes converging on a central replicated-state
 * diamond. The top node (master) is slightly larger; one link is dashed —
 * replication in flight. Single color (currentColor), 24-grid, hard angles.
 */
export function Logo({ size = 24, strokeWidth = 2, title }: { size?: number; strokeWidth?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      <g stroke="currentColor" strokeWidth={strokeWidth}>
        <line x1="12" y1="7.5" x2="12" y2="10" />
        <line x1="5.5" y1="18.5" x2="10.5" y2="13.2" />
        <line x1="18.5" y1="18.5" x2="13.5" y2="13.2" strokeDasharray="2 1.6" />
      </g>
      <g fill="currentColor">
        <rect x="9.1" y="1.6" width="5.8" height="5.8" />
        <rect x="2.8" y="16.6" width="4.8" height="4.8" />
        <rect x="16.4" y="16.6" width="4.8" height="4.8" />
        <path d="M12 9.4 L14.6 12 L12 14.6 L9.4 12 Z" />
      </g>
    </svg>
  );
}
