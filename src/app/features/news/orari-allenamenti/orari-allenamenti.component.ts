import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { OrariAllenamentiService } from 'src/app/core/service/orari-allenamenti.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { OrarioAllenamento, TabellaOrari, SquadraGiorno } from 'src/app/core/models/reservation.model';

@Component({
  selector: 'app-orari-allenamenti',
  templateUrl: './orari-allenamenti.component.html',
  styleUrls: ['./orari-allenamenti.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  host: {
    'class': 'app-orari-allenamenti',
    'style': 'background: linear-gradient(135deg, #131e33 0%, #002b49 100%); display: block; min-height: 100vh;'
  }
})
export class OrariAllenamentiComponent implements OnInit {
  orariAllenamenti: OrarioAllenamento[] = [];
  giorni: string[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  gruppiUnici: string[] = [];
  orariUnici: string[] = [];
  palestreUniche: string[] = [];

  filtroGruppo: string = '';
  filtroOrario: string = '';
  filtroPalestra: string = '';

  // Vista mobile
  isMobile: boolean = false;
  selectedDayIndex: number = 0;

  // Stato del componente
  isLoading: boolean = false;
  error: string | null = null;
  isConnectedToLibreBooking: boolean = false;

  dataSource: MatTableDataSource<TabellaOrari>;
  displayedColumns: string[] = ['gruppo', ...this.giorni];

  constructor(private orariAllenamentiService: OrariAllenamentiService) {
    this.dataSource = new MatTableDataSource<TabellaOrari>([]);
    this.checkScreenSize();
  }

  ngOnInit() {
    this.impostaGiornoCorrente();
    this.caricaOrariAllenamenti();
  }

  impostaGiornoCorrente() {
    // Imposta il giorno corrente come default per la vista mobile
    const oggi = new Date().getDay(); // 0 = domenica, 1 = lunedì, ...
    this.selectedDayIndex = oggi === 0 ? 6 : oggi - 1; // Aggiusta per il nostro array (0 = lunedì)
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 992;
  }

  caricaOrariAllenamenti() {
    this.isLoading = true;
    this.error = null;
    
    console.log('🔄 Caricamento orari allenamenti da LibreBooking...');
    
    this.orariAllenamentiService.getOrariAllenamenti().subscribe({
      next: (data: OrarioAllenamento[]) => {
        console.log('✅ Dati ricevuti:', data);
        this.orariAllenamenti = data;
        this.isConnectedToLibreBooking = this.orariAllenamentiService.isAuthenticated();
        this.estraiValoriUnici();
        this.filtraOrari();
        this.isLoading = false;
        
        // Log delle statistiche
        console.log(`📊 Statistiche caricamento:
          - Prenotazioni totali: ${data.length}
          - Gruppi unici: ${this.gruppiUnici.length}
          - Palestre uniche: ${this.palestreUniche.length}
          - Connesso a LibreBooking: ${this.isConnectedToLibreBooking}`);
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento degli orari allenamenti:', error);
        this.error = 'Errore nel caricamento dei dati. Verifica la connessione.';
        this.isLoading = false;
        this.isConnectedToLibreBooking = false;
        
        // Carica dati di fallback
        this.caricaDatiFallback();
      }
    });
  }

  caricaDatiFallback() {
    console.log('🔄 Caricamento dati di fallback...');
    this.orariAllenamentiService.getFallbackData().subscribe({
      next: (data: OrarioAllenamento[]) => {
        this.orariAllenamenti = data;
        this.estraiValoriUnici();
        this.filtraOrari();
        console.log('✅ Dati di fallback caricati');
      },
      error: (error) => {
        console.error('❌ Errore anche nel caricamento dei dati di fallback:', error);
      }
    });
  }

  /**
   * Forza il refresh dei dati da LibreBooking
   */
  refreshData() {
    console.log('🔄 Refresh forzato dei dati...');
    this.isLoading = true;
    this.error = null;
    
    this.orariAllenamentiService.refreshData().subscribe({
      next: (data: OrarioAllenamento[]) => {
        console.log('✅ Dati aggiornati:', data);
        this.orariAllenamenti = data;
        this.isConnectedToLibreBooking = this.orariAllenamentiService.isAuthenticated();
        this.estraiValoriUnici();
        this.filtraOrari();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Errore nel refresh:', error);
        this.error = 'Errore nell\'aggiornamento dei dati.';
        this.isLoading = false;
        this.isConnectedToLibreBooking = false;
      }
    });
  }

  /**
   * Passa ai dati di fallback manualmente
   */
  useFallbackData() {
    console.log('🔄 Utilizzo dati di fallback...');
    this.caricaDatiFallback();
    this.error = null;
    this.isConnectedToLibreBooking = false;
  }

  estraiValoriUnici() {
    this.gruppiUnici = [...new Set(this.orariAllenamenti.map(o => o.gruppo))].sort();
    this.orariUnici = [...new Set(this.orariAllenamenti.map(o => o.orario))].sort();
    this.palestreUniche = [...new Set(this.orariAllenamenti.map(o => o.palestra))].sort();
    
    console.log('📋 Valori unici estratti:', {
      gruppi: this.gruppiUnici,
      orari: this.orariUnici,
      palestre: this.palestreUniche
    });
  }

  filtraOrari() {
    const orariFiltrati = this.orariAllenamenti.filter(orario =>
      (this.filtroGruppo ? orario.gruppo === this.filtroGruppo : true) &&
      (this.filtroOrario ? orario.orario === this.filtroOrario : true) &&
      (this.filtroPalestra ? orario.palestra === this.filtroPalestra : true)
    );

    const tabellaOrari: TabellaOrari[] = this.gruppiUnici
      .filter(gruppo => !this.filtroGruppo || gruppo === this.filtroGruppo)
      .map(gruppo => {
        const riga: TabellaOrari = { gruppo };
        this.giorni.forEach(giorno => {
          riga[giorno] = orariFiltrati.filter(o => o.gruppo === gruppo && o.giorno === giorno);
        });
        return riga;
      });

    this.dataSource.data = tabellaOrari;
    
    console.log(`🔍 Filtri applicati: ${orariFiltrati.length} risultati`);
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
    console.log(`📅 Giorno selezionato: ${this.giorni[index]}`);
  }

  getSquadreForDay(giorno: string): SquadraGiorno[] {
    // Filtra gli allenamenti per il giorno selezionato
    const allenamentiFiltrati = this.orariAllenamenti.filter(orario => 
      orario.giorno === giorno &&
      (this.filtroGruppo ? orario.gruppo === this.filtroGruppo : true) &&
      (this.filtroOrario ? orario.orario === this.filtroOrario : true) &&
      (this.filtroPalestra ? orario.palestra === this.filtroPalestra : true)
    );

    // Raggruppa per squadra
    const squadreMap = new Map<string, OrarioAllenamento[]>();
    
    allenamentiFiltrati.forEach(allenamento => {
      if (!squadreMap.has(allenamento.gruppo)) {
        squadreMap.set(allenamento.gruppo, []);
      }
      squadreMap.get(allenamento.gruppo)?.push(allenamento);
    });

    // Converti la mappa in array per il template
    const squadre: SquadraGiorno[] = [];
    squadreMap.forEach((allenamenti, gruppo) => {
      squadre.push({ gruppo, allenamenti });
    });

    return squadre.sort((a, b) => a.gruppo.localeCompare(b.gruppo));
  }

  /**
   * Pulisce i filtri
   */
  clearFilters() {
    this.filtroGruppo = '';
    this.filtroOrario = '';
    this.filtroPalestra = '';
    this.filtraOrari();
    console.log('🧹 Filtri puliti');
  }

  /**
   * Ottiene informazioni di debug
   */
  getDebugInfo(): string {
    const serviceStatus = this.orariAllenamentiService.getServiceStatus();
    return `
      Connesso a LibreBooking: ${this.isConnectedToLibreBooking}
      Prenotazioni caricate: ${this.orariAllenamenti.length}
      Gruppi unici: ${this.gruppiUnici.length}
      Autenticato: ${serviceStatus.isAuthenticated}
      Cache timeout: ${Math.round(serviceStatus.cacheTimeoutMs / 1000 / 60)} minuti
      Ultima auth: ${serviceStatus.lastAuthTime ? new Date(serviceStatus.lastAuthTime).toLocaleTimeString('it-IT') : 'Mai'}
      Base URL: ${serviceStatus.config.baseUrl}
    `;
  }

  /**
   * Genera testo tooltip per le card allenamento
   */
  getTooltipText(allenamento: OrarioAllenamento): string {
    let tooltip = `${allenamento.gruppo}\n`;
    tooltip += `📅 ${allenamento.giorno}\n`;
    tooltip += `🕐 ${allenamento.orario}\n`;
    tooltip += `📍 ${allenamento.palestra}`;
    
    if (allenamento.title && allenamento.title.trim()) {
      tooltip += `\n📝 ${allenamento.title}`;
    }
    
    if (allenamento.description && allenamento.description.trim()) {
      tooltip += `\n💬 ${allenamento.description}`;
    }
    
    if (allenamento.isRecurring) {
      tooltip += `\n🔄 Allenamento ricorrente`;
    }
    
    if (allenamento.referenceNumber) {
      tooltip += `\n🔗 Ref: ${allenamento.referenceNumber}`;
    }
    
    return tooltip;
  }

  /**
   * Gestisce il click su una card allenamento
   */
  onAllenamentoClick(allenamento: OrarioAllenamento) {
    console.log('🏀 Click su allenamento:', allenamento);
    
    // Esempio di azioni possibili:
    if (allenamento.referenceNumber) {
      console.log(`📋 Dettagli prenotazione: ${allenamento.referenceNumber}`);
      // Qui potresti aprire un modal con i dettagli
      this.showAllenamentoDetails(allenamento);
    }
  }

  /**
   * Mostra i dettagli di un allenamento (esempio)
   */
  private showAllenamentoDetails(allenamento: OrarioAllenamento) {
    // Implementazione per mostrare dettagli
    console.log('📊 Dettagli allenamento:', {
      gruppo: allenamento.gruppo,
      orario: allenamento.orario,
      palestra: allenamento.palestra,
      title: allenamento.title,
      description: allenamento.description,
      isRecurring: allenamento.isRecurring,
      referenceNumber: allenamento.referenceNumber,
      startDate: allenamento.startDate,
      endDate: allenamento.endDate
    });
    
    // Qui potresti aprire un modal, navigare a una pagina di dettaglio, etc.
  }

  /**
   * Verifica se ci sono filtri attivi
   */
  hasActiveFilters(): boolean {
    return !!(this.filtroGruppo || this.filtroOrario || this.filtroPalestra);
  }

  /**
   * Ottiene il numero di risultati dopo i filtri
   */
  getFilteredResultsCount(): number {
    if (!this.hasActiveFilters()) {
      return this.orariAllenamenti.length;
    }
    
    return this.orariAllenamenti.filter(orario =>
      (this.filtroGruppo ? orario.gruppo === this.filtroGruppo : true) &&
      (this.filtroOrario ? orario.orario === this.filtroOrario : true) &&
      (this.filtroPalestra ? orario.palestra === this.filtroPalestra : true)
    ).length;
  }

  /**
   * Test di connettività manuale
   */
  testConnection() {
    console.log('🔧 Avvio test di connettività...');
    this.orariAllenamentiService.testConnection().subscribe({
      next: (isConnected) => {
        console.log(`🔌 Test di connettività: ${isConnected ? 'SUCCESSO' : 'FALLITO'}`);
        if (isConnected) {
          console.log('✅ La connessione a LibreBooking funziona correttamente');
        } else {
          console.log('❌ Problemi di connessione a LibreBooking');
        }
      },
      error: (error) => {
        console.error('❌ Errore nel test di connettività:', error);
      }
    });
  }

  /**
   * Logout manuale dal servizio
   */
  logout() {
    console.log('🚪 Logout dal servizio LibreBooking...');
    this.orariAllenamentiService.logout();
    this.isConnectedToLibreBooking = false;
    
    // Ricarica con dati di fallback
    this.useFallbackData();
  }

  /**
   * Ottiene lo stato dettagliato del servizio
   */
  getServiceStatus() {
    return this.orariAllenamentiService.getServiceStatus();
  }

  /**
   * Formatta la data per la visualizzazione
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Errore nel parsing della data:', error);
      return 'Data non valida';
    }
  }

  /**
   * Verifica se un allenamento è oggi
   */
  isToday(allenamento: OrarioAllenamento): boolean {
    const oggi = new Date();
    const giornoOggi = this.getGiornoSettimana(oggi);
    return allenamento.giorno === giornoOggi;
  }

  /**
   * Converte una data nel giorno della settimana in italiano
   */
  private getGiornoSettimana(date: Date): string {
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return giorni[date.getDay()];
  }
}