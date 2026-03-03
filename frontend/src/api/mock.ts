/**
 * Mock API responses for local development without a backend.
 * Enabled when VITE_MOCK_API=true or when the real API is unreachable.
 */

import type { Card } from '../types/card';
import type { Match } from '../types/match';
import type { Room } from '../types/room';
import type { SwipeResult } from '../types/swipe';

function uuid(): string {
  return crypto.randomUUID();
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SHOW-${code}`;
}

const MOCK_CARDS: Card[] = [
  { tmdb_id: 1396, media_type: 'tv', title: 'Breaking Bad', poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg', backdrop_path: null, overview: 'A chemistry teacher diagnosed with terminal cancer teams up with a former student to manufacture crystal meth.', release_year: 2008, rating: 8.9, genre_ids: [18, 80], genre_names: ['Drama', 'Crime'], seasons_count: 5, episodes_count: 62, cast: [{ name: 'Bryan Cranston', character: 'Walter White', profile_path: null }, { name: 'Aaron Paul', character: 'Jesse Pinkman', profile_path: null }, { name: 'Anna Gunn', character: 'Skyler White', profile_path: null }, { name: 'Dean Norris', character: 'Hank Schrader', profile_path: null }, { name: 'Betsy Brandt', character: 'Marie Schrader', profile_path: null }] },
  { tmdb_id: 550, media_type: 'movie', title: 'Fight Club', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', backdrop_path: null, overview: 'An insomniac office worker and a soap salesman build a global organization to help vent male aggression.', release_year: 1999, rating: 8.4, genre_ids: [18], genre_names: ['Drama'], runtime: 139, director: 'David Fincher', cast: [{ name: 'Brad Pitt', character: 'Tyler Durden', profile_path: null }, { name: 'Edward Norton', character: 'The Narrator', profile_path: null }, { name: 'Helena Bonham Carter', character: 'Marla Singer', profile_path: null }, { name: 'Meat Loaf', character: 'Robert Paulson', profile_path: null }, { name: 'Jared Leto', character: 'Angel Face', profile_path: null }] },
  { tmdb_id: 157336, media_type: 'movie', title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: null, overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', release_year: 2014, rating: 8.4, genre_ids: [12, 18, 878], genre_names: ['Adventure', 'Drama', 'Sci-Fi'], runtime: 169, director: 'Christopher Nolan', cast: [{ name: 'Matthew McConaughey', character: 'Cooper', profile_path: null }, { name: 'Anne Hathaway', character: 'Brand', profile_path: null }, { name: 'Jessica Chastain', character: 'Murph', profile_path: null }, { name: 'Michael Caine', character: 'Professor Brand', profile_path: null }, { name: 'Matt Damon', character: 'Dr. Mann', profile_path: null }] },
  { tmdb_id: 66732, media_type: 'tv', title: 'Stranger Things', poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', backdrop_path: null, overview: 'When a young boy disappears, his mother and friends must confront terrifying supernatural forces.', release_year: 2016, rating: 8.6, genre_ids: [18, 9648, 10765], genre_names: ['Drama', 'Mystery', 'Sci-Fi'], seasons_count: 4, episodes_count: 34, cast: [{ name: 'Millie Bobby Brown', character: 'Eleven', profile_path: null }, { name: 'Finn Wolfhard', character: 'Mike Wheeler', profile_path: null }, { name: 'Winona Ryder', character: 'Joyce Byers', profile_path: null }, { name: 'David Harbour', character: 'Jim Hopper', profile_path: null }, { name: 'Gaten Matarazzo', character: 'Dustin Henderson', profile_path: null }] },
  { tmdb_id: 27205, media_type: 'movie', title: 'Inception', poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdrop_path: null, overview: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.', release_year: 2010, rating: 8.4, genre_ids: [28, 878, 12], genre_names: ['Action', 'Sci-Fi', 'Adventure'], runtime: 148, director: 'Christopher Nolan', cast: [{ name: 'Leonardo DiCaprio', character: 'Cobb', profile_path: null }, { name: 'Joseph Gordon-Levitt', character: 'Arthur', profile_path: null }, { name: 'Elliot Page', character: 'Ariadne', profile_path: null }, { name: 'Tom Hardy', character: 'Eames', profile_path: null }, { name: 'Marion Cotillard', character: 'Mal', profile_path: null }] },
  { tmdb_id: 76479, media_type: 'tv', title: 'The Boys', poster_path: '/stTEycfG9Oa3cnyMUQz5w4g6OLg.jpg', backdrop_path: null, overview: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.', release_year: 2019, rating: 8.5, genre_ids: [10765, 28], genre_names: ['Sci-Fi', 'Action'], seasons_count: 4, episodes_count: 32, cast: [{ name: 'Karl Urban', character: 'Billy Butcher', profile_path: null }, { name: 'Jack Quaid', character: 'Hughie Campbell', profile_path: null }, { name: 'Antony Starr', character: 'Homelander', profile_path: null }, { name: 'Erin Moriarty', character: 'Starlight', profile_path: null }, { name: 'Karen Fukuhara', character: 'Kimiko', profile_path: null }] },
  { tmdb_id: 680, media_type: 'movie', title: 'Pulp Fiction', poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', backdrop_path: null, overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', release_year: 1994, rating: 8.5, genre_ids: [80, 53], genre_names: ['Crime', 'Thriller'], runtime: 154, director: 'Quentin Tarantino', cast: [{ name: 'John Travolta', character: 'Vincent Vega', profile_path: null }, { name: 'Samuel L. Jackson', character: 'Jules Winnfield', profile_path: null }, { name: 'Uma Thurman', character: 'Mia Wallace', profile_path: null }, { name: 'Bruce Willis', character: 'Butch Coolidge', profile_path: null }, { name: 'Tim Roth', character: 'Pumpkin', profile_path: null }] },
  { tmdb_id: 94997, media_type: 'tv', title: 'House of the Dragon', poster_path: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg', backdrop_path: null, overview: 'The story of the Targaryen civil war that took place about 200 years before the events of Game of Thrones.', release_year: 2022, rating: 8.4, genre_ids: [10765, 18, 10759], genre_names: ['Sci-Fi', 'Drama', 'Action'], seasons_count: 2, episodes_count: 18, cast: [{ name: 'Matt Smith', character: 'Daemon Targaryen', profile_path: null }, { name: 'Emma D\'Arcy', character: 'Rhaenyra Targaryen', profile_path: null }, { name: 'Olivia Cooke', character: 'Alicent Hightower', profile_path: null }, { name: 'Paddy Considine', character: 'Viserys I', profile_path: null }, { name: 'Rhys Ifans', character: 'Otto Hightower', profile_path: null }] },
  { tmdb_id: 238, media_type: 'movie', title: 'The Godfather', poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', backdrop_path: null, overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', release_year: 1972, rating: 8.7, genre_ids: [18, 80], genre_names: ['Drama', 'Crime'], runtime: 175, director: 'Francis Ford Coppola', cast: [{ name: 'Marlon Brando', character: 'Don Vito Corleone', profile_path: null }, { name: 'Al Pacino', character: 'Michael Corleone', profile_path: null }, { name: 'James Caan', character: 'Sonny Corleone', profile_path: null }, { name: 'Robert Duvall', character: 'Tom Hagen', profile_path: null }, { name: 'Diane Keaton', character: 'Kay Adams', profile_path: null }] },
  { tmdb_id: 100088, media_type: 'tv', title: 'The Last of Us', poster_path: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', backdrop_path: null, overview: 'Joel and Ellie must survive in a post-apocalyptic world ravaged by a fungal infection.', release_year: 2023, rating: 8.8, genre_ids: [18, 10759], genre_names: ['Drama', 'Action'], seasons_count: 2, episodes_count: 16, cast: [{ name: 'Pedro Pascal', character: 'Joel Miller', profile_path: null }, { name: 'Bella Ramsey', character: 'Ellie Williams', profile_path: null }, { name: 'Gabriel Luna', character: 'Tommy Miller', profile_path: null }, { name: 'Anna Torv', character: 'Tess', profile_path: null }, { name: 'Nick Offerman', character: 'Bill', profile_path: null }] },
  { tmdb_id: 569094, media_type: 'movie', title: 'Spider-Man: Across the Spider-Verse', poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdrop_path: null, overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.', release_year: 2023, rating: 8.4, genre_ids: [16, 28, 12], genre_names: ['Animation', 'Action', 'Adventure'], runtime: 140, director: 'Joaquim Dos Santos', cast: [{ name: 'Shameik Moore', character: 'Miles Morales', profile_path: null }, { name: 'Hailee Steinfeld', character: 'Gwen Stacy', profile_path: null }, { name: 'Oscar Isaac', character: 'Miguel O\'Hara', profile_path: null }, { name: 'Jake Johnson', character: 'Peter B. Parker', profile_path: null }, { name: 'Issa Rae', character: 'Jessica Drew', profile_path: null }] },
  { tmdb_id: 136315, media_type: 'tv', title: 'The Bear', poster_path: '/sHFlhKBlFnlFwFBqfiouxnQYMdL.jpg', backdrop_path: null, overview: 'A young chef from the fine dining world returns to Chicago to run his family\'s sandwich shop.', release_year: 2022, rating: 8.6, genre_ids: [18, 35], genre_names: ['Drama', 'Comedy'], seasons_count: 3, episodes_count: 28, cast: [{ name: 'Jeremy Allen White', character: 'Carmen Berzatto', profile_path: null }, { name: 'Ebon Moss-Bachrach', character: 'Richie Jerimovich', profile_path: null }, { name: 'Ayo Edebiri', character: 'Sydney Adamu', profile_path: null }, { name: 'Lionel Boyce', character: 'Marcus', profile_path: null }, { name: 'Liza Colon-Zayas', character: 'Tina', profile_path: null }] },
  { tmdb_id: 346698, media_type: 'movie', title: 'Barbie', poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', backdrop_path: null, overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.', release_year: 2023, rating: 7.1, genre_ids: [35, 12, 14], genre_names: ['Comedy', 'Adventure', 'Fantasy'], runtime: 114, director: 'Greta Gerwig', cast: [{ name: 'Margot Robbie', character: 'Barbie', profile_path: null }, { name: 'Ryan Gosling', character: 'Ken', profile_path: null }, { name: 'America Ferrera', character: 'Gloria', profile_path: null }, { name: 'Will Ferrell', character: 'CEO', profile_path: null }, { name: 'Kate McKinnon', character: 'Weird Barbie', profile_path: null }] },
  { tmdb_id: 84773, media_type: 'tv', title: 'The Lord of the Rings: The Rings of Power', poster_path: '/NNC08YmJFFlLi1prBkK8quk3dp.jpg', backdrop_path: null, overview: 'Epic drama set thousands of years before the events of The Hobbit and The Lord of the Rings.', release_year: 2022, rating: 7.3, genre_ids: [10765, 18, 10759], genre_names: ['Sci-Fi', 'Drama', 'Action'], seasons_count: 2, episodes_count: 16, cast: [{ name: 'Morfydd Clark', character: 'Galadriel', profile_path: null }, { name: 'Robert Aramayo', character: 'Elrond', profile_path: null }, { name: 'Charlie Vickers', character: 'Halbrand', profile_path: null }, { name: 'Markella Kavenagh', character: 'Nori Brandyfoot', profile_path: null }, { name: 'Ismael Cruz Cordova', character: 'Arondir', profile_path: null }] },
  { tmdb_id: 278, media_type: 'movie', title: 'The Shawshank Redemption', poster_path: '/9cjIGRPQRsKnBExOkXJbGtVMlv6.jpg', backdrop_path: null, overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, Andy Dufresne begins to secretly plan his escape.', release_year: 1994, rating: 8.7, genre_ids: [18, 80], genre_names: ['Drama', 'Crime'], runtime: 142, director: 'Frank Darabont', cast: [{ name: 'Tim Robbins', character: 'Andy Dufresne', profile_path: null }, { name: 'Morgan Freeman', character: 'Ellis Redding', profile_path: null }, { name: 'Bob Gunton', character: 'Warden Norton', profile_path: null }, { name: 'William Sadler', character: 'Heywood', profile_path: null }, { name: 'Clancy Brown', character: 'Captain Hadley', profile_path: null }] },
  { tmdb_id: 572802, media_type: 'movie', title: 'Aquaman and the Lost Kingdom', poster_path: '/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg', backdrop_path: null, overview: 'Black Manta seeks revenge on Aquaman for his father\'s death.', release_year: 2023, rating: 6.3, genre_ids: [28, 12, 14], genre_names: ['Action', 'Adventure', 'Fantasy'], runtime: 124, director: 'James Wan', cast: [{ name: 'Jason Momoa', character: 'Arthur Curry', profile_path: null }, { name: 'Patrick Wilson', character: 'Orm Marius', profile_path: null }, { name: 'Yahya Abdul-Mateen II', character: 'Black Manta', profile_path: null }, { name: 'Amber Heard', character: 'Mera', profile_path: null }, { name: 'Nicole Kidman', character: 'Atlanna', profile_path: null }] },
  { tmdb_id: 93405, media_type: 'tv', title: 'Squid Game', poster_path: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', backdrop_path: null, overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games for a prize.', release_year: 2021, rating: 8.0, genre_ids: [10759, 9648, 18], genre_names: ['Action', 'Mystery', 'Drama'], seasons_count: 2, episodes_count: 16, cast: [{ name: 'Lee Jung-jae', character: 'Seong Gi-hun', profile_path: null }, { name: 'Park Hae-soo', character: 'Cho Sang-woo', profile_path: null }, { name: 'Wi Ha-joon', character: 'Hwang Jun-ho', profile_path: null }, { name: 'Jung Ho-yeon', character: 'Kang Sae-byeok', profile_path: null }, { name: 'O Yeong-su', character: 'Oh Il-nam', profile_path: null }] },
  { tmdb_id: 324857, media_type: 'movie', title: 'Spider-Man: Into the Spider-Verse', poster_path: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', backdrop_path: null, overview: 'Miles Morales becomes the Spider-Man of his reality and crosses paths with counterparts from other dimensions.', release_year: 2018, rating: 8.4, genre_ids: [16, 28, 12], genre_names: ['Animation', 'Action', 'Adventure'], runtime: 117, director: 'Bob Persichetti', cast: [{ name: 'Shameik Moore', character: 'Miles Morales', profile_path: null }, { name: 'Jake Johnson', character: 'Peter B. Parker', profile_path: null }, { name: 'Hailee Steinfeld', character: 'Gwen Stacy', profile_path: null }, { name: 'Mahershala Ali', character: 'Aaron Davis', profile_path: null }, { name: 'Nicolas Cage', character: 'Spider-Man Noir', profile_path: null }] },
  { tmdb_id: 71912, media_type: 'tv', title: 'The Witcher', poster_path: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg', backdrop_path: null, overview: 'Geralt of Rivia, a mutated monster-hunter for hire, journeys toward his destiny.', release_year: 2019, rating: 8.0, genre_ids: [10765, 18, 10759], genre_names: ['Sci-Fi', 'Drama', 'Action'], seasons_count: 3, episodes_count: 24, cast: [{ name: 'Henry Cavill', character: 'Geralt of Rivia', profile_path: null }, { name: 'Anya Chalotra', character: 'Yennefer', profile_path: null }, { name: 'Freya Allan', character: 'Ciri', profile_path: null }, { name: 'Joey Batey', character: 'Jaskier', profile_path: null }, { name: 'MyAnna Buring', character: 'Tissaia', profile_path: null }] },
  { tmdb_id: 603, media_type: 'movie', title: 'The Matrix', poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', backdrop_path: null, overview: 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.', release_year: 1999, rating: 8.2, genre_ids: [28, 878], genre_names: ['Action', 'Sci-Fi'], runtime: 136, director: 'Lana Wachowski', cast: [{ name: 'Keanu Reeves', character: 'Thomas A. Anderson / Neo', profile_path: null }, { name: 'Laurence Fishburne', character: 'Morpheus', profile_path: null }, { name: 'Carrie-Anne Moss', character: 'Trinity', profile_path: null }, { name: 'Hugo Weaving', character: 'Agent Smith', profile_path: null }, { name: 'Joe Pantoliano', character: 'Cypher', profile_path: null }] },
];

// Track room solo state
let mockIsSolo = false;

// Track swipes and matches in memory for mock simulation
const swipedRight = new Set<number>();
const mockSwiped = new Set<string>(); // tracks "${media_type}:${tmdb_id}" to filter from getCards
const mockMatches = new Map<number, Match>();
const mockWatched = new Set<number>();

const MOCK_SERVICES = ['netflix', 'hulu', 'disney_plus', 'hbo_max', 'amazon_prime'];

function cardToMatch(card: Card): Match {
  return {
    tmdb_id: card.tmdb_id,
    title: card.title,
    poster_path: card.poster_path,
    media_type: card.media_type as Match['media_type'],
    matched_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    watched: mockWatched.has(card.tmdb_id),
    watched_at: mockWatched.has(card.tmdb_id) ? new Date().toISOString() : null,
    rating: card.rating,
    release_year: card.release_year,
    genre_names: card.genre_names,
    streaming_services: [MOCK_SERVICES[Math.floor(Math.random() * MOCK_SERVICES.length)]],
  };
}

// Seed some initial matches so the list isn't empty (only for the requested mode)
function ensureSeedMatches(mode: string) {
  const hasMatchesForMode = Array.from(mockMatches.values()).some((m) => m.media_type === mode);
  if (hasMatchesForMode) return;
  const seedCards = MOCK_CARDS.filter((c) => c.media_type === mode).slice(0, 4);
  seedCards.forEach((card) => {
    mockMatches.set(card.tmdb_id, cardToMatch(card));
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
      streaming_services: ['netflix', 'hulu'],
      onboarding_complete: false,
      is_solo: mockIsSolo,
    });
  },

  savePreferences(): Promise<void> {
    return delay(undefined as unknown as void);
  },

  getCards(_code: string, mode: string): Promise<{ cards: Card[]; has_more: boolean }> {
    const filtered = MOCK_CARDS.filter(
      (c) => c.media_type === mode && !mockSwiped.has(`${c.media_type}:${c.tmdb_id}`),
    );
    // Shuffle
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return delay({ cards: shuffled, has_more: shuffled.length > 0 });
  },

  recordSwipe(payload: {
    tmdb_id: number;
    direction: string;
    media_type?: string;
    room_code?: string;
    partner_id?: string;
    title?: string;
  }): Promise<SwipeResult> {
    const mediaType = payload.media_type ?? MOCK_CARDS.find((c) => c.tmdb_id === payload.tmdb_id)?.media_type ?? 'movie';
    mockSwiped.add(`${mediaType}:${payload.tmdb_id}`);

    if (payload.direction === 'right') {
      // Solo mode: always match. Couples: 30% chance of match for fun
      const matched = mockIsSolo || Math.random() < 0.3;
      swipedRight.add(payload.tmdb_id);
      const card = MOCK_CARDS.find((c) => c.tmdb_id === payload.tmdb_id);
      if (matched && card) {
        const match = cardToMatch(card);
        match.matched_at = new Date().toISOString();
        mockMatches.set(card.tmdb_id, match);
        return delay({
          matched: true,
          match: {
            tmdb_id: card.tmdb_id,
            title: card.title,
            poster_path: card.poster_path,
            media_type: card.media_type,
          },
        });
      }
    }
    return delay({ matched: false });
  },

  getMatches(_code: string, mode: string): Promise<{ matches: Match[] }> {
    ensureSeedMatches(mode);
    const matches = Array.from(mockMatches.values())
      .filter((m) => m.media_type === mode)
      .map((m) => ({
        ...m,
        watched: mockWatched.has(m.tmdb_id),
        watched_at: mockWatched.has(m.tmdb_id) ? new Date().toISOString() : null,
      }));
    return delay({ matches });
  },

  updateMatch(_code: string, tmdbId: number, updates: { watched?: boolean }): Promise<void> {
    if (updates.watched) {
      mockWatched.add(tmdbId);
    } else {
      mockWatched.delete(tmdbId);
    }
    return delay(undefined as unknown as void);
  },

  getTonightsPick(_code: string, mode: string): Promise<{ match: Match }> {
    ensureSeedMatches(mode);
    const unwatched = Array.from(mockMatches.values())
      .filter((m) => m.media_type === mode && !mockWatched.has(m.tmdb_id));
    if (unwatched.length > 0) {
      const pick = unwatched[Math.floor(Math.random() * unwatched.length)];
      return delay({ match: pick });
    }
    // Fallback to a random card if no unwatched matches
    const card = MOCK_CARDS.filter((c) => c.media_type === mode)[
      Math.floor(Math.random() * MOCK_CARDS.filter((c) => c.media_type === mode).length)
    ];
    return delay({ match: cardToMatch(card) });
  },
};

function delay<T>(value: T, ms = 300 + Math.random() * 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const MOCK_ENABLED =
  import.meta.env.VITE_MOCK_API === 'true' ||
  !import.meta.env.VITE_API_URL;
