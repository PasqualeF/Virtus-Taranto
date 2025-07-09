// achievement.model.ts
export interface Achievement {
  id: number;
  year: string;
  title: string;
  description: string;
  icon: string;
  societa: 'Virtus Taranto' | 'Polisportiva 74020' | 'Support_O';
  featured: boolean;
  order: number;
}

export interface AchievementData {
  id: number;
  documentId: string;
  year: string;
  title: string;
  description: string;
  icon: string;
  societa: string;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}