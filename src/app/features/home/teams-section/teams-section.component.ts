import { Component, Input, OnInit, HostListener } from '@angular/core';
import { TeamSmall } from 'src/app/core/models/squad.model';

@Component({
  selector: 'app-teams-section',
  templateUrl: './teams-section.component.html',
  styleUrls: ['./teams-section.component.css']
})
export class TeamsSectionComponent implements OnInit {
  @Input() teams: TeamSmall[] = [];
  
  // Desktop navigation
  currentTeamIndex = 0;
  
  // Mobile navigation
  currentMobileIndex = 0;
  isMobile = false;

  ngOnInit() {
    this.checkIfMobile();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkIfMobile();
  }

  private checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Desktop methods
  get visibleTeams() {
    return this.teams.slice(this.currentTeamIndex, this.currentTeamIndex + 3);
  }

  nextTeams() {
    if (this.currentTeamIndex + 3 < this.teams.length) {
      this.currentTeamIndex += 3;
    }
  }

  previousTeams() {
    if (this.currentTeamIndex - 3 >= 0) {
      this.currentTeamIndex -= 3;
    }
  }

  // Mobile methods
  goToTeam(index: number) {
    this.currentMobileIndex = index;
  }

  // Touch handling for mobile swipe
  private touchStartX = 0;
  private touchEndX = 0;

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
      // Swipe left - next team
      if (this.currentMobileIndex < this.teams.length - 1) {
        this.currentMobileIndex++;
      }
    }
    if (this.touchEndX > this.touchStartX + 50) {
      // Swipe right - previous team
      if (this.currentMobileIndex > 0) {
        this.currentMobileIndex--;
      }
    }
  }
}