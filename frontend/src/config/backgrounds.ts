export const DEFAULT_CYMRAEG_TEXT_X_OFFSET = 75;
export const DEFAULT_CYMRAEG_TEXT_Y_OFFSET = 50;
export const DEFAULT_TEXT_FILL = '#ffffff';
export const DEFAULT_TEXT_ALIGN = 'left';
export const DEFAULT_FONT_FAMILY = 'Sans-serif';
export const DEFAULT_NAME_FONT_SIZE = 90;
export const DEFAULT_TITLE_FONT_SIZE = 50;
export const DEFAULT_CYMRAEG_FONT_SIZE = 45;

export interface LogoConfig {
  x: number;
  y: number;
  width: number;
  textXOffset: number;
  textYOffset: number;
  font: string;
  fontSize: number;
  fill: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface Placeholder {
  id: string;
  x: number;
  y: number;
  width: number;
  font: string;
  fontSize: number;
  fill: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface BackgroundImage {
  id: string;
  name: string;
  src: string;
  placeholders: Placeholder[];
  logoConfig?: LogoConfig;
  originalWidth?: number;
  originalHeight?: number;
}

// Helper to create standard placeholders
const createPlaceholders = (
  nameX: number,
  nameY: number,
  titleX: number,
  titleY: number,
  overrides: Partial<Placeholder> = {}
): Placeholder[] => [
  {
    id: 'name',
    x: nameX,
    y: nameY,
    width: 1800, // Default width, can be overridden
    font: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_NAME_FONT_SIZE,
    fill: DEFAULT_TEXT_FILL,
    textAlign: DEFAULT_TEXT_ALIGN,
    ...overrides,
  },
  {
    id: 'title',
    x: titleX,
    y: titleY,
    width: 1800,
    font: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_TITLE_FONT_SIZE,
    fill: DEFAULT_TEXT_FILL,
    textAlign: DEFAULT_TEXT_ALIGN,
    ...overrides,
  },
];

// Helper to create logo config
const createLogoConfig = (
  x: number,
  y: number,
  overrides: Partial<LogoConfig> = {}
): LogoConfig => ({
  x,
  y,
  width: 200,
  textXOffset: DEFAULT_CYMRAEG_TEXT_X_OFFSET,
  textYOffset: DEFAULT_CYMRAEG_TEXT_Y_OFFSET,
  font: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_CYMRAEG_FONT_SIZE,
  fill: DEFAULT_TEXT_FILL,
  textAlign: DEFAULT_TEXT_ALIGN,
  ...overrides,
});

export const backgrounds: BackgroundImage[] = [
  {
    id: '1',
    name: 'Normal Dark 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Dark.png',
    placeholders: createPlaceholders(744, 430, 744, 585),
    logoConfig: createLogoConfig(3200, 1650),
  },
  {
    id: '2',
    name: 'Normal Light 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Light.png',
    placeholders: createPlaceholders(744, 430, 744, 585, { fill: '#325083' }),
    logoConfig: createLogoConfig(3200, 1650, { fill: '#325083' }),
  },
  {
    id: '3',
    name: 'Pride 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Pride.png',
    placeholders: createPlaceholders(1050, 430, 1050, 585, { font: 'Arial', width: 2000 }),
    logoConfig: createLogoConfig(3200, 1650),
  },
  {
    id: '4',
    name: 'Values 2025',
    src: '/images/backgrounds/DHCWTeamsBackground-2025-Values.png',
    placeholders: createPlaceholders(870, 180, 870, 300, { width: 2000 }),
    logoConfig: createLogoConfig(150, 800),
  },
  {
    id: '5',
    name: 'Christmas 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Christmas.png',
    placeholders: createPlaceholders(744, 160, 744, 300, { width: 2000 }),
    logoConfig: createLogoConfig(3200, 1650),
  },
  {
    id: '6',
    name: 'Christmas 2025',
    src: '/images/backgrounds/DHCWTeamsBackground-2025-Christmas.png',
    placeholders: createPlaceholders(3000, 1180, 3000, 1300, { width: 900 }),
    logoConfig: createLogoConfig(3200, 1450),
  },
];
