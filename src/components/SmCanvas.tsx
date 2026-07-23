import { useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import type { SmMachine } from '../generators/statemachine/types';

export const NODE_W = 150;
export const NODE_H = 54;

export type SmSelection = { kind: 'state' | 'transition'; id: string } | null;

interface View {
  x: number;
  y: number;
  scale: number;
}

/** Point where the segment (from center -> to center) crosses the node border. */
function edgePoint(cx: number, cy: number, tx: number, ty: number): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = dx !== 0 ? NODE_W / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? NODE_H / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

export function SmCanvas({
  machine,
  selection,
  linkSource,
  linkMode,
  onSelect,
  onMoveState,
  onNodeClick,
}: {
  machine: SmMachine;
  selection: SmSelection;
  /** In link mode: id of the already-picked source state. */
  linkSource: string | null;
  linkMode: boolean;
  onSelect: (sel: SmSelection) => void;
  onMoveState: (id: string, x: number, y: number) => void;
  /** Node click in link mode (source/target picking). */
  onNodeClick: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const drag = useRef<
    | { kind: 'pan'; startX: number; startY: number; viewX: number; viewY: number }
    | { kind: 'node'; id: string; offsetX: number; offsetY: number; moved: boolean }
    | null
  >(null);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: view.x + (clientX - rect.left) / view.scale,
      y: view.y + (clientY - rect.top) / view.scale,
    };
  };

  const onWheel = (e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setView((v) => {
      const scale = Math.min(2.5, Math.max(0.3, v.scale * factor));
      const world = {
        x: v.x + (e.clientX - svgRef.current!.getBoundingClientRect().left) / v.scale,
        y: v.y + (e.clientY - svgRef.current!.getBoundingClientRect().top) / v.scale,
      };
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        scale,
        x: world.x - (e.clientX - rect.left) / scale,
        y: world.y - (e.clientY - rect.top) / scale,
      };
    });
  };

  const onBackgroundDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.target !== e.currentTarget && (e.target as Element).tagName !== 'rect') {
      // background rect handles pan too; nodes stop propagation
    }
    drag.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  const onNodeDown = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    e.stopPropagation();
    if (linkMode) return; // clicks handled on pointerup/click
    const world = toWorld(e.clientX, e.clientY);
    const s = machine.states.find((st) => st.id === id)!;
    drag.current = { kind: 'node', id, offsetX: world.x - s.x, offsetY: world.y - s.y, moved: false };
    svgRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === 'pan') {
      setView((v) => ({
        ...v,
        x: d.viewX - (e.clientX - d.startX) / v.scale,
        y: d.viewY - (e.clientY - d.startY) / v.scale,
      }));
    } else {
      const world = toWorld(e.clientX, e.clientY);
      d.moved = true;
      onMoveState(d.id, Math.round(world.x - d.offsetX), Math.round(world.y - d.offsetY));
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.kind === 'node' && !d.moved) {
      onSelect({ kind: 'state', id: d.id });
    }
  };

  const rect = svgRef.current?.getBoundingClientRect();
  const w = rect?.width ?? 900;
  const h = rect?.height ?? 480;

  const centers = new Map(machine.states.map((s) => [s.id, { x: s.x + NODE_W / 2, y: s.y + NODE_H / 2 }]));
  const hasReverse = (t: { from: string; to: string }) =>
    machine.transitions.some((o) => o.from === t.to && o.to === t.from && o.from !== o.to);

  return (
    <svg
      ref={svgRef}
      className="sm-canvas"
      viewBox={`${view.x} ${view.y} ${w / view.scale} ${h / view.scale}`}
      onWheel={onWheel}
      onPointerDown={onBackgroundDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="img"
    >
      <defs>
        <marker id="sm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-muted)" />
        </marker>
        <marker id="sm-arrow-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
        </marker>
      </defs>

      {machine.transitions.map((t) => {
        const from = centers.get(t.from);
        const to = centers.get(t.to);
        if (!from || !to) return null;
        const selected = selection?.kind === 'transition' && selection.id === t.id;
        const stroke = selected ? 'var(--accent)' : 'var(--ink-muted)';
        const marker = selected ? 'url(#sm-arrow-sel)' : 'url(#sm-arrow)';

        if (t.from === t.to) {
          // self-loop above the node
          const x = from.x;
          const y = from.y - NODE_H / 2;
          return (
            <g key={t.id} className="sm-edge" onClick={(e) => { e.stopPropagation(); onSelect({ kind: 'transition', id: t.id }); }}>
              <path
                d={`M ${x - 20} ${y} C ${x - 30} ${y - 44}, ${x + 30} ${y - 44}, ${x + 20} ${y}`}
                fill="none"
                stroke={stroke}
                strokeWidth={selected ? 2.5 : 1.5}
                markerEnd={marker}
              />
              <text x={x} y={y - 38} textAnchor="middle" className="sm-edge-label" fill={stroke}>
                {t.name}
              </text>
            </g>
          );
        }

        let ox = 0;
        let oy = 0;
        if (hasReverse(t)) {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          ox = (-dy / len) * 12;
          oy = (dx / len) * 12;
        }
        const a = edgePoint(from.x + ox, from.y + oy, to.x + ox, to.y + oy);
        const b = edgePoint(to.x + ox, to.y + oy, from.x + ox, from.y + oy);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={t.id} className="sm-edge" onClick={(e) => { e.stopPropagation(); onSelect({ kind: 'transition', id: t.id }); }}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={12} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={selected ? 2.5 : 1.5} markerEnd={marker} />
            <text x={mx} y={my - 6} textAnchor="middle" className="sm-edge-label" fill={stroke}>
              {t.name}
            </text>
          </g>
        );
      })}

      {machine.states.map((s) => {
        const selected = selection?.kind === 'state' && selection.id === s.id;
        const isInitial = machine.initialStateId === s.id;
        const isLinkSource = linkSource === s.id;
        return (
          <g
            key={s.id}
            className="sm-node"
            transform={`translate(${s.x} ${s.y})`}
            onPointerDown={(e) => onNodeDown(e, s.id)}
            onClick={(e) => {
              e.stopPropagation();
              if (linkMode) onNodeClick(s.id);
            }}
            style={{ cursor: linkMode ? 'crosshair' : 'grab' }}
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              fill="var(--bg-raised)"
              stroke={selected || isLinkSource ? 'var(--accent)' : 'var(--line-strong)'}
              strokeWidth={selected || isLinkSource ? 2.5 : 1.5}
            />
            {isInitial && <rect x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8} fill="none" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 3" />}
            <text x={10} y={24} className="sm-node-name" fill="var(--ink)">
              {s.name}
            </text>
            <text x={10} y={42} className="sm-node-meta" fill="var(--ink-muted)">
              {isInitial ? '▶ ' : ''}
              {s.authority === 'master' ? 'MASTER' : s.authority === 'owner' ? 'OWNER' : 'ANYONE'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
