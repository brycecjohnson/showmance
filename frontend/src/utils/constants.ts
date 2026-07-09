export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api.forkd.app';

export const ROOM_CODE_PREFIX = 'EATS';

export interface CuisineOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const CUISINES: readonly CuisineOption[] = [
  { id: 'italian', name: 'Italian', emoji: '🍝', color: '#c0392b' },
  { id: 'mexican', name: 'Mexican', emoji: '🌮', color: '#e67e22' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡', color: '#d35400' },
  { id: 'sushi', name: 'Sushi & Japanese', emoji: '🍣', color: '#16a085' },
  { id: 'thai', name: 'Thai', emoji: '🌶️', color: '#8e44ad' },
  { id: 'indian', name: 'Indian', emoji: '🍛', color: '#f39c12' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', color: '#e74c3c' },
  { id: 'burgers', name: 'Burgers', emoji: '🍔', color: '#a04000' },
  { id: 'bbq', name: 'BBQ', emoji: '🍖', color: '#6e2c00' },
  { id: 'mediterranean', name: 'Mediterranean', emoji: '🥙', color: '#2980b9' },
  { id: 'korean', name: 'Korean', emoji: '🍲', color: '#c0392b' },
  { id: 'vietnamese', name: 'Vietnamese', emoji: '🍜', color: '#27ae60' },
  { id: 'seafood', name: 'Seafood', emoji: '🦞', color: '#2c3e50' },
  { id: 'breakfast', name: 'Breakfast & Brunch', emoji: '🥞', color: '#d4ac0d' },
  { id: 'steakhouse', name: 'Steakhouse', emoji: '🥩', color: '#7b241c' },
  { id: 'ramen', name: 'Ramen & Noodles', emoji: '🍜', color: '#af601a' },
  { id: 'vegetarian', name: 'Vegetarian', emoji: '🥗', color: '#229954' },
  { id: 'cafe', name: 'Café & Bakery', emoji: '☕', color: '#795548' },
  { id: 'wings', name: 'Wings & Bar Food', emoji: '🍗', color: '#b7950b' },
  { id: 'dessert', name: 'Dessert', emoji: '🍰', color: '#d81b60' },
] as const;

export const PRICE_LEVELS = [
  { level: 1, label: '$', description: 'Cheap eats' },
  { level: 2, label: '$$', description: 'Casual' },
  { level: 3, label: '$$$', description: 'Nice night out' },
  { level: 4, label: '$$$$', description: 'Splurge' },
] as const;

export function priceLabel(level: number | null): string {
  if (level == null || level < 0) return '';
  if (level === 0) return 'Free';
  return '$'.repeat(Math.min(level, 4));
}

export const RADIUS_OPTIONS = [
  { miles: 1, meters: 1609 },
  { miles: 3, meters: 4828 },
  { miles: 5, meters: 8047 },
  { miles: 10, meters: 16093 },
] as const;

export const SWIPE_THRESHOLD = 100;
export const CARD_ROTATION_FACTOR = 15;
export const CARDS_PREFETCH_THRESHOLD = 5;
export const CARDS_BATCH_SIZE = 20;

export const STORAGE_KEYS = {
  ROOM_CODE: 'forkd_room_code',
  PARTNER_ID: 'forkd_partner_id',
  ONBOARDING_COMPLETE: 'forkd_onboarding_complete',
  LAST_SEEN_MATCHES: 'forkd_last_seen_matches',
  INSTALL_DISMISSED: 'forkd_install_dismissed',
} as const;
