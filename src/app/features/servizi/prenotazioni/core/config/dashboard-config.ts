// core/config/dashboard-config.ts
export interface DashboardConfig {
  // Modalità di caricamento dati
  useExistingBookingApi: boolean; // true = usa API prenotazioni, false = usa endpoint dashboard dedicato
  
  // URLs
  dashboardApiUrl: string;
  bookingApiUrl: string;
  
  // Configurazioni cache
  enableCaching: boolean;
  cacheTimeoutMinutes: number;
  
  // Configurazioni UI
  refreshIntervalMinutes: number;
  maxUpcomingBookings: number;
  showDetailedStats: boolean;
  
  // Configurazioni periodo default
  defaultStatsPeriod: 'thisWeek' | 'thisMonth' | 'thisYear';
  
  // Feature flags
  enableRealTimeUpdates: boolean;
  enableTrendCalculations: boolean;
  enableAdvancedStats: boolean;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  // IMPORTANTE: Cambia questo flag per scegliere quale implementazione usare
  useExistingBookingApi: true, // true = usa solo API prenotazioni (ATTUALE), false = usa endpoint dashboard dedicato
  
  dashboardApiUrl: '/dashboard',
  bookingApiUrl: '/reservations',
  
  enableCaching: false, // Disabilitato per ora
  cacheTimeoutMinutes: 5,
  
  refreshIntervalMinutes: 0, // 0 = no auto-refresh
  maxUpcomingBookings: 5,
  showDetailedStats: true,
  
  defaultStatsPeriod: 'thisMonth',
  
  enableRealTimeUpdates: false,
  enableTrendCalculations: true,
  enableAdvancedStats: false
};

/**
 * Ottieni la configurazione della dashboard
 * Può essere esteso per leggere da environment variables o API
 */
export function getDashboardConfig(): DashboardConfig {
  // In futuro qui si potrebbe leggere da environment.ts o da API
  return { ...DEFAULT_DASHBOARD_CONFIG };
}

/**
 * Configura la dashboard per usare l'endpoint dedicato
 */
export function enableDedicatedDashboardApi(): DashboardConfig {
  return {
    ...DEFAULT_DASHBOARD_CONFIG,
    useExistingBookingApi: false,
    enableAdvancedStats: true,
    enableTrendCalculations: true
  };
}

/**
 * Configura la dashboard per usare solo le API prenotazioni
 */
export function enableBookingApiOnly(): DashboardConfig {
  return {
    ...DEFAULT_DASHBOARD_CONFIG,
    useExistingBookingApi: true,
    enableAdvancedStats: false
  };
}