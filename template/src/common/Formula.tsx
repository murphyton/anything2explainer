/** 公式图元：KaTeX（SIL OFL，字体随 npm 包分发）渲染 + 帧驱动揭示动画。
 *  - reveal 'clip'：从左向右写出（stem 主题板书感 / 通用 draw-on）；'fade'：整体淡入。
 *  - 颜色走 currentColor（KaTeX 全部字形继承），传 accent 则用主题重点色；
 *  - 数学斜体/生僻符号由 KaTeX 自带字体渲染；散字符兜底链 = 'STIX Two Math'（主题 fontFiles 已登记）→ Noto。
 *  - 字号：KaTeX 以 1.21em 基准缩放，size 即视觉主字号（近似）。
 *  用法：`<Formula N={N} f0={T} tex={String.raw`E = mc^2`} cx={640} cy={300} size={64} color={PURPLE} />` */
import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {clamp01} from './easing';

export const katexHtml = (tex: string, display = false): string =>
  katex.renderToString(tex, {displayMode: display, throwOnError: false, output: 'html', strict: false});

export const Formula: React.FC<{
  tex: string;
  N: number;
  f0: number;
  /** 揭示时长（帧） */
  len?: number;
  mode?: 'clip' | 'fade';
  /** 画布中心定位（与 CText 同风格） */
  cx?: number;
  cy?: number;
  /** 左上角定位（与 abs 同风格）；给 x/y 时忽略 cx/cy */
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  display?: boolean;
  /** 揭示进度覆盖（0–1；默认按 N-f0/len 计算） */
  p?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({tex, N, f0, len = 30, mode = 'clip', cx, cy, x, y, size = 56, color, display = false, p, opacity = 1, style}) => {
  const n = N - f0;
  if (n < 0) return null;
  const prog = clamp01(p ?? (n / len));
  const html = katexHtml(tex, display);
  const pos: React.CSSProperties =
    x !== undefined && y !== undefined
      ? {position: 'absolute', left: x, top: y}
      : {
          position: 'absolute', left: (cx ?? 640), top: (cy ?? 360),
          transform: 'translate(-50%,-50%)',
        };
  return (
    <div
      style={{
        ...pos,
        fontSize: size / 1.21,
        color: color ?? 'currentColor',
        whiteSpace: 'nowrap',
        opacity: opacity * (mode === 'fade' ? prog : Math.min(1, prog * 4)),
        ...(mode === 'clip' ? {clipPath: `inset(-8% ${((1 - prog) * 100).toFixed(2)}% -8% 0)`} : null),
        ...style,
      }}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
};
