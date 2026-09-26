import { useEffect, useState } from 'react';
import type { Draft } from '../App';
import type { SessionConfig } from '../types';
import { SCENES } from '../data/scenes';
import { engineFor } from '../engines/registry';
import { loadOptions, toPersona, type Options } from '../data/backendPersonas';
import { PixelAvatar } from './PixelAvatar';


export function RationalCast({ draft, onBack, onStart }: { draft: Draft; onBack: () => void; onStart: (cfg: SessionConfig) => void }) {
  const [opt, setOpt] = useState<Options | null>(null);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOptions().then(setOpt).catch(() => setErr('连不上后端。请先在 backend 文件夹运行 python 服务.py，然后刷新页面。'));
  }, []);

  if (!opt) return <main className="setup"><section className="panel"><p>{err || '正在读取人物…'}</p></section></main>;

  const pickOf = (id: string) => picks[id] ?? '';
  const toggleSeat = (id: string) => {
    if (order.includes(id)) setOrder(order.filter((x) => x !== id));
    else if (order.length < 5) setOrder([...order, id]);
  };
  const missing = order.filter((id) => !pickOf(id));
  const names = (ids: string[]) => ids.map((id) => opt.personas.find((p) => p.id === id)!.name).join('、');
  const canStart = order.length >= 2 && !missing.length && !opt.configError;

  const start = () => {
    const participants = order.map((id, i) => {
      const idx = opt.personas.findIndex((p) => p.id === id);
      const ap = opt.personas[idx];
      // 圆桌 8 个座位，按人数均匀分布
      return {
        agentId: id, seatIndex: Math.round((i * 8) / order.length) % 8, color: ap.color,
        personalityId: 'custom', persona: toPersona(ap, idx), personality: pickOf(id),
      };
    });
    onStart({
      sessionId: 's-' + Date.now().toString(36), mode: 'rational', sceneId: 'roundtable',
      theme: { title: draft.theme.trim() }, maxRounds: draft.rounds, maxChars: draft.maxChars,
      participants, engineOptions: { ...engineFor('rational').defaults }, createdAt: new Date().toISOString(),
    });
  };

  return (
    <main className="setup cast">
      <section className="panel cast-head">
        <h2><b>03</b> 选择人物 <small>{SCENES.roundtable.name} · 已选 {order.length}/5 · 每人选 1 个性格</small></h2>
        <span className="hint">
          {opt.dryRun ? '试跑模式：不调用模型，只显示示例发言' : opt.configError ? '⚠ ' + opt.configError : '模型：' + opt.model}
        </span>
      </section>

      <div className="persona-grid">
        {opt.personas.map((ap, i) => {
          const on = order.includes(ap.id);
          const pk = pickOf(ap.id);
          const persona = toPersona(ap, i);
          return (
            <article key={ap.id} className={'persona-card' + (on ? ' on' : '')} style={{ ['--ac' as string]: ap.color }}>
              <div className="pc-top" onClick={() => toggleSeat(ap.id)}>
                <div className="pc-avatar"><PixelAvatar v={persona.visual} size={56} /></div>
                <div>
                  <strong>{ap.name}</strong>
                  <small>{ap.role} · {ap.profession}</small>
                </div>
                {on && <span className="pc-no">{order.indexOf(ap.id) + 1}</span>}
              </div>
              <dl>
                <dt>知识</dt><dd>{ap.domains.join(' / ')}</dd>
                <dt>思想</dt><dd>{ap.tradition}</dd>
                <dt>信念</dt><dd>{ap.coreConviction}</dd>
              </dl>
              <label className="pc-select">
                性格
                <select value={pk} onChange={(e) => setPicks({ ...picks, [ap.id]: e.target.value })}>
                  <option value="">请选择…</option>
                  {opt.personalities.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </label>
              <p className="pc-behavior">▸ {opt.personalities.find((s) => s.name === pk)?.description ?? ap.description}</p>
              <div className="pc-actions">
                <button className={'px-btn ' + (on ? 'danger' : 'primary')} onClick={() => toggleSeat(ap.id)}>{on ? '移出' : '入座'}</button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="setup-foot">
        <button className="px-btn" onClick={onBack}>◀ 返回</button>
        <span>
          「{draft.theme}」
          {order.length < 2 && ' · 至少选 2 人'}
          {missing.length > 0 && ` · 还要给 ${names(missing)} 选性格`}
        </span>
        <button className="px-btn primary" disabled={!canStart} onClick={start}>进入圆桌 ▶</button>
      </footer>
    </main>
  );
}
