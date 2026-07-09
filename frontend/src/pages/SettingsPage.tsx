import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import { LocationSetup } from '../components/onboarding/LocationSetup';
import { RoomSetup } from '../components/room/RoomSetup';
import { RoomCodeChip } from '../components/ui/RoomCodeChip';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { savePreferences } from '../api/rooms';
import type { SetLocationParams } from '../api/rooms';
import { setOnboardingComplete } from '../utils/storage';
import { metersToMiles } from '../utils/geo';
import { priceLabel } from '../utils/constants';
import './SettingsPage.css';

type Section = 'none' | 'location' | 'budget';

export function SettingsPage() {
  const navigate = useNavigate();
  const { roomCode, room, updateLocation, leaveRoom, loadRoom } = useRoomContext();
  const { toast, showToast, clearToast } = useToast();
  const [openSection, setOpenSection] = useState<Section>('none');
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const handleLocationSubmit = async (params: SetLocationParams) => {
    await updateLocation(params);
    setOpenSection('none');
    showToast('Location updated', 'success');
  };

  const handleBudgetSave = async (priceLevels: number[]) => {
    if (!roomCode) return;
    try {
      await savePreferences(roomCode, { price_levels: priceLevels });
      await loadRoom();
      setOpenSection('none');
      showToast('Budget updated', 'success');
    } catch {
      showToast('Could not save budget. Try again.');
    }
  };

  const handleRedoTastes = () => {
    setOnboardingComplete(false);
    navigate('/onboarding', { state: { step: 'cuisines' } });
  };

  const handleLeave = () => {
    if (!confirmingLeave) {
      setConfirmingLeave(true);
      return;
    }
    leaveRoom();
    navigate('/');
  };

  const radiusMiles = room ? Math.round(metersToMiles(room.radius_m)) : null;

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <RoomCodeChip />
      </header>

      <div className="settings-page__sections">
        <section className="settings-section">
          <div className="settings-section__row">
            <div>
              <h2 className="settings-section__title">Location</h2>
              <p className="settings-section__value">
                {room?.location
                  ? `${room.location.label} · ${radiusMiles} mi radius`
                  : 'Not set'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setOpenSection(openSection === 'location' ? 'none' : 'location')
              }
            >
              {openSection === 'location' ? 'Close' : 'Change'}
            </Button>
          </div>
          {openSection === 'location' && (
            <div className="settings-section__body">
              <LocationSetup
                initialLocation={room?.location}
                initialRadiusM={room?.radius_m}
                submitLabel="Save Location"
                onSubmit={handleLocationSubmit}
              />
            </div>
          )}
        </section>

        <section className="settings-section">
          <div className="settings-section__row">
            <div>
              <h2 className="settings-section__title">Budget</h2>
              <p className="settings-section__value">
                {room?.price_levels?.length
                  ? room.price_levels.map(priceLabel).join(' · ')
                  : 'Any price'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setOpenSection(openSection === 'budget' ? 'none' : 'budget')
              }
            >
              {openSection === 'budget' ? 'Close' : 'Change'}
            </Button>
          </div>
          {openSection === 'budget' && (
            <div className="settings-section__body">
              <RoomSetup
                initial={room?.price_levels ?? []}
                submitLabel="Save Budget"
                onComplete={handleBudgetSave}
              />
            </div>
          )}
        </section>

        <section className="settings-section">
          <div className="settings-section__row">
            <div>
              <h2 className="settings-section__title">Tastes</h2>
              <p className="settings-section__value">Redo the cuisine swipe round</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRedoTastes}>
              Redo
            </Button>
          </div>
        </section>

        <section className="settings-section settings-section--danger">
          <div className="settings-section__row">
            <div>
              <h2 className="settings-section__title">Leave Room</h2>
              <p className="settings-section__value">
                Clears this device's session. Your partner keeps the room.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLeave}>
              {confirmingLeave ? 'Tap to confirm' : 'Leave'}
            </Button>
          </div>
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
