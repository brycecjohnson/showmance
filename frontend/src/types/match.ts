export interface Match {
  place_id: string;
  name: string;
  photo_url: string | null;
  matched_at: string;
  visited: boolean;
  visited_at: string | null;
  rating: number;
  price_level: number | null;
  cuisines: string[];
  address: string;
  distance_mi: number | null;
  maps_url?: string;
}
