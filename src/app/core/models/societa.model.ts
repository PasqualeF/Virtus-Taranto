export interface Societa {
    nome: string;
    logo: string;
    storia: string;
    valori: string[];
    palmares: Achievement[];
    descrizione: string;
    indirizzo: string;
    telefono: string;
    email: string;
    sito: string;
    expanded?: boolean;
    documentoUrl :string;
  }


  export interface Achievement {
    anno: string;
    titolo: string;
    descrizione: string;
  }

