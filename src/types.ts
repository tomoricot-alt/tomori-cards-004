export type CardStatus = 'new' | 'known' | 'again';

export interface Deck {
  id: string;
  name: string;
  subject: string;
  createdAt: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  status: CardStatus;
  updatedAt: number;
}

export interface AppData {
  version: 1;
  decks: Deck[];
  cards: Card[];
}

export type StudyMode = 'all' | 'review';
