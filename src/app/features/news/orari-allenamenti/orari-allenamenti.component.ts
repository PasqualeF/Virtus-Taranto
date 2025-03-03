import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  ]
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

  dataSource: MatTableDataSource<TabellaOrari>;
  displayedColumns: string[] = ['gruppo', ...this.giorni];

  constructor(private orariAllenamentiService: OrariAllenamentiService) {
    this.dataSource = new MatTableDataSource<TabellaOrari>([]);
  }

  ngOnInit() {
    this.caricaOrariAllenamenti();
  }

  caricaOrariAllenamenti() {
    this.orariAllenamentiService.getOrariAllenamenti().subscribe(
      (data: OrarioAllenamento[]) => {
        this.orariAllenamenti = data;
        this.estraiValoriUnici();
        this.filtraOrari();
      },
      error => {
        console.error('Errore nel caricamento degli orari allenamenti:', error);
      }
    );
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
}