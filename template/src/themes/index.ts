/** 主题注册表与查询。token 值唯一来源：tokens.json（Python QC 工具直接读同一文件，保证渲前渲后判色一致）。
 *  用法：`import {getTheme} from './themes'`；`config.ts` 的 `VIDEO.theme` 决定激活主题。
 *  约束：purple-dots 的 token 值与历史硬编码值逐字节一致——默认主题下所有存量项目零变化。 */
import tokensJson from './tokens.json';
import type {ThemeDef, ThemeName, BackdropId} from './types';

export type {ThemeDef, ThemeName, BackdropId, EntranceStyle, FontFileSpec} from './types';

export const THEME_NAMES = Object.keys(tokensJson) as ThemeName[];

const REGISTRY = tokensJson as unknown as Record<ThemeName, ThemeDef>;

export const THEMES: Record<ThemeName, ThemeDef> = REGISTRY;

export const isThemeName = (v: string): v is ThemeName => v in REGISTRY;

/** 取主题定义；未知名回退 purple-dots（并在控制台告警，渲前会被 check_glyphs/selfcheck 提示） */
export const getTheme = (name: string | undefined): ThemeDef => {
  if (name && isThemeName(name)) return REGISTRY[name];
  if (name) console.warn(`[themes] 未知主题 "${name}"，回退 purple-dots`);
  return REGISTRY['purple-dots'];
};

/** 按主题列出需要 FontFace 注册的字体文件（lib.tsx 的 Fonts 组件用） */
export const fontFilesFor = (name: string | undefined): ThemeDef['fontFiles'] => getTheme(name).fontFiles;

/** 主题建议的幕底（config.bg 未设置或设为 'auto' 时用；显式 bg 优先） */
export const suggestedBg = (name: string | undefined): BackdropId => getTheme(name).suggestedBg;
