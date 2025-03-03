import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface YouthTeam {
  category: string;
  ageRange: string;
  mascot: string;
  description: string;
  skills: string[];
  activities: string[];
  image: string;
}

@Component({
  selector: 'app-youth-teams',
  templateUrl: './youth-teams.component.html',
  styleUrls: ['./youth-teams.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandCard', [
      state('collapsed', style({
        height: '300px',
        overflow: 'hidden'
      })),
      state('expanded', style({
        minHeight: '500px'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ]),
    trigger('rotateIcon', [
      state('collapsed', style({ transform: 'rotate(0)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', [
        animate('300ms')
      ])
    ])
  ]
})
export class YouthTeamsComponent implements OnInit {
  selectedCategory: string = 'all';
  expandedCard: string | null = null;

  youthTeams: YouthTeam[] = [
    {
      category: 'pulcini-paperine',
      ageRange: '5-6 anni',
      mascot: '🐤',
      description: 'Il primo passo nel mondo del basket. Qui i nostri piccoli campioni imparano le basi del movimento e della coordinazione attraverso il gioco.',
      skills: ['Coordinazione base', 'Socializzazione', 'Gioco di squadra', 'Divertimento'],
      activities: ['Giochi motori', 'Mini-partite', 'Percorsi ludici'],
      image: 'assets/pulcini.jpg'
    },
    {
      category: 'scoiattoli-libellule',
      ageRange: '7-8 anni',
      mascot: '🐿️',
      description: 'I nostri piccoli atleti iniziano a scoprire le vere dinamiche del basket, sviluppando agilità e rapidità.',
      skills: ['Agilità', 'Palleggio', 'Passaggio', 'Tiro facilitato'],
      activities: ['Esercizi tecnici', 'Staffette', 'Tornei interni'],
      image: 'assets/scoiattoli.jpg'
    },
    {
      category: 'aquilotti-gazzelle',
      ageRange: '9-10 anni',
      mascot: '🦅',
      description: 'A questo livello, i giovani atleti affinano le loro abilità tecniche e tattiche, sviluppando una vera mentalità sportiva.',
      skills: ['Tecnica base', 'Tattica elementare', 'Lavoro di squadra', 'Competizione sana'],
      activities: ['Allenamenti strutturati', 'Campionato', 'Eventi speciali'],
      image: 'assets/aquilotti.jpg'
    },
    {
      category: 'esordienti',
      ageRange: '11-12 anni',
      mascot: '⭐',
      description: 'Il ponte verso il basket agonistico, dove si consolidano le competenze tecniche e si sviluppa il vero spirito competitivo.',
      skills: ['Tecnica avanzata', 'Tattica di gioco', 'Leadership', 'Preparazione fisica'],
      activities: ['Campionato competitivo', 'Workshop tecnici', 'Preparazione specifica'],
      image: 'assets/esordienti.jpg'
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  toggleCard(category: string): void {
    this.expandedCard = this.expandedCard === category ? null : category;
  }

  isExpanded(category: string): boolean {
    return this.expandedCard === category;
  }

  filterTeams(category: string): void {
    this.selectedCategory = category;
  }
}