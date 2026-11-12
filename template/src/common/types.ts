import React from 'react';
import type {StarVariant, StarFieldProps} from './StarField';
import type {BackdropId} from '../themes/types';
/** 镜头定义：from/to 为原片帧号（1 起，含端点），Main 用 <Sequence from={from-1} durationInFrames={to-from+1}> 挂载。 */
/** layer:'aboveBar' → Main 把该镜头挂在进度条之上、字幕之下（原片部分镜头的内容层压在半透明进度条之上，如 SC019.p1-b 自 y720 升起的元素；默认在进度条之下被条体提亮）。 */
export type ShotDef = {id: string; from: number; to: number; Comp: React.FC; layer?: 'aboveBar'};
/** 背景常驻层覆写（按原片帧区间）：stars 选星点 variant 或细调参数（'none' 关掉），fog 关/开雾底。未覆写区间用全局默认（drift + 雾底开）。
 *  intensity：幕底退让系数 0–1（仅新主题幕底 nobel/book/ai/stem 消费）——1 不退让，0.4 ≈ HTML 预览正文模式的压暗+减速。 */
export type BgSpec = {from: number; to: number; stars?: StarVariant | Partial<StarFieldProps>; fog?: boolean; intensity?: number};
/** 幕底 id（来自主题系统 types；common 层各幕底组件共用） */
export type {BackdropId};
