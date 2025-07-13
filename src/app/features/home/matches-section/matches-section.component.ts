// matches-section.component.ts - AGGIORNATO
import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Match } from 'src/app/core/service/match.service'; // NUOVO IMPORT

@Component({
  selector: 'app-matches-section',
  templateUrl: './matches-section.component.html',
  styleUrls: ['./matches-section.component.css']
})
export class MatchesSectionComponent implements OnInit, OnDestroy {
  @Input() upcomingMatches: Match[] = []; // AGGIORNATO: ora usa il tipo Match dal service
  
  currentMatchIndex = 0;
  currentMobileIndex = 0;
  cardWidth = 480;
  cardMargin = 48;
  isMobile = false;
  countdownInterval: any;

  // Touch handling per mobile
  private touchStartX = 0;
  private touchEndX = 0;

  constructor() {}

  ngOnInit() {
    this.checkScreenSize();
    
    // Avvia il countdown e lo aggiorna ogni secondo
    this.countdownInterval = setInterval(() => {
      if (this.upcomingMatches && this.upcomingMatches.length > 0) {
        // Forza l'aggiornamento del countdown per tutte le partite visibili
        this.updateCountdowns();
      }
    }, 1000);
  }
  
  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // NUOVO: metodo per forzare l'aggiornamento dei countdown
  private updateCountdowns() {
    // Questo metodo viene chiamato ogni secondo per aggiornare i countdown
    // Non è necessario fare nulla di specifico qui, il template si aggiornerà automaticamente
  }
  
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    
    if (window.innerWidth < 992) {
      this.cardWidth = 400;
      this.cardMargin = 30;
    } else {
      this.cardWidth = 480;
      this.cardMargin = 48;
    }
  }

  // Metodi per il carousel desktop
  nextMatches() {
    if (this.currentMatchIndex < this.upcomingMatches.length - 1) {
      this.currentMatchIndex++;
    }
  }

  previousMatches() {
    if (this.currentMatchIndex > 0) {
      this.currentMatchIndex--;
    }
  }

  getCarouselTransform(): string {
    const translateX = this.currentMatchIndex * (this.cardWidth + this.cardMargin);
    return `translateX(-${translateX}px)`;
  }

  selectDesktopMatch(index: number) {
    if (index >= 0 && index < this.upcomingMatches.length) {
      this.currentMatchIndex = index;
    }
  }

  // Mostra solo 3 card nella visualizzazione desktop
  displayedDesktopMatches(): Match[] {
    if (this.upcomingMatches.length <= 3) {
      return this.upcomingMatches;
    }

    const result = [];
    
    if (this.currentMatchIndex > 0) {
      result.push(this.upcomingMatches[this.currentMatchIndex - 1]);
    } else {
      return this.upcomingMatches.slice(0, 3);
    }
    
    result.push(this.upcomingMatches[this.currentMatchIndex]);
    
    if (this.currentMatchIndex < this.upcomingMatches.length - 1) {
      result.push(this.upcomingMatches[this.currentMatchIndex + 1]);
    }
    
    if (result.length < 3 && this.currentMatchIndex > 1) {
      result.unshift(this.upcomingMatches[this.currentMatchIndex - 2]);
    }
    
    return result;
  }
  
  // Metodo mobile
  goToMatch(index: number) {
    this.currentMobileIndex = index;
  }

  // Touch handling per mobile swipe
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    if (this.touchEndX < this.touchStartX - 50) {
      if (this.currentMobileIndex < this.upcomingMatches.length - 1) {
        this.currentMobileIndex++;
      }
    }
    if (this.touchEndX > this.touchStartX + 50) {
      if (this.currentMobileIndex > 0) {
        this.currentMobileIndex--;
      }
    }
  }

  // Metodi di formattazione - AGGIORNATI per gestire meglio le date
  getFormattedDate(date: Date): string {
    if (!date) return '';
    
    // Assicurati che sia un oggetto Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data non valida:', date);
      return 'Data non disponibile';
    }
    
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'short' 
    };
    
    return dateObj.toLocaleDateString('it-IT', options);
  }

  getCountdown(date: Date): string {
    if (!date) return 'Data non disponibile';
    
    // Assicurati che sia un oggetto Date
    const matchDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(matchDate.getTime())) {
      console.error('Data non valida per countdown:', date);
      return 'Data non valida';
    }
    
    const now = new Date().getTime();
    const matchTime = matchDate.getTime();
    const distance = matchTime - now;
    
    // Se la partita è già iniziata o finita
    if (distance < 0) {
      const elapsed = Math.abs(distance);
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      
      if (hours > 3) {
        return "Partita conclusa";
      } else {
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m fa`;
      }
    }

    // Calcola giorni, ore, minuti e secondi rimanenti
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Formato compatto per il display
    if (days > 0) {
      return `${days}g ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // NUOVO: metodo per verificare se una partita è oggi
  isToday(date: Date): boolean {
    if (!date) return false;
    
    const matchDate = date instanceof Date ? date : new Date(date);
    const today = new Date();
    
    return matchDate.toDateString() === today.toDateString();
  }

  // NUOVO: metodo per verificare se una partita è domani
  isTomorrow(date: Date): boolean {
    if (!date) return false;
    
    const matchDate = date instanceof Date ? date : new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return matchDate.toDateString() === tomorrow.toDateString();
  }

  // NUOVO: metodo per ottenere un testo descrittivo per la data
  getDateDescription(date: Date): string {
    if (this.isToday(date)) {
      return 'Oggi';
    } else if (this.isTomorrow(date)) {
      return 'Domani';
    } else {
      return this.getFormattedDate(date);
    }
  }

  // NUOVO: metodo per verificare se la partita è critica (entro 24 ore)
  isCriticalMatch(date: Date): boolean {
    if (!date) return false;
    
    const matchDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 0 && hoursDiff <= 24;
  }

  // NUOVO: metodo per ottenere la classe CSS in base al tipo di partita
  getMatchClass(match: Match): string {
    const classes = [];
    
    if (match.isHome) {
      classes.push('home-match');
    } else {
      classes.push('away-match');
    }
    
    if (this.isToday(match.date)) {
      classes.push('today-match');
    } else if (this.isCriticalMatch(match.date)) {
      classes.push('critical-match');
    }
    
    return classes.join(' ');
  }
  // AGGIUNGI QUESTO METODO al matches-section.component.ts

/**
 * Genera le iniziali di una squadra (massimo 3 caratteri)
 * @param teamName Nome della squadra
 * @returns Iniziali della squadra
 */
getTeamInitials(teamName: string): string {
  if (!teamName) return '?';
  
  // Rimuovi parole comuni e articoli
  const wordsToIgnore = ['basket', 'new', 'old', 'team', 'club', 'società', 'asd', 'ssd'];
  
  // Pulisci il nome e dividi in parole
  const cleanName = teamName.toLowerCase()
    .replace(/[^\w\s]/g, '') // Rimuovi punteggiatura
    .trim();
  
  const words = cleanName.split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !wordsToIgnore.includes(word));
  
  if (words.length === 0) {
    // Fallback: usa le prime 3 lettere del nome originale
    return teamName.substring(0, 3).toUpperCase();
  }
  
  let initials = '';
  
  // Casi speciali per squadre conosciute
  const specialCases: { [key: string]: string } = {
    'virtus taranto': 'VT',
    'virtus': 'VT',
    'supporto': 'SUP',
    'brindisi': 'BRI',
    'brindi': 'BRI',
    'corato': 'COR',
    'bari': 'BAR',
    'lecce': 'LEC',
    'foggia': 'FOG',
    'taranto': 'TAR'
  };
  
  // Controlla se corrisponde a un caso speciale
  const lowerName = cleanName.replace(/\s+/g, ' ');
  for (const [key, value] of Object.entries(specialCases)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  // Logica generale per le iniziali
  if (words.length === 1) {
    // Una sola parola: prime 3 lettere
    initials = words[0].substring(0, 3).toUpperCase();
  } else if (words.length === 2) {
    // Due parole: prima lettera di ciascuna + prima lettera della seconda parola
    initials = words[0].charAt(0).toUpperCase() + 
               words[1].substring(0, 2).toUpperCase();
  } else {
    // Tre o più parole: prima lettera di ciascuna delle prime 3
    initials = words.slice(0, 3)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }
  
  // Assicurati che non superi i 3 caratteri
  return initials.substring(0, 3);
}

}