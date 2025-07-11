import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-matches-section',
  templateUrl: './matches-section.component.html',
  styleUrls: ['./matches-section.component.css']
})
export class MatchesSectionComponent implements OnInit, OnDestroy {
  @Input() upcomingMatches: any[] = [];
  
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
        this.getCountdown(this.upcomingMatches[0].date);
      }
    }, 1000);
  }
  
  ngOnDestroy() {
    // Pulisci l'intervallo quando il componente viene distrutto
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    
    // Aggiorna le dimensioni del carousel desktop in base alla viewport
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

  // Metodo per selezionare una partita su desktop
  selectDesktopMatch(index: number) {
    if (index >= 0 && index < this.upcomingMatches.length) {
      this.currentMatchIndex = index;
    }
  }

  // Mostra solo 3 card nella visualizzazione desktop
  displayedDesktopMatches(): any[] {
    if (this.upcomingMatches.length <= 3) {
      return this.upcomingMatches;
    }

    // Calcola quali 3 partite mostrare in base all'indice corrente
    const result = [];
    
    // Aggiungi partita precedente (se disponibile)
    if (this.currentMatchIndex > 0) {
      result.push(this.upcomingMatches[this.currentMatchIndex - 1]);
    } else {
      // Se siamo alla prima, mostriamo le prime tre
      return this.upcomingMatches.slice(0, 3);
    }
    
    // Aggiungi partita corrente
    result.push(this.upcomingMatches[this.currentMatchIndex]);
    
    // Aggiungi partita successiva (se disponibile)
    if (this.currentMatchIndex < this.upcomingMatches.length - 1) {
      result.push(this.upcomingMatches[this.currentMatchIndex + 1]);
    }
    
    // Se abbiamo meno di 3 partite, aggiungi un'altra (può succedere all'ultima partita)
    if (result.length < 3 && this.currentMatchIndex > 1) {
      result.unshift(this.upcomingMatches[this.currentMatchIndex - 2]);
    }
    
    return result;
  }
  
  // Metodo mobile - semplice come in teams
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
      // Swipe left - next match
      if (this.currentMobileIndex < this.upcomingMatches.length - 1) {
        this.currentMobileIndex++;
      }
    }
    if (this.touchEndX > this.touchStartX + 50) {
      // Swipe right - previous match
      if (this.currentMobileIndex > 0) {
        this.currentMobileIndex--;
      }
    }
  }

  // Metodi di formattazione
  getFormattedDate(date: Date): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'short' 
    };
    return dateObj.toLocaleDateString('it-IT', options);
  }

  getCountdown(date: Date): string {
    if (!date) return '';
    
    const now = new Date().getTime();
    const matchTime = new Date(date).getTime();
    const distance = matchTime - now;
    
    // Sempre mostrare il countdown, anche se negativo
    if (distance < 0) {
      // Calcola il tempo trascorso dall'inizio della partita
      const elapsed = Math.abs(distance);
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 3) {
        return "Partita conclusa";
      } else {
        return `${hours}h ${minutes}m dall'inizio`;
      }
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Formato compatto
    if (days > 0) {
      return `${days}g ${hours}h`;
    } else {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  }
}