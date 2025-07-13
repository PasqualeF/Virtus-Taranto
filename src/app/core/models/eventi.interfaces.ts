// eventi.interfaces.ts
import { StrapiImageV5 } from 'src/app/core/service/strapi-base.service';

export interface EventoCategoria {
  id: number;
  documentId: string;
  nome: string;
  descrizione?: string;
  colore?: string;
  icona?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface EventoProgrammaItem {
  id: number;
  orario: string;
  attivita: string;
  descrizione?: string;
  durata?: string;
  relatore?: string;
}

export interface EventoIscrizione {
  id: number;
  documentId: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  eta?: number;
  note?: string;
  dataIscrizione: string;
  confermata: boolean;
  evento: {
    id: number;
    documentId: string;
    titolo: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Evento {
  id: number;
  documentId: string;
  titolo: string;
  descrizione: string;
  dataInizio: string;
  dataFine?: string;
  orarioInizio: string;
  orarioFine?: string;
  location: string;
  richiedeIscrizione: boolean;
  postiDisponibili?: number;
  postiOccupati?: number;
  etaMinima?: number;
  etaMaxima?: number;
  costo?: number;
  istruzioni?: string;
  stato: 'PROGRAMMATO' | 'IN_CORSO' | 'CONCLUSO' | 'ANNULLATO';
  
  // Relazioni
  categoria?: EventoCategoria;
  immagine?: StrapiImageV5;
  programma?: EventoProgrammaItem[];
  iscrizioni?: EventoIscrizione[];
  
  // Metadati Strapi
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface EventoFormData {
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  eta?: number;
  note?: string;
}

export interface EventoFilters {
  categoria?: string;
  stato?: string;
  dataInizio?: string;
  dataFine?: string;
  richiedeIscrizione?: boolean;
  postiDisponibili?: boolean;
}