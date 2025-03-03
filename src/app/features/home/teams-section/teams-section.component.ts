import { Component, Input } from '@angular/core';
import { TeamSmall } from 'src/app/core/models/squad.model';

interface Team {
  name: string;
  imageUrl: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-teams-section',
  templateUrl: './teams-section.component.html',
  styleUrls: ['./teams-section.component.css']
})
export class TeamsSectionComponent {
  @Input() teams: TeamSmall[] = [];
  currentTeamIndex = 0;

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
}