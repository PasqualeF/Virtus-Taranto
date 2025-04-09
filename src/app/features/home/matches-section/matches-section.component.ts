import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-matches-section',
  templateUrl: './matches-section.component.html',
  styleUrls: ['./matches-section.component.css']
})
export class MatchesSectionComponent implements OnInit, OnDestroy {
  @Input() upcomingMatches: any[] = [];
  @ViewChild('mobileCarousel') mobileCarousel: ElementRef | undefined;
  
  currentMatchIndex = 0;
  currentMobileIndex = 0;
  cardWidth = 480;
  cardMargin = 48;
  isMobile = false;
  touchStartX = 0;
  autoSlideInterval: any;
  countdownInterval: any;

  constructor() {}

  ngOnInit() {
    this.checkScreenSize();
    
    // Avvia il countdown e lo aggiorna ogni secondo
    this.countdownInterval = setInterval(() => {
      if (this.upcomingMatches && this.upcomingMatches.length > 0) {
        this.getCountdown(this.upcomingMatches[0].date);
      }
    }, 1000);
    
    // Imposta lo scorrimento automatico solo se necessario
    if (this.isMobile && this.upcomingMatches.length > 1) {
      // Piccolo ritardo per assicurarsi che tutto sia caricato
      setTimeout(() => {
        this.startAutoSlide();
      }, 500);
    }
  }
  
  ngOnDestroy() {
    // Pulisci gli intervalli quando il componente viene distrutto
    this.stopAutoSlide();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  @HostListener('window:resize')
  checkScreenSize() {
    const wasAlreadyMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    
    // Se siamo passati da desktop a mobile, avvia lo scorrimento automatico
    if (!wasAlreadyMobile && this.isMobile) {
      this.startAutoSlide();
    }
    // Se siamo passati da mobile a desktop, ferma lo scorrimento automatico
    else if (wasAlreadyMobile && !this.isMobile) {
      this.stopAutoSlide();
    }
    
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
  
  // Metodi per il carousel mobile
  nextMobileMatch() {
    if (this.currentMobileIndex < this.upcomingMatches.length - 1) {
      this.currentMobileIndex++;
      this.scrollToCurrentSlide();
      this.restartAutoSlide();
    }
  }
  
  previousMobileMatch() {
    if (this.currentMobileIndex > 0) {
      this.currentMobileIndex--;
      this.scrollToCurrentSlide();
      this.restartAutoSlide();
    }
  }
  
  goToSlide(index: number) {
    this.currentMobileIndex = index;
    this.scrollToCurrentSlide();
    this.restartAutoSlide();
  }
  
  scrollToCurrentSlide() {
    if (this.mobileCarousel) {
      const container = this.mobileCarousel.nativeElement;
      const slideWidth = container.clientWidth;
      const scrollPosition = this.currentMobileIndex * slideWidth;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }
  
  // Gestione touch per mobile
  onTouchStart(event: TouchEvent) {
    this.stopAutoSlide();
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diffX = this.touchStartX - touchEndX;

    if (Math.abs(diffX) > 50) { // Soglia di swipe
      if (diffX > 0 && this.currentMobileIndex < this.upcomingMatches.length - 1) {
        // Swipe a sinistra - avanti
        this.nextMobileMatch();
      } else if (diffX < 0 && this.currentMobileIndex > 0) {
        // Swipe a destra - indietro
        this.previousMobileMatch();
      }
    }
    
    if (this.upcomingMatches.length > 1) {
      this.startAutoSlide();
    }
  }
  
  // Auto-rotazione delle slide su mobile
  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      if (this.currentMobileIndex < this.upcomingMatches.length - 1) {
        this.nextMobileMatch();
      } else {
        this.currentMobileIndex = 0;
        this.scrollToCurrentSlide();
      }
    }, 5000); // Cambia slide ogni 5 secondi
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
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