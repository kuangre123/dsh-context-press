import { useRef, useState, type PointerEvent } from "react";

export interface HydraulicPressProps {
  busy: boolean;
  before?: number;
  after?: number;
  usage?: number;
  disabled?: boolean;
  status?: string;
  onCompact: () => void;
}

const format = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const tokens = (value?: number) => value === undefined ? "—" : format.format(value);

export function HydraulicPress({
  busy, before, after, usage, disabled, status, onCompact,
}: HydraulicPressProps) {
  const [expanded, setExpanded] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ id: number; x: number; y: number; origin: typeof offset; bounds: DOMRect } | null>(null);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current || !panel.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      origin: offset, bounds: panel.current.getBoundingClientRect(),
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const { bounds, origin } = start;
    setOffset({
      x: origin.x + Math.max(8 - bounds.left, Math.min(window.innerWidth - 8 - bounds.right, event.clientX - start.x)),
      y: origin.y + Math.max(8 - bounds.top, Math.min(window.innerHeight - 8 - bounds.bottom, event.clientY - start.y)),
    });
  }

  const result = !busy && before !== undefined && after !== undefined;
  const saved = result && before > 0 && after < before
    ? Math.round(100 * (before - after) / before) : undefined;
  const layers = result && before > 0
    ? Math.max(10, Math.min(43, 43 * after / before)) : 43;

  return (
    <div className="dsh-context-press">
      <style>{styles}</style>
      <button className="dsh-press-trigger" type="button" aria-expanded={expanded}
        onClick={() => { if (!expanded) setOffset({ x: 0, y: 0 }); setExpanded(!expanded); }}>
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 3h12M4 17h12M10 3v6m-3-2 3 3 3-3M5 13h10"/>
        </svg>
        <span>{busy ? "压缩中" : "液压机"}</span>
        {usage !== undefined && <span className="dsh-press-count">{tokens(usage)}</span>}
      </button>
      {expanded && (
        <section ref={panel} className="dsh-press-panel" aria-label="上下文液压机"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
          <header>
            <div className="dsh-press-handle" title="拖动面板"
              onPointerDown={startDrag} onPointerMove={moveDrag}
              onLostPointerCapture={() => { drag.current = null; }}>
              <small>⠿ CONTEXT PRESS</small><strong>上下文液压机</strong>
            </div>
            <button className="dsh-press-close" type="button" aria-label="关闭面板"
              onClick={() => setExpanded(false)}>×</button>
          </header>
          <div className="dsh-press-machine" data-busy={busy} aria-hidden="true">
            <div className="dsh-press-rail left"/><div className="dsh-press-rail right"/>
            <div className="dsh-press-ram"><div className="dsh-press-shaft"/><div className="dsh-press-shoe"/></div>
            <div className="dsh-press-cylinder"/>
            <div className="dsh-press-paper" style={{ height: layers }}/>
            <div className="dsh-press-bed"/>
          </div>
          <div className="dsh-press-readout" aria-live="polite">
            <div>
              <small>活跃上下文 · tokens</small>
              <strong>{result ? <>{tokens(before)} <span aria-hidden="true">→</span> {tokens(after)}</> : tokens(usage ?? before)}</strong>
            </div>
            {saved !== undefined && <span className="dsh-press-saved">↓ {saved}%</span>}
          </div>
          <button className="dsh-press-run" type="button" onClick={onCompact} disabled={busy || disabled}>
            {busy ? "正在压缩…" : "↓ 压缩当前会话"}
          </button>
          <p className="dsh-press-status" role="status">{status ?? "使用 Harness 原生压缩"}</p>
        </section>
      )}
    </div>
  );
}

const styles = `
.dsh-context-press{position:relative;color:inherit}
.dsh-context-press button{font:inherit;cursor:pointer}
.dsh-press-trigger{display:flex;gap:5px;align-items:center;border:1px solid transparent;border-radius:7px;padding:4px 7px;color:inherit;background:transparent;white-space:nowrap}
.dsh-press-trigger:hover,.dsh-press-trigger[aria-expanded=true]{border-color:#ce9b483d;background:#d4983520}
.dsh-press-trigger svg,.dsh-press-count{color:#b9802f}
.dsh-press-count{font-variant-numeric:tabular-nums}
.dsh-press-panel{position:absolute;z-index:40;right:0;bottom:calc(100% + 12px);box-sizing:border-box;width:min(276px,calc(100vw - 30px));padding:13px;border:1px solid #454039;border-radius:16px;background:linear-gradient(150deg,#252624,#181a1c);box-shadow:0 12px 38px #0006;color:#f8f2e8;text-align:left}
.dsh-press-panel header,.dsh-press-readout{display:flex;align-items:center;justify-content:space-between;gap:8px}
.dsh-press-panel small,.dsh-press-panel strong{display:block}
.dsh-press-panel small{font:10px ui-monospace,monospace;color:#b7ada0;letter-spacing:.07em}
.dsh-press-handle{flex:1;cursor:grab;touch-action:none;user-select:none}
.dsh-press-handle:active{cursor:grabbing}
.dsh-press-panel header strong{margin-top:4px;font-size:15px}
.dsh-press-close{background:transparent;border:0;color:#c5bdb1;min-width:26px;min-height:26px;border-radius:6px}
.dsh-press-close:hover{background:#fff2}
.dsh-press-machine{position:relative;overflow:hidden;height:113px;margin:11px 0 8px;border-radius:9px;border:1px solid #403e3a;background:radial-gradient(circle,#fff2 1px,transparent 1.4px) 2px 3px/9px 9px,#171818}
.dsh-press-rail{position:absolute;top:4px;bottom:6px;width:8px;border-radius:2px;background:linear-gradient(90deg,#292a2a,#717473,#3c3c3c)}
.dsh-press-rail.left{left:9px}.dsh-press-rail.right{right:9px}
.dsh-press-cylinder,.dsh-press-ram,.dsh-press-paper{position:absolute;left:50%;translate:-50% 0}
.dsh-press-cylinder{top:0;width:50px;height:20px;border-radius:0 0 5px 5px;background:linear-gradient(#656561,#393b3c)}
.dsh-press-ram{bottom:76px;transform:translateY(0);transition:transform .45s ease-out}
.dsh-press-machine[data-busy=true] .dsh-press-ram{transform:translateY(49px);transition:transform .8s cubic-bezier(.58,.12,.22,1)}
.dsh-press-shaft{width:26px;height:84px;margin:auto;background:linear-gradient(90deg,#575a5c,#dee2dc 48%,#656763)}
.dsh-press-shoe{width:108px;height:10px;border-radius:3px;background:repeating-linear-gradient(135deg,#e9ab43 0 8px,#242628 8px 16px);box-shadow:0 2px 5px #0007}
.dsh-press-paper{bottom:12px;width:79px;border-radius:2px;background:repeating-linear-gradient(0deg,#8d5628 0 1px,#edb558 1px 3px);box-shadow:0 0 10px #e79b3826;transition:height .4s ease-out}
.dsh-press-machine[data-busy=true] .dsh-press-paper{height:15px!important;transition:height .55s ease-out .23s}
.dsh-press-bed{position:absolute;bottom:5px;left:8px;right:8px;height:7px;border-radius:2px;background:linear-gradient(#818480,#484a48)}
.dsh-press-readout strong{margin-top:3px;font:600 21px ui-monospace,monospace;color:#f8f0df}
.dsh-press-readout strong span{color:#b7ada0}
.dsh-press-saved{font:600 12px ui-monospace,monospace;color:#a8e7b1;background:#74bf8025;border-radius:6px;padding:5px}
.dsh-press-run{width:100%;margin-top:10px;padding:7px;border:0;border-radius:7px;background:#ecb654;color:#2a2117;font-weight:650!important}
.dsh-press-run:disabled{opacity:.52;cursor:default}
.dsh-press-status{margin:6px 0 0;color:#b7ada0;font-size:11px;text-align:center;overflow-wrap:anywhere}
@media(prefers-reduced-motion:reduce){.dsh-press-ram,.dsh-press-paper{transition:none!important}}
`;
