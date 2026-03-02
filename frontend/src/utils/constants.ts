export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api.showmance.app';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const ROOM_CODE_PREFIX = 'SHOW';

export const GENRES = [
  'Action',
  'Comedy',
  'Thriller',
  'Sci-Fi',
  'Horror',
  'Romance',
  'Drama',
  'Documentary',
  'Animation',
  'Crime',
  'Mystery',
  'Fantasy',
  'Reality',
  'Western',
  'Musical',
  'War',
  'Family',
  'History',
] as const;

export type GenreName = (typeof GENRES)[number];

export const STREAMING_SERVICES = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'hulu', name: 'Hulu' },
  { id: 'disney_plus', name: 'Disney+' },
  { id: 'hbo_max', name: 'HBO Max' },
  { id: 'amazon_prime', name: 'Amazon Prime' },
  { id: 'apple_tv', name: 'Apple TV+' },
  { id: 'peacock', name: 'Peacock' },
  { id: 'paramount_plus', name: 'Paramount+' },
] as const;

export const ERAS = [
  { id: 'classics', label: 'Classics', range: 'Pre-2000' },
  { id: '2000s', label: '2000s', range: '2000-2009' },
  { id: '2010s', label: '2010s', range: '2010-2019' },
  { id: 'new', label: 'New Releases', range: 'Last 2 years' },
  { id: 'all', label: 'All Eras', range: 'Everything' },
] as const;

export const SWIPE_THRESHOLD = 100;
export const CARD_ROTATION_FACTOR = 15;
export const CARDS_PREFETCH_THRESHOLD = 5;
export const CARDS_BATCH_SIZE = 20;

export const STORAGE_KEYS = {
  ROOM_CODE: 'showmance_room_code',
  PARTNER_ID: 'showmance_partner_id',
  MODE: 'showmance_mode',
  ONBOARDING_COMPLETE: 'showmance_onboarding_complete',
  LAST_SEEN_MATCHES: 'showmance_last_seen_matches',
  INSTALL_DISMISSED: 'showmance_install_dismissed',
} as const;
