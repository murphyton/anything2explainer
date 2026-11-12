import React from 'react';
import {useCurrentFrame} from 'remotion';
import {GlitchIn, kf, emphasisPulse, easeInOutPow, SENTENCES, TOTAL_FRAMES, CHAPTER_STARTS, FONT_HEAVY, FONT_WIDE, FONT_ORB, FONT_TECH, clamp01, SQUEEZE, fitSize, EM_WIDE} from '../common';
import {CText, TechText, TechSub, Pill, TopCapsule, ArrowH, PURPLE, PURPLE_TECH, GREY, GREY_MID, WHITE, GLOW_PURPLE_S, PILL_SHADOW, ACCENT_RGB, fadeIn, slideUp} from '../ui';
import {VIDEO} from '../config';
import {getTheme} from '../themes';
const clampFrames = (n: number, len: number) => clamp01(n / len);
const THEME = getTheme(VIDEO.theme);

// ---------- 主题入场签名（帧驱动；purple-dots/ai=glitch，nobel=ink，book=page，stem=chalk） ----------
/** ink：墨点显影——淡入 + 1.5% 缩放收拢（无 blur，避免大半径 filter） */
const inkIn = (n: number) => {
  const k = clamp01(n / 28);
  return {opacity: k, transform: `scale(${(1.015 - 0.015 * k).toFixed(4)})`, transformOrigin: '50% 50%'};
};
/** page：翻页——透视 rotateX 62°→0 自底部起翻 */
const pageIn = (n: number) => {
  const k = clamp01(n / 24);
  const e = 1 - Math.pow(1 - k, 2.5);
  return {opacity: clamp01(n / 10), transform: `perspective(1100px) rotateX(${((1 - e) * 62).toFixed(2)}deg) translateY(${((1 - e) * 22).toFixed(1)}px)`, transformOrigin: '50% 110%'};
};
/** chalk：板书——clip-path 从左向右写出 */
const chalkIn = (n: number) => ({clipPath: `inset(0 ${((1 - clamp01(n / 40)) * 100).toFixed(2)}% 0 0)`, opacity: n < 0 ? 0 : 1});
const ThemeEntrance: React.FC<{N: number; f0: number; seed?: number; children: React.ReactNode}> = ({N, f0, seed, children}) => {
  const n = N - f0;
  switch (THEME.params.entrance) {
    case 'ink':
      return <div style={{...inkIn(n), position: 'absolute', inset: 0}}>{children}</div>;
    case 'page':
      return <div style={{...pageIn(n), position: 'absolute', inset: 0}}>{children}</div>;
    case 'chalk':
      return <div style={{...chalkIn(n), position: 'absolute', inset: 0}}>{children}</div>;
    default:
      return <GlitchIn N={N} f0={f0} rgbSplit={6} slices={14} seed={seed ?? 3}>{children}</GlitchIn>;
  }
};

// ---------- 时间轴查询 ----------
export const S = (id: string) => {
  const s = SENTENCES.find((x) => x.id === id);
  if (!s) throw new Error(`config 引用了不存在的句 id ${id}（请对照 script/timeline.md）`);
  return s;
};

/** 12 帧加速上出：n<0 → 原位；位移 (n/11)^2·440px，透明度 1−(n/11)^1.6 → 末帧 0（QC v1 C1 #1/#2） */
const exitOut = (n: number) => {
  if (n < 0) return {dy: 0, op: 1};
  const t = Math.min(1, n / 11);
  return {dy: t * t * 440, op: 1 - Math.pow(t, 1.6)};
};

// ---------- 片头 ----------
// 配音未生成时（timeline.ts 占位、SENTENCES 为空）用兜底值，让探针 still 能渲染
export const TITLE_RANGE: [number, number] = [1, (SENTENCES[0]?.from ?? 100) - 9];
const IS_DEFAULT_THEME = VIDEO.theme === 'purple-dots';
/** 非默认主题的封面：newtemplates.html 封面模式——左对齐 kicker（宽体缩写，字距拉开）+ 大标题（主题字体）+ 渐变分割线 + 副标。默认主题保持历史版式。 */
const CoverNew: React.FC<{N: number; a: number; glow: number}> = ({N, a, glow}) => {
  const n = N - (a + 11);
  const ruleW = kf(n, [[0, 0], [22, 280]], easeInOutPow(2.5));
  return (
    <ThemeEntrance N={N} f0={a + 11} seed={3}>
      <div style={{position: 'absolute', left: 110, top: 228, fontFamily: THEME.fonts.kicker, fontSize: 22, fontWeight: 700, letterSpacing: 8, color: PURPLE, textShadow: `0 0 12px rgba(${ACCENT_RGB},.5)`}}>{VIDEO.title.big}</div>
      <div style={{position: 'absolute', left: 108, top: 268, fontFamily: THEME.fonts.title, fontWeight: THEME.fonts.titleWeight, fontSize: fitSize(VIDEO.title.rest || VIDEO.title.big, 980, 92, 58, 1, 3), color: WHITE, lineHeight: 1.15, letterSpacing: 3, textShadow: `0 0 ${16 + 12 * glow}px rgba(${ACCENT_RGB},${0.4 + 0.25 * glow})`, whiteSpace: 'nowrap'}}>{VIDEO.title.rest || VIDEO.title.big}</div>
      <div style={{position: 'absolute', left: 112, top: 415, width: ruleW, height: 3, background: `linear-gradient(90deg, ${PURPLE}, rgba(${ACCENT_RGB},0))`}} />
      <div style={{position: 'absolute', left: 112, top: 440, fontFamily: THEME.fonts.body, fontSize: 26, fontWeight: 300, color: GREY, letterSpacing: 5}}>{VIDEO.title.tagline}</div>
      {VIDEO.title.en ? <div style={{position: 'absolute', left: 112, top: 496, fontFamily: FONT_TECH, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: GREY_MID, letterSpacing: 1}}>{VIDEO.title.en}</div> : null}
    </ThemeEntrance>
  );
};
export const Title: React.FC = () => {
  const N = useCurrentFrame() + TITLE_RANGE[0];
  const [a, b] = TITLE_RANGE;
  const exitN = N - (b - 11); // 末 12 帧上摇出画（QC v1：原 8 帧只走了 59px/63% 亮度就被硬切）
  const dy = -exitOut(exitN).dy;
  const op = exitOut(exitN).op;
  const glow = 0.5 + 0.5 * Math.sin((N / 30) * Math.PI); // 缓慢呼吸
  if (!IS_DEFAULT_THEME) {
    return (
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
        <CoverNew N={N} a={a} glow={glow} />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
      <ThemeEntrance N={N} f0={a + 11} seed={3}>
        <div style={{position: 'absolute', left: 0, top: 268, width: 1280, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26}}>
          <span style={{fontFamily: THEME.fonts.title, fontWeight: THEME.fonts.titleWeight, fontSize: fitSize(VIDEO.title.big, VIDEO.title.rest ? 620 : 1120, 118, 64, EM_WIDE, 6), color: WHITE, lineHeight: 1, letterSpacing: 6, textShadow: `0 0 ${18 + 14 * glow}px rgba(${ACCENT_RGB},${0.55 + 0.3 * glow}), 6px 6px 0 ${PURPLE}`}}>{VIDEO.title.big}</span>
          {VIDEO.title.rest ? (
            <span style={{fontFamily: THEME.fonts.titleRest, fontWeight: 900, fontSize: fitSize(VIDEO.title.rest, 520, 96, 60, 1, 2), color: WHITE, lineHeight: 1, transform: `scaleX(${SQUEEZE})`, transformOrigin: '0 100%', letterSpacing: 2, WebkitTextStroke: '1px #000', paintOrder: 'stroke fill'}}>{VIDEO.title.rest}</span>
          ) : null}
        </div>
      </ThemeEntrance>
      <div style={{position: 'absolute', inset: 0, opacity: fadeIn(N - (a + 20), 10), transform: `translateY(${slideUp(N - (a + 20), 60, 18)}px)`}}>
        <TechText cx={640} cy={446} text={VIDEO.title.en} fontSize={38} scaleX={0.82} weight={700} />
      </div>
      {/* QC v1 C1 #1：tagline 原 a+40 起淡入、满态只有 13 帧读不完 → 提前到 a+28（满态 ≈ a+38 → 出画 a+66，28 帧）；完整署名另在片尾 EndCredit 停 3 s */}
      <div style={{position: 'absolute', inset: 0, opacity: fadeIn(N - (a + 28), 10)}}>
        <CText cx={640} cy={520} size={30} weight={500} color={GREY} letterSpacing={6}>
          {VIDEO.title.tagline}
        </CText>
        <div style={{position: 'absolute', left: 520, top: 496, width: 240, height: 2, background: 'rgba(255,255,255,0.35)', transform: `scaleX(${fadeIn(N - (a + 28), 14)})`}} />
      </div>
    </div>
  );
};

// ---------- 章节卡 ----------
/** 章节卡（第 2 章起）：占据上一章末句结束+3 → 本章首句 from−9（即 tts_build 的章前空白） */
const lastSentenceBefore = (frame: number) => [...SENTENCES].reverse().find((x) => x.to < frame)!;
export const CHAPTER_CARDS: Array<{n: number; title: string; tech: string; from: number; to: number}> = CHAPTER_STARTS.slice(1).map((c, i) => {
  const first = SENTENCES.find((x) => x.chapter === c.n)!;
  const prev = lastSentenceBefore(first.from);
  return {n: c.n, title: c.title, tech: VIDEO.chapterTech[i + 1] ?? '', from: prev.to + 3, to: first.from - 9};
});
export const ChapterCard: React.FC<{card: (typeof CHAPTER_CARDS)[number]}> = ({card}) => {
  const N = useCurrentFrame() + card.from;
  const n = N - card.from;
  const exitN = N - (card.to - 11);
  const dy = -exitOut(exitN).dy;
  const op = exitOut(exitN).op;
  const w = kf(n, [[0, 0], [20, 300]], easeInOutPow(2.5));
  if (!IS_DEFAULT_THEME) {
    // 非默认主题：newtemplates.html 正文模式——左上 kicker + 标题 + 细渐变线 + 英文副标，右侧竖线数据卡（大章号）
    const ruleW = kf(n, [[0, 0], [18, 150]], easeInOutPow(2.5));
    return (
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
        <ThemeEntrance N={N} f0={card.from + 3} seed={card.n}>
          <div style={{position: 'absolute', left: 96, top: 212, fontFamily: THEME.fonts.kicker, fontSize: 18, fontWeight: 700, letterSpacing: 10, color: PURPLE, textShadow: `0 0 10px rgba(${ACCENT_RGB},.5)`}}>{`CHAPTER 0${card.n}`}</div>
          <div style={{position: 'absolute', left: 94, top: 250, fontFamily: THEME.fonts.title, fontWeight: THEME.fonts.titleWeight, fontSize: fitSize(card.title, 780, 62, 40, 1, 3), color: WHITE, lineHeight: 1.2, letterSpacing: 3, textShadow: `0 0 14px rgba(${ACCENT_RGB},.35)`, whiteSpace: 'nowrap'}}>{card.title}</div>
          <div style={{position: 'absolute', left: 98, top: 342, width: ruleW, height: 2, background: `linear-gradient(90deg, ${PURPLE}, rgba(${ACCENT_RGB},0))`}} />
          {card.tech ? <div style={{position: 'absolute', left: 98, top: 366, fontFamily: THEME.fonts.body, fontSize: 22, fontWeight: 300, color: GREY, letterSpacing: 4}}>{card.tech}</div> : null}
          <div style={{position: 'absolute', left: 990, top: 226, width: 220, borderLeft: `1px solid rgba(${ACCENT_RGB},.32)`, paddingLeft: 24}}>
            <div style={{fontFamily: FONT_ORB, fontSize: 64, fontWeight: 700, color: PURPLE, lineHeight: 1, textShadow: `0 0 18px rgba(${ACCENT_RGB},.55)`}}>{`0${card.n}`}</div>
            <div style={{fontFamily: FONT_TECH, fontStyle: 'italic', fontSize: 14, color: GREY_MID, letterSpacing: 4, marginTop: 10}}>{card.tech || 'CHAPTER'}</div>
          </div>
        </ThemeEntrance>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
      <div style={{position: 'absolute', opacity: fadeIn(n, 8)}}>
        <CText cx={640} cy={268} size={54} weight={700} family={FONT_ORB} color={PURPLE_TECH} letterSpacing={4} shadow={`0 0 14px rgba(${ACCENT_RGB},.6)`}>{`0${card.n}`}</CText>
      </div>
      <ThemeEntrance N={N} f0={card.from + 3} seed={card.n}>
        <CText cx={640} cy={372} size={fitSize(card.title, 1100, 80, 46, 1, 3)} weight={900} family={THEME.fonts.title} scaleX={SQUEEZE} letterSpacing={3} style={{WebkitTextStroke: '1px #000', paintOrder: 'stroke fill'}}>{card.title}</CText>
      </ThemeEntrance>
      <div style={{position: 'absolute', left: 640 - w / 2, top: 428, width: w, height: 3, background: WHITE, opacity: 0.85}} />
      {card.tech ? (
        <div style={{position: 'absolute', opacity: fadeIn(n - 10, 10)}}>
          <TechSub cx={640} cy={470} text={card.tech} size={26} />
        </div>
      ) : null}
    </div>
  );
};

// ---------- 顶部 HUD 胶囊 ----------
export type HudEntry = {from: number; to: number; text: string; tech?: string; w?: number};
/** HUD 条目由 config.hud 的句 id 解析；章首条目从章节卡结束的下一帧开始（fromOffset 默认：本章第一条 −8，其余 0）。 */
export const HUD: HudEntry[] = (SENTENCES.length ? VIDEO.hud : []).map((h) => {
  const a = S(h.fromS), b = S(h.toS);
  const isChapterFirst = SENTENCES.find((x) => x.chapter === a.chapter)!.id === a.id && a.chapter > 1;
  const from = a.from + (h.fromOffset ?? (isChapterFirst ? -8 : 0));
  const isChapterLast = [...SENTENCES].reverse().find((x) => x.chapter === b.chapter)!.id === b.id;
  const to = b.to + (h.toOffset ?? (isChapterLast ? 2 : 0));
  return {from, to, text: h.text, tech: h.tech, w: h.w};
});
// 同章相邻条目之间不留空档（G1 提示 742–751 无胶囊）：上一条延到下一条 from−1；跨章节卡（间隔 ≥30 帧）保持空档，由章节卡接管
for (let i = 0; i < HUD.length - 1; i++) if (HUD[i + 1].from - HUD[i].to < 30) HUD[i].to = HUD[i + 1].from - 1;
export const HUD_RANGE: [number, number] = HUD.length ? [HUD[0].from, HUD[HUD.length - 1].to] : [0, 0];
const hudW = (h: HudEntry) => h.w ?? Math.max(216, Math.round(h.text.replace(/[^一-龥]/g, '').length * 34 + h.text.replace(/[一-龥\s]/g, '').length * 20 + (h.text.match(/\s/g)?.length ?? 0) * 10 + 60));
export const Hud: React.FC = () => {
  const N = useCurrentFrame() + HUD_RANGE[0];
  const idx = HUD.findIndex((h) => N >= h.from && N <= h.to);
  if (idx < 0) return null;
  const e = HUD[idx];
  // QC v1 C3：进章节卡前 HUD 一帧消失 → 末 8 帧淡出（只对跨章节卡的条目生效：下一条 from 与本条 to 间隔 ≥30）
  const nextGap = idx < HUD.length - 1 ? HUD[idx + 1].from - e.to : 999;
  const fadeTail = nextGap >= 30 ? 1 - clampFrames(N - (e.to - 8), 8) : 1;
  const w = hudW(e);
  // 终检 v2：同章换词时旧词单帧硬切 + 胶囊从 25% 重新淡入有 1 帧空白 → 胶囊常驻、宽度 10 帧过渡，旧词 6 帧淡出、新词 SoftIn
  const prev = idx > 0 ? HUD[idx - 1] : undefined;
  const n = N - e.from;
  const sameChapter = !!prev && e.from - prev.to < 30;
  if (sameChapter && prev && n < 10) {
    const t = easeInOutPow(2.5)(clampFrames(n, 10));
    const wNow = hudW(prev) + (w - hudW(prev)) * t;
    const oldOp = 1 - clampFrames(n, 4); // 第五片 QC：旧词 4 帧淡完再进新词（新词 n≥4 起），零叠影
    const newOp = 1 - Math.pow(1 - clampFrames(n - 3, 7), 2.5);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: fadeTail}}>
        <Pill x={640 - wNow / 2} y={28} w={wNow} h={51} fill={PURPLE} sw={2} style={{filter: PILL_SHADOW}} />
        {oldOp > 0.01 ? <CText cx={640} cy={53.5} size={33} weight={700} letterSpacing={1} opacity={oldOp}>{prev.text}</CText> : null}
        <div style={{position: 'absolute', inset: 0, opacity: newOp, transform: `translateY(${((1 - newOp) * 4).toFixed(2)}px)`}}>
          <CText cx={640} cy={53.5} size={33} weight={700} letterSpacing={1}>{e.text}</CText>
          {e.tech ? <TechSub cx={640} cy={92} text={e.tech} /> : null}
        </div>
      </div>
    );
  }
  // 章首条目（章节卡之后）与过渡结束后：原 TopCapsule（SoftIn 在 n≥8 已满态，几何与上面一致，无缝）
  return <TopCapsule N={N} f0={e.from} text={e.text} w={w} tech={e.tech} opacity={fadeTail} />;
};

// ---------- 流程轨（只在 config.rails 标了轨的章出现）----------
export type RailSpec = {steps: string[]; switches: number[]; from: number; to: number};
export const RAILS: RailSpec[] = (SENTENCES.length ? VIDEO.rails : []).map((r) => ({steps: r.steps, switches: r.switchS.map((id) => S(id).from), from: S(r.fromS).from - 8, to: S(r.toS).to + 2}));
const RAIL_CX = [240, 440, 640, 840, 1040];
const RAIL_W = 150, RAIL_H = 44, RAIL_Y = 118;
export const Rail: React.FC<{spec: RailSpec}> = ({spec}) => {
  const N = useCurrentFrame() + spec.from;
  let active = -1;
  spec.switches.forEach((f, i) => { if (N >= f) active = i; });
  const railOut = 1 - clampFrames(N - (spec.to - 8), 8); // 末 8 帧淡出
  return (
    <div style={{position: 'absolute', inset: 0, opacity: railOut}}>
      {spec.steps.map((t, i) => {
        const state = i === active ? 'active' : i < active ? 'done' : 'todo';
        const pulse = i === active ? emphasisPulse(N - spec.switches[i], {peak: 1.1, up: 10, hold: 3, down: 10}) : 1;
        const fill = state === 'active' ? PURPLE : state === 'done' ? '#2A2A2A' : '#000';
        const stroke = state === 'active' ? WHITE : state === 'done' ? GREY_MID : GREY;
        const color = state === 'todo' ? GREY : WHITE;
        return (
          <React.Fragment key={t}>
            <div style={{position: 'absolute', left: RAIL_CX[i] - RAIL_W / 2, top: RAIL_Y + slideUp(N - (spec.from + i * 2), 40, 16), width: RAIL_W, height: RAIL_H, transform: `scale(${pulse})`, opacity: fadeIn(N - (spec.from + i * 2), 8)}}>
              <Pill x={0} y={0} w={RAIL_W} h={RAIL_H} fill={fill} stroke={stroke} sw={2} text={t} fontSize={24} weight={700} color={color} letterSpacing={1} textDy={-1.5} glow={state === 'active' ? GLOW_PURPLE_S : undefined} />
            </div>
            {i < spec.steps.length - 1 ? (
              <ArrowH x={RAIL_CX[i] + RAIL_W / 2 + 6} y={RAIL_Y + RAIL_H / 2 - 9} w={38} h={18} p={clampFrames(N - (spec.from + 4 + i * 2), 10)} color={i < active ? WHITE : GREY} shaft={2} />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- 片尾 ----------
// 压黑层挂在内容之上（Main 里 SHOTS_OVERLAY_TOP 排在所有内容组之后、进度条之下），从末句结束前 endingFade 帧起压黑，末镜头内容在被完全盖住后才结束；
// 最后 30 帧再用 aboveBar 层把进度条也压黑 → 末段纯黑。
const LAST_TO = SENTENCES[SENTENCES.length - 1]?.to ?? TOTAL_FRAMES - 60;
export const ENDING_RANGE: [number, number] = [LAST_TO - VIDEO.endingFade, TOTAL_FRAMES];
export const Ending: React.FC = () => {
  const N = useCurrentFrame() + ENDING_RANGE[0];
  const n = N - ENDING_RANGE[0];
  const op = fadeIn(n, VIDEO.endingFade);
  return <div style={{position: 'absolute', inset: 0, background: '#000', opacity: op}} />;
};
/** 片尾署名（压黑之后、进度条压黑之前）：完整书名 / 作者 / 出版社，停 ≈3 s，让片头 tagline 读不完的信息在这里补齐（QC v1 C1 #1） */
export const END_CREDIT_RANGE: [number, number] = [LAST_TO + 1, TOTAL_FRAMES - 26];  // 9110–9182：末句字幕 9109 结束、内容已全黑后再出署名卡（满态 ≈56 帧）；之后 26 帧纯黑
export const EndCredit: React.FC = () => {
  const N = useCurrentFrame() + END_CREDIT_RANGE[0];
  const n = N - END_CREDIT_RANGE[0];
  const len = END_CREDIT_RANGE[1] - END_CREDIT_RANGE[0];
  const op = Math.min(fadeIn(n, 8), 1 - clampFrames(N - (END_CREDIT_RANGE[1] - 8), 8));
  const c = VIDEO.credit;
  const by = VIDEO.builtBy;
  if (!c && !by) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      {c ? (
        <>
          <CText cx={640} cy={300} size={26} weight={500} color={GREY} letterSpacing={4}>{c.kicker}</CText>
          <CText cx={640} cy={352} size={40} weight={700} family={THEME.fonts.titleRest} color={WHITE}>{c.title}</CText>
          <CText cx={640} cy={404} size={26} weight={500} color={GREY}>{c.byline}</CText>
          <div style={{position: 'absolute', left: 560, top: 440, width: 160, height: 2, background: 'rgba(255,255,255,0.35)', transform: `scaleX(${fadeIn(n - 6, 16)})`}} />
          <CText cx={640} cy={476} size={22} weight={500} color={GREY}>{c.note}</CText>
        </>
      ) : null}
      {/* 片尾署名行（config.builtBy，默认开）：有署名卡时排在卡下方，没有卡时单独居中 */}
      {by ? <CText cx={640} cy={c ? 524 : 384} size={22} weight={500} color={GREY_MID} letterSpacing={2}>{by}</CText> : null}
    </div>
  );
};
// QC v1 C4 #2：进度条不能在画面全黑后孤悬 2 s → 进度条随 endingFade 一起压黑（aboveBar 层），署名卡在其上（见 index.ts 层序）
export const ENDING_TOP_RANGE: [number, number] = [LAST_TO - VIDEO.endingFade, TOTAL_FRAMES];
export const EndingTop: React.FC = () => {
  const N = useCurrentFrame() + ENDING_TOP_RANGE[0];
  const op = fadeIn(N - ENDING_TOP_RANGE[0], VIDEO.endingFade);
  return <div style={{position: 'absolute', inset: 0, background: '#000', opacity: op}} />;
};
