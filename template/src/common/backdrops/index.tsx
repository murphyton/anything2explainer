/** 主题配套幕底 ×4（nobel / book / ai / stem）：newtemplates.html 的 canvas draw 函数移植版。
 *  - 与 DotFieldBg 同款接线：canvas + useCurrentFrame，逐帧确定性（随机一律 rnd 种子，禁 Math.random）；
 *  - HTML 的 Math.random() 初始化改为 rnd(i,salt) 闭式参数；粒子生命周期改周期调制（跨 worker 帧序无关）；
 *  - 「正文退让」：BgSpec.intensity（0–1，默认 1）按帧区间生效——>0 时压暗/减速背景动画，
 *    与 HTML 预览的 content 模式（α×0.4、速×0.35）同源；
 *  - BgSpec.stars==='none' 的区间整层不画（与点阵波/星点方案一致）。
 *  幕底是屏幕空间纹理，不跟镜头运镜；frame_metrics.py 按 tokens.json 同源 token 抠底统计。 */
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {BgSpec} from '../types';
import {rnd} from '../easing';

const W = 1280, H = 720;

/** 当前帧生效的 BgSpec；返回退让系数（默认 1），stars==='none' 时返回 -1（整层关） */
const specOf = (specs: BgSpec[], n: number): number => {
  let k = 1;
  let off = false;
  for (const s of specs) {
    if (n >= s.from && n <= s.to) {
      if (s.stars === 'none') off = true;
      if (s.intensity !== undefined) k = s.intensity;
    }
  }
  return off ? -1 : k;
};

/** 预渲染辉光 sprite（radial gradient，中心实→边缘透明） */
const glowSprite = (r: number, g: number, b: number, size = 64): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d')!;
  const grd = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grd.addColorStop(0.2, `rgba(${r},${g},${b},0.65)`);
  grd.addColorStop(0.5, `rgba(${r},${g},${b},0.16)`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grd;
  x.fillRect(0, 0, size, size);
  return c;
};

/** 画布组件骨架：每帧重绘（确定性纯函数） */
const FrameCanvas: React.FC<{draw: (ctx: CanvasRenderingContext2D, t: number, retreat: number) => void; t: number; retreat: number}> = ({draw, t, retreat}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    draw(ctx, t, retreat);
  }, [t, retreat, draw]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
};

const Vignette: React.FC<{k?: number}> = ({k = 0.55}) => (
  <div
    style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse ${W * 0.56}px ${H * 0.62}px at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,${k}) 100%)`,
    }}
  />
);

/** 幕底通用壳：BgSpec 消费 + 退让系数 + 底色 */
const BackdropShell: React.FC<{specs: BgSpec[]; base: string; draw: (ctx: CanvasRenderingContext2D, t: number, retreat: number) => void; speed?: number; overlay?: React.ReactNode}> = ({specs, base, draw, speed = 1, overlay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const N = frame + 1;
  const retreat = specOf(specs, N);
  if (retreat < 0) return null;
  const t = (frame / fps) * speed;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: base}}>
      <FrameCanvas draw={draw} t={t} retreat={retreat} />
      {overlay}
      <Vignette />
    </div>
  );
};

/* ---------- nobel：深蓝夜空 × 金尘椭圆轨道 ---------- */
const GOLD = glowSprite(232, 184, 75);
const NOBEL_STARS = Array.from({length: 130}, (_, i) => ({
  a: rnd(i, 1) * Math.PI * 2,
  r: Math.pow(rnd(i, 2), 0.75),
  sp: (0.01 + rnd(i, 3) * 0.028) * (rnd(i, 4) < 0.3 ? -1 : 1),
  size: 0.45 + rnd(i, 5) * 1.5,
  tw: rnd(i, 6) * Math.PI * 2,
  tws: 0.3 + rnd(i, 7) * 1.4,
  base: 0.16 + rnd(i, 8) * 0.55,
}));

export const NobelBg: React.FC<{specs: BgSpec[]}> = ({specs}) => {
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, t: number, k: number) => {
    const C = k < 0.99; // 退让 = HTML 的 content 模式（常数严格对齐设计稿）
    const spd = C ? 0.35 : 1;
    const ak = C ? 0.4 : 1;
    const cx = W * 0.5, cy = H * 0.46;
    const g = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, Math.max(W, H) * 0.85);
    g.addColorStop(0, '#13223c');
    g.addColorStop(0.52, '#0c1526');
    g.addColorStop(1, '#070c17');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.62);
    gl.addColorStop(0, `rgba(232,184,75,${0.11 * ak})`);
    gl.addColorStop(0.55, `rgba(232,184,75,${0.035 * ak})`);
    gl.addColorStop(1, 'rgba(232,184,75,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const R = Math.hypot(W, H) * 0.62;
    for (const s of NOBEL_STARS) {
      const a = s.a + s.sp * t * spd;
      const x = cx + Math.cos(a) * s.r * R;
      const y = cy + Math.sin(a) * s.r * R * 0.6;
      const tw = 0.45 + 0.55 * Math.sin(t * s.tws + s.tw);
      const d = s.size * (1 + 0.35 * tw) * 9;
      ctx.globalAlpha = Math.max(0, s.base * tw * ak);
      ctx.drawImage(GOLD, x - d / 2, y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, []);
  return <BackdropShell specs={specs} base="#0c1526" draw={draw} />;
};

/* ---------- book：暖棕黑 × 纸纹 × 琥珀光斑 ---------- */
const BOOK_BLOBS = [
  {x: 0.24, y: 0.34, ax: 0.06, ay: 0.04, r: 0.46, a: 0.14, sp: 0.11, p0: rnd(1, 11)},
  {x: 0.73, y: 0.62, ax: 0.05, ay: 0.06, r: 0.5, a: 0.11, sp: 0.08, p0: rnd(2, 11)},
  {x: 0.56, y: 0.18, ax: 0.08, ay: 0.03, r: 0.34, a: 0.1, sp: 0.15, p0: rnd(3, 11)},
  {x: 0.14, y: 0.82, ax: 0.04, ay: 0.05, r: 0.3, a: 0.09, sp: 0.1, p0: rnd(4, 11)},
];
/** 纸纤维纹理：暖色噪点 + 琥珀短线（确定性 rnd；模块级生成一次） */
const bookNoise = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const img = x.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < W * H; i++) {
    const v = rnd(i, 21);
    d[i * 4] = 24 + v * 26;
    d[i * 4 + 1] = 18 + v * 20;
    d[i * 4 + 2] = 13 + v * 15;
    d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  x.globalCompositeOperation = 'lighter';
  const lines = Math.round((W * H) / 2400);
  for (let i = 0; i < lines; i++) {
    const px = rnd(i, 22) * W, py = rnd(i, 23) * H;
    const len = 10 + rnd(i, 24) * 46;
    const ang = rnd(i, 25) * Math.PI;
    x.strokeStyle = `rgba(224,154,62,${(0.015 + rnd(i, 26) * 0.045).toFixed(3)})`;
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    x.stroke();
  }
  return c;
};
let BOOK_NOISE: HTMLCanvasElement | null = null;

export const BookBg: React.FC<{specs: BgSpec[]}> = ({specs}) => {
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, t: number, k: number) => {
    const C = k < 0.99;
    if (!BOOK_NOISE) BOOK_NOISE = bookNoise();
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = C ? 0.44 : 0.62;
    ctx.drawImage(BOOK_NOISE, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    for (const b of BOOK_BLOBS) {
      const p = b.p0 + t * b.sp * (C ? 0.3 : 1);
      const x = (b.x + Math.sin(p) * b.ax) * W;
      const y = (b.y + Math.cos(p * 0.83) * b.ay) * H;
      const r = b.r * Math.min(W, H);
      const a = b.a * (C ? 0.4 : 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(224,154,62,${a})`);
      g.addColorStop(0.45, `rgba(224,154,62,${a * 0.35})`);
      g.addColorStop(1, 'rgba(224,154,62,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }, []);
  return <BackdropShell specs={specs} base="#1a1410" draw={draw} />;
};

/* ---------- ai：冷黑蓝 × 电青粒子流 × CRT 扫描线 ---------- */
const CYAN = glowSprite(0, 212, 200);
/** 闭式粒子：位置/速度/生命周期全由 rnd(i) 决定，相位 = (t+offset) mod maxLife → 跨 worker 确定性。
 *  可见度对齐 HTML 预览：85 条、α .12–.55、尾迹 ≤135px、光斑 13px——视频压缩后仍清晰可辨。 */
const AI_PARTS = Array.from({length: 85}, (_, i) => ({
  x0: 0.06 + rnd(i, 31) * 0.88,
  y0: rnd(i, 32),
  vx: (rnd(i, 33) < 0.22 ? -1 : 1) * (0.08 + rnd(i, 34) * 0.38),
  vy: (rnd(i, 35) - 0.5) * 0.05,
  len: 0.5 + rnd(i, 36) * 1.8,
  w: 0.8 + rnd(i, 37) * 1.4,
  a: 0.12 + rnd(i, 38) * 0.43,
  maxLife: 3 + rnd(i, 39) * 4,
  off: rnd(i, 40) * 7,
}));

export const AiBg: React.FC<{specs: BgSpec[]}> = ({specs}) => {
  const frame = useCurrentFrame();
  const draw = React.useCallback(
    (ctx: CanvasRenderingContext2D, t: number, k: number) => {
      const C = k < 0.99;
      const spd = C ? 0.4 : 1;
      const ak = C ? 0.55 : 1;
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#080b10');
      g.addColorStop(0.5, '#0a0e14');
      g.addColorStop(1, '#060910');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of AI_PARTS) {
        const phase = (t + p.off) % p.maxLife;
        const fadeIn = Math.min(1, phase / 0.55);
        const fadeOut = Math.min(1, (p.maxLife - phase) / 0.8);
        // 位置：线性漂移 + 周期回绕（1.4 幅面，边缘 6% 淡出）
        const rawX = (p.x0 + p.vx * phase * spd + 1.4) % 1.4 - 0.2;
        const rawY = (p.y0 + p.vy * phase * spd + 1.1) % 1.1;
        let edge = 1;
        if (rawX < 0.06) edge = Math.max(0, rawX / 0.06);
        else if (rawX > 0.94) edge = Math.max(0, (1 - rawX) / 0.06);
        const a = p.a * ak * Math.min(fadeIn, fadeOut) * edge;
        if (a <= 0.004) continue;
        const x = rawX * W, y = rawY * H;
        const len = p.len * W * 0.046;
        const dir = p.vx >= 0 ? -1 : 1;
        const lg = ctx.createLinearGradient(x + dir * len, y, x, y);
        lg.addColorStop(0, 'rgba(0,212,200,0)');
        lg.addColorStop(1, `rgba(0,212,200,${a * 0.9})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = p.w;
        ctx.beginPath();
        ctx.moveTo(x + dir * len, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = a * 0.9;
        ctx.drawImage(CYAN, x - 6.5, y - 6.5, 13, 13);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    [frame],
  );
  // CRT 扫描线 + 偶发 glitch 抖动（确定性节拍：每 165±rnd 帧 5 帧微抖）
  const glitchAt = Math.floor(frame / 165);
  const inGlitch = frame % 165 < 5 && rnd(glitchAt, 51) < 0.6;
  const jx = inGlitch ? (rnd(frame, 52) - 0.5) * 3.2 : 0;
  const overlay = (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, transparent 0 3px, rgba(0,212,200,0.06) 3px 4px)', pointerEvents: 'none'}} />
      <Vignette k={0.58} />
    </>
  );
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', transform: `translateX(${jx}px)`}}>
      <BackdropShell specs={specs} base="#0a0e14" draw={draw} overlay={overlay} />
    </div>
  );
};

/* ---------- stem：墨绿黑板 × 粉笔尘 × 细网格 ---------- */
const STEM_DUST = Array.from({length: 90}, (_, i) => ({
  x0: rnd(i, 61),
  y0: rnd(i, 62),
  v: 0.006 + rnd(i, 63) * 0.02,
  r: 0.5 + rnd(i, 64) * 1.3,
  a: 0.08 + rnd(i, 65) * 0.28,
  w: 0.5 + rnd(i, 66) * 1.5,
  ph: rnd(i, 67) * 6.28,
}));

export const StemBg: React.FC<{specs: BgSpec[]}> = ({specs}) => {
  const frame = useCurrentFrame();
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, t: number, k: number) => {
    const C = k < 0.99; // 退让 = HTML content 模式（二值切换，常数严格对齐设计稿）
    const g = ctx.createRadialGradient(W * 0.48, H * 0.38, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    g.addColorStop(0, '#173026');
    g.addColorStop(0.6, '#12241c');
    g.addColorStop(1, '#0c1a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const d of STEM_DUST) {
      // HTML：content 尘速 ×0.40、亮度 ×0.45
      const y = ((d.y0 - (d.v * t * (C ? 0.4 : 1)) % 1.08) % 1.08 + 1.08) % 1.08 * 1 - 0.04;
      const x = d.x0 * W + Math.sin(t * d.w + d.ph) * 9;
      ctx.globalAlpha = d.a * (0.55 + 0.45 * Math.sin(t * 1.7 + d.ph)) * (C ? 0.45 : 1);
      ctx.fillStyle = 'rgba(245,215,110,0.85)';
      ctx.beginPath();
      ctx.arc(x, y * H, d.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!C) {
      // 封面模式：网格逐条生长（HTML cover——竖线错峰 0.42 帧、横线 0.6 帧，各 16.5 帧画完；层出现后 ≈1.5s 长满）
      const step = Math.max(44, W / 26);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245,215,110,0.085)';
      ctx.beginPath();
      let i = 0;
      for (let x = 0; x <= W + 0.5; x += step, i++) {
        const p = Math.min(1, Math.max(0, (frame - 3 - i * 0.42) / 16.5));
        if (p <= 0) continue;
        const px = Math.round(x) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, H * p);
      }
      i = 0;
      for (let y = 0; y <= H + 0.5; y += step, i++) {
        const p = Math.min(1, Math.max(0, (frame - 3 - i * 0.6) / 16.5));
        if (p <= 0) continue;
        const py = Math.round(y) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(W * p, py);
      }
      ctx.stroke();
    } else {
      // 正文模式：网格隐去，换 26px 极淡横纹（HTML content）
      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = '#F5D76E';
      for (let y = 0; y < H; y += 26) ctx.fillRect(0, y, W, 1);
      ctx.restore();
    }
  }, [frame]);
  return <BackdropShell specs={specs} base="#12241c" draw={draw} />;
};
