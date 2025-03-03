import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  sponsors = [
    { name: 'Sponsor 1', imageUrl: 'assets/fondazione251.png' },
    { name: 'Sponsor 2', imageUrl: 'assets/bialetti.png' },
    { name: 'Sponsor 3', imageUrl: 'assets/nu.png' },
    { name: 'Sponsor 4', imageUrl: 'assets/suite.png' },
    { name: 'Sponsor 5', imageUrl: 'assets/vibe.png' },
    { name: 'Sponsor 6', imageUrl: 'assets/nu.png' },
    { name: 'Sponsor 7', imageUrl: 'assets/suite.png' },
    { name: 'Sponsor 8', imageUrl: 'assets/vibe.png' }
  ];
  constructor() { }
  ngOnInit(): void {
    
  }
  pauseAnimation(element: HTMLElement) {
    element.style.animationPlayState = 'paused';
  }

  resumeAnimation(element: HTMLElement) {
    element.style.animationPlayState = 'running';
  }
}
