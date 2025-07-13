// src/app/core/interfaces/strapi-squad.interfaces.ts

import { StrapiImageV5 } from '../service/strapi-base.service';

export interface StrapiSquad {
  id: number;
  documentId: string;
  name: string;
  photoUrl: string | null;
  tipo: string; 
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  foto?: StrapiImageV5;
  roster?: StrapiPlayer[];
  results?: StrapiResult[];
  standings?: StrapiStanding[];
}

export interface StrapiPlayer {
  id: number;
  documentId: string;
  numero: number;
  nome: string;
  cognome: string;
  posizione: string;
  dataNascita: string;
  altezza: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface StrapiResult {
  id: number;
  documentId: string;
  casa: string;
  trasferta: string;
  risultato: string;
  data: string;
  luogo: string;
  giornata: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface StrapiStanding {
  id: number;
  documentId: string;
  squadra: string;
  punti: number;
  pos?: number;
  vittorie?: number;
  sconfitte?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}