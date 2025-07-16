// src/app/core/config/librebooking.config.ts

export interface LibreBookingConfig {
  baseUrl: string;
  authEndpoint: string;
  reservationsEndpoint: string;
  credentials: {
    username: string;
    password: string;
  };
  cache: {
    timeoutMs: number;
  };
  dateRange: {
    defaultDaysAhead: number;
  };
}

// Configurazione per l'ambiente di sviluppo
export const LIBREBOOKING_DEV_CONFIG: LibreBookingConfig = {
  baseUrl: 'https://virtustaranto.duckdns.org/Web/Services/index.php',
  authEndpoint: '/Authentication/Authenticate',
  reservationsEndpoint: '/Reservations/',
  credentials: {
    username: 'admin', // TODO: Sostituire con credenziali reali
    password: 'password' // TODO: Sostituire con credenziali reali
  },
  cache: {
    timeoutMs: 30 * 60 * 1000 // 30 minuti
  },
  dateRange: {
    defaultDaysAhead: 14 // 2 settimane
  }
};

// Configurazione per la produzione (da environment)
export const LIBREBOOKING_PROD_CONFIG: LibreBookingConfig = {
  baseUrl: 'https://virtustaranto.duckdns.org/Web/Services/index.php', // TODO: URL produzione
  authEndpoint: '/Authentication/Authenticate',
  reservationsEndpoint: '/Reservations/',
  credentials: {
    username: 'admin', // TODO: Sostituire con credenziali reali
    password: 'password' // TODO: Sostituire con credenziali reali
  },
  cache: {
    timeoutMs: 60 * 60 * 1000 // 1 ora in produzione
  },
  dateRange: {
    defaultDaysAhead: 21 // 3 settimane
  }
};

// Token di configurazione per l'injection
export const LIBREBOOKING_CONFIG_TOKEN = 'LIBREBOOKING_CONFIG';