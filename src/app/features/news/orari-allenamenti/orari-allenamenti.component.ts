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

  isMobile: boolean = false;
  selectedDayIndex: number = 0;

  isLoading: boolean = false;
  error: string | null = null;
  isConnectedToBackend: boolean = false;

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
    const oggi = new Date().getDay();
    this.selectedDayIndex = oggi === 0 ? 6 : oggi - 1;
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
    
    this.orariAllenamentiService.getOrariAllenamenti().subscribe({
      next: (data: OrarioAllenamento[]) => {
        this.orariAllenamenti = data;
        this.isConnectedToBackend = this.orariAllenamentiService.isAuthenticated();
        this.estraiValoriUnici();
        this.filtraOrari();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Errore nel caricamento dei dati dal backend.';
        this.isLoading = false;
        this.isConnectedToBackend = false;
        this.orariAllenamenti = []; // Non più dati di fallback
      }
    });
  }

  refreshData() {
    this.isLoading = true;
    this.error = null;
    
    this.orariAllenamentiService.refreshData().subscribe({
      next: (data: OrarioAllenamento[]) => {
        this.orariAllenamenti = data;
        this.isConnectedToBackend = this.orariAllenamentiService.isAuthenticated();
        this.estraiValoriUnici();
        this.filtraOrari();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Errore nell\'aggiornamento dei dati dal backend.';
        this.isLoading = false;
        this.isConnectedToBackend = false;
        this.orariAllenamenti = [];
      }
    });
  }

  /**
   * Calcola il range della settimana target seguendo la stessa logica del backend
   * - Se oggi è Domenica dopo le 14:00 -> settimana successiva  
   * - Altrimenti -> settimana corrente
   */
  getWeekRange(): { startDate: Date, endDate: Date, formattedRange: string } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domenica, 1 = Lunedì, etc.
    
    let targetWeekStart: Date;
    
    if (currentDay === 0 && now.getHours() >= 14) {
      // Domenica dopo le 14:00 -> settimana successiva (da lunedì)
      targetWeekStart = new Date(now);
      targetWeekStart.setDate(now.getDate() + 1); // Domani = Lunedì
    } else {
      // Tutti gli altri casi -> settimana corrente
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1; // Se domenica, vai al lunedì precedente
      targetWeekStart = new Date(now);
      targetWeekStart.setDate(now.getDate() - daysToSubtract);
    }
    
    // Imposta ore, minuti, secondi a 00:00:00
    targetWeekStart.setHours(0, 0, 0, 0);
    
    // Calcola la domenica (fine settimana)
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
    targetWeekEnd.setHours(23, 59, 59, 999);
    
    // Formatta per il display
    const startFormatted = targetWeekStart.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    const endFormatted = targetWeekEnd.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    return {
      startDate: targetWeekStart,
      endDate: targetWeekEnd,
      formattedRange: `dal ${startFormatted} al ${endFormatted}`
    };
  }

  getWeekTitle(): string {
    const weekRange = this.getWeekRange();
    return `Orari per la settimana: ${weekRange.formattedRange}`;
  }

  estraiValoriUnici() {
    this.gruppiUnici = [...new Set(this.orariAllenamenti.map(o => o.gruppo))].sort();
    this.orariUnici = [...new Set(this.orariAllenamenti.map(o => o.orario))].sort();
    this.palestreUniche = [...new Set(this.orariAllenamenti.map(o => o.palestra))].sort();
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
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
  }

  getSquadreForDay(giorno: string): SquadraGiorno[] {
    const allenamentiFiltrati = this.orariAllenamenti.filter(orario => 
      orario.giorno === giorno &&
      (this.filtroGruppo ? orario.gruppo === this.filtroGruppo : true) &&
      (this.filtroOrario ? orario.orario === this.filtroOrario : true) &&
      (this.filtroPalestra ? orario.palestra === this.filtroPalestra : true)
    );

    const squadreMap = new Map<string, OrarioAllenamento[]>();
    
    allenamentiFiltrati.forEach(allenamento => {
      if (!squadreMap.has(allenamento.gruppo)) {
        squadreMap.set(allenamento.gruppo, []);
      }
      squadreMap.get(allenamento.gruppo)?.push(allenamento);
    });

    const squadre: SquadraGiorno[] = [];
    squadreMap.forEach((allenamenti, gruppo) => {
      squadre.push({ gruppo, allenamenti });
    });

    return squadre.sort((a, b) => a.gruppo.localeCompare(b.gruppo));
  }

  clearFilters() {
    this.filtroGruppo = '';
    this.filtroOrario = '';
    this.filtroPalestra = '';
    this.filtraOrari();
  }

  getDebugInfo(): string {
    const serviceStatus = this.orariAllenamentiService.getServiceStatus();
    const weekRange = this.getWeekRange();
    
    return `
      Connesso al backend: ${this.isConnectedToBackend}
      Prenotazioni caricate: ${this.orariAllenamenti.length}
      Gruppi unici: ${this.gruppiUnici.length}
      Settimana target: ${weekRange.formattedRange}
      Dati aggiornati: ${serviceStatus.isAuthenticated}
      Ultimo aggiornamento: ${serviceStatus.lastFetchTime ? new Date(serviceStatus.lastFetchTime).toLocaleTimeString('it-IT') : 'Mai'}
      Endpoint: ${serviceStatus.config.baseUrl}
    `;
  }

  getTooltipText(allenamento: OrarioAllenamento): string {
    let tooltip = `${allenamento.gruppo}\n`;
    tooltip += `📅 ${allenamento.giorno}\n`;
    tooltip += `🕐 ${allenamento.orario}\n`;
    tooltip += `📍 ${allenamento.palestra}`;
    
    if (allenamento.title && allenamento.title.trim()) {
      tooltip += `\n🏷️ ${allenamento.title}`;
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

  onAllenamentoClick(allenamento: OrarioAllenamento) {
    if (allenamento.referenceNumber) {
      this.showAllenamentoDetails(allenamento);
    }
  }

  private showAllenamentoDetails(allenamento: OrarioAllenamento) {
    // Implementazione dettagli allenamento
    console.log('Dettagli allenamento:', allenamento);
  }

  hasActiveFilters(): boolean {
    return !!(this.filtroGruppo || this.filtroOrario || this.filtroPalestra);
  }

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

  logout() {
    this.orariAllenamentiService.logout();
    this.isConnectedToBackend = false;
    this.orariAllenamenti = [];
  }

  getServiceStatus() {
    return this.orariAllenamentiService.getServiceStatus();
  }

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
      return 'Data non valida';
    }
  }

  isToday(allenamento: OrarioAllenamento): boolean {
    const oggi = new Date();
    const giornoOggi = this.getGiornoSettimana(oggi);
    return allenamento.giorno === giornoOggi;
  }

  private getGiornoSettimana(date: Date): string {
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return giorni[date.getDay()];
  }
}