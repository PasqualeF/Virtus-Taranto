import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('pulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulse', style({ transform: 'scale(1.05)' })),
      transition('normal <=> pulse', animate('300ms ease-in-out'))
    ]),
    trigger('glow', [
      state('normal', style({ 
        boxShadow: '0 0 20px rgba(255, 102, 0, 0.3)' 
      })),
      state('glow', style({ 
        boxShadow: '0 0 40px rgba(255, 102, 0, 0.6)' 
      })),
      transition('normal <=> glow', animate('1s ease-in-out'))
    ])
  ]
})
export class ShopComponent implements OnInit, OnDestroy {
  // Data target: 30 settembre 2025
  targetDate = new Date('2025-09-30T00:00:00').getTime();
  
  countdown: CountdownTime = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  private intervalId: any;
  isLaunched = false;
  emailPlaceholder = 'inserisci la tua email per gli aggiornamenti';
  isSubscribed = false;
  isHovered = false;
  isGlowing = false;

  constructor() {}

  ngOnInit(): void {
    this.startCountdown();
    this.startGlowEffect();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startCountdown(): void {
    this.updateCountdown();
    
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const timeLeft = this.targetDate - now;

    if (timeLeft > 0) {
      this.countdown = {
        days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((timeLeft % (1000 * 60)) / 1000)
      };
      this.isLaunched = false;
    } else {
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      this.isLaunched = true;
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }
  }

  private startGlowEffect(): void {
    setInterval(() => {
      this.isGlowing = !this.isGlowing;
    }, 2000);
  }

  onSubscribe(email: string): void {
    if (email && email.includes('@')) {
      this.isSubscribed = true;
      this.emailPlaceholder = 'Grazie! Ti contatteremo presto 🎉';
      
      // Reset dopo 5 secondi
      setTimeout(() => {
        this.isSubscribed = false;
        this.emailPlaceholder = 'inserisci la tua email per gli aggiornamenti';
      }, 5000);
    }
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }

  onMouseLeave(): void {
    this.isHovered = false;
  }
}