// shop-preview.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-shop-preview',
  templateUrl: './shop-preview.component.html',
  styleUrls: ['./shop-preview.component.css']
})
export class ShopPreviewComponent implements OnInit, OnDestroy {
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

  products = [
    { 
      name: 'Maglia Ufficiale', 
      imageUrl: 'assets/shop/lebron.jpg',
      description: 'Indossa i colori della tua squadra del cuore'
    },
    { 
      name: 'Hoodie Premium', 
      imageUrl: 'assets/shop/hoodie.jpg',
      description: 'Comfort e stile per ogni occasione'
    },
    { 
      name: 'Borraccia Termica', 
      imageUrl: 'assets/shop/bott.jpg',
      description: 'Resta sempre idratato con stile'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startCountdown() {
    this.updateCountdown();
    
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown() {
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

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  notifyMe() {
    // Qui puoi implementare la logica per le notifiche
    alert('Ti avviseremo quando lo shop sarà disponibile! 🛍️');
  }
}