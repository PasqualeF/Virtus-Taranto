import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';

interface Procedura {
  step: string[];
}

@Component({
  selector: 'app-visita-medica',
  templateUrl: './visita-medica.component.html',
  styleUrls: ['./visita-medica.component.css'],
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
export class VisitaMedicaComponent implements OnInit {
  documentoUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdw3W6tZjVYZt4EHzdk-afzaqBel4SNsLdwi0vnN4dCVkcrAA/viewform';
  showProcedura = false;
  procedura: Procedura[] = [];

 

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showProcedura = true;
    }, 500);
    this.loadData();
    
    // Sottoscrizione ai cambiamenti di lingua
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }
  private loadData(): void {
    this.translate.get('SERVIZI_VISITA.procedura').subscribe((procedura: Procedura) => {
      this.procedura = Object.values(procedura);
    });
  }



  scaricaDocumento() {
    window.open(this.documentoUrl, '_blank');
  }

}