// Telegram Mini App (TMA) SDK Integration
// Provides seamless native-feeling integration when running inside Telegram.

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface TelegramWebAppType {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  requestFullscreen?(): void;
  onEvent?(eventType: string, eventHandler: () => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppType;
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp && !!window.Telegram.WebApp.initData;
}

export function getTelegramWebApp(): TelegramWebAppType | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.Telegram?.WebApp;
}

export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen();
    }
    tg.setHeaderColor('#120824');
    tg.setBackgroundColor('#0e061c');
    tg.enableClosingConfirmation();

    const updateHeight = () => {
      const h = tg.viewportHeight || window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${h}px`);
    };
    updateHeight();
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('viewportChanged', updateHeight);
    }
    window.addEventListener('resize', updateHeight);
  } catch (err) {
    console.warn('Telegram WebApp init warning:', err);
  }
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  const u = tg?.initDataUnsafe?.user;
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    username: u.username,
    photoUrl: u.photo_url,
  };
}

export function getTelegramStartParam(): string | null {
  const tg = getTelegramWebApp();
  // 1. Check native Telegram start_param
  if (tg?.initDataUnsafe?.start_param) {
    return tg.initDataUnsafe.start_param.replace(/^room_/, '');
  }
  // 2. Check query params passed by Telegram or URL (?tgWebAppStartParam=... or ?room=...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('tgWebAppStartParam') || params.get('startapp') || params.get('room');
    if (startParam) {
      return startParam.replace(/^room_/, '');
    }
  }
  return null;
}

export const tgHaptic = {
  light() {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('light');
  },
  medium() {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium');
  },
  heavy() {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy');
  },
  success() {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success');
  },
  warning() {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning');
  },
  error() {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error');
  },
  selection() {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged();
  },
};

export function shareTelegramRoom(code: string, botUsername = 'Crazyracoons_bot'): void {
  const tg = getTelegramWebApp();
  const text = `Гайда грати в «Скажені Єноти: Нічний Дожор» зі мною! 🦝🧨 Кімната: ${code}`;
  const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?startapp=room_${code}&text=${encodeURIComponent(text)}`;
  
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else if (typeof window !== 'undefined') {
    window.open(shareUrl, '_blank');
  }
}
