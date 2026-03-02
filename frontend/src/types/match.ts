import type { MediaMode } from './room';

export interface Match {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: MediaMode;
  matched_at: string;
  watched: boolean;
  watched_at: string | null;
  rating: number;
  release_year: number;
  genre_names: string[];
  streaming_services: string[];
}
