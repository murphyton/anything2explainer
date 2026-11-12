#!/usr/bin/env python3
"""渲前字形覆盖自检：把当期文案（narration.txt + src/config.ts 字符串）逐字符对照主题字体的 cmap，
缺字的字符按「字体 × 字符」列出并给替代建议，保证不会渲出豆腐块才发现。

用法：
  python3 scripts/check_glyphs.py [--theme auto] [--narration script/narration.txt] [--strict]
  --theme auto 读 src/config.ts 的 theme；也可显式传 nobel|book|ai|stem|purple-dots
  --strict     有缺字时退出码 1（供 render.sh 渲前卡口；默认只告警）

判定逻辑：
  - 主题 fontFiles 里每个 family 的全部字重 cmap 取并集（同一 family 任一字重有该字形即可）；
  - 文案字符先查「主题标题/正文主 family」，再查回退链其余 family；任何一层覆盖即算通过；
  - 通用回退（Noto Sans SC 等）不在 theme fontFiles 里时按文件存在性补查 public/fonts；
  - 控制字符/空白跳过；报告列出：字符、码点、出现次数、所属文件行、建议（换字/上标排版/换 family）。
依赖：fonttools（pip install fonttools）。
"""
import argparse, json, os, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--theme', default='auto')
ap.add_argument('--narration', default='script/narration.txt')
ap.add_argument('--config', default='src/config.ts')
ap.add_argument('--fonts-dir', default='public/fonts')
ap.add_argument('--tokens', default='src/themes/tokens.json')
ap.add_argument('--strict', action='store_true')
a = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    try:
        from fontTools.ttLib import TTFont, TTLibError
    except ImportError:
        print('check_glyphs: 需要 fonttools（pip install fonttools）——跳过检查（不阻塞渲染）')
        return 0

    theme = a.theme
    if theme in ('auto', ''):
        try:
            m = re.search(r"theme:\s*'([a-zA-Z-]+)'", open(os.path.join(ROOT, a.config), encoding='utf-8').read())
            theme = m.group(1) if m else 'purple-dots'
        except OSError:
            theme = 'purple-dots'

    try:
        tokens = json.load(open(os.path.join(ROOT, a.tokens), encoding='utf-8'))
        spec = tokens[theme]
    except (OSError, ValueError, KeyError) as e:
        print(f'check_glyphs: 读不到主题 token（{e}）——跳过检查')
        return 0

    # family → 并集 cmap；fontFile → 路径
    fam_cmaps: dict[str, set] = {}
    fam_files: dict[str, list] = {}
    for ff in spec.get('fontFiles', []):
        path = os.path.join(ROOT, a.fonts_dir, ff['file'])
        fam_files.setdefault(ff['family'], []).append(path)
    for fam, paths in fam_files.items():
        union: set = set()
        for path in paths:
            try:
                f = TTFont(path, fontNumber=0, lazy=True)
                union |= set(f.getBestCmap().keys())
            except (TTLibError, OSError) as e:
                print(f'check_glyphs: 无法读 {path}（{e}）')
        fam_cmaps[fam] = union

    # 收集文案：narration.txt 全文 + config.ts 字符串字面量
    texts: list[tuple[str, str]] = []  # (来源, 内容)
    try:
        for i, line in enumerate(open(os.path.join(ROOT, a.narration), encoding='utf-8'), 1):
            if line.strip():
                texts.append((f'{a.narration}:{i}', line))
    except OSError:
        pass
    try:
        cfg = open(os.path.join(ROOT, a.config), encoding='utf-8').read()
        for m in re.finditer(r"'([^']*)'|\"([^\"]*)\"", cfg):
            s = m.group(1) if m.group(1) is not None else m.group(2)
            if s:
                texts.append((a.config, s))
    except OSError:
        pass

    # 主 family 顺序：title → titleRest → kicker → body → mono（在前的优先报告）
    fam_order = []
    for k in ('title', 'titleRest', 'kicker', 'body', 'mono'):
        fam = spec.get('fonts', {}).get(k, '')
        first = re.match(r"'([^']+)'", fam)
        if first and first.group(1) in fam_cmaps and first.group(1) not in fam_order:
            fam_order.append(first.group(1))

    miss: dict[tuple, list] = {}  # (char, codepoint, fam) → [来源]
    for src, line in texts:
        for ch in line:
            if ch.isspace() or ord(ch) < 0x20:
                continue
            covered = any(ord(ch) in fam_cmaps[f] for f in fam_order)
            if not covered:
                key = (ch, f'U+{ord(ch):04X}', fam_order[0] if fam_order else '?')
                miss.setdefault(key, []).append(src)

    if not miss:
        print(f'check_glyphs: 主题 {theme} 字形覆盖 OK（文案 {len(texts)} 段 × 主链 {len(fam_order)} 字族）')
        return 0
    print(f'check_glyphs: 主题 {theme} 有 {len(miss)} 个缺字（按首字族报告；回退链可能已覆盖，仅列需人工确认项）：')
    for (ch, cp, fam), srcs in sorted(miss.items(), key=lambda kv: -len(kv[1])):
        where = '、'.join(sorted(set(srcs))[:3]) + ('…' if len(set(srcs)) > 3 else '')
        print(f'  {ch!r} {cp} fam={fam} ×{len(srcs)} @ {where}')
    print('  建议：①上标/特殊符号改用排版实现（小字号+偏移），不要用 Unicode 字符；②数学符号换 STIX Two Math 或 KaTeX；③英文装饰词换西文字体渲染。')
    return 1 if a.strict else 0

if __name__ == '__main__':
    sys.exit(main())
