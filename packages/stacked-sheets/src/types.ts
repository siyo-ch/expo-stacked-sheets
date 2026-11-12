import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type SheetImage = { source: ImageSourcePropType; label: string };

export type SheetContent = {
  title?: string;
  body?: string;
  image?: SheetImage;
};

export type Sheet = {
  id: string;
  title: string;
  body: string;
  image?: SheetImage;
};

export type InitialSheet = SheetContent & { id?: string };

export type SheetOrigin = { x: number; y: number; width: number; height: number };
export type SheetMode = 'inbox' | 'compose' | 'overview';
export type SheetIcon = 'sheet' | 'expand' | 'minimize' | 'close';

export type SheetBackgroundProps = {
  active: boolean;
  openSheet: (content?: SheetContent, origin?: SheetOrigin) => void;
};

export type SheetEditorProps = {
  sheet: Sheet;
  update: (changes: Partial<SheetContent>) => void;
  ready: boolean;
};

export type StackedSheetsProps = {
  initialSheets?: readonly InitialSheet[];
  renderBackground: (props: SheetBackgroundProps) => ReactNode;
  renderPreview?: (sheet: Sheet) => ReactNode;
  renderEditor?: (props: SheetEditorProps) => ReactNode;
  onSaveSheet?: (sheet: Sheet) => boolean;
  renderIcon?: (name: SheetIcon, size: number) => ReactNode;
  renderStatusBar?: (mode: SheetMode) => ReactNode;
  emptyTitle?: string;
};

export type SheetStackParamList = {
  Inbox: undefined;
  Compose: { draftId: string };
};
