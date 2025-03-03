import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';

interface Procedura {
  step: string[];
}
@Component({
  selector: 'app-iscrizioni-giovanili',
  templateUrl: './iscrizioni-giovanili.component.html',
  styleUrls: ['./iscrizioni-giovanili.component.css'],
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
export class IscrizioniGiovaniliComponent implements OnInit {
  showProcedure = false;
  proceduraVirtus: Procedura[] = [];
  proceduraSupport: Procedura[] = [];


  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showProcedure = true;
    }, 500);
    this.loadData();
    
    // Sottoscrizione ai cambiamenti di lingua
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }
  private loadData(): void {
    this.translate.get('SERVIZI_ISCRIZIONI.proceduraVirtus1').subscribe((procedura: Procedura) => {
      this.proceduraVirtus = Object.values(procedura);
    });
    this.translate.get('SERVIZI_ISCRIZIONI.proceduraSupport1').subscribe((procedura: Procedura) => {
      this.proceduraSupport = Object.values(procedura);
    });
  }
}