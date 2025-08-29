import { Component, OnInit, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

interface StoryCard {
  id: number;
  title: string;
  brief: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.css']
})
export class StoryComponent implements OnInit, AfterViewInit {
  @ViewChild('carouselTrack', { static: false }) carouselTrack!: ElementRef;
  @ViewChild('carouselContainer', { static: false }) carouselContainer!: ElementRef;

  storyCards: StoryCard[] = [
    {
      id: 1,
      title: 'Virtus Taranto: Minibasket & Settore Giovanile Maschile',
      /*brief: 'La storia della Virtus Taranto inizia con passione e dedizione. Dal 
      primo giorno abbiamo creduto nei valori dello sport.',*/
      brief:'', 
      image: 'assets/Story/virtus_1.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 2,
      title: 'Support_o Taranto: Settore Giovanile Femminile ',
      brief: 'Le nostre ragazze sono passione, impegno e amicizia. Insieme costruiscono un gruppo unito dentro e fuori dal campo.',
      image: 'assets/Story/support_1.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 3,
      title: 'Polisportiva 74020: Minivolley & Settore Giovanile Femminile',
      brief: 'Nel nostro campo si salta, si suda, si vince insieme. La pallavolo è la nostra passione che condividiamo ogni giorno.',
      image: 'assets/Story/pallavolo_2.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 4,
      title: 'Ash Baskin: Basket Integrato',
      brief: 'Il baskin rappresenta il nostro impegno per l\'inclusività. Crediamo che lo sport sia davvero per tutti.',
      image: 'assets/Story/baskin.jpeg',
      link: '/who-else/storia'
    }
  ];

  // Mobile carousel properties
  isMobile = false;
  currentSlide = 0;
  isTransitioning = false;
  
  // Touch/drag properties
  private startX = 0;
  private currentX = 0;
  private isDragging = false;
  private dragThreshold = 50;
  
  // Auto-play properties - MIGLIORATO
  private autoplayInterval: any;
  private autoplayDuration = 6000; // Aumentato a 6 secondi
  private isUserInteracting = false; // Nuovo flag per interazione utente
  private interactionTimeout: any;
 private isAutoplayPaused = false;

  constructor() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngAfterViewInit(): void {
    if (this.isMobile) {
      this.setupTouchEvents();
      this.startAutoplay();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
    if (this.isMobile && this.carouselTrack) {
      this.updateCarouselPosition();
    }
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 1024;
    
    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }
  }

  private setupTouchEvents() {
    if (!this.carouselContainer) return;

    const container = this.carouselContainer.nativeElement;

    // Touch events
    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Mouse events for desktop testing
    container.addEventListener('mousedown', this.handleMouseStart.bind(this));
    container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    container.addEventListener('mouseup', this.handleMouseEnd.bind(this));
    container.addEventListener('mouseleave', this.handleMouseEnd.bind(this));

    // Prevent default drag on images
    container.addEventListener('dragstart', (e: Event) => e.preventDefault());
  }

  private handleTouchStart(e: TouchEvent) {
    this.handleStart(e.touches[0].clientX);
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    this.handleMove(e.touches[0].clientX);
  }

  private handleTouchEnd() {
    this.handleEnd();
  }

  private handleMouseStart(e: MouseEvent) {
    this.handleStart(e.clientX);
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      e.preventDefault();
      this.handleMove(e.clientX);
    }
  }

  private handleMouseEnd() {
    this.handleEnd();
  }

  private handleStart(clientX: number) {
    this.startX = clientX;
    this.currentX = clientX;
    this.isDragging = true;
    this.pauseAutoplay();
    
    if (this.carouselTrack) {
      this.carouselTrack.nativeElement.style.transition = 'none';
    }
  }
  
  private pauseAutoplay() {
    this.isAutoplayPaused = true;
  }
  private handleMove(clientX: number) {
    if (!this.isDragging || !this.carouselTrack) return;

    this.currentX = clientX;
    const deltaX = this.currentX - this.startX;
    const currentTransform = this.getCurrentTransform();
    const newTransform = currentTransform + deltaX;

    this.carouselTrack.nativeElement.style.transform = `translateX(${newTransform}px)`;
  }

  private handleEnd() {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    this.isDragging = false;
    
    if (this.carouselTrack) {
      this.carouselTrack.nativeElement.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }

    if (Math.abs(deltaX) > this.dragThreshold) {
      if (deltaX > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    } else {
      this.updateCarouselPosition();
    }

    this.resumeAutoplay();
  }
  resumeAutoplay() {
    throw new Error('Method not implemented.');
  }

  private getCurrentTransform(): number {
    if (!this.carouselTrack) return 0;
    
    const style = window.getComputedStyle(this.carouselTrack.nativeElement);
    const transform = style.getPropertyValue('transform');
    
    if (transform === 'none') return 0;
    
    const matrix = transform.match(/matrix\((.+)\)/);
    if (matrix) {
      const values = matrix[1].split(', ');
      return parseFloat(values[4]) || 0;
    }
    
    return 0;
  }

  nextSlide() {
    if (this.isTransitioning) return;
    
    this.setUserInteracting(true);
    this.isTransitioning = true;
    this.currentSlide = (this.currentSlide + 1) % this.storyCards.length;
    this.updateCarouselPosition();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  prevSlide() {
    if (this.isTransitioning) return;
    
    this.setUserInteracting(true);
    this.isTransitioning = true;
    this.currentSlide = this.currentSlide === 0 ? this.storyCards.length - 1 : this.currentSlide - 1;
    this.updateCarouselPosition();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  goToSlide(index: number) {
    if (this.isTransitioning || index === this.currentSlide) return;
    
    this.setUserInteracting(true);
    this.isTransitioning = true;
    this.currentSlide = index;
    this.updateCarouselPosition();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  // NUOVO: Gestisce lo stato di interazione utente
  private setUserInteracting(isInteracting: boolean) {
    this.isUserInteracting = isInteracting;
    
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
    }
    
    if (isInteracting) {
      // L'utente sta interagendo, riprendi l'autoplay dopo 4 secondi
      this.interactionTimeout = setTimeout(() => {
        this.isUserInteracting = false;
      }, 4000);
    }
  }

  private updateCarouselPosition() {
    if (!this.carouselTrack) return;

    const slideWidth = this.getSlideWidth();
    const offset = -this.currentSlide * slideWidth;
    
    this.carouselTrack.nativeElement.style.transform = `translateX(${offset}px)`;
  }

  private getSlideWidth(): number {
    if (!this.carouselContainer) return 0;
    return this.carouselContainer.nativeElement.offsetWidth;
  }

  private startAutoplay() {
    if (!this.isMobile) return;
    
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      // MIGLIORATO: Controlla se l'utente sta interagendo
      if (!this.isUserInteracting && !this.isDragging && !this.isTransitioning) {
        this.nextSlide();
      }
    }, this.autoplayDuration);
  }

  private stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
  }

  onCardClick(card: StoryCard) {
    this.setUserInteracting(true); // Pausa l'autoplay quando clicca
    // Handle card click for navigation
    console.log('Navigate to:', card.link);
    // Implement navigation logic here
  }

  // Utility methods for template
  getProgressPercentage(): number {
    return ((this.currentSlide + 1) / this.storyCards.length) * 100;
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }
}