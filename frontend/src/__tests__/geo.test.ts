import { haversineMiles, metersToMiles } from '../utils/geo';

describe('haversineMiles', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 30.2672, lng: -97.7431 };
    expect(haversineMiles(p, p)).toBe(0);
  });

  it('computes a known distance (Austin downtown → Austin airport ≈ 7.5 mi)', () => {
    const downtown = { lat: 30.2672, lng: -97.7431 };
    const airport = { lat: 30.1975, lng: -97.6664 };
    const miles = haversineMiles(downtown, airport);
    expect(miles).toBeGreaterThan(6.5);
    expect(miles).toBeLessThan(8.5);
  });

  it('is symmetric', () => {
    const a = { lat: 30.2672, lng: -97.7431 };
    const b = { lat: 30.39, lng: -97.7269 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 10);
  });
});

describe('metersToMiles', () => {
  it('converts a mile of meters', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1, 5);
  });
});
