// calendario.component.ts
import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CalendarOptions, EventSourceInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import itLocale from '@fullcalendar/core/locales/it';
import { EventiService } from 'src/app/core/service/eventi.service';

interface Societa {
  id: number;  // Aggiunto id necessario per il service
  nome: string;
  logo: string;
  coloreEventi: string;
  eventi: any[];
}

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ])
  ]
})
export class CalendarioComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: itLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    weekends: true,
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto'
  };

  selectedSocieta: Societa | null = null;
  
  societa: Societa[] = [
    {
      id: 1,
      nome: 'Virtus Taranto',
      logo: 'assets/virtusLogo.png',
      coloreEventi: '#3b82f6',
      eventi: [
        {
          title: 'Partita vs Brindisi',
          start: '2024-10-25',
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
          tipo: 'PARTITA'
        },
        {
          title: 'Camp Giovanile',
          start: '2024-10-28',
          end: '2024-10-30',
          backgroundColor: '#60a5fa',
          borderColor: '#60a5fa',
          textColor: '#ffffff',
          tipo: 'EVENTO_SPECIALE'
        }
      ]
    },
    {
      id: 2,
      nome: 'Support_o',
      logo: 'assets/support_logo.png',
      coloreEventi: '#10b981',
      eventi: [
        {
          title: 'Torneo Inclusivo',
          start: '2024-10-26',
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          textColor: '#ffffff',
          tipo: 'EVENTO_SPECIALE'
        }
      ]
    },
    {
      id: 3,
      nome: 'Polisportiva 74020',
      logo: 'assets/poliLogo.png',
      coloreEventi: '#f59e0b',
      eventi: [
        {
          title: 'Open Day',
          start: '2024-10-27',
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          textColor: '#ffffff',
          tipo: 'EVENTO_SPECIALE'
        }
      ]
    }
  ];

  constructor(private eventiService: EventiService) {}

  ngOnInit(): void {
    this.selectSocieta(this.societa[0]);
  }

  selectSocieta(societa: Societa) {
    this.selectedSocieta = societa;
    this.eventiService.getEventiSocieta(societa.id).subscribe({
      next: (eventi) => {
        this.calendarOptions.events = eventi;
      },
      error: (error) => {
        console.error('Errore nel caricamento eventi:', error);
      }
    });
  }

  handleEventClick(arg: any) {
    const evento = arg.event;
    console.log('Evento cliccato:', evento.title);
    // Qui implementeremo la logica del modal
  }
}