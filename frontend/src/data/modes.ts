import type { ModeDef, ModeId } from '../types';

/** 三个模式共用同一套前端：选模式和主题 → 选人物 → 讨论室 → 结果 */
export const MODES: ModeDef[] = [
  {
    id: 'entertainment',
    name: '娱乐',
    tag: 'FUN',
    desc: '轻松闲聊、角色扮演、脑洞接龙',
    color: 'var(--c-orange)',
    scene: 'roundtable',
    roundLabels: ['开场破冰', '脑洞接龙', '投票收尾'],
    presets: ['如果周末只能做一件事，做什么？', '穿越回 1999 年你会带什么？', '给我们的办公室起个新名字'],
    importLabel: '＋ 导入人物 JSON',
  },
  {
    id: 'rational',
    name: '理性讨论',
    tag: 'LOGIC',
    desc: '开场、交锋、收尾，最后由主持人总结共识与分歧',
    color: 'var(--c-blue)',
    scene: 'roundtable',
    roundLabels: ['开场', '交锋', '收尾'],
    presets: ['数学是被发现的还是被发明的？', '人有没有自由意志？', 'AI 会让初级程序员岗位消失吗？'],
    importLabel: '＋ 导入人物 JSON',
  },
  {
    id: 'product',
    name: '工作 · 创造项目',
    tag: 'BUILD',
    desc: '负责人拆任务，工作 Agent 分工交接，最后产出网站、App 或设计',
    color: 'var(--c-green)',
    scene: 'office',
    roundLabels: ['任务拆分', '并行执行', '复核交付'],
    presets: ['做一个帮学生管理 DDL 的小程序', '为社区咖啡店设计会员系统', '给多人格讨论工作台写落地页'],
    importLabel: '＋ 导入工作 Agent JSON',
  },
];

export const modeById = (id: ModeId) => MODES.find((m) => m.id === id)!;
