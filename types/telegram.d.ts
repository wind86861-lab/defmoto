interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  auth_date: number;
  hash: string;
}

interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface TelegramBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramWebAppThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  HapticFeedback: TelegramHapticFeedback;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: string; text?: string }>;
  }) => Promise<string>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  requestContact: (cb: (shared: boolean) => void) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  shareUrl?: (url: string, text?: string) => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
