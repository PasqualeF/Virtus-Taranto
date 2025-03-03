import { Component, OnInit } from '@angular/core';

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
export class StoryComponent implements OnInit {
  storyCards: StoryCard[] = [
    {
      id: 1,
      title: 'Le nostre origini',
      brief: 'La storia di Virtus Taranto inizia con passione e dedizione...',
      image: 'assets/Story/virtus_1.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 2,
      title: 'Il nostro supporto',
      brief: 'I nostri tifosi sono il cuore pulsante della squadra...',
      image: 'assets/Story/support_1.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 3,
      title: 'La nostra pallavolo',
      brief: 'La sezione pallavolo ha raggiunto traguardi importanti...',
      image: 'assets/Story/pallavolo_2.jpeg',
      link: '/who-else/storia'
    },
    {
      id: 4,
      title: 'Baskin: sport per tutti',
      brief: 'Il baskin rappresenta il nostro impegno per l\'inclusività...',
      image: 'assets/Story/baskin.jpeg',
      link: '/who-else/storia'
    }
  ];

  constructor() { }

  ngOnInit(): void { }
}