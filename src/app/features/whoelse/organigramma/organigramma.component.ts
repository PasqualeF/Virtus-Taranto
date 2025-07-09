// organigramma.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { OrganigrammaService, Societa } from 'src/app/core/service/organigramma.service';
import { environment } from 'src/environments/environments';
import { OrganigrammaData, StaffMember } from 'src/app/core/models/person.model';

@Component({
  selector: 'app-organigramma',
  templateUrl: './organigramma.component.html',
  styleUrls: ['./organigramma.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('societaSelect', [
      transition(':enter', [
        query('.societa-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('staffCards', [
      transition(':enter', [
        query('.staff-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(50, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('memberHover', [
      state('inactive', style({
        transform: 'scale(1)'
      })),
      state('active', style({
        transform: 'scale(1.05)'
      })),
      transition('inactive <=> active', [
        animate('200ms ease-out')
      ])
    ])
  ]
})
export class OrganigrammaComponent implements OnInit {
  societa: Societa[] = [];
  organigramm: OrganigrammaData[] = [];
  selectedSocieta: string = 'Virtus Taranto';
  staffMembers: StaffMember[] = [];
  loading = false;
  hoverStates: { [key: number]: boolean } = {};
  view: 'cards' | 'tree' = 'cards';
  isMobile: boolean = false;
  presidentCountClass: string = '';

  constructor(private organigrammaService: OrganigrammaService) {}

  ngOnInit() {
    this.checkScreenSize();
    this.initializeSocieta();
    this.loadStaff(this.selectedSocieta);
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private initializeSocieta() {
    this.societa = this.organigrammaService.getSocieta();
  }

  loadSocieta() {
    this.loading = true;
    this.organigrammaService.getAllSocieta().subscribe({
      next: (organigramm) => {
        console.log(organigramm);
        this.loading = false;
        if (organigramm.length > 0) {
          this.selectedSocieta = organigramm[0];
          this.loadStaff(this.selectedSocieta);
        }
      },
      error: (error) => {
        console.error('Errore nel caricamento delle società:', error);
        this.loading = false;
      }
    });
  }

  loadStaff(societa: string) {
    this.loading = true;
    this.selectedSocieta = societa;
    this.organigrammaService.getStaff(societa).subscribe({
      next: (staff) => {
        this.staffMembers = staff;
        this.loading = false;
        this.staffMembers.forEach(member => {
          this.hoverStates[member.id] = false;
        });
        
        // Check president count for CSS class
        const presidentCount = this.getStaffByLevel(1).length;
        this.presidentCountClass = presidentCount === 2 ? 'two-cards' : '';
      },
      error: (error) => {
        console.error('Errore nel caricamento dello staff:', error);
        this.loading = false;
      }
    });
  }
  
  getStaffByLevel(level: number): StaffMember[] {
    return this.staffMembers.filter(member => member.livello === level);
  }

  getLevelTitle(level: number): string {
    switch (level) {
      case 1:
        return 'Presidenza';
      case 2:
        return 'Staff Tecnico';
      case 3:
        return 'Dirigenza';
      case 4:
        return 'Staff Medico';
      default:
        return '';
    }
  }

  toggleMemberHover(memberId: number) {
    this.hoverStates[memberId] = !this.hoverStates[memberId];
  }

  toggleView() {
    this.view = this.view === 'cards' ? 'tree' : 'cards';
  }

  getImageUrl(person: StaffMember): string {
    if (person.image && person.image.formats) {
      return `${environment.apiUrl}${person.image.formats.medium.url}`;
    }
    return person.foto || 'assets/default-profile.png';
  }
}