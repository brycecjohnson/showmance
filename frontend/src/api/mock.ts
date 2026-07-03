/**
 * Mock API responses for local development without a backend.
 * Enabled when VITE_MOCK_API=true or when the real API is unreachable.
 *
 * The mock room is "located" in downtown Austin, TX — fixture restaurants
 * carry precomputed distances from that point.
 */

import type { RestaurantCard } from '../types/card';
import type { Match } from '../types/match';
import type { Room } from '../types/room';
import type { SwipeResult } from '../types/swipe';
import { ROOM_CODE_PREFIX } from '../utils/constants';

function uuid(): string {
  return crypto.randomUUID();
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${ROOM_CODE_PREFIX}-${code}`;
}

const MOCK_LOCATION = { lat: 30.2672, lng: -97.7431, label: 'Downtown Austin, TX' };

function mapsUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

function photo(id: string): string {
  return `https://images.unsplash.com/${id}?w=500&q=80&auto=format`;
}

const MOCK_CARDS: RestaurantCard[] = [
  { place_id: 'mock-terra-rossa', name: 'Terra Rossa', photo_url: photo('photo-1414235077428-338989a2e8c0'), cuisines: ['Italian', 'Wine Bar'], rating: 4.6, rating_count: 812, price_level: 3, address: '412 Congress Ave, Austin, TX', distance_mi: 0.3, open_now: true, description: 'Handmade pasta and wood-fired mains in a candlelit dining room.', phone: '(512) 555-0142', website: 'https://example.com/terra-rossa', hours: ['Mon–Thu 5–10 PM', 'Fri–Sat 5–11 PM', 'Sun 5–9 PM'], maps_url: mapsUrl('Terra Rossa', '412 Congress Ave, Austin, TX') },
  { place_id: 'mock-el-camino', name: 'El Camino Taqueria', photo_url: photo('photo-1551504734-5ee1c4a1479b'), cuisines: ['Mexican', 'Tacos'], rating: 4.7, rating_count: 2304, price_level: 1, address: '1204 E 6th St, Austin, TX', distance_mi: 0.9, open_now: true, description: 'Street-style tacos on fresh corn tortillas, plus agua frescas.', phone: '(512) 555-0177', hours: ['Daily 8 AM–10 PM'], maps_url: mapsUrl('El Camino Taqueria', '1204 E 6th St, Austin, TX') },
  { place_id: 'mock-golden-wok', name: 'Golden Wok', photo_url: photo('photo-1525755662778-989d0524087e'), cuisines: ['Chinese', 'Dim Sum'], rating: 4.3, rating_count: 987, price_level: 2, address: '815 W 5th St, Austin, TX', distance_mi: 0.7, open_now: true, description: 'Cantonese classics and weekend dim sum carts.', maps_url: mapsUrl('Golden Wok', '815 W 5th St, Austin, TX') },
  { place_id: 'mock-kaiyo', name: 'Kaiyo Sushi Bar', photo_url: photo('photo-1579871494447-9811cf80d66c'), cuisines: ['Sushi & Japanese'], rating: 4.8, rating_count: 645, price_level: 4, address: '98 Rainey St, Austin, TX', distance_mi: 0.6, open_now: false, description: 'Omakase counter and a la carte nigiri from daily fish deliveries.', phone: '(512) 555-0101', website: 'https://example.com/kaiyo', hours: ['Tue–Sun 5–10 PM'], maps_url: mapsUrl('Kaiyo Sushi Bar', '98 Rainey St, Austin, TX') },
  { place_id: 'mock-bangkok-alley', name: 'Bangkok Alley', photo_url: photo('photo-1559314809-0d155014e29e'), cuisines: ['Thai'], rating: 4.5, rating_count: 1420, price_level: 2, address: '2021 Guadalupe St, Austin, TX', distance_mi: 1.4, open_now: true, description: 'Fiery curries and khao soi in a lively counter-service spot.', maps_url: mapsUrl('Bangkok Alley', '2021 Guadalupe St, Austin, TX') },
  { place_id: 'mock-saffron-house', name: 'Saffron House', photo_url: photo('photo-1585937421612-70a008356fbe'), cuisines: ['Indian'], rating: 4.4, rating_count: 758, price_level: 2, address: '3401 S Lamar Blvd, Austin, TX', distance_mi: 2.8, open_now: true, description: 'North Indian tandoor dishes with a generous lunch buffet.', maps_url: mapsUrl('Saffron House', '3401 S Lamar Blvd, Austin, TX') },
  { place_id: 'mock-via-313', name: 'Detroit Slice Co.', photo_url: photo('photo-1513104890138-7c749659a591'), cuisines: ['Pizza'], rating: 4.6, rating_count: 3105, price_level: 2, address: '61 Rainey St, Austin, TX', distance_mi: 0.6, open_now: true, description: 'Thick, crispy-edged Detroit-style squares and craft beer.', maps_url: mapsUrl('Detroit Slice Co.', '61 Rainey St, Austin, TX') },
  { place_id: 'mock-smash-bros', name: 'Smashville Burgers', photo_url: photo('photo-1568901346375-23c9450c58cd'), cuisines: ['Burgers', 'American'], rating: 4.5, rating_count: 1876, price_level: 1, address: '1600 S 1st St, Austin, TX', distance_mi: 1.8, open_now: true, description: 'Double-smashed patties with crispy edges, shakes, and crinkle fries.', maps_url: mapsUrl('Smashville Burgers', '1600 S 1st St, Austin, TX') },
  { place_id: 'mock-oak-pit', name: 'Oak Pit BBQ', photo_url: photo('photo-1529193591184-b1d58069ecdd'), cuisines: ['BBQ'], rating: 4.9, rating_count: 5210, price_level: 2, address: '900 E Cesar Chavez St, Austin, TX', distance_mi: 1.1, open_now: false, description: 'Post-oak smoked brisket and ribs until sold out. Expect a line.', hours: ['Wed–Sun 11 AM–3 PM'], maps_url: mapsUrl('Oak Pit BBQ', '900 E Cesar Chavez St, Austin, TX') },
  { place_id: 'mock-zeytin', name: 'Zeytin', photo_url: photo('photo-1540189549336-e6e99c3679fe'), cuisines: ['Mediterranean'], rating: 4.4, rating_count: 692, price_level: 2, address: '507 W Mary St, Austin, TX', distance_mi: 1.9, open_now: true, description: 'Mezze platters, wood-grilled kebabs, and warm pita baked to order.', maps_url: mapsUrl('Zeytin', '507 W Mary St, Austin, TX') },
  { place_id: 'mock-seoul-garden', name: 'Seoul Garden', photo_url: photo('photo-1590301157890-4810ed352733'), cuisines: ['Korean', 'BBQ'], rating: 4.6, rating_count: 1103, price_level: 3, address: '6808 N Lamar Blvd, Austin, TX', distance_mi: 4.7, open_now: true, description: 'Tabletop Korean BBQ with banchan spreads and bubbling stews.', maps_url: mapsUrl('Seoul Garden', '6808 N Lamar Blvd, Austin, TX') },
  { place_id: 'mock-pho-saigon', name: 'Phở Saigon', photo_url: photo('photo-1591814468924-caf88d1232e1'), cuisines: ['Vietnamese'], rating: 4.5, rating_count: 1544, price_level: 1, address: '2700 W Anderson Ln, Austin, TX', distance_mi: 5.6, open_now: true, description: 'Rich 12-hour broth phở, bánh mì, and iced Vietnamese coffee.', maps_url: mapsUrl('Phở Saigon', '2700 W Anderson Ln, Austin, TX') },
  { place_id: 'mock-tide-table', name: 'The Tide Table', photo_url: photo('photo-1615141982883-c7ad0e69fd62'), cuisines: ['Seafood'], rating: 4.7, rating_count: 934, price_level: 4, address: '208 W 4th St, Austin, TX', distance_mi: 0.4, open_now: false, description: 'Gulf oysters, whole grilled fish, and a serious raw bar.', phone: '(512) 555-0155', hours: ['Tue–Sat 4–11 PM'], maps_url: mapsUrl('The Tide Table', '208 W 4th St, Austin, TX') },
  { place_id: 'mock-yolk-story', name: 'Yolk Story', photo_url: photo('photo-1533089860892-a7c6f0a88666'), cuisines: ['Breakfast & Brunch'], rating: 4.4, rating_count: 2011, price_level: 2, address: '1900 S Congress Ave, Austin, TX', distance_mi: 2.2, open_now: true, description: 'All-day brunch: migas, pancake flights, and strong local coffee.', maps_url: mapsUrl('Yolk Story', '1900 S Congress Ave, Austin, TX') },
  { place_id: 'mock-prime-cut', name: 'The Prime Cut', photo_url: photo('photo-1600891964092-4316c288032e'), cuisines: ['Steakhouse'], rating: 4.7, rating_count: 1287, price_level: 4, address: '107 W 6th St, Austin, TX', distance_mi: 0.2, open_now: true, description: 'Dry-aged steaks, tableside martinis, and old-school service.', phone: '(512) 555-0190', website: 'https://example.com/prime-cut', hours: ['Daily 5–11 PM'], maps_url: mapsUrl('The Prime Cut', '107 W 6th St, Austin, TX') },
  { place_id: 'mock-tonkotsu-lab', name: 'Tonkotsu Lab', photo_url: photo('photo-1569718212165-3a8278d5f624'), cuisines: ['Ramen & Noodles'], rating: 4.6, rating_count: 1765, price_level: 2, address: '4664 Domain Dr, Austin, TX', distance_mi: 8.4, open_now: true, description: '18-hour tonkotsu broth, house-made noodles, late-night bowls.', maps_url: mapsUrl('Tonkotsu Lab', '4664 Domain Dr, Austin, TX') },
  { place_id: 'mock-green-fork', name: 'Green Fork', photo_url: photo('photo-1512621776951-a57141f2eefd'), cuisines: ['Vegetarian', 'Healthy'], rating: 4.3, rating_count: 587, price_level: 2, address: '801 Barton Springs Rd, Austin, TX', distance_mi: 1.3, open_now: true, description: 'Seasonal grain bowls, veggie burgers, and fresh-pressed juices.', maps_url: mapsUrl('Green Fork', '801 Barton Springs Rd, Austin, TX') },
  { place_id: 'mock-flour-bloom', name: 'Flour & Bloom', photo_url: photo('photo-1509042239860-f550ce710b93'), cuisines: ['Café & Bakery'], rating: 4.8, rating_count: 1432, price_level: 1, address: '2204 S 1st St, Austin, TX', distance_mi: 2.0, open_now: true, description: 'Laminated pastries, sourdough toasts, and single-origin espresso.', hours: ['Daily 7 AM–3 PM'], maps_url: mapsUrl('Flour & Bloom', '2204 S 1st St, Austin, TX') },
  { place_id: 'mock-wing-theory', name: 'Wing Theory', photo_url: photo('photo-1608039755401-742074f0548d'), cuisines: ['Wings & Bar Food'], rating: 4.2, rating_count: 876, price_level: 1, address: '415 E 6th St, Austin, TX', distance_mi: 0.5, open_now: true, description: 'Two dozen wing sauces, big screens, and local drafts.', maps_url: mapsUrl('Wing Theory', '415 E 6th St, Austin, TX') },
  { place_id: 'mock-sugar-mama', name: 'Sugar Mama\'s', photo_url: photo('photo-1551024506-0bccd828d307'), cuisines: ['Dessert'], rating: 4.7, rating_count: 1958, price_level: 1, address: '1905 S 1st St, Austin, TX', distance_mi: 2.1, open_now: false, description: 'Small-batch cupcakes, pies, and late-night cookie sandwiches.', hours: ['Tue–Sun 12–10 PM'], maps_url: mapsUrl("Sugar Mama's", '1905 S 1st St, Austin, TX') },
  { place_id: 'mock-chilis-lakeline', name: "Chili's Grill & Bar", photo_url: photo('photo-1552566626-52f8b828add9'), cuisines: ['American', 'Tex-Mex'], rating: 4.0, rating_count: 2450, price_level: 2, address: '1001 Barton Springs Rd, Austin, TX', distance_mi: 1.2, open_now: true, description: 'Fajitas, burgers, and margaritas — the reliable crowd-pleaser.', maps_url: mapsUrl("Chili's Grill & Bar", '1001 Barton Springs Rd, Austin, TX') },
];

// Track room solo state
let mockIsSolo = false;

// Track swipes and matches in memory for mock simulation
const mockSwiped = new Set<string>(); // place_ids filtered out of getCards
const mockMatches = new Map<string, Match>();
const mockVisited = new Set<string>();

function cardToMatch(card: RestaurantCard): Match {
  return {
    place_id: card.place_id,
    name: card.name,
    photo_url: card.photo_url,
    matched_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    visited: mockVisited.has(card.place_id),
    visited_at: mockVisited.has(card.place_id) ? new Date().toISOString() : null,
    rating: card.rating,
    price_level: card.price_level,
    cuisines: card.cuisines,
    address: card.address,
    distance_mi: card.distance_mi,
    maps_url: card.maps_url,
  };
}

// Seed some initial matches so the list isn't empty
function ensureSeedMatches() {
  if (mockMatches.size > 0) return;
  MOCK_CARDS.slice(0, 4).forEach((card) => {
    mockMatches.set(card.place_id, cardToMatch(card));
  });
}

export const mock = {
  createRoom(solo?: boolean): Promise<{ room_code: string; partner_id: string }> {
    mockIsSolo = solo ?? false;
    return delay({ room_code: randomCode(), partner_id: uuid() });
  },

  joinRoom(_code: string): Promise<{ partner_id: string }> {
    return delay({ partner_id: uuid() });
  },

  getRoom(code: string): Promise<Room> {
    return delay({
      room_code: code,
      created_at: new Date().toISOString(),
      partner_number: 1,
      other_partner_joined: !mockIsSolo,
      onboarding_complete: false,
      is_solo: mockIsSolo,
      location: MOCK_LOCATION,
      radius_m: 8047,
      price_levels: [1, 2, 3],
    });
  },

  savePreferences(): Promise<void> {
    return delay(undefined as unknown as void);
  },

  getCards(_code: string): Promise<{ cards: RestaurantCard[]; has_more: boolean }> {
    const filtered = MOCK_CARDS.filter((c) => !mockSwiped.has(c.place_id));
    // Shuffle
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return delay({ cards: shuffled, has_more: shuffled.length > 0 });
  },

  recordSwipe(payload: {
    place_id: string;
    direction: string;
    room_code?: string;
    partner_id?: string;
    name?: string;
  }): Promise<SwipeResult> {
    mockSwiped.add(payload.place_id);

    if (payload.direction === 'right') {
      // Solo mode: always match. Couples: 30% chance of match for fun
      const matched = mockIsSolo || Math.random() < 0.3;
      const card = MOCK_CARDS.find((c) => c.place_id === payload.place_id);
      if (matched && card) {
        const match = cardToMatch(card);
        match.matched_at = new Date().toISOString();
        mockMatches.set(card.place_id, match);
        return delay({
          matched: true,
          match: {
            place_id: card.place_id,
            name: card.name,
            photo_url: card.photo_url,
          },
        });
      }
    }
    return delay({ matched: false });
  },

  getMatches(_code: string): Promise<{ matches: Match[] }> {
    ensureSeedMatches();
    const matches = Array.from(mockMatches.values()).map((m) => ({
      ...m,
      visited: mockVisited.has(m.place_id),
      visited_at: mockVisited.has(m.place_id) ? new Date().toISOString() : null,
    }));
    return delay({ matches });
  },

  updateMatch(_code: string, placeId: string, updates: { visited?: boolean }): Promise<void> {
    if (updates.visited) {
      mockVisited.add(placeId);
    } else {
      mockVisited.delete(placeId);
    }
    return delay(undefined as unknown as void);
  },

  getTonightsPick(_code: string): Promise<{ match: Match }> {
    ensureSeedMatches();
    const unvisited = Array.from(mockMatches.values()).filter(
      (m) => !mockVisited.has(m.place_id),
    );
    if (unvisited.length > 0) {
      const pick = unvisited[Math.floor(Math.random() * unvisited.length)];
      return delay({ match: pick });
    }
    // Fallback to a random card if no unvisited matches
    const card = MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];
    return delay({ match: cardToMatch(card) });
  },
};

function delay<T>(value: T, ms = 300 + Math.random() * 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const MOCK_ENABLED =
  import.meta.env.VITE_MOCK_API === 'true' ||
  !import.meta.env.VITE_API_URL;
