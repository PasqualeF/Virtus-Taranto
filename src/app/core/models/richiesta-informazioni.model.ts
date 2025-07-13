// src/app/core/models/richiesta-informazioni.model.ts

export interface RichiestaInformazioni {
  id?: number;
  documentId?: string; // Strapi v5 usa documentId invece di id per l'identificazione
  nome: string;
  email: string;
  telefono?: string;
  societa: string;
  messaggio: string;
  elaborata?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  locale?: string; // Strapi v5 aggiunge locale
}

export interface RichiestaInformazioniCreate {
  nome: string;
  email: string;
  telefono?: string;
  societa: string;
  messaggio: string;
  elaborata?: boolean;
}