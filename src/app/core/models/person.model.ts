export interface OrganigrammaData {
  id: number;
  documentId: string;
  societa: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  staff: StaffMember[];
}

export interface StaffMember {
  id: number;
  nome: string;
  ruolo: string;
  livello: number;
  foto: string;
  email: string;
  telefono: string;
  descrizione: string;
  image?: Immagine;
  imageBase64?: string;
}

export interface Immagine {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail: ImageFormat;
    small: ImageFormat;
    medium: ImageFormat;
    large: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
}

export interface ImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  url: string;
}