// src/app/core/models/media.model.ts

export interface Foto {
    id: number;
    url: string;
    thumbnail: string;
    titolo: string;
    descrizione: string;
    data: Date;
    categoria: string;
    stagione: string;
  }
  
  export interface Video {
    id: number;
    url: string;
    thumbnail: string;
    titolo: string;
    descrizione: string;
    data: Date;
    categoria: string;
    stagione: string;
  }
  
  export interface Articolo {
    id: number;
    titolo: string;
    excerpt: string;
    contenuto: string;
    data: Date;
    fonte: string;
    url?: string;
    anno: string;
  }
  
  export interface MediaData {
    foto: Foto[];
    video: Video[];
    articoli: Articolo[];
  }
  
  export interface SocietaMediaMap {
    [key: string]: MediaData;
  }