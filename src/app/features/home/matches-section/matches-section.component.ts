import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-matches-section',
  templateUrl: './matches-section.component.html',
  styleUrls: ['./matches-section.component.css']
})
export class MatchesSectionComponent implements OnInit {
  @Input() upcomingMatches: any[] = [];
  currentMatchIndex = 0;
  cardWidth = 480;
  cardMargin = 48;

  ngOnInit() {
    setInterval(() => {
      this.getCountdown(this.upcomingMatches[0].date);
    }, 1000);
  }

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

  getFormattedDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'short' 
    };
    return date.toLocaleDateString('it-IT', options);
  }

  getCountdown(date: Date): string {
    const now = new Date().getTime();
    const matchTime = new Date(date).getTime();
    const distance = matchTime - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return `${days}g ${hours}h ${minutes}m ${seconds}s`;
  }
}