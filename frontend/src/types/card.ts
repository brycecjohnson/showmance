import type { MediaMode } from './room';

export interface CastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Card {
  tmdb_id: number;
  media_type: MediaMode;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_year: number;
  rating: number;
  genre_ids: number[];
  genre_names: string[];
  runtime?: number;
  seasons_count?: number;
  episodes_count?: number;
  streaming_services?: string[];
  cast?: CastMember[];
  director?: string;
}

export interface GenreCard {
  name: string;
  color: string;
  icon: string;
}

export interface CardDeck {
  cards: Card[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
}
