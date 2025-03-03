import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { SocietaMap } from 'src/app/core/models/societaMap';
import { Societa } from 'src/app/core/models/societa.model';

@Component({
  selector: 'app-codice-etico',
  templateUrl: './codice-etico.component.html',
  styleUrls: ['./codice-etico.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideInFromLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class CodiceEticoComponent implements OnInit {
  societa: Societa[] = [];
 
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadData();    
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }
  private loadData(): void {
    this.translate.get('SERVIZI_ETICO.societa').subscribe((societaMap: SocietaMap) => {
      this.societa = Object.values(societaMap);
    });
  }

  scaricaDocumento(url: string) {
    window.open(url, '_blank');
  }
}