"""把 通用规则 + 角色 + 性格 + 风格 拼成一段系统提示词。

用法：
  python 组装提示词.py 灰先生 --性格 怀疑 谨慎 --风格 毒舌 --字数 200
  python 组装提示词.py 灰先生 --性格 怀疑 幽默 --风格 冷幽默 -o 输出.md

角色没有默认性格和风格，每次都必须指定：性格 1 到 3 个，风格 1 个。

在程序里调用：
  from 组装提示词 import build
  system_prompt = build("灰先生", traits=["怀疑", "谨慎"], style="毒舌")
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
P = ROOT / "提示词"


def _load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def _find_persona(name):
    for f in (ROOT / "人物").rglob("*.json"):
        p = _load(f)["persona"]
        if name in (p["name"], p["id"], f.stem):
            return p, f.relative_to(ROOT / "人物").with_suffix(".md")
    raise SystemExit("找不到人物：" + name)


def build(name, traits, style, max_chars=150):
    persona, role_path = _find_persona(name)
    trait_lib = {t["id"]: t for t in _load(ROOT / "性格库" / "行为性格.json")["traits"]}
    style_lib = {s["id"]: s for s in _load(ROOT / "性格库" / "说话风格.json")["styles"]}
    name_to_trait = {t["name"]: i for i, t in trait_lib.items()}
    name_to_style = {s["name"]: i for i, s in style_lib.items()}

    if not traits or not style:
        raise SystemExit(f"请为 {persona['name']} 选择性格和风格，角色没有默认值。")
    trait_ids = [name_to_trait.get(t, t) for t in traits]
    style_id = name_to_style.get(style, style)

    bad = [t for t in trait_ids if t not in trait_lib]
    if bad:
        allowed = "、".join(t["name"] for t in trait_lib.values())
        raise SystemExit(f"性格不存在：{bad}。可选：{allowed}")
    if not 1 <= len(trait_ids) <= 3:
        raise SystemExit("性格要选 1 到 3 个")
    if style_id not in style_lib:
        allowed = "、".join(s["name"] for s in style_lib.values())
        raise SystemExit(f"风格不存在：{style}。可选：{allowed}")

    parts = [(P / "通用规则.md").read_text(encoding="utf-8").replace("{{字数上限}}", str(max_chars)),
             (P / "角色" / role_path).read_text(encoding="utf-8")]
    for i in trait_ids:
        parts.append((P / "性格" / (trait_lib[i]["name"] + ".md")).read_text(encoding="utf-8"))
    # 风格放最后，离模型输出最近，最不容易被忽略
    parts.append((P / "风格" / (style_lib[style_id]["name"] + ".md")).read_text(encoding="utf-8"))
    return "\n---\n\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description="组装人物系统提示词")
    ap.add_argument("人物")
    ap.add_argument("--性格", nargs="+", dest="traits", required=True)
    ap.add_argument("--风格", dest="style", required=True)
    ap.add_argument("--字数", type=int, default=150, dest="max_chars")
    ap.add_argument("-o", dest="out")
    a = ap.parse_args()
    text = build(a.人物, a.traits, a.style, a.max_chars)
    if a.out:
        Path(a.out).write_text(text, encoding="utf-8")
        print("已保存到", a.out)
    else:
        print(text)


if __name__ == "__main__":
    main()
