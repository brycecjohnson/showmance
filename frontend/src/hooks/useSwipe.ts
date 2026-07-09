import { useCallback, useState } from 'react';
import { recordSwipe } from '../api/swipes';
import { useRoomContext } from '../context/RoomContext';
import type { SwipeDirection, SwipeResult } from '../types/swipe';
import type { RestaurantCard } from '../types/card';

export function useSwipe() {
  const { roomCode, partnerId } = useRoomContext();
  const [lastResult, setLastResult] = useState<SwipeResult | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const swipe = useCallback(
    async (card: RestaurantCard, direction: SwipeDirection): Promise<SwipeResult> => {
      if (!roomCode || !partnerId) {
        throw new Error('Not in a room');
      }
      setIsSwiping(true);
      try {
        const result = await recordSwipe({
          room_code: roomCode,
          partner_id: partnerId,
          place_id: card.place_id,
          direction,
          name: card.name,
          photo_url: card.photo_url ?? undefined,
          rating: card.rating,
          price_level: card.price_level ?? undefined,
          cuisines: card.cuisines,
          address: card.address,
          lat: card.lat,
          lng: card.lng,
          maps_url: card.maps_url,
        });
        setLastResult(result);
        return result;
      } finally {
        setIsSwiping(false);
      }
    },
    [roomCode, partnerId],
  );

  const clearResult = useCallback(() => setLastResult(null), []);

  return { swipe, lastResult, clearResult, isSwiping };
}
