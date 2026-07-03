export interface RestaurantCard {
  place_id: string;
  name: string;
  photo_url: string | null;
  cuisines: string[];
  rating: number;
  rating_count: number;
  price_level: number | null;
  address: string;
  lat?: number;
  lng?: number;
  distance_mi: number | null;
  open_now?: boolean;
  description?: string;
  phone?: string;
  website?: string;
  hours?: string[];
  maps_url?: string;
}

export interface CuisineCard {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface CardDeck {
  cards: RestaurantCard[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
}
