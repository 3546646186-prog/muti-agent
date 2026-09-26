import type { Draft } from '../App';
import { modeById } from '../data/modes';

export function SetupScene({ draft, onChange, onNext }: { draft: Draft; onChange: (d: Draft) => void; onNext: () => void }) {
  const mode = modeById('rational');
  return (
    <main className="setup">
      <section className="panel">
        <h2><b>01</b> 讨论主题 <small>理性讨论 · {mode.desc}</small></h2>
        <input
          className="px-input big"
          placeholder="输入你想讨论的问题…"
          value={draft.theme}
          maxLength={100}
          onChange={(e) => onChange({ ...draft, theme: e.target.value })}
        />
        <div className="chips">
          {mode.presets.map((p) => (
            <button key={p} className="chip" onClick={() => onChange({ ...draft, theme: p })}>{p}</button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2><b>02</b> 讨论设置</h2>
        <div className="rt-settings">
          <label>
            轮数
            <input className="px-input" type="number" min={2} max={6} value={draft.rounds}
              onChange={(e) => onChange({ ...draft, rounds: Math.max(2, Math.min(6, +e.target.value || 2)) })} />
            <small>第 1 轮开场，最后一轮收尾，中间是交锋</small>
          </label>
          <label>
            每次发言字数上限
            <input className="px-input" type="number" min={50} max={400} step={10} value={draft.maxChars}
              onChange={(e) => onChange({ ...draft, maxChars: Math.max(50, Math.min(400, +e.target.value || 150)) })} />
          </label>
        </div>
      </section>

      <footer className="setup-foot">
        <span>{draft.rounds} 轮 · 每次 {draft.maxChars} 字以内 · {draft.theme || '（还没有主题）'}</span>
        <button className="px-btn primary" disabled={!draft.theme.trim()} onClick={onNext}>下一步：选择人物 ▶</button>
      </footer>
    </main>
  );
}

