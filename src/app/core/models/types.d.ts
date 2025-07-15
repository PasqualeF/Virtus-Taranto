// Dichiarazioni per Google Analytics 4
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Tipi per gtag
interface GtagConfig {
  anonymize_ip?: boolean;
  cookie_flags?: string;
  allow_google_signals?: boolean;
  allow_ad_personalization_signals?: boolean;
  cookie_domain?: string;
  cookie_expires?: number;
  send_page_view?: boolean;
  user_id?: string;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  page_title?: string;
  page_location?: string;
  page_path?: string;
  [key: string]: any;
}

declare function gtag(
  command: 'config',
  targetId: string,
  config?: GtagConfig
): void;

declare function gtag(
  command: 'event',
  eventName: string,
  eventParams?: GtagEventParams
): void;

declare function gtag(
  command: 'js',
  date: Date
): void;

export {};