import { useState, type FormEvent } from 'react';
import { RADIUS_OPTIONS } from '../../utils/constants';
import type { SetLocationParams } from '../../api/rooms';
import type { RoomLocation } from '../../types/room';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import './LocationSetup.css';

interface LocationSetupProps {
  /** Current values when editing from settings */
  initialLocation?: RoomLocation | null;
  initialRadiusM?: number;
  submitLabel?: string;
  onSubmit: (params: SetLocationParams) => Promise<void>;
}

type PendingLocation =
  | { kind: 'gps'; lat: number; lng: number; label: string }
  | { kind: 'address'; address: string };

export function LocationSetup({
  initialLocation = null,
  initialRadiusM = 8047,
  submitLabel = 'Continue',
  onSubmit,
}: LocationSetupProps) {
  const [pending, setPending] = useState<PendingLocation | null>(
    initialLocation
      ? { kind: 'gps', lat: initialLocation.lat, lng: initialLocation.lng, label: initialLocation.label }
      : null,
  );
  const [address, setAddress] = useState('');
  const [radiusM, setRadiusM] = useState(initialRadiusM);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser. Enter an address instead.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPending({
          kind: 'gps',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current location',
        });
        setAddress('');
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Enter an address instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    setPending({ kind: 'address', address: trimmed });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!pending) return;
    setSaving(true);
    setError(null);
    try {
      const params: SetLocationParams =
        pending.kind === 'gps'
          // Always pass the label through: for a fresh GPS pull it's
          // "Current location" anyway; for an unchanged (radius-only) edit
          // it preserves whatever label — GPS or geocoded address — the
          // room already had, instead of the backend defaulting to
          // "Current location" and clobbering a real address name.
          ? { lat: pending.lat, lng: pending.lng, label: pending.label, radius_m: radiusM }
          : { address: pending.address, radius_m: radiusM };
      await onSubmit(params);
    } catch {
      setError("Couldn't save your location. Try again.");
      setSaving(false);
    }
  };

  const pendingLabel =
    pending?.kind === 'gps' ? pending.label : pending?.kind === 'address' ? pending.address : null;

  return (
    <div className="location-setup">
      <h2 className="location-setup__title">Where Are You Eating?</h2>
      <p className="location-setup__subtitle">
        We'll find restaurants near this spot. Either partner can change it later.
      </p>

      <Button
        onClick={handleUseMyLocation}
        disabled={locating}
        fullWidth
        size="lg"
        variant={pending?.kind === 'gps' ? 'primary' : 'secondary'}
      >
        {locating ? (
          <Spinner size="sm" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Use My Location
          </>
        )}
      </Button>

      <div className="location-setup__divider">
        <span>or</span>
      </div>

      <form className="location-setup__address-form" onSubmit={handleAddressSubmit}>
        <input
          className="location-setup__input"
          type="text"
          placeholder="Enter an address or neighborhood"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
        />
        <Button type="submit" variant="secondary" disabled={!address.trim()}>
          Set
        </Button>
      </form>

      {pendingLabel && (
        <div className="location-setup__chosen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{pendingLabel}</span>
        </div>
      )}

      {error && <p className="location-setup__error">{error}</p>}

      <div className="location-setup__radius">
        <p className="location-setup__radius-label">Search radius</p>
        <div className="location-setup__radius-pills">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.miles}
              type="button"
              className={`location-setup__pill ${radiusM === option.meters ? 'location-setup__pill--active' : ''}`}
              onClick={() => setRadiusM(option.meters)}
            >
              {option.miles} mi
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!pending || saving}
        fullWidth
        size="lg"
      >
        {saving ? <Spinner size="sm" /> : submitLabel}
      </Button>
    </div>
  );
}
