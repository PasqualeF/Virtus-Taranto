import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';

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
      state('pulse', style({ transform: 'scale(1.1)' })),
      transition('normal <=> pulse', animate('500ms ease-in-out'))
    ])
  ]
})
export class ShopComponent implements OnInit {
  countdownDate: Date = new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 giorni da oggi
  countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  
  emailPlaceholder = 'La tua email';
  isSubscribed = false;
  isHovered = false;

  constructor() {}

  ngOnInit(): void {
    this.startCountdown();
  }

  private startCountdown(): void {
    setInterval(() => {
      const now = new Date().getTime();
      const distance = this.countdownDate.getTime() - now;

      this.countdown.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.countdown.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.countdown.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.countdown.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    }, 1000);
  }

  onSubscribe(email: string): void {
    if (email && email.includes('@')) {
      // Qui andrebbe implementata la logica di sottoscrizione
      this.isSubscribed = true;
      // Reset dopo 3 secondi
      setTimeout(() => this.isSubscribed = false, 3000);
    }
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }

  onMouseLeave(): void {
    this.isHovered = false;
  }
}