import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { OrariAllenamentiService } from 'src/app/core/service/orari-allenamenti.service';
import { animate, style, transition, trigger } from '@angular/animations';

interface OrarioAllenamento {
  gruppo: string;
  giorno: string;
  orario: string;
  palestra: string;
}

interface TabellaOrari {
  gruppo: string;
  [key: string]: string | OrarioAllenamento[];
}

interface SquadraGiorno {
  gruppo: string;
  allenamenti: OrarioAllenamento[];
}

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

  dataSource: MatTableDataSource<TabellaOrari>;
  displayedColumns: string[] = ['gruppo', ...this.giorni];

  constructor(private orariAllenamentiService: OrariAllenamentiService) {
    this.dataSource = new MatTableDataSource<TabellaOrari>([]);
    this.checkScreenSize();
  }

  ngOnInit() {
    this.caricaOrariAllenamenti();
    this.impostaGiornoCorrente();
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
    this.orariAllenamentiService.getOrariAllenamenti().subscribe(
      (data: OrarioAllenamento[]) => {
        this.orariAllenamenti = data;
        this.estraiValoriUnici();
        this.filtraOrari();
        
        // Non impostiamo qui il giorno corrente perché lo abbiamo già fatto in ngOnInit
      },
      error => {
        console.error('Errore nel caricamento degli orari allenamenti:', error);
        // Carica dati di esempio in caso di errore
        this.caricaDatiEsempio();
      }
    );
  }

  caricaDatiEsempio() {
    // Dati di esempio nel caso il servizio non sia disponibile
    this.orariAllenamenti = [
      { gruppo: 'Under 15', giorno: 'Lunedì', orario: '16:00-17:30', palestra: 'Palestra A' },
      { gruppo: 'Under 15', giorno: 'Mercoledì', orario: '16:00-17:30', palestra: 'Palestra A' },
      { gruppo: 'Under 15', giorno: 'Venerdì', orario: '16:00-17:30', palestra: 'Palestra B' },
      { gruppo: 'Under 17', giorno: 'Lunedì', orario: '17:30-19:00', palestra: 'Palestra A' },
      { gruppo: 'Under 17', giorno: 'Giovedì', orario: '17:30-19:00', palestra: 'Palestra A' },
      { gruppo: 'Under 17', giorno: 'Venerdì', orario: '17:30-19:00', palestra: 'Palestra A' },
      { gruppo: 'Prima Squadra', giorno: 'Lunedì', orario: '20:00-22:00', palestra: 'Palestra Centrale' },
      { gruppo: 'Prima Squadra', giorno: 'Martedì', orario: '20:00-22:00', palestra: 'Palestra Centrale' },
      { gruppo: 'Prima Squadra', giorno: 'Giovedì', orario: '20:00-22:00', palestra: 'Palestra Centrale' },
      { gruppo: 'Prima Squadra', giorno: 'Sabato', orario: '10:00-12:00', palestra: 'Palestra Centrale' },
      { gruppo: 'Minibasket', giorno: 'Martedì', orario: '15:00-16:30', palestra: 'Palestra B' },
      { gruppo: 'Minibasket', giorno: 'Giovedì', orario: '15:00-16:30', palestra: 'Palestra B' },
      { gruppo: 'Senior Femminile', giorno: 'Lunedì', orario: '19:00-20:30', palestra: 'Palestra B' },
      { gruppo: 'Senior Femminile', giorno: 'Mercoledì', orario: '19:00-20:30', palestra: 'Palestra B' },
      { gruppo: 'Senior Femminile', giorno: 'Venerdì', orario: '19:00-20:30', palestra: 'Palestra B' }
    ];
    
    this.estraiValoriUnici();
    this.filtraOrari();
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
}