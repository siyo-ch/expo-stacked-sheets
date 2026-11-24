import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import type { ResolvedSheetColorScheme, SheetColorScheme } from './types';

export type SheetTheme = {
  colorScheme: ResolvedSheetColorScheme;
  stage: string;
  background: string;
  surface: string;
  border: string;
  editorBorder: string;
  ink: string;
  body: string;
  previewBody: string;
  muted: string;
  handle: string;
  pressed: string;
  pill: string;
  danger: string;
  dimOpacity: number;
  shadowOpacity: number;
  depthShade: string;
};

export const LIGHT_THEME: SheetTheme = {
  colorScheme: 'light',
  stage: '#000',
  background: '#FFF',
  surface: '#FFF',
  border: 'rgba(0,0,0,0.1)',
  editorBorder: 'rgba(0,0,0,0.08)',
  ink: '#111',
  body: '#333',
  previewBody: '#555',
  muted: '#B0B0B5',
  handle: '#E0E0E0',
  pressed: '#F2F2F2',
  pill: '#F2F2F2',
  danger: '#A62828',
  dimOpacity: 0.06,
  shadowOpacity: 0.08,
  depthShade: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.06) 100%)',
};

export const DARK_THEME: SheetTheme = {
  colorScheme: 'dark',
  stage: '#000',
  background: '#141416',
  surface: '#1C1C1E',
  border: 'rgba(255,255,255,0.13)',
  editorBorder: 'rgba(255,255,255,0.12)',
  ink: '#F5F5F7',
  body: '#D1D1D6',
  previewBody: '#A1A1A6',
  muted: '#76767A',
  handle: 'rgba(255,255,255,0.24)',
  pressed: '#2C2C2E',
  pill: '#2C2C2E',
  danger: '#FF6961',
  dimOpacity: 0.32,
  shadowOpacity: 0.42,
  depthShade: 'linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.42) 100%)',
};

export function resolveSheetColorScheme(
  preference: SheetColorScheme | undefined,
  system: ColorSchemeName | null,
): ResolvedSheetColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

const ThemeContext = createContext<SheetTheme>(LIGHT_THEME);

export function SheetThemeProvider({
  colorScheme,
  children,
}: {
  colorScheme?: SheetColorScheme;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const resolved = resolveSheetColorScheme(colorScheme, system);
  const theme = resolved === 'dark' ? DARK_THEME : LIGHT_THEME;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useSheetTheme() {
  return useContext(ThemeContext);
}
