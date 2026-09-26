import { useEffect, useState } from 'react';
import type { ModeId, Persona, SceneId, SessionConfig } from './types';
import { SetupScene } from './components/SetupScene';
import { RationalCast } from './components/RationalCast';
import { DiscussionView } from './components/DiscussionView';
import { PersonaCodex } from './components/PersonaCodex';
import { loadOptions, toPersona } from './data/backendPersonas';

export interface Draft {
  mode: ModeId;
  theme: string;
  sceneId: SceneId;
  rounds: number;
  maxChars: number;
}

export default function App() {
  // 1 主题 · 轮数 → 2 人物 · 性格 → 3 圆桌讨论（只做理性讨论，人物来自 backend 人格数据库）
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<Draft>({ mode: 'rational', theme: '', sceneId: 'roundtable', rounds: 3, maxChars: 150 });
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [codex, setCodex] = useState(false);
  const canBack = codex || step === 2;
  const back = () => (codex ? setCodex(false) : setStep(1));

  useEffect(() => { loadOptions().then((o) => setPersonas(o.personas.map(toPersona))).catch(() => {}); }, []);

  return (
    <div className="app">
      {step < 3 && (
        <header className="topbar">
          <div className="topbar-left">
            <button className="back-btn" disabled={!canBack} onClick={back} title={codex ? '关闭图鉴' : '返回上一步'}>◀ 返回</button>
            <span className="logo">理性讨论圆桌</span>
          </div>
          <ol className="steps">
            {['主题 · 轮数', '人物 · 性格', '讨论'].map((s, i) => (
              <li key={s} className={codex ? '' : step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}>
                <span>{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <button className={'codex-btn' + (codex ? ' on' : '')} onClick={() => setCodex(!codex)} title="查看人格数据库里的人物">▤ 图鉴</button>
        </header>
      )}
      {codex && step < 3 && <PersonaCodex personas={personas} initialMode="rational" onClose={() => setCodex(false)} />}
      {!codex && step === 1 && <SetupScene draft={draft} onChange={setDraft} onNext={() => setStep(2)} />}
      {!codex && step === 2 && (
        <RationalCast
          draft={draft}
          onBack={() => setStep(1)}
          onStart={(cfg) => { setSession(cfg); setStep(3); }}
        />
      )}
      {step === 3 && session && <DiscussionView key={session.sessionId} config={session} onExit={() => setStep(2)} />}
    </div>
  );
}

