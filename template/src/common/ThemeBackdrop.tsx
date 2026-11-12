/** 主题幕底分发：config.bg 决定用哪种幕底（'auto' = 主题建议值）。
 *  dots/stars 走原有组件（行为不变）；nobel/book/ai/stem 为主题配套幕底（common/backdrops/）。
 *  BG_Gn 的每镜头幕底覆写（stars:'none' 等）由各组件内部消费，分发层只透传 specs。 */
import React from 'react';
import type {BackdropId, BgSpec} from './types';
import {DotFieldBg} from './DotFieldBg';
import {BgTrack} from './StarField';
import {NobelBg, BookBg, AiBg, StemBg} from './backdrops';
import {getTheme} from '../themes';
import {VIDEO} from '../config';

export const resolveBackdropId = (id: BackdropId | 'auto'): BackdropId => (id === 'auto' ? getTheme(VIDEO.theme).suggestedBg : id);

export const ThemeBackdrop: React.FC<{id: BackdropId | 'auto'; specs: BgSpec[]}> = ({id, specs}) => {
  const resolved = resolveBackdropId(id);
  if (resolved === 'dots') return <DotFieldBg specs={specs} />;
  if (resolved === 'stars') return <BgTrack specs={specs} />;
  if (resolved === 'nobel') return <NobelBg specs={specs} />;
  if (resolved === 'book') return <BookBg specs={specs} />;
  if (resolved === 'ai') return <AiBg specs={specs} />;
  return <StemBg specs={specs} />;
};
