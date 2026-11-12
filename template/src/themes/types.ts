/** 主题系统类型定义。token 值的唯一来源是同目录 tokens.json（Python QC 工具也读它）。 */

export type ThemeName = 'purple-dots' | 'nobel' | 'book' | 'ai' | 'stem';

/** 幕底 id：dots/stars 是原有两种；nobel/book/ai/stem 是各主题的配套幕底（common/ThemeBackdrop.tsx 分发）。 */
export type BackdropId = 'dots' | 'stars' | 'nobel' | 'book' | 'ai' | 'stem';

/** 片头大字入场签名（overlay 按它选动画；镜头级白名单不受影响） */
export type EntranceStyle = 'glitch' | 'ink' | 'page' | 'chalk';

export type FontFileSpec = {
  /** FontFace 注册的 family 名 */
  family: string;
  /** 相对 public/fonts/ 的文件名 */
  file: string;
  /** FontFace weight（可变字体写区间，如 '100 900'） */
  weight: string;
  style?: string;
};

export type ThemePalette = {
  /** 主重点色（原 PURPLE） */
  accent: string;
  accentLight: string;
  accentTech: string;
  accentDeep: string;
  accentPale: string;
  /** 主重点色 RGB 三元组（glow/阴影 rgba 组装用），如 '102,45,248' */
  accentRgb: string;
  accentLightRgb: string;
  /** 进度条已播段填充 rgb */
  progressFillRgb: string;
  /** 语义色（各主题默认共用；需要差异化时在此覆盖） */
  warn: string;
  coral: string;
  danger: string;
  success: string;
  grey: string;
  greyMid: string;
  greyLine: string;
  greyLight: string;
};

export type ThemeFonts = {
  /** 片头/章节卡大标题字族 */
  title: string;
  /** 大标题中文部分（与 title 分开时用；一般同 title） */
  titleRest: string;
  /** kicker / 英文小标 */
  kicker: string;
  body: string;
  mono: string;
  titleWeight: number;
};

export type ThemeParams = {
  entrance: EntranceStyle;
};

export type ThemeDef = {
  label: string;
  suggestedBg: BackdropId;
  palette: ThemePalette;
  fonts: ThemeFonts;
  fontFiles: FontFileSpec[];
  params: ThemeParams;
};
