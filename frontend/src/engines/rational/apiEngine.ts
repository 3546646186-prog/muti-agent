import type { ChatMessage, DiscussionEngine, EngineEvent, SessionConfig } from '../../types';

/** 接 backend/服务.py：POST /api/discuss 返回 SSE，每段 data: {...} 是一个后端事件 */
export function createApiEngine(): DiscussionEngine {
  let cfg: SessionConfig;
  let emit: (e: EngineEvent) => void = () => {};
  let ctrl: AbortController | null = null;
  let round = 0;
  let ended = false;
  let seq = 0;
  const uid = () => 'm-' + Date.now().toString(36) + '-' + (seq++).toString(36);

  const idOf = (name?: string | null) => cfg.participants.find((p) => p.persona.name === name)?.agentId;
  const message = (m: Omit<ChatMessage, 'id' | 'at'>) => emit({ type: 'message', message: { ...m, id: uid(), at: Date.now() } });
  const allIdle = (state: 'idle' | 'done', action: string) =>
    cfg.participants.forEach((p) => emit({ type: 'status', agentId: p.agentId, state, action }));
  const finish = (state: 'finished' | 'stopped') => {
    if (ended) return;
    ended = true;
    allIdle(state === 'finished' ? 'done' : 'idle', state === 'finished' ? '完成' : '已停止');
    emit({ type: 'session', state });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handle = (e: any) => {
    switch (e.type) {
      case 'round':
        round = e.round;
        emit({ type: 'round', round: e.round, label: e.stage });
        break;
      case 'thinking': {
        const id = idOf(e.name);
        if (id) emit({ type: 'status', agentId: id, state: 'thinking', action: '思考中…' });
        break;
      }
      case 'speech': {
        const x = e.entry;
        const id = idOf(x.name);
        if (!id) break;
        emit({ type: 'status', agentId: id, state: 'speaking', action: e.toUser ? '回应你' : x.stance || '发言中' });
        message({
          round: x.round, speakerId: id, text: x.speech, kind: e.toUser ? 'reply' : 'speech',
          targetId: e.toUser ? 'user' : idOf(x.respondsTo),
          meta: { stance: x.stance, respondsTo: x.respondsTo, challenge: x.challenge, challengeTarget: x.challengeTarget, answered: x.answered },
        });
        // 发言气泡停留一会儿再回到倾听
        window.setTimeout(() => { if (!ended) emit({ type: 'status', agentId: id, state: 'idle', action: '倾听' }); }, 2500);
        break;
      }
      case 'summarizing':
        allIdle('idle', e.text);
        break;
      case 'summary':
        emit({ type: 'result', result: { consensus: [], disagreements: [], openQuestions: [], suggestions: [], summary: e.text } });
        break;
      case 'done':
        finish('finished');
        break;
      case 'stopped':
        finish('stopped');
        break;
      case 'error':
        emit({ type: 'error', id: 'err-' + uid(), message: e.message });
        finish('stopped');
        break;
    }
  };

  async function run() {
    ctrl = new AbortController();
    const body = {
      sessionId: cfg.sessionId,
      question: cfg.theme.title,
      brief: cfg.theme.brief ?? '',
      rounds: cfg.maxRounds,
      maxChars: cfg.maxChars ?? 150,
    members: cfg.participants.map((p) => ({ name: p.persona.name, personality: p.personality })),
    };
    const res = await fetch('/api/discuss', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal,
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: '后端没有响应（' + res.status + '）' }));
      handle({ type: 'error', message: err.error });
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const line = chunk.split('\n').find((l) => l.startsWith('data:'));
        if (line) handle(JSON.parse(line.slice(5)));
      }
    }
    finish('finished');
  }

  return {
    start(config, onEvent) {
      cfg = config; emit = onEvent; ended = false;
      emit({ type: 'session', state: 'running' });
      allIdle('idle', '就座');
      run().catch((err) => {
        if (ended) return;
        if (err?.name === 'AbortError') finish('stopped');
        else handle({ type: 'error', message: '连不上后端，请先在 backend 文件夹运行 python 服务.py（' + err + '）' });
      });
    },
    sendUserMessage({ text, targetAgentId }) {
      if (ended) return;
      const target = cfg.participants.find((p) => p.agentId === targetAgentId)?.persona.name;
      message({ round, speakerId: 'user', text, kind: 'user', targetId: targetAgentId });
      fetch(`/api/discuss/${encodeURIComponent(cfg.sessionId)}/say`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, target }),
      }).catch(() => emit({ type: 'error', id: 'say-' + uid(), message: '插话没有送达' }));
    },
    stop() {
      if (ended) return;
      fetch(`/api/discuss/${encodeURIComponent(cfg.sessionId)}/stop`, { method: 'POST' }).catch(() => {});
      ctrl?.abort();
      finish('stopped');
    },
  };
}
