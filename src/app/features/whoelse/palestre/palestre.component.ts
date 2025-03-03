import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Palestra {
  id: number;
  nome: string;
  immagine: string;
  descrizione: string;
  indirizzo: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-palestre',
  templateUrl: './palestre.component.html',
  styleUrls: ['./palestre.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('flipIn', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)' }),
        animate('600ms ease-out', style({ transform: 'rotateY(0deg)' })),
      ]),
    ]),
    trigger('detailExpand', [
      state('collapsed', style({ 
        opacity: 0, 
        transform: 'scale(0.8)' 
      })),
      state('expanded', style({ 
        opacity: 1, 
        transform: 'scale(1)' 
      })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class PalestreComponent implements OnInit {
  palestre: Palestra[] = [
    {
      id: 1,
      nome: 'PalaFiom',
      immagine: 'assets/palestre/archimede_1.jpg',
      descrizione: 'Il nostro campo principale, casa delle partite più emozionanti.',
      indirizzo: 'Via Lago di Trasimeno, 74121 Taranto TA',
      lat: 40.4686, // Esempio di coordinate, da aggiornare con quelle reali
      lng: 17.2403
    },
    {
      id: 2,
      nome: 'Palestra Falanto',
      immagine: 'assets/palestre/martellotta.jpg',
      descrizione: 'Una struttura moderna per allenamenti di alto livello.',
      indirizzo: 'Via Lago di Como, 74121 Taranto TA',
      lat: 40.4756, // Esempio di coordinate, da aggiornare con quelle reali
      lng: 17.2518
    },
    // Aggiungi altre palestre qui
  ];
  selectedPalestra: Palestra | null = null;
  detailState: 'collapsed' | 'expanded' = 'collapsed';

  constructor() { }

  ngOnInit(): void { }

  showDetails(palestra: Palestra) {
    this.selectedPalestra = palestra;
    this.detailState = 'expanded';
  }

  closeDetails() {
    this.detailState = 'collapsed';
    setTimeout(() => {
      this.selectedPalestra = null;
    }, 300);
  }
}